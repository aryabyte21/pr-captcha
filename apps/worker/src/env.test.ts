import { describe, expect, it } from "vitest";
import { appBaseUrl, appUrl } from "./env";

describe("app URL helpers", () => {
  it("normalizes trailing slashes before joining paths", () => {
    const env = { APP_BASE_URL: "https://captcha.example.test/" };

    expect(appBaseUrl(env)).toBe("https://captcha.example.test");
    expect(appUrl(env, "/gate/gate-1?token=t")).toBe(
      "https://captcha.example.test/gate/gate-1?token=t",
    );
    expect(appUrl(env, "auth/github/callback")).toBe(
      "https://captcha.example.test/auth/github/callback",
    );
  });
});
