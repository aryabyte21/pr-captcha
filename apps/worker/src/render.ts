import type { GateRecord } from "./types";
import type { SessionUser } from "./env";

export function renderHome(): string {
  return layout(
    "pr-captcha",
    `<header class="site-header">
      <a class="brand" href="/"><span class="shield">✓</span><span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="#docs">Docs</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
        <a href="#roadmap">Roadmap</a>
      </nav>
      <a class="button header-cta" href="https://github.com/apps">Install GitHub App</a>
    </header>
    <main class="home">
      <section class="landing-hero">
        <div class="hero-copy">
          <h1>CAPTCHA before CI for GitHub Actions</h1>
          <p>Stop drive-by bots and agent-generated pull requests from burning maintainer time and CI minutes.</p>
          <div class="actions">
            <a class="button" href="https://github.com/apps">Install GitHub App</a>
            <a class="button secondary" href="#docs">Read the docs</a>
          </div>
          <div class="proof-grid" aria-label="Product guarantees">
            <div><span class="mini-shield">✓</span><strong>GitHub-native</strong><small>Uses workflow approval and Checks API</small></div>
            <div><span class="mini-shield">✓</span><strong>SHA-bound</strong><small>New commit, new human check</small></div>
            <div><span class="mini-shield">✓</span><strong>Security-first</strong><small>Never runs untrusted PR code</small></div>
          </div>
        </div>
        <div class="pr-preview" aria-label="pr-captcha pull request preview">
          <div class="repo-row">
            <strong>pr-captcha-demo</strong>
            <span>Public</span>
          </div>
          <p class="preview-title">Update README.md</p>
          <p class="preview-subtitle">#1842 opened by some-contributor</p>
          <div class="workflow-hold">
            <span class="hold-dot"></span>
            <div>
              <strong>ci.yml</strong>
              <small>Awaiting approval before running on a fork.</small>
            </div>
            <button type="button">View workflow run</button>
          </div>
          <div class="comment-preview">
            <div class="comment-top">
              <strong><span class="mini-shield">✓</span> pr-captcha</strong>
              <span>bot just now</span>
            </div>
            <h2>Human check required before CI starts</h2>
            <p>Please complete a quick verification before GitHub Actions runs.</p>
            <a class="button compact" href="#demo">Run CI after human check</a>
            <p class="preview-subtitle">PR: #1842 &middot; Commit: 8f31c9a &middot; Author: some-contributor</p>
          </div>
        </div>
      </section>
      <section class="section" id="demo">
        <div class="section-heading">
          <span></span>
          <h2>How it works</h2>
          <span></span>
        </div>
        <div class="flow-grid">
          ${flowStep("1", "PR opened", "Contributor opens a PR from a fork or for the first time.")}
          ${flowStep("2", "CI paused", "GitHub holds the workflow run awaiting approval.")}
          ${flowStep("3", "CAPTCHA solved", "Contributor logs in with GitHub and solves the browser CAPTCHA.")}
          ${flowStep("4", "Workflow approved", "pr-captcha approves the exact workflow run through GitHub.")}
          ${flowStep("5", "CI starts", "GitHub Actions starts and runs the repository workflow.")}
        </div>
      </section>
      <section class="section" id="docs">
        <div class="section-heading">
          <span></span>
          <h2>Ways to integrate</h2>
          <span></span>
        </div>
        <div class="mode-grid">
          <article class="mode-card recommended">
            <div class="mode-title"><span class="icon-box">1</span><h3>Native fork gate</h3></div>
            <p>Use GitHub's native awaiting approval state for fork workflows. pr-captcha approves the run after a human verification.</p>
            <ul>
              <li>Saves CI minutes</li>
              <li>Zero runner minutes spent</li>
              <li>Works with required checks</li>
            </ul>
            <pre><code>Settings -> Actions -> General
Fork pull request workflows
Require approval for outside contributors</code></pre>
          </article>
          <article class="mode-card">
            <div class="mode-title"><span class="icon-box">2</span><h3>Universal Action gate</h3></div>
            <p>Add a tiny job before expensive jobs. Until verification passes, the job fails quickly and dependent jobs do not run.</p>
            <ul>
              <li>Works for any PR</li>
              <li>Protects expensive jobs</li>
              <li>Can rerun after approval</li>
            </ul>
            <pre><code>jobs:
  human-gate:
    steps:
      - uses: pr-captcha/gate@v1</code></pre>
          </article>
          <article class="mode-card">
            <div class="mode-title"><span class="icon-box">3</span><h3>Required check</h3></div>
            <p>pr-captcha creates a SHA-bound check named <code>pr-captcha/human</code> that branch protection can require.</p>
            <ul>
              <li>Branch protection friendly</li>
              <li>Clear reviewer signal</li>
              <li>Commit-specific status</li>
            </ul>
            <div class="status-board">
              <div><span class="ok-dot"></span><strong>pr-captcha/human</strong><span>Success</span></div>
              <div><span class="wait-dot"></span><strong>ci / build</strong><span>Pending</span></div>
              <div><span class="wait-dot muted"></span><strong>ci / test</strong><span>Pending</span></div>
            </div>
          </article>
        </div>
        <div class="security-strip">
          <strong>Security first:</strong>
          <span>pr-captcha never checks out untrusted PR code and never executes the patch from a privileged context.</span>
        </div>
      </section>
      <section class="section" id="roadmap">
        <div class="section-heading">
          <span></span>
          <h2>From MVP to production</h2>
          <span></span>
        </div>
        <div class="roadmap-grid">
          ${roadmapCard("1", "Beta MVP", "Current", [
            "GitHub App installation",
            "Signed PR verification links",
            "GitHub OAuth plus Turnstile",
            "Approve fork workflow runs",
            "Required check and universal Action gate",
            "SHA-bound verification store",
          ])}
          ${roadmapCard("2", "Hardening", "Next", [
            "Replay protection and nonce hardening",
            "Rate limits and abuse controls",
            "First-time contributor detection",
            "Config and repository overrides",
            "Audit log and admin retry path",
            "End-to-end reliability tests",
          ])}
          ${roadmapCard("3", "Launch", "Target", [
            "Team and organization management",
            "Granular policy controls",
            "Webhook notifications",
            "Advanced analytics with opt-in",
            "SLA and support process",
            "Billing and scale controls",
          ])}
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <div class="brand"><span class="shield">✓</span><span>pr-captcha</span></div>
      <p>Human gate before GitHub Actions burns CI minutes.</p>
      <strong class="footer-tagline">No CAPTCHA, no CI.</strong>
    </footer>`,
  );
}

