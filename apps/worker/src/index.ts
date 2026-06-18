import { Hono } from "hono";
import {
  appBaseUrl,
  appUrl,
  type AppVariables,
  type Env,
  type SessionUser,
} from "./env";
import {
  inspectRepoConfig,
  parseRepoConfig,
  shouldGatePullRequest,
} from "./config";
import {
  sha256,
  signPayload,
  verifyGitHubWebhook,
  verifyPayload,
} from "./crypto";
import {
  claimWebhookDelivery,
  clearGateError,
  cleanupExpiredRows,
  completeWebhookDelivery,
  consumeGateNonce,
  createAuditLog,
  createVerification,
  getGateById,
  getGateByIdentity,
  getVerification,
  hitRateLimit,
  isoInDays,
  listAuditLogs,
  markGateSkipped,
  markGateVerified,
  releaseWebhookDelivery,
  setGateCheckRunId,
  setGateCommentId,
  setGateError,
  upsertGate,
} from "./db";
import type { AuditLogInput, AuditLogRecord } from "./db";
import {
  approveWorkflowRunsForSha,
  createCheckRun,
  createOrUpdateGateComment,
  GitHubApiError,
  getInstallationToken,
  getPullRequest,
  getRepositoryFile,
  getRepositoryMetadata,
  rerunFailedWorkflowRunsForSha,
  updateIssueComment,
  updateCheckRun,
} from "./github";
import {
  getSession,
  handleGitHubOAuthCallback,
  startGitHubOAuth,
} from "./oauth";
import {
  renderBadgeBuilderPage,
  renderBadgeSvg,
  renderFaviconSvg,
  renderConfigPreviewPage,
  renderDemoPage,
  renderEvidenceScannerPage,
  renderForkPrRehearsalPage,
  renderGatePage,
  renderGateTracePage,
  renderGitHubAppManifestCallbackPage,
  renderGitHubAppManifestPage,
  renderHome,
  renderLaunchPage,
  renderMessagePage,
  renderOpenGraphImageSvg,
  renderPilotPlanPage,
  renderProofCardBuilderPage,
  renderProofCardSvg,
  renderQueuePressurePage,
  renderRepositoryDiagnosticsPage,
  renderRobotsTxt,
  renderScorecardBuilderPage,
  renderScorecardSvg,
  renderSecurityTxt,
  renderSetupWizardPage,
  renderSpamRadarPage,
  renderSitemapXml,
  renderStatusPage,
  renderTrustCenterPage,
} from "./render";
import { verifyTurnstile } from "./turnstile";
import { fetchWithTimeout } from "./http";
import {
  fetchRepoEvidence,
  fetchSpamRadar,
  normalizeRepositorySlug,
} from "./evidence";
import type {
  CiCaptchaConfig,
  GateRecord,
  GateTokenPayload,
  PullRequestWebhook,
} from "./types";

export const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use("*", async (c, next) => {
  const requestId =
    c.req.header("x-request-id") ??
    c.req.header("cf-ray") ??
    crypto.randomUUID();
  c.set("requestId", requestId);
  await next();
  c.header("X-Request-Id", requestId);
  setSecurityHeaders(c);
});

app.onError((error, c) => {
  const requestId = c.get("requestId") ?? crypto.randomUUID();
  console.error(
    JSON.stringify({
      level: "error",
      event: "request.failed",
      request_id: requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      error: errorForLogs(error, c.env),
    }),
  );
  c.header("X-Request-Id", requestId);
  setSecurityHeaders(c);
  if (acceptsHtml(c.req.header("accept"))) {
    return c.html(
      renderMessagePage(
        "Something went wrong",
        `Request ID: ${requestId}`,
        "error",
      ),
      500,
    );
  }
  return c.json(
    {
      error: "Internal server error",
      request_id: requestId,
    },
    500,
  );
});

const publicQueueRepos = [
  {
    repo: "microsoft/vscode",
    fallbackOpenPrs: 2044,
  },
  {
    repo: "kubernetes/kubernetes",
    fallbackOpenPrs: 926,
  },
  {
    repo: "vercel/next.js",
    fallbackOpenPrs: 1900,
  },
  {
    repo: "rust-lang/rust",
    fallbackOpenPrs: 1113,
  },
] as const;

const publicCountFetchTimeoutMs = 2500;
const configPreviewMaxBytes = 32 * 1024;

type RateLimitAuditContext = Omit<AuditLogInput, "event" | "details"> & {
  details: Record<string, unknown>;
};

type PublishResult = {
  approvedRuns: number;
  rerunWorkflows: number;
};

function securityPolicy(): string {
  return [
    "default-src 'none'",
    "base-uri 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    "form-action 'self' https://github.com",
    "frame-ancestors 'none'",
    "frame-src https://challenges.cloudflare.com",
    "img-src 'self' data: https://challenges.cloudflare.com",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src 'unsafe-inline'",
  ].join("; ");
}

function setSecurityHeaders(c: {
  header: (name: string, value: string) => void;
}): void {
  c.header("Content-Security-Policy", securityPolicy());
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function acceptsHtml(accept: string | undefined): boolean {
  return Boolean(accept?.includes("text/html"));
}

function redactForLogs(value: string, env: Env): string {
  let redacted = value;
  for (const secret of [
    env.ADMIN_TOKEN,
    env.GITHUB_PRIVATE_KEY,
    env.GITHUB_WEBHOOK_SECRET,
    env.GITHUB_CLIENT_SECRET,
    env.TURNSTILE_SECRET_KEY,
    env.SESSION_SECRET,
  ]) {
    if (secret && secret.length >= 4) {
      redacted = redacted.replaceAll(secret, "[redacted]");
    }
  }
  return redacted
    .replaceAll(/github_pat_[A-Za-z0-9_]+/g, "[redacted]")
    .replaceAll(/gh[pousr]_[A-Za-z0-9_]+/g, "[redacted]")
    .replaceAll(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]");
}

function errorForLogs(error: Error, env: Env): Record<string, unknown> {
  const details: Record<string, unknown> = {
    name: error.name,
    message: redactForLogs(error.message, env),
  };
  if (error instanceof GitHubApiError) {
    details.github_status = error.status;
    details.github_method = error.method;
    details.github_path = error.path;
    details.github_body = redactForLogs(error.body, env).slice(0, 2000);
  }
  return details;
}

function publicBaseUrl(
  env: Partial<Env> | undefined,
  requestUrl: string,
): string {
  return typeof env?.APP_BASE_URL === "string" && env.APP_BASE_URL.trim()
    ? appBaseUrl({ APP_BASE_URL: env.APP_BASE_URL })
    : new URL(requestUrl).origin;
}

app.get("/", (c) => {
  return c.html(
    renderHome(publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url)),
  );
});

app.get("/config-preview", (c) => {
  return c.html(
    renderConfigPreviewPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/demo", (c) => {
  return c.html(
    renderDemoPage(publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url)),
  );
});

app.get("/queue-pressure", (c) => {
  return c.html(
    renderQueuePressurePage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/evidence", (c) => {
  return c.html(
    renderEvidenceScannerPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
      normalizeRepositorySlug(c.req.query("repo") ?? "") ?? undefined,
    ),
  );
});

