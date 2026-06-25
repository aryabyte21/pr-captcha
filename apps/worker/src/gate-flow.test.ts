import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256, signPayload } from "./crypto";
import { app } from "./index";
import type { Env } from "./env";
import type { AuditLogRecord } from "./db";
import type { GateRecord, VerificationRecord } from "./types";

describe("gate verification flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates and solves a gate from a replayed fork pull request webhook fixture", async () => {
    const db = gateFlowDb();
    const env = await envWith(db);
    const requests: Array<{ method: string; url: URL; body: unknown }> = [];

    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        const body =
          typeof init?.body === "string" ? JSON.parse(init.body) : null;
        requests.push({ method, url, body });

        if (url.hostname === "challenges.cloudflare.com") {
          return Response.json({ success: true });
        }
        if (
          url.pathname === "/app/installations/123/access_tokens" &&
          method === "POST"
        ) {
          return Response.json({ token: "installation-token" });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/pulls/184" &&
          method === "GET"
        ) {
          return Response.json(pullRequestFor(pendingGate));
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/contents/.github/pr-captcha.yml" &&
          method === "GET"
        ) {
          return Response.json({
            encoding: "base64",
            content: btoa(`mode: required_check
comment:
  enabled: false
`),
          });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs" &&
          method === "POST"
        ) {
          return Response.json({ id: 777 });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs/777" &&
          method === "PATCH"
        ) {
          return Response.json({ id: 777 });
        }

        throw new Error(`Unexpected request: ${method} ${url.href}`);
      },
    );

    const webhookBody = await pullRequestWebhookFixture();
    const webhookResponse = await app.request(
      "/webhooks/github",
      {
        method: "POST",
        headers: {
          "x-github-delivery": "delivery-e2e",
          "x-github-event": "pull_request",
          "x-hub-signature-256": await githubSignature(webhookBody),
        },
        body: webhookBody,
      },
      env,
    );

    expect(webhookResponse.status).toBe(200);
    await expect(webhookResponse.json()).resolves.toMatchObject({
      ok: true,
      gated: true,
      reasons: expect.arrayContaining([
        "first-time contributor",
        "fork pull request",
      ]),
    });
    const gate = [...db.gates.values()][0];
    expect(gate).toMatchObject({
      installation_id: "123",
      owner: "octo-org",
      repo: "awesome-repo",
      pr_number: 184,
      head_sha: "8f31c9a",
      pr_author: "some-user",
      status: "pending",
      check_run_id: 777,
      comment_id: null,
    });
    expect(gate?.gate_nonce_hash).toBeTruthy();
    expect(db.deliveries.get("delivery-e2e")?.status).toBe("completed");
    expect(db.auditRows.map((row) => row.event)).toEqual(
      expect.arrayContaining(["gate.created"]),
    );
    const pendingCheck = requests.find(
      (request) =>
        request.method === "POST" &&
        request.url.pathname === "/repos/octo-org/awesome-repo/check-runs",
    );
    expect(pendingCheck?.body).toMatchObject({
      name: "pr-captcha/human",
      head_sha: "8f31c9a",
      conclusion: "action_required",
      output: {
        title: "Human check required",
      },
    });

    const pendingStatus = await app.request(
      "/api/v1/verifications/status?owner=octo-org&repo=awesome-repo&pr=184&sha=8f31c9a",
      {},
      env,
    );
    expect(pendingStatus.status).toBe(200);
    const pendingStatusJson = (await pendingStatus.json()) as {
      verification_url?: string | null;
    };
    expect(pendingStatusJson).toMatchObject({
      verified: false,
    });
    const verificationUrl = String(pendingStatusJson.verification_url);
    expect(verificationUrl).toContain(`/gate/${gate?.id}?token=`);
    const gateUrl = new URL(verificationUrl);
    const token = gateUrl.searchParams.get("token") ?? "";
    const session = await sessionCookie("some-user");
    const gateResponse = await app.request(
      `${gateUrl.pathname}${gateUrl.search}`,
      {
        headers: {
          cookie: session,
        },
      },
      env,
    );

    expect(gateResponse.status).toBe(200);
    const gateHtml = await gateResponse.text();
    expect(gateHtml).toContain("Complete human check");
    const csrfToken = csrfFrom(gateHtml);

    const solveResponse = await app.request(
      gateUrl.pathname,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: session,
          "cf-connecting-ip": "203.0.113.10",
        },
        body: new URLSearchParams({
          token,
          csrf_token: csrfToken,
          "cf-turnstile-response": "captcha-token",
        }),
      },
      env,
    );

    expect(solveResponse.status).toBe(200);
    await expect(solveResponse.text()).resolves.toContain("Human check passed");
    expect(db.gates.get(gate?.id ?? "")).toMatchObject({
      status: "verified",
      gate_nonce_hash: null,
      check_run_id: 777,
    });
    expect(db.verifications.get(verificationKey(pendingGate))).toMatchObject({
      solver_login: "some-user",
      head_sha: "8f31c9a",
      captcha_provider: "cloudflare_turnstile",
    });
    expect(db.auditRows.map((row) => row.event)).toEqual(
      expect.arrayContaining(["gate.viewed", "gate.solved", "gate.published"]),
    );
    const verifiedCheck = requests.find(
      (request) =>
        request.method === "PATCH" &&
        request.url.pathname === "/repos/octo-org/awesome-repo/check-runs/777",
    );
    expect(verifiedCheck?.body).toMatchObject({
      conclusion: "success",
      output: {
        title: "Human check passed",
      },
    });

    const verifiedStatus = await app.request(
      "/api/v1/verifications/status?owner=octo-org&repo=awesome-repo&pr=184&sha=8f31c9a",
      {},
      env,
    );
    expect(verifiedStatus.status).toBe(200);
    await expect(verifiedStatus.json()).resolves.toMatchObject({
      verified: true,
      solver_login: "some-user",
    });
  });

  it("blocks the Action before verification and passes it after solving the gate", async () => {
    const db = gateFlowDb();
    const env = await envWith(db);
    const requests: Array<{ method: string; url: URL; body: unknown }> = [];

    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const request =
          input instanceof Request ? input : new Request(String(input), init);
        const url = new URL(request.url);
        const method = request.method;
        const text =
          method === "GET" || method === "HEAD" ? "" : await request.text();
        const body = parseRequestBody(text);
        requests.push({ method, url, body });

        if (url.origin === "https://captcha.example.test") {
          const workerRequest: RequestInit = {
            method,
            headers: request.headers,
          };
          if (text) {
            workerRequest.body = text;
          }
          return app.request(
            `${url.pathname}${url.search}`,
            workerRequest,
            env,
          );
        }
        if (url.hostname === "challenges.cloudflare.com") {
          return Response.json({ success: true });
        }
        if (
          url.pathname === "/app/installations/123/access_tokens" &&
          method === "POST"
        ) {
          return Response.json({ token: "installation-token" });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/pulls/184" &&
          method === "GET"
        ) {
          return Response.json(pullRequestFor(pendingGate));
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/contents/.github/pr-captcha.yml" &&
          method === "GET"
        ) {
          return Response.json({
            encoding: "base64",
            content: btoa(`mode: hybrid
comment:
  enabled: false
universal_gate:
  rerun_after_verification: true
`),
          });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs" &&
          method === "POST"
        ) {
          return Response.json({ id: 777 });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs/777" &&
          method === "PATCH"
        ) {
          return Response.json({ id: 777 });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/actions/runs" &&
          method === "GET"
        ) {
          const status = url.searchParams.get("status");
          return Response.json({
            workflow_runs: status
              ? [
                  {
                    id: 66,
                    event: "pull_request",
                    status: "completed",
                    conclusion: "failure",
                    head_sha: pendingGate.head_sha,
                  },
                ]
              : [
                  {
                    id: 55,
                    event: "pull_request",
                    status: "action_required",
                    conclusion: null,
                    head_sha: pendingGate.head_sha,
                  },
                ],
          });
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/actions/runs/55/approve" &&
          method === "POST"
        ) {
          return new Response(null, { status: 204 });
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/actions/runs/66/rerun-failed-jobs" &&
          method === "POST"
        ) {
          return new Response(null, { status: 204 });
        }

        throw new Error(`Unexpected request: ${method} ${url.href}`);
      },
    );

    const webhookBody = pullRequestWebhookBody();
    const webhookResponse = await app.request(
      "/webhooks/github",
      {
        method: "POST",
        headers: {
          "x-github-delivery": "delivery-action-e2e",
          "x-github-event": "pull_request",
          "x-hub-signature-256": await githubSignature(webhookBody),
        },
        body: webhookBody,
      },
      env,
    );

    expect(webhookResponse.status).toBe(200);
    const gate = [...db.gates.values()][0];
    expect(gate).toMatchObject({
      status: "pending",
      check_run_id: 777,
    });

    const pendingAction = await runActionAgainstWorker();
    expect(pendingAction.exitCode).toBe(1);
    expect(pendingAction.logs).toEqual([]);
    expect(pendingAction.errors).toEqual([
      expect.stringContaining(
        "Human verification required before heavy CI can run: https://captcha.example.test/gate/",
      ),
    ]);

    const pendingError = pendingAction.errors[0];
    expect(pendingError).toBeDefined();
    const gateUrl = new URL(pendingError?.split(": ").at(-1) ?? "");
    const token = gateUrl.searchParams.get("token") ?? "";
    const session = await sessionCookie(pendingGate.pr_author);
    const gateResponse = await app.request(
      `${gateUrl.pathname}${gateUrl.search}`,
      {
        headers: {
          cookie: session,
        },
      },
      env,
    );
    expect(gateResponse.status).toBe(200);
    const csrfToken = csrfFrom(await gateResponse.text());

    const solveResponse = await app.request(
      gateUrl.pathname,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: session,
          "cf-connecting-ip": "203.0.113.10",
        },
        body: new URLSearchParams({
          token,
          csrf_token: csrfToken,
          "cf-turnstile-response": "captcha-token",
        }),
      },
      env,
    );

    expect(solveResponse.status).toBe(200);
    await expect(solveResponse.text()).resolves.toContain("Human check passed");

    const verifiedAction = await runActionAgainstWorker();
    expect(verifiedAction.exitCode).toBeUndefined();
    expect(verifiedAction.errors).toEqual([]);
    expect(verifiedAction.logs).toEqual([
      expect.stringMatching(/^pr-captcha verified by some-user at /),
    ]);

    expect(db.gates.get(gate?.id ?? "")).toMatchObject({
      status: "verified",
      gate_nonce_hash: null,
      check_run_id: 777,
    });
    expect(db.verifications.get(verificationKey(pendingGate))).toMatchObject({
      solver_login: "some-user",
      head_sha: "8f31c9a",
    });
    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.url.pathname ===
            "/repos/octo-org/awesome-repo/actions/runs/55/approve",
      ),
    ).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.method === "POST" &&
          request.url.pathname ===
            "/repos/octo-org/awesome-repo/actions/runs/66/rerun-failed-jobs",
      ),
    ).toBe(true);
    const verifiedCheck = requests.find(
      (request) =>
        request.method === "PATCH" &&
        request.url.pathname === "/repos/octo-org/awesome-repo/check-runs/777",
    );
    expect(verifiedCheck?.body).toMatchObject({
      conclusion: "success",
      output: {
        title: "Human check passed",
      },
    });
  });

  it("records a SHA-bound human verification and publishes the check", async () => {
    const token = await gateToken(pendingGate);
    const gate = {
      ...pendingGate,
      gate_token_hash: await sha256(token),
      gate_nonce_hash: await sha256("nonce"),
    };
    const db = gateFlowDb(gate);
    const env = await envWith(db);
    const requests: Array<{ method: string; url: URL; body: unknown }> = [];

    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        const body =
          typeof init?.body === "string" ? JSON.parse(init.body) : null;
        requests.push({ method, url, body });

        if (url.hostname === "challenges.cloudflare.com") {
          return Response.json({ success: true });
        }
        if (
          url.pathname === "/app/installations/123/access_tokens" &&
          method === "POST"
        ) {
          return Response.json({ token: "installation-token" });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/pulls/184" &&
          method === "GET"
        ) {
          return Response.json(pullRequestFor(gate));
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/contents/.github/pr-captcha.yml" &&
          method === "GET"
        ) {
          return Response.json({
            encoding: "base64",
            content: btoa(`mode: required_check
comment:
  enabled: false
`),
          });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs" &&
          method === "POST"
        ) {
          return Response.json({ id: 987 });
        }

        throw new Error(`Unexpected request: ${method} ${url.href}`);
      },
    );

    const session = await sessionCookie(gate.pr_author);
    const gateResponse = await app.request(
      `/gate/${gate.id}?token=${encodeURIComponent(token)}`,
      {
        headers: {
          cookie: session,
        },
      },
      env,
    );

    expect(gateResponse.status).toBe(200);
    const gateHtml = await gateResponse.text();
    expect(gateHtml).toContain("Complete human check");
    const csrfToken = csrfFrom(gateHtml);

    const form = new URLSearchParams({
      token,
      csrf_token: csrfToken,
      "cf-turnstile-response": "captcha-token",
    });
    const solveResponse = await app.request(
      `/gate/${gate.id}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: session,
          "cf-connecting-ip": "203.0.113.10",
        },
        body: form,
      },
      env,
    );

    expect(solveResponse.status).toBe(200);
    await expect(solveResponse.text()).resolves.toContain("Human check passed");
    expect(db.gates.get(gate.id)).toMatchObject({
      status: "verified",
      gate_nonce_hash: null,
      check_run_id: 987,
    });
    expect(db.verifications.get(verificationKey(gate))).toMatchObject({
      solver_login: gate.pr_author,
      head_sha: gate.head_sha,
      captcha_provider: "cloudflare_turnstile",
    });
    expect(db.auditRows.map((row) => row.event)).toEqual(
      expect.arrayContaining(["gate.viewed", "gate.solved", "gate.published"]),
    );
    const checkCreate = requests.find(
      (request) =>
        request.method === "POST" &&
        request.url.pathname === "/repos/octo-org/awesome-repo/check-runs",
    );
    expect(checkCreate?.body).toMatchObject({
      name: "pr-captcha/human",
      head_sha: gate.head_sha,
      status: "completed",
      conclusion: "success",
      output: {
        title: "Human check passed",
      },
    });

    const statusResponse = await app.request(
      `/api/v1/verifications/status?owner=${gate.owner}&repo=${gate.repo}&pr=${gate.pr_number}&sha=${gate.head_sha}`,
      {},
      env,
    );

    expect(statusResponse.status).toBe(200);
    await expect(statusResponse.json()).resolves.toMatchObject({
      verified: true,
      solver_login: gate.pr_author,
    });
  });

  it("rejects non-author verification from users without repository write access", async () => {
    const token = await gateToken(pendingGate);
    const gate = {
      ...pendingGate,
      gate_token_hash: await sha256(token),
      gate_nonce_hash: await sha256("nonce"),
    };
    const db = gateFlowDb(gate);
    const env = await envWith(db);
    const requests: Array<{ method: string; url: URL }> = [];

    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

        if (url.hostname === "challenges.cloudflare.com") {
          return Response.json({ success: true });
        }
        if (
          url.pathname === "/app/installations/123/access_tokens" &&
          method === "POST"
        ) {
          return Response.json({ token: "installation-token" });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/pulls/184" &&
          method === "GET"
        ) {
          return Response.json(pullRequestFor(gate));
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/contents/.github/pr-captcha.yml" &&
          method === "GET"
        ) {
          return Response.json({
            encoding: "base64",
            content: btoa(`mode: required_check
require:
  solver_must_be_pr_author: false
comment:
  enabled: false
`),
          });
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/collaborators/random-user/permission" &&
          method === "GET"
        ) {
          return Response.json({
            permission: "read",
            role_name: "read",
          });
        }

        throw new Error(`Unexpected request: ${method} ${url.href}`);
      },
    );

    const session = await sessionCookie("random-user");
    const gateResponse = await app.request(
      `/gate/${gate.id}?token=${encodeURIComponent(token)}`,
      {
        headers: {
          cookie: session,
        },
      },
      env,
    );

    expect(gateResponse.status).toBe(200);
    const csrfToken = csrfFrom(await gateResponse.text());
    const solveResponse = await app.request(
      `/gate/${gate.id}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: session,
          "cf-connecting-ip": "203.0.113.10",
        },
        body: new URLSearchParams({
          token,
          csrf_token: csrfToken,
          "cf-turnstile-response": "captcha-token",
        }),
      },
      env,
    );

    expect(solveResponse.status).toBe(403);
    await expect(solveResponse.text()).resolves.toContain(
      "PR author or a repository maintainer",
    );
    expect(db.gates.get(gate.id)).toMatchObject({
      status: "pending",
      gate_nonce_hash: await sha256("nonce"),
    });
    expect(db.verifications.size).toBe(0);
    expect(
      requests.some(
        (request) =>
          request.url.pathname === "/repos/octo-org/awesome-repo/check-runs",
      ),
    ).toBe(false);
    expect(db.auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "gate.denied",
          actor_login: "random-user",
        }),
      ]),
    );
  });

  it("allows a repository maintainer to verify when maintainer override is configured", async () => {
    const token = await gateToken(pendingGate);
    const gate = {
      ...pendingGate,
      gate_token_hash: await sha256(token),
      gate_nonce_hash: await sha256("nonce"),
    };
    const db = gateFlowDb(gate);
    const env = await envWith(db);

    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";

        if (url.hostname === "challenges.cloudflare.com") {
          return Response.json({ success: true });
        }
        if (
          url.pathname === "/app/installations/123/access_tokens" &&
          method === "POST"
        ) {
          return Response.json({ token: "installation-token" });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/pulls/184" &&
          method === "GET"
        ) {
          return Response.json(pullRequestFor(gate));
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/contents/.github/pr-captcha.yml" &&
          method === "GET"
        ) {
          return Response.json({
            encoding: "base64",
            content: btoa(`mode: required_check
require:
  solver_must_be_pr_author: false
comment:
  enabled: false
`),
          });
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/collaborators/maintainer/permission" &&
          method === "GET"
        ) {
          return Response.json({
            permission: "write",
            role_name: "maintain",
          });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs" &&
          method === "POST"
        ) {
          return Response.json({ id: 987 });
        }

        throw new Error(`Unexpected request: ${method} ${url.href}`);
      },
    );

    const session = await sessionCookie("maintainer");
    const gateResponse = await app.request(
      `/gate/${gate.id}?token=${encodeURIComponent(token)}`,
      {
        headers: {
          cookie: session,
        },
      },
      env,
    );

    expect(gateResponse.status).toBe(200);
    const csrfToken = csrfFrom(await gateResponse.text());
    const solveResponse = await app.request(
      `/gate/${gate.id}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: session,
          "cf-connecting-ip": "203.0.113.10",
        },
        body: new URLSearchParams({
          token,
          csrf_token: csrfToken,
          "cf-turnstile-response": "captcha-token",
        }),
      },
      env,
    );

    expect(solveResponse.status).toBe(200);
    await expect(solveResponse.text()).resolves.toContain("Human check passed");
    expect(db.gates.get(gate.id)).toMatchObject({
      status: "verified",
      gate_nonce_hash: null,
      check_run_id: 987,
    });
    expect(db.verifications.get(verificationKey(gate))).toMatchObject({
      solver_login: "maintainer",
    });
  });

  it("allows a repository maintainer to verify bot-authored pull requests", async () => {
    const botGate = {
      ...pendingGate,
      pr_author: "dependabot[bot]",
    };
    const token = await gateToken(botGate);
    const gate = {
      ...botGate,
      gate_token_hash: await sha256(token),
      gate_nonce_hash: await sha256("nonce"),
    };
    const db = gateFlowDb(gate);
    const env = await envWith(db);

    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";

        if (url.hostname === "challenges.cloudflare.com") {
          return Response.json({ success: true });
        }
        if (
          url.pathname === "/app/installations/123/access_tokens" &&
          method === "POST"
        ) {
          return Response.json({ token: "installation-token" });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/pulls/184" &&
          method === "GET"
        ) {
          return Response.json(pullRequestFor(gate, { userType: "Bot" }));
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/contents/.github/pr-captcha.yml" &&
          method === "GET"
        ) {
          return Response.json({
            encoding: "base64",
            content: btoa(`mode: required_check
comment:
  enabled: false
`),
          });
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/collaborators/maintainer/permission" &&
          method === "GET"
        ) {
          return Response.json({
            permission: "admin",
            role_name: "admin",
          });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs" &&
          method === "POST"
        ) {
          return Response.json({ id: 987 });
        }

        throw new Error(`Unexpected request: ${method} ${url.href}`);
      },
    );

    const session = await sessionCookie("maintainer");
    const gateResponse = await app.request(
      `/gate/${gate.id}?token=${encodeURIComponent(token)}`,
      {
        headers: {
          cookie: session,
        },
      },
      env,
    );

    expect(gateResponse.status).toBe(200);
    const csrfToken = csrfFrom(await gateResponse.text());
    const solveResponse = await app.request(
      `/gate/${gate.id}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: session,
          "cf-connecting-ip": "203.0.113.10",
        },
        body: new URLSearchParams({
          token,
          csrf_token: csrfToken,
          "cf-turnstile-response": "captcha-token",
        }),
      },
      env,
    );

    expect(solveResponse.status).toBe(200);
    await expect(solveResponse.text()).resolves.toContain("Human check passed");
    expect(db.verifications.get(verificationKey(gate))).toMatchObject({
      pr_author: "dependabot[bot]",
      solver_login: "maintainer",
    });
  });

  it("rejects failed CAPTCHA submissions before calling GitHub", async () => {
    const token = await gateToken(pendingGate);
    const gate = {
      ...pendingGate,
      gate_token_hash: await sha256(token),
      gate_nonce_hash: await sha256("nonce"),
    };
    const db = gateFlowDb(gate);
    const env = await envWith(db);
    const requests: Array<{ method: string; url: URL }> = [];

    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

        if (url.hostname === "challenges.cloudflare.com") {
          return Response.json({ success: false });
        }

        throw new Error(`GitHub should not be called: ${method} ${url.href}`);
      },
    );

    const session = await sessionCookie(gate.pr_author);
    const gateResponse = await app.request(
      `/gate/${gate.id}?token=${encodeURIComponent(token)}`,
      {
        headers: {
          cookie: session,
        },
      },
      env,
    );

    expect(gateResponse.status).toBe(200);
    const csrfToken = csrfFrom(await gateResponse.text());

    const solveResponse = await app.request(
      `/gate/${gate.id}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: session,
          "cf-connecting-ip": "203.0.113.10",
        },
        body: new URLSearchParams({
          token,
          csrf_token: csrfToken,
          "cf-turnstile-response": "bad-captcha-token",
        }),
      },
      env,
    );

    expect(solveResponse.status).toBe(400);
    await expect(solveResponse.text()).resolves.toContain(
      "CAPTCHA verification failed",
    );
    expect(requests).toEqual([
      {
        method: "POST",
        url: new URL(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        ),
      },
    ]);
    expect(db.gates.get(gate.id)).toMatchObject({
      status: "pending",
      gate_nonce_hash: await sha256("nonce"),
      check_run_id: null,
    });
    expect(db.verifications.size).toBe(0);
    expect(db.auditRows.map((row) => row.event)).toEqual(
      expect.arrayContaining(["gate.viewed", "gate.denied"]),
    );
  });
});

const pendingGate: GateRecord = {
  id: "gate-1",
  installation_id: "123",
  owner: "octo-org",
  repo: "awesome-repo",
  pr_number: 184,
  head_sha: "8f31c9a",
  pr_author: "some-user",
  status: "pending",
  gate_url: "https://captcha.example.test/gate/gate-1",
  gate_token_hash: "token-hash",
  gate_nonce_hash: "nonce-hash",
  check_run_id: null,
  comment_id: null,
  last_error: null,
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
  expires_at: "2026-07-14T00:00:00.000Z",
};

async function gateToken(gate: GateRecord): Promise<string> {
  return signPayload(
    {
      gate_id: gate.id,
      owner: gate.owner,
      repo: gate.repo,
      pr_number: gate.pr_number,
      head_sha: gate.head_sha,
      nonce: "nonce",
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    "session-secret",
  );
}

async function sessionCookie(login: string): Promise<string> {
  const token = await signPayload(
    {
      id: 1,
      login,
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    "session-secret",
  );
  return `pr_captcha_session=${token}`;
}

function csrfFrom(html: string): string {
  const match = html.match(/name="csrf_token" value="([^"]+)"/);
  if (!match?.[1]) {
    throw new Error("CSRF token was not rendered");
  }
  return match[1];
}

function parseRequestBody(text: string): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function runActionAgainstWorker(): Promise<{
  errors: string[];
  exitCode: unknown;
  logs: string[];
}> {
  const processRef = (
    globalThis as unknown as {
      process: {
        env: Record<string, string | undefined>;
        exitCode: unknown;
      };
    }
  ).process;
  const fsPath = "node:fs";
  const osPath = "node:os";
  const pathPath = "node:path";
  const { mkdtempSync, rmSync, writeFileSync } = (await import(fsPath)) as {
    mkdtempSync: (path: string) => string;
    rmSync: (
      path: string,
      options: { recursive: boolean; force: boolean },
    ) => void;
    writeFileSync: (path: string, data: string) => void;
  };
  const { tmpdir } = (await import(osPath)) as { tmpdir: () => string };
  const { join } = (await import(pathPath)) as {
    join: (...parts: string[]) => string;
  };
  const previousEnv = { ...processRef.env };
  const previousExitCode = processRef.exitCode;
  const previousLog = console.log;
  const previousError = console.error;
  const dir = mkdtempSync(join(tmpdir(), "pr-captcha-action-e2e-"));
  const eventPath = join(dir, "event.json");
  const logs: string[] = [];
  const errors: string[] = [];

  writeFileSync(
    eventPath,
    JSON.stringify({
      repository: {
        name: pendingGate.repo,
        owner: {
          login: pendingGate.owner,
        },
      },
      pull_request: {
        number: pendingGate.pr_number,
        head: {
          sha: pendingGate.head_sha,
        },
      },
    }),
  );

  try {
    processRef.exitCode = undefined;
    processRef.env = {
      ...previousEnv,
      GITHUB_EVENT_PATH: eventPath,
      INPUT_API_URL: "https://captcha.example.test/",
    };
    console.log = (message?: unknown) => {
      logs.push(String(message));
    };
    console.error = (message?: unknown) => {
      errors.push(String(message));
    };

    const actionUrl = new URL(
      "../../../packages/action/src/index.ts",
      import.meta.url,
    );
    actionUrl.searchParams.set("case", crypto.randomUUID());
    const action = (await import(actionUrl.href)) as {
      run: () => Promise<void>;
    };
    await action.run();

    return {
      errors,
      exitCode: processRef.exitCode,
      logs,
    };
  } finally {
    processRef.env = previousEnv;
    processRef.exitCode = previousExitCode;
    console.log = previousLog;
    console.error = previousError;
    rmSync(dir, { recursive: true, force: true });
  }
}

async function envWith(db: D1Database): Promise<Env> {
  return {
    DB: db,
    APP_BASE_URL: "https://captcha.example.test",
    GITHUB_APP_ID: "12345",
    GITHUB_PRIVATE_KEY: await testPrivateKey(),
    GITHUB_WEBHOOK_SECRET: "webhook-secret",
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
    TURNSTILE_SITE_KEY: "turnstile-site-key",
    TURNSTILE_SECRET_KEY: "turnstile-secret-key",
    SESSION_SECRET: "session-secret",
  };
}

function gateFlowDb(gate?: GateRecord): D1Database & {
  auditRows: AuditLogRecord[];
  buckets: Map<
    string,
    { window_start: string; count: number; expires_at: string }
  >;
  deliveries: Map<
    string,
    { event: string; status: string; updated_at: string }
  >;
  gates: Map<string, GateRecord>;
  verifications: Map<string, VerificationRecord>;
} {
  const buckets = new Map<
    string,
    { window_start: string; count: number; expires_at: string }
  >();
  const deliveries = new Map<
    string,
    { event: string; status: string; updated_at: string }
  >();
  const gates = new Map(gate ? [[gate.id, { ...gate }]] : []);
  const verifications = new Map<string, VerificationRecord>();
  const auditRows: AuditLogRecord[] = [];
  const db = {
    auditRows,
    buckets,
    deliveries,
    gates,
    verifications,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            run: async () => {
              if (sql.startsWith("insert or ignore into webhook_deliveries")) {
                const id = String(values[0]);
                if (deliveries.has(id)) {
                  return { meta: { changes: 0 } };
                }
                deliveries.set(id, {
                  event: String(values[1]),
                  status: "processing",
                  updated_at: String(values[3]),
                });
                return { meta: { changes: 1 } };
              }
              if (
                sql.includes(
                  "where id = ? and status = 'processing' and updated_at <= ?",
                )
              ) {
                const event = String(values[0]);
                const now = String(values[1]);
                const id = String(values[2]);
                const cutoff = String(values[3]);
                const delivery = deliveries.get(id);
                if (
                  delivery?.status === "processing" &&
                  delivery.updated_at <= cutoff
                ) {
                  delivery.event = event;
                  delivery.updated_at = now;
                  return { meta: { changes: 1 } };
                }
                return { meta: { changes: 0 } };
              }
              if (sql.startsWith("update webhook_deliveries")) {
                const id = String(values[1]);
                const delivery = deliveries.get(id);
                if (delivery) {
                  delivery.status = "completed";
                  delivery.updated_at = String(values[0]);
                }
                return { meta: { changes: delivery ? 1 : 0 } };
              }
              if (sql.startsWith("delete from webhook_deliveries")) {
                const id = String(values[0]);
                const deleted = deliveries.delete(id);
                return { meta: { changes: deleted ? 1 : 0 } };
              }
              if (sql.includes("delete from rate_limits")) {
                const now = String(values[0]);
                let changes = 0;
                for (const [key, bucket] of buckets) {
                  if (bucket.expires_at <= now) {
                    buckets.delete(key);
                    changes += 1;
                  }
                }
                return { meta: { changes } };
              }
              if (sql.includes("insert into rate_limits")) {
                const key = String(values[0]);
                const windowStart = String(values[1]);
                const expiresAt = String(values[2]);
                const existing = buckets.get(key);
                if (existing?.window_start === windowStart) {
                  existing.count += 1;
                  existing.expires_at = expiresAt;
                } else {
                  buckets.set(key, {
                    window_start: windowStart,
                    count: 1,
                    expires_at: expiresAt,
                  });
                }
                return { meta: { changes: 1 } };
              }
              if (sql.includes("insert into gates")) {
                const next: GateRecord = {
                  id: String(values[0]),
                  installation_id: String(values[1]),
                  owner: String(values[2]),
                  repo: String(values[3]),
                  pr_number: Number(values[4]),
                  head_sha: String(values[5]),
                  pr_author: String(values[6]),
                  status: values[7] as GateRecord["status"],
                  gate_url: String(values[8]),
                  gate_token_hash: String(values[9]),
                  gate_nonce_hash:
                    values[10] === null ? null : String(values[10]),
                  check_run_id: null,
                  comment_id: null,
                  last_error: null,
                  created_at: String(values[11]),
                  updated_at: String(values[12]),
                  expires_at: String(values[13]),
                };
                const existing = [...gates.values()].find(
                  (candidate) =>
                    candidate.owner === next.owner &&
                    candidate.repo === next.repo &&
                    candidate.pr_number === next.pr_number &&
                    candidate.head_sha === next.head_sha,
                );
                if (existing) {
                  existing.installation_id = next.installation_id;
                  existing.pr_author = next.pr_author;
                  existing.status = next.status;
                  existing.gate_url = next.gate_url;
                  existing.gate_token_hash = next.gate_token_hash;
                  existing.gate_nonce_hash = next.gate_nonce_hash;
                  existing.updated_at = next.updated_at;
                  existing.expires_at = next.expires_at;
                } else {
                  gates.set(next.id, next);
                }
                return { meta: { changes: 1 } };
              }
              if (sql.includes("insert into audit_logs")) {
                auditRows.push({
                  id: String(values[0]),
                  occurred_at: String(values[1]),
                  event: String(values[2]),
                  owner: nullableString(values[3]),
                  repo: nullableString(values[4]),
                  pr_number: nullableNumber(values[5]),
                  head_sha: nullableString(values[6]),
                  gate_id: nullableString(values[7]),
                  installation_id: nullableString(values[8]),
                  actor_login: nullableString(values[9]),
                  details_json: String(values[10]),
                });
                return { meta: { changes: 1 } };
              }
              if (sql.includes("update gates set gate_nonce_hash = null")) {
                const id = String(values[1]);
                const nonceHash = String(values[2]);
                const current = gates.get(id);
                if (current?.gate_nonce_hash === nonceHash) {
                  current.gate_nonce_hash = null;
                  current.updated_at = String(values[0]);
                  return { meta: { changes: 1 } };
                }
                return { meta: { changes: 0 } };
              }
              if (sql.includes("insert or ignore into verifications")) {
                const record: VerificationRecord = {
                  id: String(values[0]),
                  gate_id: String(values[1]),
                  installation_id: String(values[2]),
                  owner: String(values[3]),
                  repo: String(values[4]),
                  pr_number: Number(values[5]),
                  head_sha: String(values[6]),
                  pr_author: String(values[7]),
                  solver_login: String(values[8]),
                  captcha_provider: String(values[9]),
                  captcha_passed_at: String(values[10]),
                  expires_at: String(values[11]),
                };
                verifications.set(verificationKey(record), record);
                return { meta: { changes: 1 } };
              }
              if (sql.includes("update gates set status = 'verified'")) {
                const id = String(values[1]);
                const current = gates.get(id);
                if (current) {
                  current.status = "verified";
                  current.updated_at = String(values[0]);
                }
                return { meta: { changes: current ? 1 : 0 } };
              }
              if (sql.includes("update gates set check_run_id")) {
                const id = String(values[2]);
                const current = gates.get(id);
                if (current) {
                  current.check_run_id = Number(values[0]);
                  current.updated_at = String(values[1]);
                }
                return { meta: { changes: current ? 1 : 0 } };
              }
              if (sql.includes("update gates set comment_id")) {
                const id = String(values[2]);
                const current = gates.get(id);
                if (current) {
                  current.comment_id = Number(values[0]);
                  current.updated_at = String(values[1]);
                }
                return { meta: { changes: current ? 1 : 0 } };
              }
              if (sql.includes("update gates set last_error")) {
                const id = String(values[2]);
                const current = gates.get(id);
                if (current) {
                  current.last_error =
                    values[0] === null ? null : String(values[0]);
                  current.updated_at = String(values[1]);
                }
                return { meta: { changes: current ? 1 : 0 } };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
            first: async () => {
              if (sql.includes("from rate_limits")) {
                return buckets.get(String(values[0])) ?? null;
              }
              if (sql.includes("from gates where id")) {
                return gates.get(String(values[0])) ?? null;
              }
              if (sql.includes("from gates where owner")) {
                return (
                  [...gates.values()].find(
                    (candidate) =>
                      candidate.owner === String(values[0]) &&
                      candidate.repo === String(values[1]) &&
                      candidate.pr_number === Number(values[2]) &&
                      candidate.head_sha === String(values[3]),
                  ) ?? null
                );
              }
              if (sql.includes("from verifications")) {
                return (
                  verifications.get(
                    `${String(values[0])}/${String(values[1])}#${String(values[2])}@${String(values[3])}`,
                  ) ?? null
                );
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
          };
        },
      };
    },
  };
  return db as unknown as D1Database & {
    auditRows: AuditLogRecord[];
    buckets: Map<
      string,
      { window_start: string; count: number; expires_at: string }
    >;
    deliveries: Map<
      string,
      { event: string; status: string; updated_at: string }
    >;
    gates: Map<string, GateRecord>;
    verifications: Map<string, VerificationRecord>;
  };
}

