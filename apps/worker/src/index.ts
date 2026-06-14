import { Hono } from "hono";
import type { AppVariables, Env, SessionUser } from "./env";
import { parseRepoConfig } from "./config";
import {
  sha256,
  signPayload,
  verifyGitHubWebhook,
  verifyPayload,
} from "./crypto";
import {
  createVerification,
  getGateById,
  getGateByIdentity,
  getVerification,
  isoInDays,
  markGateVerified,
  setGateCheckRunId,
  setGateCommentId,
  setGateError,
  upsertGate,
} from "./db";
import {
  approveWorkflowRunsForSha,
  createCheckRun,
  createOrUpdateGateComment,
  getInstallationToken,
  getPullRequest,
  getRepositoryFile,
  rerunFailedWorkflowRunsForSha,
  updateCheckRun,
} from "./github";
import {
  getSession,
  handleGitHubOAuthCallback,
  startGitHubOAuth,
} from "./oauth";
import { renderGatePage, renderHome, renderMessagePage } from "./render";
import { verifyTurnstile } from "./turnstile";
import type {
  CiCaptchaConfig,
  GateRecord,
  GateTokenPayload,
  PullRequestWebhook,
} from "./types";
import { shouldGatePullRequest } from "./config";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.get("/", (c) => c.html(renderHome()));

app.get("/favicon.ico", (c) => c.body(null, 204));

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "ci-captcha",
  }),
);

app.get("/auth/github/start", startGitHubOAuth);
app.get("/auth/github/callback", handleGitHubOAuthCallback);

app.post("/webhooks/github", async (c) => {
  const body = await c.req.text();
  const valid = await verifyGitHubWebhook(
    body,
    c.req.header("x-hub-signature-256") ?? null,
    c.env.GITHUB_WEBHOOK_SECRET,
  );
  if (!valid) {
    return c.text("Invalid signature", 401);
  }

  const event = c.req.header("x-github-event");
  if (event === "ping") {
    return c.json({ ok: true });
  }
  if (event !== "pull_request") {
    return c.json({ ok: true, ignored: event });
  }

  const payload = JSON.parse(body) as PullRequestWebhook;
  if (!shouldProcessPullRequestAction(payload.action)) {
    return c.json({ ok: true, ignored: payload.action });
  }

  const result = await processPullRequestWebhook(c.env, payload);
  return c.json(result);
});

app.get("/gate/:id", async (c) => {
  const gate = await getGateById(c.env.DB, c.req.param("id"));
  const token = c.req.query("token") ?? "";
  const tokenPayload = gate ? await verifyGateToken(c.env, gate, token) : null;
  if (!gate || !tokenPayload) {
    return c.html(
      renderMessagePage(
        "Invalid verification link",
        "This ci-captcha link is invalid or expired.",
        "error",
      ),
      400,
    );
  }

  const session = await getSession(c);
  if (!session) {
    return c.redirect(
      `/auth/github/start?return_to=${encodeURIComponent(c.req.url)}`,
      302,
    );
  }

  const verification = await getVerification(
    c.env.DB,
    gate.owner,
    gate.repo,
    gate.pr_number,
    gate.head_sha,
  );
  return c.html(
    renderGatePage({
      gate,
      token,
      session,
      turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
      verified: Boolean(verification),
    }),
  );
});