app.get("/radar", (c) => {
  return c.html(
    renderSpamRadarPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/pilot", (c) => {
  return c.html(
    renderPilotPlanPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
      normalizeRepositorySlug(c.req.query("repo") ?? "") ?? undefined,
    ),
  );
});

app.get("/trust", (c) => {
  return c.html(
    renderTrustCenterPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/badge-builder", (c) => {
  return c.html(
    renderBadgeBuilderPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/proof-card", (c) => {
  return c.html(
    renderProofCardBuilderPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/scorecard-builder", (c) => {
  return c.html(
    renderScorecardBuilderPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
      normalizeRepositorySlug(c.req.query("repo") ?? "") ?? undefined,
    ),
  );
});

app.get("/github-app-manifest", (c) => {
  return c.html(
    renderGitHubAppManifestPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/github-app-manifest/callback", (c) => {
  return c.html(
    renderGitHubAppManifestCallbackPage({
      baseUrl: publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
      code: c.req.query("code") || undefined,
      state: c.req.query("state") || undefined,
    }),
  );
});

app.get("/launch", (c) => {
  return c.html(
    renderLaunchPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/rehearsal", (c) => {
  return c.html(
    renderForkPrRehearsalPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/gate-trace", (c) => {
  return c.html(
    renderGateTracePage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/setup-wizard", (c) => {
  return c.html(
    renderSetupWizardPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/diagnostics", (c) => {
  return c.html(
    renderRepositoryDiagnosticsPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/status", (c) => {
  return c.html(
    renderStatusPage(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
  );
});

app.get("/favicon.ico", (c) => c.body(null, 204));
app.get("/favicon.svg", (c) =>
  c.body(renderFaviconSvg(), 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  }),
);
app.get("/og.svg", (c) =>
  c.body(renderOpenGraphImageSvg(), 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  }),
);
app.get("/badge.svg", (c) =>
  c.body(
    renderBadgeSvg({
      label: c.req.query("label") || undefined,
      message: c.req.query("message") || undefined,
      tone: c.req.query("tone") || undefined,
      style: c.req.query("style") || undefined,
    }),
    200,
    {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  ),
);
app.get("/proof.svg", (c) =>
  c.body(
    renderProofCardSvg({
      repo: c.req.query("repo") || undefined,
      pr: c.req.query("pr") || undefined,
      sha: c.req.query("sha") || undefined,
      user: c.req.query("user") || undefined,
      result: c.req.query("result") || undefined,
      theme: c.req.query("theme") || undefined,
    }),
    200,
    {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  ),
);
app.get("/scorecard.svg", (c) =>
  c.body(
    renderScorecardSvg({
      repo: c.req.query("repo") || undefined,
      risk: c.req.query("risk") || undefined,
      open: c.req.query("open") || undefined,
      fork: c.req.query("fork") || undefined,
      unknown: c.req.query("unknown") || undefined,
      labels: c.req.query("labels") || undefined,
      recommendation: c.req.query("recommendation") || undefined,
      theme: c.req.query("theme") || undefined,
    }),
    200,
    {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  ),
);
app.get("/robots.txt", (c) =>
  c.text(
    renderRobotsTxt(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
    200,
    {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  ),
);
app.get("/sitemap.xml", (c) =>
  c.body(
    renderSitemapXml(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
    ),
    200,
    {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  ),
);
app.get("/.well-known/security.txt", (c) =>
  c.text(
    renderSecurityTxt(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
      new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    ),
    200,
    {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  ),
);
app.get("/security.txt", (c) =>
  c.text(
    renderSecurityTxt(
      publicBaseUrl(c.env as Partial<Env> | undefined, c.req.url),
      new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    ),
    200,
    {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  ),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "pr-captcha",
  }),
);

async function readinessPayload(env: Env): Promise<{
  ok: boolean;
  service: "pr-captcha";
  missing: string[];
  database: boolean;
}> {
  const missing = missingRequiredEnv(env);
  let database = false;
  try {
    if (env.DB) {
      await env.DB.prepare("select 1 as ok").first();
      database = true;
    }
  } catch {
    database = false;
  }
  const ok = missing.length === 0 && database;
  return {
    ok,
    service: "pr-captcha",
    missing,
    database,
  };
}

app.get("/health/ready", async (c) => {
  const payload = await readinessPayload(c.env);
  return c.json(payload, payload.ok ? 200 : 503);
});

app.get("/api/public/launch-readiness", async (c) => {
  return c.json(await readinessPayload(c.env));
});

app.get("/api/public/pr-counts", async (c) => {
  const repos = await Promise.all(
    publicQueueRepos.map(async (repo) => {
      const openPrs = await getOpenPullRequestCount(repo.repo);
      return {
        repo: repo.repo,
        open_prs: openPrs ?? repo.fallbackOpenPrs,
        live: openPrs !== null,
      };
    }),
  );
  c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  return c.json({
    as_of: new Date().toISOString(),
    repos,
  });
});

app.get("/api/public/repo-evidence", async (c) => {
  const repository = normalizeRepositorySlug(c.req.query("repo") ?? "");
  if (!repository) {
    return c.json({ error: "Invalid GitHub repository" }, 400);
  }
  const evidence = await fetchRepoEvidence(repository);
  c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  return c.json(evidence);
});

app.get("/api/public/spam-radar", async (c) => {
  const radar = await fetchSpamRadar();
  c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  return c.json(radar);
});

app.post("/api/public/config-preview", async (c) => {
  const ipLimited = await rateLimitResponse(
    c.env,
    `public-config-preview-ip:${clientIp(c.req.raw)}`,
    60,
    60,
    {
      details: {
        scope: "public_config_preview_ip",
      },
    },
  );
  if (ipLimited) {
    return ipLimited;
  }

  const input = await readConfigPreviewInput(c.req.raw);
  if (!input.ok) {
    return c.json({ error: input.error }, input.status);
  }
  const inspection = inspectRepoConfig(
    input.config.trim() ? input.config : null,
  );
  return c.json({
    ok: inspection.valid,
    config: inspection.config,
    config_source: inspection.source,
    config_valid: inspection.valid,
    diagnostics: inspection.diagnostics,
    setup: {
      required_check_name: inspection.config.checks.name,
      creates_required_check: inspection.config.checks.create_required_check,
      comment_enabled: inspection.config.comment.enabled,
      universal_gate_rerun:
        inspection.config.universal_gate.rerun_after_verification,
    },
  });
});

app.get("/auth/github/start", startGitHubOAuth);
app.get("/auth/github/callback", handleGitHubOAuthCallback);

app.get("/api/admin/audit-logs", async (c) => {
  const ipLimited = await rateLimitResponse(
    c.env,
    `admin-audit-ip:${clientIp(c.req.raw)}`,
    60,
    60,
    {
      details: {
        scope: "admin_audit_ip",
      },
    },
  );
  if (ipLimited) {
    return ipLimited;
  }

  const admin = await requireAdmin(c.env, c.req.header("authorization"));
  if (!admin.ok) {
    return c.json({ error: admin.error }, admin.status);
  }

  const prNumber = optionalPositiveInteger(c.req.query("pr"));
  if (prNumber === false) {
    return c.json({ error: "pr must be a positive integer" }, 400);
  }
  const limit = boundedInteger(c.req.query("limit"), 100, 1, 500);
  const logs = await listAuditLogs(c.env.DB, {
    owner: c.req.query("owner") || undefined,
    repo: c.req.query("repo") || undefined,
    prNumber: prNumber ?? undefined,
    gateId: c.req.query("gate_id") || undefined,
    event: c.req.query("event") || undefined,
    limit,
  });

  return c.json({
    logs: logs.map(auditLogJson),
    limit,
  });
});

app.get("/api/admin/repositories/:owner/:repo/diagnostics", async (c) => {
  const ipLimited = await rateLimitResponse(
    c.env,
    `admin-diagnostics-ip:${clientIp(c.req.raw)}`,
    30,
    60,
    {
      details: {
        scope: "admin_diagnostics_ip",
      },
    },
  );
  if (ipLimited) {
    return ipLimited;
  }

  const admin = await requireAdmin(c.env, c.req.header("authorization"));
  if (!admin.ok) {
    return c.json({ error: admin.error }, admin.status);
  }

  const installationId = optionalPositiveInteger(
    c.req.query("installation_id"),
  );
  if (!installationId) {
    return c.json({ error: "installation_id must be a positive integer" }, 400);
  }
  if (!isInstallationAllowed(c.env, installationId)) {
    return c.json({ error: "Installation is not allowed" }, 403);
  }

  const owner = c.req.param("owner");
  const repo = c.req.param("repo");
  try {
    const installationToken = await getInstallationToken(c.env, installationId);
    const repository = await getRepositoryMetadata(
      installationToken,
      owner,
      repo,
    );
    const ref = c.req.query("ref")?.trim() || repository.defaultBranch;
    const rawConfig = await getRepositoryFile(
      installationToken,
      owner,
      repo,
      ".github/pr-captcha.yml",
      ref,
    );
    const inspection = inspectRepoConfig(rawConfig);
    await createAuditLog(c.env.DB, {
      event: "diagnostics.checked",
      owner,
      repo,
      installationId: String(installationId),
      details: {
        ref,
        config_source: inspection.source,
        config_valid: inspection.valid,
        diagnostics: inspection.diagnostics.map((item) => item.code),
      },
    });
    return c.json({
      ok: inspection.valid,
      repository: {
        owner,
        repo,
        full_name: repository.fullName,
        installation_id: String(installationId),
        default_branch: repository.defaultBranch,
        ref,
      },
      config: inspection.config,
      config_source: inspection.source,
      config_valid: inspection.valid,
      diagnostics: inspection.diagnostics,
      setup: {
        required_check_name: inspection.config.checks.name,
        creates_required_check: inspection.config.checks.create_required_check,
        comment_enabled: inspection.config.comment.enabled,
        universal_gate_rerun:
          inspection.config.universal_gate.rerun_after_verification,
      },
    });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return c.json(
        {
          ok: false,
          error: "GitHub API request failed",
          github_status: error.status,
        },
        error.status === 404 ? 404 : 502,
      );
    }
    throw error;
  }
});

app.post("/api/admin/gates/:id/retry", async (c) => {
  const ipLimited = await rateLimitResponse(
    c.env,
    `admin-retry-ip:${clientIp(c.req.raw)}`,
    10,
    60,
    {
      details: {
        scope: "admin_retry_ip",
      },
    },
  );
  if (ipLimited) {
    return ipLimited;
  }

  const admin = await requireAdmin(c.env, c.req.header("authorization"));
  if (!admin.ok) {
    return c.json({ error: admin.error }, admin.status);
  }

  const gate = await getGateById(c.env.DB, c.req.param("id"));
  if (!gate) {
    return c.json({ error: "Gate not found" }, 404);
  }
  if (!isInstallationAllowed(c.env, gate.installation_id)) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.retry_denied", {
        actorLogin: "operator",
        details: {
          reason: "installation_not_allowed",
        },
      }),
    );
    return c.json({ error: "Installation is not allowed" }, 403);
  }
  if (gate.status !== "verified") {
    return c.json({ error: "Only verified gates can be retried" }, 409);
  }

  try {
    const result = await publishVerifiedGate(c.env, gate, "operator");
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.retry_published", {
        actorLogin: "operator",
        details: result,
      }),
    );
    return c.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown retry error";
    await setGateError(c.env.DB, gate.id, message);
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.retry_failed", {
        actorLogin: "operator",
        details: {
          error: message,
        },
      }),
    );
    return c.json({ error: message }, 502);
  }
});

app.post("/webhooks/github", async (c) => {
  const body = await c.req.text();
  const valid = await verifyGitHubWebhook(
    body,
    c.req.header("x-hub-signature-256") ?? null,
    c.env.GITHUB_WEBHOOK_SECRET,
  );
  if (!valid) {
    const limited = await rateLimitResponse(
      c.env,
      `webhook-invalid:${clientIp(c.req.raw)}`,
      20,
      60,
      {
        details: {
          scope: "webhook_invalid_signature",
        },
      },
    );
    if (limited) {
      return limited;
    }
    return c.text("Invalid signature", 401);
  }

  const deliveryId = c.req.header("x-github-delivery");
  if (!deliveryId) {
    return c.text("Missing delivery id", 400);
  }
  const event = c.req.header("x-github-event") ?? "unknown";
  const claimed = await claimWebhookDelivery(c.env.DB, deliveryId, event);
  if (!claimed) {
    await createAuditLog(c.env.DB, {
      event: "webhook.duplicate",
      details: {
        delivery_id: deliveryId,
        github_event: event,
      },
    });
    return c.json({ ok: true, duplicate: true });
  }

  try {
    if (event === "ping") {
      await completeWebhookDelivery(c.env.DB, deliveryId);
      return c.json({ ok: true });
    }
    if (event !== "pull_request") {
      await completeWebhookDelivery(c.env.DB, deliveryId);
      return c.json({ ok: true, ignored: event });
    }

    const parsedPayload = parsePullRequestWebhook(body);
    if (!parsedPayload.ok) {
      await createAuditLog(c.env.DB, {
        event: "webhook.invalid_payload",
        details: {
          delivery_id: deliveryId,
          github_event: event,
          reason: parsedPayload.error,
        },
      });
      await completeWebhookDelivery(c.env.DB, deliveryId);
      return c.json(
        {
          ok: false,
          error: "Invalid pull_request webhook payload",
        },
        400,
      );
    }
    const payload = parsedPayload.payload;
    if (!isWebhookInstallationAllowed(c.env, payload)) {
      await createAuditLog(c.env.DB, {
        event: "installation.blocked",
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        prNumber: payload.pull_request.number,
        headSha: payload.pull_request.head.sha,
        installationId: String(payload.installation.id),
        actorLogin: payload.pull_request.user.login,
        details: {
          action: payload.action,
          delivery_id: deliveryId,
        },
      });
      await completeWebhookDelivery(c.env.DB, deliveryId);
      return c.json({ ok: true, ignored: "installation_not_allowed" });
    }
    if (!shouldProcessPullRequestAction(payload.action)) {
      await completeWebhookDelivery(c.env.DB, deliveryId);
      return c.json({ ok: true, ignored: payload.action });
    }

    const quotaLimited = await webhookQuotaResponse(c.env, payload);
    if (quotaLimited) {
      await completeWebhookDelivery(c.env.DB, deliveryId);
      return quotaLimited;
    }

    const result = await processPullRequestWebhook(c.env, payload);
    await completeWebhookDelivery(c.env.DB, deliveryId);
    return c.json(result);
  } catch (error) {
    await releaseWebhookDelivery(c.env.DB, deliveryId);
    throw error;
  }
});

app.get("/gate/:id", async (c) => {
  const gate = await getGateById(c.env.DB, c.req.param("id"));
  const token = c.req.query("token") ?? "";
  const tokenPayload = gate ? await verifyGateToken(c.env, gate, token) : null;
  if (!gate || !tokenPayload) {
    return c.html(
      renderMessagePage(
        "Invalid verification link",
        "This pr-captcha link is invalid or expired.",
        "error",
      ),
      400,
    );
  }
  if (!isInstallationAllowed(c.env, gate.installation_id)) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        details: {
          reason: "installation_not_allowed",
        },
      }),
    );
    return c.html(
      renderMessagePage(
        "Installation not allowed",
        "This pr-captcha installation is not enabled for this beta.",
        "error",
      ),
      403,
    );
  }
  if (gate.status === "skipped") {
    return c.html(
      renderMessagePage(
        "Human check not required",
        "This pull request no longer requires a pr-captcha verification for this commit.",
      ),
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
  if (!verification) {
    const activeToken = await verifyGateToken(c.env, gate, token, {
      requireUnusedNonce: true,
    });
    if (!activeToken) {
      return c.html(
        renderMessagePage(
          "Verification link already used",
          "This pr-captcha link has already been used or replaced by a newer PR check.",
          "error",
        ),
        409,
      );
    }
  }
  await createAuditLog(
    c.env.DB,
    gateAuditInput(gate, "gate.viewed", {
      actorLogin: session.login,
      details: {
        already_verified: Boolean(verification),
      },
    }),
  );
  return c.html(
    renderGatePage({
      gate,
      token,
      csrfToken: await createCsrfToken(c.env, gate, token, session),
      session,
      turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
      verified: Boolean(verification),
    }),
  );
});

