import { describe, expect, it } from "vitest";
import {
  renderBadgeBuilderPage,
  renderBadgeSvg,
  renderConfigPreviewPage,
  renderDemoPage,
  renderEvidenceScannerPage,
  renderForkPrRehearsalPage,
  renderGatePage,
  renderGateTracePage,
  renderGitHubAppManifestCallbackPage,
  renderGitHubAppManifestPage,
  renderHome,
  renderLaunchPage,
  renderOpenGraphImageSvg,
  renderPilotPlanPage,
  renderProofCardBuilderPage,
  renderProofCardSvg,
  renderQueuePressurePage,
  renderScorecardBuilderPage,
  renderScorecardSvg,
  renderRepositoryDiagnosticsPage,
  renderSetupWizardPage,
  renderSpamRadarPage,
  renderStatusPage,
  renderTrustCenterPage,
} from "./render";
import type { GateRecord } from "./types";

const gate: GateRecord = {
  id: "gate-1",
  installation_id: "123",
  owner: "octo-org",
  repo: "awesome-repo",
  pr_number: 184,
  head_sha: "8f31c9a",
  pr_author: "some-user",
  status: "pending",
  gate_url: "https://example.com/gate/gate-1",
  gate_token_hash: "token-hash",
  gate_nonce_hash: "nonce-hash",
  check_run_id: null,
  comment_id: null,
  last_error: null,
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
  expires_at: "2026-07-14T00:00:00.000Z",
};