function verificationKey(
  input: Pick<VerificationRecord, "owner" | "repo" | "pr_number" | "head_sha">,
): string {
  return `${input.owner}/${input.repo}#${input.pr_number}@${input.head_sha}`;
}

function nullableString(value: unknown): string | null {
  return value === null ? null : String(value);
}

function nullableNumber(value: unknown): number | null {
  return value === null ? null : Number(value);
}

function pullRequestFor(gate: GateRecord, options: { userType?: string } = {}) {
  return {
    number: gate.pr_number,
    draft: false,
    html_url: `https://github.com/${gate.owner}/${gate.repo}/pull/${gate.pr_number}`,
    author_association: "FIRST_TIME_CONTRIBUTOR",
    user: {
      login: gate.pr_author,
      type: options.userType ?? "User",
    },
    head: {
      sha: gate.head_sha,
      ref: "feature",
      repo: {
        full_name: `${gate.pr_author}/${gate.repo}`,
        fork: true,
        owner: {
          login: gate.pr_author,
        },
      },
    },
    base: {
      ref: "main",
      repo: {
        full_name: `${gate.owner}/${gate.repo}`,
        owner: {
          login: gate.owner,
        },
      },
    },
    labels: [],
  };
}

function pullRequestWebhookBody(): string {
  return JSON.stringify({
    action: "opened",
    installation: {
      id: 123,
    },
    repository: {
      name: pendingGate.repo,
      full_name: `${pendingGate.owner}/${pendingGate.repo}`,
      owner: {
        login: pendingGate.owner,
      },
      default_branch: "main",
    },
    pull_request: pullRequestFor(pendingGate),
  });
}

async function pullRequestWebhookFixture(): Promise<string> {
  const fsPath = "node:fs";
  const { readFileSync } = (await import(fsPath)) as {
    readFileSync: (path: URL, encoding: "utf8") => string;
  };
  return readFileSync(
    new URL("./fixtures/pull-request-opened-fork.json", import.meta.url),
    "utf8",
  );
}

async function githubSignature(body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode("webhook-secret"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hex = [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${hex}`;
}

async function testPrivateKey(): Promise<string> {
  const keyPair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const pkcs8 = (await crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey,
  )) as ArrayBuffer;
  return pem("PRIVATE KEY", new Uint8Array(pkcs8));
}

function pem(label: string, bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}