app.post("/gate/:id", async (c) => {
  const gate = await getGateById(c.env.DB, c.req.param("id"));
  const form = await c.req.parseBody();
  const token = asString(form.token);
  const tokenPayload = gate ? await verifyGateToken(c.env, gate, token) : null;
  if (!gate || !tokenPayload) {
    return c.html(
      renderMessagePage(
        "Invalid verification link",
        "This ci-captcha link is invalid or expired.",
        "error",
      ),
      400,
    );
  }

  const session = await getSession(c);
  if (!session) {
    return c.redirect(
      `/auth/github/start?return_to=${encodeURIComponent(`${c.env.APP_BASE_URL}/gate/${gate.id}?token=${token}`)}`,
      302,
    );
  }

  const turnstileToken = asString(form["cf-turnstile-response"]);
  if (!turnstileToken) {
    return c.html(
      renderGatePage({
        gate,
        token,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error: "Complete the CAPTCHA before approving CI.",
      }),
      400,
    );
  }

  const installationToken = await getInstallationToken(
    c.env,
    gate.installation_id,
  );
  const pullRequest = await getPullRequest(
    installationToken,
    gate.owner,
    gate.repo,
    gate.pr_number,
  );
  const config = await loadConfig(
    installationToken,
    gate.owner,
    gate.repo,
    pullRequest.base.ref,
  );

  if (
    config.require.solver_must_be_pr_author &&
    session.login !== gate.pr_author
  ) {
    return c.html(
      renderGatePage({
        gate,
        token,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error: `This gate must be solved by ${gate.pr_author}. You are logged in as ${session.login}.`,
      }),
      403,
    );
  }

  if (pullRequest.head.sha !== gate.head_sha) {
    return c.html(
      renderGatePage({
        gate,
        token,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error:
          "This pull request has a newer commit. Use the newest ci-captcha link on the PR.",
      }),
      409,
    );
  }

  const captchaOk = await verifyTurnstile(
    c.env,
    turnstileToken,
    c.req.header("cf-connecting-ip") ?? null,
  );
  if (!captchaOk) {
    return c.html(
      renderGatePage({
        gate,
        token,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error: "CAPTCHA verification failed. Try again.",
      }),
      400,
    );
  }

  await createVerification(c.env.DB, {
    gate,
    solverLogin: session.login,
    captchaProvider: "cloudflare_turnstile",
  });
  await markGateVerified(c.env.DB, gate.id);

  let approvedRuns = 0;
  let rerunWorkflows = 0;
  try {
    await publishVerifiedCheck(installationToken, gate, config);
    approvedRuns = await approveWorkflowRunsForSha(
      installationToken,
      gate.owner,
      gate.repo,
      gate.head_sha,
    );
    if (config.universal_gate.rerun_after_verification) {
      rerunWorkflows = await rerunFailedWorkflowRunsForSha(
        installationToken,
        gate.owner,
        gate.repo,
        gate.head_sha,
      );
    }
    if (config.comment.enabled) {
      const commentId = await createOrUpdateGateComment(installationToken, {
        owner: gate.owner,
        repo: gate.repo,
        prNumber: gate.pr_number,
        marker: commentMarker(gate.owner, gate.repo, gate.pr_number),
        body: passedComment(gate, session),
      });
      await setGateCommentId(c.env.DB, gate.id, commentId);
    }
  } catch (error) {
    await setGateError(
      c.env.DB,
      gate.id,
      error instanceof Error ? error.message : "Unknown approval error",
    );
    throw error;
  }

  return c.html(
    renderMessagePage(
      "Human check passed",
      `CI has been released for commit ${gate.head_sha.slice(0, 7)}. Approved runs: ${approvedRuns}. Rerun workflows: ${rerunWorkflows}.`,
    ),
  );
});

app.get("/api/v1/verifications/status", async (c) => {
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const prNumber = Number(c.req.query("pr"));
  const sha = c.req.query("sha");
  if (!owner || !repo || !Number.isInteger(prNumber) || !sha) {
    return c.json(
      { verified: false, error: "owner, repo, pr, and sha are required" },
      400,
    );
  }

  const verification = await getVerification(
    c.env.DB,
    owner,
    repo,
    prNumber,
    sha,
  );
  if (verification) {
    return c.json({
      verified: true,
      solver_login: verification.solver_login,
      captcha_passed_at: verification.captcha_passed_at,
    });
  }

  const gate = await getGateByIdentity(c.env.DB, owner, repo, prNumber, sha);
  return c.json({
    verified: false,
    verification_url: gate?.gate_url ?? null,
  });
});

async function processPullRequestWebhook(
  env: Env,
  payload: PullRequestWebhook,
): Promise<Record<string, unknown>> {
  const installationId = payload.installation?.id;
  if (!installationId) {
    return { ok: false, error: "Missing installation id" };
  }

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const pr = payload.pull_request;
  const installationToken = await getInstallationToken(env, installationId);
  const config = await loadConfig(installationToken, owner, repo, pr.base.ref);
  const decision = shouldGatePullRequest(pr, config);
  if (!decision.gate) {
    return { ok: true, gated: false };
  }

  const existingGate = await getGateByIdentity(
    env.DB,
    owner,
    repo,
    pr.number,
    pr.head.sha,
  );
  const existingVerification = await getVerification(
    env.DB,
    owner,
    repo,
    pr.number,
    pr.head.sha,
  );
  const gateId = existingGate?.id ?? crypto.randomUUID();
  const expiresAt = isoInDays(30);
  const token = await signPayload(
    {
      gate_id: gateId,
      owner,
      repo,
      pr_number: pr.number,
      head_sha: pr.head.sha,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    } satisfies GateTokenPayload,
    env.SESSION_SECRET,
  );
  const gateUrl = `${env.APP_BASE_URL}/gate/${gateId}?token=${encodeURIComponent(token)}`;
  const gate = await upsertGate(env.DB, {
    id: gateId,
    installationId: String(installationId),
    owner,
    repo,
    prNumber: pr.number,
    headSha: pr.head.sha,
    prAuthor: pr.user.login,
    status: existingVerification ? "verified" : "pending",
    gateUrl,
    gateTokenHash: await sha256(token),
    expiresAt,
  });

  if (config.checks.create_required_check) {
    const checkRunId = await publishPendingCheck(
      installationToken,
      gate,
      config,
      decision.reasons,
    );
    await setGateCheckRunId(env.DB, gate.id, checkRunId);
  }

  if (config.comment.enabled) {
    const body = existingVerification
      ? passedComment(gate, { login: existingVerification.solver_login })
      : pendingComment(gate, decision.reasons);
    const commentId = await createOrUpdateGateComment(installationToken, {
      owner,
      repo,
      prNumber: pr.number,
      marker: commentMarker(owner, repo, pr.number),
      body,
    });
    await setGateCommentId(env.DB, gate.id, commentId);
  }

  return {
    ok: true,
    gated: true,
    reasons: decision.reasons,
    gate_id: gate.id,
  };
}