app.post("/gate/:id", async (c) => {
  const ipLimited = await rateLimitResponse(
    c.env,
    `gate-ip:${clientIp(c.req.raw)}`,
    30,
    60,
    {
      details: {
        scope: "gate_ip",
      },
    },
  );
  if (ipLimited) {
    return ipLimited;
  }
  const gate = await getGateById(c.env.DB, c.req.param("id"));
  const form = await c.req.parseBody();
  const token = asString(form.token);
  const tokenPayload = gate ? await verifyGateToken(c.env, gate, token) : null;
  if (!gate || !tokenPayload) {
    return c.html(
      renderMessagePage(
        "Invalid verification link",
        "This pr-captcha link is invalid or expired.",
        "error",
      ),
      400,
    );
  }
  if (!isInstallationAllowed(c.env, gate.installation_id)) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        details: {
          reason: "installation_not_allowed",
        },
      }),
    );
    return c.html(
      renderMessagePage(
        "Installation not allowed",
        "This pr-captcha installation is not enabled for this beta.",
        "error",
      ),
      403,
    );
  }
  if (gate.status === "skipped") {
    return c.html(
      renderMessagePage(
        "Human check not required",
        "This pull request no longer requires a pr-captcha verification for this commit.",
      ),
    );
  }

  const session = await getSession(c);
  if (!session) {
    return c.redirect(
      `/auth/github/start?return_to=${encodeURIComponent(appUrl(c.env, `/gate/${gate.id}?token=${encodeURIComponent(token)}`))}`,
      302,
    );
  }
  const loginLimited = await rateLimitResponse(
    c.env,
    `gate-login:${session.login}`,
    20,
    600,
    gateRateLimitContext(gate, "gate_login", session.login),
  );
  if (loginLimited) {
    return loginLimited;
  }
  const gateLimited = await rateLimitResponse(
    c.env,
    `gate:${gate.id}`,
    20,
    600,
    gateRateLimitContext(gate, "gate_id", session.login),
  );
  if (gateLimited) {
    return gateLimited;
  }

  const existingVerification = await getVerification(
    c.env.DB,
    gate.owner,
    gate.repo,
    gate.pr_number,
    gate.head_sha,
  );
  if (existingVerification) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.replay_ignored", {
        actorLogin: session.login,
        details: {
          solver_login: existingVerification.solver_login,
        },
      }),
    );
    return c.html(
      renderMessagePage(
        "Human check already passed",
        `Human-origin check is already recorded for commit ${gate.head_sha.slice(0, 7)}.`,
      ),
    );
  }

  const csrfToken = await createCsrfToken(c.env, gate, token, session);
  const csrfOk = await verifyCsrfToken(
    c.env,
    gate,
    token,
    session,
    asString(form.csrf_token),
  );
  if (!csrfOk) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        actorLogin: session.login,
        details: {
          reason: "csrf_failed",
        },
      }),
    );
    return c.html(
      renderGatePage({
        gate,
        token,
        csrfToken,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error: "This verification form expired. Reload the page and try again.",
      }),
      403,
    );
  }

  const usableTokenPayload = await verifyGateToken(c.env, gate, token, {
    requireUnusedNonce: true,
  });
  if (!usableTokenPayload) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        actorLogin: session.login,
        details: {
          reason: "nonce_reused",
        },
      }),
    );
    return c.html(
      renderMessagePage(
        "Verification link already used",
        "This pr-captcha link has already been used or replaced by a newer PR check.",
        "error",
      ),
      409,
    );
  }

  const turnstileToken = asString(form["cf-turnstile-response"]);
  if (!turnstileToken) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        actorLogin: session.login,
        details: {
          reason: "missing_captcha_response",
        },
      }),
    );
    return c.html(
      renderGatePage({
        gate,
        token,
        csrfToken,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error: "Complete the CAPTCHA before finishing the human check.",
      }),
      400,
    );
  }

  const captchaOk = await verifyTurnstile(
    c.env,
    turnstileToken,
    c.req.header("cf-connecting-ip") ?? null,
  );
  if (!captchaOk) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        actorLogin: session.login,
        details: {
          reason: "captcha_failed",
        },
      }),
    );
    return c.html(
      renderGatePage({
        gate,
        token,
        csrfToken,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error: "CAPTCHA verification failed. Try again.",
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
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        actorLogin: session.login,
        details: {
          reason: "solver_not_pr_author",
          required_login: gate.pr_author,
        },
      }),
    );
    return c.html(
      renderGatePage({
        gate,
        token,
        csrfToken,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error: `This gate must be solved by ${gate.pr_author}. You are logged in as ${session.login}.`,
      }),
      403,
    );
  }

  if (pullRequest.head.sha !== gate.head_sha) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        actorLogin: session.login,
        details: {
          reason: "stale_head_sha",
          current_head_sha: pullRequest.head.sha,
        },
      }),
    );
    return c.html(
      renderGatePage({
        gate,
        token,
        csrfToken,
        session,
        turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
        error:
          "This pull request has a newer commit. Use the newest pr-captcha link on the PR.",
      }),
      409,
    );
  }

  const nonceConsumed = await consumeGateNonce(
    c.env.DB,
    gate.id,
    await sha256(usableTokenPayload.nonce),
  );
  if (!nonceConsumed) {
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.denied", {
        actorLogin: session.login,
        details: {
          reason: "nonce_race",
        },
      }),
    );
    return c.html(
      renderMessagePage(
        "Verification link already used",
        "This pr-captcha link was already consumed by another verification attempt.",
        "error",
      ),
      409,
    );
  }

  await createVerification(c.env.DB, {
    gate,
    solverLogin: session.login,
    captchaProvider: "cloudflare_turnstile",
  });
  await markGateVerified(c.env.DB, gate.id);
  await createAuditLog(
    c.env.DB,
    gateAuditInput(gate, "gate.solved", {
      actorLogin: session.login,
      details: {
        captcha_provider: "cloudflare_turnstile",
      },
    }),
  );

  let result: PublishResult;
  try {
    result = await publishVerifiedGate(c.env, gate, session.login, {
      config,
      installationToken,
      solverLogin: session.login,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown approval error";
    await setGateError(c.env.DB, gate.id, message);
    await createAuditLog(
      c.env.DB,
      gateAuditInput(gate, "gate.publish_failed", {
        actorLogin: session.login,
        details: {
          error: message,
        },
      }),
    );
    throw error;
  }

  return c.html(
    renderGatePage({
      gate,
      token,
      csrfToken: await createCsrfToken(c.env, gate, token, session),
      session,
      turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
      verified: true,
      successDetail: `Human-origin check recorded for commit ${gate.head_sha.slice(0, 7)}. Approved held runs: ${result.approvedRuns}. Rerun workflows: ${result.rerunWorkflows}.`,
    }),
  );
});

