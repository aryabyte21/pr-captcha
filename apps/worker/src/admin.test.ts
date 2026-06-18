import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "./index";
import type { Env } from "./env";
import type { GateRecord, VerificationRecord } from "./types";
import type { AuditLogRecord } from "./db";

describe("admin retry endpoint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires admin token configuration", async () => {
    const response = await app.request(
      "/api/admin/gates/gate-1/retry",
      {
        method: "POST",
      },
      {
        DB: adminDb(),
      } as unknown as Env,
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "Admin token is not configured",
    });
  });

  it("treats blank admin tokens as unconfigured", async () => {
    const response = await app.request(
      "/api/admin/gates/gate-1/retry",
      {
        method: "POST",
        headers: {
          authorization: "Bearer anything",
        },
      },
      {
        DB: adminDb(),
        ADMIN_TOKEN: "   ",
      } as unknown as Env,
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: "Admin token is not configured",
    });
  });

  it("requires a valid bearer token", async () => {
    const response = await app.request(
      "/api/admin/gates/gate-1/retry",
      {
        method: "POST",
        headers: {
          authorization: "Bearer wrong",
        },
      },
      {
        DB: adminDb(),
        ADMIN_TOKEN: "secret-admin-token",
      } as unknown as Env,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid admin bearer token",
    });
  });

  it("returns not found for an authorized missing gate", async () => {
    const response = await app.request(
      "/api/admin/gates/missing-gate/retry",
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: adminDb(),
        ADMIN_TOKEN: "secret-admin-token",
      } as unknown as Env,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "Gate not found",
    });
  });

  it("does not retry verified gates from installations outside the beta allowlist", async () => {
    const db = adminDb();
    db.gates.set("gate-1", verifiedGate({ installationId: "123" }));
    const response = await app.request(
      "/api/admin/gates/gate-1/retry",
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: db,
        ADMIN_TOKEN: "secret-admin-token",
        ALLOWED_INSTALLATION_IDS: "999",
      } as unknown as Env,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Installation is not allowed",
    });
  });

  it("updates an existing check when current config disables new checks", async () => {
    const db = adminDb();
    const gate = verifiedGate({ installationId: "123" });
    db.gates.set(gate.id, gate);
    db.verifications.set(verificationKey(gate), verificationFor(gate));
    const requests: Array<{ method: string; url: URL; body: unknown }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        const body =
          typeof init?.body === "string" ? JSON.parse(init.body) : null;
        requests.push({ method, url, body });

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
            content: btoa(`checks:
  create_required_check: false
comment:
  enabled: false
universal_gate:
  rerun_after_verification: false
`),
          });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs/1" &&
          method === "PATCH"
        ) {
          return Response.json({ id: 1 });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/issues/184/comments" &&
          method === "GET"
        ) {
          return Response.json([
            {
              id: 2,
              body: "<!-- pr-captcha:octo-org/awesome-repo#184 --> old",
              user: {
                type: "Bot",
              },
            },
          ]);
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/issues/comments/2" &&
          method === "PATCH"
        ) {
          return Response.json({ id: 2 });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/actions/runs" &&
          method === "GET"
        ) {
          return Response.json({ workflow_runs: [] });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    const response = await app.request(
      "/api/admin/gates/gate-1/retry",
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: db,
        ADMIN_TOKEN: "secret-admin-token",
        APP_BASE_URL: "https://captcha.example.test",
        GITHUB_APP_ID: "12345",
        GITHUB_PRIVATE_KEY: await testPrivateKey(),
        SESSION_SECRET: "session-secret",
      } as unknown as Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      approvedRuns: 0,
      rerunWorkflows: 0,
    });
    const checkPatch = requests.find(
      (request) =>
        request.method === "PATCH" &&
        request.url.pathname === "/repos/octo-org/awesome-repo/check-runs/1",
    );
    expect(checkPatch?.body).toMatchObject({
      status: "completed",
      conclusion: "success",
      output: {
        title: "Human check passed",
      },
    });
    const commentPatch = requests.find(
      (request) =>
        request.method === "PATCH" &&
        request.url.pathname ===
          "/repos/octo-org/awesome-repo/issues/comments/2",
    );
    expect(commentPatch?.body).toMatchObject({
      body: expect.stringContaining("Human check passed"),
    });
  });

  it("does not approve held workflows in required-check mode", async () => {
    const db = adminDb();
    const gate = verifiedGate({ installationId: "123" });
    db.gates.set(gate.id, gate);
    db.verifications.set(verificationKey(gate), verificationFor(gate));
    const requests: Array<{ method: string; url: URL }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

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
checks:
  create_required_check: false
comment:
  enabled: false
`),
          });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs/1" &&
          method === "PATCH"
        ) {
          return Response.json({ id: 1 });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    const response = await app.request(
      "/api/admin/gates/gate-1/retry",
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: db,
        ADMIN_TOKEN: "secret-admin-token",
        APP_BASE_URL: "https://captcha.example.test",
        GITHUB_APP_ID: "12345",
        GITHUB_PRIVATE_KEY: await testPrivateKey(),
        SESSION_SECRET: "session-secret",
      } as unknown as Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      approvedRuns: 0,
      rerunWorkflows: 0,
    });
    expect(
      requests.some((request) =>
        request.url.pathname.endsWith("/actions/runs"),
      ),
    ).toBe(false);
  });

  it("reruns failed workflows in universal mode without approving held runs", async () => {
    const db = adminDb();
    const gate = verifiedGate({ installationId: "123" });
    db.gates.set(gate.id, gate);
    db.verifications.set(verificationKey(gate), verificationFor(gate));
    const requests: Array<{ method: string; url: URL }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

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
            content: btoa(`mode: universal
checks:
  create_required_check: false
comment:
  enabled: false
universal_gate:
  rerun_after_verification: true
`),
          });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/check-runs/1" &&
          method === "PATCH"
        ) {
          return Response.json({ id: 1 });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo/actions/runs" &&
          url.searchParams.get("status") === "completed" &&
          method === "GET"
        ) {
          return Response.json({
            workflow_runs: [
              {
                id: 201,
                event: "pull_request",
                status: "completed",
                conclusion: "failure",
                head_sha: gate.head_sha,
              },
            ],
          });
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/actions/runs/201/rerun-failed-jobs" &&
          method === "POST"
        ) {
          return new Response(null, { status: 204 });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    const response = await app.request(
      "/api/admin/gates/gate-1/retry",
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: db,
        ADMIN_TOKEN: "secret-admin-token",
        APP_BASE_URL: "https://captcha.example.test",
        GITHUB_APP_ID: "12345",
        GITHUB_PRIVATE_KEY: await testPrivateKey(),
        SESSION_SECRET: "session-secret",
      } as unknown as Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      approvedRuns: 0,
      rerunWorkflows: 1,
    });
    expect(
      requests.some((request) =>
        request.url.pathname.endsWith("/actions/runs/201/approve"),
      ),
    ).toBe(false);
    expect(
      requests.some((request) =>
        request.url.pathname.endsWith("/actions/runs/201/rerun-failed-jobs"),
      ),
    ).toBe(true);
  });

  it("exports filtered audit logs for operators", async () => {
    const db = adminDb([
      {
        id: "audit-1",
        occurred_at: "2026-06-14T00:00:00.000Z",
        event: "gate.publish_failed",
        owner: "octo-org",
        repo: "awesome-repo",
        pr_number: 184,
        head_sha: "8f31c9a",
        gate_id: "gate-1",
        installation_id: "123",
        actor_login: "some-user",
        details_json: JSON.stringify({
          error: "GitHub API request failed: 500",
        }),
      },
    ]);
    const response = await app.request(
      "/api/admin/audit-logs?owner=octo-org&repo=awesome-repo&pr=184&event=gate.publish_failed&limit=10",
      {
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: db,
        ADMIN_TOKEN: "secret-admin-token",
      } as unknown as Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      logs: [
        {
          id: "audit-1",
          occurred_at: "2026-06-14T00:00:00.000Z",
          event: "gate.publish_failed",
          owner: "octo-org",
          repo: "awesome-repo",
          pr_number: 184,
          head_sha: "8f31c9a",
          gate_id: "gate-1",
          installation_id: "123",
          actor_login: "some-user",
          details: {
            error: "GitHub API request failed: 500",
          },
        },
      ],
      limit: 10,
    });
    expect(db.auditQuery?.values).toEqual([
      "octo-org",
      "awesome-repo",
      184,
      "gate.publish_failed",
      10,
    ]);
  });

  it("rejects invalid audit log PR filters", async () => {
    const response = await app.request(
      "/api/admin/audit-logs?pr=abc",
      {
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: adminDb(),
        ADMIN_TOKEN: "secret-admin-token",
      } as unknown as Env,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "pr must be a positive integer",
    });
  });

  it("rejects non-positive audit log PR filters", async () => {
    const response = await app.request(
      "/api/admin/audit-logs?pr=-1",
      {
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: adminDb(),
        ADMIN_TOKEN: "secret-admin-token",
      } as unknown as Env,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "pr must be a positive integer",
    });
  });

  it("rejects repository diagnostics without an installation id", async () => {
    const response = await app.request(
      "/api/admin/repositories/octo-org/awesome-repo/diagnostics",
      {
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: adminDb(),
        ADMIN_TOKEN: "secret-admin-token",
      } as unknown as Env,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "installation_id must be a positive integer",
    });
  });

  it("denies repository diagnostics outside the beta allowlist", async () => {
    const response = await app.request(
      "/api/admin/repositories/octo-org/awesome-repo/diagnostics?installation_id=123",
      {
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: adminDb(),
        ADMIN_TOKEN: "secret-admin-token",
        ALLOWED_INSTALLATION_IDS: "999",
      } as unknown as Env,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Installation is not allowed",
    });
  });

  it("returns repository diagnostics with effective config", async () => {
    const requests: Array<{ method: string; url: URL }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

        if (
          url.pathname === "/app/installations/123/access_tokens" &&
          method === "POST"
        ) {
          return Response.json({ token: "installation-token" });
        }
        if (
          url.pathname === "/repos/octo-org/awesome-repo" &&
          method === "GET"
        ) {
          return Response.json({
            full_name: "octo-org/awesome-repo",
            default_branch: "main",
          });
        }
        if (
          url.pathname ===
            "/repos/octo-org/awesome-repo/contents/.github/pr-captcha.yml" &&
          method === "GET"
        ) {
          return Response.json({
            encoding: "base64",
            content: btoa(`mode: required_check
checks:
  name: custom/human
`),
          });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    const response = await app.request(
      "/api/admin/repositories/octo-org/awesome-repo/diagnostics?installation_id=123",
      {
        headers: {
          authorization: "Bearer secret-admin-token",
        },
      },
      {
        DB: adminDb(),
        ADMIN_TOKEN: "secret-admin-token",
        GITHUB_APP_ID: "12345",
        GITHUB_PRIVATE_KEY: await testPrivateKey(),
      } as unknown as Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      repository: {
        owner: "octo-org",
        repo: "awesome-repo",
        full_name: "octo-org/awesome-repo",
        installation_id: "123",
        default_branch: "main",
        ref: "main",
      },
      config_source: "repository",
      config_valid: true,
      config: {
        mode: "required_check",
        checks: {
          create_required_check: true,
          name: "custom/human",
        },
      },
      setup: {
        required_check_name: "custom/human",
        creates_required_check: true,
      },
    });
    expect(
      requests.map((request) => [
        request.method,
        request.url.pathname,
        request.url.searchParams.get("ref"),
      ]),
    ).toEqual([
      ["POST", "/app/installations/123/access_tokens", null],
      ["GET", "/repos/octo-org/awesome-repo", null],
      [
        "GET",
        "/repos/octo-org/awesome-repo/contents/.github/pr-captcha.yml",
        "main",
      ],
    ]);
  });
});

function adminDb(auditRows: AuditLogRecord[] = []): D1Database & {
  buckets: Map<
    string,
    { window_start: string; count: number; expires_at: string }
  >;
  gates: Map<string, GateRecord>;
  verifications: Map<string, VerificationRecord>;
  auditQuery?: {
    sql: string;
    values: unknown[];
  };
} {
  const buckets = new Map<
    string,
    { window_start: string; count: number; expires_at: string }
  >();
  const gates = new Map<string, GateRecord>();
  const verifications = new Map<string, VerificationRecord>();
  const db = {
    buckets,
    gates,
    verifications,
    auditQuery: undefined as { sql: string; values: unknown[] } | undefined,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            run: async () => {
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
              if (sql.includes("insert into audit_logs")) {
                return { meta: { changes: 1 } };
              }
              if (sql.includes("update gates set check_run_id")) {
                const checkRunId = Number(values[0]);
                const id = String(values[2]);
                const gate = gates.get(id);
                if (gate) {
                  gate.check_run_id = checkRunId;
                }
                return { meta: { changes: gate ? 1 : 0 } };
              }
              if (sql.includes("update gates set comment_id")) {
                const commentId = Number(values[0]);
                const id = String(values[2]);
                const gate = gates.get(id);
                if (gate) {
                  gate.comment_id = commentId;
                }
                return { meta: { changes: gate ? 1 : 0 } };
              }
              if (sql.includes("update gates set last_error")) {
                const error = values[0] === null ? null : String(values[0]);
                const id = String(values[2]);
                const gate = gates.get(id);
                if (gate) {
                  gate.last_error = error;
                }
                return { meta: { changes: gate ? 1 : 0 } };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
            all: async () => {
              if (sql.includes("from audit_logs")) {
                db.auditQuery = {
                  sql,
                  values,
                };
                return {
                  results: auditRows,
                };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
            first: async () => {
              if (sql.includes("from rate_limits")) {
                const key = String(values[0]);
                return buckets.get(key) ?? null;
              }
              if (sql.includes("from gates")) {
                const id = String(values[0]);
                return gates.get(id) ?? null;
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
    buckets: Map<
      string,
      { window_start: string; count: number; expires_at: string }
    >;
    gates: Map<string, GateRecord>;
    verifications: Map<string, VerificationRecord>;
    auditQuery?: {
      sql: string;
      values: unknown[];
    };
  };
}

function verifiedGate(input: { installationId: string }): GateRecord {
  return {
    id: "gate-1",
    installation_id: input.installationId,
    owner: "octo-org",
    repo: "awesome-repo",
    pr_number: 184,
    head_sha: "8f31c9a",
    pr_author: "some-user",
    status: "verified",
    gate_url: "https://example.com/gate/gate-1",
    gate_token_hash: "token-hash",
    gate_nonce_hash: null,
    check_run_id: 1,
    comment_id: 2,
    last_error: null,
    created_at: "2026-06-14T00:00:00.000Z",
    updated_at: "2026-06-14T00:00:00.000Z",
    expires_at: "2026-07-14T00:00:00.000Z",
  };
}

function verificationFor(gate: GateRecord): VerificationRecord {
  return {
    id: "verification-1",
    gate_id: gate.id,
    installation_id: gate.installation_id,
    owner: gate.owner,
    repo: gate.repo,
    pr_number: gate.pr_number,
    head_sha: gate.head_sha,
    pr_author: gate.pr_author,
    solver_login: gate.pr_author,
    captcha_provider: "cloudflare_turnstile",
    captcha_passed_at: "2026-06-14T00:00:00.000Z",
    expires_at: gate.expires_at,
  };
}

function verificationKey(gate: GateRecord): string {
  return `${gate.owner}/${gate.repo}#${gate.pr_number}@${gate.head_sha}`;
}

function pullRequestFor(gate: GateRecord) {
  return {
    number: gate.pr_number,
    draft: false,
    html_url: `https://github.com/${gate.owner}/${gate.repo}/pull/${gate.pr_number}`,
    author_association: "FIRST_TIME_CONTRIBUTOR",
    user: {
      login: gate.pr_author,
      type: "User",
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
