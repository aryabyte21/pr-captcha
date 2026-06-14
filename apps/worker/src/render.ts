import type { GateRecord } from "./types";
import type { SessionUser } from "./env";

export function renderHome(): string {
  return layout(
    "pr-captcha",
    `<header class="site-header">
      <a class="brand" href="/"><span class="brand-mark">p</span><span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="#how">How it works</a>
        <a href="#integration">Integration</a>
        <a href="#security">Security</a>
        <a href="#roadmap">Roadmap</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="https://github.com/apps">Install GitHub App</a>
    </header>
    <main class="home">
      <section class="hero">
        <div class="hero-copy">
          <h1>Do not spend CI on drive-by pull requests.</h1>
          <p>Hold suspicious PR workflows until a GitHub-authenticated human verifies the exact head SHA.</p>
          <div class="actions">
            <a class="button dark" href="https://github.com/apps">Install GitHub App</a>
            <a class="button light" href="#integration">View setup</a>
          </div>
          <p class="proof-line"><span class="success-shield">✓</span>No CAPTCHA, no CI.</p>
        </div>
        <div class="product-stage" aria-label="pr-captcha pull request flow preview">
          <div class="repo-shell">
            <div class="repo-topbar">
              <strong>octo-org / awesome-repo</strong>
              <span>Pull requests 184</span>
            </div>
            <div class="repo-pr">
              <h2>Add feature</h2>
              <p><strong>Open</strong> some-user wants to merge 3 commits into <code>main</code> from <code>some-user:feature</code></p>
            </div>
          </div>
          <div class="workflow-card">
            <div class="card-top"><strong>GitHub Actions / ci.yml</strong><span>2m ago</span></div>
            <h3>Workflow run 1234567890</h3>
            <div class="approval-box">
              <span class="warn-dot"></span>
              <div>
                <strong>Awaiting approval</strong>
                <p>This workflow run is waiting for approval to run from a public fork.</p>
              </div>
            </div>
          </div>
          <div class="check-card">
            <div class="card-top"><strong>pr-captcha / human</strong><span>Required</span></div>
            <h3>Human verification required</h3>
            <p>Solve pr-captcha to allow CI to run.</p>
            <button type="button">Verify human</button>
          </div>
          <div class="comment-card">
            <div class="card-top"><strong>pr-captcha</strong><span>bot · now</span></div>
            <h3>Human check required before CI starts</h3>
            <p>This repository uses pr-captcha to protect maintainer time and CI minutes.</p>
            <a class="button dark compact" href="#how">Run CI after human check</a>
          </div>
          <div class="gate-card">
            <div class="gate-brand"><span class="brand-mark small">p</span><strong>pr-captcha</strong></div>
            <h3>Verify to run CI</h3>
            <dl>
              <div><dt>Repository</dt><dd>octo-org/awesome-repo</dd></div>
              <div><dt>Pull request</dt><dd>#184</dd></div>
              <div><dt>Commit</dt><dd>8f31c9a</dd></div>
              <div><dt>GitHub user</dt><dd>some-user</dd></div>
            </dl>
            <div class="captcha-box">
              <span>✓</span>
              <strong>Verify you are human</strong>
              <small>Turnstile</small>
            </div>
            <button type="button">Approve and run CI</button>
            <p>Bound to this exact commit SHA.</p>
          </div>
        </div>
      </section>
      <section class="timeline-section" id="how">
        <h2>What happens on a PR</h2>
        <div class="timeline">
          ${timelineItem("1", "PR opened", "A fork or first-time contributor opens a pull request.")}
          ${timelineItem("2", "Workflow held", "GitHub keeps the workflow in awaiting approval state.")}
          ${timelineItem("3", "CAPTCHA solved", "Contributor logs in with GitHub and completes browser verification.")}
          ${timelineItem("4", "Workflow approved", "pr-captcha checks the exact SHA and approves the workflow run.")}
          ${timelineItem("5", "CI starts", "GitHub Actions starts only after a human shows up.")}
        </div>
      </section>
      <section class="integration-section" id="integration">
        <h2>Integration paths</h2>
        <div class="comparison-wrap">
          <table class="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th>Native fork gate</th>
                <th>Universal Action gate</th>
                <th>Required check</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>When to use</th>
                <td>Public repos using GitHub's approval queue for fork workflows.</td>
                <td>Any repo, including same-repo PRs, where expensive jobs need protection.</td>
                <td>Repositories that need merge protection before human verification completes.</td>
              </tr>
              <tr>
                <th>How it works</th>
                <td>GitHub holds the workflow run. pr-captcha approves it after CAPTCHA.</td>
                <td>A tiny job runs first. Expensive jobs wait on it.</td>
                <td>pr-captcha creates a required check on the pull request SHA.</td>
              </tr>
              <tr>
                <th>CI cost</th>
                <td>No runner minutes until approved.</td>
                <td>One tiny job uses minutes.</td>
                <td>No runner minutes by itself.</td>
              </tr>
              <tr>
                <th>Setup</th>
                <td>Enable fork approval and install the app.</td>
                <td>Add one step to your workflow.</td>
                <td>Enable required check in branch protection.</td>
              </tr>
              <tr>
                <th>Blocks CI</th>
                <td><span class="yes">Yes</span>, before any jobs start.</td>
                <td><span class="partial">Partial</span>, blocks heavy jobs.</td>
                <td><span class="no">No</span>, merge gate only.</td>
              </tr>
              <tr>
                <th>Best for</th>
                <td>Open-source fork PR spam.</td>
                <td>Private repos and broad adoption.</td>
                <td>Compliance-style reviewer signal.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="integration-mobile">
          ${integrationMobileCard("Native fork gate", [
            "Best for public repos and fork PR spam.",
            "GitHub holds the workflow run.",
            "No runner minutes until approved.",
            "Blocks CI before jobs start.",
          ])}
          ${integrationMobileCard("Universal Action gate", [
            "Best for private repos and broad adoption.",
            "A tiny job runs first.",
            "Expensive jobs wait on it.",
            "Uses one tiny job worth of minutes.",
          ])}
          ${integrationMobileCard("Required check", [
            "Best for merge protection.",
            "Creates a required check on the PR SHA.",
            "Does not affect CI start by itself.",
            "Clear reviewer signal.",
          ])}
        </div>
      </section>
      <section class="security-band" id="security">
        <div>
          <h2>Security model: metadata only.</h2>
          <p>The privileged app reads PR metadata, verifies a GitHub session and Turnstile token, then approves or denies a workflow run. It never checks out or executes the pull request patch.</p>
        </div>
        <div class="security-grid">
          <span>GitHub OAuth</span>
          <span>Exact head SHA</span>
          <span>Server-side CAPTCHA</span>
          <span>Installation token</span>
        </div>
      </section>
      <section class="roadmap-section" id="roadmap">
        <h2>Production path</h2>
        <div class="roadmap-grid">
          ${roadmapCard(
            "1",
            "Beta",
            [
              "Core fork gate flow",
              "Turnstile verification",
              "Checks, comments, workflow approval",
              "YAML configuration",
              "Audit logging",
            ],
            "Goal: prove value with real repositories.",
          )}
          ${roadmapCard(
            "2",
            "Hardening",
            [
              "Rate limiting and abuse controls",
              "Replay protection and SHA binding",
              "Idempotent approvals",
              "Observability and alerts",
              "Comprehensive tests",
            ],
            "Goal: secure, reliable, and boring.",
          )}
          ${roadmapCard(
            "3",
            "Launch",
            [
              "Highly available deploy",
              "Backups and disaster recovery",
              "Documentation and guides",
              "Community feedback loop",
              "SLA and incident response",
            ],
            "Goal: trusted by maintainers at scale.",
          )}
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <div>
        <div class="brand footer-brand"><span class="brand-mark">p</span><span>pr-captcha</span></div>
        <p>Human gate before CI burns minutes.</p>
        <strong>No CAPTCHA, no CI.</strong>
      </div>
      <div class="footer-points">
        <span>GitHub App</span>
        <span>SHA-bound</span>
        <span>Maintainer control</span>
        <span>Real humans</span>
      </div>
      <div class="footer-actions">
        <a class="button light-on-dark" href="https://github.com/apps">Install GitHub App</a>
        <a class="button ghost-on-dark" href="#integration">View setup guide</a>
      </div>
    </footer>`,
  );
}

