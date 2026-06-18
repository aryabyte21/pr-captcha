import { describe, expect, it } from "vitest";
import { app } from "./index";

describe("security headers", () => {
  it("sets browser hardening headers on rendered pages", async () => {
    const response = await app.request("/");

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "https://challenges.cloudflare.com",
    );
  });
});
