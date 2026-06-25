import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  appBaseUrl,
  appUrl,
  type AppVariables,
  type Env,
  type SessionUser,
} from "./env";
import { signPayload, verifyPayload } from "./crypto";
import { fetchWithTimeout } from "./http";

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

const sessionCookieName = "pr_captcha_session";
const githubOAuthTimeoutMs = 10000;

export async function startGitHubOAuth(c: AppContext): Promise<Response> {
  const returnTo = c.req.query("return_to") ?? "/";
  const state = await signPayload(
    {
      return_to: returnTo,
      exp: Math.floor(Date.now() / 1000) + 10 * 60,
    },
    c.env.SESSION_SECRET,
  );
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", c.env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    appUrl(c.env, "/auth/github/callback"),
  );
  authorizeUrl.searchParams.set("state", state);
  return c.redirect(authorizeUrl.toString(), 302);
}

export async function handleGitHubOAuthCallback(
  c: AppContext,
): Promise<Response> {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) {
    return c.text("Missing OAuth code or state", 400);
  }
  const statePayload = await verifyPayload<{ return_to: string; exp: number }>(
    state,
    c.env.SESSION_SECRET,
    isOAuthState,
  );
  if (!statePayload) {
    return c.text("Invalid OAuth state", 400);
  }
  const accessToken = await exchangeCode(c.env, code);
  const user = await fetchGitHubUser(accessToken);
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const session = await signPayload(
    {
      id: user.id,
      login: user.login,
      exp,
    },
    c.env.SESSION_SECRET,
  );

  setCookie(c, sessionCookieName, session, {
    httpOnly: true,
    secure: appBaseUrl(c.env).startsWith("https://"),
    sameSite: "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return c.redirect(
    safeReturnTo(statePayload.return_to, appBaseUrl(c.env)),
    302,
  );
}

function safeReturnTo(returnTo: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(returnTo, base);
    if (resolved.origin === base.origin) {
      return resolved.pathname + resolved.search + resolved.hash;
    }
  } catch {}
  return "/";
}

export async function getSession(c: AppContext): Promise<SessionUser | null> {
  const token = getCookie(c, sessionCookieName);
  if (!token) {
    return null;
  }
  return verifyPayload<SessionUser>(token, c.env.SESSION_SECRET, isSessionUser);
}

function isOAuthState(
  value: unknown,
): value is { return_to: string; exp: number } {
  return (
    isRecord(value) &&
    typeof value.return_to === "string" &&
    typeof value.exp === "number"
  );
}

function isSessionUser(value: unknown): value is SessionUser {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.login === "string" &&
    typeof value.exp === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function exchangeCode(env: Env, code: string): Promise<string> {
  const response = await fetchWithTimeout(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: appUrl(env, "/auth/github/callback"),
      }),
    },
    githubOAuthTimeoutMs,
  );
  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(
      oauthErrorDescription(payload) ?? "GitHub OAuth token exchange failed",
    );
  }
  if (
    !isRecord(payload) ||
    typeof payload.access_token !== "string" ||
    payload.access_token.trim().length === 0
  ) {
    throw new Error(
      oauthErrorDescription(payload) ??
        "GitHub OAuth token exchange returned an invalid token",
    );
  }
  return payload.access_token;
}

async function fetchGitHubUser(
  accessToken: string,
): Promise<{ id: number; login: string }> {
  const response = await fetchWithTimeout(
    "https://api.github.com/user",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "pr-captcha",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
    githubOAuthTimeoutMs,
  );
  if (!response.ok) {
    throw new Error("GitHub OAuth user lookup failed");
  }
  const payload = (await response.json()) as unknown;
  if (!isGitHubUser(payload)) {
    throw new Error("GitHub OAuth user lookup returned an invalid user");
  }
  return {
    id: payload.id,
    login: payload.login,
  };
}

function isGitHubUser(value: unknown): value is { id: number; login: string } {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    typeof value.login === "string" &&
    value.login.trim().length > 0
  );
}

function oauthErrorDescription(value: unknown): string | null {
  if (isRecord(value) && typeof value.error_description === "string") {
    return value.error_description;
  }
  return null;
}
