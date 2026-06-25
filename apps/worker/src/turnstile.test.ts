import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";
import type { Env } from "./env";

const env = {
  TURNSTILE_SECRET_KEY: "turnstile-secret",
} as Env;

describe("verifyTurnstile", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("passes the siteverify request through Cloudflare Turnstile", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = init?.body as FormData;

        expect(body.get("secret")).toBe("turnstile-secret");
        expect(body.get("response")).toBe("captcha-token");
        expect(body.get("remoteip")).toBe("203.0.113.10");
        expect(typeof body.get("idempotency_key")).toBe("string");

        return Response.json({ success: true });
      }),
    );

    await expect(
      verifyTurnstile(env, "captcha-token", "203.0.113.10"),
    ).resolves.toBe(true);
  });

  it("fails closed for rejected, malformed, and unavailable siteverify responses", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ success: false }));
    await expect(verifyTurnstile(env, "bad-token", null)).resolves.toBe(false);

    vi.stubGlobal("fetch", async () =>
      Response.json({ success: true }, { status: 500 }),
    );
    await expect(verifyTurnstile(env, "bad-token", null)).resolves.toBe(false);

    vi.stubGlobal("fetch", async () => new Response("not-json"));
    await expect(verifyTurnstile(env, "bad-token", null)).resolves.toBe(false);

    vi.stubGlobal("fetch", async () => {
      throw new Error("network down");
    });
    await expect(verifyTurnstile(env, "bad-token", null)).resolves.toBe(false);
  });

  it("fails closed when siteverify hangs", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      },
    );

    const pending = verifyTurnstile(env, "captcha-token", null);
    await vi.advanceTimersByTimeAsync(5000);

    await expect(pending).resolves.toBe(false);
  });
});
