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
}

export type AppVariables = {
  session?: SessionUser;
};

export type SessionUser = {
  id: number;
  login: string;
  exp: number;
};
