import { describe, expect, it } from "vitest";
import {
  renderBadgeSvg,
  renderDemoPage,
  renderEvidenceScannerPage,
  renderGatePage,
  renderHome,
  renderOpenGraphImageSvg,
  renderSetupWizardPage,
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
  it("renders the bouncer landing", () => {
    const html = renderHome();

    expect(html).toContain("Your repo");
    expect(html).toContain("<em>bouncer</em>");
    expect(html).toContain("Not AI detection. A door.");
    expect(html).toContain("Install the GitHub App");
    expect(html).toContain("Stop refereeing taste. Charge at the door.");
    expect(html).toContain("pr-captcha/human");
    expect(html).toContain('data-theme="dark"');
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
    expect(ogImage).toContain("bouncer");
    expect(ogImage).toContain("pr-captcha / human");
  });

  it("escapes share image metadata", () => {
    const html = renderHome('https://captcha.example.test/?q="><script>');

    expect(html).toContain(
      'content="https://captcha.example.test/?q=&quot;&gt;&lt;script&gt;/og.svg"',
    );
    expect(html).not.toContain('content="https://captcha.example.test/?q=">');
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

  it("renders a pending gate with the human check form", () => {
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
    expect(html).toContain("Complete human check");
    expect(html).toContain("cf-turnstile");
    expect(html).toContain("No PR code runs here");
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

  it("encodes the verified redirect URL as a JavaScript string", () => {
    const html = renderGatePage({
      gate: {
        ...gate,
        owner: 'octo"org',
      },
      token: "gate-token",
      csrfToken: "csrf-token",
      session: {
        id: 1,
        login: "some-user",
        exp: 1791916800,
      },
      turnstileSiteKey: "turnstile-site-key",
      verified: true,
    });

    expect(html).toContain(
      'window.location.href = "https://github.com/octo\\"org/awesome-repo/pull/184";',
    );
    expect(html).not.toContain(
      'window.location.href = "https://github.com/octo"org',
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