function flowStep(number: string, title: string, body: string): string {
  return `<article class="flow-step">
    <span>${escapeHtml(number)}</span>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(body)}</p>
  </article>`;
}

function roadmapCard(
  number: string,
  title: string,
  status: string,
  items: string[],
): string {
  return `<article class="roadmap-card">
    <div class="roadmap-title">
      <span>${escapeHtml(number)}</span>
      <div>
        <h3>${escapeHtml(title)}</h3>
        <small>${escapeHtml(status)}</small>
      </div>
    </div>
    <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </article>`;
}

export function renderGatePage(input: {
  gate: GateRecord;
  token: string;
  session: SessionUser;
  turnstileSiteKey: string;
  error?: string;
  verified?: boolean;
}): string {
  const shortSha = input.gate.head_sha.slice(0, 7);
  const error = input.error
    ? `<div class="notice error">${escapeHtml(input.error)}</div>`
    : "";
  const success = input.verified
    ? `<div class="notice success">Human check passed for commit ${escapeHtml(shortSha)}.</div>`
    : "";
  const button = input.verified
    ? `<a class="button full" href="https://github.com/${escapeHtml(input.gate.owner)}/${escapeHtml(input.gate.repo)}/pull/${input.gate.pr_number}">Return to pull request</a>`
    : `<button class="button full" type="submit">Approve and run CI</button>`;
  const turnstile = input.verified
    ? ""
    : `<div class="turnstile-wrap">
        <div class="cf-turnstile" data-sitekey="${escapeHtml(input.turnstileSiteKey)}"></div>
      </div>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`;

  return layout(
    "Run CI for this pull request?",
    `<main class="gate-page">
      <section class="gate">
        <div class="brand centered"><span class="shield">✓</span><span>pr-captcha</span></div>
        <h1>Run CI for this pull request?</h1>
        <p class="intro">To help protect repository CI from unauthorized usage, verify that you are human.</p>
        <div class="status-strip">
          <span><span class="mini-shield">✓</span>SHA-bound</span>
          <span><span class="mini-shield">✓</span>GitHub verified</span>
        </div>
        ${error}
        ${success}
        <form method="post" action="/gate/${escapeHtml(input.gate.id)}">
          <input type="hidden" name="token" value="${escapeHtml(input.token)}" />
          <div class="meta-table">
            ${metaRow("Repository", `${input.gate.owner}/${input.gate.repo}`)}
            ${metaRow("Pull request", `#${input.gate.pr_number}`)}
            ${metaRow("Commit", shortSha, true)}
            ${metaRow("GitHub user", input.session.login)}
          </div>
          ${turnstile}
          ${button}
        </form>
        <p class="fine-print">Your verification is valid for this commit only. Pushing a new commit requires a new check.</p>
      </section>
    </main>`,
  );
}

export function renderMessagePage(
  title: string,
  message: string,
  status: "success" | "error" = "success",
): string {
  return layout(
    title,
    `<main class="gate-page">
      <section class="gate small">
        <div class="brand centered"><span class="shield">✓</span><span>pr-captcha</span></div>
        <h1>${escapeHtml(title)}</h1>
        <div class="notice ${status}">${escapeHtml(message)}</div>
      </section>
    </main>`,
  );
}

function metaRow(label: string, value: string, code = false): string {
  const renderedValue = code
    ? `<code>${escapeHtml(value)}</code>`
    : escapeHtml(value);
  return `<div class="meta-row"><div>${escapeHtml(label)}</div><div>${renderedValue}</div></div>`;
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #ffffff;
        --text: #0f1720;
        --muted: #5d6673;
        --border: #d8dee6;
        --soft: #f8fafc;
        --accent: #087f3f;
        --accent-dark: #046a34;
        --danger: #b42318;
        --danger-bg: #fff1f0;
        --success-bg: #ecfdf3;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }
      a {
        color: inherit;
        text-decoration: none;
      }
      .site-header {
        width: min(1180px, calc(100% - 48px));
        min-height: 72px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 1px solid var(--border);
      }
      .site-nav {
        display: flex;
        align-items: center;
        gap: 30px;
        color: #202936;
        font-size: 14px;
        font-weight: 720;
      }
      .header-cta {
        min-height: 42px;
        padding: 0 16px;
      }
      .home {
        width: min(1180px, calc(100% - 48px));
        margin: 0 auto;
        padding: 34px 0 44px;
      }
      .gate-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 48px 20px;
      }
      .landing-hero {
        display: grid;
        grid-template-columns: minmax(0, 1.02fr) minmax(440px, 0.98fr);
        gap: 58px;
        align-items: center;
        min-height: calc(100vh - 116px);
        padding: 38px 0 46px;
      }
      .hero-copy h1 {
        margin: 0 0 22px;
        max-width: 660px;
        font-size: clamp(50px, 6.4vw, 78px);
        line-height: 0.96;
        letter-spacing: 0;
      }
      .hero-copy p {
        max-width: 660px;
        margin: 0;
        color: var(--muted);
        font-size: 21px;
        line-height: 1.5;
      }
      .proof-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-top: 44px;
      }
      .proof-grid div {
        display: grid;
        gap: 8px;
      }
      .proof-grid strong {
        font-size: 14px;
      }
      .proof-grid small {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .pr-preview,
      .section,
      .mode-card,
      .roadmap-card {
        border: 1px solid var(--border);
        border-radius: 8px;
        background: #ffffff;
      }
      .pr-preview {
        padding: 18px;
        box-shadow: 0 22px 60px rgba(15, 23, 32, 0.08);
      }
      .repo-row,
      .comment-top,
      .mode-title,
      .roadmap-title,
      .status-board div {
        display: flex;
        align-items: center;
      }
      .repo-row {
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }
      .repo-row span {
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 3px 8px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }
      .preview-title {
        margin: 0 0 4px;
        font-weight: 720;
      }
      .preview-subtitle {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .workflow-hold,
      .comment-preview {
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-top: 16px;
        padding: 16px;
      }
      .workflow-hold {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 14px;
      }
      .workflow-hold small,
      .comment-preview p {
        color: var(--muted);
        line-height: 1.45;
      }
      .workflow-hold button {
        min-height: 38px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: #ffffff;
        color: var(--text);
        font-weight: 720;
      }
      .hold-dot,
      .ok-dot,
      .wait-dot {
        display: inline-block;
        flex: 0 0 auto;
        border-radius: 999px;
      }
      .hold-dot {
        width: 11px;
        height: 11px;
        background: #f2b84b;
      }
      .comment-top {
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
        font-size: 13px;
      }
      .comment-top strong {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--text);
      }
      .comment-preview h2 {
        margin: 14px 0 8px;
        font-size: 19px;
        line-height: 1.2;
      }
      .comment-preview p {
        margin: 0 0 14px;
        font-size: 14px;
      }
      .button.compact {
        min-height: 38px;
        margin-bottom: 12px;
        padding: 0 14px;
        font-size: 14px;
      }
      .section {
        margin-top: 26px;
        padding: 28px;
      }
      .section-heading {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 28px;
        margin-bottom: 26px;
        text-align: center;
      }
      .section-heading span {
        height: 1px;
        background: var(--border);
      }
      .section-heading h2 {
        margin: 0;
        font-size: 26px;
        line-height: 1.1;
      }
      .flow-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 18px;
      }
      .flow-step {
        min-height: 178px;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 18px;
        display: grid;
        align-content: start;
        gap: 14px;
      }
      .flow-step span,
      .icon-box,
      .roadmap-title > span {
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--soft);
        font-weight: 800;
      }
      .flow-step h3,
      .mode-card h3,
      .roadmap-card h3 {
        margin: 0;
        font-size: 17px;
        line-height: 1.25;
      }
      .flow-step p,
      .mode-card p,
      .roadmap-card li,
      .mode-card li {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .flow-step p,
      .mode-card p {
        margin: 0;
      }
      .mode-grid,
      .roadmap-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
      }
      .mode-card,
      .roadmap-card {
        padding: 22px;
      }
      .mode-card.recommended {
        box-shadow: inset 0 0 0 1px rgba(8, 127, 63, 0.18);
      }
      .mode-title,
      .roadmap-title {
        gap: 12px;
        margin-bottom: 16px;
      }
      .mode-card ul,
      .roadmap-card ul {
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }
      .mode-card li::before,
      .roadmap-card li::before {
        content: "✓";
        color: var(--accent);
        font-weight: 900;
        margin-right: 8px;
      }
      pre {
        margin: 20px 0 0;
        border-radius: 8px;
        background: #111820;
        color: #f8fafc;
        overflow: auto;
        padding: 16px;
        white-space: pre-wrap;
      }
      pre code {
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .status-board {
        margin-top: 20px;
        border-radius: 8px;
        background: #111820;
        color: #f8fafc;
        padding: 14px;
      }
      .status-board div {
        justify-content: space-between;
        gap: 10px;
        min-height: 36px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 13px;
      }
      .status-board div:last-child {
        border-bottom: 0;
      }
      .ok-dot,
      .wait-dot {
        width: 12px;
        height: 12px;
        border: 2px solid currentColor;
      }
      .ok-dot {
        background: var(--accent);
        border-color: var(--accent);
      }
      .wait-dot {
        color: #f2b84b;
      }
      .wait-dot.muted {
        color: #768191;
      }
      .status-board span:last-child {
        color: #8ee6a8;
      }
      .security-strip {
        display: flex;
        gap: 10px;
        margin-top: 22px;
        border: 1px solid #c9ecd5;
        border-radius: 8px;
        background: #f0fdf4;
        color: #17452c;
        padding: 16px 18px;
        font-size: 14px;
        line-height: 1.5;
      }
      .roadmap-title > span {
        border-radius: 999px;
        background: var(--text);
        color: #ffffff;
      }
      .roadmap-title small {
        color: var(--muted);
        font-weight: 720;
      }
      .site-footer {
        width: min(1180px, calc(100% - 48px));
        margin: 0 auto;
        border-top: 1px solid var(--border);
        padding: 28px 0 34px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }
      .site-footer p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
      }
      .footer-tagline {
        color: var(--accent);
        font-size: 18px;
        font-weight: 800;
      }
      .hero {
        width: min(760px, 100%);
      }
      .hero h1 {
        margin: 28px 0 16px;
        max-width: 680px;
        font-size: clamp(40px, 7vw, 76px);
        line-height: 0.98;
      }
      .hero p {
        max-width: 620px;
        color: var(--muted);
        font-size: 20px;
        line-height: 1.55;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-size: 28px;
        font-weight: 760;
      }
      .brand.centered {
        display: flex;
        justify-content: center;
      }
      .shield,
      .mini-shield {
        display: inline-grid;
        place-items: center;
        border: 2px solid currentColor;
        color: var(--accent);
        font-weight: 900;
      }
      .shield {
        width: 36px;
        height: 36px;
        border-radius: 11px;
      }
      .mini-shield {
        width: 22px;
        height: 22px;
        border-radius: 7px;
        font-size: 13px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 32px;
      }
      .button {
        border: 0;
        border-radius: 8px;
        background: var(--accent);
        color: white;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 20px;
        font-size: 16px;
        font-weight: 740;
        text-decoration: none;
        box-shadow: 0 12px 24px rgba(8, 127, 63, 0.18);
      }
      .button:hover {
        background: var(--accent-dark);
      }
      .button.secondary {
        background: var(--soft);
        border: 1px solid var(--border);
        color: var(--text);
        box-shadow: none;
      }
      .button.full {
        width: 100%;
        min-height: 58px;
        margin-top: 22px;
        font-size: 19px;
      }
      .gate {
        width: min(590px, 100%);
        text-align: center;
      }
      .gate.small {
        width: min(480px, 100%);
      }
      .gate h1 {
        margin: 28px 0 12px;
        font-size: clamp(32px, 7vw, 42px);
        line-height: 1.08;
      }
      .intro,
      .fine-print {
        color: var(--muted);
        line-height: 1.5;
      }
      .intro {
        margin: 0 auto 28px;
        max-width: 460px;
        font-size: 18px;
      }
      .fine-print {
        margin: 18px auto 0;
        max-width: 410px;
        font-size: 14px;
      }
      .status-strip {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border: 1px solid var(--border);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 20px;
      }
      .status-strip span {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 56px;
        color: var(--accent);
        font-size: 17px;
        font-weight: 720;
      }
      .status-strip span + span {
        border-left: 1px solid var(--border);
      }
      .meta-table {
        border: 1px solid var(--border);
        border-radius: 6px;
        overflow: hidden;
        text-align: left;
      }
      .meta-row {
        display: grid;
        grid-template-columns: 1fr 1.05fr;
      }
      .meta-row + .meta-row {
        border-top: 1px solid var(--border);
      }
      .meta-row > div {
        min-height: 54px;
        display: flex;
        align-items: center;
        padding: 0 22px;
        font-size: 16px;
      }
      .meta-row > div:first-child {
        color: #27303b;
        background: #fcfdff;
        border-right: 1px solid var(--border);
        font-weight: 620;
      }
      code {
        padding: 3px 8px;
        border: 1px solid var(--border);
        border-radius: 5px;
        background: var(--soft);
        color: var(--text);
        font-size: 15px;
      }
      .turnstile-wrap {
        display: grid;
        place-items: center;
        min-height: 112px;
        margin-top: 18px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: linear-gradient(#ffffff, #fbfcfd);
      }
      .notice {
        margin: 0 0 18px;
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 14px 16px;
        font-size: 15px;
        line-height: 1.45;
        text-align: left;
      }
      .notice.error {
        background: var(--danger-bg);
        border-color: #ffcdc9;
        color: var(--danger);
      }
      .notice.success {
        background: var(--success-bg);
        border-color: #b7efc9;
        color: var(--accent-dark);
      }
      @media (max-width: 560px) {
        .gate-page {
          align-items: start;
          padding: 30px 16px;
        }
        .site-header,
        .site-footer {
          width: min(100% - 32px, 1180px);
        }
        .site-header {
          align-items: flex-start;
          flex-direction: column;
          padding: 18px 0;
        }
        .site-nav {
          gap: 18px;
        }
        .header-cta {
          width: 100%;
        }
        .home {
          width: min(100% - 32px, 1180px);
          padding-top: 22px;
        }
        .landing-hero,
        .mode-grid,
        .roadmap-grid,
        .flow-grid {
          grid-template-columns: 1fr;
        }
        .landing-hero {
          min-height: auto;
          gap: 30px;
        }
        .hero-copy h1 {
          font-size: clamp(42px, 14vw, 62px);
        }
        .hero-copy p {
          font-size: 18px;
        }
        .proof-grid {
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 30px;
        }
        .workflow-hold {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .workflow-hold button {
          grid-column: 1 / -1;
        }
        .section {
          padding: 20px;
        }
        .section-heading {
          grid-template-columns: 1fr;
          gap: 12px;
          text-align: left;
        }
        .section-heading span {
          display: none;
        }
        .security-strip,
        .site-footer {
          flex-direction: column;
          align-items: flex-start;
        }
        .brand {
          font-size: 24px;
        }
        .status-strip,
        .meta-row {
          grid-template-columns: 1fr;
        }
        .status-strip span + span,
        .meta-row > div:first-child {
          border-left: 0;
          border-right: 0;
          border-top: 1px solid var(--border);
        }
        .meta-row > div:first-child {
          min-height: 42px;
          background: var(--soft);
        }
        .meta-row > div {
          padding: 0 16px;
        }
      }
    </style>
  </head>
  <body>${body}</body>
</html>`;
}

export function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
