import { describe, expect, it } from "vitest";
import { sha256, signPayload } from "./crypto";
import { app } from "./index";
import type { Env } from "./env";
import type { GateRecord } from "./types";

const gate: GateRecord = {
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

describe("gate token validation", () => {
  it("rejects signed gate tokens with missing required fields", async () => {
    const token = await signPayload(
      {
        gate_id: "gate-1",
        owner: "octo-org",
        repo: "awesome-repo",
        pr_number: 184,
        head_sha: "8f31c9a",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      "session-secret",
    );

    const response = await app.request(
      `/gate/gate-1?token=${encodeURIComponent(token)}`,
      {},
      {
        DB: dbWith(gate),
        SESSION_SECRET: "session-secret",
      } as Env,
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain(
      "Invalid verification link",
    );
  });

  it("does not render a CAPTCHA form for skipped gates", async () => {
    const token = await gateToken(gate);
    const skippedGate = {
      ...gate,
      status: "skipped" as const,
      gate_token_hash: await sha256(token),
      gate_nonce_hash: "legacy-nonce-hash",
    };

    const response = await app.request(
      `/gate/gate-1?token=${encodeURIComponent(token)}`,
      {},
      {
        DB: dbWith(skippedGate),
        SESSION_SECRET: "session-secret",
      } as Env,
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Human check not required");
    expect(html).not.toContain("cf-turnstile");
  });

  it("does not accept CAPTCHA submissions for skipped gates", async () => {
    const token = await gateToken(gate);
    const skippedGate = {
      ...gate,
      status: "skipped" as const,
      gate_token_hash: await sha256(token),
      gate_nonce_hash: "legacy-nonce-hash",
    };
    const form = new URLSearchParams({
      token,
      csrf_token: "csrf-token",
      "cf-turnstile-response": "captcha-token",
    });

    const response = await app.request(
      "/gate/gate-1",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: form,
      },
      {
        DB: dbWith(skippedGate),
        SESSION_SECRET: "session-secret",
      } as Env,
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Human check not required");
    expect(html).not.toContain("cf-turnstile");
  });
});

async function gateToken(gateRecord: GateRecord): Promise<string> {
  return signPayload(
    {
      gate_id: gateRecord.id,
      owner: gateRecord.owner,
      repo: gateRecord.repo,
      pr_number: gateRecord.pr_number,
      head_sha: gateRecord.head_sha,
      nonce: "nonce",
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    "session-secret",
  );
}

function dbWith(gateRecord: GateRecord): D1Database {
  const buckets = new Map<string, { count: number; expires_at: string }>();
  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            run: async () => {
              if (sql.includes("delete from rate_limits")) {
                return { meta: { changes: 0 } };
              }
              if (sql.includes("insert into rate_limits")) {
                buckets.set(String(values[0]), {
                  count: 1,
                  expires_at: String(values[2]),
                });
                return { meta: { changes: 1 } };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
            first: async () => {
              if (sql.includes("from rate_limits")) {
                return buckets.get(String(values[0])) ?? null;
              }
              if (sql.includes("from gates")) {
                return gateRecord;
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}
