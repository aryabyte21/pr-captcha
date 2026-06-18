import { describe, expect, it, vi } from "vitest";
import { app } from "./index";
import type { Env } from "./env";

const secret = "webhook-secret";

describe("GitHub webhook delivery deduplication", () => {
  it("skips duplicate signed deliveries", async () => {
    const db = deliveryDb();
    const first = await webhookRequest(db, "delivery-1", "ping", "{}");
    const second = await webhookRequest(db, "delivery-1", "ping", "{}");

    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ ok: true });
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({
      ok: true,
      duplicate: true,
    });
    expect(db.deliveries.get("delivery-1")?.status).toBe("completed");
  });

  it("releases failed deliveries so GitHub can retry", async () => {
    const db = deliveryDb();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    let failed: Response;
    try {
      failed = await webhookRequest(
        db,
        "delivery-2",
        "pull_request",
        pullRequestBody({ installationId: 123 }),
      );
    } finally {
      consoleError.mockRestore();
    }

    expect(failed.status).toBe(500);
    const retried = await webhookRequest(db, "delivery-2", "ping", "{}");
    expect(retried.status).toBe(200);
    await expect(retried.json()).resolves.toEqual({ ok: true });
    expect(db.deliveries.get("delivery-2")?.status).toBe("completed");
  });

  it("completes malformed signed pull request payloads without retrying", async () => {
    const db = deliveryDb();
    const response = await webhookRequest(
      db,
      "delivery-bad-json",
      "pull_request",
      "not-json",
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid pull_request webhook payload",
    });
    expect(db.deliveries.get("delivery-bad-json")?.status).toBe("completed");
    expect(db.auditEvents).toContain("webhook.invalid_payload");
  });

  it("rejects signed pull request payloads with missing required fields", async () => {
    const db = deliveryDb();
    const response = await webhookRequest(
      db,
      "delivery-bad-shape",
      "pull_request",
      JSON.stringify({ action: "opened" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid pull_request webhook payload",
    });
    expect(db.deliveries.get("delivery-bad-shape")?.status).toBe("completed");
    expect(db.auditEvents).toContain("webhook.invalid_payload");
  });

  it("rejects signed pull request payloads without an installation id", async () => {
    const db = deliveryDb();
    const response = await webhookRequest(
      db,
      "delivery-missing-installation",
      "pull_request",
      pullRequestBody({}),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid pull_request webhook payload",
    });
    expect(db.deliveries.get("delivery-missing-installation")?.status).toBe(
      "completed",
    );
    expect(db.auditEvents).toContain("webhook.invalid_payload");
  });

  it("reclaims stale processing deliveries after a worker crash", async () => {
    const db = deliveryDb();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:20:00.000Z"));
    try {
      db.deliveries.set("delivery-stale", {
        event: "pull_request",
        status: "processing",
        updated_at: "2026-06-14T00:00:00.000Z",
      });

      const response = await webhookRequest(db, "delivery-stale", "ping", "{}");

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true });
      expect(db.deliveries.get("delivery-stale")).toMatchObject({
        event: "ping",
        status: "completed",
        updated_at: "2026-06-14T00:20:00.000Z",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores pull request webhooks from installations outside the beta allowlist", async () => {
    const db = deliveryDb();
    const body = pullRequestBody({ installationId: 123 });
    const response = await webhookRequest(
      db,
      "delivery-allowlist",
      "pull_request",
      body,
      {
        ALLOWED_INSTALLATION_IDS: "999",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: "installation_not_allowed",
    });
    expect(db.deliveries.get("delivery-allowlist")?.status).toBe("completed");
    expect(db.auditEvents).toContain("installation.blocked");
  });
});

async function webhookRequest(
  db: ReturnType<typeof deliveryDb>,
  deliveryId: string,
  event: string,
  body: string,
  env: Partial<Env> = {},
): Promise<Response> {
  return app.request(
    "/webhooks/github",
    {
      method: "POST",
      body,
      headers: {
        "x-github-delivery": deliveryId,
        "x-github-event": event,
        "x-hub-signature-256": await githubSignature(body),
      },
    },
    {
      DB: db as unknown as D1Database,
      GITHUB_WEBHOOK_SECRET: secret,
      ...env,
    } as Env,
  );
}

function pullRequestBody(input: { installationId?: number }): string {
  const payload: Record<string, unknown> = {
    action: "opened",
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
  };
  if (input.installationId) {
    payload.installation = {
      id: input.installationId,
    };
  }
  return JSON.stringify(payload);
}

async function githubSignature(body: string): Promise<string> {
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

function deliveryDb(): D1Database & {
  deliveries: Map<
    string,
    { event: string; status: string; updated_at: string }
  >;
  auditEvents: string[];
} {
  const deliveries = new Map<
    string,
    { event: string; status: string; updated_at: string }
  >();
  const auditEvents: string[] = [];
  return {
    deliveries,
    auditEvents,
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
              if (sql.includes("where id = ? and status = 'processing'")) {
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
              if (sql.includes("insert into audit_logs")) {
                auditEvents.push(String(values[2]));
                return { meta: { changes: 1 } };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
          };
        },
      };
    },
  } as unknown as D1Database & {
    deliveries: Map<
      string,
      { event: string; status: string; updated_at: string }
    >;
    auditEvents: string[];
  };
}