app.get("/api/v1/verifications/status", async (c) => {
  const owner = c.req.query("owner");
  const repo = c.req.query("repo");
  const prNumber = positiveInteger(c.req.query("pr"));
  const sha = c.req.query("sha");
  if (!owner || !repo || prNumber === null || !sha) {
    return c.json(
      {
        verified: false,
        error: "owner, repo, positive pr, and sha are required",
      },
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
    if (!isInstallationAllowed(c.env, verification.installation_id)) {
      return c.json(
        { verified: false, error: "Installation is not allowed" },
        403,
      );
    }
    return c.json({
      verified: true,
      solver_login: verification.solver_login,
      captcha_passed_at: verification.captcha_passed_at,
    });
  }

  const gate = await getGateByIdentity(c.env.DB, owner, repo, prNumber, sha);
  if (gate && !isInstallationAllowed(c.env, gate.installation_id)) {
    return c.json(
      { verified: false, error: "Installation is not allowed" },
      403,
    );
  }
  if (gate?.status === "skipped") {
    return c.json({
      verified: true,
      skipped: true,
    });
  }
  return c.json({
    verified: false,
    verification_url: gate ? await gateVerificationUrl(c.env, gate) : null,
  });
});

async function processPullRequestWebhook(
  env: Env,
  payload: PullRequestWebhook,
): Promise<Record<string, unknown>> {
  const installationId = payload.installation.id;
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const pr = payload.pull_request;
  const installationToken = await getInstallationToken(env, installationId);
  const config = await loadConfig(installationToken, owner, repo, pr.base.ref);
  const decision = shouldGatePullRequest(pr, config);
  if (!decision.gate) {
    await resolveSkippedGate(env, installationToken, owner, repo, pr, config);
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
  const nonce = gateNonce(gateId, owner, repo, pr.number, pr.head.sha);
  const token = await createGateToken(env, {
    gateId,
    owner,
    repo,
    prNumber: pr.number,
    headSha: pr.head.sha,
    expiresAt,
  });
  const gate = await upsertGate(env.DB, {
    id: gateId,
    installationId: String(installationId),
    owner,
    repo,
    prNumber: pr.number,
    headSha: pr.head.sha,
    prAuthor: pr.user.login,
    status: existingVerification ? "verified" : "pending",
    gateUrl: appUrl(env, `/gate/${gateId}`),
    gateTokenHash: await sha256(token),
    gateNonceHash: existingVerification ? null : await sha256(nonce),
    expiresAt,
  });
  await createAuditLog(env.DB, {
    event: existingGate ? "gate.updated" : "gate.created",
    owner,
    repo,
    prNumber: pr.number,
    headSha: pr.head.sha,
    gateId: gate.id,
    installationId: String(installationId),
    actorLogin: pr.user.login,
    details: {
      action: payload.action,
      reasons: decision.reasons,
      status: gate.status,
      existing_verification: Boolean(existingVerification),
      previous_status: existingGate?.status ?? null,
    },
  });

  const gateForPublish = {
    ...gate,
    gate_url: await gateVerificationUrl(env, gate),
  };

  if (config.checks.create_required_check) {
    const checkRunId = existingVerification
      ? await publishVerifiedCheck(installationToken, gateForPublish, config)
      : await publishPendingCheck(
          installationToken,
          gateForPublish,
          config,
          decision.reasons,
        );
    if (checkRunId) {
      await setGateCheckRunId(env.DB, gate.id, checkRunId);
    }
  }

  if (config.comment.enabled) {
    const body = existingVerification
      ? passedComment(gateForPublish, {
          login: existingVerification.solver_login,
        })
      : pendingComment(gateForPublish, decision.reasons);
    const commentId = await createOrUpdateGateComment(installationToken, {
      owner,
      repo,
      prNumber: pr.number,
      marker: commentMarker(owner, repo, pr.number),
      body,
    });
    await setGateCommentId(env.DB, gate.id, commentId);
  }
  await clearGateError(env.DB, gate.id);

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
    ".github/pr-captcha.yml",
    ref,
  );
  return parseRepoConfig(raw);
}

async function getOpenPullRequestCount(repo: string): Promise<number | null> {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    return null;
  }
  try {
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls?state=open&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "pr-captcha",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      publicCountFetchTimeoutMs,
    );
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return null;
    }
    return (
      pullCountFromLinkHeader(response.headers.get("link")) ?? payload.length
    );
  } catch {
    return null;
  }
}