function timelineItem(number: string, title: string, body: string): string {
  return `<article class="timeline-item">
    <span>${escapeHtml(number)}</span>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(body)}</p>
  </article>`;
}

function integrationMobileCard(title: string, items: string[]): string {
  return `<article class="integration-card">
    <h3>${escapeHtml(title)}</h3>
    <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </article>`;
}

function roadmapCard(
  number: string,
  title: string,
  items: string[],
  goal: string,
): string {
  return `<article class="roadmap-card">
    <div class="roadmap-title"><span>${escapeHtml(number)}</span><h3>${escapeHtml(title)}</h3></div>
    <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <p>${escapeHtml(goal)}</p>
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
    ? `<a class="button dark full" href="https://github.com/${escapeHtml(input.gate.owner)}/${escapeHtml(input.gate.repo)}/pull/${input.gate.pr_number}">Return to pull request</a>`
    : `<button class="button dark full" type="submit">Approve and run CI</button>`;
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
        <div class="brand centered"><span class="brand-mark">p</span><span>pr-captcha</span></div>
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
        <div class="brand centered"><span class="brand-mark">p</span><span>pr-captcha</span></div>
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
        --ink: #080d14;
        --text: #101821;
        --muted: #5b6673;
        --faint: #f6f8fa;
        --line: #d9dee6;
        --line-dark: #202a35;
        --green: #0b8f4d;
        --green-dark: #08733e;
        --amber: #f3a000;
        --red: #b42318;
        --red-bg: #fff1f0;
        --success-bg: #ecfdf3;
        --shadow: 0 22px 60px rgba(8, 13, 20, 0.12);
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          linear-gradient(90deg, rgba(8, 13, 20, 0.035) 1px, transparent 1px),
          linear-gradient(180deg, rgba(8, 13, 20, 0.03) 1px, transparent 1px),
          var(--bg);
        background-size: 72px 72px;
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }
      a {
        color: inherit;
        text-decoration: none;
      }
      button,
      .button {
        font: inherit;
      }
      .site-header,
      .home,
      .site-footer {
        width: min(1200px, calc(100% - 48px));
        margin: 0 auto;
      }
      .site-header {
        min-height: 78px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 1px solid var(--line);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-weight: 840;
        font-size: 28px;
        color: var(--ink);
      }
      .brand.centered {
        display: flex;
        justify-content: center;
      }
      .brand-mark {
        width: 38px;
        height: 38px;
        display: inline-grid;
        place-items: center;
        border-radius: 9px;
        background: var(--ink);
        color: #ffffff;
        font-weight: 900;
        font-size: 20px;
        box-shadow: inset 0 0 0 2px #ffffff, 0 0 0 1px var(--ink);
      }
      .brand-mark.small {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        font-size: 13px;
      }
      .site-nav {
        display: flex;
        align-items: center;
        gap: 30px;
        color: #222c38;
        font-size: 14px;
        font-weight: 720;
      }
      .button {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        padding: 0 20px;
        border: 1px solid transparent;
        cursor: pointer;
        font-weight: 800;
        font-size: 15px;
        white-space: nowrap;
      }
      .button.dark,
      .gate-card button {
        background: var(--ink);
        color: #ffffff;
        box-shadow: 0 12px 24px rgba(8, 13, 20, 0.16);
      }
      .button.dark:hover,
      .gate-card button:hover {
        background: #1a232e;
      }
      .button.light {
        background: #ffffff;
        border-color: var(--line);
        color: var(--ink);
      }
      .button.compact {
        min-height: 40px;
        padding: 0 14px;
        font-size: 13px;
      }
      .header-cta {
        min-height: 42px;
      }
      .home {
        padding: 30px 0 46px;
      }
      .hero {
        min-height: calc(100vh - 108px);
        display: grid;
        grid-template-columns: minmax(0, 0.86fr) minmax(560px, 1.14fr);
        align-items: center;
        gap: 58px;
        padding: 34px 0 52px;
      }
      .hero-copy h1 {
        max-width: 620px;
        margin: 0 0 26px;
        color: var(--ink);
        font-size: clamp(58px, 6.8vw, 92px);
        line-height: 0.94;
        letter-spacing: 0;
      }
      .hero-copy p {
        max-width: 570px;
        margin: 0;
        color: #3e4957;
        font-size: 21px;
        line-height: 1.55;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        margin-top: 36px;
      }
      .proof-line {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 40px !important;
        color: var(--ink) !important;
        font-size: 22px !important;
        font-weight: 850;
      }
      .success-shield,
      .mini-shield {
        display: inline-grid;
        place-items: center;
        color: #ffffff;
        background: var(--green);
        font-weight: 900;
      }
      .success-shield {
        width: 30px;
        height: 30px;
        border-radius: 8px;
      }
      .mini-shield {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        font-size: 12px;
      }
      .product-stage {
        position: relative;
        min-height: 700px;
      }
      .repo-shell,
      .workflow-card,
      .check-card,
      .comment-card,
      .gate-card,
      .timeline-section,
      .integration-section,
      .roadmap-card {
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid var(--line);
        border-radius: 7px;
      }
      .repo-shell {
        position: absolute;
        top: 0;
        left: 0;
        right: 118px;
        overflow: hidden;
        box-shadow: var(--shadow);
      }
      .repo-topbar {
        min-height: 62px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 18px;
        background: #090e15;
        color: #ffffff;
      }
      .repo-topbar span {
        color: #b8c0cc;
        font-size: 13px;
      }
      .repo-pr {
        padding: 18px;
      }
      .repo-pr h2,
      .workflow-card h3,
      .check-card h3,
      .comment-card h3,
      .gate-card h3 {
        margin: 0;
        color: var(--ink);
        line-height: 1.2;
      }
      .repo-pr h2 {
        font-size: 21px;
      }
      .repo-pr p,
      .workflow-card p,
      .check-card p,
      .comment-card p,
      .gate-card p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .repo-pr strong {
        display: inline-flex;
        align-items: center;
        min-height: 22px;
        padding: 0 9px;
        border-radius: 999px;
        background: #6f42c1;
        color: #ffffff;
        font-size: 12px;
        margin-right: 8px;
      }
      code {
        padding: 2px 6px;
        border: 1px solid var(--line);
        border-radius: 4px;
        background: var(--faint);
        color: var(--ink);
        font-size: 0.92em;
      }
      .workflow-card,
      .check-card,
      .comment-card {
        position: absolute;
        left: 0;
        width: calc(100% - 286px);
        padding: 18px;
        box-shadow: 0 16px 36px rgba(8, 13, 20, 0.08);
      }
      .workflow-card {
        top: 172px;
      }
      .check-card {
        top: 350px;
      }
      .comment-card {
        top: 520px;
      }
      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 14px;
        color: #2a3542;
        font-size: 13px;
      }
      .card-top span {
        color: var(--muted);
      }
      .approval-box {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        margin-top: 18px;
        padding: 15px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fffdf8;
      }
      .warn-dot {
        width: 18px;
        height: 18px;
        border: 2px solid var(--amber);
        border-radius: 999px;
        margin-top: 2px;
      }
      .approval-box strong {
        color: #9a6500;
      }
      .check-card button {
        min-height: 34px;
        margin-top: 14px;
        border: 1px solid var(--line);
        border-radius: 5px;
        background: #ffffff;
        color: var(--ink);
        padding: 0 13px;
        font-weight: 760;
        cursor: pointer;
      }
      .gate-card {
        position: absolute;
        top: 168px;
        right: 0;
        width: 260px;
        padding: 18px;
        box-shadow: 0 24px 60px rgba(8, 13, 20, 0.14);
      }
      .gate-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
      }
      .gate-card h3 {
        font-size: 20px;
      }
      .gate-card dl {
        display: grid;
        gap: 12px;
        margin: 18px 0;
      }
      .gate-card dl div {
        display: grid;
        gap: 3px;
      }
      .gate-card dt {
        color: var(--muted);
        font-size: 12px;
      }
      .gate-card dd {
        margin: 0;
        color: var(--ink);
        font-size: 14px;
        font-weight: 650;
      }
      .captcha-box {
        min-height: 64px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 8px 10px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 5px;
        padding: 10px;
        background: var(--faint);
      }
      .captcha-box span {
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        border-radius: 4px;
        border: 1px solid #b9c2cf;
        color: var(--green);
        font-weight: 900;
      }
      .captcha-box strong {
        font-size: 12px;
      }
      .captcha-box small {
        grid-column: 2;
        color: var(--muted);
      }
      .gate-card button {
        width: 100%;
        min-height: 44px;
        margin-top: 14px;
        border: 0;
        border-radius: 5px;
        font-weight: 820;
        cursor: pointer;
      }
      .timeline-section,
      .integration-section,
      .roadmap-section {
        margin-top: 46px;
      }
      .timeline-section,
      .integration-section {
        padding: 30px;
      }
      .timeline-section h2,
      .integration-section h2,
      .roadmap-section h2 {
        margin: 0 0 28px;
        color: var(--ink);
        font-size: 36px;
        line-height: 1.1;
        text-align: center;
      }
      .timeline {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 20px;
      }
      .timeline-item {
        position: relative;
        min-height: 190px;
        padding: 20px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #ffffff;
      }
      .timeline-item span,
      .roadmap-title span {
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--ink);
        color: #ffffff;
        font-weight: 850;
      }
      .timeline-item h3 {
        margin: 28px 0 10px;
        color: var(--ink);
        font-size: 17px;
        line-height: 1.25;
      }
      .timeline-item p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.55;
      }
      .comparison-wrap {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: 7px;
      }
      .integration-mobile {
        display: none;
      }
      .comparison-table {
        width: 100%;
        min-width: 860px;
        border-collapse: collapse;
        background: #ffffff;
      }
      .comparison-table th,
      .comparison-table td {
        border: 1px solid var(--line);
        padding: 18px;
        vertical-align: top;
        text-align: left;
        font-size: 14px;
        line-height: 1.5;
      }
      .comparison-table thead th {
        color: var(--ink);
        background: #fbfcfd;
        font-size: 16px;
      }
      .comparison-table tbody th {
        width: 160px;
        color: var(--ink);
        background: #fbfcfd;
        font-weight: 800;
      }
      .yes,
      .partial,
      .no {
        font-weight: 850;
      }
      .yes {
        color: var(--green);
      }
      .partial {
        color: #a66d00;
      }
      .no {
        color: var(--muted);
      }
      .security-band {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 0.76fr);
        gap: 34px;
        align-items: center;
        margin-top: 46px;
        padding: 34px;
        border-radius: 7px;
        background: #0a1118;
        color: #ffffff;
      }
      .security-band h2 {
        margin: 0 0 12px;
        font-size: 34px;
        line-height: 1.12;
      }
      .security-band p {
        margin: 0;
        max-width: 660px;
        color: #c3ccd7;
        font-size: 17px;
        line-height: 1.6;
      }
      .security-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .security-grid span {
        min-height: 48px;
        display: flex;
        align-items: center;
        border: 1px solid #24303d;
        border-radius: 6px;
        padding: 0 14px;
        background: #101a24;
        color: #dce4ed;
        font-weight: 720;
      }
      .roadmap-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 28px;
      }
      .roadmap-card {
        padding: 22px;
      }
      .roadmap-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }
      .roadmap-title h3 {
        margin: 0;
        color: var(--ink);
        font-size: 20px;
      }
      .roadmap-card ul {
        display: grid;
        gap: 9px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .roadmap-card li {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .roadmap-card li::before {
        content: "✓";
        color: var(--green);
        font-weight: 900;
        margin-right: 8px;
      }
      .roadmap-card p {
        margin: 18px 0 0;
        color: var(--ink);
        font-size: 14px;
        font-weight: 780;
        line-height: 1.45;
      }
      .site-footer {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 1fr) auto;
        gap: 34px;
        align-items: center;
        margin-bottom: 30px;
        padding: 30px;
        border-radius: 7px;
        background: #071018;
        color: #ffffff;
      }
      .footer-brand {
        color: #ffffff;
      }
      .site-footer p {
        margin: 14px 0;
        color: #b8c4d2;
      }
      .site-footer strong {
        color: #53d084;
      }
      .footer-points {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .footer-points span {
        min-height: 42px;
        display: flex;
        align-items: center;
        border: 1px solid #25313d;
        border-radius: 6px;
        padding: 0 12px;
        background: #0d1822;
      }
      .footer-actions {
        display: grid;
        gap: 10px;
      }
      .light-on-dark {
        background: #ffffff;
        color: var(--ink);
      }
      .ghost-on-dark {
        border-color: #394758;
        color: #ffffff;
      }
      .gate-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 48px 20px;
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
        color: var(--ink);
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
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 20px;
        background: #ffffff;
      }
      .status-strip span {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 56px;
        color: var(--green);
        font-size: 17px;
        font-weight: 760;
      }
      .status-strip span + span {
        border-left: 1px solid var(--line);
      }
      .meta-table {
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
        text-align: left;
        background: #ffffff;
      }
      .meta-row {
        display: grid;
        grid-template-columns: 1fr 1.05fr;
      }
      .meta-row + .meta-row {
        border-top: 1px solid var(--line);
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
        border-right: 1px solid var(--line);
        font-weight: 680;
      }
      .turnstile-wrap {
        display: grid;
        place-items: center;
        min-height: 112px;
        margin-top: 18px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: linear-gradient(#ffffff, #fbfcfd);
      }
      .button.full {
        width: 100%;
        min-height: 58px;
        margin-top: 22px;
        font-size: 19px;
      }
      .notice {
        margin: 0 0 18px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 14px 16px;
        font-size: 15px;
        line-height: 1.45;
        text-align: left;
      }
      .notice.error {
        background: var(--red-bg);
        border-color: #ffcdc9;
        color: var(--red);
      }
      .notice.success {
        background: var(--success-bg);
        border-color: #b7efc9;
        color: var(--green-dark);
      }
      @media (max-width: 980px) {
        .site-header,
        .home,
        .site-footer {
          width: min(100% - 32px, 1200px);
        }
        .site-header {
          align-items: flex-start;
          flex-direction: column;
          padding: 18px 0;
        }
        .site-nav {
          flex-wrap: wrap;
          gap: 18px;
        }
        .header-cta {
          width: 100%;
        }
        .hero,
        .security-band,
        .site-footer {
          grid-template-columns: 1fr;
        }
        .hero {
          min-height: auto;
          gap: 34px;
        }
        .product-stage {
          min-height: auto;
          display: grid;
          gap: 14px;
        }
        .repo-shell,
        .workflow-card,
        .check-card,
        .comment-card,
        .gate-card {
          position: static;
          width: 100%;
        }
        .timeline,
        .roadmap-grid {
          grid-template-columns: 1fr;
        }
        .security-grid,
        .footer-points {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 720px) {
        .comparison-wrap {
          display: none;
        }
        .integration-mobile {
          display: grid;
          gap: 14px;
        }
        .integration-card {
          border: 1px solid var(--line);
          border-radius: 6px;
          background: #ffffff;
          padding: 18px;
        }
        .integration-card h3 {
          margin: 0 0 14px;
          color: var(--ink);
          font-size: 18px;
        }
        .integration-card ul {
          display: grid;
          gap: 9px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .integration-card li {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.45;
        }
        .integration-card li::before {
          content: "✓";
          color: var(--green);
          font-weight: 900;
          margin-right: 8px;
        }
      }
      @media (max-width: 560px) {
        body {
          background-size: 52px 52px;
        }
        .brand {
          font-size: 24px;
        }
        .hero-copy h1 {
          font-size: clamp(48px, 15vw, 64px);
        }
        .hero-copy p {
          font-size: 18px;
        }
        .actions,
        .button {
          width: 100%;
        }
        .timeline-section,
        .integration-section {
          padding: 18px;
        }
        .timeline-section h2,
        .integration-section h2,
        .roadmap-section h2,
        .security-band h2 {
          font-size: 30px;
          text-align: left;
        }
        .comparison-table th,
        .comparison-table td {
          padding: 14px;
        }
        .security-band,
        .site-footer {
          padding: 22px;
        }
        .gate-page {
          align-items: start;
          padding: 30px 16px;
        }
        .status-strip,
        .meta-row {
          grid-template-columns: 1fr;
        }
        .status-strip span + span,
        .meta-row > div:first-child {
          border-left: 0;
          border-right: 0;
          border-top: 1px solid var(--line);
        }
        .meta-row > div:first-child {
          min-height: 42px;
          background: var(--faint);
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
