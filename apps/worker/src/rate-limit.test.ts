import { describe, expect, it, vi } from "vitest";
import { hitRateLimit } from "./db";
import { app } from "./index";
import type { Env } from "./env";
import { sha256 } from "./crypto";

describe("rate limits", () => {
  it("limits a bucket until the window changes", async () => {
    const db = rateLimitDb();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:00:00.000Z"));
    try {
      await expect(
        hitRateLimit(db, {
          key: "bucket",
          limit: 2,
          windowSeconds: 60,
        }),
      ).resolves.toMatchObject({ limited: false, remaining: 1 });
      await expect(
        hitRateLimit(db, {
          key: "bucket",
          limit: 2,
          windowSeconds: 60,
        }),
      ).resolves.toMatchObject({ limited: false, remaining: 0 });
      await expect(
        hitRateLimit(db, {
          key: "bucket",
          limit: 2,
          windowSeconds: 60,
        }),
      ).resolves.toMatchObject({ limited: true, remaining: 0 });

      vi.setSystemTime(new Date("2026-06-14T00:01:01.000Z"));
      await expect(
        hitRateLimit(db, {
          key: "bucket",
          limit: 2,
          windowSeconds: 60,
        }),
      ).resolves.toMatchObject({ limited: false, remaining: 1 });
    } finally {
      vi.useRealTimers();
    }
  });

  it("throttles repeated invalid webhook signatures by IP", async () => {
    const db = rateLimitDb();
    let response = await invalidWebhookRequest(db);
    expect(response.status).toBe(401);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      response = await invalidWebhookRequest(db);
    }

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: "Rate limit exceeded",
    });
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("throttles signed pull request webhooks by PR", async () => {
    const db = rateLimitDb();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:00:00.000Z"));
    try {
      db.buckets.set(await sha256("webhook-pr:octo-org/awesome-repo#184"), {
        window_start: "2026-06-14T00:00:00.000Z",
        count: 60,
        expires_at: "2026-06-14T00:10:00.000Z",
      });
      const response = await signedPullRequestWebhook(db);

      expect(response.status).toBe(429);
      await expect(response.json()).resolves.toMatchObject({
        error: "Rate limit exceeded",
      });
      expect(db.deliveries.get("delivery-pr-limit")?.status).toBe("completed");
    } finally {
      vi.useRealTimers();
    }
  });
});

async function invalidWebhookRequest(db: D1Database): Promise<Response> {
  return app.request(
    "/webhooks/github",
    {
      method: "POST",
      body: "{}",
      headers: {
        "cf-connecting-ip": "203.0.113.10",
        "x-github-delivery": "delivery",
        "x-github-event": "ping",
        "x-hub-signature-256": "sha256=bad",
      },
    },
    {
      DB: db,
      GITHUB_WEBHOOK_SECRET: "secret",
    } as unknown as Env,
  );
}

async function signedPullRequestWebhook(
  db: ReturnType<typeof rateLimitDb>,
): Promise<Response> {
  const body = JSON.stringify({
    action: "opened",
    installation: {
      id: 123,
    },
    repository: {
      name: "awesome-repo",
      full_name: "octo-org/awesome-repo",
      owner: {
        login: "octo-org",
      },
      default_branch: "main",
    },
    pull_request: {
      number: 184,
      draft: false,
      html_url: "https://github.com/octo-org/awesome-repo/pull/184",
      author_association: "FIRST_TIME_CONTRIBUTOR",
      user: {
        login: "some-user",
        type: "User",
      },
      head: {
        sha: "8f31c9a",
        ref: "feature",
        repo: {
          full_name: "some-user/awesome-repo",
          fork: true,
          owner: {
            login: "some-user",
          },
        },
      },
      base: {
        ref: "main",
        repo: {
          full_name: "octo-org/awesome-repo",
          owner: {
            login: "octo-org",
          },
        },
      },
      labels: [],
    },
  });
  return app.request(
    "/webhooks/github",
    {
      method: "POST",
      body,
      headers: {
        "x-github-delivery": "delivery-pr-limit",
        "x-github-event": "pull_request",
        "x-hub-signature-256": await githubSignature(body, "secret"),
      },
    },
    {
      DB: db,
      GITHUB_WEBHOOK_SECRET: "secret",
    } as unknown as Env,
  );
}

async function githubSignature(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
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

function rateLimitDb(): D1Database & {
  buckets: Map<
    string,
    { window_start: string; count: number; expires_at: string }
  >;
  deliveries: Map<string, { event: string; status: string }>;
} {
  const buckets = new Map<
    string,
    { window_start: string; count: number; expires_at: string }
  >();
  const deliveries = new Map<string, { event: string; status: string }>();
  return {
    buckets,
    deliveries,
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
                });
                return { meta: { changes: 1 } };
              }
              if (sql.startsWith("update webhook_deliveries")) {
                const id = String(values[1]);
                const delivery = deliveries.get(id);
                if (delivery) {
                  delivery.status = "completed";
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
              if (sql.includes("insert into audit_logs")) {
                return { meta: { changes: 1 } };
              }
              throw new Error(`Unexpected run SQL: ${sql}`);
            },
            first: async () => {
              if (sql.includes("select count, expires_at from rate_limits")) {
                const key = String(values[0]);
                return buckets.get(key) ?? null;
              }
              throw new Error(`Unexpected first SQL: ${sql}`);
            },
          };
        },
      };
    },
  } as unknown as D1Database & {
    buckets: Map<
      string,
      { window_start: string; count: number; expires_at: string }
    >;
    deliveries: Map<string, { event: string; status: string }>;
  };
}
