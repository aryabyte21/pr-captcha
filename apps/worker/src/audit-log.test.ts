import { describe, expect, it, vi } from "vitest";
import { createAuditLog } from "./db";

describe("audit logs", () => {
  it("stores structured event context without requiring raw request data", async () => {
    const db = auditDb();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:00:00.000Z"));
    try {
      await createAuditLog(db, {
        event: "gate.created",
        owner: "octo-org",
        repo: "awesome-repo",
        prNumber: 184,
        headSha: "8f31c9a",
        gateId: "gate-1",
        installationId: "12345",
        actorLogin: "some-user",
        details: {
          reasons: ["first-time contributor"],
          status: "pending",
        },
      });
    } finally {
      vi.useRealTimers();
    }

    expect(db.values).toMatchObject([
      expect.any(String),
      "2026-06-14T00:00:00.000Z",
      "gate.created",
      "octo-org",
      "awesome-repo",
      184,
      "8f31c9a",
      "gate-1",
      "12345",
      "some-user",
      JSON.stringify({
        reasons: ["first-time contributor"],
        status: "pending",
      }),
    ]);
  });
});

function auditDb(): D1Database & { values: unknown[] } {
  const db = {
    values: [] as unknown[],
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            run: async () => {
              expect(sql).toContain("insert into audit_logs");
              db.values = values;
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
  return db as unknown as D1Database & { values: unknown[] };
}
