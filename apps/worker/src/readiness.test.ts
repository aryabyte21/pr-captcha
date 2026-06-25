import { describe, expect, it } from "vitest";
import { app } from "./index";
import type { Env } from "./env";

describe("readiness health check", () => {
  it("passes when required secrets and D1 are available", async () => {
    const response = await app.request("/health/ready", {}, readyEnv());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      production_ready: true,
      service: "pr-captcha",
      missing: [],
      database: true,
      warnings: [],
    });
  });

  it("reports missing required secrets without exposing values", async () => {
    const response = await app.request(
      "/health/ready",
      {},
      {
        ...readyEnv(),
        GITHUB_PRIVATE_KEY: "",
        SESSION_SECRET: "   ",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      production_ready: false,
      service: "pr-captcha",
      missing: ["GITHUB_PRIVATE_KEY", "SESSION_SECRET"],
      database: true,
      warnings: [],
    });
  });

  it("fails when D1 is not queryable", async () => {
    const response = await app.request("/health/ready", {}, readyEnv(false));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      production_ready: false,
      service: "pr-captcha",
      missing: [],
      database: false,
      warnings: [],
    });
  });

  it("fails when APP_BASE_URL is not an absolute URL", async () => {
    const response = await app.request(
      "/health/ready",
      {},
      {
        ...readyEnv(),
        APP_BASE_URL: "captcha.example.test",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      production_ready: false,
      service: "pr-captcha",
      missing: ["APP_BASE_URL"],
      database: true,
      warnings: [],
    });
  });

  it("keeps staging ready while warning about Turnstile test keys", async () => {
    const response = await app.request(
      "/health/ready",
      {},
      {
        ...readyEnv(),
        TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
        TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      production_ready: false,
      service: "pr-captcha",
      missing: [],
      database: true,
      warnings: [
        {
          code: "turnstile_test_keys",
          message:
            "Cloudflare Turnstile test keys are configured. Replace them before production enforcement.",
        },
      ],
    });
  });

  it("warns when production base URL is plain HTTP", async () => {
    const response = await app.request(
      "/health/ready",
      {},
      {
        ...readyEnv(),
        APP_BASE_URL: "http://captcha.example.test",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      production_ready: false,
      service: "pr-captcha",
      missing: [],
      database: true,
      warnings: [
        {
          code: "insecure_app_base_url",
          message:
            "APP_BASE_URL uses HTTP outside local development. Use HTTPS before production enforcement.",
        },
      ],
    });
  });

  it("allows local HTTP development base URLs", async () => {
    const response = await app.request(
      "/health/ready",
      {},
      {
        ...readyEnv(),
        APP_BASE_URL: "http://localhost:8787",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      production_ready: true,
      warnings: [],
    });
  });

  it("reports missing secrets on the readiness endpoint", async () => {
    const response = await app.request(
      "/health/ready",
      {},
      {
        ...readyEnv(),
        GITHUB_PRIVATE_KEY: "",
        SESSION_SECRET: "   ",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      production_ready: false,
      service: "pr-captcha",
      missing: ["GITHUB_PRIVATE_KEY", "SESSION_SECRET"],
      database: true,
      warnings: [],
    });
  });
});

function readyEnv(database = true): Env {
  return {
    DB: readinessDb(database),
    APP_BASE_URL: "https://captcha.example.test",
    GITHUB_APP_ID: "123",
    GITHUB_PRIVATE_KEY: "private-key",
    GITHUB_WEBHOOK_SECRET: "webhook-secret",
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
    TURNSTILE_SITE_KEY: "turnstile-site-key",
    TURNSTILE_SECRET_KEY: "turnstile-secret-key",
    SESSION_SECRET: "session-secret",
  } as unknown as Env;
}

function readinessDb(database: boolean): D1Database {
  return {
    prepare() {
      return {
        first: async () => {
          if (!database) {
            throw new Error("D1 unavailable");
          }
          return { ok: 1 };
        },
      };
    },
  } as unknown as D1Database;
}
