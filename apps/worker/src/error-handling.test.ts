import { describe, expect, it, vi } from "vitest";
import { app } from "./index";
import type { Env } from "./env";

describe("error handling", () => {
  it("returns a request id and logs redacted structured errors", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    try {
      const response = await app.request(
        "/api/admin/audit-logs",
        {
          headers: {
            authorization: "Bearer secret-admin-token",
            "x-request-id": "req-test-1",
          },
        },
        {
          DB: throwingDb(),
          ADMIN_TOKEN: "secret-admin-token",
          GITHUB_PRIVATE_KEY: "private-key-secret",
          GITHUB_WEBHOOK_SECRET: "webhook-secret",
          GITHUB_CLIENT_SECRET: "client-secret",
          TURNSTILE_SECRET_KEY: "turnstile-secret",
          SESSION_SECRET: "session-secret",
        } as unknown as Env,
      );

      expect(response.status).toBe(500);
      expect(response.headers.get("X-Request-Id")).toBe("req-test-1");
      await expect(response.json()).resolves.toEqual({
        error: "Internal server error",
        request_id: "req-test-1",
      });
      const log = String(consoleError.mock.calls[0]?.[0]);
      expect(log).toContain('"event":"request.failed"');
      expect(log).toContain('"request_id":"req-test-1"');
      expect(log).toContain("[redacted]");
      expect(log).not.toContain("secret-admin-token");
      expect(log).not.toContain("ghp_exampletoken");
    } finally {
      consoleError.mockRestore();
    }
  });
});

function throwingDb(): D1Database {
  return {
    prepare() {
      throw new Error("boom secret-admin-token ghp_exampletoken");
    },
  } as unknown as D1Database;
}
