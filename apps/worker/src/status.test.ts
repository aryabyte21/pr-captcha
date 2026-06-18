import { describe, expect, it } from "vitest";
import { app } from "./index";
import type { Env } from "./env";
import type { GateRecord, VerificationRecord } from "./types";

const gate: GateRecord = {
  id: "gate-1",
  installation_id: "123",
  owner: "owner",
  repo: "repo",
  pr_number: 12,
  head_sha: "abc123",
  pr_author: "new-user",
  status: "skipped",
  gate_url: "https://example.com/gate/gate-1",
  gate_token_hash: "hash",
  gate_nonce_hash: null,
  check_run_id: 456,
  comment_id: 789,
  last_error: null,
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
  expires_at: "2026-07-14T00:00:00.000Z",
};

const verification: VerificationRecord = {
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

describe("verification status", () => {
  it("rejects non-positive pull request numbers", async () => {
    const response = await app.request(
      "/api/v1/verifications/status?owner=owner&repo=repo&pr=0&sha=abc123",
      {},
      {
        DB: throwingDb(),
      } as Env,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      verified: false,
      error: "owner, repo, positive pr, and sha are required",
    });
  });

  it("treats skipped gates as verified for the Action gate", async () => {
    const response = await app.request(
      "/api/v1/verifications/status?owner=owner&repo=repo&pr=12&sha=abc123",
      {},
      {
        DB: dbWith({
          gate,
          verification: null,
        }),
      } as Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      verified: true,
      skipped: true,
    });
  });

  it("generates verification URLs without storing raw gate tokens", async () => {
    const response = await app.request(
      "/api/v1/verifications/status?owner=owner&repo=repo&pr=12&sha=abc123",
      {},
      {
        DB: dbWith({
          gate: {
            ...gate,
            status: "pending",
            gate_url: "https://captcha.example.test/gate/gate-1",
          },
          verification: null,
        }),
        APP_BASE_URL: "https://captcha.example.test",
        SESSION_SECRET: "session-secret",
      } as Env,
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      verified: boolean;
      verification_url: string;
    };
    expect(body.verified).toBe(false);
    expect(body.verification_url).toMatch(
      /^https:\/\/captcha\.example\.test\/gate\/gate-1\?token=/,
    );
    expect(body.verification_url).not.toBe(gate.gate_url);
  });

  it("denies verified statuses from installations outside the beta allowlist", async () => {
    const response = await app.request(
      "/api/v1/verifications/status?owner=owner&repo=repo&pr=12&sha=abc123",
      {},
      {
        DB: dbWith({
          gate,
          verification,
        }),
        ALLOWED_INSTALLATION_IDS: "999",
      } as Env,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      verified: false,
      error: "Installation is not allowed",
    });
  });

  it("does not expose gate URLs from installations outside the beta allowlist", async () => {
    const response = await app.request(
      "/api/v1/verifications/status?owner=owner&repo=repo&pr=12&sha=abc123",
      {},
      {
        DB: dbWith({
          gate: {
            ...gate,
            status: "pending",
          },
          verification: null,
        }),
        ALLOWED_INSTALLATION_IDS: "999",
      } as Env,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      verified: false,
      error: "Installation is not allowed",
    });
  });
});

function dbWith(input: {
  gate: GateRecord | null;
  verification: VerificationRecord | null;
}): D1Database {
  return {
    prepare(sql: string) {
      return {
        bind() {
          return {
            first: async () =>
              sql.includes("from verifications")
                ? input.verification
                : input.gate,
          };
        },
      };
    },
  } as unknown as D1Database;
}

function throwingDb(): D1Database {
  return {
    prepare() {
      throw new Error("DB should not be queried");
    },
  } as unknown as D1Database;
}
