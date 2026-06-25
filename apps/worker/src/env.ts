export interface Env {
  DB: D1Database;
  APP_BASE_URL: string;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_WEBHOOK_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  SESSION_SECRET: string;
  ADMIN_TOKEN?: string;
  ALLOWED_INSTALLATION_IDS?: string;
}

export type AppVariables = {
  session?: SessionUser;
  requestId?: string;
};

export type SessionUser = {
  id: number;
  login: string;
  exp: number;
};

export function appBaseUrl(env: Pick<Env, "APP_BASE_URL">): string {
  return env.APP_BASE_URL.trim().replace(/\/+$/, "");
}

export function appUrl(env: Pick<Env, "APP_BASE_URL">, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appBaseUrl(env)}${normalizedPath}`;
}