function pullCountFromLinkHeader(linkHeader: string | null): number | null {
  if (!linkHeader) {
    return null;
  }
  for (const link of linkHeader.split(",")) {
    const [rawUrl, rawRel] = link.split(";").map((part) => part.trim());
    if (
      rawRel !== 'rel="last"' ||
      !rawUrl?.startsWith("<") ||
      !rawUrl.endsWith(">")
    ) {
      continue;
    }
    const page = Number(new URL(rawUrl.slice(1, -1)).searchParams.get("page"));
    return Number.isSafeInteger(page) && page >= 0 ? page : null;
  }
  return null;
}

type ConfigPreviewInput =
  | { ok: true; config: string }
  | { ok: false; status: 400 | 413; error: string };

async function readConfigPreviewInput(
  request: Request,
): Promise<ConfigPreviewInput> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > configPreviewMaxBytes) {
    return {
      ok: false,
      status: 413,
      error: "Config preview input is too large",
    };
  }
  const text = await request.text();
  if (text.length > configPreviewMaxBytes) {
    return {
      ok: false,
      status: 413,
      error: "Config preview input is too large",
    };
  }
  if (request.headers.get("content-type")?.includes("application/json")) {
    let parsed: unknown;
    try {
      parsed = text ? (JSON.parse(text) as unknown) : {};
    } catch {
      return { ok: false, status: 400, error: "Invalid JSON body" };
    }
    if (!isRecord(parsed) || typeof parsed.config !== "string") {
      return {
        ok: false,
        status: 400,
        error: "JSON body must include a config string",
      };
    }
    return { ok: true, config: parsed.config };
  }
  return { ok: true, config: text };
}