describe("rendering", () => {
  it("uses the AI slop landing headline", () => {
    const html = renderHome();

    expect(html).toContain("Make PR spam knock first.");
    expect(html).toContain("Hosted Worker. SHA-bound. No patch checkout.");
    expect(html).toContain("AI slop should wait outside the queue.");
    expect(html).toContain("Install the gate in one pass");
    expect(html).toContain("Protect pr-captcha/human");
    expect(html).toContain("Copy workflow gate");
    expect(html).toContain("Watch demo");
    expect(html).toContain("Start free");
    expect(html).toContain("Exact head SHA");
    expect(html).toContain("The gate is for attention, not taste policing.");
  });

  it("renders public PR count hydration with honest fallback labels", () => {
    const html = renderHome();

    expect(html).toContain("/api/public/pr-counts");
    expect(html).toContain('data-pr-count-repo="microsoft/vscode"');
    expect(html).toContain("Mixed live and snapshot PR counts");
    expect(html).toContain("Open-PR count snapshots");
  });

  it("renders share metadata and a branded Open Graph image", () => {
    const html = renderHome("https://captcha.example.test");
    const ogImage = renderOpenGraphImageSvg();

    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test" />',
    );
    expect(html).toContain(
      '<meta property="og:image" content="https://captcha.example.test/og.svg" />',
    );
    expect(html).toContain(
      '<meta name="twitter:card" content="summary_large_image" />',
    );
    expect(ogImage).toContain('width="1200" height="630"');
    expect(ogImage).toContain("Make AI slop prove");
    expect(ogImage).toContain("pr-captcha / human");
  });

  it("renders a CSRF token in the gate form", () => {
    const html = renderGatePage({
      gate,
      token: "gate-token",
      csrfToken: "csrf-token",
      session: {
        id: 1,
        login: "some-user",
        exp: 1791916800,
      },
      turnstileSiteKey: "turnstile-site-key",
    });

    expect(html).toContain('name="csrf_token" value="csrf-token"');
  });

  it("renders gate trust boundaries and receipt metadata", () => {
    const html = renderGatePage({
      gate,
      token: "gate-token",
      csrfToken: "csrf-token",
      session: {
        id: 1,
        login: "some-user",
        exp: 1791916800,
      },
      turnstileSiteKey: "turnstile-site-key",
    });

    expect(html).toContain("data-gate-shell");
    expect(html).toContain('data-gate-status="pending"');
    expect(html).toContain("Verification receipt");
    expect(html).toContain("What this proves");
    expect(html).toContain("No PR code runs here");
    expect(html).toContain("New commits need a new check");
    expect(html).toContain('data-gate-check="sha"');
    expect(html).toContain("<code>pr-captcha/human</code>");
    expect(html).toContain("octo-org/awesome-repo#184");
  });

  it("renders a verified gate as a receipt without Turnstile", () => {
    const html = renderGatePage({
      gate,
      token: "gate-token",
      csrfToken: "csrf-token",
      session: {
        id: 1,
        login: "some-user",
        exp: 1791916800,
      },
      turnstileSiteKey: "turnstile-site-key",
      verified: true,
      successDetail:
        "Human-origin check recorded for commit 8f31c9a. Approved held runs: 1. Rerun workflows: 2.",
    });

    expect(html).toContain('data-gate-status="verified"');
    expect(html).toContain("Human check passed");
    expect(html).toContain("Approved held runs: 1");
    expect(html).toContain("Return to pull request");
    expect(html).not.toContain("cf-turnstile");
    expect(html).not.toContain('method="post"');
  });

  it("renders the config preview tool", () => {
    const html = renderConfigPreviewPage("https://captcha.example.test");

    expect(html).toContain("Preview pr-captcha.yml");
    expect(html).toContain("Paste the repository policy before you commit it.");
    expect(html).toContain("/api/public/config-preview");
    expect(html).toContain("GitHub login enforced");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/config-preview" />',
    );
  });

  it("renders the public demo page", () => {
    const html = renderDemoPage("https://captcha.example.test");

    expect(html).toContain("PR captcha Gate Lab");
    expect(html).toContain("Run gate simulation");
    expect(html).toContain("Copy install config");
    expect(html).toContain("data-demo-replay");
    expect(html).toContain("data-demo-step");
    expect(html).toContain("data-demo-policy");
    expect(html).toContain("pr-captcha/human");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/demo" />',
    );
  });

  it("renders the queue pressure calculator", () => {
    const html = renderQueuePressurePage("https://captcha.example.test");

    expect(html).toContain("Measure your PR queue pressure");
    expect(html).toContain("data-queue-form");
    expect(html).toContain("data-queue-summary");
    expect(html).toContain('data-queue-preset="oss"');
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/queue-pressure" />',
    );
  });

  it("renders the repo evidence scanner", () => {
    const html = renderEvidenceScannerPage(
      "https://captcha.example.test",
      "kubernetes/kubernetes",
    );

    expect(html).toContain("Would this repo benefit?");
    expect(html).toContain("/api/public/repo-evidence");
    expect(html).toContain("data-evidence-form");
    expect(html).toContain("data-evidence-link");
    expect(html).toContain("data-evidence-copy-link");
    expect(html).toContain("Maintainer evidence brief");
    expect(html).toContain("data-evidence-brief");
    expect(html).toContain("data-evidence-copy-brief");
    expect(html).toContain("history.replaceState");
    expect(html).toContain("data-evidence-prs");
    expect(html).toContain('value="kubernetes/kubernetes"');
    expect(html).toContain(
      "https://captcha.example.test/evidence?repo=kubernetes%2Fkubernetes",
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/evidence" />',
    );
  });

  it("renders the open-source PR spam radar", () => {
    const html = renderSpamRadarPage("https://captcha.example.test");

    expect(html).toContain("See where PR spam is already labeled.");
    expect(html).toContain("data-radar-refresh");
    expect(html).toContain("data-radar-list");
    expect(html).toContain("data-radar-table");
    expect(html).toContain("Repositories to inspect");
    expect(html).toContain("data-radar-clusters");
    expect(html).toContain("Copyable maintainer brief");
    expect(html).toContain("GitHub search queries used by the radar");
    expect(html).toContain("label%3Aspam");
    expect(html).toContain("Load public GitHub labels");
    expect(html).toContain("/api/public/spam-radar");
    expect(html).toContain("Scan your repo");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/radar" />',
    );
  });

  it("renders the maintainer pilot plan", () => {
    const html = renderPilotPlanPage(
      "https://captcha.example.test",
      "tldraw/tldraw",
    );

    expect(html).toContain("Plan a 7-day maintainer pilot");
    expect(html).toContain("data-pilot-form");
    expect(html).toContain("data-pilot-run");
    expect(html).toContain("data-pilot-copy");
    expect(html).toContain("data-pilot-issue");
    expect(html).toContain("data-pilot-open-issue");
    expect(html).toContain("https://github.com/tldraw/tldraw/issues/new");
    expect(html).toContain("/api/public/repo-evidence");
    expect(html).toContain('value="tldraw/tldraw"');
    expect(html).toContain(
      "https://captcha.example.test/evidence?repo=tldraw%2Ftldraw",
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/pilot" />',
    );
  });

  it("renders the Trust Center", () => {
    const html = renderTrustCenterPage("https://captcha.example.test");

    expect(html).toContain("Trust Center");
    expect(html).toContain("Security model");
    expect(html).toContain("/security.md");
    expect(html).toContain("/privacy.md");
    expect(html).toContain("/terms.md");
    expect(html).toContain("Production accounts");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/trust" />',
    );
  });

  it("renders the README badge builder", () => {
    const html = renderBadgeBuilderPage("https://captcha.example.test");

    expect(html).toContain("Give maintainers a public proof mark");
    expect(html).toContain("data-badge-form");
    expect(html).toContain("data-badge-markdown");
    expect(html).toContain("data-badge-preview");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/badge-builder" />',
    );
  });

  it("renders a first-party README badge SVG", () => {
    const svg = renderBadgeSvg({
      label: "protected by",
      message: "pr-captcha",
      tone: "green",
      style: "rounded",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("protected by pr-captcha");
    expect(svg).toContain("#109b55");
    expect(svg).toContain('rx="6"');
  });

  it("renders the PR proof-card builder", () => {
    const html = renderProofCardBuilderPage("https://captcha.example.test");

    expect(html).toContain("Turn a verified PR into proof");
    expect(html).toContain("data-proof-form");
    expect(html).toContain("data-proof-preview");
    expect(html).toContain("data-proof-social");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/proof-card" />',
    );
  });

  it("renders a first-party PR proof-card SVG", () => {
    const svg = renderProofCardSvg({
      repo: "octo-org/awesome-repo",
      pr: "184",
      sha: "8f31c9a",
      user: "some-user",
      result: "verified",
      theme: "light",
    });

    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain("octo-org/awesome-repo");
    expect(svg).toContain("PR #184");
    expect(svg).toContain("Human verified");
    expect(svg).toContain("8f31c9a");
  });

  it("renders the OSS PR queue scorecard builder", () => {
    const html = renderScorecardBuilderPage(
      "https://captcha.example.test",
      "kubernetes/kubernetes",
    );

    expect(html).toContain("Repository queue scorecard");
    expect(html).toContain("data-scorecard-form");
    expect(html).toContain("data-scorecard-preview");
    expect(html).toContain("data-scorecard-url");
    expect(html).toContain("data-scorecard-social");
    expect(html).toContain("data-scorecard-issue");
    expect(html).toContain("data-scorecard-open-issue");
    expect(html).toContain("data-scorecard-share");
    expect(html).toContain("/api/public/repo-evidence");
    expect(html).toContain('value="kubernetes/kubernetes"');
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/scorecard-builder" />',
    );
  });

  it("renders a first-party repo queue scorecard SVG", () => {
    const svg = renderScorecardSvg({
      repo: "octo-org/awesome-repo",
      risk: "high",
      open: "184",
      fork: "24",
      unknown: "9",
      labels: "7",
      recommendation: "Require pr-captcha before heavy CI starts.",
      theme: "light",
    });

    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain("octo-org/awesome-repo");
    expect(svg).toContain("HIGH RISK");
    expect(svg).toContain("184");
    expect(svg).toContain("protected by pr-captcha");
  });

  it("renders the GitHub App manifest builder", () => {
    const html = renderGitHubAppManifestPage("https://captcha.example.test");

    expect(html).toContain("GitHub App manifest");
    expect(html).toContain("data-manifest-form");
    expect(html).toContain("data-manifest-json");
    expect(html).toContain("https://captcha.example.test/webhooks/github");
    expect(html).toContain("https://captcha.example.test/auth/github/callback");
    expect(html).toContain("&quot;checks&quot;: &quot;write&quot;");
    expect(html).toContain("&quot;pull_requests&quot;: &quot;write&quot;");
    expect(html).not.toContain("request_oauth_on_install");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/github-app-manifest" />',
    );
  });

  it("renders the GitHub App manifest callback handoff", () => {
    const html = renderGitHubAppManifestCallbackPage({
      baseUrl: "https://captcha.example.test",
      code: "abc123",
      state: "pr-captcha-state",
    });

    expect(html).toContain("Finish the manifest handoff");
    expect(html).toContain("CODE=&#39;abc123&#39;");
    expect(html).toContain(
      "https://api.github.com/app-manifests/${CODE}/conversions",
    );
    expect(html).toContain("Copy operator script");
    expect(html).toContain("data-manifest-conversion-script");
    expect(html).toContain("data-copy-manifest-conversion");
    expect(html).toContain("npx wrangler secret put GITHUB_APP_ID");
    expect(html).toContain("npx wrangler secret put GITHUB_PRIVATE_KEY");
    expect(html).toContain("npx wrangler secret put GITHUB_WEBHOOK_SECRET");
    expect(html).toContain("npx wrangler secret put GITHUB_CLIENT_ID");
    expect(html).toContain("npx wrangler secret put GITHUB_CLIENT_SECRET");
    expect(html).toContain("pr-captcha-state");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/github-app-manifest/callback" />',
    );
  });

  it("renders the launch cockpit", () => {
    const html = renderLaunchPage("https://captcha.example.test");

    expect(html).toContain("Make AI slop knock first.");
    expect(html).toContain("data-launch-form");
    expect(html).toContain("data-launch-commands");
    expect(html).toContain("npx wrangler d1 create pr-captcha");
    expect(html).toContain("Pages redirect");
    expect(html).toContain("https://aryabyte21.github.io/pr-captcha/");
    expect(html).toContain("gh api -X POST repos/aryabyte21/pr-captcha/pages");
    expect(html).toContain("gh api -X PUT repos/aryabyte21/pr-captcha/pages");
    expect(html).toContain("build_type=workflow");
    expect(html).toContain("npx wrangler secret put APP_BASE_URL");
    expect(html).toContain("npx wrangler secret put TURNSTILE_SITE_KEY");
    expect(html).toContain("Pages redirect");
    expect(html).toContain("Fork PR test");
    expect(html).toContain("Step 1");
    expect(html).toContain("data-launch-decision");
    expect(html).toContain("Before requiring the check");
    expect(html).toContain("data-launch-blocker-list");
    expect(html).toContain("Test it without drama");
    expect(html).toContain("data-launch-proof-stage");
    expect(html).toContain("Live readiness");
    expect(html).toContain("data-launch-readiness-refresh");
    expect(html).toContain("data-launch-readiness-status");
    expect(html).toContain("data-launch-readiness-list");
    expect(html).toContain("Maintainer adoption packet");
    expect(html).toContain("Copy GitHub issue");
    expect(html).toContain("data-launch-issue");
    expect(html).toContain("data-launch-badge");
    expect(html).toContain("README badge");
    expect(html).toContain("Repository: aryabyte21/pr-captcha");
    expect(html).toContain("pr-captcha/human");
    expect(html).toContain("/api/public/launch-readiness");
    expect(html).toContain("/health/ready");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/launch" />',
    );
  });

  it("renders the fork PR rehearsal console", () => {
    const html = renderForkPrRehearsalPage("https://captcha.example.test");

    expect(html).toContain("Run one harmless test PR.");
    expect(html).toContain("Before the check becomes required");
    expect(html).toContain("data-rehearsal-form");
    expect(html).toContain("data-rehearsal-progress");
    expect(html).toContain("Worker URL");
    expect(html).toContain("Installation ID");
    expect(html).toContain("Expected check");
    expect(html).toContain("Open test fork PR");
    expect(html).toContain("Webhook created gate");
    expect(html).toContain("Contributor solves CAPTCHA");
    expect(html).toContain("Action sees verified SHA");
    expect(html).toContain("Ready for branch protection");
    expect(html).toContain("data-rehearsal-tab");
    expect(html).toContain("data-rehearsal-runbook");
    expect(html).toContain("data-rehearsal-issue");
    expect(html).toContain("data-rehearsal-action");
    expect(html).toContain("aryabyte21/pr-captcha/packages/action@v1");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/rehearsal" />',
    );
  });

  it("renders the gate trace console", () => {
    const html = renderGateTracePage("https://captcha.example.test");

    expect(html).toContain("Trace one receipt end to end.");
    expect(html).toContain("Advanced debugging");
    expect(html).toContain("data-trace-form");
    expect(html).toContain("data-trace-progress");
    expect(html).toContain("Worker URL");
    expect(html).toContain("Webhook secret env");
    expect(html).toContain("Signed webhook curl");
    expect(html).toContain("Action guard YAML");
    expect(html).toContain("Acceptance proof");
    expect(html).toContain("data-trace-curl");
    expect(html).toContain("data-trace-action");
    expect(html).toContain("data-trace-proof");
    expect(html).toContain("Ready to require pr-captcha/human");
    expect(html).toContain("aryabyte21/pr-captcha/packages/action@v1");
    expect(html).toContain("/webhooks/github");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/gate-trace" />',
    );
  });

  it("renders the setup wizard", () => {
    const html = renderSetupWizardPage("https://captcha.example.test");

    expect(html).toContain("Create your repository policy.");
    expect(html).toContain("Start with fork");
    expect(html).toContain("data-wizard-repository");
    expect(html).toContain("data-wizard-scan");
    expect(html).toContain("data-wizard-evidence");
    expect(html).toContain("Repository-aware setup links");
    expect(html).toContain("/api/public/repo-evidence");
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
    expect(html).toContain("data-wizard-yaml");
    expect(html).toContain("/api/public/config-preview");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/setup-wizard" />',
    );
  });

  it("renders the repository diagnostics console", () => {
    const html = renderRepositoryDiagnosticsPage(
      "https://captcha.example.test",
    );

    expect(html).toContain("Repository diagnostics");
    expect(html).toContain("Confirm the GitHub App can read a repository");
    expect(html).toContain("data-run-diagnostics");
    expect(html).toContain("data-diagnostics-policy");
    expect(html).toContain("/api/admin/repositories/");
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/diagnostics" />',
    );
  });

  it("renders the public status page", () => {
    const html = renderStatusPage("https://captcha.example.test");

    expect(html).toContain("Is the little gate awake?");
    expect(html).toContain("data-refresh-status");
    expect(html).toContain("/health/ready");
    expect(html).toContain('data-status-tile="worker"');
    expect(html).toContain(
      '<link rel="canonical" href="https://captcha.example.test/status" />',
    );
  });
});