async function loadConfig(
  token: string,
  owner: string,
  repo: string,
  ref: string,
): Promise<CiCaptchaConfig> {
  const raw = await getRepositoryFile(
    token,
    owner,
    repo,
    ".github/ci-captcha.yml",
    ref,
  );
  return parseRepoConfig(raw);
}

async function publishPendingCheck(
  token: string,
  gate: GateRecord,
  config: CiCaptchaConfig,
  reasons: string[],
): Promise<number> {
  const summary = `ci-captcha is waiting for a human check before CI starts. Reason: ${reasons.join(", ")}.`;
  if (gate.check_run_id) {
    await updateCheckRun(token, {
      owner: gate.owner,
      repo: gate.repo,
      checkRunId: gate.check_run_id,
      detailsUrl: gate.gate_url,
      title: "Human check required",
      summary,
      conclusion: "action_required",
    });
    return gate.check_run_id;
  }
  return createCheckRun(token, {
    owner: gate.owner,
    repo: gate.repo,
    name: config.checks.name,
    headSha: gate.head_sha,
    detailsUrl: gate.gate_url,
    title: "Human check required",
    summary,
    conclusion: "action_required",
  });
}

async function publishVerifiedCheck(
  token: string,
  gate: GateRecord,
  config: CiCaptchaConfig,
): Promise<void> {
  if (!config.checks.create_required_check || !gate.check_run_id) {
    return;
  }
  await updateCheckRun(token, {
    owner: gate.owner,
    repo: gate.repo,
    checkRunId: gate.check_run_id,
    detailsUrl: gate.gate_url,
    title: "Human check passed",
    summary: `ci-captcha verified a GitHub-authenticated human for commit ${gate.head_sha.slice(0, 7)}.`,
    conclusion: "success",
  });
}

async function verifyGateToken(
  env: Env,
  gate: GateRecord,
  token: string,
): Promise<GateTokenPayload | null> {
  if (!token) {
    return null;
  }
  const payload = await verifyPayload<GateTokenPayload>(
    token,
    env.SESSION_SECRET,
  );
  if (!payload) {
    return null;
  }
  if (
    payload.gate_id !== gate.id ||
    payload.owner !== gate.owner ||
    payload.repo !== gate.repo ||
    payload.pr_number !== gate.pr_number ||
    payload.head_sha !== gate.head_sha
  ) {
    return null;
  }
  if ((await sha256(token)) !== gate.gate_token_hash) {
    return null;
  }
  return payload;
}

function shouldProcessPullRequestAction(action: string): boolean {
  return [
    "opened",
    "reopened",
    "synchronize",
    "ready_for_review",
    "labeled",
    "unlabeled",
  ].includes(action);
}

function pendingComment(gate: GateRecord, reasons: string[]): string {
  const shortSha = gate.head_sha.slice(0, 7);
  return `${commentMarker(gate.owner, gate.repo, gate.pr_number)}
## Human check required before CI starts

This repository uses ci-captcha to protect maintainer time and CI minutes.

Please complete a quick browser verification before GitHub Actions runs.

[Run CI after human check](${gate.gate_url})

This verification is bound to:
- PR: #${gate.pr_number}
- Commit: \`${shortSha}\`
- Author: \`${gate.pr_author}\`
- Reason: ${reasons.join(", ")}

Pushing a new commit will require a new check.`;
}

function passedComment(
  gate: GateRecord,
  solver: Pick<SessionUser, "login">,
): string {
  return `${commentMarker(gate.owner, gate.repo, gate.pr_number)}
## Human check passed

CI has been released for commit \`${gate.head_sha.slice(0, 7)}\`.

Verified GitHub user: \`${solver.login}\`

If a new commit is pushed, ci-captcha will require verification again.`;
}

function commentMarker(owner: string, repo: string, prNumber: number): string {
  return `<!-- ci-captcha:${owner}/${repo}#${prNumber} -->`;
}

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
}

export default app;