async function publishVerifiedGate(
  env: Env,
  gate: GateRecord,
  actorLogin: string,
  options: {
    config?: CiCaptchaConfig;
    installationToken?: string;
    solverLogin?: string;
  } = {},
): Promise<PublishResult> {
  if (!isInstallationAllowed(env, gate.installation_id)) {
    throw new Error("Installation is not allowed");
  }
  const installationToken =
    options.installationToken ??
    (await getInstallationToken(env, gate.installation_id));
  let config = options.config;
  if (!config) {
    const pullRequest = await getPullRequest(
      installationToken,
      gate.owner,
      gate.repo,
      gate.pr_number,
    );
    if (pullRequest.head.sha !== gate.head_sha) {
      throw new Error("Cannot retry a gate for a stale pull request SHA");
    }
    config = await loadConfig(
      installationToken,
      gate.owner,
      gate.repo,
      pullRequest.base.ref,
    );
  }

  const verification = await getVerification(
    env.DB,
    gate.owner,
    gate.repo,
    gate.pr_number,
    gate.head_sha,
  );
  if (!verification) {
    throw new Error("Cannot publish a gate without a verification record");
  }

  const gateForPublish = {
    ...gate,
    gate_url: await gateVerificationUrl(env, gate),
  };
  const checkRunId = await publishVerifiedCheck(
    installationToken,
    gateForPublish,
    config,
  );
  if (checkRunId) {
    await setGateCheckRunId(env.DB, gate.id, checkRunId);
  }
  const approvedRuns = shouldApproveHeldWorkflows(config)
    ? await approveWorkflowRunsForSha(
        installationToken,
        gate.owner,
        gate.repo,
        gate.head_sha,
      )
    : 0;
  const rerunWorkflows =
    shouldRerunFailedWorkflows(config) &&
    config.universal_gate.rerun_after_verification
      ? await rerunFailedWorkflowRunsForSha(
          installationToken,
          gate.owner,
          gate.repo,
          gate.head_sha,
        )
      : 0;
  if (config.comment.enabled) {
    const commentId = await createOrUpdateGateComment(installationToken, {
      owner: gate.owner,
      repo: gate.repo,
      prNumber: gate.pr_number,
      marker: commentMarker(gate.owner, gate.repo, gate.pr_number),
      body: passedComment(gateForPublish, {
        login: options.solverLogin ?? verification.solver_login,
      }),
    });
    await setGateCommentId(env.DB, gate.id, commentId);
  }
  await clearGateError(env.DB, gate.id);
  const result = { approvedRuns, rerunWorkflows };
  await createAuditLog(
    env.DB,
    gateAuditInput(gate, "gate.published", {
      actorLogin,
      details: {
        approved_runs: approvedRuns,
        rerun_workflows: rerunWorkflows,
        comment_enabled: config.comment.enabled,
        check_enabled: config.checks.create_required_check,
      },
    }),
  );
  if (approvedRuns > 0) {
    await createAuditLog(
      env.DB,
      gateAuditInput(gate, "workflow.approved", {
        actorLogin,
        details: {
          count: approvedRuns,
        },
      }),
    );
  }
  if (rerunWorkflows > 0) {
    await createAuditLog(
      env.DB,
      gateAuditInput(gate, "workflow.rerun", {
        actorLogin,
        details: {
          count: rerunWorkflows,
        },
      }),
    );
  }
  return result;
}

function shouldApproveHeldWorkflows(config: CiCaptchaConfig): boolean {
  return config.mode === "native_fork" || config.mode === "hybrid";
}

function shouldRerunFailedWorkflows(config: CiCaptchaConfig): boolean {
  return config.mode === "universal" || config.mode === "hybrid";
}

async function publishPendingCheck(
  token: string,
  gate: GateRecord,
  config: CiCaptchaConfig,
  reasons: string[],
): Promise<number> {
  const summary = `pr-captcha is waiting for a SHA-bound human-origin check. Reason: ${reasons.join(", ")}.`;
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
): Promise<number | null> {
  const summary = `pr-captcha verified a GitHub-authenticated human for commit ${gate.head_sha.slice(0, 7)}.`;
  if (gate.check_run_id) {
    await updateCheckRun(token, {
      owner: gate.owner,
      repo: gate.repo,
      checkRunId: gate.check_run_id,
      detailsUrl: gate.gate_url,
      title: "Human check passed",
      summary,
      conclusion: "success",
    });
    return gate.check_run_id;
  }
  if (!config.checks.create_required_check) {
    return null;
  }
  return createCheckRun(token, {
    owner: gate.owner,
    repo: gate.repo,
    name: config.checks.name,
    headSha: gate.head_sha,
    detailsUrl: gate.gate_url,
    title: "Human check passed",
    summary,
    conclusion: "success",
  });
}

async function resolveSkippedGate(
  env: Env,
  token: string,
  owner: string,
  repo: string,
  pr: PullRequestWebhook["pull_request"],
  config: CiCaptchaConfig,
): Promise<void> {
  const existing = await getGateByIdentity(
    env.DB,
    owner,
    repo,
    pr.number,
    pr.head.sha,
  );
  if (!existing) {
    return;
  }
  const existingForPublish = {
    ...existing,
    gate_url: await gateVerificationUrl(env, existing),
  };
  await markGateSkipped(env.DB, existing.id);
  await createAuditLog(
    env.DB,
    gateAuditInput(existing, "gate.skipped", {
      actorLogin: pr.user.login,
      details: {
        previous_status: existing.status,
      },
    }),
  );
  if (existing.check_run_id) {
    await updateCheckRun(token, {
      owner,
      repo,
      checkRunId: existing.check_run_id,
      detailsUrl: existingForPublish.gate_url,
      title: "Human check not required",
      summary: "pr-captcha is no longer gating this pull request.",
      conclusion: "success",
    });
  }
  if (existing.comment_id) {
    await updateIssueComment(token, {
      owner,
      repo,
      commentId: existing.comment_id,
      body: skippedComment(existingForPublish),
    });
  } else if (config.comment.enabled) {
    const commentId = await createOrUpdateGateComment(token, {
      owner,
      repo,
      prNumber: pr.number,
      marker: commentMarker(owner, repo, pr.number),
      body: skippedComment(existingForPublish),
    });
    await setGateCommentId(env.DB, existing.id, commentId);
  }
}

