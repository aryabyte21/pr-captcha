import { afterEach, describe, expect, it, vi } from "vitest";
import { signPayload, verifyPayload } from "./crypto";
import type { Env, SessionUser } from "./env";
import { app } from "./index";

describe("GitHub OAuth callback", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("creates a session for a valid GitHub user", async () => {
    const fetchMock = stubGitHubOAuth();
    const response = await app.request(
      await callbackUrl(),
      {
        headers: {
          "x-request-id": "oauth-success",
        },
      },
      oauthEnv(),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/gate/gate-1?token=t");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const cookie = response.headers.get("Set-Cookie") ?? "";
    expect(cookie).toContain("pr_captcha_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Secure");

    const token = cookie.match(/pr_captcha_session=([^;]+)/)?.[1];
    expect(token).toBeTruthy();
    const session = await verifyPayload<SessionUser>(
      decodeURIComponent(token ?? ""),
      "session-secret",
    );
    expect(session).toMatchObject({
      id: 123,
      login: "some-user",
    });
  });

  it("normalizes trailing slashes in OAuth callback URLs", async () => {
    const startResponse = await app.request(
      "/auth/github/start?return_to=/gate/gate-1",
      {},
      oauthEnv({
        APP_BASE_URL: "https://captcha.example.test/",
      }),
    );
    expect(startResponse.status).toBe(302);
    const authorizeUrl = new URL(startResponse.headers.get("Location") ?? "");
    expect(authorizeUrl.searchParams.get("redirect_uri")).toBe(
      "https://captcha.example.test/auth/github/callback",
    );

    const fetchMock = stubGitHubOAuth();
    const callbackResponse = await app.request(
      await callbackUrl(),
      {},
      oauthEnv({
        APP_BASE_URL: "https://captcha.example.test/",
      }),
    );
    expect(callbackResponse.status).toBe(302);
    const tokenRequest = fetchMock.mock.calls[0]?.[1] as
      | RequestInit
      | undefined;
    const tokenBody = JSON.parse(String(tokenRequest?.body ?? "{}")) as {
      redirect_uri?: string;
    };
    expect(tokenBody.redirect_uri).toBe(
      "https://captcha.example.test/auth/github/callback",
    );
  });

  it("starts GitHub App OAuth without OAuth scopes", async () => {
    const response = await app.request(
      "/auth/github/start?return_to=/gate/gate-1",
      {},
      oauthEnv(),
    );

    expect(response.status).toBe(302);
    const authorizeUrl = new URL(response.headers.get("Location") ?? "");
    expect(authorizeUrl.searchParams.get("client_id")).toBe("client-id");
    expect(authorizeUrl.searchParams.get("scope")).toBeNull();
  });

  it("does not set a session for a malformed GitHub user", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    try {
      stubGitHubOAuth({
        userPayload: {
          id: 123,
        },
      });

      const response = await app.request(
        await callbackUrl(),
        {
          headers: {
            "x-request-id": "oauth-invalid-user",
          },
        },
        oauthEnv(),
      );

      expect(response.status).toBe(500);
      expect(response.headers.get("Set-Cookie")).toBeNull();
      await expect(response.json()).resolves.toEqual({
        error: "Internal server error",
        request_id: "oauth-invalid-user",
      });
    } finally {
      consoleError.mockRestore();
    }
  });

  it("does not fetch the user when token exchange is malformed", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    try {
      const fetchMock = stubGitHubOAuth({
        tokenPayload: {
          access_token: "",
        },
      });

      const response = await app.request(
        await callbackUrl(),
        {
          headers: {
            "x-request-id": "oauth-invalid-token",
          },
        },
        oauthEnv(),
      );

      expect(response.status).toBe(500);
      expect(response.headers.get("Set-Cookie")).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("passes abort signals to OAuth GitHub requests", async () => {
    const fetchMock = stubGitHubOAuth();

    const response = await app.request(await callbackUrl(), {}, oauthEnv());

    expect(response.status).toBe(302);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls) {
      const init = call[1] as RequestInit | undefined;
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
  });
});

function oauthEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as D1Database,
    APP_BASE_URL: "https://captcha.example.test",
    GITHUB_APP_ID: "1",
    GITHUB_PRIVATE_KEY: "private-key",
    GITHUB_WEBHOOK_SECRET: "webhook-secret",
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
    TURNSTILE_SITE_KEY: "site-key",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    SESSION_SECRET: "session-secret",
    ...overrides,
  };
}

async function callbackUrl(): Promise<string> {
  const state = await signPayload(
    {
      return_to: "/gate/gate-1?token=t",
      exp: Math.floor(Date.now() / 1000) + 60,
    },
    "session-secret",
  );
  return `/auth/github/callback?code=oauth-code&state=${encodeURIComponent(state)}`;
}

function stubGitHubOAuth(
  options: {
    tokenPayload?: unknown;
    tokenStatus?: number;
    userPayload?: unknown;
    userStatus?: number;
  } = {},
) {
  const {
    tokenPayload = {
      access_token: "oauth-token",
    },
    tokenStatus = 200,
    userPayload = {
      id: 123,
      login: "some-user",
    },
    userStatus = 200,
  } = options;
  const fetchMock = vi.fn(
    async (input: Parameters<typeof fetch>[0], _init?: RequestInit) => {
      const url = requestUrl(input);
      if (url === "https://github.com/login/oauth/access_token") {
        return Response.json(tokenPayload, {
          status: tokenStatus,
        });
      }
      if (url === "https://api.github.com/user") {
        return Response.json(userPayload, {
          status: userStatus,
        });
      }
      throw new Error(`Unexpected OAuth fetch: ${url}`);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}
