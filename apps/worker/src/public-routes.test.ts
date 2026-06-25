import { describe, expect, it } from "vitest";
import { app } from "./index";
import type { Env } from "./env";

const env = {
  APP_BASE_URL: "https://captcha.example.test/",
} as Env;

describe("public launch routes", () => {
  it("renders robots.txt with the canonical sitemap", async () => {
    const response = await app.request("/robots.txt", {}, env);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    await expect(response.text()).resolves.toContain(
      "Sitemap: https://captcha.example.test/sitemap.xml",
    );
  });

  it("renders a sitemap with the landing page and setup docs", async () => {
    const response = await app.request("/sitemap.xml", {}, env);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/xml");
    const xml = await response.text();
    expect(xml).toContain("<loc>https://captcha.example.test</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/demo</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/evidence</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/trust</loc>");
    expect(xml).toContain(
      "<loc>https://captcha.example.test/setup-wizard</loc>",
    );
    expect(xml).toContain("<loc>https://captcha.example.test/status</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/setup.md</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/trust.md</loc>");
    expect(xml).toContain(
      "<loc>https://captcha.example.test/security.md</loc>",
    );
    expect(xml).toContain("<loc>https://captcha.example.test/privacy.md</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/terms.md</loc>");
    expect(xml).toContain(
      "<loc>https://captcha.example.test/production-goal.md</loc>",
    );
  });

  it("renders security.txt with a canonical URL and future expiry", async () => {
    const response = await app.request("/.well-known/security.txt", {}, env);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    const text = await response.text();
    expect(text).toContain(
      "Canonical: https://captcha.example.test/.well-known/security.txt",
    );
    expect(text).toContain("Policy: https://captcha.example.test/trust");
    expect(text).toContain("Policy: https://captcha.example.test/security.md");
    const expires = text.match(/^Expires: (.+)$/m)?.[1];
    expect(expires).toBeTruthy();
    expect(Date.parse(expires ?? "")).toBeGreaterThan(Date.now());
  });

  it("renders the public demo page", async () => {
    const response = await app.request("/demo", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("PR captcha Gate Lab");
    expect(html).toContain("Run gate simulation");
    expect(html).toContain("Copy install config");
    expect(html).toContain("data-demo-replay");
    expect(html).toContain("data-demo-step");
    expect(html).toContain("data-demo-policy");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/demo" />',
    );
  });

  it("renders the repo evidence scanner", async () => {
    const response = await app.request(
      "/evidence?repo=https%3A%2F%2Fgithub.com%2Ftldraw%2Ftldraw%2Fpulls",
      {},
      env,
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Would this repo benefit?");
    expect(html).toContain("data-evidence-form");
    expect(html).toContain("Maintainer evidence brief");
    expect(html).toContain("data-evidence-brief");
    expect(html).toContain("data-evidence-copy-brief");
    expect(html).toContain('value="tldraw/tldraw"');
    expect(html).toContain(
      "https://captcha.example.test/evidence?repo=tldraw%2Ftldraw",
    );
    expect(html).toContain("/api/public/repo-evidence");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/evidence" />',
    );
  });

  it("renders the Trust Center", async () => {
    const response = await app.request("/trust", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Trust Center");
    expect(html).toContain("Security model");
    expect(html).toContain("/security.md");
    expect(html).toContain("Production accounts");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/trust" />',
    );
  });

  it("renders the setup wizard page", async () => {
    const response = await app.request("/setup-wizard", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Create your repository policy.");
    expect(html).toContain("Start with fork");
    expect(html).toContain("data-wizard-repository");
    expect(html).toContain("data-wizard-scan");
    expect(html).toContain("data-wizard-evidence");
    expect(html).toContain("/api/public/repo-evidence");
    expect(html).toContain("Repository-aware setup links");
    expect(html).toContain("Allow maintainer override");
    expect(html).toContain("Branch protection");
    expect(html).toContain("Workflow guard");
    expect(html).toContain("Acceptance proof");
    expect(html).toContain("data-wizard-branch-protection");
    expect(html).toContain("data-wizard-workflow");
    expect(html).toContain("data-wizard-acceptance");
    expect(html).toContain("data-copy-workflow-guard");
    expect(html).toContain("data-copy-acceptance-proof");
    expect(html).toContain("data-generate-policy");
    expect(html).toContain("/api/public/config-preview");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/setup-wizard" />',
    );
  });

  it("renders the public status page", async () => {
    const response = await app.request("/status", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Is the little gate awake?");
    expect(html).toContain("data-refresh-status");
    expect(html).toContain("/health/ready");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/status" />',
    );
  });

  it("previews repository config without exposing an admin endpoint", async () => {
    const response = await app.request(
      "/api/public/config-preview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: `mode: universal
checks:
  create_required_check: false
comment:
  enabled: false
`,
        }),
      },
      {
        ...env,
        DB: rateLimitDb(),
      } as unknown as Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      config_source: "repository",
      config_valid: true,
      config: {
        mode: "universal",
        checks: {
          create_required_check: false,
        },
        comment: {
          enabled: false,
        },
      },
      setup: {
        creates_required_check: false,
        comment_enabled: false,
      },
    });
  });

  it("previews repository config when preview rate-limit storage is unavailable", async () => {
    const response = await app.request(
      "/api/public/config-preview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: "mode: required_check\n",
        }),
      },
      {
        ...env,
        DB: failingRateLimitDb(),
      } as unknown as Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      config_source: "repository",
      config_valid: true,
      config: {
        mode: "required_check",
      },
    });
  });

  it("rejects oversized config preview bodies", async () => {
    const response = await app.request(
      "/api/public/config-preview",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "Content-Length": String(33 * 1024),
        },
        body: "",
      },
      {
        ...env,
        DB: rateLimitDb(),
      } as unknown as Env,
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: "Config preview input is too large",
    });
  });
});

function failingRateLimitDb(): D1Database {
  return {
    prepare() {
      throw new Error("rate limit store unavailable");
    },
  } as unknown as D1Database;
}

function rateLimitDb(): D1Database {
  const buckets = new Map<
    string,
    { window_start: string; count: number; expires_at: string }
  >();
  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            run: async () => {
              if (sql.includes("delete from rate_limits")) {
                const now = String(values[0]);
                for (const [key, bucket] of buckets) {
                  if (bucket.expires_at <= now) {
                    buckets.delete(key);
                  }
                }
                return { meta: { changes: 0 } };
              }
              if (sql.includes("insert into rate_limits")) {
                const key = String(values[0]);
                const windowStart = String(values[1]);
                const expiresAt = String(values[2]);
                const existing = buckets.get(key);
                if (existing?.window_start === windowStart) {
                  existing.count += 1;
                  existing.expires_at = expiresAt;
                } else {
                  buckets.set(key, {
                    window_start: windowStart,
                    count: 1,
                    expires_at: expiresAt,
                  });
                }
                return { meta: { changes: 1 } };
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
            first: async () => {
              if (sql.includes("from rate_limits")) {
                return buckets.get(String(values[0])) ?? null;
              }
              throw new Error(`Unexpected SQL: ${sql}`);
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}
