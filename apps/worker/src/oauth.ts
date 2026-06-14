import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppVariables, Env, SessionUser } from "./env";
import { signPayload, verifyPayload } from "./crypto";

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

const sessionCookieName = "pr_captcha_session";

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
    `${c.env.APP_BASE_URL}/auth/github/callback`,
  );
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", "read:user");
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
    secure: c.env.APP_BASE_URL.startsWith("https://"),
    sameSite: "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return c.redirect(
    safeReturnTo(statePayload.return_to, c.env.APP_BASE_URL),
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
  } catch {
    // fall through to default
  }
  return "/";
}

export async function getSession(c: AppContext): Promise<SessionUser | null> {
  const token = getCookie(c, sessionCookieName);
  if (!token) {
    return null;
  }
  return verifyPayload<SessionUser>(token, c.env.SESSION_SECRET);
}

async function exchangeCode(env: Env, code: string): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${env.APP_BASE_URL}/auth/github/callback`,
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };
  if (!payload.access_token) {
    throw new Error(
      payload.error_description ?? "GitHub OAuth token exchange failed",
    );
  }
  return payload.access_token;
}

async function fetchGitHubUser(
  accessToken: string,
): Promise<{ id: number; login: string }> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "pr-captcha",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error("GitHub OAuth user lookup failed");
  }
  return response.json();
}