async function gateVerificationUrl(
  env: Env,
  gate: GateRecord,
): Promise<string> {
  const token = await createGateToken(env, {
    gateId: gate.id,
    owner: gate.owner,
    repo: gate.repo,
    prNumber: gate.pr_number,
    headSha: gate.head_sha,
    expiresAt: gate.expires_at,
  });
  return appUrl(env, `/gate/${gate.id}?token=${encodeURIComponent(token)}`);
}

async function createGateToken(
  env: Env,
  input: {
    gateId: string;
    owner: string;
    repo: string;
    prNumber: number;
    headSha: string;
    expiresAt: string;
  },
): Promise<string> {
  return signPayload(
    {
      gate_id: input.gateId,
      owner: input.owner,
      repo: input.repo,
      pr_number: input.prNumber,
      head_sha: input.headSha,
      nonce: gateNonce(
        input.gateId,
        input.owner,
        input.repo,
        input.prNumber,
        input.headSha,
      ),
      exp: gateTokenExpiration(input.expiresAt),
    } satisfies GateTokenPayload,
    env.SESSION_SECRET,
  );
}

function gateNonce(
  gateId: string,
  owner: string,
  repo: string,
  prNumber: number,
  headSha: string,
): string {
  return `${gateId}:${owner}/${repo}#${prNumber}:${headSha}`;
}

function gateTokenExpiration(expiresAt: string): number {
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs)) {
    throw new Error("Gate expiration timestamp is invalid");
  }
  return Math.floor(expiresAtMs / 1000);
}

async function verifyGateToken(
  env: Env,
  gate: GateRecord,
  token: string,
  options: { requireUnusedNonce?: boolean } = {},
): Promise<GateTokenPayload | null> {
  if (!token) {
    return null;
  }
  const payload = await verifyPayload<GateTokenPayload>(
    token,
    env.SESSION_SECRET,
    isGateTokenPayload,
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
  if (options.requireUnusedNonce) {
    if (!gate.gate_nonce_hash || !payload.nonce) {
      return null;
    }
    if ((await sha256(payload.nonce)) !== gate.gate_nonce_hash) {
      return null;
    }
  }
  return payload;
}

async function createCsrfToken(
  env: Env,
  gate: GateRecord,
  gateToken: string,
  session: SessionUser,
): Promise<string> {
  return signPayload(
    {
      gate_id: gate.id,
      token_hash: await sha256(gateToken),
      login: session.login,
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    },
    env.SESSION_SECRET,
  );
}

async function verifyCsrfToken(
  env: Env,
  gate: GateRecord,
  gateToken: string,
  session: SessionUser,
  csrfToken: string,
): Promise<boolean> {
  const payload = await verifyPayload<{
    gate_id: string;
    token_hash: string;
    login: string;
    exp: number;
  }>(csrfToken, env.SESSION_SECRET, isCsrfTokenPayload);
  if (!payload) {
    return false;
  }
  return (
    payload.gate_id === gate.id &&
    payload.login === session.login &&
    payload.token_hash === (await sha256(gateToken))
  );
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

type PullRequestWebhookParseResult =
  | { ok: true; payload: PullRequestWebhook }
  | { ok: false; error: string };

function parsePullRequestWebhook(body: string): PullRequestWebhookParseResult {
  let value: unknown;
  try {
    value = JSON.parse(body) as unknown;
  } catch {
    return { ok: false, error: "invalid_json" };
  }
  if (!isPullRequestWebhook(value)) {
    return { ok: false, error: "invalid_shape" };
  }
  return { ok: true, payload: value };
}

function isPullRequestWebhook(value: unknown): value is PullRequestWebhook {
  if (!isRecord(value)) {
    return false;
  }
  return (
    nonEmptyString(value.action) &&
    isWebhookInstallation(value.installation) &&
    isWebhookRepository(value.repository) &&
    isWebhookPullRequest(value.pull_request)
  );
}

function isWebhookInstallation(value: unknown): value is { id: number } {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    value.id > 0
  );
}

function isWebhookRepository(
  value: unknown,
): value is PullRequestWebhook["repository"] {
  return (
    isRecord(value) &&
    nonEmptyString(value.name) &&
    nonEmptyString(value.full_name) &&
    isLoginOwner(value.owner) &&
    nonEmptyString(value.default_branch)
  );
}

function isWebhookPullRequest(
  value: unknown,
): value is PullRequestWebhook["pull_request"] {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.number === "number" &&
    Number.isSafeInteger(value.number) &&
    value.number > 0 &&
    typeof value.draft === "boolean" &&
    nonEmptyString(value.html_url) &&
    nonEmptyString(value.author_association) &&
    isWebhookUser(value.user) &&
    isWebhookHead(value.head) &&
    isWebhookBase(value.base) &&
    Array.isArray(value.labels) &&
    value.labels.every(isWebhookLabel)
  );
}

function isWebhookUser(
  value: unknown,
): value is PullRequestWebhook["pull_request"]["user"] {
  return (
    isRecord(value) && nonEmptyString(value.login) && nonEmptyString(value.type)
  );
}

function isWebhookHead(
  value: unknown,
): value is PullRequestWebhook["pull_request"]["head"] {
  return (
    isRecord(value) &&
    nonEmptyString(value.sha) &&
    nonEmptyString(value.ref) &&
    (value.repo === null || isWebhookHeadRepository(value.repo))
  );
}

function isWebhookHeadRepository(
  value: unknown,
): value is NonNullable<PullRequestWebhook["pull_request"]["head"]["repo"]> {
  return (
    isRecord(value) &&
    nonEmptyString(value.full_name) &&
    typeof value.fork === "boolean" &&
    isLoginOwner(value.owner)
  );
}

function isWebhookBase(
  value: unknown,
): value is PullRequestWebhook["pull_request"]["base"] {
  return (
    isRecord(value) &&
    nonEmptyString(value.ref) &&
    isWebhookBaseRepository(value.repo)
  );
}

function isWebhookBaseRepository(
  value: unknown,
): value is PullRequestWebhook["pull_request"]["base"]["repo"] {
  return (
    isRecord(value) &&
    nonEmptyString(value.full_name) &&
    isLoginOwner(value.owner)
  );
}

function isLoginOwner(value: unknown): value is { login: string } {
  return isRecord(value) && nonEmptyString(value.login);
}

function isWebhookLabel(
  value: unknown,
): value is PullRequestWebhook["pull_request"]["labels"][number] {
  return isRecord(value) && typeof value.name === "string";
}

function isGateTokenPayload(value: unknown): value is GateTokenPayload {
  return (
    isRecord(value) &&
    typeof value.gate_id === "string" &&
    typeof value.owner === "string" &&
    typeof value.repo === "string" &&
    typeof value.pr_number === "number" &&
    typeof value.head_sha === "string" &&
    typeof value.nonce === "string" &&
    typeof value.exp === "number"
  );
}

