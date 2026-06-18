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
    expect(xml).toContain(
      "<loc>https://captcha.example.test/queue-pressure</loc>",
    );
    expect(xml).toContain("<loc>https://captcha.example.test/evidence</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/radar</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/pilot</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/trust</loc>");
    expect(xml).toContain(
      "<loc>https://captcha.example.test/badge-builder</loc>",
    );
    expect(xml).toContain("<loc>https://captcha.example.test/proof-card</loc>");
    expect(xml).toContain(
      "<loc>https://captcha.example.test/scorecard-builder</loc>",
    );
    expect(xml).toContain(
      "<loc>https://captcha.example.test/github-app-manifest</loc>",
    );
    expect(xml).toContain("<loc>https://captcha.example.test/launch</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/rehearsal</loc>");
    expect(xml).toContain("<loc>https://captcha.example.test/gate-trace</loc>");
    expect(xml).toContain(
      "<loc>https://captcha.example.test/setup-wizard</loc>",
    );
    expect(xml).toContain(
      "<loc>https://captcha.example.test/diagnostics</loc>",
    );
    expect(xml).toContain("<loc>https://captcha.example.test/status</loc>");
    expect(xml).toContain(
      "<loc>https://captcha.example.test/config-preview</loc>",
    );
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

  it("renders the config preview page", async () => {
    const response = await app.request("/config-preview", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Preview pr-captcha.yml");
    expect(html).toContain("/api/public/config-preview");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/config-preview" />',
    );
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

  it("renders the queue pressure calculator", async () => {
    const response = await app.request("/queue-pressure", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Measure your PR queue pressure");
    expect(html).toContain("data-queue-form");
    expect(html).toContain("data-queue-summary");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/queue-pressure" />',
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
    expect(html).toContain("Scan a repo before spam hits CI");
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

  it("renders the open-source PR spam radar", async () => {
    const response = await app.request("/radar", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Open-source PR spam radar");
    expect(html).toContain("data-radar-refresh");
    expect(html).toContain("data-radar-summary");
    expect(html).toContain("data-radar-table");
    expect(html).toContain("Repository pressure board");
    expect(html).toContain("data-radar-clusters");
    expect(html).toContain("Maintainer install packet");
    expect(html).toContain("GitHub search queries used by the radar");
    expect(html).toContain("label%3Aspam");
    expect(html).toContain("/api/public/spam-radar");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/radar" />',
    );
  });

  it("renders the maintainer pilot plan", async () => {
    const response = await app.request(
      "/pilot?repo=https%3A%2F%2Fgithub.com%2Ftldraw%2Ftldraw%2Fpulls",
      {},
      env,
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Plan a 7-day maintainer pilot");
    expect(html).toContain("data-pilot-form");
    expect(html).toContain("data-pilot-run");
    expect(html).toContain("data-pilot-copy");
    expect(html).toContain("data-pilot-issue");
    expect(html).toContain("data-pilot-open-issue");
    expect(html).toContain("https://github.com/tldraw/tldraw/issues/new");
    expect(html).toContain('value="tldraw/tldraw"');
    expect(html).toContain(
      "https://captcha.example.test/evidence?repo=tldraw%2Ftldraw",
    );
    expect(html).toContain("/api/public/repo-evidence");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/pilot" />',
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

  it("renders the README badge builder", async () => {
    const response = await app.request("/badge-builder", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Give maintainers a public proof mark");
    expect(html).toContain("data-badge-form");
    expect(html).toContain("data-badge-markdown");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/badge-builder" />',
    );
  });

  it("renders a public README badge SVG", async () => {
    const response = await app.request(
      "/badge.svg?label=protected%20by&message=pr-captcha&tone=amber&style=flat",
      {},
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("image/svg+xml");
    const svg = await response.text();
    expect(svg).toContain("<svg");
    expect(svg).toContain("protected by pr-captcha");
    expect(svg).toContain("#b45309");
    expect(svg).toContain('rx="0"');
  });

  it("renders the PR proof-card builder", async () => {
    const response = await app.request("/proof-card", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Turn a verified PR into proof");
    expect(html).toContain("data-proof-form");
    expect(html).toContain("data-proof-preview");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/proof-card" />',
    );
  });

  it("renders a public PR proof-card SVG", async () => {
    const response = await app.request(
      "/proof.svg?repo=octo-org%2Fawesome-repo&pr=184&sha=8f31c9a&user=some-user&result=pending&theme=dark",
      {},
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("image/svg+xml");
    const svg = await response.text();
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain("octo-org/awesome-repo");
    expect(svg).toContain("Verification pending");
    expect(svg).toContain("8f31c9a");
  });

  it("renders the OSS PR queue scorecard builder", async () => {
    const response = await app.request(
      "/scorecard-builder?repo=https%3A%2F%2Fgithub.com%2Ftldraw%2Ftldraw%2Fpulls",
      {},
      env,
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Repository queue scorecard");
    expect(html).toContain("data-scorecard-form");
    expect(html).toContain("data-scorecard-preview");
    expect(html).toContain("data-scorecard-url");
    expect(html).toContain("data-scorecard-social");
    expect(html).toContain("data-scorecard-issue");
    expect(html).toContain("data-scorecard-open-issue");
    expect(html).toContain("data-scorecard-share");
    expect(html).toContain('value="tldraw/tldraw"');
    expect(html).toContain("/api/public/repo-evidence");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/scorecard-builder" />',
    );
  });

  it("renders a public repo queue scorecard SVG", async () => {
    const response = await app.request(
      "/scorecard.svg?repo=octo-org%2Fawesome-repo&risk=high&open=184&fork=24&unknown=9&labels=7&theme=dark",
      {},
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("image/svg+xml");
    const svg = await response.text();
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain("octo-org/awesome-repo");
    expect(svg).toContain("HIGH RISK");
    expect(svg).toContain("protected by pr-captcha");
  });

  it("renders the GitHub App manifest builder", async () => {
    const response = await app.request("/github-app-manifest", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("GitHub App manifest");
    expect(html).toContain("data-manifest-form");
    expect(html).toContain("data-manifest-json");
    expect(html).toContain("https://captcha.example.test/webhooks/github");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/github-app-manifest" />',
    );
  });

  it("renders the GitHub App manifest callback handoff", async () => {
    const response = await app.request(
      "/github-app-manifest/callback?code=abc123&state=manifest-state",
      {},
      env,
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Finish the manifest handoff");
    expect(html).toContain("CODE=&#39;abc123&#39;");
    expect(html).toContain(
      "https://api.github.com/app-manifests/${CODE}/conversions",
    );
    expect(html).toContain("data-manifest-conversion-script");
    expect(html).toContain("data-copy-manifest-conversion");
    expect(html).toContain("npx wrangler secret put GITHUB_APP_ID");
    expect(html).toContain("manifest-state");
  });

  it("renders the launch cockpit", async () => {
    const response = await app.request("/launch", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Launch pr-captcha without guessing");
    expect(html).toContain("data-launch-form");
    expect(html).toContain("data-launch-commands");
    expect(html).toContain("Pages URL");
    expect(html).toContain("https://aryabyte21.github.io/pr-captcha/");
    expect(html).toContain("build_type=workflow");
    expect(html).toContain("Ship readiness");
    expect(html).toContain("data-launch-decision");
    expect(html).toContain("Launch blockers");
    expect(html).toContain("data-launch-blocker-list");
    expect(html).toContain("Fork PR proof lane");
    expect(html).toContain("data-launch-proof-stage");
    expect(html).toContain("data-launch-readiness-refresh");
    expect(html).toContain("Maintainer adoption packet");
    expect(html).toContain("Copy GitHub issue");
    expect(html).toContain("data-launch-issue");
    expect(html).toContain("data-launch-badge");
    expect(html).toContain("/api/public/launch-readiness");
    expect(html).toContain("Production gaps");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/launch" />',
    );
  });

  it("renders the fork PR rehearsal console", async () => {
    const response = await app.request("/rehearsal", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Fork PR rehearsal");
    expect(html).toContain("Prove the gate before branch protection");
    expect(html).toContain("data-rehearsal-form");
    expect(html).toContain("data-rehearsal-progress");
    expect(html).toContain("data-rehearsal-runbook");
    expect(html).toContain("data-rehearsal-issue");
    expect(html).toContain("data-rehearsal-action");
    expect(html).toContain("Ready for branch protection");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/rehearsal" />',
    );
  });

  it("renders the gate trace console", async () => {
    const response = await app.request("/gate-trace", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Trace a PR gate from webhook to check");
    expect(html).toContain("Replay the path before protecting a branch");
    expect(html).toContain("data-trace-form");
    expect(html).toContain("data-trace-progress");
    expect(html).toContain("data-trace-curl");
    expect(html).toContain("data-trace-action");
    expect(html).toContain("data-trace-proof");
    expect(html).toContain("Ready to require pr-captcha/human");
    expect(html).toContain("/webhooks/github");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/gate-trace" />',
    );
  });

  it("renders the setup wizard page", async () => {
    const response = await app.request("/setup-wizard", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Setup wizard");
    expect(html).toContain(
      "Generate a repository policy from live PR evidence",
    );
    expect(html).toContain("data-wizard-repository");
    expect(html).toContain("data-wizard-scan");
    expect(html).toContain("data-wizard-evidence");
    expect(html).toContain("/api/public/repo-evidence");
    expect(html).toContain("Repository-aware setup links");
    expect(html).toContain("Allow non-author solve");
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

  it("renders the repository diagnostics page", async () => {
    const response = await app.request("/diagnostics", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Repository diagnostics");
    expect(html).toContain("data-run-diagnostics");
    expect(html).toContain("/api/admin/repositories/");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/diagnostics" />',
    );
  });

  it("renders the public status page", async () => {
    const response = await app.request("/status", {}, env);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Service status");
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
