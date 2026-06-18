import { describe, expect, it, vi } from "vitest";
import { cleanupExpiredRows, consumeGateNonce, markGateSkipped } from "./db";

describe("database lifecycle helpers", () => {
  it("consumes a gate nonce once", async () => {
    const db = lifecycleDb();

    await expect(consumeGateNonce(db, "gate-1", "nonce-hash")).resolves.toBe(
      true,
    );
    await expect(consumeGateNonce(db, "gate-1", "nonce-hash")).resolves.toBe(
      false,
    );
  });

  it("clears gate nonce when a gate becomes skipped", async () => {
    const db = lifecycleDb();

    await markGateSkipped(db, "gate-1");

    expect(db.nonceHash()).toBeNull();
    expect(db.lastError()).toBeNull();
  });

  it("cleans expired operational rows", async () => {
    const db = lifecycleDb();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:00:00.000Z"));
    try {
      await expect(cleanupExpiredRows(db)).resolves.toEqual({
        rateLimits: 2,
        webhookDeliveries: 3,
        verifications: 5,
        gates: 7,
      });
    } finally {
      vi.useRealTimers();
    }

    expect(db.cleanupBinds).toEqual([
      [
        "delete from rate_limits where expires_at <= ?",
        "2026-06-14T00:00:00.000Z",
      ],
      [
        "delete from webhook_deliveries where updated_at <= ?",
        "2026-06-07T00:00:00.000Z",
      ],
      [
        "delete from verifications where expires_at <= ?",
        "2026-06-14T00:00:00.000Z",
      ],
      ["delete from gates where expires_at <= ?", "2026-06-14T00:00:00.000Z"],
    ]);
  });
});

function lifecycleDb(): D1Database & {
  cleanupBinds: unknown[][];
  lastError: () => string | null;
  nonceHash: () => string | null;
} {
  let lastError: string | null = "publish failed";
  let nonceHash: string | null = "nonce-hash";
  const cleanupBinds: unknown[][] = [];
  return {
    cleanupBinds,
    lastError: () => lastError,
    nonceHash: () => nonceHash,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            run: async () => {
              if (sql.includes("status = 'skipped'")) {
                lastError = null;
                nonceHash = null;
                return { meta: { changes: 1 } };
              }
              if (sql.includes("set gate_nonce_hash = null")) {
                const current = String(values[2]);
                if (nonceHash === current) {
                  nonceHash = null;
                  return { meta: { changes: 1 } };
                }
                return { meta: { changes: 0 } };
              }
              cleanupBinds.push([sql, ...values]);
              if (sql.includes("rate_limits")) {
                return { meta: { changes: 2 } };
              }
              if (sql.includes("webhook_deliveries")) {
                return { meta: { changes: 3 } };
              }
              if (sql.includes("verifications")) {
                return { meta: { changes: 5 } };
              }
              if (sql.includes("from gates")) {
                return { meta: { changes: 7 } };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
          };
        },
      };
    },
  } as unknown as D1Database & {
    cleanupBinds: unknown[][];
    lastError: () => string | null;
    nonceHash: () => string | null;
  };
}