function isCsrfTokenPayload(value: unknown): value is {
  gate_id: string;
  token_hash: string;
  login: string;
  exp: number;
} {
  return (
    isRecord(value) &&
    typeof value.gate_id === "string" &&
    typeof value.token_hash === "string" &&
    typeof value.login === "string" &&
    typeof value.exp === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isWebhookInstallationAllowed(
  env: Env,
  payload: PullRequestWebhook,
): boolean {
  return isInstallationAllowed(env, payload.installation.id);
}

function isInstallationAllowed(
  env: Env,
  installationId: string | number,
): boolean {
  const allowlist = allowedInstallationIds(env);
  return !allowlist || allowlist.has(String(installationId));
}

function allowedInstallationIds(env: Env): Set<string> | null {
  const raw = env.ALLOWED_INSTALLATION_IDS?.trim();
  if (!raw) {
    return null;
  }
  const ids = raw.split(/[\s,]+/).filter(Boolean);
  return ids.length ? new Set(ids) : null;
}

async function webhookQuotaResponse(
  env: Env,
  payload: PullRequestWebhook,
): Promise<Response | null> {
  const installationId = payload.installation.id;
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const context = {
    owner,
    repo,
    prNumber,
    headSha: payload.pull_request.head.sha,
    installationId: String(installationId),
  };
  return (
    (await rateLimitResponse(
      env,
      `webhook-installation:${installationId}`,
      1000,
      600,
      {
        ...context,
        details: {
          scope: "webhook_installation",
        },
      },
    )) ??
    (await rateLimitResponse(env, `webhook-repo:${owner}/${repo}`, 300, 600, {
      ...context,
      details: {
        scope: "webhook_repo",
      },
    })) ??
    (await rateLimitResponse(
      env,
      `webhook-pr:${owner}/${repo}#${prNumber}`,
      60,
      600,
      {
        ...context,
        details: {
          scope: "webhook_pr",
        },
      },
    ))
  );
}

async function requireAdmin(
  env: Env,
  header: string | undefined,
): Promise<
  | { ok: true }
  | {
      ok: false;
      status: 401 | 503;
      error: string;
    }
> {
  if (!env.ADMIN_TOKEN?.trim()) {
    return { ok: false, status: 503, error: "Admin token is not configured" };
  }
  if (!header?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing admin bearer token" };
  }
  const provided = header.slice("Bearer ".length).trim();
  const [providedHash, expectedHash] = await Promise.all([
    sha256(provided),
    sha256(env.ADMIN_TOKEN.trim()),
  ]);
  if (providedHash !== expectedHash) {
    return { ok: false, status: 401, error: "Invalid admin bearer token" };
  }
  return { ok: true };
}

function boundedInteger(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function positiveInteger(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalPositiveInteger(
  value: string | undefined,
): number | false | null {
  if (!value) {
    return null;
  }
  return positiveInteger(value) ?? false;
}

function auditLogJson(row: AuditLogRecord): Record<string, unknown> {
  return {
    id: row.id,
    occurred_at: row.occurred_at,
    event: row.event,
    owner: row.owner,
    repo: row.repo,
    pr_number: row.pr_number,
    head_sha: row.head_sha,
    gate_id: row.gate_id,
    installation_id: row.installation_id,
    actor_login: row.actor_login,
    details: parseAuditDetails(row.details_json),
  };
}

function parseAuditDetails(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {
      parse_error: true,
    };
  }
  return {};
}

async function rateLimitResponse(
  env: Env,
  rawKey: string,
  limit: number,
  windowSeconds: number,
  context: RateLimitAuditContext,
): Promise<Response | null> {
  const keyHash = await sha256(rawKey);
  const result = await hitRateLimit(env.DB, {
    key: keyHash,
    limit,
    windowSeconds,
  });
  if (!result.limited) {
    return null;
  }
  await createAuditLog(env.DB, {
    event: "rate_limited",
    owner: context.owner,
    repo: context.repo,
    prNumber: context.prNumber,
    headSha: context.headSha,
    gateId: context.gateId,
    installationId: context.installationId,
    actorLogin: context.actorLogin,
    details: {
      ...context.details,
      key_hash: keyHash,
      limit,
      window_seconds: windowSeconds,
      reset_at: result.resetAt,
    },
  });
  const retryAfter = Math.max(
    Math.ceil((Date.parse(result.resetAt) - Date.now()) / 1000),
    1,
  );
  return Response.json(
    {
      error: "Rate limit exceeded",
      retry_after_seconds: retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": result.resetAt,
      },
    },
  );
}

function gateRateLimitContext(
  gate: GateRecord,
  scope: string,
  actorLogin: string,
): RateLimitAuditContext {
  return {
    owner: gate.owner,
    repo: gate.repo,
    prNumber: gate.pr_number,
    headSha: gate.head_sha,
    gateId: gate.id,
    installationId: gate.installation_id,
    actorLogin,
    details: {
      scope,
    },
  };
}

function gateAuditInput(
  gate: GateRecord,
  event: string,
  input: {
    actorLogin?: string;
    details?: Record<string, unknown>;
  } = {},
): AuditLogInput {
  return {
    event,
    owner: gate.owner,
    repo: gate.repo,
    prNumber: gate.pr_number,
    headSha: gate.head_sha,
    gateId: gate.id,
    installationId: gate.installation_id,
    actorLogin: input.actorLogin,
    details: input.details,
  };
}

function clientIp(request: Request): string {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return request.headers.get("cf-connecting-ip") ?? forwarded ?? "unknown";
}

function pendingComment(gate: GateRecord, reasons: string[]): string {
  const shortSha = gate.head_sha.slice(0, 7);
  return `${commentMarker(gate.owner, gate.repo, gate.pr_number)}
## Human check required

This repository uses pr-captcha to mark real human presence before this PR becomes maintainer work.

Please complete a quick browser verification for this exact commit.

[Complete human check](${gate.gate_url})

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

Human-origin check recorded for commit \`${gate.head_sha.slice(0, 7)}\`.

Verified GitHub user: \`${solver.login}\`

If a new commit is pushed, pr-captcha will require verification again.`;
}

function skippedComment(gate: GateRecord): string {
  return `${commentMarker(gate.owner, gate.repo, gate.pr_number)}
## Human check not required

pr-captcha is no longer gating commit \`${gate.head_sha.slice(0, 7)}\`.

This SHA can continue without a browser verification.`;
}

function commentMarker(owner: string, repo: string, prNumber: number): string {
  return `<!-- pr-captcha:${owner}/${repo}#${prNumber} -->`;
}

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
}

const requiredEnvNames = [
  "APP_BASE_URL",
  "GITHUB_APP_ID",
  "GITHUB_PRIVATE_KEY",
  "GITHUB_WEBHOOK_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "SESSION_SECRET",
] as const;

function missingRequiredEnv(env: Env): string[] {
  const missing = requiredEnvNames.filter((name) => !env[name]?.trim());
  if (!missing.includes("APP_BASE_URL") && !validAppBaseUrl(env)) {
    missing.push("APP_BASE_URL");
  }
  return missing;
}

function validAppBaseUrl(env: Pick<Env, "APP_BASE_URL">): boolean {
  try {
    const url = new URL(appBaseUrl(env));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default {
  fetch: app.fetch,
  async scheduled(_controller, env): Promise<void> {
    const result = await cleanupExpiredRows(env.DB);
    await createAuditLog(env.DB, {
      event: "cleanup.completed",
      details: result,
    });
  },
} satisfies ExportedHandler<Env>;
