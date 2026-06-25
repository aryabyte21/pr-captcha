import type { GateRecord } from "./types";
import type { SessionUser } from "./env";

const defaultDescription =
  "Make AI slop and PR spam knock before CI. GitHub login, browser verification, and exact commit SHA.";

type BadgeTone = "green" | "black" | "amber";
type BadgeStyle = "flat" | "rounded";
type ProofResult = "verified" | "pending" | "denied";
type ProofTheme = "light" | "dark" | "compact";
type ScorecardRisk = "low" | "medium" | "high";
type ScorecardTheme = "light" | "dark";

export function renderHome(baseUrl?: string): string {
  const canonicalUrl = baseUrl;
  const imageUrl = baseUrl ? `${baseUrl}/og.svg` : "/og.svg";

  return layout(
    "pr-captcha",
    `<header class="site-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/setup-wizard">Setup</a>
        <a href="/trust">Trust</a>
        <a href="/github-app-manifest">GitHub App</a>
        <a href="/status">Operations</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/launch">Start free</a>
    </header>
    <main id="main" class="home">
      <section class="hero" data-motion-zone>
        <div class="hero-copy motion-reveal">
          <h1>Make PR spam knock first.</h1>
          <p>Install the free hosted app, pick a simple policy, and make untrusted PRs prove a human is present before your repo has to care.</p>
          <div class="actions">
            <a class="button primary" href="/launch">Start free</a>
            <a class="button light" href="/setup-wizard">Make policy</a>
            <a class="button light" href="/demo">Watch demo</a>
          </div>
          <p class="proof-line"><span class="success-shield">✓</span>Hosted Worker. SHA-bound. No patch checkout.</p>
          <div class="signal-rail" aria-label="pr-captcha guarantees">
            <span>No AI detection</span>
            <span>No patch checkout</span>
            <span>No stale SHA reuse</span>
          </div>
        </div>
        <div class="hero-media motion-reveal" aria-label="pr-captcha verification receipt preview">
          <figure>
            <img src="/assets/anti-slop-gate-hero.png" alt="Maintainer desk with a pull request queue and pr-captcha verification receipt" />
            <figcaption>Verification is a receipt, not a code-quality judgment.</figcaption>
          </figure>
          <div class="hero-proof-grid" aria-label="pr-captcha receipt fields">
            <div><span>Identity</span><strong>GitHub OAuth</strong></div>
            <div><span>Presence</span><strong>Turnstile</strong></div>
            <div><span>Scope</span><strong>Exact head SHA</strong></div>
          </div>
        </div>
      </section>
      <section class="proof-section" id="proof">
        <div class="section-heading split">
          <div>
            <h2>AI slop should wait outside the queue.</h2>
          <p>Busy projects already have reviews, labels, and branch protection. The weak point is earlier: PR spam can ask for attention faster than maintainers can classify it. OpenClaw made the inbox problem obvious: cheap PRs need cheap sender friction.</p>
          </div>
          <span data-pr-count-status>Live open-PR counts from GitHub</span>
        </div>
        <div class="queue-strip" data-pr-counts aria-label="Open pull request counts from public GitHub repositories">
          ${queueStat("microsoft/vscode", "2,044", "open PRs", "loading live count")}
          ${queueStat("kubernetes/kubernetes", "926", "open PRs", "loading live count")}
          ${queueStat("vercel/next.js", "1,900+", "open PRs", "loading live count")}
          ${queueStat("rust-lang/rust", "1,113", "open PRs", "loading live count")}
        </div>
        <div class="proof-grid">
          ${ossProofCard({
            image: "/assets/oss-pr-vscode.png",
            href: "https://github.com/microsoft/vscode/pull/321316",
            repo: "microsoft/vscode",
            title: "A tiny-looking asset PR can touch 74 files.",
            meta: "#321316 · 74 files changed · 3 checks",
          })}
          ${ossProofCard({
            image: "/assets/oss-pr-kubernetes.png",
            href: "https://github.com/kubernetes/kubernetes/pull/139723",
            repo: "kubernetes/kubernetes",
            title: "Maintainer labels help, but they arrive after triage.",
            meta: "#139723 · cleanup labels · 926 open PRs",
          })}
          ${ossProofCard({
            image: "/assets/oss-pr-nextjs.png",
            href: "https://github.com/vercel/next.js/pull/94747",
            repo: "vercel/next.js",
            title: "Modern JS repos attach huge status surfaces.",
            meta: "#94747 · 120 checks · 1.9k open PRs",
          })}
        </div>
        <p class="proof-footnote">Counts refresh from GitHub on page load, with static fallbacks if the public API is unavailable. Screenshots are examples of queue scale, not accusations about those contributors. The threat model is cheap automation around the queue: bot accounts and AI slop can open PRs faster than humans can classify them.</p>
      </section>
      <section class="pressure-section" id="anti-slop" data-motion-zone>
        <div class="pressure-copy motion-reveal">
          <h2>The gate is for attention, not taste policing.</h2>
          <p>pr-captcha does not guess whether a patch was written by a model. It asks for a signed, browser-present human before the queue spends trust.</p>
        </div>
        <div class="pressure-accordion" aria-label="Where pr-captcha fits in the pull request queue">
          ${pressurePanel(
            "/assets/oss-pr-vscode.png",
            "Drive-by patches",
            "A tiny-looking PR can still demand reviewer context, status checks, and maintainers who know the project.",
          )}
          ${pressurePanel(
            "/assets/oss-pr-kubernetes.png",
            "Queue triage",
            "Labels and reviews help after the queue sees the work. pr-captcha asks for human presence before that.",
          )}
          ${pressurePanel(
            "/assets/oss-pr-nextjs.png",
            "Expensive automation",
            "Use the signal to keep heavyweight jobs and fork workflows behind a cheap human-origin check.",
          )}
          ${pressurePanel(
            "/assets/anti-slop-gate-hero.png",
            "Maintainer control",
            "Every repository decides where the receipt matters: advisory signal, branch protection, or workflow gate.",
          )}
        </div>
      </section>
      <section class="timeline-section" id="how">
        <div class="section-heading">
          <h2>What happens on a PR</h2>
          <p>The gate is deliberately boring: read metadata, bind the SHA, require the right GitHub user, then publish a human-origin signal.</p>
        </div>
        <div class="timeline">
          ${timelineItem("1", "PR opened", "A PR arrives under an enabled target: every PR by default, or a narrower configured target.")}
          ${timelineItem("2", "Intake check posted", "pr-captcha comments and creates a SHA-bound required check.")}
          ${timelineItem("3", "Human shows up", "Contributor logs in with GitHub and completes browser verification.")}
          ${timelineItem("4", "Signal published", "pr-captcha marks the exact SHA as human-verified.")}
          ${timelineItem("5", "Repo policy decides", "Use the signal for triage, merge protection, or held fork workflows.")}
        </div>
      </section>
      <section class="integration-section" id="integration">
        <div class="section-heading">
          <h2>Integration paths</h2>
          <p>Use pr-captcha as a PR intake check first. Wire it into CI only where untrusted automation should wait behind a tiny human check.</p>
        </div>
        <div class="comparison-wrap">
          <table class="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th>PR intake check</th>
                <th>Native fork release</th>
                <th>Workflow gate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>When to use</th>
                <td>Busy public repos that need a human-origin signal before triage.</td>
                <td>Repos using GitHub's approval queue for fork workflows.</td>
                <td>Repos where heavy jobs should wait on the signal.</td>
              </tr>
              <tr>
                <th>How it works</th>
                <td>Creates a required check and PR comment as soon as the PR opens.</td>
                <td>Approves GitHub's held fork workflow after verification.</td>
                <td>A tiny job runs first. Heavy jobs wait on it.</td>
              </tr>
              <tr>
                <th>CI effect</th>
                <td>No jobs by itself.</td>
                <td>Held jobs stay held until approved.</td>
                <td>One tiny job gates the rest.</td>
              </tr>
              <tr>
                <th>Setup</th>
                <td>Install the app and enable the required check.</td>
                <td>Enable fork approval and install the app.</td>
                <td>Add one step to your workflow.</td>
              </tr>
              <tr>
                <th>Blocks CI</th>
                <td><span class="no">No</span>, it is an intake signal.</td>
                <td><span class="yes">Yes</span>, before any jobs start.</td>
                <td><span class="partial">Partial</span>, blocks heavy jobs.</td>
              </tr>
              <tr>
                <th>Best for</th>
                <td>Open-source PR queues with heavy triage load.</td>
                <td>Fork PRs that GitHub already holds.</td>
                <td>Private repos and broad adoption.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="integration-mobile">
          ${integrationMobileCard("PR intake check", [
            "Best for public repos with heavy triage load.",
            "Creates a required check and PR comment.",
            "Does not run jobs by itself.",
            "Works before review and labels settle.",
          ])}
          ${integrationMobileCard("Native fork release", [
            "Best when GitHub already holds fork workflows.",
            "Approves the held run after verification.",
            "Held jobs stay held until approved.",
            "Protects public fork automation.",
          ])}
          ${integrationMobileCard("Workflow gate", [
            "Best when heavy jobs should wait.",
            "A tiny job runs first.",
            "Heavy jobs wait on it.",
            "One tiny job gates the rest.",
          ])}
        </div>
      </section>
      <section class="setup-section" id="setup">
        <div class="setup-copy">
          <h2>Install the gate in one pass</h2>
          <p>Start with the GitHub App check, then add the workflow gate only where heavy automation should wait. Keep the path narrow: permissions, Worker, policy, branch protection.</p>
          <div class="setup-actions">
            <a class="button light" href="/demo">Watch demo</a>
            <a class="button primary" href="/github-app-manifest">Create GitHub App</a>
            <a class="button light" href="/setup-wizard">Run setup wizard</a>
            <a class="button light" href="/status">Gate status</a>
            <a class="button light" href="/setup.md">Open setup guide</a>
            <a class="button light" href="/config-preview">Preview config</a>
            <a class="button light" href="/diagnostics">Run diagnostics</a>
            <button class="button light" type="button" data-copy-workflow>Copy workflow gate</button>
          </div>
          <div class="setup-steps">
            ${setupStep(
              "1",
              "Create GitHub App",
              "Install metadata, checks, issues, pull requests, actions, and workflow permissions.",
              "/github-app.md",
              "Permission guide",
            )}
            ${setupStep(
              "2",
              "Deploy Worker",
              "Bind D1, set GitHub OAuth, Turnstile, webhook, and session secrets.",
              "/setup.md#2-create-cloudflare-resources",
              "Worker setup",
            )}
            ${setupStep(
              "3",
              "Add pr-captcha.yml",
              "Gate every PR by default, or narrow by first-time, outside, fork, and bot targets per repository.",
              "/config.md",
              "Config reference",
            )}
            ${setupStep(
              "4",
              "Protect pr-captcha/human",
              "Require the SHA-bound check where the signal should gate merge or automation.",
              "/setup.md#6-enable-branch-protection",
              "Branch protection",
            )}
          </div>
        </div>
        <div class="setup-board" aria-label="Production setup preview">
          <div class="workflow-panel">
            <div class="panel-top">
              <strong>Workflow gate</strong>
              <span>optional CI guard</span>
            </div>
            <pre><code data-workflow-source>${escapeHtml(workflowGateYaml())}</code></pre>
          </div>
          <div class="ready-panel">
            <div>
              <h3>Ready check</h3>
              <p>Before a public install, confirm the Worker can reach D1, GitHub, OAuth, Turnstile, and the repo policy file.</p>
            </div>
            <div class="setup-signals">
              ${setupSignal("No PR checkout", "Metadata only")}
              ${setupSignal("SHA-bound", "New commit resets")}
              ${setupSignal("Audit trail", "Every gate event")}
              ${setupSignal("Fail closed", "Malformed status blocked")}
            </div>
          </div>
        </div>
      </section>
      <section class="security-band" id="security">
        <div>
          <h2>Security model: metadata only.</h2>
          <p>The privileged app reads PR metadata, verifies a GitHub session and Turnstile token, then publishes a SHA-bound check result. It never checks out or executes the pull request patch.</p>
        </div>
        <div class="security-grid">
          <span>GitHub OAuth</span>
          <span>Exact head SHA</span>
          <span>Server-side CAPTCHA</span>
          <span>Installation token</span>
        </div>
      </section>
      <section class="roadmap-section" id="roadmap">
        <div class="section-heading">
          <h2>Production path</h2>
          <p>Ship the smallest credible control first, then harden the operational edges that matter for public repositories.</p>
        </div>
        <div class="roadmap-grid">
          ${roadmapCard(
            "1",
            "Beta",
            [
              "Core PR intake check",
              "Turnstile verification",
              "Checks, comments, workflow release",
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
              "Uptime and incident response",
            ],
            "Goal: trusted by maintainers at scale.",
          )}
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <div>
        <div class="brand footer-brand">${brandMark()}<span>pr-captcha</span></div>
        <p>Anti AI-slop checks for GitHub PR queues.</p>
        <strong>Make AI slop prove a human is present.</strong>
      </div>
      <div class="footer-points">
        <span>GitHub App</span>
        <span>SHA-bound</span>
        <span>Maintainer control</span>
        <span>Real humans</span>
      </div>
      <div class="footer-actions">
        <a class="button light-on-dark" href="/demo">Watch demo</a>
        <a class="button ghost-on-dark" href="/queue-pressure">Queue pressure</a>
        <a class="button ghost-on-dark" href="/badge-builder">README badge</a>
        <a class="button ghost-on-dark" href="/proof-card">Proof card</a>
        <a class="button ghost-on-dark" href="#setup">View setup</a>
        <a class="button ghost-on-dark" href="/status">Status</a>
        <a class="button ghost-on-dark" href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </div>
    </footer>
    ${liveCountScript()}
    ${copyWorkflowScript()}
    ${homeMotionScript()}`,
    {
      title: "pr-captcha",
      description: defaultDescription,
      canonicalUrl,
      imageUrl,
    },
  );
}

export function renderDemoPage(baseUrl?: string): string {
  return layout(
    "pr-captcha demo",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/demo">Demo</a>
        <a href="/queue-pressure">Queue</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card">Proof</a>
        <a href="/setup-wizard">Wizard</a>
        <a href="/diagnostics">Diagnostics</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/setup-wizard">Open setup wizard</a>
    </header>
    <main id="main" class="preview-page demo-page">
      <section class="preview-heading demo-heading">
        <div>
          <h1>PR captcha Gate Lab</h1>
          <p>Run the full intake story before installing the GitHub App: AI-slop PR arrives, human check is pending, GitHub login and CAPTCHA pass, exact SHA is verified, and CI is released.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-demo-replay>Run gate simulation</button>
            <button class="button light" type="button" data-copy-demo-policy>Copy install config</button>
            <a class="button light" href="/setup-wizard">Open setup wizard</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>No GitHub App install</span>
          <span><span class="mini-shield">✓</span>Exact SHA dry run</span>
          <span><span class="mini-shield">✓</span>Copy branch check</span>
        </div>
      </section>
      <section class="demo-lab-strip" aria-label="Gate Lab proof points">
        <div>
          <strong>0 jobs started</strong>
          <span>Fork CI stays held until human-origin proof exists.</span>
        </div>
        <div>
          <strong>1 GitHub user</strong>
          <span>The solver is tied to an OAuth session and repository policy.</span>
        </div>
        <div>
          <strong>1 exact SHA</strong>
          <span>New commits need a fresh gate before inheriting trust.</span>
        </div>
        <div>
          <strong>Metadata only</strong>
          <span>The Worker never checks out or executes PR code.</span>
        </div>
      </section>
      <section class="demo-shell" aria-label="pr-captcha demo flow">
        <div class="demo-control">
          <div class="panel-top">
            <strong>Demo timeline</strong>
            <span data-demo-stage-label>PR opened</span>
          </div>
          <div class="demo-steps">
            ${demoStepButton("0", "PR opened", "Untrusted fork PR enters the queue.", true)}
            ${demoStepButton("1", "Gate created", "pr-captcha posts a check and link.")}
            ${demoStepButton("2", "Human verified", "GitHub login and Turnstile pass.")}
            ${demoStepButton("3", "Check passed", "The exact commit receives the signal.")}
          </div>
          <div class="demo-copy-check">
            <span>Branch protection check</span>
            <code data-copy-check-source>pr-captcha/human</code>
            <button class="button light compact" type="button" data-copy-check>Copy</button>
          </div>
        </div>
        <div class="demo-stage">
          <div class="demo-status" data-demo-status>
            <span class="mini-shield" data-demo-status-icon>!</span>
            <div>
              <strong data-demo-title>AI-slop PR waiting</strong>
              <p data-demo-body>A PR opened under an enabled target. CI is held until the exact head SHA has a human-origin signal.</p>
            </div>
          </div>
          <div class="demo-pr-grid">
            <section class="demo-pr-panel" aria-label="Simulated pull request state">
              <div class="repo-topbar">
                <strong>open-source/app</strong>
                <span>Pull request #184</span>
              </div>
              <div class="repo-pr">
                <h2>Improve onboarding copy <span class="pr-num">#184</span></h2>
                <p><strong>Open</strong> drive-by-user wants to merge <code>8f31c9a</code> into <code>main</code></p>
              </div>
              <div class="demo-checks">
                <article class="demo-check" data-demo-ci data-state="held">
                  <span class="demo-check-mark"></span>
                  <div>
                    <strong>GitHub Actions / ci.yml</strong>
                    <p data-demo-ci-body>Fork workflow is held before the held workflow starts.</p>
                  </div>
                  <span data-demo-ci-label>Held</span>
                </article>
                <article class="demo-check" data-demo-human-check data-state="waiting">
                  <span class="demo-check-mark">${brandMark("tiny")}</span>
                  <div>
                    <strong>pr-captcha / human</strong>
                    <p data-demo-check-body>Waiting for the contributor to verify this exact SHA.</p>
                  </div>
                  <span data-demo-check-label>Waiting</span>
                </article>
              </div>
              <div class="demo-comment" data-demo-comment>
                <div class="card-top">${brandMark("small")}<strong>pr-captcha</strong><span>now</span></div>
                <p data-demo-comment-body>Open the verification link to prove a GitHub-authenticated human is present for commit <code>8f31c9a</code>.</p>
                <button class="button compact dark" type="button" data-demo-verify>Verify as PR author</button>
              </div>
            </section>
            <section class="demo-audit-panel" aria-label="Simulated audit trail">
              <div class="panel-top">
                <strong>Audit trail</strong>
                <span>metadata only</span>
              </div>
              <div class="demo-audit-list" data-demo-audit>
                <div data-level="warning"><strong>gate.pending</strong><span>Waiting on human-origin proof for 8f31c9a.</span></div>
              </div>
            </section>
          </div>
        </div>
      </section>
      <section class="demo-install-strip" aria-label="Copyable install handoff">
        <div>
          <h2>Take the same gate to branch protection.</h2>
          <p>Use the demo to align maintainers, then copy the required check and starter repository policy into the setup wizard.</p>
        </div>
        <pre data-demo-policy>mode: hybrid
require:
  github_login: true
  solver_must_be_pr_author: true
  new_sha_requires_new_captcha: true
checks:
  create_required_check: true
  name: pr-captcha/human</pre>
        <button class="button primary" type="button" data-copy-demo-policy>Copy install config</button>
      </section>
      <section class="demo-next">
        <div>
          <h2>Use the demo as the handoff.</h2>
          <p>Send maintainers to this page first, then move straight into the setup wizard, status page, and repository diagnostics when they are ready to install.</p>
        </div>
        <div class="demo-next-actions">
          <a class="button primary" href="/setup-wizard">Generate policy</a>
          <a class="button light" href="/status">Check service status</a>
          <a class="button light" href="/diagnostics">Run diagnostics</a>
        </div>
      </section>
    </main>
    ${demoPageScript()}`,
    {
      title: "pr-captcha demo",
      description:
        "Shareable pr-captcha dry run showing a SHA-bound human-origin check before installation.",
      canonicalUrl: baseUrl ? `${baseUrl}/demo` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderQueuePressurePage(baseUrl?: string): string {
  return layout(
    "Queue pressure",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/demo">Demo</a>
        <a href="/queue-pressure">Queue</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card">Proof</a>
        <a href="/setup-wizard">Wizard</a>
        <a href="/diagnostics">Diagnostics</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/demo">Open demo</a>
    </header>
    <main id="main" class="preview-page queue-page">
      <section class="preview-heading queue-heading">
        <div>
          <h1>Measure your PR queue pressure</h1>
          <p>Estimate how much untrusted PR traffic reaches maintainers before installing pr-captcha. Use the result as a quick maintainer handoff.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-copy-queue-summary>Copy summary</button>
            <a class="button light" href="/demo">Open demo</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Maintainer attention</span>
          <span><span class="mini-shield">✓</span>Held jobs</span>
          <span><span class="mini-shield">✓</span>Recommended mode</span>
        </div>
      </section>
      <section class="queue-shell" aria-label="PR queue pressure calculator">
        <form class="queue-controls" data-queue-form>
          <div class="panel-top">
            <strong>Queue inputs</strong>
            <span data-queue-profile>busy OSS</span>
          </div>
          <div class="queue-presets" aria-label="Calculator presets">
            <button class="button light compact" type="button" data-queue-preset="oss">Busy OSS</button>
            <button class="button light compact" type="button" data-queue-preset="small">Small project</button>
            <button class="button light compact" type="button" data-queue-preset="private">Private team</button>
          </div>
          <div class="queue-fields">
            ${queueField("Open PRs per week", "open_prs", "184", "1", "5000")}
            ${queueField("Untrusted PR percent", "untrusted_percent", "35", "0", "100", "%")}
            ${queueField("Minutes to triage", "triage_minutes", "6", "0", "120")}
            ${queueField("Heavy jobs per PR", "ci_minutes", "2", "0", "100")}
          </div>
        </form>
        <div class="queue-results">
          <div class="queue-scoreboard">
            <section class="queue-metric">
              <span>Attention at risk</span>
              <strong data-queue-attention>6.4h</strong>
              <p data-queue-attention-detail>64 untrusted PRs x 6 min</p>
            </section>
            <section class="queue-metric">
              <span>Heavy jobs held</span>
              <strong data-queue-ci-minutes>773</strong>
              <p data-queue-ci-detail>64 untrusted PRs x 2 jobs</p>
            </section>
            <section class="queue-metric">
              <span>Recommended path</span>
              <strong data-queue-cost>free</strong>
              <p data-queue-cost-detail>Hosted Worker first</p>
            </section>
          </div>
          <section class="queue-recommendation" data-queue-recommendation-state="warning">
            <div>
              <span class="mini-shield">✓</span>
              <div>
                <h2 data-queue-mode>Use hybrid mode first</h2>
                <p data-queue-reason>Use a PR intake check, keep native fork release available, and add the workflow gate only around heavy jobs.</p>
              </div>
            </div>
            <dl>
              <div><dt>Branch check</dt><dd><code>pr-captcha/human</code></dd></div>
              <div><dt>Install path</dt><dd data-queue-install>Demo, setup wizard, status, diagnostics.</dd></div>
              <div><dt>Trust boundary</dt><dd>No patch checkout. Exact head SHA only.</dd></div>
            </dl>
          </section>
          <section class="queue-summary-card">
            <div class="panel-top">
              <strong>Shareable summary</strong>
              <span data-queue-summary-status>ready</span>
            </div>
            <pre class="status-json queue-summary" data-queue-summary>Queue pressure: 64 untrusted PRs/week, 6.4 maintainer hours, 129 heavy jobs held. Recommended pr-captcha path: hybrid.</pre>
          </section>
        </div>
      </section>
      <section class="demo-next queue-next">
        <div>
          <h2>Turn pressure into a setup path.</h2>
          <p>Send the summary to maintainers, then use the dry-run demo and setup wizard to choose the first repository policy.</p>
        </div>
        <div class="demo-next-actions">
          <a class="button primary" href="/demo">Watch demo</a>
          <a class="button light" href="/setup-wizard">Generate policy</a>
          <a class="button light" href="/status">Check service status</a>
        </div>
      </section>
    </main>
    ${queuePressureScript()}`,
    {
      title: "Queue pressure",
      description:
        "Estimate maintainer attention exposed to unverified pull requests before installing pr-captcha.",
      canonicalUrl: baseUrl ? `${baseUrl}/queue-pressure` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderEvidenceScannerPage(
  baseUrl?: string,
  initialRepository = "godotengine/godot",
): string {
  const reportUrl = evidenceReportUrl(baseUrl, initialRepository);
  return layout(
    "Repo evidence",
    `<header class="site-header utility-header evidence-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/launch">Install</a>
        <a href="/setup-wizard">Policy</a>
        <a href="/evidence" aria-current="page">Evidence</a>
        <a href="/status">Status</a>
        <a href="/trust">Trust</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/launch">Install app</a>
    </header>
    <main id="main" class="preview-page evidence-page">
      <section class="preview-heading evidence-heading">
        <div>
          <p class="eyebrow">Quick repo sniff test</p>
          <h1>Would this repo benefit?</h1>
          <p>Paste a repository and see whether the queue has enough outside, fork, bot, or stale PR pressure to justify a human receipt check.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-evidence-run>Run live scan</button>
            <button class="button light" type="button" data-evidence-copy>Copy report</button>
            <a class="button light" href="/setup-wizard">Make policy</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Open PR pressure</span>
          <span><span class="mini-shield">✓</span>Fork and bot signals</span>
          <span><span class="mini-shield">✓</span>Clear recommendation</span>
        </div>
      </section>
      <section class="evidence-shell" aria-label="Repository evidence scanner">
        <form class="evidence-controls" data-evidence-form>
          <div class="panel-top">
            <strong>Repo evidence</strong>
            <span data-evidence-status>ready</span>
          </div>
          <div class="evidence-field">
            <label for="evidence-repo">GitHub repository</label>
            <div>
              <span>github.com/</span>
              <input id="evidence-repo" name="repo" value="${escapeHtml(initialRepository)}" autocomplete="off" data-evidence-repo />
            </div>
          </div>
          <div class="evidence-presets" aria-label="Repository presets">
            <button class="button light compact" type="button" data-evidence-preset="godotengine/godot">Godot</button>
            <button class="button light compact" type="button" data-evidence-preset="kubernetes/kubernetes">Kubernetes</button>
            <button class="button light compact" type="button" data-evidence-preset="freeCodeCamp/freeCodeCamp">freeCodeCamp</button>
            <button class="button light compact" type="button" data-evidence-preset="tldraw/tldraw">tldraw</button>
          </div>
          <div class="evidence-explain">
            <h2>What this checks</h2>
            <p>Open PR pressure, recent fork PRs, unknown authors, stale pull requests, bot traffic, repeated low-signal titles, and spam or invalid label counts when GitHub search allows it.</p>
          </div>
          <div class="evidence-actions">
            <a href="/queue-pressure">Estimate pressure</a>
            <a href="/pilot">Plan pilot</a>
            <a href="/setup-wizard">Generate policy</a>
            <a href="/github-app-manifest">Create app</a>
          </div>
        </form>
        <div class="evidence-results">
          <section class="evidence-recommendation" data-evidence-risk="medium">
            <div>
              <span class="mini-shield">✓</span>
              <div>
                <h2 data-evidence-recommendation-title>Recommended gate</h2>
                <p data-evidence-recommendation>Run a live scan to get a repo-specific install recommendation.</p>
              </div>
            </div>
            <dl>
              <div><dt>Repository</dt><dd data-evidence-repository>${escapeHtml(initialRepository)}</dd></div>
              <div><dt>Generated</dt><dd data-evidence-generated>not scanned yet</dd></div>
              <div><dt>Evidence quality</dt><dd data-evidence-quality>waiting</dd></div>
            </dl>
            <div class="evidence-share">
              <label for="evidence-report-link">Report link</label>
              <div>
                <input id="evidence-report-link" value="${escapeHtml(reportUrl)}" readonly data-evidence-link />
                <button class="button light compact" type="button" data-evidence-copy-link>Copy link</button>
              </div>
              <small>Share this with maintainers before installing a GitHub App.</small>
            </div>
          </section>
          <section class="evidence-metrics" aria-label="Repository evidence metrics">
            ${evidenceMetric("open", "Open PRs", "scan", "Total open pull requests from GitHub.")}
            ${evidenceMetric("fork", "Fork pressure", "scan", "Recent open pull requests from forks.")}
            ${evidenceMetric("unknown", "Unknown authors", "scan", "Recent PR authors outside trusted associations.")}
            ${evidenceMetric("stale", "Stale PRs", "scan", "Recent sample open for at least 14 days.")}
            ${evidenceMetric("labels", "Spam labels", "scan", "PRs carrying spam or invalid labels.")}
            ${evidenceMetric("bots", "Bot PRs", "scan", "Recent PRs opened by bot accounts.")}
          </section>
          <section class="evidence-prs">
            <div class="panel-top">
              <strong>Recent PR sample</strong>
              <span data-evidence-sample>waiting</span>
            </div>
            <div class="evidence-empty" data-evidence-empty>
              <strong>No scan yet</strong>
              <p>Run the default scan or paste a GitHub repository to see recent PRs, trust badges, and queue risk.</p>
            </div>
            <ol class="evidence-pr-list" data-evidence-prs></ol>
          </section>
          <section class="evidence-summary-card">
            <div class="panel-top">
              <strong>Shareable report</strong>
              <span data-evidence-report-status>ready</span>
            </div>
            <pre class="status-json evidence-summary" data-evidence-summary>Run a live scan to generate a maintainer-ready evidence report.</pre>
          </section>
          <section class="evidence-brief-card" aria-label="Maintainer evidence brief">
            <div class="panel-top">
              <strong>Maintainer evidence brief</strong>
              <span data-evidence-brief-status>ready</span>
            </div>
            <div class="evidence-brief-actions">
              <p>Paste this into an issue or discussion when a project needs proof before adding a required check.</p>
              <button class="button primary compact" type="button" data-evidence-copy-brief>Copy maintainer brief</button>
            </div>
            <pre class="status-json evidence-summary evidence-brief" data-evidence-brief>Run a live scan to generate a maintainer-ready adoption brief.</pre>
          </section>
        </div>
      </section>
    </main>
    ${evidenceScannerScript()}`,
    {
      title: "Repo evidence scanner",
      description:
        "Scan a GitHub repository for pull request queue pressure before installing pr-captcha.",
      canonicalUrl: baseUrl ? `${baseUrl}/evidence` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderSpamRadarPage(baseUrl?: string): string {
  return layout(
    "PR spam radar",
    `<header class="site-header utility-header evidence-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/radar" aria-current="page">Radar</a>
        <a href="/evidence">Evidence</a>
        <a href="/launch">Launch</a>
        <a href="/setup-wizard">Setup</a>
        <a href="/github-app-manifest">Manifest</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/evidence">Scan your repo</a>
    </header>
    <main id="main" class="preview-page evidence-page radar-page">
      <section class="preview-heading radar-heading">
        <div>
          <h1>See where PR spam is already labeled.</h1>
          <p>Load public GitHub labels, scan the examples, and copy a maintainer brief. No repo install required.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-radar-refresh>Load live examples</button>
            <button class="button light" type="button" data-radar-copy>Copy maintainer brief</button>
            <a class="button light" href="/evidence">Scan your repo</a>
          </div>
        </div>
        <div class="radar-proof">
          <div>
            <span>Last refresh</span>
            <strong data-radar-generated>waiting</strong>
          </div>
          <div>
            <span>Repos found</span>
            <strong data-radar-repositories>scan</strong>
          </div>
          <div>
            <span>Signal confidence</span>
            <strong data-radar-quality>waiting</strong>
          </div>
          <div>
            <span>Next step</span>
            <strong>pick a repo</strong>
          </div>
        </div>
      </section>
      <section class="radar-query-strip" aria-label="GitHub search queries used by the radar">
        ${radarQueryLink("Spam labels", "is:pr is:open label:spam archived:false", "spam")}
        ${radarQueryLink("Invalid labels", "is:pr is:open label:invalid archived:false", "invalid")}
        ${radarQueryLink("Stale labels", "is:pr is:open label:stale archived:false", "stale")}
      </section>
      <section class="radar-shell" aria-label="PR spam radar">
        <aside class="radar-panel">
          <div class="panel-top">
            <strong>How to use this</strong>
            <span data-radar-status>ready</span>
          </div>
          <div class="radar-recommendation">
            <span class="mini-shield">✓</span>
            <div>
              <h2>Use evidence, not vibes</h2>
              <p data-radar-recommendation>Load public examples, pick a repository with repeat signals, then use the brief to propose a small pilot.</p>
            </div>
          </div>
          <dl class="radar-totals">
            <div><dt>Spam labels</dt><dd data-radar-total="spam">scan</dd></div>
            <div><dt>Invalid labels</dt><dd data-radar-total="invalid">scan</dd></div>
            <div><dt>Stale labels</dt><dd data-radar-total="stale">scan</dd></div>
          </dl>
          <div class="evidence-actions">
            <a href="/evidence">Run repo scan</a>
            <a href="/pilot">Plan pilot</a>
            <a href="/queue-pressure">Estimate pressure</a>
            <a href="/setup-wizard">Generate policy</a>
          </div>
        </aside>
        <section class="radar-results">
          <div class="panel-top">
            <strong>Public PR examples</strong>
            <span data-radar-sample>waiting</span>
          </div>
          <div class="radar-empty" data-radar-empty>
            <strong>No examples loaded yet</strong>
            <p>Click load to see public PR titles, labels, authors, repository links, and the signal behind each example.</p>
          </div>
          <div class="radar-table" data-radar-table hidden>
            <div class="radar-table-head" role="row">
              <span>Repository</span>
              <span>Pull request</span>
              <span>Author</span>
              <span>Age</span>
              <span>Signal</span>
            </div>
            <ol class="radar-list" data-radar-list></ol>
          </div>
        </section>
        <div class="radar-side-column">
          <section class="radar-clusters-card">
            <div class="panel-top">
              <strong>Repositories to inspect</strong>
              <span data-radar-cluster-status>waiting</span>
            </div>
            <div class="radar-cluster-empty" data-radar-cluster-empty>
              <strong>No repositories yet</strong>
              <p>Load examples to group public signals by repository.</p>
            </div>
            <ol class="radar-cluster-list" data-radar-clusters></ol>
          </section>
          <section class="radar-summary-card">
            <div class="panel-top">
              <strong>Copyable maintainer brief</strong>
              <span data-radar-brief-status>ready</span>
            </div>
            <pre class="status-json radar-summary" data-radar-summary tabindex="0">Load examples to generate a maintainer-ready brief.</pre>
          </section>
        </div>
      </section>
    </main>
    ${spamRadarScript()}`,
    {
      title: "PR spam radar",
      description:
        "Public GitHub evidence of pull request spam, invalid, and stale labels.",
      canonicalUrl: baseUrl ? `${baseUrl}/radar` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderPilotPlanPage(
  baseUrl?: string,
  initialRepository = "tldraw/tldraw",
): string {
  const reportUrl = evidenceReportUrl(baseUrl, initialRepository);
  const issueUrl = githubIssueUrl(
    initialRepository,
    "Pilot pr-captcha for 7 days",
    defaultPilotIssueText(baseUrl, initialRepository),
  );
  return layout(
    "Maintainer pilot plan",
    `<header class="site-header utility-header evidence-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/radar">Radar</a>
        <a href="/evidence">Evidence</a>
        <a href="/pilot" aria-current="page">Pilot</a>
        <a href="/launch">Launch</a>
        <a href="/setup-wizard">Setup</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/setup-wizard">Generate policy</a>
    </header>
    <main id="main" class="preview-page evidence-page pilot-page">
      <section class="preview-heading pilot-heading">
        <div>
          <h1>Plan a 7-day maintainer pilot</h1>
          <p>Turn live pull request evidence into a cautious rollout plan with branch protection timing, rollback, and maintainer-facing success metrics.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-pilot-run>Run pilot scan</button>
            <button class="button light" type="button" data-pilot-copy>Copy pilot issue</button>
            <a class="button light" href="${escapeHtml(issueUrl)}" target="_blank" rel="noreferrer" data-pilot-open-issue>Open GitHub issue</a>
            <a class="button light" href="/evidence">Open evidence</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Live PR evidence</span>
          <span><span class="mini-shield">✓</span>Branch protection timing</span>
          <span><span class="mini-shield">✓</span>Rollback included</span>
        </div>
      </section>
      <section class="pilot-shell" aria-label="Maintainer pilot planner">
        <form class="pilot-controls" data-pilot-form>
          <div class="panel-top">
            <strong>Pilot inputs</strong>
            <span data-pilot-status>ready</span>
          </div>
          <label class="pilot-field">
            <span>GitHub repository</span>
            <div>
              <span>github.com/</span>
              <input name="repository" value="${escapeHtml(initialRepository)}" autocomplete="off" data-pilot-repo />
            </div>
          </label>
          <fieldset class="pilot-stance">
            <legend>Rollout stance</legend>
            <label><input type="radio" name="stance" value="cautious" checked /><span><strong>Cautious</strong><small>Advisory first, require after proof.</small></span></label>
            <label><input type="radio" name="stance" value="balanced" /><span><strong>Balanced</strong><small>Require once the first solved gates look clean.</small></span></label>
            <label><input type="radio" name="stance" value="aggressive" /><span><strong>Aggressive</strong><small>Require fast for high-risk queues.</small></span></label>
          </fieldset>
          <div class="evidence-presets pilot-presets" aria-label="Repository presets">
            <button class="button light compact" type="button" data-pilot-preset="tldraw/tldraw">tldraw</button>
            <button class="button light compact" type="button" data-pilot-preset="godotengine/godot">Godot</button>
            <button class="button light compact" type="button" data-pilot-preset="kubernetes/kubernetes">Kubernetes</button>
            <button class="button light compact" type="button" data-pilot-preset="freeCodeCamp/freeCodeCamp">freeCodeCamp</button>
          </div>
          <div class="evidence-actions">
            <a data-pilot-evidence-link href="${escapeHtml(reportUrl)}">Evidence report</a>
            <a href="/setup-wizard">Generate policy</a>
            <a href="/launch">Launch packet</a>
          </div>
        </form>
        <div class="pilot-results">
          <section class="pilot-recommendation" data-pilot-risk="waiting">
            <div>
              <span class="mini-shield">✓</span>
              <div>
                <h2 data-pilot-title>Recommended pilot</h2>
                <p data-pilot-recommendation>Run a live scan to generate a repo-specific 7-day rollout.</p>
              </div>
            </div>
            <dl class="pilot-metrics">
              <div><dt>Open PRs</dt><dd data-pilot-open>scan</dd></div>
              <div><dt>Fork PRs</dt><dd data-pilot-fork>scan</dd></div>
              <div><dt>Unknown authors</dt><dd data-pilot-unknown>scan</dd></div>
              <div><dt>Spam labels</dt><dd data-pilot-labels>scan</dd></div>
            </dl>
          </section>
          <section class="pilot-card">
            <div class="panel-top">
              <strong>7-day rollout</strong>
              <span data-pilot-plan-status>waiting</span>
            </div>
            <ol class="pilot-timeline" data-pilot-timeline>
              <li><strong>Run scan</strong><span>Load live evidence before changing repository settings.</span></li>
            </ol>
          </section>
          <div class="pilot-card-grid">
            <section class="pilot-card">
              <div class="panel-top">
                <strong>Branch protection</strong>
                <span>settings</span>
              </div>
              <ul class="pilot-list" data-pilot-branch>
                <li>Do not require pr-captcha/human until the pilot plan is generated.</li>
              </ul>
            </section>
            <section class="pilot-card">
              <div class="panel-top">
                <strong>Success metrics</strong>
                <span>pilot health</span>
              </div>
              <ul class="pilot-list" data-pilot-metrics>
                <li>Measure solved gates, blocked stale gates, maintainer overrides, and CI released after verification.</li>
              </ul>
            </section>
          </div>
          <section class="pilot-card pilot-rollback">
            <div class="panel-top">
              <strong>Rollback</strong>
              <span>safe exit</span>
            </div>
            <p data-pilot-rollback>Remove pr-captcha/human from required checks, leave the GitHub App installed in advisory mode, and keep evidence links for the next review.</p>
          </section>
          <section class="pilot-card">
            <div class="panel-top">
              <strong>Copyable pilot issue</strong>
              <span data-pilot-issue-status>ready</span>
            </div>
            <pre class="status-json pilot-issue" data-pilot-issue>Run a pilot scan to generate a maintainer-ready issue.</pre>
            <div class="preview-actions pilot-issue-actions">
              <a class="button primary" href="${escapeHtml(issueUrl)}" target="_blank" rel="noreferrer" data-pilot-open-issue>Open GitHub issue</a>
              <a class="button light" href="${escapeHtml(reportUrl)}" data-pilot-evidence-link>Open evidence report</a>
            </div>
          </section>
        </div>
      </section>
    </main>
    ${pilotPlanScript()}`,
    {
      title: "Maintainer pilot plan",
      description:
        "Generate a 7-day rollout plan for piloting pr-captcha on a real GitHub repository.",
      canonicalUrl: baseUrl ? `${baseUrl}/pilot` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderTrustCenterPage(baseUrl?: string): string {
  return layout(
    "Trust Center",
    `<header class="site-header utility-header trust-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/launch">Install</a>
        <a href="/setup-wizard">Policy</a>
        <a href="/status">Status</a>
        <a href="/trust" aria-current="page">Trust</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/security.md">Security contact</a>
    </header>
    <main id="main" class="preview-page trust-page">
      <section class="preview-heading trust-heading">
        <div>
          <p class="eyebrow">Plain promises</p>
          <h1>What pr-captcha does not do.</h1>
          <p>It does not judge code quality, read private source beyond GitHub metadata, or run contributor code. It records one GitHub-authenticated human receipt for one commit SHA.</p>
          <div class="actions demo-actions">
            <a class="button primary" href="/security.md">Security contact</a>
            <a class="button light" href="/privacy.md">Privacy</a>
            <a class="button light" href="/terms.md">Terms</a>
          </div>
        </div>
        <aside class="trust-readiness" aria-label="Trust readiness">
          <div>
            <span>Public launch posture</span>
            <strong>Beta ready</strong>
            <small>Docs exist. Real support mailbox and production accounts still need setup.</small>
          </div>
          <div>
            <span>Data handling</span>
            <strong>Metadata only</strong>
            <small>No checkout, build, tests, or execution of pull request code.</small>
          </div>
          <div>
            <span>Security model</span>
            <strong>SHA bound</strong>
            <small>Verification binds GitHub login, PR author policy, repository, PR, and head SHA.</small>
          </div>
        </aside>
      </section>
      <section class="trust-shell" aria-label="Trust documents">
        <div class="trust-docs">
          <div class="panel-top">
            <strong>Trust documents</strong>
            <span>public</span>
          </div>
          ${trustDocRow("Security model", "What pr-captcha signs, verifies, stores, rate limits, and refuses to execute.", "/security.md", "ready")}
          ${trustDocRow("Privacy", "What metadata is processed for GitHub App, OAuth, Turnstile, and D1 verification records.", "/privacy.md", "ready")}
          ${trustDocRow("Terms", "Beta use terms for maintainers testing the service before a broader public traffic.", "/terms.md", "beta")}
          ${trustDocRow("Abuse reporting", "How maintainers and contributors report bypass attempts, harmful installs, and suspicious activity.", "/abuse.md", "ready")}
          ${trustDocRow("Incident process", "How operators triage, disclose, and recover from service or security incidents.", "/incident.md", "ready")}
          ${trustDocRow("Beta policy", "Scope, limits, support expectation, and best-effort beta language for closed beta repositories.", "/beta.md", "beta")}
          ${trustDocRow("Support path", "Where maintainers ask setup questions, report bugs, and request production help.", "/support.md", "beta")}
        </div>
        <aside class="trust-rail">
          <div class="panel-top">
            <strong>Launch blockers</strong>
            <span>external</span>
          </div>
          <ul class="trust-checklist">
            <li data-state="ready"><strong>Public docs</strong><span>Trust, setup, operations, GitHub App, and config docs are in the Worker asset bundle.</span></li>
            <li data-state="beta"><strong>Support mailbox</strong><span>Use GitHub issues during beta. Add a dedicated support mailbox before broader public traffic.</span></li>
            <li data-state="beta"><strong>Security advisory path</strong><span>Use GitHub private vulnerability reporting or a dedicated security mailbox before public launch.</span></li>
            <li data-state="blocked"><strong>Production accounts</strong><span>Cloudflare Worker, D1, Turnstile, GitHub App, and OAuth secrets are still required.</span></li>
          </ul>
          <div class="trust-actions">
            <a class="button primary" href="/launch">Install app</a>
            <a class="button light" href="/status">Check readiness</a>
          </div>
        </aside>
      </section>
    </main>`,
    {
      title: "Trust Center",
      description:
        "Public security, privacy, terms, incident, abuse, support, and beta-policy documents for pr-captcha.",
      canonicalUrl: baseUrl ? `${baseUrl}/trust` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderBadgeBuilderPage(baseUrl?: string): string {
  const workerUrl = baseUrl ?? "https://pr-captcha.example.workers.dev";
  const badgeUrl = `${workerUrl}/badge.svg?label=protected%20by&message=pr-captcha&tone=green&style=rounded`;
  const linkUrl = `${workerUrl}/demo`;
  const markdown = `[![protected by pr-captcha](${badgeUrl})](${linkUrl})`;
  const html = `<a href="${linkUrl}"><img alt="protected by pr-captcha" src="${badgeUrl}" /></a>`;

  return layout(
    "README badge builder",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/demo">Demo</a>
        <a href="/queue-pressure">Queue</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card">Proof</a>
        <a href="/setup-wizard">Wizard</a>
        <a href="/diagnostics">Diagnostics</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/setup-wizard">Open setup</a>
    </header>
    <main id="main" class="preview-page badge-page">
      <section class="preview-heading badge-heading">
        <div>
          <h1>Give maintainers a public proof mark</h1>
          <p>Generate a README badge that points reviewers to the pr-captcha proof path. It is a tiny public surface for repos that want unknown PRs to prove there is a human.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-copy-badge="markdown">Copy Markdown</button>
            <a class="button light" href="/demo">Open demo</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>First-party SVG</span>
          <span><span class="mini-shield">✓</span>README ready</span>
          <span><span class="mini-shield">✓</span>Links to proof</span>
        </div>
      </section>
      <section class="badge-shell" aria-label="README badge builder">
        <form class="badge-controls" data-badge-form>
          <div class="panel-top">
            <strong>Badge inputs</strong>
            <span data-badge-status>ready</span>
          </div>
          <div class="badge-fields">
            ${badgeField("Worker URL", "worker_url", workerUrl, "url")}
            ${badgeField("Badge label", "label", "protected by")}
            ${badgeField("Badge message", "message", "pr-captcha")}
            ${badgeField("Link target", "link_url", linkUrl, "url")}
          </div>
          <fieldset class="badge-toggle-group">
            <legend>Badge tone</legend>
            <button class="button light compact" type="button" data-badge-tone="green" aria-pressed="true">Green</button>
            <button class="button light compact" type="button" data-badge-tone="black" aria-pressed="false">Black</button>
            <button class="button light compact" type="button" data-badge-tone="amber" aria-pressed="false">Amber</button>
          </fieldset>
          <fieldset class="badge-toggle-group">
            <legend>Badge style</legend>
            <button class="button light compact" type="button" data-badge-style="rounded" aria-pressed="true">Rounded</button>
            <button class="button light compact" type="button" data-badge-style="flat" aria-pressed="false">Flat</button>
          </fieldset>
        </form>
        <div class="badge-preview-panel">
          <section class="badge-live">
            <div class="panel-top">
              <strong>Live badge</strong>
              <span>SVG endpoint</span>
            </div>
            <div class="badge-preview-frame">
              <img data-badge-preview alt="protected by pr-captcha" src="${escapeHtml(badgeUrl)}" />
              <a data-badge-open href="${escapeHtml(badgeUrl)}">Open badge.svg</a>
            </div>
          </section>
          <section class="badge-snippets">
            <div class="panel-top">
              <strong>Markdown</strong>
              <button class="button light compact" type="button" data-copy-badge="markdown">Copy</button>
            </div>
            <pre class="status-json badge-snippet" data-badge-markdown>${escapeHtml(markdown)}</pre>
          </section>
          <section class="badge-snippets">
            <div class="panel-top">
              <strong>HTML</strong>
              <button class="button light compact" type="button" data-copy-badge="html">Copy</button>
            </div>
            <pre class="status-json badge-snippet" data-badge-html>${escapeHtml(html)}</pre>
          </section>
        </div>
      </section>
      <section class="demo-next badge-next">
        <div>
          <h2>Make the install visible.</h2>
          <p>Install the app, paste the badge into the repository README, then point curious maintainers to the demo, status page, and setup wizard.</p>
        </div>
        <div class="demo-next-actions">
          <a class="button primary" href="/setup-wizard">Install app</a>
          <a class="button light" href="/status">Verify status</a>
          <a class="button light" href="/queue-pressure">Measure queue</a>
        </div>
      </section>
    </main>
    ${badgeBuilderScript()}`,
    {
      title: "README badge builder",
      description:
        "Generate a first-party pr-captcha README badge and copy Markdown or HTML snippets for public repositories.",
      canonicalUrl: baseUrl ? `${baseUrl}/badge-builder` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderProofCardBuilderPage(baseUrl?: string): string {
  const workerUrl = baseUrl ?? "https://pr-captcha.example.workers.dev";
  const proofUrl = `${workerUrl}/proof.svg?repo=octo-org%2Fawesome-repo&pr=184&sha=8f31c9a&user=some-user&result=verified&theme=light`;
  const linkUrl = `${workerUrl}/demo`;
  const markdown = `[![pr-captcha proof card](${proofUrl})](${linkUrl})`;
  const html = `<a href="${linkUrl}"><img alt="pr-captcha proof card" src="${proofUrl}" /></a>`;
  const social =
    "PR #184 passed pr-captcha: GitHub login, CAPTCHA solved, exact head SHA verified. No patch checkout.";

  return layout(
    "PR proof card",
    `<header class="site-header utility-header proof-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/demo">Demo</a>
        <a href="/queue-pressure">Queue</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card" aria-current="page">Proof</a>
        <a href="/setup-wizard">Wizard</a>
        <a href="/diagnostics">Diagnostics</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/demo">Open demo</a>
    </header>
    <main id="main" class="preview-page proof-page">
      <section class="preview-heading proof-heading">
        <div>
          <h1>Turn a verified PR into proof</h1>
          <p>Generate a shareable card for a PR that passed pr-captcha. It shows the trust boundary: GitHub login, CAPTCHA solved, exact head SHA, and no patch checkout.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-copy-proof="markdown">Copy Markdown</button>
            <a class="button light" href="/badge-builder">Get README badge</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Exact head SHA</span>
          <span><span class="mini-shield">✓</span>GitHub user</span>
          <span><span class="mini-shield">✓</span>No patch checkout</span>
        </div>
      </section>
      <section class="proof-shell" aria-label="PR proof-card generator">
        <form class="proof-controls" data-proof-form>
          <div class="panel-top">
            <strong>Proof inputs</strong>
            <span data-proof-status>ready</span>
          </div>
          <div class="proof-fields">
            ${proofField("Worker URL", "worker_url", workerUrl, "url")}
            ${proofField("Repository", "repo", "octo-org/awesome-repo")}
            ${proofField("PR number", "pr", "184", "number")}
            ${proofField("Commit SHA", "sha", "8f31c9a")}
            ${proofField("GitHub user", "user", "some-user")}
          </div>
          <fieldset class="proof-toggle-group">
            <legend>Verification result</legend>
            <button class="button light compact" type="button" data-proof-result="verified" aria-pressed="true">Verified</button>
            <button class="button light compact" type="button" data-proof-result="pending" aria-pressed="false">Pending</button>
            <button class="button light compact" type="button" data-proof-result="denied" aria-pressed="false">Denied</button>
          </fieldset>
          <fieldset class="proof-toggle-group">
            <legend>Card theme</legend>
            <button class="button light compact" type="button" data-proof-theme="light" aria-pressed="true">Light</button>
            <button class="button light compact" type="button" data-proof-theme="dark" aria-pressed="false">Dark</button>
            <button class="button light compact" type="button" data-proof-theme="compact" aria-pressed="false">Compact</button>
          </fieldset>
        </form>
        <div class="proof-preview-panel">
          <section class="proof-live">
            <div class="panel-top">
              <strong>Live proof card</strong>
              <span>1200 x 630 SVG</span>
            </div>
            <div class="proof-preview-frame">
              <img data-proof-preview alt="pr-captcha proof card" src="${escapeHtml(proofUrl)}" />
              <a data-proof-open href="${escapeHtml(proofUrl)}">Open proof.svg</a>
            </div>
          </section>
          <section class="proof-snippets">
            <div class="panel-top">
              <strong>Markdown</strong>
              <button class="button light compact" type="button" data-copy-proof="markdown">Copy</button>
            </div>
            <pre class="status-json proof-snippet" data-proof-markdown>${escapeHtml(markdown)}</pre>
          </section>
          <section class="proof-snippets">
            <div class="panel-top">
              <strong>HTML</strong>
              <button class="button light compact" type="button" data-copy-proof="html">Copy</button>
            </div>
            <pre class="status-json proof-snippet" data-proof-html>${escapeHtml(html)}</pre>
          </section>
          <section class="proof-snippets">
            <div class="panel-top">
              <strong>Social text</strong>
              <button class="button light compact" type="button" data-copy-proof="social">Copy</button>
            </div>
            <pre class="status-json proof-snippet" data-proof-social>${escapeHtml(social)}</pre>
          </section>
        </div>
      </section>
      <section class="demo-next proof-next">
        <div>
          <h2>Make the trust boundary shareable.</h2>
          <p>Share the proof card, add the README badge, then run diagnostics when the repository is ready to install.</p>
        </div>
        <div class="demo-next-actions">
          <a class="button primary" href="/badge-builder">Install badge</a>
          <a class="button light" href="/diagnostics">Run diagnostics</a>
          <a class="button light" href="/demo">Watch demo</a>
        </div>
      </section>
    </main>
    ${proofCardBuilderScript()}`,
    {
      title: "PR proof card",
      description:
        "Generate a shareable pr-captcha proof card for a verified pull request and copy Markdown, HTML, or social snippets.",
      canonicalUrl: baseUrl ? `${baseUrl}/proof-card` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderScorecardBuilderPage(
  baseUrl?: string,
  initialRepository = "tldraw/tldraw",
): string {
  const workerUrl = baseUrl ?? "https://pr-captcha.example.workers.dev";
  const repository = initialRepository;
  const scorecardUrl = `${workerUrl}/scorecard.svg?repo=${encodeURIComponent(repository)}&risk=low&open=85&fork=0&unknown=0&labels=0&theme=light`;
  const linkUrl = `${workerUrl}/evidence?repo=${encodeURIComponent(repository)}`;
  const pilotUrl = `${workerUrl}/pilot?repo=${encodeURIComponent(repository)}`;
  const setupUrl = `${workerUrl}/setup-wizard?repo=${encodeURIComponent(repository)}`;
  const markdown = `[![pr-captcha queue scorecard](${scorecardUrl})](${linkUrl})`;
  const html = `<a href="${linkUrl}"><img alt="pr-captcha queue scorecard" src="${scorecardUrl}" /></a>`;
  const social =
    "tldraw/tldraw PR queue scorecard: low risk, 85 open PRs, 0 fork PRs, 0 unknown authors. Scanned by pr-captcha.";
  const issueText = scorecardIssueText({
    repository,
    risk: "low",
    openPullRequests: "85",
    forkPullRequests: "0",
    unknownAuthors: "0",
    labelMatches: "0",
    scorecardUrl,
    pilotUrl,
    setupUrl,
  });
  const issueUrl = githubIssueUrl(
    repository,
    "Pilot pr-captcha for PR queue pressure",
    issueText,
  );

  return layout(
    "OSS PR queue scorecard",
    `<header class="site-header utility-header proof-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/radar">Radar</a>
        <a href="/evidence">Evidence</a>
        <a href="/pilot">Pilot</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card">Proof</a>
        <a href="/scorecard-builder" aria-current="page">Scorecard</a>
        <a href="/setup-wizard">Setup</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/evidence">Scan repo</a>
    </header>
    <main id="main" class="preview-page proof-page scorecard-page">
      <section class="preview-heading proof-heading scorecard-heading">
        <div>
          <h1>Repository queue scorecard</h1>
          <p>Turn public PR spam pressure into a first-party SVG receipt, install issue, and 7-day pilot packet before asking a maintainer to install anything.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-scorecard-run>Run live scan</button>
            <button class="button light" type="button" data-copy-scorecard="markdown">Copy badge</button>
            <button class="button light" type="button" data-copy-scorecard="issue">Copy install issue</button>
            <a class="button light" href="/pilot">Plan pilot</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Live GitHub evidence</span>
          <span><span class="mini-shield">✓</span>Embeddable SVG</span>
          <span><span class="mini-shield">✓</span>Maintainer-ready</span>
        </div>
      </section>
      <section class="proof-shell scorecard-shell" aria-label="OSS PR queue scorecard builder">
        <form class="proof-controls" data-scorecard-form>
          <div class="panel-top">
            <strong>Scorecard inputs</strong>
            <span data-scorecard-status>ready</span>
          </div>
          <div class="proof-fields">
            ${proofField("Worker URL", "worker_url", workerUrl, "url")}
            ${proofField("Repository", "repo", repository)}
          </div>
          <fieldset class="proof-toggle-group">
            <legend>Card theme</legend>
            <button class="button light compact" type="button" data-scorecard-theme="light" aria-pressed="true">Light</button>
            <button class="button light compact" type="button" data-scorecard-theme="dark" aria-pressed="false">Dark</button>
          </fieldset>
          <div class="evidence-presets scorecard-presets" aria-label="Repository presets">
            <button class="button light compact" type="button" data-scorecard-preset="tldraw/tldraw">tldraw</button>
            <button class="button light compact" type="button" data-scorecard-preset="godotengine/godot">Godot</button>
            <button class="button light compact" type="button" data-scorecard-preset="kubernetes/kubernetes">Kubernetes</button>
            <button class="button light compact" type="button" data-scorecard-preset="freeCodeCamp/freeCodeCamp">freeCodeCamp</button>
          </div>
          <div class="evidence-actions">
            <a data-scorecard-evidence href="${escapeHtml(linkUrl)}">Evidence report</a>
            <a data-scorecard-pilot href="${escapeHtml(`${workerUrl}/pilot?repo=${encodeURIComponent(repository)}`)}">Pilot plan</a>
            <a href="/badge-builder">README badge</a>
          </div>
        </form>
        <div class="proof-preview-panel">
          <section class="proof-live">
            <div class="panel-top">
              <strong>Your shareable scorecard</strong>
              <span>1200 x 630 SVG</span>
            </div>
            <div class="proof-preview-frame scorecard-preview-frame">
              <img data-scorecard-preview alt="pr-captcha queue scorecard" src="${escapeHtml(scorecardUrl)}" />
              <a data-scorecard-open href="${escapeHtml(scorecardUrl)}">Open scorecard.svg</a>
            </div>
          </section>
          <section class="proof-snippets scorecard-url-card">
            <div class="panel-top">
              <strong>Scorecard SVG URL</strong>
              <button class="button light compact" type="button" data-copy-scorecard="url">Copy URL</button>
            </div>
            <pre class="status-json proof-snippet" data-scorecard-url>${escapeHtml(scorecardUrl)}</pre>
          </section>
          <section class="proof-snippets">
            <div class="panel-top">
              <strong>Markdown</strong>
              <button class="button light compact" type="button" data-copy-scorecard="markdown">Copy</button>
            </div>
            <pre class="status-json proof-snippet" data-scorecard-markdown>${escapeHtml(markdown)}</pre>
          </section>
          <section class="proof-snippets">
            <div class="panel-top">
              <strong>HTML</strong>
              <button class="button light compact" type="button" data-copy-scorecard="html">Copy</button>
            </div>
            <pre class="status-json proof-snippet" data-scorecard-html>${escapeHtml(html)}</pre>
          </section>
          <section class="proof-snippets">
            <div class="panel-top">
              <strong>Social post</strong>
              <button class="button light compact" type="button" data-copy-scorecard="social">Copy</button>
            </div>
            <pre class="status-json proof-snippet" data-scorecard-social>${escapeHtml(social)}</pre>
          </section>
        </div>
      </section>
      <section class="scorecard-adoption-grid" aria-label="Scorecard adoption packet">
        <section class="scorecard-issue-card">
          <div class="panel-top">
            <strong>Install issue draft</strong>
            <span data-scorecard-issue-status>ready to copy</span>
          </div>
          <pre class="status-json proof-snippet scorecard-issue" data-scorecard-issue>${escapeHtml(issueText)}</pre>
          <div class="preview-actions">
            <button class="button primary" type="button" data-copy-scorecard="issue">Copy issue</button>
            <a class="button light" data-scorecard-open-issue href="${escapeHtml(issueUrl)}">Open install issue</a>
          </div>
        </section>
        <section class="scorecard-routing-card">
          <div class="panel-top">
            <strong>Routing actions</strong>
            <span>choose next step</span>
          </div>
          <div class="scorecard-action-grid">
            <a class="scorecard-action" data-scorecard-open-issue-secondary href="${escapeHtml(issueUrl)}">
              <strong>Open install issue</strong>
              <span>Create a prefilled issue in the target repository.</span>
            </a>
            <button class="scorecard-action" type="button" data-copy-scorecard="share">
              <strong>Share receipt</strong>
              <span>Copy the short maintainer-ready summary.</span>
            </button>
            <button class="scorecard-action" type="button" data-copy-scorecard="markdown">
              <strong>Copy badge</strong>
              <span>Add the scorecard SVG to README or an issue.</span>
            </button>
            <a class="scorecard-action" data-scorecard-setup href="${escapeHtml(setupUrl)}">
              <strong>Configure policy</strong>
              <span>Preview .github/pr-captcha.yml for this repo.</span>
            </a>
          </div>
          <pre class="status-json proof-snippet scorecard-share" data-scorecard-share>${escapeHtml(social)}</pre>
        </section>
      </section>
    </main>
    ${scorecardBuilderScript()}`,
    {
      title: "OSS PR queue scorecard",
      description:
        "Generate a shareable pr-captcha scorecard from live GitHub pull request evidence.",
      canonicalUrl: baseUrl ? `${baseUrl}/scorecard-builder` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderLaunchPage(baseUrl?: string): string {
  const workerUrl = baseUrl ?? "https://pr-captcha.example.workers.dev";
  const repository = "aryabyte21/pr-captcha";
  const databaseName = "pr-captcha";
  const appSlug = "pr-captcha";
  const pagesUrl = launchPagesUrl(repository);
  const commands = launchCommandsText(
    workerUrl,
    repository,
    databaseName,
    pagesUrl,
  );
  const shareText = launchShareText(workerUrl, repository, appSlug, pagesUrl);
  const issueText = launchIssueText(workerUrl, repository, pagesUrl);
  const badgeMarkdown = launchBadgeMarkdown(workerUrl, repository);

  return layout(
    "Install pr-captcha",
    `<header class="site-header utility-header launch-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/launch" aria-current="page">Install</a>
        <a href="/setup-wizard">Policy</a>
        <a href="/status">Status</a>
        <a href="/trust">Trust</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="https://github.com/apps/pr-captcha-aryabyte21/installations/new">Install app</a>
    </header>
    <main id="main" class="preview-page launch-page">
      <section class="preview-heading launch-heading">
        <div>
          <p class="eyebrow">Hosted app. No Worker setup required.</p>
          <h1 aria-label="Make AI slop knock first">Make AI slop knock first.</h1>
          <p>pr-captcha is a polite little velvet rope for your PR queue. A contributor proves one simple thing before CI or review time starts: a logged-in GitHub human is present for this exact commit.</p>
          <div class="actions demo-actions">
            <a class="button primary" href="https://github.com/apps/pr-captcha-aryabyte21/installations/new">Install GitHub App</a>
            <a class="button light" href="/setup-wizard">Make policy</a>
            <button class="button light" type="button" data-copy-launch="share">Copy maintainer note</button>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Install the app</span>
          <span><span class="mini-shield">✓</span>Add one required check</span>
          <span><span class="mini-shield">✓</span>Open a test PR</span>
          <span><span class="mini-shield">✓</span>Let humans in</span>
        </div>
      </section>
      <section class="launch-decision-strip" aria-label="Ship readiness decision">
        <div class="launch-decision-card" data-launch-decision-card data-state="blocked">
          <span>Step 1</span>
          <strong data-launch-decision>Install</strong>
          <p data-launch-decision-detail>Add the hosted GitHub App to the repository.</p>
        </div>
        <div class="launch-decision-card">
          <span>Step 2</span>
          <strong data-launch-blocker-count>8</strong>
          <p data-launch-blocker-detail>Generate the policy and choose where the check is required.</p>
        </div>
        <div class="launch-decision-card">
          <span>Step 3</span>
          <strong data-launch-next-proof>Test PR</strong>
          <p data-launch-next-proof-detail>Open one disposable PR and watch the receipt turn green.</p>
        </div>
      </section>
      <section class="launch-shell" aria-label="pr-captcha production launch cockpit">
        <form class="launch-panel launch-form" data-launch-form autocomplete="off">
          <div class="panel-top">
            <strong>Your repo</strong>
            <span>hosted path</span>
          </div>
          <div class="launch-progress" aria-hidden="true">
            <span data-launch-progress-bar style="width: 0%"></span>
          </div>
          <div class="launch-fields">
            ${launchField("Repository", "repository", repository)}
            <details class="launch-advanced launch-field-details">
              <summary>Advanced service fields</summary>
              ${launchField("Worker URL", "worker_url", workerUrl, "url")}
              ${launchField("GitHub App slug", "github_app", appSlug)}
              ${launchField("Pages redirect", "pages_url", pagesUrl, "url")}
              ${launchField("D1 database", "d1_database", databaseName)}
            </details>
          </div>
          <details class="launch-advanced launch-gate-details">
            <summary><span>Operator checklist</span><strong data-launch-progress>0 of 8 proven</strong></summary>
            <fieldset class="launch-checklist">
              <legend>Production gates</legend>
              ${launchStep("worker", "Worker", "Deployed on the final domain with APP_BASE_URL set.")}
              ${launchStep("d1", "D1", "Production database created, bound, and migrated with the real database id.")}
              ${launchStep("pages", "Pages redirect", "Optional GitHub Pages fallback redirects people to the hosted Worker.")}
              ${launchStep("github_app_ready", "GitHub App", "Manifest converted and secrets stored in Cloudflare.")}
              ${launchStep("turnstile", "Turnstile", "Production site key and secret key are active.")}
              ${launchStep("policy", "Repository policy", ".github/pr-captcha.yml committed on the default branch.")}
              ${launchStep("diagnostics", "Diagnostics", "Repository diagnostics pass for the installed GitHub App.")}
              ${launchStep("fork_pr", "Fork PR test", "A clean public fork PR verifies and unblocks the exact SHA.")}
            </fieldset>
          </details>
        </form>
        <div class="launch-center">
          <section class="workflow-panel launch-human-demo" aria-label="How pr-captcha feels in a pull request">
            <div class="panel-top">
              <strong>What maintainers get</strong>
              <span>one green receipt</span>
            </div>
            <div class="receipt-story">
              <div><span>1</span><strong>PR opens</strong><p>The queue does not panic. pr-captcha posts one clear human check.</p></div>
              <div><span>2</span><strong>Contributor verifies</strong><p>GitHub login plus Turnstile proves presence without running their code.</p></div>
              <div><span>3</span><strong>Receipt turns green</strong><p>The exact head SHA gets the check. A new commit has to knock again.</p></div>
            </div>
          </section>
          <details class="workflow-panel launch-commands launch-advanced">
            <summary><strong>Operator commands</strong><span>Only needed if you self-host or redeploy.</span></summary>
            <pre><code data-launch-commands>${escapeHtml(commands)}</code></pre>
            <div class="preview-actions">
              <button class="button primary" type="button" data-copy-launch="commands">Copy commands</button>
              <a class="button light" href="/setup-wizard">Make policy</a>
              <a class="button light" href="/status">Check status</a>
            </div>
          </details>
          <div class="launch-actions-row">
            <a href="https://github.com/apps/pr-captcha-aryabyte21/installations/new"><strong>Install GitHub App</strong><span>Use the hosted pr-captcha app.</span></a>
            <a href="/setup-wizard"><strong>Make policy</strong><span>Choose who needs the check.</span></a>
            <a href="/status"><strong>Check service</strong><span>See whether the hosted gate is healthy.</span></a>
          </div>
          <section class="workflow-panel launch-proof-lane" aria-label="Fork PR proof lane">
            <div class="panel-top">
              <strong>Test it without drama</strong>
              <span data-launch-proof-status>waiting</span>
            </div>
            <ol class="launch-proof-list" data-launch-proof-list>
              ${launchProofStage("policy", "Unknown fork PR", "Repository policy decides which untrusted PRs are held.")}
              ${launchProofStage("github_app_ready", "Webhook received", "GitHub App webhook can create the SHA-bound gate.")}
              ${launchProofStage("turnstile", "Human solved", "Turnstile and GitHub OAuth prove a real logged-in user.")}
              ${launchProofStage("diagnostics", "SHA verified", "Diagnostics confirm repository access before branch protection.")}
              ${launchProofStage("fork_pr", "Check released", "A clean fork PR verifies and releases pr-captcha/human.")}
            </ol>
          </section>
          <section class="workflow-panel launch-adoption-card" aria-label="Maintainer adoption packet">
            <div class="panel-top">
              <strong>Maintainer note</strong>
              <span>copy, paste, move on</span>
            </div>
            <div class="launch-adoption-grid">
              <div class="launch-adoption-copy">
                <h2>Tell the team what changes.</h2>
                <p>This should feel boring: one check named <code>pr-captcha/human</code>, one verification link, and one rollback path if the pilot gets noisy.</p>
                <dl class="launch-adoption-meta">
                  <div><dt>Required check</dt><dd>pr-captcha/human</dd></div>
                  <div><dt>README badge</dt><dd><code data-launch-badge>${escapeHtml(badgeMarkdown)}</code></dd></div>
                  <div><dt>Setup wizard</dt><dd><a href="/setup-wizard">Open setup</a></dd></div>
                  <div><dt>Proof card</dt><dd><a href="/proof-card">Create after fork test</a></dd></div>
                </dl>
              </div>
              <div class="launch-adoption-issue">
                <pre><code data-launch-issue>${escapeHtml(issueText)}</code></pre>
                <div class="preview-actions">
                  <button class="button primary" type="button" data-copy-launch="issue">Copy GitHub issue</button>
                  <button class="button light" type="button" data-copy-launch="badge">Copy README badge</button>
                </div>
              </div>
            </div>
          </section>
          <section class="preview-card launch-readiness" aria-label="Live launch readiness">
            <div class="launch-readiness-head">
              <div>
                <h2>Live readiness</h2>
                <p>Reads this Worker, its D1 binding, and required production secrets.</p>
              </div>
              <button class="button light" type="button" data-launch-readiness-refresh>Run readiness</button>
            </div>
            <div class="preview-status" data-service-state="warn" data-launch-readiness-status>
              <span class="mini-shield">!</span>
              <div>
                <strong>Readiness not checked</strong>
                <p>Run the check against the current Worker URL before public launch.</p>
              </div>
            </div>
            <ul class="diagnostic-list launch-readiness-list" data-launch-readiness-list>
              <li data-level="warning"><strong>Worker</strong><span>Waiting for live readiness evidence.</span></li>
            </ul>
          </section>
        </div>
        <aside class="launch-gaps">
          <section class="launch-blocker-alert" data-launch-blocker-alert>
            <div>
              <strong data-launch-blocker-title>Before you require the check</strong>
              <p data-launch-blocker-summary>Install the app, commit the policy, and prove one disposable PR first.</p>
            </div>
            <ul data-launch-blocker-list>
              <li>GitHub App not installed</li>
              <li>Policy not committed</li>
              <li>Test PR not verified</li>
            </ul>
          </section>
          <div class="preview-status" data-service-state="warn" data-launch-status>
            <span class="mini-shield">!</span>
            <div>
              <strong>Do not make it required yet</strong>
              <p>Run one test PR first. Nobody wants a brave new broken merge button.</p>
            </div>
          </div>
          <section class="preview-card">
            <h2>Advanced proof list</h2>
            <ul class="diagnostic-list" data-launch-gap-list>
              <li data-level="warning"><strong>Worker</strong><span>Waiting for evidence.</span></li>
              <li data-level="warning"><strong>D1</strong><span>Waiting for evidence.</span></li>
              <li data-level="warning"><strong>Pages redirect</strong><span>Waiting for evidence.</span></li>
              <li data-level="warning"><strong>GitHub App</strong><span>Waiting for evidence.</span></li>
              <li data-level="warning"><strong>Turnstile</strong><span>Waiting for evidence.</span></li>
              <li data-level="warning"><strong>Repository policy</strong><span>Waiting for evidence.</span></li>
              <li data-level="warning"><strong>Diagnostics</strong><span>Waiting for evidence.</span></li>
              <li data-level="warning"><strong>Fork PR test</strong><span>Waiting for evidence.</span></li>
            </ul>
          </section>
          <section class="preview-card launch-share-card">
            <h2>Maintainer handoff</h2>
            <pre><code data-launch-share>${escapeHtml(shareText)}</code></pre>
            <button class="button light" type="button" data-copy-launch="share">Copy maintainer note</button>
          </section>
        </aside>
      </section>
    </main>
    ${launchPageScript()}`,
    {
      title: "Install pr-captcha",
      description:
        "Install the hosted pr-captcha GitHub App, add one human receipt check, and test it on a disposable pull request.",
      canonicalUrl: baseUrl ? `${baseUrl}/launch` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderForkPrRehearsalPage(baseUrl?: string): string {
  const workerUrl = baseUrl ?? "https://pr-captcha.example.workers.dev";
  const repository = "aryabyte21/pr-captcha";
  const installationId = "12345678";
  const checkName = "pr-captcha/human";
  const issueText = rehearsalIssueText(workerUrl, repository, installationId);
  const runbookText = rehearsalRunbookText(
    workerUrl,
    repository,
    installationId,
    checkName,
  );
  const actionYaml = rehearsalActionYaml(workerUrl);

  return layout(
    "Fork PR rehearsal",
    `<header class="site-header utility-header rehearsal-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/launch">Install</a>
        <a href="/setup-wizard">Policy</a>
        <a href="/rehearsal" aria-current="page">Test PR</a>
        <a href="/status">Status</a>
        <a href="/trust">Trust</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="https://github.com/apps/pr-captcha-aryabyte21/installations/new">Install app</a>
    </header>
    <main id="main" class="preview-page rehearsal-page">
      <section class="preview-heading rehearsal-heading">
        <div>
          <p class="eyebrow">Do this before branch protection</p>
          <h1>Run one harmless test PR.</h1>
          <p>Before the check becomes required, open a tiny disposable PR and make sure the human receipt turns green. This page is the rehearsal script.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-rehearsal-generate>Generate rehearsal plan</button>
            <button class="button light" type="button" data-copy-rehearsal="runbook">Copy runbook</button>
            <a class="button light" href="/launch">Back to install</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Tiny PR</span>
          <span><span class="mini-shield">✓</span>Human verifies</span>
          <span><span class="mini-shield">✓</span>Exact SHA turns green</span>
          <span><span class="mini-shield">✓</span>Then require it</span>
        </div>
      </section>
      <section class="rehearsal-shell" aria-label="Fork PR rehearsal console">
        <form class="rehearsal-panel rehearsal-form" data-rehearsal-form autocomplete="off">
          <div class="panel-top">
            <strong>Rehearsal inputs</strong>
            <span data-rehearsal-progress>0 of 5 proven</span>
          </div>
          <div class="launch-progress rehearsal-progress" aria-hidden="true">
            <span data-rehearsal-progress-bar style="width: 0%"></span>
          </div>
          <div class="rehearsal-fields">
            ${rehearsalField("Worker URL", "worker_url", workerUrl, "url")}
            ${rehearsalField("Repository", "repository", repository)}
            ${rehearsalField("Installation ID", "installation_id", installationId)}
            ${rehearsalField("Expected check", "check_name", checkName)}
            ${rehearsalField("Test branch", "branch", "pr-captcha-rehearsal")}
          </div>
          <fieldset class="rehearsal-checklist">
            <legend>Dry-run evidence</legend>
            ${rehearsalStep("fork_pr", "Open test fork PR", "A disposable fork PR exists and uses a new head SHA.")}
            ${rehearsalStep("webhook", "Webhook created gate", "The pull_request webhook created a pending gate and check run.")}
            ${rehearsalStep("captcha", "Contributor solves CAPTCHA", "The PR author signs in with GitHub and completes Turnstile.")}
            ${rehearsalStep("action", "Action sees verified SHA", "The GitHub Action status call returns verified for the exact head SHA.")}
            ${rehearsalStep("branch", "Ready for branch protection", "The expected check can be required without blocking trusted PRs.")}
          </fieldset>
        </form>
        <div class="rehearsal-panel rehearsal-timeline">
          <div class="panel-top">
            <strong>Live rehearsal timeline</strong>
            <span data-rehearsal-state>waiting</span>
          </div>
          <div class="rehearsal-alert preview-status" data-service-state="warn" data-rehearsal-alert>
            <span class="mini-shield">!</span>
            <div>
              <strong>Rehearsal not complete</strong>
              <p>Mark each evidence point as it passes on the disposable PR.</p>
            </div>
          </div>
          <ol class="rehearsal-stage-list" data-rehearsal-stage-list>
            ${rehearsalStage("1", "Open test fork PR", "Create a small README-only PR from a fork.", "waiting")}
            ${rehearsalStage("2", "Webhook created gate", "Confirm the PR has a pending pr-captcha check.", "waiting")}
            ${rehearsalStage("3", "Contributor solves CAPTCHA", "Open the gate link as the PR author.", "waiting")}
            ${rehearsalStage("4", "Action sees verified SHA", "Run the workflow gate and confirm it exits cleanly.", "waiting")}
            ${rehearsalStage("5", "Ready for branch protection", "Require the exact check after one clean rehearsal.", "waiting")}
          </ol>
          <div class="rehearsal-links">
            <a data-rehearsal-link="status" href="/status">Status</a>
            <a data-rehearsal-link="diagnostics" href="/diagnostics?owner=aryabyte21&repo=pr-captcha">Diagnostics</a>
            <a data-rehearsal-link="setup" href="/setup-wizard">Setup</a>
          </div>
        </div>
        <section class="rehearsal-panel rehearsal-output" aria-label="Copyable rehearsal packet">
          <div class="panel-top">
            <strong>Copyable proof packet</strong>
            <span data-rehearsal-output-label>runbook</span>
          </div>
          <div class="rehearsal-tabs" role="tablist" aria-label="Rehearsal packet views">
            <button type="button" role="tab" aria-selected="true" data-rehearsal-tab="runbook">Runbook</button>
            <button type="button" role="tab" aria-selected="false" data-rehearsal-tab="issue">GitHub issue</button>
            <button type="button" role="tab" aria-selected="false" data-rehearsal-tab="action">Action guard</button>
          </div>
          <pre class="rehearsal-pre" data-rehearsal-panel="runbook"><code data-rehearsal-runbook>${escapeHtml(runbookText)}</code></pre>
          <pre class="rehearsal-pre" data-rehearsal-panel="issue" hidden><code data-rehearsal-issue>${escapeHtml(issueText)}</code></pre>
          <pre class="rehearsal-pre" data-rehearsal-panel="action" hidden><code data-rehearsal-action>${escapeHtml(actionYaml)}</code></pre>
          <div class="preview-actions rehearsal-output-actions">
            <button class="button primary" type="button" data-copy-rehearsal="active">Copy active packet</button>
            <button class="button light" type="button" data-copy-rehearsal="issue">Copy issue</button>
            <a class="button light" data-rehearsal-link="launch" href="/launch">Launch checklist</a>
          </div>
        </section>
      </section>
    </main>
    ${rehearsalPageScript()}`,
    {
      title: "Fork PR rehearsal",
      description:
        "Generate and track a production rehearsal plan before requiring pr-captcha on branch protection.",
      canonicalUrl: baseUrl ? `${baseUrl}/rehearsal` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderGateTracePage(baseUrl?: string): string {
  const workerUrl = baseUrl ?? "https://pr-captcha.example.workers.dev";
  const repository = "aryabyte21/pr-captcha";
  const prNumber = "184";
  const headSha = "8f31c9a4d2e9b6f1c0a7e5d3b2a190f8e4c6d2b1";
  const installationId = "12345678";
  const secretEnv = "GITHUB_WEBHOOK_SECRET";
  const curlText = traceCurlText(
    workerUrl,
    repository,
    prNumber,
    headSha,
    installationId,
    secretEnv,
  );
  const actionYaml = traceActionYaml(workerUrl);
  const proofText = traceProofText(
    workerUrl,
    repository,
    prNumber,
    headSha,
    installationId,
  );

  return layout(
    "Gate trace",
    `<header class="site-header utility-header trace-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/launch">Install</a>
        <a href="/setup-wizard">Policy</a>
        <a href="/rehearsal">Test PR</a>
        <a href="/gate-trace" aria-current="page">Trace</a>
        <a href="/status">Status</a>
        <a href="/trust">Trust</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/rehearsal">Test PR</a>
    </header>
    <main id="main" class="preview-page trace-page">
      <section class="preview-heading trace-heading">
        <div>
          <p class="eyebrow">Advanced debugging</p>
          <h1>Trace one receipt end to end.</h1>
          <p>For operators: replay the path from GitHub webhook to green <code>pr-captcha/human</code> check when a repository needs deeper proof.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-copy-trace="active">Copy smoke test</button>
            <a class="button light" href="/rehearsal">Run test PR</a>
            <a class="button light" href="/launch">Back to install</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Signed webhook</span>
          <span><span class="mini-shield">✓</span>Exact SHA</span>
          <span><span class="mini-shield">✓</span>Action guard</span>
          <span><span class="mini-shield">✓</span>Check proof</span>
        </div>
      </section>
      <section class="trace-shell" aria-label="Gate trace console">
        <form class="trace-panel trace-form" data-trace-form autocomplete="off">
          <div class="panel-top">
            <strong>Trace inputs</strong>
            <span data-trace-progress>0 of 6 proven</span>
          </div>
          <div class="launch-progress trace-progress" aria-hidden="true">
            <span data-trace-progress-bar style="width: 0%"></span>
          </div>
          <div class="trace-fields">
            ${traceField("Worker URL", "worker_url", workerUrl, "url")}
            ${traceField("Repository", "repository", repository)}
            ${traceField("PR number", "pr_number", prNumber, "number")}
            ${traceField("Head SHA", "head_sha", headSha)}
            ${traceField("Installation ID", "installation_id", installationId)}
            ${traceField("Webhook secret env", "secret_env", secretEnv)}
          </div>
          <div class="trace-secret-note">
            <span class="mini-shield">!</span>
            <p>The generated curl reads the secret from your local shell. Do not paste plaintext production secrets into shared screenshots.</p>
          </div>
          <fieldset class="trace-checklist">
            <legend>Trace evidence</legend>
            ${traceStep("webhook", "Signed webhook", "GitHub delivery HMAC validates on /webhooks/github.")}
            ${traceStep("gate", "Gate created", "The Worker stores a pending gate for this PR and SHA.")}
            ${traceStep("oauth", "OAuth session", "The solver authenticates with GitHub before the CAPTCHA form.")}
            ${traceStep("turnstile", "Turnstile passed", "Cloudflare returns a server-side CAPTCHA success.")}
            ${traceStep("sha", "SHA verified", "The status API returns verified only for the exact head SHA.")}
            ${traceStep("check", "Check green", "The pr-captcha/human check run is updated to success.")}
          </fieldset>
        </form>
        <div class="trace-panel trace-chain">
          <div class="panel-top">
            <strong>Status chain</strong>
            <span data-trace-state>waiting</span>
          </div>
          <div class="trace-alert preview-status" data-service-state="warn" data-trace-alert>
            <span class="mini-shield">!</span>
            <div>
              <strong>Trace not complete</strong>
              <p>Mark each proof point as the smoke test advances.</p>
            </div>
          </div>
          <ol class="trace-stage-list" data-trace-stage-list>
            ${traceStage("1", "Signed webhook", "Delivery arrives with a matching HMAC signature.", "waiting")}
            ${traceStage("2", "Gate created", "Worker creates a SHA-bound gate and required check.", "waiting")}
            ${traceStage("3", "OAuth session", "Solver identity comes from GitHub OAuth.", "waiting")}
            ${traceStage("4", "Turnstile passed", "CAPTCHA token verifies server-side.", "waiting")}
            ${traceStage("5", "SHA verified", "Status API returns verified for the head SHA only.", "waiting")}
            ${traceStage("6", "Check green", "Branch protection can require pr-captcha/human.", "waiting")}
          </ol>
          <div class="trace-receipt-strip" data-trace-receipt-strip>
            <div><span>Repository</span><strong data-trace-receipt-repo>${escapeHtml(repository)}</strong></div>
            <div><span>PR</span><strong data-trace-receipt-pr>#${escapeHtml(prNumber)}</strong></div>
            <div><span>SHA</span><strong data-trace-receipt-sha>${escapeHtml(headSha.slice(0, 12))}</strong></div>
          </div>
        </div>
        <section class="trace-panel trace-output" aria-label="Gate trace outputs">
          <div class="panel-top">
            <strong>Smoke-test artifacts</strong>
            <span data-trace-output-label>signed webhook curl</span>
          </div>
          <div class="trace-tabs" role="tablist" aria-label="Gate trace artifacts">
            <button type="button" role="tab" aria-selected="true" data-trace-tab="curl">Signed webhook curl</button>
            <button type="button" role="tab" aria-selected="false" data-trace-tab="action">Action guard YAML</button>
            <button type="button" role="tab" aria-selected="false" data-trace-tab="proof">Acceptance proof</button>
          </div>
          <pre class="trace-pre" data-trace-panel="curl"><code data-trace-curl>${escapeHtml(curlText)}</code></pre>
          <pre class="trace-pre" data-trace-panel="action" hidden><code data-trace-action>${escapeHtml(actionYaml)}</code></pre>
          <pre class="trace-pre" data-trace-panel="proof" hidden><code data-trace-proof>${escapeHtml(proofText)}</code></pre>
          <div class="preview-actions trace-output-actions">
            <button class="button primary" type="button" data-copy-trace="active">Copy active artifact</button>
            <button class="button light" type="button" data-copy-trace="proof">Copy proof</button>
            <a class="button light" href="/status">Check service</a>
          </div>
        </section>
      </section>
    </main>
    ${gateTracePageScript()}`,
    {
      title: "Gate trace",
      description:
        "Generate a pr-captcha smoke test that traces one pull request from signed webhook to green required check.",
      canonicalUrl: baseUrl ? `${baseUrl}/gate-trace` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderGitHubAppManifestPage(baseUrl?: string): string {
  const workerUrl = baseUrl ?? "https://pr-captcha.example.workers.dev";
  const manifest = githubAppManifest(workerUrl, "pr-captcha");
  const manifestJson = JSON.stringify(manifest, null, 2);
  const webhookUrl = `${workerUrl}/webhooks/github`;
  const callbackUrl = `${workerUrl}/auth/github/callback`;
  const setupUrl = `${workerUrl}/setup-wizard`;
  const redirectUrl = `${workerUrl}/github-app-manifest/callback`;

  return layout(
    "GitHub App manifest",
    `<header class="site-header utility-header manifest-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/demo">Demo</a>
        <a href="/queue-pressure">Queue</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card">Proof</a>
        <a href="/github-app-manifest" aria-current="page">Manifest</a>
        <a href="/diagnostics">Diagnostics</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/setup-wizard">Open setup wizard</a>
    </header>
    <main id="main" class="preview-page manifest-page">
      <section class="preview-heading manifest-heading">
        <div>
          <h1>GitHub App manifest</h1>
          <p>Generate the exact app registration payload for pr-captcha. Start with your Worker URL, then copy the manifest or submit it to GitHub when the production endpoint is ready.</p>
          <div class="actions demo-actions">
            <button class="button primary" type="button" data-copy-manifest>Copy manifest</button>
            <a class="button light" href="/github-app.md">Permission guide</a>
          </div>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Webhook URL</span>
          <span><span class="mini-shield">✓</span>OAuth callback</span>
          <span><span class="mini-shield">✓</span>Least permissions</span>
        </div>
      </section>
      <section class="manifest-shell" aria-label="GitHub App manifest builder">
        <form class="manifest-controls" data-manifest-form autocomplete="off">
          <div class="panel-top">
            <strong>App registration</strong>
            <span data-manifest-status>ready</span>
          </div>
          <div class="manifest-fields">
            ${manifestField("Worker URL", "worker_url", workerUrl, "url")}
            ${manifestField("App name", "app_name", "pr-captcha")}
            ${manifestField("Organization slug", "org_slug", "", "text", "Optional")}
          </div>
          <fieldset class="manifest-target">
            <legend>Register under</legend>
            <label><input type="radio" name="target" value="personal" checked /><span>Personal account</span></label>
            <label><input type="radio" name="target" value="organization" /><span>Organization</span></label>
          </fieldset>
          <section class="manifest-url-list" aria-label="Computed GitHub App URLs">
            <div><span>Webhook URL</span><code data-manifest-webhook>${escapeHtml(webhookUrl)}</code></div>
            <div><span>Callback URL</span><code data-manifest-callback>${escapeHtml(callbackUrl)}</code></div>
            <div><span>Setup URL</span><code data-manifest-setup>${escapeHtml(setupUrl)}</code></div>
            <div><span>Redirect URL</span><code data-manifest-redirect>${escapeHtml(redirectUrl)}</code></div>
          </section>
          <section class="manifest-permissions" aria-label="GitHub App permissions">
            <div class="manifest-permission-row"><strong>Metadata</strong><span>Read</span><small>Required by GitHub Apps.</small></div>
            <div class="manifest-permission-row"><strong>Checks</strong><span>Write</span><small>Create pr-captcha/human check runs.</small></div>
            <div class="manifest-permission-row"><strong>Issues</strong><span>Write</span><small>Create or update the PR comment.</small></div>
            <div class="manifest-permission-row"><strong>Pull requests</strong><span>Read</span><small>Read author, labels, fork state, and SHA.</small></div>
            <div class="manifest-permission-row"><strong>Actions</strong><span>Write</span><small>Approve held fork runs and rerun gates.</small></div>
            <div class="manifest-permission-row"><strong>Contents</strong><span>Read</span><small>Load .github/pr-captcha.yml.</small></div>
          </section>
        </form>
        <div class="manifest-output">
          <div class="workflow-panel">
            <div class="panel-top">
              <strong>manifest.json</strong>
              <span>GitHub App payload</span>
            </div>
            <pre><code data-manifest-json>${escapeHtml(manifestJson)}</code></pre>
            <div class="preview-actions manifest-actions">
              <button class="button light" type="button" data-copy-manifest>Copy manifest</button>
              <form action="https://github.com/settings/apps/new" method="post" data-manifest-submit>
                <input type="hidden" name="manifest" value="${escapeHtml(JSON.stringify(manifest))}" data-manifest-input />
                <button class="button primary" type="submit">Create GitHub App</button>
              </form>
            </div>
          </div>
          <div class="preview-output manifest-readiness">
            <div class="preview-status" data-manifest-ready>
              <span class="mini-shield">✓</span>
              <div>
                <strong>Ready to create the GitHub App</strong>
                <p>Submit only after the Worker URL, OAuth callback, webhook endpoint, and Turnstile site are ready.</p>
              </div>
            </div>
            <section class="preview-card">
              <h2>After GitHub redirects back</h2>
              <dl>
                <div><dt>Exchange code</dt><dd><code>POST /app-manifests/{code}/conversions</code></dd></div>
                <div><dt>Store secrets</dt><dd>App ID, private key, webhook secret, client ID, and client secret.</dd></div>
                <div><dt>Then install</dt><dd>Run diagnostics before enabling branch protection.</dd></div>
              </dl>
            </section>
            <section class="preview-card">
              <h2>Production checklist</h2>
              <ul class="diagnostic-list">
                <li data-level="info"><strong>Cloudflare Worker</strong><span>Must be deployed behind the final public domain.</span></li>
                <li data-level="info"><strong>Turnstile</strong><span>Use production site and secret keys before public traffic.</span></li>
                <li data-level="info"><strong>D1 database</strong><span>Run migrations against the production database.</span></li>
              </ul>
            </section>
          </div>
        </div>
      </section>
    </main>
    ${githubAppManifestScript()}`,
    {
      title: "GitHub App manifest",
      description:
        "Generate the pr-captcha GitHub App manifest, webhook URL, OAuth callback URL, and required permissions.",
      canonicalUrl: baseUrl ? `${baseUrl}/github-app-manifest` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderGitHubAppManifestCallbackPage(input: {
  baseUrl?: string;
  code?: string | undefined;
  state?: string | undefined;
}): string {
  const code = input.code ?? "";
  const command = githubAppManifestConversionShell(code);

  return layout(
    "GitHub App manifest callback",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/demo">Demo</a>
        <a href="/queue-pressure">Queue</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card">Proof</a>
        <a href="/setup-wizard">Wizard</a>
        <a href="/diagnostics">Diagnostics</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/github-app-manifest">Back to manifest</a>
    </header>
    <main id="main" class="preview-page manifest-page">
      <section class="preview-heading manifest-heading">
        <div>
          <h1>Finish the manifest handoff</h1>
          <p>GitHub returned a temporary manifest code. Exchange it from an operator shell, then store the generated app ID, private key, webhook secret, client ID, and client secret as Worker secrets.</p>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>One-hour code</span>
          <span><span class="mini-shield">✓</span>Operator shell</span>
          <span><span class="mini-shield">✓</span>No key pasted here</span>
        </div>
      </section>
      <section class="manifest-callback-shell">
        <div class="workflow-panel">
          <div class="panel-top">
            <strong>Conversion script</strong>
            <span>${code ? "code received" : "missing code"}</span>
          </div>
          <pre><code data-manifest-conversion-script>${escapeHtml(command)}</code></pre>
          <div class="preview-actions">
            <button class="button primary" type="button" data-copy-manifest-conversion>Copy operator script</button>
            <a class="button light" href="/setup-wizard">Open setup wizard</a>
            <a class="button light" href="/diagnostics">Run diagnostics</a>
          </div>
        </div>
        <div class="preview-output">
          <div class="preview-status" data-state="${code ? "ready" : "error"}">
            <span class="mini-shield">${code ? "✓" : "!"}</span>
            <div>
              <strong>${code ? "Exchange the code now" : "No manifest code"}</strong>
              <p>${code ? "GitHub manifest codes expire quickly. Store returned secrets in Cloudflare before installing repositories." : "Return to the manifest builder and submit the generated form again."}</p>
            </div>
          </div>
          <section class="preview-card">
            <h2>Callback details</h2>
            <dl>
              <div><dt>Code</dt><dd>${escapeHtml(code || "missing")}</dd></div>
              <div><dt>State</dt><dd>${escapeHtml(input.state || "missing")}</dd></div>
              <div><dt>Next page</dt><dd><a href="/setup-wizard">Generate repository policy</a></dd></div>
            </dl>
          </section>
          <section class="preview-card">
            <h2>Returned secrets</h2>
            <ul class="diagnostic-list manifest-secret-list">
              <li data-level="info"><strong>GITHUB_APP_ID</strong><span>From manifest response field <code>id</code>.</span></li>
              <li data-level="info"><strong>GITHUB_PRIVATE_KEY</strong><span>From manifest response field <code>pem</code>.</span></li>
              <li data-level="info"><strong>GITHUB_WEBHOOK_SECRET</strong><span>From manifest response field <code>webhook_secret</code>.</span></li>
              <li data-level="info"><strong>GITHUB_CLIENT_ID</strong><span>From manifest response field <code>client_id</code>.</span></li>
              <li data-level="info"><strong>GITHUB_CLIENT_SECRET</strong><span>From manifest response field <code>client_secret</code>.</span></li>
            </ul>
          </section>
          <section class="preview-card">
            <h2>Next steps</h2>
            <ul class="diagnostic-list">
              <li data-level="warning"><strong>Deploy Worker</strong><span>Deploy again after the secrets are stored.</span></li>
              <li data-level="info"><strong>Install repository</strong><span>Install the GitHub App on a test repository.</span></li>
              <li data-level="info"><strong>Run diagnostics</strong><span>Confirm repository access before branch protection.</span></li>
            </ul>
          </section>
        </div>
      </section>
    </main>
    ${manifestCallbackScript()}`,
    {
      title: "GitHub App manifest callback",
      description:
        "Finish the pr-captcha GitHub App manifest handoff and exchange the temporary GitHub manifest code.",
      canonicalUrl: input.baseUrl
        ? `${input.baseUrl}/github-app-manifest/callback`
        : undefined,
      imageUrl: input.baseUrl ? `${input.baseUrl}/og.svg` : "/og.svg",
    },
  );
}

function githubAppManifestConversionShell(code: string): string {
  if (!code) {
    return "GitHub did not include a manifest code in this callback URL.";
  }
  return `#!/usr/bin/env bash
set -euo pipefail

CODE=${shellSingleQuote(code)}
TOKEN="\${GITHUB_TOKEN:-\${GH_TOKEN:-}}"
AUTH_HEADER=()
if [ -n "$TOKEN" ]; then
  AUTH_HEADER=(-H "Authorization: Bearer $TOKEN")
fi

if [ ! -f wrangler.toml ] && [ -f apps/worker/wrangler.toml ]; then
  cd apps/worker
fi
test -f wrangler.toml || { echo "Run this from the repo root or apps/worker."; exit 1; }
command -v jq >/dev/null || { echo "jq is required."; exit 1; }

RESPONSE_FILE="$(mktemp)"
curl -fsSL -X POST \\
  -H "Accept: application/vnd.github+json" \\
  -H "X-GitHub-Api-Version: 2026-03-10" \\
  "\${AUTH_HEADER[@]}" \\
  "https://api.github.com/app-manifests/\${CODE}/conversions" > "$RESPONSE_FILE"

jq -r ".id" "$RESPONSE_FILE" | npx wrangler secret put GITHUB_APP_ID
jq -r ".pem" "$RESPONSE_FILE" | npx wrangler secret put GITHUB_PRIVATE_KEY
jq -r ".webhook_secret" "$RESPONSE_FILE" | npx wrangler secret put GITHUB_WEBHOOK_SECRET
jq -r ".client_id" "$RESPONSE_FILE" | npx wrangler secret put GITHUB_CLIENT_ID
jq -r ".client_secret" "$RESPONSE_FILE" | npx wrangler secret put GITHUB_CLIENT_SECRET

npx wrangler secret list
rm -f "$RESPONSE_FILE"`;
}

function shellSingleQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export function renderConfigPreviewPage(baseUrl?: string): string {
  return layout(
    "Preview pr-captcha.yml",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/demo">Demo</a>
        <a href="/queue-pressure">Queue</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card">Proof</a>
        <a href="/setup-wizard">Wizard</a>
        <a href="/diagnostics">Diagnostics</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/setup.md">Open setup</a>
    </header>
    <main id="main" class="preview-page">
      <section class="preview-heading">
        <div>
          <h1>Preview pr-captcha.yml</h1>
          <p>Paste the repository policy before you commit it. See the effective gate, enforced invariants, and branch-protection consequences.</p>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>No PR checkout</span>
          <span><span class="mini-shield">✓</span>SHA-bound</span>
          <span><span class="mini-shield">✓</span>GitHub login enforced</span>
        </div>
      </section>
      <section class="preview-shell" aria-label="pr-captcha configuration preview">
        <div class="preview-editor">
          <div class="panel-top">
            <strong>.github/pr-captcha.yml</strong>
            <span>local preview</span>
          </div>
          <textarea data-config-input spellcheck="false" aria-label="Paste pr-captcha YAML configuration">${escapeHtml(configPreviewExampleYaml())}</textarea>
          <div class="preview-actions">
            <button class="button primary" type="button" data-preview-config>Preview config</button>
            <button class="button light" type="button" data-example-config>Use example</button>
            <a class="button light" href="/config.md">Open config reference</a>
          </div>
        </div>
        <div class="preview-output" aria-live="polite">
          <div class="preview-status" data-preview-status>
            <span class="mini-shield">✓</span>
            <div>
              <strong>Ready for branch protection</strong>
              <p>Preview config to confirm the effective policy.</p>
            </div>
          </div>
          <div class="preview-result-grid">
            <section class="preview-card">
              <h2>Effective policy</h2>
              <dl data-policy-summary>
                <div><dt>Mode</dt><dd>hybrid</dd></div>
                <div><dt>Required check</dt><dd>pr-captcha/human</dd></div>
                <div><dt>Comment</dt><dd>enabled</dd></div>
                <div><dt>Universal gate</dt><dd>rerun after verification</dd></div>
              </dl>
            </section>
            <section class="preview-card">
              <h2>Diagnostics</h2>
              <ul class="diagnostic-list" data-diagnostics>
                <li data-level="info"><strong>Ready</strong><span>Paste YAML and preview before committing.</span></li>
              </ul>
            </section>
            <section class="preview-card wide">
              <h2>Applies to</h2>
              <div class="policy-tags" data-apply-summary>
                <span>first-time contributors</span>
                <span>outside contributors</span>
                <span>fork PRs</span>
                <span>bots</span>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
    ${configPreviewScript()}`,
    {
      title: "Preview pr-captcha.yml",
      description:
        "Preview a pr-captcha repository policy and see the effective human-origin gate before committing it.",
      canonicalUrl: baseUrl ? `${baseUrl}/config-preview` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderSetupWizardPage(baseUrl?: string): string {
  return layout(
    "Choose a policy",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/launch">Install</a>
        <a href="/setup-wizard" aria-current="page">Policy</a>
        <a href="/rehearsal">Test PR</a>
        <a href="/status">Status</a>
        <a href="/trust">Trust</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/config-preview">Preview config</a>
    </header>
    <main id="main" class="preview-page">
      <section class="preview-heading">
        <div>
          <p class="eyebrow">One file, one check</p>
          <h1>Create your repository policy.</h1>
          <p>Pick a repo, choose who verifies, then copy <code>.github/pr-captcha.yml</code>. Start with fork, first-time, outside, and bot PRs.</p>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Scan first</span>
          <span><span class="mini-shield">✓</span>Copy YAML</span>
          <span><span class="mini-shield">✓</span>Test before protecting</span>
        </div>
      </section>
      <section class="wizard-shell" aria-label="pr-captcha setup wizard">
        <form class="wizard-options" data-setup-wizard>
          <div class="panel-top">
            <strong>Guided policy</strong>
            <span>start here</span>
          </div>
          <fieldset class="wizard-group wizard-repository-group">
            <legend>Scan repository</legend>
            <label class="wizard-field wizard-repository-field">
              <span>GitHub repository</span>
              <input name="repository" value="kubernetes/kubernetes" autocomplete="off" data-wizard-repository />
            </label>
            <button class="button primary compact" type="button" data-wizard-scan>Scan public evidence</button>
            <div class="wizard-evidence" data-wizard-evidence data-risk="waiting">
              <div class="wizard-evidence-head">
                <strong data-wizard-recommendation>Scan first, then choose where the required check should apply.</strong>
                <span data-wizard-evidence-status>waiting</span>
              </div>
              <dl>
                <div><dt>Open PRs</dt><dd data-wizard-evidence-open>scan</dd></div>
                <div><dt>Fork pressure</dt><dd data-wizard-evidence-fork>scan</dd></div>
                <div><dt>Unknown authors</dt><dd data-wizard-evidence-unknown>scan</dd></div>
                <div><dt>Bot PRs</dt><dd data-wizard-evidence-bots>scan</dd></div>
                <div><dt>Stale PRs</dt><dd data-wizard-evidence-stale>scan</dd></div>
                <div><dt>Spam labels</dt><dd data-wizard-evidence-spam>scan</dd></div>
              </dl>
            </div>
            <div class="wizard-handoff" aria-label="Repository-aware setup links">
              <a data-wizard-link="evidence" href="/evidence?repo=kubernetes%2Fkubernetes">Evidence</a>
              <a data-wizard-link="pilot" href="/pilot?repo=kubernetes%2Fkubernetes">Pilot</a>
              <a data-wizard-link="diagnostics" href="/diagnostics?owner=kubernetes&repo=kubernetes">Diagnostics</a>
              <a data-wizard-link="launch" href="/launch">Launch</a>
            </div>
          </fieldset>
          <fieldset class="wizard-group">
            <legend>Pick gate mode</legend>
            <label class="wizard-choice"><input type="radio" name="mode" value="hybrid" checked /><span><strong>Recommended default</strong><small>Creates the check, supports fork release, and can gate workflows later.</small></span></label>
            <label class="wizard-choice"><input type="radio" name="mode" value="native_fork" /><span><strong>Release held fork runs</strong><small>Use when GitHub already holds fork workflows.</small></span></label>
            <label class="wizard-choice"><input type="radio" name="mode" value="universal" /><span><strong>Gate heavy workflows</strong><small>Run a tiny job before expensive CI.</small></span></label>
            <label class="wizard-choice"><input type="radio" name="mode" value="required_check" /><span><strong>Check only</strong><small>Use branch protection without workflow release.</small></span></label>
          </fieldset>
          <fieldset class="wizard-group">
            <legend>Choose PR targets</legend>
            <label class="wizard-choice compact"><input type="checkbox" name="all_pull_requests" /><span><strong>Every PR</strong><small>Use after a pilot, not as the first install.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="first_time_contributors" checked /><span><strong>First-time contributors</strong><small>New people without repo history.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="outside_contributors" checked /><span><strong>Outside contributors</strong><small>Not an owner, member, or collaborator.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="fork_prs" checked /><span><strong>Fork PRs</strong><small>Pull requests from forks.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="bots" checked /><span><strong>Bots</strong><small>Bot-authored pull requests.</small></span></label>
          </fieldset>
          <fieldset class="wizard-group">
            <legend>Decide what happens</legend>
            <label class="wizard-choice compact"><input type="checkbox" name="require_pr_author" checked /><span><strong>Require PR author</strong><small>The contributor must solve their own check.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="maintainer_override" /><span><strong>Allow maintainer override</strong><small>Trusted maintainers may verify when needed.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="create_required_check" checked /><span><strong>Create required check</strong><small>Publish pr-captcha/human.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="post_comment" checked /><span><strong>Comment on the PR</strong><small>Contributor gets the verification link.</small></span></label>
            <label class="wizard-choice compact"><input type="checkbox" name="rerun_after_verification" checked /><span><strong>Rerun gated workflow</strong><small>Useful when heavy jobs wait on the check.</small></span></label>
          </fieldset>
          <fieldset class="wizard-group">
            <legend>Skip trusted traffic</legend>
            <label class="wizard-field"><span>Skip authors</span><input name="skip_authors" value="" /></label>
            <label class="wizard-field"><span>Skip labels</span><input name="skip_labels" value="trusted-contributor, no-captcha" /></label>
          </fieldset>
        </form>
        <div class="wizard-output">
          <div class="workflow-panel">
            <div class="panel-top">
              <strong>.github/pr-captcha.yml</strong>
              <span>generated policy</span>
            </div>
            <pre><code data-wizard-yaml>${escapeHtml(configPreviewExampleYaml())}</code></pre>
            <div class="preview-actions">
              <button class="button primary" type="button" data-generate-policy>Generate policy</button>
              <button class="button light" type="button" data-copy-yaml>Copy YAML</button>
              <button class="button light" type="button" data-preview-generated>Preview generated YAML</button>
            </div>
          </div>
          <div class="wizard-install-grid">
            <section class="preview-card wizard-install-card">
              <div class="install-card-head">
                <div>
                  <h2>Branch protection</h2>
                  <p>Use this checklist only after a fork PR rehearsal passes.</p>
                </div>
                <span data-wizard-branch-state>waiting</span>
              </div>
              <ul class="install-checklist" data-wizard-branch-protection>
                <li><strong>Commit policy</strong><span>.github/pr-captcha.yml on the default branch.</span></li>
                <li><strong>Require check</strong><span>pr-captcha/human after the first solved fork PR.</span></li>
                <li><strong>Keep rollback simple</strong><span>Remove one required check if the pilot is noisy.</span></li>
              </ul>
            </section>
            <section class="preview-card wizard-install-card">
              <div class="install-card-head">
                <div>
                  <h2>Workflow guard</h2>
                  <p>Copy this before heavy CI jobs when workflow mode is active.</p>
                </div>
                <button class="button light compact" type="button" data-copy-workflow-guard>Copy workflow</button>
              </div>
              <pre class="status-json install-code"><code data-wizard-workflow>${escapeHtml(setupWizardWorkflowGuardYaml(baseUrl))}</code></pre>
            </section>
            <section class="preview-card wizard-install-card wide">
              <div class="install-card-head">
                <div>
                  <h2>Acceptance proof</h2>
                  <p>Paste this into the pilot issue after the rehearsal is green.</p>
                </div>
                <button class="button light compact" type="button" data-copy-acceptance-proof>Copy proof</button>
              </div>
              <pre class="status-json install-code" data-wizard-acceptance>${escapeHtml(setupWizardAcceptanceProof("kubernetes/kubernetes"))}</pre>
            </section>
          </div>
          <div class="preview-output">
            <div class="preview-status" data-wizard-status>
              <span class="mini-shield">✓</span>
              <div>
                <strong>Ready for branch protection</strong>
                <p>Generate policy to confirm the exact install consequences.</p>
              </div>
            </div>
            <section class="preview-card">
              <h2>Install consequences</h2>
              <dl data-wizard-summary>
                <div><dt>Mode</dt><dd>hybrid</dd></div>
                <div><dt>Required check</dt><dd>pr-captcha/human</dd></div>
                <div><dt>Comment</dt><dd>enabled</dd></div>
                <div><dt>Workflow gate</dt><dd>rerun after verification</dd></div>
              </dl>
            </section>
            <section class="preview-card">
              <h2>Diagnostics</h2>
              <ul class="diagnostic-list" data-wizard-diagnostics>
                <li data-level="info"><strong>Ready</strong><span>Generate policy and preview before committing.</span></li>
              </ul>
            </section>
          </div>
        </div>
      </section>
    </main>
    ${setupWizardScript(baseUrl)}`,
    {
      title: "Setup wizard",
      description:
        "Generate a safe pr-captcha repository policy and preview the effective human-origin gate.",
      canonicalUrl: baseUrl ? `${baseUrl}/setup-wizard` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderRepositoryDiagnosticsPage(baseUrl?: string): string {
  return layout(
    "Repository diagnostics",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/demo">Demo</a>
        <a href="/queue-pressure">Queue</a>
        <a href="/badge-builder">Badge</a>
        <a href="/proof-card">Proof</a>
        <a href="/setup-wizard">Wizard</a>
        <a href="/config-preview">Preview</a>
        <a href="/status">Status</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/setup.md">Open setup</a>
    </header>
    <main id="main" class="preview-page">
      <section class="preview-heading">
        <div>
          <h1>Repository diagnostics</h1>
          <p>Confirm the GitHub App can read a repository, load its policy file, and report the exact pr-captcha gate that will run.</p>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Admin token required</span>
          <span><span class="mini-shield">✓</span>Config normalized</span>
          <span><span class="mini-shield">✓</span>Audit event written</span>
        </div>
      </section>
      <section class="diagnostics-shell" aria-label="pr-captcha repository diagnostics">
        <form class="diagnostics-form" data-diagnostics-form autocomplete="off">
          <div class="panel-top">
            <strong>Repository access</strong>
            <span>admin check</span>
          </div>
          <fieldset class="wizard-group diagnostics-fields">
            <legend>Target repository</legend>
            <label class="wizard-field"><span>Owner</span><input name="owner" placeholder="octo-org" autocomplete="off" /></label>
            <label class="wizard-field"><span>Repository</span><input name="repo" placeholder="awesome-repo" autocomplete="off" /></label>
            <label class="wizard-field"><span>Installation ID</span><input name="installation_id" inputmode="numeric" placeholder="12345678" autocomplete="off" /></label>
            <label class="wizard-field"><span>Optional ref</span><input name="ref" placeholder="main" autocomplete="off" /></label>
          </fieldset>
          <fieldset class="wizard-group diagnostics-fields">
            <legend>Operator access</legend>
            <label class="wizard-field wide"><span>Admin token</span><input name="admin_token" type="password" placeholder="ADMIN_TOKEN" autocomplete="off" /></label>
          </fieldset>
          <div class="diagnostics-actions">
            <button class="button primary" type="submit" data-run-diagnostics>Run diagnostics</button>
          </div>
        </form>
        <div class="diagnostics-output">
          <div class="preview-output" aria-live="polite">
            <div class="preview-status" data-diagnostics-status>
              <span class="mini-shield">✓</span>
              <div>
                <strong>Ready to inspect</strong>
                <p>Run diagnostics after the GitHub App is installed.</p>
              </div>
            </div>
            <section class="preview-card">
              <h2>Repository</h2>
              <dl data-diagnostics-repository>
                <div><dt>Repository</dt><dd>waiting</dd></div>
                <div><dt>Installation</dt><dd>waiting</dd></div>
                <div><dt>Default branch</dt><dd>waiting</dd></div>
                <div><dt>Ref inspected</dt><dd>waiting</dd></div>
              </dl>
            </section>
            <section class="preview-card">
              <h2>Effective policy</h2>
              <dl data-diagnostics-policy>
                <div><dt>Mode</dt><dd>waiting</dd></div>
                <div><dt>Required check</dt><dd>waiting</dd></div>
                <div><dt>Comment</dt><dd>waiting</dd></div>
                <div><dt>Workflow gate</dt><dd>waiting</dd></div>
              </dl>
            </section>
            <section class="preview-card">
              <h2>Diagnostics</h2>
              <ul class="diagnostic-list" data-diagnostics-list>
                <li data-level="info"><strong>Ready</strong><span>Run diagnostics to inspect repository access and policy state.</span></li>
              </ul>
            </section>
            <section class="preview-card">
              <h2>Audit</h2>
              <div class="audit-result" data-diagnostics-audit>
                <strong>diagnostics.pending</strong>
                <span>No audit row has been written yet.</span>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
    ${repositoryDiagnosticsScript()}`,
    {
      title: "Repository diagnostics",
      description:
        "Check a pr-captcha GitHub App installation, repository policy, and effective human-origin gate.",
      canonicalUrl: baseUrl ? `${baseUrl}/diagnostics` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

export function renderStatusPage(baseUrl?: string): string {
  return layout(
    "pr-captcha status",
    `<header class="site-header utility-header">
      <a class="brand" href="/">${brandMark()}<span>pr-captcha</span></a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/launch">Install</a>
        <a href="/setup-wizard">Policy</a>
        <a href="/rehearsal">Test PR</a>
        <a href="/diagnostics">Diagnostics</a>
        <a href="/status" aria-current="page">Status</a>
        <a href="/trust">Trust</a>
        <a href="https://github.com/aryabyte21/pr-captcha">GitHub</a>
      </nav>
      <a class="button dark header-cta" href="/diagnostics">Run diagnostics</a>
    </header>
    <main id="main" class="preview-page">
      <section class="preview-heading">
        <div>
          <p class="eyebrow">Public service health</p>
          <h1>Is the little gate awake?</h1>
          <p>Check the hosted Worker, database binding, and readiness endpoint before you ask a repository to depend on <code>pr-captcha/human</code>.</p>
        </div>
        <div class="preview-guarantees">
          <span><span class="mini-shield">✓</span>Worker awake</span>
          <span><span class="mini-shield">✓</span>D1 connected</span>
          <span><span class="mini-shield">✓</span>No secrets shown</span>
        </div>
      </section>
      <section class="status-shell" aria-label="pr-captcha service status">
        <div class="status-board">
          <div class="panel-top">
            <strong>Public gate checks</strong>
            <span data-status-checked>checking now</span>
          </div>
          <div class="status-list">
            ${statusTile("worker", "Worker heartbeat", "Confirms the public Worker responds.")}
            ${statusTile("ready", "Readiness", "Checks required bindings and configuration.")}
            ${statusTile("database", "D1 database", "Verifies the database binding is queryable.")}
            ${statusTile("config", "Configuration", "Reports required secret names only.")}
          </div>
          <div class="diagnostics-actions">
            <button class="button primary" type="button" data-refresh-status>Refresh status</button>
          </div>
        </div>
        <div class="status-output">
          <div class="preview-output" aria-live="polite">
            <div class="preview-status" data-status-overall>
              <span class="mini-shield">✓</span>
              <div>
                <strong>Checking service</strong>
                <p>Loading public health checks.</p>
              </div>
            </div>
            <section class="preview-card">
              <h2>Readiness details</h2>
              <dl data-status-details>
                <div><dt>Worker</dt><dd>checking</dd></div>
                <div><dt>Readiness</dt><dd>checking</dd></div>
                <div><dt>D1 database</dt><dd>checking</dd></div>
                <div><dt>Configuration</dt><dd>checking</dd></div>
              </dl>
            </section>
            <section class="preview-card">
              <h2>Next action</h2>
              <ul class="diagnostic-list" data-status-actions>
                <li data-level="info"><strong>Checking</strong><span>Waiting for health responses.</span></li>
              </ul>
            </section>
            <section class="preview-card">
              <h2>Response payload</h2>
              <pre class="status-json" data-status-json>{}</pre>
            </section>
          </div>
        </div>
      </section>
    </main>
    ${statusPageScript()}`,
    {
      title: "Gate status",
      description:
        "Public pr-captcha status page for Worker heartbeat, readiness, D1, and required configuration checks.",
      canonicalUrl: baseUrl ? `${baseUrl}/status` : undefined,
      imageUrl: baseUrl ? `${baseUrl}/og.svg` : "/og.svg",
    },
  );
}

function liveCountScript(): string {
  return `<script>
    (function () {
      var root = document.querySelector("[data-pr-counts]");
      if (!root) return;
      var status = document.querySelector("[data-pr-count-status]");
      var formatter = new Intl.NumberFormat("en-US");
      fetch("/api/public/pr-counts", { headers: { Accept: "application/json" } })
        .then(function (response) {
          if (!response.ok) throw new Error("count fetch failed");
          return response.json();
        })
        .then(function (payload) {
          var liveCount = 0;
          payload.repos.forEach(function (item) {
            if (item.live) liveCount += 1;
            var card = root.querySelector('[data-pr-count-repo="' + item.repo + '"]');
            if (!card) return;
            var value = card.querySelector("[data-pr-count]");
            var source = card.querySelector("[data-pr-count-source]");
            if (value) value.textContent = formatter.format(item.open_prs);
            if (source) source.textContent = item.live ? "live from GitHub" : "fallback snapshot";
          });
          if (status && payload.as_of) {
            var date = new Date(payload.as_of);
            status.textContent =
              liveCount === payload.repos.length
                ? "Live open-PR counts from GitHub"
                : liveCount > 0
                  ? "Mixed live and snapshot PR counts"
                  : "Open-PR count snapshots";
            status.setAttribute("title", "Checked " + date.toLocaleString());
          }
        })
        .catch(function () {
          if (status) status.textContent = "Open-PR count snapshots";
        });
    })();
  </script>`;
}

function copyWorkflowScript(): string {
  return `<script>
    (function () {
      var button = document.querySelector("[data-copy-workflow]");
      var source = document.querySelector("[data-workflow-source]");
      if (!button || !source || !navigator.clipboard) return;
      var defaultLabel = button.textContent || "Copy workflow gate";
      var reset = function () {
        button.textContent = defaultLabel;
        button.removeAttribute("data-copied");
      };
      button.addEventListener("click", function () {
        navigator.clipboard.writeText(source.textContent || "").then(function () {
          button.textContent = "Copied";
          button.setAttribute("data-copied", "true");
          window.setTimeout(reset, 1800);
        }).catch(function () {
          button.textContent = "Copy failed";
          window.setTimeout(reset, 1800);
        });
      });
    })();
  </script>`;
}

function homeMotionScript(): string {
  return `<script>
    (function () {
      var targets = Array.prototype.slice.call(document.querySelectorAll(".motion-reveal, .queue-stat, .proof-card"));
      if (!targets.length) return;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !("IntersectionObserver" in window)) {
        targets.forEach(function (target) {
          target.classList.add("is-visible");
        });
        return;
      }
      document.documentElement.classList.add("motion-ready");
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
      targets.forEach(function (target, index) {
        target.style.setProperty("--reveal-delay", String(Math.min(index * 45, 240)) + "ms");
        observer.observe(target);
      });
    })();
  </script>`;
}

function demoPageScript(): string {
  const steps = [
    {
      label: "PR opened",
      title: "AI-slop PR waiting",
      body: "A PR opened under an enabled target. CI is held until the exact head SHA has a human-origin signal.",
      status: "warning",
      icon: "!",
      ciState: "held",
      ciLabel: "Held",
      ciBody: "Fork workflow is held before the held workflow starts.",
      checkState: "waiting",
      checkLabel: "Waiting",
      checkBody: "Waiting for the contributor to verify this exact SHA.",
      comment:
        "Open the verification link to prove a GitHub-authenticated human is present for commit 8f31c9a.",
      audit: [
        [
          "warning",
          "gate.pending",
          "Waiting on human-origin proof for 8f31c9a.",
        ],
      ],
    },
    {
      label: "Gate created",
      title: "Gate bound to 8f31c9a",
      body: "pr-captcha created the check run and comment. The verification URL only applies to this repository, PR number, author, and head SHA.",
      status: "warning",
      icon: "!",
      ciState: "held",
      ciLabel: "Held",
      ciBody: "No untrusted patch has reached a runner.",
      checkState: "waiting",
      checkLabel: "Waiting",
      checkBody: "Required check is present but not satisfied.",
      comment:
        "Verification link is live for drive-by-user and commit 8f31c9a.",
      audit: [
        [
          "info",
          "gate.created",
          "Created SHA-bound gate for open-source/app#184.",
        ],
        [
          "info",
          "comment.upserted",
          "One persistent PR comment points to the gate.",
        ],
        [
          "warning",
          "check.waiting",
          "pr-captcha/human is waiting on verification.",
        ],
      ],
    },
    {
      label: "Human verified",
      title: "GitHub user verified",
      body: "The contributor completed GitHub OAuth and Turnstile. The solver identity matches the configured policy for this PR.",
      status: "ready",
      icon: "✓",
      ciState: "held",
      ciLabel: "Held",
      ciBody: "CI remains held until the signal is published.",
      checkState: "verified",
      checkLabel: "Verified",
      checkBody: "Human-origin proof exists for 8f31c9a.",
      comment:
        "Verification succeeded for drive-by-user. Publishing the human-origin signal now.",
      audit: [
        [
          "info",
          "gate.created",
          "Created SHA-bound gate for open-source/app#184.",
        ],
        [
          "success",
          "gate.solved",
          "GitHub login and Turnstile matched policy.",
        ],
        ["success", "verification.stored", "Stored proof for commit 8f31c9a."],
      ],
    },
    {
      label: "Check passed",
      title: "Exact SHA approved",
      body: "The check is green for 8f31c9a. A new commit would require a new verification before it can inherit trust.",
      status: "ready",
      icon: "✓",
      ciState: "ready",
      ciLabel: "Released",
      ciBody: "Held fork workflow can now run under GitHub policy.",
      checkState: "ready",
      checkLabel: "Passed",
      checkBody: "pr-captcha/human passed for the exact head SHA.",
      comment:
        "The PR has a human-origin signal for 8f31c9a. New commits must verify again.",
      audit: [
        [
          "info",
          "gate.created",
          "Created SHA-bound gate for open-source/app#184.",
        ],
        [
          "success",
          "gate.solved",
          "GitHub login and Turnstile matched policy.",
        ],
        ["success", "check.published", "pr-captcha/human passed for 8f31c9a."],
        [
          "success",
          "workflow.released",
          "Matching held workflow runs were approved.",
        ],
      ],
    },
  ];
  return `<script>
    (function () {
      var steps = ${JSON.stringify(steps)};
      var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-demo-step]"));
      var replay = document.querySelector("[data-demo-replay]");
      var verify = document.querySelector("[data-demo-verify]");
      var copy = document.querySelector("[data-copy-check]");
      var copySource = document.querySelector("[data-copy-check-source]");
      var policyCopies = Array.prototype.slice.call(document.querySelectorAll("[data-copy-demo-policy]"));
      var policySource = document.querySelector("[data-demo-policy]");
      var stageLabel = document.querySelector("[data-demo-stage-label]");
      var status = document.querySelector("[data-demo-status]");
      var statusIcon = document.querySelector("[data-demo-status-icon]");
      var title = document.querySelector("[data-demo-title]");
      var body = document.querySelector("[data-demo-body]");
      var ci = document.querySelector("[data-demo-ci]");
      var ciLabel = document.querySelector("[data-demo-ci-label]");
      var ciBody = document.querySelector("[data-demo-ci-body]");
      var check = document.querySelector("[data-demo-human-check]");
      var checkLabel = document.querySelector("[data-demo-check-label]");
      var checkBody = document.querySelector("[data-demo-check-body]");
      var commentBody = document.querySelector("[data-demo-comment-body]");
      var audit = document.querySelector("[data-demo-audit]");
      var active = 0;
      var timer = null;
      var replayLabel = replay ? replay.textContent || "Run gate simulation" : "Run gate simulation";
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function renderAudit(items) {
        if (!audit) return;
        audit.innerHTML = items.map(function (item) {
          return '<div data-level="' + escapeHtml(item[0]) + '"><strong>' + escapeHtml(item[1]) + "</strong><span>" + escapeHtml(item[2]) + "</span></div>";
        }).join("");
      }
      function setText(node, value) {
        if (node) node.textContent = value;
      }
      function setStep(index) {
        active = Math.max(0, Math.min(steps.length - 1, index));
        var step = steps[active];
        buttons.forEach(function (button) {
          var isActive = button.getAttribute("data-demo-step") === String(active);
          if (isActive) {
            button.setAttribute("data-active", "true");
            button.setAttribute("aria-pressed", "true");
          } else {
            button.removeAttribute("data-active");
            button.setAttribute("aria-pressed", "false");
          }
        });
        if (status) status.setAttribute("data-state", step.status);
        if (ci) ci.setAttribute("data-state", step.ciState);
        if (check) check.setAttribute("data-state", step.checkState);
        setText(stageLabel, step.label);
        setText(statusIcon, step.icon);
        setText(title, step.title);
        setText(body, step.body);
        setText(ciLabel, step.ciLabel);
        setText(ciBody, step.ciBody);
        setText(checkLabel, step.checkLabel);
        setText(checkBody, step.checkBody);
        setText(commentBody, step.comment);
        renderAudit(step.audit);
      }
      function replaySteps() {
        if (timer) window.clearInterval(timer);
        setStep(0);
        if (replay) replay.textContent = "Playing";
        timer = window.setInterval(function () {
          if (active >= steps.length - 1) {
            window.clearInterval(timer);
            timer = null;
            if (replay) replay.textContent = replayLabel;
            return;
          }
          setStep(active + 1);
          if (active >= steps.length - 1) {
            window.clearInterval(timer);
            timer = null;
            if (replay) replay.textContent = replayLabel;
          }
        }, 1100);
      }
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          if (timer) {
            window.clearInterval(timer);
            timer = null;
            if (replay) replay.textContent = replayLabel;
          }
          setStep(Number(button.getAttribute("data-demo-step") || "0"));
        });
      });
      if (replay) replay.addEventListener("click", replaySteps);
      if (verify) verify.addEventListener("click", function () {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
          if (replay) replay.textContent = replayLabel;
        }
        setStep(2);
      });
      if (copy && copySource) {
        copy.addEventListener("click", function () {
          var value = copySource.textContent || "pr-captcha/human";
          var finish = function (label) {
            copy.textContent = label;
            window.setTimeout(function () {
              copy.textContent = "Copy";
            }, 1500);
          };
          if (navigator.clipboard) {
            navigator.clipboard.writeText(value).then(function () {
              finish("Copied");
            }).catch(function () {
              finish("Copy failed");
            });
          } else {
            finish("Copy unavailable");
          }
        });
      }
      if (policySource) {
        policyCopies.forEach(function (button) {
          button.addEventListener("click", function () {
            var original = button.textContent || "Copy install config";
            var value = policySource.textContent || "";
            var finish = function (label) {
              button.textContent = label;
              window.setTimeout(function () {
                button.textContent = original;
              }, 1500);
            };
            if (navigator.clipboard) {
              navigator.clipboard.writeText(value).then(function () {
                finish("Copied");
              }).catch(function () {
                finish("Copy failed");
              });
            } else {
              finish("Copy unavailable");
            }
          });
        });
      }
      setStep(0);
    })();
  </script>`;
}

function queuePressureScript(): string {
  const presets = {
    oss: {
      label: "busy OSS",
      open_prs: 184,
      untrusted_percent: 35,
      triage_minutes: 6,
      ci_minutes: 2,
    },
    small: {
      label: "small project",
      open_prs: 28,
      untrusted_percent: 25,
      triage_minutes: 8,
      ci_minutes: 1,
    },
    private: {
      label: "private team",
      open_prs: 75,
      untrusted_percent: 12,
      triage_minutes: 5,
      ci_minutes: 3,
    },
  };
  return `<script>
    (function () {
      var presets = ${JSON.stringify(presets)};
      var form = document.querySelector("[data-queue-form]");
      var profile = document.querySelector("[data-queue-profile]");
      var attention = document.querySelector("[data-queue-attention]");
      var attentionDetail = document.querySelector("[data-queue-attention-detail]");
      var ciMinutes = document.querySelector("[data-queue-ci-minutes]");
      var ciDetail = document.querySelector("[data-queue-ci-detail]");
      var cost = document.querySelector("[data-queue-cost]");
      var costDetail = document.querySelector("[data-queue-cost-detail]");
      var mode = document.querySelector("[data-queue-mode]");
      var reason = document.querySelector("[data-queue-reason]");
      var install = document.querySelector("[data-queue-install]");
      var recommendation = document.querySelector("[data-queue-recommendation-state]");
      var summary = document.querySelector("[data-queue-summary]");
      var summaryStatus = document.querySelector("[data-queue-summary-status]");
      var copy = document.querySelector("[data-copy-queue-summary]");
      if (!form || !attention || !attentionDetail || !ciMinutes || !ciDetail || !cost || !costDetail || !mode || !reason || !install || !summary) return;

      function number(name) {
        var input = form.querySelector('[name="' + name + '"]');
        var value = input ? Number(input.value) : 0;
        return Number.isFinite(value) && value >= 0 ? value : 0;
      }
      function setText(node, value) {
        if (node) node.textContent = value;
      }
      function formatHours(minutes) {
        if (minutes < 60) return Math.round(minutes) + "m";
        return (minutes / 60).toFixed(minutes >= 600 ? 0 : 1) + "h";
      }
      function formatNumber(value) {
        return Math.round(value).toLocaleString("en-US");
      }
      function pickRecommendation(untrusted, heldJobs) {
        if (untrusted >= 40 || heldJobs >= 80) {
          return {
            state: "warning",
            mode: "Use hybrid mode first",
            reason: "Use a PR intake check, keep native fork release available, and add the workflow gate only around heavy jobs.",
            install: "Demo, setup wizard, status, diagnostics."
          };
        }
        if (heldJobs >= 30) {
          return {
            state: "warning",
            mode: "Gate heavy workflows",
            reason: "Start with the workflow gate for heavy jobs, then add the required check when the PR signal should affect branch protection.",
            install: "Demo, setup wizard, workflow gate example."
          };
        }
        if (untrusted >= 10) {
          return {
            state: "ready",
            mode: "Start with PR intake",
            reason: "Create pr-captcha/human as a visible signal before triage and require it only where it earns its keep.",
            install: "Demo, setup wizard, config preview."
          };
        }
        return {
          state: "ready",
          mode: "Use a lightweight required check",
          reason: "Keep the gate narrow. Start with the check signal and skip trusted authors or labels.",
          install: "Setup wizard, config preview."
        };
      }
      function render() {
        var openPrs = number("open_prs");
        var percent = Math.min(100, number("untrusted_percent"));
        var triage = number("triage_minutes");
        var ci = number("ci_minutes");
        var untrusted = Math.round(openPrs * percent / 100);
        var attentionMinutes = untrusted * triage;
        var heldJobs = untrusted * ci;
        var recommendationValue = pickRecommendation(untrusted, heldJobs);
        setText(attention, formatHours(attentionMinutes));
        setText(attentionDetail, formatNumber(untrusted) + " untrusted PRs x " + formatNumber(triage) + " min");
        setText(ciMinutes, formatNumber(heldJobs));
        setText(ciDetail, formatNumber(untrusted) + " untrusted PRs x " + formatNumber(ci) + " jobs");
        setText(cost, "free");
        setText(costDetail, "Hosted Worker first");
        setText(mode, recommendationValue.mode);
        setText(reason, recommendationValue.reason);
        setText(install, recommendationValue.install);
        if (recommendation) recommendation.setAttribute("data-queue-recommendation-state", recommendationValue.state);
        summary.textContent =
          "Queue pressure: " +
          formatNumber(untrusted) +
          " untrusted PRs/week, " +
          formatHours(attentionMinutes) +
          " maintainer attention, " +
          formatNumber(heldJobs) +
          " heavy jobs held. Recommended pr-captcha path: " +
          recommendationValue.mode +
          ".";
      }
      Array.prototype.slice.call(document.querySelectorAll("[data-queue-preset]")).forEach(function (button) {
        button.addEventListener("click", function () {
          var preset = presets[button.getAttribute("data-queue-preset") || "oss"] || presets.oss;
          Object.keys(preset).forEach(function (key) {
            var input = form.querySelector('[name="' + key + '"]');
            if (input) input.value = preset[key];
          });
          if (profile) profile.textContent = preset.label;
          render();
        });
      });
      Array.prototype.slice.call(form.querySelectorAll("input")).forEach(function (input) {
        input.addEventListener("input", render);
      });
      if (copy) {
        copy.addEventListener("click", function () {
          var value = summary.textContent || "";
          var finish = function (label) {
            copy.textContent = label;
            if (summaryStatus) summaryStatus.textContent = label.toLowerCase();
            window.setTimeout(function () {
              copy.textContent = "Copy summary";
              if (summaryStatus) summaryStatus.textContent = "ready";
            }, 1500);
          };
          if (navigator.clipboard) {
            navigator.clipboard.writeText(value).then(function () {
              finish("Copied");
            }).catch(function () {
              finish("Copy failed");
            });
          } else {
            finish("Copy unavailable");
          }
        });
      }
      render();
    })();
  </script>`;
}

function evidenceScannerScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-evidence-form]");
      var input = document.querySelector("[data-evidence-repo]");
      var run = document.querySelector("[data-evidence-run]");
      var copy = document.querySelector("[data-evidence-copy]");
      var status = document.querySelector("[data-evidence-status]");
      var recommendation = document.querySelector("[data-evidence-recommendation]");
      var recommendationTitle = document.querySelector("[data-evidence-recommendation-title]");
      var recommendationCard = document.querySelector("[data-evidence-risk]");
      var repository = document.querySelector("[data-evidence-repository]");
      var generated = document.querySelector("[data-evidence-generated]");
      var quality = document.querySelector("[data-evidence-quality]");
      var sample = document.querySelector("[data-evidence-sample]");
      var list = document.querySelector("[data-evidence-prs]");
      var empty = document.querySelector("[data-evidence-empty]");
      var summary = document.querySelector("[data-evidence-summary]");
      var reportStatus = document.querySelector("[data-evidence-report-status]");
      var link = document.querySelector("[data-evidence-link]");
      var copyLink = document.querySelector("[data-evidence-copy-link]");
      var brief = document.querySelector("[data-evidence-brief]");
      var briefStatus = document.querySelector("[data-evidence-brief-status]");
      var copyBrief = document.querySelector("[data-evidence-copy-brief]");
      var latestReport = "";
      var latestBrief = "";
      if (!form || !input || !list || !summary) return;

      function setText(node, value) {
        if (node) node.textContent = value;
      }
      function fallbackCopy(value) {
        var textarea = document.createElement("textarea");
        var copied = false;
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          copied = document.execCommand("copy");
        } finally {
          document.body.removeChild(textarea);
        }
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value).catch(function () {
            return fallbackCopy(value);
          });
        }
        return fallbackCopy(value);
      }
      function formatNumber(value) {
        return typeof value === "number" ? value.toLocaleString("en-US") : "limited";
      }
      function metric(id, value, detail) {
        setText(document.querySelector("[data-evidence-" + id + "]"), value);
        setText(document.querySelector("[data-evidence-" + id + "-detail]"), detail);
      }
      function repoValue() {
        return String(input.value || "").trim();
      }
      function reportUrl(repo) {
        var url = new URL(window.location.href);
        url.pathname = "/evidence";
        url.search = "";
        url.searchParams.set("repo", repo);
        return url.toString();
      }
      function updateReportUrl(repo, replaceHistory) {
        var url = reportUrl(repo);
        if (link) link.value = url;
        if (replaceHistory && window.history && window.history.replaceState) {
          var parsed = new URL(url);
          window.history.replaceState({}, "", parsed.pathname + parsed.search);
        }
        return url;
      }
      function statusText(value) {
        setText(status, value);
        if (run) run.textContent = value === "scanning" ? "Scanning" : "Run live scan";
      }
      function setPreset(repo) {
        Array.prototype.slice.call(document.querySelectorAll("[data-evidence-preset]")).forEach(function (button) {
          var active = button.getAttribute("data-evidence-preset") === repo;
          if (active) {
            button.setAttribute("data-active", "true");
            button.setAttribute("aria-pressed", "true");
          } else {
            button.removeAttribute("data-active");
            button.setAttribute("aria-pressed", "false");
          }
        });
      }
      function badge(text, tone) {
        var span = document.createElement("span");
        span.className = "evidence-badge";
        span.setAttribute("data-tone", tone);
        span.textContent = text;
        return span;
      }
      function renderPulls(pulls) {
        list.textContent = "";
        if (empty) empty.hidden = pulls.length > 0;
        pulls.slice(0, 8).forEach(function (pull) {
          var item = document.createElement("li");
          item.className = "evidence-pr-row";
          var title = document.createElement("a");
          title.href = pull.url;
          title.target = "_blank";
          title.rel = "noreferrer";
          title.textContent = "#" + pull.number + " " + pull.title;
          var meta = document.createElement("div");
          meta.className = "evidence-pr-meta";
          meta.appendChild(badge(pull.author_association || "NONE", pull.author_association === "MEMBER" || pull.author_association === "OWNER" || pull.author_association === "COLLABORATOR" ? "ready" : "warning"));
          if (pull.is_fork) meta.appendChild(badge("fork", "warning"));
          if (pull.is_bot) meta.appendChild(badge("bot", "muted"));
          if (pull.age_days >= 14) meta.appendChild(badge(String(pull.age_days) + "d old", "danger"));
          if (Array.isArray(pull.labels)) {
            pull.labels.slice(0, 2).forEach(function (label) {
              meta.appendChild(badge(label, "muted"));
            });
          }
          var author = document.createElement("span");
          author.className = "evidence-author";
          author.textContent = pull.author || "unknown";
          item.appendChild(title);
          item.appendChild(author);
          item.appendChild(meta);
          list.appendChild(item);
        });
      }
      function reportText(data, url) {
        var labels = (data.spam_label_matches || 0) + (data.invalid_label_matches || 0);
        return [
          "pr-captcha repo evidence",
          "Repository: " + data.repository,
          "Report: " + url,
          "Open PRs: " + formatNumber(data.open_pull_requests),
          "Recent sample: " + formatNumber(data.sample_size) + " PRs",
          "Fork PRs in sample: " + formatNumber(data.fork_pull_requests),
          "Unknown authors in sample: " + formatNumber(data.unknown_authors),
          "Stale PRs in sample: " + formatNumber(data.stale_pull_requests),
          "Spam or invalid label matches: " + formatNumber(labels),
          "Risk: " + data.risk_level,
          "Recommendation: " + data.recommendation
        ].join("\\n");
      }
      function appLink(path, repo) {
        var url = new URL(path, window.location.origin);
        if (repo) url.searchParams.set("repo", repo);
        return url.toString();
      }
      function policyText(data) {
        if (data.risk_level === "high") {
          return "Require pr-captcha/human on fork PRs and outside contributors before maintainer review starts.";
        }
        if (data.risk_level === "medium") {
          return "Gate fork PRs and first-time contributors while trusted maintainers keep the fast path.";
        }
        return "Start in advisory mode, collect proof, then require the check when queue pressure rises.";
      }
      function sampleLines(data) {
        var pulls = Array.isArray(data.pulls) ? data.pulls.slice(0, 4) : [];
        if (!pulls.length) return ["- No recent PR sample was available from GitHub."];
        return pulls.map(function (pull) {
          var signals = [];
          if (pull.is_fork) signals.push("fork");
          if (pull.author_association) signals.push(pull.author_association);
          if (pull.is_bot) signals.push("bot");
          if (pull.age_days >= 14) signals.push(String(pull.age_days) + "d old");
          if (Array.isArray(pull.labels) && pull.labels.length) {
            signals = signals.concat(pull.labels.slice(0, 2));
          }
          return "- #" + pull.number + " " + pull.title + " by " + (pull.author || "unknown") + " [" + (signals.join(", ") || "no extra signals") + "]";
        });
      }
      function briefText(data, url) {
        var labels = (data.spam_label_matches || 0) + (data.invalid_label_matches || 0);
        return [
          "## Add pr-captcha before this PR queue burns CI",
          "",
          "This repository has visible PR triage pressure that a lightweight human gate can absorb before maintainers and CI pick it up.",
          "",
          "- Repository: " + data.repository,
          "- Risk: " + data.risk_level,
          "- Open PRs: " + formatNumber(data.open_pull_requests),
          "- Recent sample: " + formatNumber(data.sample_size) + " PRs",
          "- Fork PRs: " + formatNumber(data.fork_pull_requests),
          "- Unknown authors: " + formatNumber(data.unknown_authors),
          "- Bot PRs: " + formatNumber(data.bot_pull_requests),
          "- Stale PRs: " + formatNumber(data.stale_pull_requests),
          "- Spam or invalid label matches: " + formatNumber(labels),
          "",
          "Recommended policy",
          policyText(data),
          "",
          "Evidence sample",
          sampleLines(data).join("\\n"),
          "",
          "Next steps",
          "1. Review the live report: " + url,
          "2. Share the scorecard: " + appLink("/scorecard-builder", data.repository),
          "3. Plan a 7-day pilot: " + appLink("/pilot", data.repository),
          "4. Generate the policy: " + appLink("/setup-wizard", data.repository),
          "5. Test the gate flow: " + appLink("/demo"),
          "6. Copy the launch packet: " + appLink("/launch")
        ].join("\\n");
      }
      function renderEvidence(data) {
        var labels = (data.spam_label_matches || 0) + (data.invalid_label_matches || 0);
        var url = updateReportUrl(data.repository, true);
        input.value = data.repository;
        setPreset(data.repository);
        setText(repository, data.repository);
        setText(generated, new Date(data.generated_at).toLocaleString());
        setText(quality, data.partial ? "partial" : "live");
        setText(sample, formatNumber(data.sample_size) + " recent PRs");
        setText(recommendationTitle, data.risk_level === "high" ? "Recommended gate: required" : data.risk_level === "medium" ? "Recommended gate: hybrid" : "Recommended gate: audit first");
        setText(recommendation, data.recommendation);
        if (recommendationCard) recommendationCard.setAttribute("data-evidence-risk", data.risk_level);
        metric("open", formatNumber(data.open_pull_requests), data.live ? "Live GitHub count" : "GitHub count unavailable");
        metric("fork", formatNumber(data.fork_pull_requests), "Recent sample from forks");
        metric("unknown", formatNumber(data.unknown_authors), "Outside trusted associations");
        metric("stale", formatNumber(data.stale_pull_requests), "Open for at least 14 days");
        metric("labels", data.spam_label_matches === null && data.invalid_label_matches === null ? "limited" : formatNumber(labels), "Spam plus invalid label matches");
        metric("bots", formatNumber(data.bot_pull_requests), "Bot accounts in sample");
        renderPulls(Array.isArray(data.pulls) ? data.pulls : []);
        latestReport = reportText(data, url);
        latestBrief = briefText(data, url);
        summary.textContent = latestReport;
        if (brief) brief.textContent = latestBrief;
        setText(reportStatus, data.partial ? "partial" : "ready");
        setText(briefStatus, data.partial ? "partial" : "ready");
      }
      function renderError(message) {
        metric("open", "failed", "GitHub evidence unavailable");
        metric("fork", "failed", "Try another repository");
        metric("unknown", "failed", "Try again later");
        metric("stale", "failed", "No sample loaded");
        metric("labels", "failed", "Search unavailable");
        metric("bots", "failed", "No sample loaded");
        setText(recommendationTitle, "Scan failed");
        setText(recommendation, message);
        setText(quality, "failed");
        setText(sample, "no sample");
        setText(reportStatus, "failed");
        if (empty) empty.hidden = false;
        list.textContent = "";
        latestReport = "pr-captcha repo evidence\\nReport: " + updateReportUrl(repoValue() || "godotengine/godot", false) + "\\nScan failed: " + message;
        latestBrief = "## pr-captcha evidence scan failed\\n\\n- Report: " + updateReportUrl(repoValue() || "godotengine/godot", false) + "\\n- Error: " + message + "\\n\\nRetry the scan before asking maintainers to adopt a required check.";
        summary.textContent = latestReport;
        if (brief) brief.textContent = latestBrief;
        setText(briefStatus, "failed");
      }
      async function scan() {
        var repo = repoValue();
        if (!repo) {
          renderError("Enter a GitHub repository.");
          return;
        }
        statusText("scanning");
        if (run) run.disabled = true;
        try {
          var response = await fetch("/api/public/repo-evidence?repo=" + encodeURIComponent(repo), { headers: { Accept: "application/json" } });
          var data = await response.json();
          if (!response.ok) {
            throw new Error(data && data.error ? data.error : "Scan failed");
          }
          renderEvidence(data);
          statusText(data.partial ? "partial" : "ready");
        } catch (error) {
          renderError(error && error.message ? error.message : "Scan failed");
          statusText("failed");
        } finally {
          if (run) run.disabled = false;
        }
      }
      Array.prototype.slice.call(document.querySelectorAll("[data-evidence-preset]")).forEach(function (button) {
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", function () {
          input.value = button.getAttribute("data-evidence-preset") || "godotengine/godot";
          scan();
        });
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        scan();
      });
      if (run) run.addEventListener("click", scan);
      if (copy) {
        copy.addEventListener("click", function () {
          var value = latestReport || summary.textContent || "";
          var finish = function (label) {
            copy.textContent = label;
            window.setTimeout(function () {
              copy.textContent = "Copy report";
            }, 1500);
          };
          copyText(value).then(function () {
            finish("Copied report");
          }).catch(function () {
            finish("Copy failed");
          });
        });
      }
      if (copyLink) {
        copyLink.addEventListener("click", function () {
          var value = link ? link.value : updateReportUrl(repoValue() || "godotengine/godot", false);
          var finish = function (label) {
            copyLink.textContent = label;
            window.setTimeout(function () {
              copyLink.textContent = "Copy link";
            }, 1500);
          };
          copyText(value).then(function () {
            finish("Copied");
          }).catch(function () {
            finish("Copy failed");
          });
        });
      }
      if (copyBrief) {
        copyBrief.addEventListener("click", function () {
          var value = latestBrief || (brief ? brief.textContent : "") || "";
          var finish = function (label) {
            copyBrief.textContent = label;
            window.setTimeout(function () {
              copyBrief.textContent = "Copy maintainer brief";
            }, 1500);
          };
          copyText(value).then(function () {
            finish("Copied brief");
          }).catch(function () {
            finish("Copy failed");
          });
        });
      }
      updateReportUrl(repoValue() || "godotengine/godot", false);
      window.setTimeout(scan, 0);
    })();
  </script>`;
}

function spamRadarScript(): string {
  return `<script>
    (function () {
      var refresh = document.querySelector("[data-radar-refresh]");
      var copy = document.querySelector("[data-radar-copy]");
      var status = document.querySelector("[data-radar-status]");
      var generated = document.querySelector("[data-radar-generated]");
      var repositories = document.querySelector("[data-radar-repositories]");
      var quality = document.querySelector("[data-radar-quality]");
      var sample = document.querySelector("[data-radar-sample]");
      var recommendation = document.querySelector("[data-radar-recommendation]");
      var summary = document.querySelector("[data-radar-summary]");
      var briefStatus = document.querySelector("[data-radar-brief-status]");
      var table = document.querySelector("[data-radar-table]");
      var list = document.querySelector("[data-radar-list]");
      var empty = document.querySelector("[data-radar-empty]");
      var clusters = document.querySelector("[data-radar-clusters]");
      var clusterStatus = document.querySelector("[data-radar-cluster-status]");
      var clusterEmpty = document.querySelector("[data-radar-cluster-empty]");
      var latestBrief = "";
      var latestData = null;
      var selectedRepository = "";
      if (!list || !summary || !clusters) return;

      function setText(node, value) {
        if (node) node.textContent = value;
      }
      function formatNumber(value) {
        return typeof value === "number" ? value.toLocaleString("en-US") : "limited";
      }
      function total(id, value) {
        setText(document.querySelector('[data-radar-total="' + id + '"]'), formatNumber(value));
      }
      function badge(text, tone) {
        var span = document.createElement("span");
        span.className = "evidence-badge";
        span.setAttribute("data-tone", tone || "muted");
        span.textContent = text;
        return span;
      }
      function signalTone(source) {
        return source === "spam" ? "danger" : source === "invalid" ? "warning" : "muted";
      }
      function sourceLabel(source) {
        return source === "spam" ? "spam" : source === "invalid" ? "invalid" : "stale";
      }
      function repoPath(repository, path) {
        return path + "?repo=" + encodeURIComponent(repository);
      }
      function actionLink(label, href) {
        var anchor = document.createElement("a");
        anchor.href = href;
        anchor.textContent = label;
        return anchor;
      }
      function fallbackCopy(value) {
        var textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (_) {
          copied = false;
        }
        textarea.remove();
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy unavailable"));
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value).catch(function () {
            return fallbackCopy(value);
          });
        }
        return fallbackCopy(value);
      }
      function selectBrief() {
        if (!summary || !window.getSelection) return;
        var range = document.createRange();
        range.selectNodeContents(summary);
        var selection = window.getSelection();
        if (!selection) return;
        selection.removeAllRanges();
        selection.addRange(range);
        summary.focus();
      }
      function renderItems(items) {
        list.textContent = "";
        if (empty) empty.hidden = items.length > 0;
        if (table) table.hidden = items.length === 0;
        items.slice(0, 18).forEach(function (item) {
          var row = document.createElement("li");
          row.className = "radar-row";
          var repository = document.createElement("a");
          repository.className = "radar-repo";
          repository.href = item.url;
          repository.target = "_blank";
          repository.rel = "noreferrer";
          repository.textContent = item.repository + " #" + item.number;
          var title = document.createElement("a");
          title.className = "radar-title";
          title.href = item.url;
          title.target = "_blank";
          title.rel = "noreferrer";
          title.textContent = item.title;
          var author = document.createElement("span");
          author.className = "evidence-author";
          author.textContent = item.author || "unknown";
          var age = document.createElement("span");
          age.className = "radar-age";
          age.textContent = typeof item.age_days === "number" ? String(item.age_days) + "d" : "unknown";
          var meta = document.createElement("div");
          meta.className = "evidence-pr-meta";
          meta.appendChild(badge(sourceLabel(item.source), signalTone(item.source)));
          if (item.author_type === "Bot") meta.appendChild(badge("bot author", "warning"));
          if (typeof item.age_days === "number" && item.age_days >= 30) meta.appendChild(badge("30d open", "danger"));
          if (Array.isArray(item.reasons)) {
            item.reasons.slice(0, 2).forEach(function (reason) {
              meta.appendChild(badge(reason, reason.indexOf("spam") >= 0 ? "danger" : "warning"));
            });
          }
          if (Array.isArray(item.labels)) {
            item.labels.slice(0, 2).forEach(function (label) {
              meta.appendChild(badge(label, "muted"));
            });
          }
          row.appendChild(repository);
          row.appendChild(title);
          row.appendChild(author);
          row.appendChild(age);
          row.appendChild(meta);
          list.appendChild(row);
        });
      }
      function selectedCluster(data) {
        var clusterItems = Array.isArray(data.repository_clusters) ? data.repository_clusters : [];
        if (!clusterItems.length) return null;
        var match = clusterItems.find(function (cluster) {
          return cluster.repository === selectedRepository;
        });
        return match || clusterItems[0];
      }
      function renderClusters(data) {
        var clusterItems = Array.isArray(data.repository_clusters) ? data.repository_clusters : [];
        if (clusterItems.length && !selectedRepository) {
          selectedRepository = clusterItems[0].repository;
        }
        if (clusterItems.length && !clusterItems.some(function (cluster) {
          return cluster.repository === selectedRepository;
        })) {
          selectedRepository = clusterItems[0].repository;
        }
        setText(clusterStatus, clusterItems.length ? String(clusterItems.length) + " repos" : "none");
        if (clusterEmpty) clusterEmpty.hidden = clusterItems.length > 0;
        clusters.textContent = "";
        clusterItems.slice(0, 8).forEach(function (cluster, index) {
          var row = document.createElement("li");
          row.className = "radar-cluster-item";
          var isSelected = cluster.repository === selectedRepository;
          if (isSelected) row.setAttribute("data-selected", "true");
          var button = document.createElement("button");
          button.className = "radar-cluster-button";
          button.type = "button";
          button.setAttribute("aria-pressed", isSelected ? "true" : "false");
          var top = document.createElement("span");
          top.className = "radar-cluster-top";
          var repo = document.createElement("strong");
          repo.textContent = String(index + 1) + ". " + cluster.repository;
          var signal = document.createElement("span");
          signal.className = "radar-cluster-signal";
          signal.setAttribute("data-tone", signalTone(cluster.top_signal));
          signal.textContent = sourceLabel(cluster.top_signal);
          top.appendChild(repo);
          top.appendChild(signal);
          var detail = document.createElement("span");
          detail.className = "radar-cluster-detail";
          detail.textContent = formatNumber(cluster.sample_size) + " sampled PRs";
          var latest = document.createElement("span");
          latest.className = "radar-cluster-latest";
          latest.textContent = "Latest #" + cluster.latest_pr_number + ": " + cluster.latest_pr_title;
          button.appendChild(top);
          button.appendChild(detail);
          button.appendChild(latest);
          button.addEventListener("click", function () {
            selectedRepository = cluster.repository;
            var dataToRender = latestData || data;
            renderClusters(dataToRender);
            latestBrief = briefText(dataToRender);
            summary.textContent = latestBrief;
          });
          var actions = document.createElement("div");
          actions.className = "radar-cluster-actions";
          actions.appendChild(actionLink("Scan", repoPath(cluster.repository, "/evidence")));
          actions.appendChild(actionLink("Pilot", repoPath(cluster.repository, "/pilot")));
          actions.appendChild(actionLink("Proof", repoPath(cluster.repository, "/proof-card")));
          row.appendChild(button);
          row.appendChild(actions);
          clusters.appendChild(row);
        });
      }
      function briefText(data) {
        var cluster = selectedCluster(data);
        var allItems = Array.isArray(data.items) ? data.items : [];
        var selectedItems = cluster ? allItems.filter(function (item) {
          return item.repository === cluster.repository;
        }) : allItems;
        if (!selectedItems.length) selectedItems = allItems;
        var examples = selectedItems.slice(0, 5).map(function (item) {
          return "- " + item.repository + " #" + item.number + ": " + item.title + " (" + item.url + ")";
        });
        var installPath = cluster ? window.location.origin + repoPath(cluster.repository, "/evidence") : window.location.origin + "/evidence";
        var pilotPath = cluster ? window.location.origin + repoPath(cluster.repository, "/pilot") : window.location.origin + "/pilot";
        var proofPath = cluster ? window.location.origin + repoPath(cluster.repository, "/proof-card") : window.location.origin + "/proof-card";
        return [
          "pr-captcha maintainer install packet",
          "Radar: " + window.location.origin + "/radar",
          "Generated: " + new Date(data.generated_at).toLocaleString(),
          "Repository focus: " + (cluster ? cluster.repository : "scan your repository"),
          cluster ? "Top signal: " + sourceLabel(cluster.top_signal) + " across " + formatNumber(cluster.sample_size) + " sampled PRs" : "",
          "Repositories sampled: " + formatNumber(data.repositories),
          "PR examples sampled: " + formatNumber(data.sample_size),
          "Spam label matches: " + formatNumber(data.spam_label_matches),
          "Invalid label matches: " + formatNumber(data.invalid_label_matches),
          "Stale label matches: " + formatNumber(data.stale_label_matches),
          "Recommendation: " + data.recommendation,
          "Install path: " + installPath,
          "Pilot path: " + pilotPath,
          "Proof card: " + proofPath,
          "Fork rehearsal: " + window.location.origin + "/rehearsal",
          "Gate trace: " + window.location.origin + "/gate-trace",
          "Acceptance plan:",
          "- Start hybrid mode for fork PRs from unknown authors.",
          "- Require pr-captcha/human after the fork rehearsal passes.",
          "- Keep trusted maintainers and existing bots on the fast path.",
          "- Promote to required status after 7 days of clean bypass logs.",
          examples.length ? "Live examples:" : "",
          examples.join("\\n"),
          "Next step: run the scan, install the app, then verify the gate trace."
        ].filter(Boolean).join("\\n");
      }
      function renderRadar(data) {
        latestData = data;
        total("spam", data.spam_label_matches);
        total("invalid", data.invalid_label_matches);
        total("stale", data.stale_label_matches);
        setText(generated, new Date(data.generated_at).toLocaleString());
        setText(repositories, formatNumber(data.repositories));
        setText(quality, data.partial ? "partial" : "live");
        setText(sample, formatNumber(data.sample_size) + " public PRs");
        setText(recommendation, data.recommendation);
        setText(briefStatus, data.partial ? "partial" : "ready");
        renderItems(Array.isArray(data.items) ? data.items : []);
        renderClusters(data);
        latestBrief = briefText(data);
        summary.textContent = latestBrief;
      }
      function renderError(message) {
        total("spam", null);
        total("invalid", null);
        total("stale", null);
        setText(generated, "failed");
        setText(repositories, "failed");
        setText(quality, "failed");
        setText(sample, "no sample");
        setText(recommendation, message);
        setText(briefStatus, "failed");
        if (empty) empty.hidden = false;
        if (table) table.hidden = true;
        list.textContent = "";
        clusters.textContent = "";
        if (clusterEmpty) clusterEmpty.hidden = false;
        setText(clusterStatus, "failed");
        latestBrief = "pr-captcha PR spam radar\\nRadar unavailable: " + message;
        summary.textContent = latestBrief;
      }
      async function load() {
        setText(status, "loading");
        if (refresh) {
          refresh.disabled = true;
          refresh.textContent = "Loading";
        }
        try {
          var response = await fetch("/api/public/spam-radar", { headers: { Accept: "application/json" } });
          var data = await response.json();
          if (!response.ok) {
            throw new Error(data && data.error ? data.error : "Radar failed");
          }
          renderRadar(data);
          setText(status, data.partial ? "partial" : "ready");
        } catch (error) {
          renderError(error && error.message ? error.message : "Radar failed");
          setText(status, "failed");
        } finally {
          if (refresh) {
            refresh.disabled = false;
            refresh.textContent = "Load live examples";
          }
        }
      }
      if (refresh) refresh.addEventListener("click", load);
      if (copy) {
        copy.addEventListener("click", function () {
          var value = latestBrief || summary.textContent || "";
          var finish = function (label) {
            copy.textContent = label;
            window.setTimeout(function () {
              copy.textContent = "Copy maintainer brief";
            }, 1500);
          };
          copyText(value).then(function () {
            finish("Copied");
          }).catch(function () {
            selectBrief();
            finish("Brief selected");
          });
        });
      }
      window.setTimeout(load, 0);
    })();
  </script>`;
}

function pilotPlanScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-pilot-form]");
      var repoInput = document.querySelector("[data-pilot-repo]");
      var run = document.querySelector("[data-pilot-run]");
      var copy = document.querySelector("[data-pilot-copy]");
      var status = document.querySelector("[data-pilot-status]");
      var recommendation = document.querySelector("[data-pilot-recommendation]");
      var title = document.querySelector("[data-pilot-title]");
      var card = document.querySelector("[data-pilot-risk]");
      var timeline = document.querySelector("[data-pilot-timeline]");
      var branch = document.querySelector("[data-pilot-branch]");
      var metrics = document.querySelector("[data-pilot-metrics]");
      var rollback = document.querySelector("[data-pilot-rollback]");
      var issue = document.querySelector("[data-pilot-issue]");
      var planStatus = document.querySelector("[data-pilot-plan-status]");
      var issueStatus = document.querySelector("[data-pilot-issue-status]");
      var evidenceLinks = Array.prototype.slice.call(document.querySelectorAll("[data-pilot-evidence-link]"));
      var issueLinks = Array.prototype.slice.call(document.querySelectorAll("[data-pilot-open-issue]"));
      var latestIssue = "";
      if (!form || !repoInput || !timeline || !branch || !metrics || !issue) return;

      function setText(node, value) {
        if (node) node.textContent = value;
      }
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function formatNumber(value) {
        return typeof value === "number" ? value.toLocaleString("en-US") : "limited";
      }
      function fallbackCopy(value) {
        var textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (_) {
          copied = false;
        }
        textarea.remove();
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy unavailable"));
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value).catch(function () {
            return fallbackCopy(value);
          });
        }
        return fallbackCopy(value);
      }
      function repoValue() {
        return String(repoInput.value || "").trim() || "tldraw/tldraw";
      }
      function stanceValue() {
        var input = form.querySelector('[name="stance"]:checked');
        return input ? input.value : "cautious";
      }
      function reportUrl(repo) {
        var url = new URL(window.location.href);
        url.pathname = "/evidence";
        url.search = "";
        url.searchParams.set("repo", repo);
        return url.toString();
      }
      function pilotUrl(repo) {
        var url = new URL(window.location.href);
        url.pathname = "/pilot";
        url.search = "";
        url.searchParams.set("repo", repo);
        return url.toString();
      }
      function appLink(path, repo) {
        var url = new URL(path, window.location.origin);
        if (repo) url.searchParams.set("repo", repo);
        return url.toString();
      }
      function githubIssueUrl(repo, title, body) {
        var parts = String(repo || "").split("/");
        var owner = parts[0] || "owner";
        var name = parts[1] || "repo";
        var url = new URL("https://github.com/" + encodeURIComponent(owner) + "/" + encodeURIComponent(name) + "/issues/new");
        url.searchParams.set("title", title);
        url.searchParams.set("body", body);
        return url.toString();
      }
      function updateLinks(repo, issueBody, failed) {
        var report = reportUrl(repo);
        evidenceLinks.forEach(function (link) {
          link.href = report;
        });
        issueLinks.forEach(function (link) {
          link.href = githubIssueUrl(repo, failed ? "Fix pr-captcha pilot scan" : "Pilot pr-captcha for 7 days", issueBody);
          link.removeAttribute("aria-disabled");
        });
      }
      function setMetric(name, value) {
        setText(document.querySelector("[data-pilot-" + name + "]"), formatNumber(value));
      }
      function listHtml(items) {
        return items.map(function (item) {
          return "<li>" + escapeHtml(item) + "</li>";
        }).join("");
      }
      function timelineHtml(items) {
        return items.map(function (item) {
          return '<li><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.body) + "</span></li>";
        }).join("");
      }
      function labels(data) {
        return (data.spam_label_matches || 0) + (data.invalid_label_matches || 0);
      }
      function requireDay(stance, risk) {
        if (stance === "aggressive" || risk === "high") return "Day 1";
        if (stance === "balanced" || risk === "medium") return "Day 3";
        return "Day 5";
      }
      function pilotName(stance, risk) {
        if (risk === "high") return "High-signal required-check pilot";
        if (stance === "aggressive") return "Fast required-check pilot";
        if (stance === "balanced") return "Balanced fork-and-outside pilot";
        return "Cautious advisory-first pilot";
      }
      function recommendationText(data, stance) {
        var day = requireDay(stance, data.risk_level);
        if (data.risk_level === "high") {
          return "Start with fork and outside contributor gates, then require pr-captcha/human on " + day + " if the first solved gates are clean.";
        }
        if (data.risk_level === "medium") {
          return "Pilot on fork PRs and first-time contributors, then require the check on " + day + " after maintainer review.";
        }
        return "Run advisory mode first, collect proof on incoming PRs, then require the check on " + day + " only if queue pressure continues.";
      }
      function timelineFor(data, stance) {
        var day = requireDay(stance, data.risk_level);
        return [
          { title: "Day 0: install advisory policy", body: "Install the GitHub App, commit .github/pr-captcha.yml, and post the pilot issue before requiring branch protection." },
          { title: "Day 1: gate the safest target", body: data.risk_level === "low" ? "Apply to first-time contributors and fork PRs only." : "Apply to fork PRs, outside contributors, and bot PRs." },
          { title: day + ": protect pr-captcha/human", body: "Add pr-captcha/human as a required check after at least one maintainer confirms the solve path." },
          { title: "Day 6: review support load", body: "Count failed solves, maintainer overrides, stale gates, and any contributor confusion." },
          { title: "Day 7: decide expansion", body: "Keep, tighten, or roll back based on solved gate rate and maintainer time saved." }
        ];
      }
      function branchItems(data, stance) {
        var day = requireDay(stance, data.risk_level);
        return [
          "Keep existing required checks unchanged until " + day + ".",
          "Add pr-captcha/human to branch protection only after the pilot issue has owner approval.",
          "Require the gate on fork PRs and outside contributors before heavy workflows.",
          "Keep admin override access for maintainers during the first week."
        ];
      }
      function metricItems(data) {
        return [
          "Solved gate rate above 95 percent for legitimate contributors.",
          "Zero accepted reports of PR content being checked out by pr-captcha.",
          "At least one heavy workflow or maintainer triage decision deferred until verification.",
          "Open support comments resolved within one maintainer business day.",
          "Rollback remains one branch protection edit plus advisory mode."
        ];
      }
      function issueText(data, stance) {
        var url = reportUrl(data.repository);
        return [
          "## Pilot pr-captcha for 7 days",
          "",
          "I propose a short pr-captcha pilot for this repository. The goal is to keep untrusted PR intake from becoming maintainer work before a real GitHub user verifies the exact head SHA.",
          "",
          "- Repository: " + data.repository,
          "- Pilot stance: " + stance,
          "- Risk level: " + data.risk_level,
          "- Open PRs: " + formatNumber(data.open_pull_requests),
          "- Recent sample: " + formatNumber(data.sample_size) + " PRs",
          "- Fork PRs: " + formatNumber(data.fork_pull_requests),
          "- Unknown authors: " + formatNumber(data.unknown_authors),
          "- Bot PRs: " + formatNumber(data.bot_pull_requests),
          "- Stale PRs: " + formatNumber(data.stale_pull_requests),
          "- Spam or invalid label matches: " + formatNumber(labels(data)),
          "",
          "Evidence",
          "- Live report: " + url,
          "- Pilot planner: " + pilotUrl(data.repository),
          "- Setup wizard: " + appLink("/setup-wizard", data.repository),
          "",
          "Rollout",
          timelineFor(data, stance).map(function (item) { return "- " + item.title + ": " + item.body; }).join("\\n"),
          "",
          "Success metrics",
          metricItems(data).map(function (item) { return "- " + item; }).join("\\n"),
          "",
          "Rollback",
          "Remove pr-captcha/human from required checks, keep the App installed in advisory mode, and review the evidence before trying again."
        ].join("\\n");
      }
      function renderPlan(data) {
        var stance = stanceValue();
        repoInput.value = data.repository;
        if (window.history && window.history.replaceState) {
          var parsed = new URL(pilotUrl(data.repository));
          window.history.replaceState({}, "", parsed.pathname + parsed.search);
        }
        if (card) card.setAttribute("data-pilot-risk", data.risk_level);
        setText(title, pilotName(stance, data.risk_level));
        setText(recommendation, recommendationText(data, stance));
        setMetric("open", data.open_pull_requests);
        setMetric("fork", data.fork_pull_requests);
        setMetric("unknown", data.unknown_authors);
        setMetric("labels", labels(data));
        timeline.innerHTML = timelineHtml(timelineFor(data, stance));
        branch.innerHTML = listHtml(branchItems(data, stance));
        metrics.innerHTML = listHtml(metricItems(data));
        setText(rollback, "Rollback takes one branch protection edit: remove pr-captcha/human from required checks, keep advisory logging on, and reopen the pilot only after the evidence report changes.");
        latestIssue = issueText(data, stance);
        issue.textContent = latestIssue;
        updateLinks(data.repository, latestIssue, false);
        setText(planStatus, data.partial ? "partial" : "ready");
        setText(issueStatus, data.partial ? "partial" : "ready");
      }
      function renderError(message) {
        if (card) card.setAttribute("data-pilot-risk", "error");
        setText(title, "Pilot scan failed");
        setText(recommendation, message);
        setMetric("open", null);
        setMetric("fork", null);
        setMetric("unknown", null);
        setMetric("labels", null);
        timeline.innerHTML = timelineHtml([{ title: "Retry scan", body: "Try another repository or wait for GitHub public API limits to clear." }]);
        branch.innerHTML = listHtml(["Do not change branch protection until live evidence is available."]);
        metrics.innerHTML = listHtml(["Track the failed scan as a blocker before asking maintainers to install the App."]);
        setText(rollback, "No rollout started.");
        latestIssue = "## pr-captcha pilot scan failed\\n\\n- Repository: " + repoValue() + "\\n- Error: " + message + "\\n\\nRetry the scan before changing branch protection.";
        issue.textContent = latestIssue;
        updateLinks(repoValue(), latestIssue, true);
        setText(planStatus, "failed");
        setText(issueStatus, "failed");
      }
      async function scan() {
        var repo = repoValue();
        setText(status, "scanning");
        issueLinks.forEach(function (link) {
          link.setAttribute("aria-disabled", "true");
        });
        if (run) {
          run.disabled = true;
          run.textContent = "Scanning";
        }
        try {
          var response = await fetch("/api/public/repo-evidence?repo=" + encodeURIComponent(repo), { headers: { Accept: "application/json" } });
          var data = await response.json();
          if (!response.ok) {
            throw new Error(data && data.error ? data.error : "Pilot scan failed");
          }
          renderPlan(data);
          setText(status, data.partial ? "partial" : "ready");
        } catch (error) {
          renderError(error && error.message ? error.message : "Pilot scan failed");
          setText(status, "failed");
        } finally {
          if (run) {
            run.disabled = false;
            run.textContent = "Run pilot scan";
          }
        }
      }
      Array.prototype.slice.call(document.querySelectorAll("[data-pilot-preset]")).forEach(function (button) {
        button.addEventListener("click", function () {
          repoInput.value = button.getAttribute("data-pilot-preset") || "tldraw/tldraw";
          scan();
        });
      });
      Array.prototype.slice.call(form.querySelectorAll('[name="stance"]')).forEach(function (input) {
        input.addEventListener("change", scan);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        scan();
      });
      if (run) run.addEventListener("click", scan);
      if (copy) {
        copy.addEventListener("click", function () {
          var value = latestIssue || issue.textContent || "";
          copyText(value).then(function () {
            copy.textContent = "Copied issue";
            window.setTimeout(function () {
              copy.textContent = "Copy pilot issue";
            }, 1500);
          }).catch(function () {
            copy.textContent = "Copy failed";
            window.setTimeout(function () {
              copy.textContent = "Copy pilot issue";
            }, 1500);
          });
        });
      }
      window.setTimeout(scan, 0);
    })();
  </script>`;
}

function badgeBuilderScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-badge-form]");
      var preview = document.querySelector("[data-badge-preview]");
      var open = document.querySelector("[data-badge-open]");
      var markdown = document.querySelector("[data-badge-markdown]");
      var html = document.querySelector("[data-badge-html]");
      var status = document.querySelector("[data-badge-status]");
      if (!form || !preview || !open || !markdown || !html) return;
      var tone = "green";
      var style = "rounded";

      function field(name, fallback) {
        var input = form.querySelector('[name="' + name + '"]');
        var value = input ? input.value.trim() : "";
        return value || fallback;
      }
      function workerOrigin(value) {
        try {
          return new URL(value).origin;
        } catch (_) {
          return "https://pr-captcha.example.workers.dev";
        }
      }
      function badgeUrl() {
        var params = new URLSearchParams();
        params.set("label", field("label", "protected by").slice(0, 28));
        params.set("message", field("message", "pr-captcha").slice(0, 28));
        params.set("tone", tone);
        params.set("style", style);
        return workerOrigin(field("worker_url", "")) + "/badge.svg?" + params.toString();
      }
      function render() {
        var src = badgeUrl();
        var link = field("link_url", workerOrigin(field("worker_url", "")) + "/demo");
        var label = field("label", "protected by");
        var message = field("message", "pr-captcha");
        var alt = (label + " " + message).trim();
        preview.setAttribute("src", src);
        preview.setAttribute("alt", alt);
        open.setAttribute("href", src);
        markdown.textContent = "[![" + alt + "](" + src + ")](" + link + ")";
        html.textContent = '<a href="' + link + '"><img alt="' + alt.replace(/"/g, "&quot;") + '" src="' + src + '" /></a>';
      }
      function select(buttons, active, attribute) {
        Array.prototype.slice.call(buttons).forEach(function (button) {
          var selected = button.getAttribute(attribute) === active;
          button.setAttribute("aria-pressed", selected ? "true" : "false");
        });
      }
      Array.prototype.slice.call(form.querySelectorAll("input")).forEach(function (input) {
        input.addEventListener("input", render);
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-badge-tone]")).forEach(function (button) {
        button.addEventListener("click", function () {
          tone = button.getAttribute("data-badge-tone") || "green";
          select(document.querySelectorAll("[data-badge-tone]"), tone, "data-badge-tone");
          render();
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-badge-style]")).forEach(function (button) {
        button.addEventListener("click", function () {
          style = button.getAttribute("data-badge-style") || "rounded";
          select(document.querySelectorAll("[data-badge-style]"), style, "data-badge-style");
          render();
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-copy-badge]")).forEach(function (button) {
        button.addEventListener("click", function () {
          var originalLabel = button.textContent || "Copy";
          var target = button.getAttribute("data-copy-badge") === "html" ? html : markdown;
          var value = target.textContent || "";
          var finish = function (label) {
            button.textContent = label;
            if (status) status.textContent = label.toLowerCase();
            window.setTimeout(function () {
              button.textContent = originalLabel;
              if (status) status.textContent = "ready";
            }, 1500);
          };
          if (navigator.clipboard) {
            navigator.clipboard.writeText(value).then(function () {
              finish("Copied");
            }).catch(function () {
              finish("Copy failed");
            });
          } else {
            finish("Copy unavailable");
          }
        });
      });
      render();
    })();
  </script>`;
}

function proofCardBuilderScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-proof-form]");
      var preview = document.querySelector("[data-proof-preview]");
      var open = document.querySelector("[data-proof-open]");
      var markdown = document.querySelector("[data-proof-markdown]");
      var html = document.querySelector("[data-proof-html]");
      var social = document.querySelector("[data-proof-social]");
      var status = document.querySelector("[data-proof-status]");
      if (!form || !preview || !open || !markdown || !html || !social) return;
      var result = "verified";
      var theme = "light";

      function field(name, fallback) {
        var input = form.querySelector('[name="' + name + '"]');
        var value = input ? input.value.trim() : "";
        return value || fallback;
      }
      function workerOrigin(value) {
        try {
          return new URL(value).origin;
        } catch (_) {
          return "https://pr-captcha.example.workers.dev";
        }
      }
      function proofUrl() {
        var params = new URLSearchParams();
        params.set("repo", field("repo", "octo-org/awesome-repo").slice(0, 44));
        params.set("pr", field("pr", "184").replace(/[^0-9]/g, "").slice(0, 6) || "184");
        params.set("sha", field("sha", "8f31c9a").slice(0, 18));
        params.set("user", field("user", "some-user").slice(0, 28));
        params.set("result", result);
        params.set("theme", theme);
        return workerOrigin(field("worker_url", "")) + "/proof.svg?" + params.toString();
      }
      function resultLabel() {
        if (result === "pending") return "is waiting on pr-captcha";
        if (result === "denied") return "did not pass pr-captcha";
        return "passed pr-captcha";
      }
      function render() {
        var src = proofUrl();
        var link = workerOrigin(field("worker_url", "")) + "/demo";
        var repo = field("repo", "octo-org/awesome-repo");
        var pr = field("pr", "184").replace(/[^0-9]/g, "") || "184";
        var sha = field("sha", "8f31c9a");
        var user = field("user", "some-user");
        var alt = repo + " PR #" + pr + " " + resultLabel();
        preview.setAttribute("src", src);
        preview.setAttribute("alt", alt);
        open.setAttribute("href", src);
        markdown.textContent = "[![" + alt + "](" + src + ")](" + link + ")";
        html.textContent = '<a href="' + link + '"><img alt="' + alt.replace(/"/g, "&quot;") + '" src="' + src + '" /></a>';
        social.textContent = repo + " PR #" + pr + " " + resultLabel() + ": GitHub user " + user + ", exact head SHA " + sha + ", no patch checkout.";
      }
      function select(buttons, active, attribute) {
        Array.prototype.slice.call(buttons).forEach(function (button) {
          var selected = button.getAttribute(attribute) === active;
          button.setAttribute("aria-pressed", selected ? "true" : "false");
        });
      }
      Array.prototype.slice.call(form.querySelectorAll("input")).forEach(function (input) {
        input.addEventListener("input", render);
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-proof-result]")).forEach(function (button) {
        button.addEventListener("click", function () {
          result = button.getAttribute("data-proof-result") || "verified";
          select(document.querySelectorAll("[data-proof-result]"), result, "data-proof-result");
          render();
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-proof-theme]")).forEach(function (button) {
        button.addEventListener("click", function () {
          theme = button.getAttribute("data-proof-theme") || "light";
          select(document.querySelectorAll("[data-proof-theme]"), theme, "data-proof-theme");
          render();
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-copy-proof]")).forEach(function (button) {
        button.addEventListener("click", function () {
          var originalLabel = button.textContent || "Copy";
          var key = button.getAttribute("data-copy-proof");
          var target = key === "html" ? html : key === "social" ? social : markdown;
          var value = target.textContent || "";
          var finish = function (label) {
            button.textContent = label;
            if (status) status.textContent = label.toLowerCase();
            window.setTimeout(function () {
              button.textContent = originalLabel;
              if (status) status.textContent = "ready";
            }, 1500);
          };
          if (navigator.clipboard) {
            navigator.clipboard.writeText(value).then(function () {
              finish("Copied");
            }).catch(function () {
              finish("Copy failed");
            });
          } else {
            finish("Copy unavailable");
          }
        });
      });
      render();
    })();
  </script>`;
}

function scorecardBuilderScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-scorecard-form]");
      var run = document.querySelector("[data-scorecard-run]");
      var preview = document.querySelector("[data-scorecard-preview]");
      var open = document.querySelector("[data-scorecard-open]");
      var markdown = document.querySelector("[data-scorecard-markdown]");
      var html = document.querySelector("[data-scorecard-html]");
      var social = document.querySelector("[data-scorecard-social]");
      var urlText = document.querySelector("[data-scorecard-url]");
      var issue = document.querySelector("[data-scorecard-issue]");
      var issueStatus = document.querySelector("[data-scorecard-issue-status]");
      var openIssue = document.querySelector("[data-scorecard-open-issue]");
      var openIssueSecondary = document.querySelector("[data-scorecard-open-issue-secondary]");
      var setup = document.querySelector("[data-scorecard-setup]");
      var share = document.querySelector("[data-scorecard-share]");
      var status = document.querySelector("[data-scorecard-status]");
      var evidence = document.querySelector("[data-scorecard-evidence]");
      var pilot = document.querySelector("[data-scorecard-pilot]");
      if (!form || !preview || !open || !markdown || !html || !social || !urlText || !issue || !share) return;
      var theme = "light";
      var latestData = null;

      function field(name, fallback) {
        var input = form.querySelector('[name="' + name + '"]');
        var value = input ? input.value.trim() : "";
        return value || fallback;
      }
      function workerOrigin(value) {
        try {
          return new URL(value).origin;
        } catch (_) {
          return "https://pr-captcha.example.workers.dev";
        }
      }
      function formatNumber(value) {
        return typeof value === "number" ? value.toLocaleString("en-US") : "limited";
      }
      function labelCount(data) {
        return (data.spam_label_matches || 0) + (data.invalid_label_matches || 0);
      }
      function repoParts(repository) {
        var parts = String(repository || "tldraw/tldraw").split("/");
        return {
          owner: parts[0] || "tldraw",
          repo: parts[1] || "tldraw"
        };
      }
      function metricText(value) {
        return typeof value === "number" ? String(value) : "limited";
      }
      function fallbackCopy(value) {
        var textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (_) {
          copied = false;
        }
        textarea.remove();
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy unavailable"));
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value).catch(function () {
            return fallbackCopy(value);
          });
        }
        return fallbackCopy(value);
      }
      function scorecardUrl(data) {
        var params = new URLSearchParams();
        params.set("repo", data.repository);
        params.set("risk", data.risk_level);
        params.set("open", String(data.open_pull_requests || 0));
        params.set("fork", String(data.fork_pull_requests || 0));
        params.set("unknown", String(data.unknown_authors || 0));
        params.set("labels", String(labelCount(data)));
        params.set("theme", theme);
        params.set("recommendation", data.recommendation || "");
        return workerOrigin(field("worker_url", "")) + "/scorecard.svg?" + params.toString();
      }
      function evidenceUrl(repo) {
        return workerOrigin(field("worker_url", "")) + "/evidence?repo=" + encodeURIComponent(repo);
      }
      function pilotUrl(repo) {
        return workerOrigin(field("worker_url", "")) + "/pilot?repo=" + encodeURIComponent(repo);
      }
      function setupUrl(repo) {
        return workerOrigin(field("worker_url", "")) + "/setup-wizard?repo=" + encodeURIComponent(repo);
      }
      function githubIssueUrl(data, src) {
        var repo = repoParts(data.repository);
        var url = new URL("https://github.com/" + encodeURIComponent(repo.owner) + "/" + encodeURIComponent(repo.repo) + "/issues/new");
        url.searchParams.set("title", "Pilot pr-captcha for PR queue pressure");
        url.searchParams.set("body", issueText(data, src));
        return url.toString();
      }
      function issueText(data, src) {
        return [
          "## Proposal: add pr-captcha to protect the PR queue",
          "",
          data.repository + " is showing " + data.risk_level + " PR queue pressure. I propose a 7-day pr-captcha pilot for fork, first-time, outside, and bot pull requests before maintainer review starts.",
          "",
          "![pr-captcha queue scorecard](" + src + ")",
          "",
          "Current public signals",
          "- " + metricText(data.open_pull_requests) + " open PRs",
          "- " + metricText(data.fork_pull_requests) + " fork PRs",
          "- " + metricText(data.unknown_authors) + " unknown or outside authors",
          "- " + metricText(labelCount(data)) + " spam or invalid labels",
          "",
          "Pilot scope",
          "- Gate fork PRs and first-time contributors for 7 days.",
          "- Require GitHub login plus CAPTCHA for the exact head SHA.",
          "- Keep pr-captcha from checking out or executing pull request code.",
          "- Enable branch protection only after one clean rehearsal PR.",
          "",
          "Links",
          "- Scorecard: " + src,
          "- Pilot planner: " + pilotUrl(data.repository),
          "- Policy generator: " + setupUrl(data.repository)
        ].join("\\n");
      }
      function shareReceipt(data, src, link) {
        return [
          data.repository + " PR queue scorecard",
          data.risk_level + " risk from public GitHub PR signals",
          metricText(data.open_pull_requests) + " open PRs, " + metricText(data.fork_pull_requests) + " fork PRs, " + metricText(data.unknown_authors) + " unknown authors, " + metricText(labelCount(data)) + " spam or invalid labels.",
          "Scorecard: " + src,
          "Evidence: " + link,
          "Pilot: " + pilotUrl(data.repository)
        ].join("\\n");
      }
      function renderSnippets(data) {
        var src = scorecardUrl(data);
        var link = evidenceUrl(data.repository);
        var alt = data.repository + " PR queue scorecard";
        var draft = issueText(data, src);
        var issueHref = githubIssueUrl(data, src);
        preview.setAttribute("src", src);
        preview.setAttribute("alt", alt);
        open.setAttribute("href", src);
        if (evidence) evidence.setAttribute("href", link);
        if (pilot) pilot.setAttribute("href", pilotUrl(data.repository));
        if (setup) setup.setAttribute("href", setupUrl(data.repository));
        if (openIssue) openIssue.setAttribute("href", issueHref);
        if (openIssueSecondary) openIssueSecondary.setAttribute("href", issueHref);
        urlText.textContent = src;
        markdown.textContent = "[![" + alt + "](" + src + ")](" + link + ")";
        html.textContent = '<a href="' + link + '"><img alt="' + alt.replace(/"/g, "&quot;") + '" src="' + src + '" /></a>';
        social.textContent = data.repository + " PR queue scorecard: " + data.risk_level + " risk, " + formatNumber(data.open_pull_requests) + " open PRs, " + formatNumber(data.fork_pull_requests) + " fork PRs, " + formatNumber(data.unknown_authors) + " unknown authors, " + formatNumber(labelCount(data)) + " spam or invalid labels. Scanned by pr-captcha: " + link;
        issue.textContent = draft;
        share.textContent = shareReceipt(data, src, link);
        if (issueStatus) issueStatus.textContent = "ready to copy";
      }
      function renderError(message) {
        var repo = field("repo", "tldraw/tldraw");
        latestData = {
          repository: repo,
          risk_level: "medium",
          open_pull_requests: 0,
          fork_pull_requests: 0,
          unknown_authors: 0,
          spam_label_matches: 0,
          invalid_label_matches: 0,
          recommendation: "Scorecard scan failed: " + message
        };
        renderSnippets(latestData);
        if (status) status.textContent = "failed";
      }
      async function scan() {
        var repo = field("repo", "tldraw/tldraw");
        if (run) {
          run.disabled = true;
          run.textContent = "Scanning";
        }
        if (status) status.textContent = "scanning";
        try {
          var response = await fetch("/api/public/repo-evidence?repo=" + encodeURIComponent(repo), { headers: { Accept: "application/json" } });
          var data = await response.json();
          if (!response.ok) {
            throw new Error(data && data.error ? data.error : "Scorecard scan failed");
          }
          latestData = data;
          renderSnippets(data);
          if (status) status.textContent = data.partial ? "partial" : "ready";
        } catch (error) {
          renderError(error && error.message ? error.message : "Scorecard scan failed");
        } finally {
          if (run) {
            run.disabled = false;
            run.textContent = "Run live scan";
          }
        }
      }
      function select(buttons, active, attribute) {
        Array.prototype.slice.call(buttons).forEach(function (button) {
          var selected = button.getAttribute(attribute) === active;
          button.setAttribute("aria-pressed", selected ? "true" : "false");
        });
      }
      Array.prototype.slice.call(form.querySelectorAll("input")).forEach(function (input) {
        input.addEventListener("input", function () {
          if (latestData) {
            latestData.repository = field("repo", latestData.repository || "tldraw/tldraw");
            renderSnippets(latestData);
          }
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-scorecard-theme]")).forEach(function (button) {
        button.addEventListener("click", function () {
          theme = button.getAttribute("data-scorecard-theme") || "light";
          select(document.querySelectorAll("[data-scorecard-theme]"), theme, "data-scorecard-theme");
          if (latestData) renderSnippets(latestData);
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-scorecard-preset]")).forEach(function (button) {
        button.addEventListener("click", function () {
          var input = form.querySelector('[name="repo"]');
          if (input) input.value = button.getAttribute("data-scorecard-preset") || "tldraw/tldraw";
          scan();
        });
      });
      if (run) run.addEventListener("click", scan);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        scan();
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-copy-scorecard]")).forEach(function (button) {
        button.addEventListener("click", function () {
          var originalLabel = button.textContent || "Copy";
          var key = button.getAttribute("data-copy-scorecard");
          var target =
            key === "html"
              ? html
              : key === "social"
                ? social
                : key === "url"
                  ? urlText
                  : key === "issue"
                    ? issue
                    : key === "share"
                      ? share
                      : markdown;
          var value = target.textContent || "";
          var isActionButton = button.classList.contains("scorecard-action");
          copyText(value).then(function () {
            if (isActionButton) {
              button.setAttribute("data-copied", "true");
            } else {
              button.textContent = "Copied";
            }
            if (status) status.textContent = "copied";
            if (key === "issue" && issueStatus) issueStatus.textContent = "copied";
            window.setTimeout(function () {
              if (isActionButton) {
                button.removeAttribute("data-copied");
              } else {
                button.textContent = originalLabel;
              }
              if (status) status.textContent = "ready";
              if (issueStatus) issueStatus.textContent = "ready to copy";
            }, 1500);
          }).catch(function () {
            if (isActionButton) {
              button.setAttribute("data-copied", "failed");
            } else {
              button.textContent = "Copy failed";
            }
            window.setTimeout(function () {
              if (isActionButton) {
                button.removeAttribute("data-copied");
              } else {
                button.textContent = originalLabel;
              }
            }, 1500);
          });
        });
      });
      window.setTimeout(scan, 0);
    })();
  </script>`;
}

function launchPageScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-launch-form]");
      var progress = document.querySelector("[data-launch-progress]");
      var progressBar = document.querySelector("[data-launch-progress-bar]");
      var commands = document.querySelector("[data-launch-commands]");
      var share = document.querySelector("[data-launch-share]");
      var issue = document.querySelector("[data-launch-issue]");
      var badge = document.querySelector("[data-launch-badge]");
      var status = document.querySelector("[data-launch-status]");
      var gaps = document.querySelector("[data-launch-gap-list]");
      var readinessRefresh = document.querySelector("[data-launch-readiness-refresh]");
      var readinessStatus = document.querySelector("[data-launch-readiness-status]");
      var readinessList = document.querySelector("[data-launch-readiness-list]");
      var decisionCard = document.querySelector("[data-launch-decision-card]");
      var decision = document.querySelector("[data-launch-decision]");
      var decisionDetail = document.querySelector("[data-launch-decision-detail]");
      var blockerCount = document.querySelector("[data-launch-blocker-count]");
      var blockerDetail = document.querySelector("[data-launch-blocker-detail]");
      var nextProof = document.querySelector("[data-launch-next-proof]");
      var nextProofDetail = document.querySelector("[data-launch-next-proof-detail]");
      var proofStatus = document.querySelector("[data-launch-proof-status]");
      var proofStages = Array.prototype.slice.call(document.querySelectorAll("[data-launch-proof-stage]"));
      var blockerAlert = document.querySelector("[data-launch-blocker-alert]");
      var blockerTitle = document.querySelector("[data-launch-blocker-title]");
      var blockerSummary = document.querySelector("[data-launch-blocker-summary]");
      var blockerList = document.querySelector("[data-launch-blocker-list]");
      if (!form || !progress || !progressBar || !commands || !share || !issue || !badge || !status || !gaps || !readinessRefresh || !readinessStatus || !readinessList || !decisionCard || !decision || !decisionDetail || !blockerCount || !blockerDetail || !nextProof || !nextProofDetail || !proofStatus || !blockerAlert || !blockerTitle || !blockerSummary || !blockerList) return;
      var lastGeneratedPagesUrl = "";
      function field(name, fallback) {
        var input = form.querySelector('[name="' + name + '"]');
        return input && input.value ? input.value.trim() : fallback;
      }
      function origin(value) {
        try {
          return new URL(value).origin;
        } catch (_) {
          return "https://pr-captcha.example.workers.dev";
        }
      }
      function absoluteUrl(value, fallback) {
        try {
          return new URL(value).href;
        } catch (_) {
          return fallback;
        }
      }
      function token(value, fallback) {
        var cleaned = String(value || fallback)
          .trim()
          .replace(/[^a-zA-Z0-9._-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 64);
        return cleaned || fallback;
      }
      function repoParts(value) {
        var cleaned = String(value || "aryabyte21/pr-captcha")
          .trim()
          .replace(/[^a-zA-Z0-9._/-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^\\/+|\\/+$/g, "");
        var parts = cleaned.split("/");
        return {
          owner: token(parts[0], "aryabyte21"),
          repo: token(parts[1], "pr-captcha")
        };
      }
      function pagesUrlFromRepo(repo) {
        return "https://" + repo.owner + ".github.io/" + repo.repo + "/";
      }
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function commandText(baseUrl, repo, dbName, pagesUrl) {
        var diagnosticsUrl = baseUrl + "/diagnostics?owner=" + encodeURIComponent(repo.owner) + "&repo=" + encodeURIComponent(repo.repo);
        return [
          "cd apps/worker",
          "npx wrangler d1 create " + dbName,
          "npx wrangler d1 migrations apply " + dbName + " --remote",
          "gh api repos/" + repo.owner + "/" + repo.repo + "/pages >/dev/null 2>&1 || gh api -X POST repos/" + repo.owner + "/" + repo.repo + "/pages -f build_type=workflow",
          "gh api -X PUT repos/" + repo.owner + "/" + repo.repo + "/pages -f build_type=workflow",
          "gh api repos/" + repo.owner + "/" + repo.repo + "/pages --jq '.html_url'",
          "npx wrangler secret put APP_BASE_URL",
          "npx wrangler secret put GITHUB_APP_ID",
          "npx wrangler secret put GITHUB_PRIVATE_KEY",
          "npx wrangler secret put GITHUB_WEBHOOK_SECRET",
          "npx wrangler secret put GITHUB_CLIENT_ID",
          "npx wrangler secret put GITHUB_CLIENT_SECRET",
          "npx wrangler secret put TURNSTILE_SITE_KEY",
          "npx wrangler secret put TURNSTILE_SECRET_KEY",
          "npx wrangler secret put SESSION_SECRET",
          "npm run deploy",
          "curl -fsS " + baseUrl + "/health/ready",
          pagesUrl,
          diagnosticsUrl
        ].join("\\n");
      }
      function shareText(baseUrl, repo, appSlug, pagesUrl) {
        return [
          "pr-captcha launch checklist",
          "Worker: " + baseUrl,
          "Pages redirect: " + pagesUrl,
          "Repository: " + repo.owner + "/" + repo.repo,
          "GitHub App: " + appSlug,
          "Gates: Worker, D1, GitHub App, Turnstile, Repository policy, Diagnostics, Fork PR test.",
          "Runbook: " + baseUrl + "/launch"
        ].join("\\n");
      }
      function badgeMarkdown(baseUrl, repo) {
        var badgeUrl = baseUrl + "/badge.svg?label=protected%20by&message=pr-captcha&tone=green&style=rounded";
        return "[![protected by pr-captcha](" + badgeUrl + ")](" + baseUrl + "/demo?repo=" + encodeURIComponent(repo.owner + "/" + repo.repo) + ")";
      }
      function issueText(baseUrl, repo, pagesUrl) {
        var repository = repo.owner + "/" + repo.repo;
        return [
          "## Add pr-captcha before untrusted PRs hit CI",
          "",
          "This repository can require \`pr-captcha/human\` for every PR, or for narrower configured targets, before maintainers spend review or runner time.",
          "",
          "What it proves:",
          "- GitHub login plus browser CAPTCHA completed.",
          "- Verification is bound to one repository, PR number, author, and exact head SHA.",
          "- The gate treats pull request content as metadata only and never checks out the patch.",
          "- Held fork CI can be released after human verification.",
          "",
          "Repository: " + repository,
          "Demo: " + baseUrl + "/demo",
          "Setup wizard: " + baseUrl + "/setup-wizard",
          "Status: " + baseUrl + "/status",
          "Pages redirect fallback: " + pagesUrl,
          "README badge: " + badgeMarkdown(baseUrl, repo)
        ].join("\\n");
      }
      function stepItems() {
        return Array.prototype.slice.call(form.querySelectorAll("[data-launch-step]"));
      }
      function checkedMap(items) {
        return items.reduce(function (memo, step) {
          var key = step.getAttribute("data-launch-key") || "";
          var input = step.querySelector("input");
          memo[key] = Boolean(input && input.checked);
          return memo;
        }, {});
      }
      function openItems(items) {
        return items.filter(function (step) {
          var input = step.querySelector("input");
          return !input || !input.checked;
        });
      }
      function firstOpenItem(items) {
        return openItems(items)[0] || null;
      }
      function renderDecision(items, complete, total) {
        var remaining = Math.max(total - complete, 0);
        var map = checkedMap(items);
        if (remaining === 0) {
          decisionCard.setAttribute("data-state", "ready");
          decision.textContent = "Installed";
          decisionDetail.textContent = "The app, policy, and service proof are checked.";
          blockerCount.textContent = "Policy";
          blockerDetail.textContent = ".github/pr-captcha.yml is ready to require.";
          nextProof.textContent = "Tested";
          nextProofDetail.textContent = "Save the fork PR proof before announcing.";
          return;
        }
        decisionCard.setAttribute("data-state", map.github_app_ready ? "almost" : "blocked");
        decision.textContent = map.github_app_ready ? "Installed" : "Install app";
        decisionDetail.textContent = map.github_app_ready
          ? "GitHub App proof is checked. Keep going."
          : "Add the hosted GitHub App to the repository first.";
        blockerCount.textContent = map.policy ? "Policy ready" : "Policy";
        blockerDetail.textContent = map.policy
          ? "The policy file is checked."
          : "Generate .github/pr-captcha.yml and commit it.";
        nextProof.textContent = map.fork_pr ? "Tested" : "Test PR";
        nextProofDetail.textContent = map.fork_pr
          ? "A fork PR has already verified the exact SHA."
          : "Open one disposable PR and watch the receipt turn green.";
      }
      function blockerItems(map, items) {
        var blockers = [];
        if (!map.github_app_ready || !map.turnstile) {
          blockers.push({
            title: "Missing production secrets",
            body: "Store GitHub App, OAuth, Turnstile, session, and webhook secrets on Cloudflare."
          });
        }
        if (!map.github_app_ready) {
          blockers.push({
            title: "Missing GitHub App install",
            body: "Convert the manifest, install the App, and confirm repository access."
          });
        }
        if (!map.fork_pr) {
          blockers.push({
            title: "Missing fork PR test",
            body: "Open one clean unknown-author fork PR and prove the exact SHA releases."
          });
        }
        if (!blockers.length) {
          openItems(items).slice(0, 3).forEach(function (step) {
            blockers.push({
              title: step.getAttribute("data-launch-step") || "Launch gate",
              body: step.getAttribute("data-launch-step-body") || "Waiting for evidence."
            });
          });
        }
        return blockers;
      }
      function renderBlockerAlert(map, items) {
        var blockers = blockerItems(map, items);
        if (!blockers.length) {
          blockerAlert.setAttribute("data-state", "ready");
          blockerTitle.textContent = "No blockers";
          blockerSummary.textContent = "The install path is checked. Save the test PR proof before public rollout.";
          blockerList.innerHTML = "<li>Ready for final fork PR rehearsal</li>";
          return;
        }
        blockerAlert.setAttribute("data-state", "blocked");
        blockerTitle.textContent = "Before requiring the check";
        blockerSummary.textContent = "Finish these before pr-captcha becomes branch protection.";
        blockerList.innerHTML = blockers.map(function (item) {
          return "<li><strong>" + escapeHtml(item.title) + "</strong><span>" + escapeHtml(item.body) + "</span></li>";
        }).join("");
      }
      function renderProofLane(map) {
        var firstWaiting = true;
        var complete = 0;
        proofStages.forEach(function (stage) {
          var key = stage.getAttribute("data-launch-proof-stage") || "";
          if (map[key]) {
            stage.setAttribute("data-state", "ready");
            complete += 1;
          } else if (firstWaiting) {
            stage.setAttribute("data-state", "active");
            firstWaiting = false;
          } else {
            stage.setAttribute("data-state", "waiting");
          }
        });
        proofStatus.textContent = complete + " of " + proofStages.length + " proven";
      }
      function renderGaps(items) {
        var open = openItems(items);
        if (!open.length) {
          gaps.innerHTML = '<li data-level="info"><strong>Ready</strong><span>All launch gates are checked. Validate with a live fork PR before public announcement.</span></li>';
          return;
        }
        gaps.innerHTML = open.map(function (step) {
          var title = step.getAttribute("data-launch-step") || "Launch gate";
          var body = step.getAttribute("data-launch-step-body") || "Waiting for evidence.";
          return '<li data-level="warning"><strong>' + escapeHtml(title) + "</strong><span>" + escapeHtml(body) + "</span></li>";
        }).join("");
      }
      function readinessUrl() {
        return origin(field("worker_url", "https://pr-captcha.example.workers.dev")) + "/api/public/launch-readiness";
      }
      function renderReadinessState(state, title, body, items) {
        if (state === "ready") {
          readinessStatus.removeAttribute("data-service-state");
        } else {
          readinessStatus.setAttribute("data-service-state", state === "error" ? "error" : "warn");
        }
        readinessStatus.innerHTML = '<span class="mini-shield">' + (state === "ready" ? "✓" : "!") + '</span><div><strong>' + escapeHtml(title) + "</strong><p>" + escapeHtml(body) + "</p></div>";
        readinessList.innerHTML = items.map(function (item) {
          return '<li data-level="' + escapeHtml(item.level) + '"><strong>' + escapeHtml(item.title) + "</strong><span>" + escapeHtml(item.body) + "</span></li>";
        }).join("");
      }
      function renderReadiness(data) {
        var missing = Array.isArray(data.missing) ? data.missing : [];
        var warnings = Array.isArray(data.warnings) ? data.warnings : [];
        var items = [
          {
            level: data.database ? "info" : "error",
            title: "D1 database",
            body: data.database ? "The Worker can query its D1 binding." : "The Worker cannot query its D1 binding."
          }
        ];
        if (missing.length) {
          missing.forEach(function (secret) {
            items.push({
              level: "warning",
              title: secret,
              body: "Missing required production secret."
            });
          });
        } else {
          items.push({
            level: "info",
            title: "Secrets",
            body: "All required production secrets are present."
          });
        }
        warnings.forEach(function (warning) {
          items.push({
            level: "warning",
            title: warning.code || "warning",
            body: warning.message || "Review this production warning."
          });
        });
        if (data.production_ready) {
          renderReadinessState("ready", "Production ready", "D1, required secrets, and production checks are passing.", items);
        } else if (data.ok) {
          renderReadinessState("warn", "Worker healthy with warnings", "The Worker can serve traffic, but production warnings remain.", items);
        } else {
          renderReadinessState("warn", "Worker not ready", "Fix the listed production gaps before branch protection depends on pr-captcha.", items);
        }
      }
      function refreshReadiness() {
        var original = readinessRefresh.textContent || "Run readiness";
        readinessRefresh.textContent = "Checking";
        readinessRefresh.setAttribute("disabled", "true");
        renderReadinessState("warn", "Checking readiness", readinessUrl(), [
          {
            level: "warning",
            title: "Worker",
            body: "Waiting for live readiness."
          }
        ]);
        fetch(readinessUrl(), {
          headers: {
            accept: "application/json"
          }
        }).then(function (response) {
          return response.json().then(function (data) {
            data.status = response.status;
            return data;
          });
        }).then(renderReadiness).catch(function () {
          renderReadinessState("error", "Readiness check failed", "Could not reach /health/ready on the current Worker URL.", [
            {
              level: "error",
              title: "Worker",
              body: readinessUrl()
            }
          ]);
        }).finally(function () {
          readinessRefresh.textContent = original;
          readinessRefresh.removeAttribute("disabled");
        });
      }
      function render() {
        var baseUrl = origin(field("worker_url", "https://pr-captcha.example.workers.dev"));
        var repo = repoParts(field("repository", "aryabyte21/pr-captcha"));
        var generatedPagesUrl = pagesUrlFromRepo(repo);
        var pagesInput = form.querySelector('[name="pages_url"]');
        var currentPagesUrl = pagesInput ? pagesInput.value.trim() : "";
        if (pagesInput && (!currentPagesUrl || currentPagesUrl === lastGeneratedPagesUrl)) {
          pagesInput.value = generatedPagesUrl;
        }
        lastGeneratedPagesUrl = generatedPagesUrl;
        var pagesUrl = absoluteUrl(field("pages_url", generatedPagesUrl), generatedPagesUrl);
        var dbName = token(field("d1_database", "pr-captcha"), "pr-captcha");
        var appSlug = token(field("github_app", "pr-captcha"), "pr-captcha");
        var items = stepItems();
        var complete = items.filter(function (step) {
          var input = step.querySelector("input");
          return input && input.checked;
        }).length;
        var total = items.length || 8;
        var percent = Math.round((complete / total) * 100);
        var map = checkedMap(items);
        progress.textContent = complete + " of " + total + (complete === total ? " launch gates proven" : " proven");
        progressBar.style.width = percent + "%";
        commands.textContent = commandText(baseUrl, repo, dbName, pagesUrl);
        share.textContent = shareText(baseUrl, repo, appSlug, pagesUrl);
        badge.textContent = badgeMarkdown(baseUrl, repo);
        issue.textContent = issueText(baseUrl, repo, pagesUrl);
        renderDecision(items, complete, total);
        renderBlockerAlert(map, items);
        renderProofLane(map);
        if (complete === total) {
          status.removeAttribute("data-service-state");
          status.innerHTML = '<span class="mini-shield">✓</span><div><strong>Launch gates checked</strong><p>Run the fork PR test one more time before sharing the public proof link.</p></div>';
        } else {
          status.setAttribute("data-service-state", "warn");
          status.innerHTML = '<span class="mini-shield">!</span><div><strong>Not ready yet</strong><p>' + (total - complete) + " proof points still need current evidence before the check is required.</p></div>";
        }
        renderGaps(items);
      }
      Array.prototype.slice.call(form.querySelectorAll("input")).forEach(function (input) {
        input.addEventListener("input", render);
        input.addEventListener("change", render);
      });
      readinessRefresh.addEventListener("click", refreshReadiness);
      Array.prototype.slice.call(document.querySelectorAll("[data-copy-launch]")).forEach(function (button) {
        button.addEventListener("click", function () {
          var key = button.getAttribute("data-copy-launch");
          var target = key === "commands" ? commands : key === "issue" ? issue : key === "badge" ? badge : share;
          var original = button.textContent || "Copy";
          render();
          if (!navigator.clipboard) {
            button.textContent = "Copy unavailable";
            window.setTimeout(function () {
              button.textContent = original;
            }, 1800);
            return;
          }
          navigator.clipboard.writeText(target.textContent || "").then(function () {
            button.textContent = "Copied";
            button.setAttribute("data-copied", "true");
            window.setTimeout(function () {
              button.textContent = original;
              button.removeAttribute("data-copied");
            }, 1800);
          }).catch(function () {
            button.textContent = "Copy failed";
            window.setTimeout(function () {
              button.textContent = original;
            }, 1800);
          });
        });
      });
      render();
    })();
  </script>`;
}

function rehearsalPageScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-rehearsal-form]");
      var progress = document.querySelector("[data-rehearsal-progress]");
      var progressBar = document.querySelector("[data-rehearsal-progress-bar]");
      var state = document.querySelector("[data-rehearsal-state]");
      var alert = document.querySelector("[data-rehearsal-alert]");
      var stages = Array.prototype.slice.call(document.querySelectorAll("[data-rehearsal-stage-list] li"));
      var outputLabel = document.querySelector("[data-rehearsal-output-label]");
      var runbook = document.querySelector("[data-rehearsal-runbook]");
      var issue = document.querySelector("[data-rehearsal-issue]");
      var action = document.querySelector("[data-rehearsal-action]");
      if (!form || !progress || !progressBar || !state || !alert || !runbook || !issue || !action || !outputLabel) return;
      function field(name, fallback) {
        var input = form.querySelector('[name="' + name + '"]');
        return input && input.value ? input.value.trim() : fallback;
      }
      function origin(value) {
        try {
          return new URL(value).origin;
        } catch (_) {
          return "https://pr-captcha.example.workers.dev";
        }
      }
      function token(value, fallback) {
        var cleaned = String(value || fallback)
          .trim()
          .replace(/[^a-zA-Z0-9._/-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^\\/+|\\/+$/g, "")
          .slice(0, 80);
        return cleaned || fallback;
      }
      function repoParts(value) {
        var cleaned = token(value, "aryabyte21/pr-captcha");
        var parts = cleaned.split("/");
        return {
          owner: token(parts[0], "aryabyte21"),
          repo: token(parts[1], "pr-captcha")
        };
      }
      function checkedSteps() {
        return Array.prototype.slice.call(form.querySelectorAll('.rehearsal-step input')).filter(function (input) {
          return input.checked;
        }).length;
      }
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function runbookText(baseUrl, repo, installationId, checkName) {
        var diagnostics = baseUrl + "/diagnostics?owner=" + encodeURIComponent(repo.owner) + "&repo=" + encodeURIComponent(repo.repo);
        return [
          "Fork PR rehearsal",
          "",
          "Worker URL: " + baseUrl,
          "Repository: " + repo.owner + "/" + repo.repo,
          "Installation ID: " + installationId,
          "Expected check: " + checkName,
          "",
          "1. Open a disposable fork PR with a small README-only change.",
          "2. Confirm diagnostics: " + diagnostics,
          "3. Confirm the PR shows " + checkName + " as action_required or pending.",
          "4. Open the gate link as the PR author and complete GitHub OAuth plus Turnstile.",
          "5. Re-run the workflow gate and confirm the exact head SHA is verified.",
          "6. Require the check only after this rehearsal passes on a fresh PR."
        ].join("\\n");
      }
      function issueText(baseUrl, repo, installationId) {
        return [
          "## Fork PR rehearsal before branch protection",
          "",
          "Repository: " + repo.owner + "/" + repo.repo,
          "Worker: " + baseUrl,
          "Installation ID: " + installationId,
          "",
          "Evidence to collect:",
          "- [ ] Open test fork PR",
          "- [ ] Webhook created gate",
          "- [ ] Contributor solves CAPTCHA",
          "- [ ] Action sees verified SHA",
          "- [ ] Ready for branch protection",
          "",
          "Acceptance criteria:",
          "- The gate appears on a new PR head SHA.",
          "- The verification link requires GitHub login and Turnstile.",
          "- The Action fails while pending and passes after verification.",
          "- Pushing a new commit requires a new human check."
        ].join("\\n");
      }
      function actionYaml(baseUrl) {
        return [
          "name: CI",
          "",
          "on:",
          "  pull_request:",
          "",
          "jobs:",
          "  human-gate:",
          "    name: pr-captcha / human gate",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: aryabyte21/pr-captcha/packages/action@v1",
          "        with:",
          "          api-url: " + baseUrl,
          "",
          "  test:",
          "    needs: human-gate",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "      - run: npm test"
        ].join("\\n");
      }
      function activePanel() {
        var selected = document.querySelector('[data-rehearsal-tab][aria-selected="true"]');
        var key = selected ? selected.getAttribute("data-rehearsal-tab") : "runbook";
        return document.querySelector('[data-rehearsal-panel="' + key + '"] code') || runbook;
      }
      function renderLinks(baseUrl, repo) {
        Array.prototype.slice.call(document.querySelectorAll('[data-rehearsal-link="diagnostics"]')).forEach(function (link) {
          link.href = baseUrl + "/diagnostics?owner=" + encodeURIComponent(repo.owner) + "&repo=" + encodeURIComponent(repo.repo);
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-rehearsal-link="status"]')).forEach(function (link) {
          link.href = baseUrl + "/status";
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-rehearsal-link="setup"]')).forEach(function (link) {
          link.href = baseUrl + "/setup-wizard";
        });
        Array.prototype.slice.call(document.querySelectorAll('[data-rehearsal-link="launch"]')).forEach(function (link) {
          link.href = baseUrl + "/launch";
        });
      }
      function render() {
        var baseUrl = origin(field("worker_url", "https://pr-captcha.example.workers.dev"));
        var repo = repoParts(field("repository", "aryabyte21/pr-captcha"));
        var installationId = token(field("installation_id", "12345678"), "12345678");
        var checkName = field("check_name", "pr-captcha/human") || "pr-captcha/human";
        var complete = checkedSteps();
        var total = 5;
        var percent = Math.round((complete / total) * 100);
        progress.textContent = complete + " of " + total + (complete === total ? " proven" : " proven");
        progressBar.style.width = percent + "%";
        state.textContent = complete === total ? "ready" : complete > 0 ? "in progress" : "waiting";
        runbook.textContent = runbookText(baseUrl, repo, installationId, checkName);
        issue.textContent = issueText(baseUrl, repo, installationId);
        action.textContent = actionYaml(baseUrl);
        renderLinks(baseUrl, repo);
        stages.forEach(function (item, index) {
          item.setAttribute("data-state", index < complete ? "ready" : index === complete ? "active" : "waiting");
        });
        if (complete === total) {
          alert.removeAttribute("data-service-state");
          alert.innerHTML = '<span class="mini-shield">✓</span><div><strong>Ready for branch protection</strong><p>The dry run proves the expected check can guard new PRs.</p></div>';
        } else {
          alert.setAttribute("data-service-state", "warn");
          alert.innerHTML = '<span class="mini-shield">!</span><div><strong>Rehearsal not complete</strong><p>' + (total - complete) + " evidence points still need proof before branch protection.</p></div>";
        }
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value);
        }
        var textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (_) {
          copied = false;
        }
        textarea.remove();
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
      }
      Array.prototype.slice.call(form.querySelectorAll("input")).forEach(function (input) {
        input.addEventListener("input", render);
        input.addEventListener("change", render);
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-rehearsal-tab]")).forEach(function (tab) {
        tab.addEventListener("click", function () {
          var key = tab.getAttribute("data-rehearsal-tab") || "runbook";
          Array.prototype.slice.call(document.querySelectorAll("[data-rehearsal-tab]")).forEach(function (item) {
            item.setAttribute("aria-selected", item === tab ? "true" : "false");
          });
          Array.prototype.slice.call(document.querySelectorAll("[data-rehearsal-panel]")).forEach(function (panel) {
            panel.hidden = panel.getAttribute("data-rehearsal-panel") !== key;
          });
          outputLabel.textContent = key === "issue" ? "github issue" : key === "action" ? "action guard" : "runbook";
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-copy-rehearsal]")).forEach(function (button) {
        button.addEventListener("click", function () {
          render();
          var key = button.getAttribute("data-copy-rehearsal");
          var target = key === "issue" ? issue : key === "runbook" ? runbook : key === "action" ? action : activePanel();
          var original = button.textContent || "Copy";
          copyText(target.textContent || "").then(function () {
            button.textContent = "Copied";
            button.setAttribute("data-copied", "true");
            window.setTimeout(function () {
              button.textContent = original;
              button.removeAttribute("data-copied");
            }, 1600);
          }).catch(function () {
            button.textContent = "Copy failed";
            window.setTimeout(function () {
              button.textContent = original;
            }, 1600);
          });
        });
      });
      var generate = document.querySelector("[data-rehearsal-generate]");
      if (generate) {
        generate.addEventListener("click", render);
      }
      render();
    })();
  </script>`;
}

function gateTracePageScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-trace-form]");
      var progress = document.querySelector("[data-trace-progress]");
      var progressBar = document.querySelector("[data-trace-progress-bar]");
      var state = document.querySelector("[data-trace-state]");
      var alert = document.querySelector("[data-trace-alert]");
      var stages = Array.prototype.slice.call(document.querySelectorAll("[data-trace-stage-list] li"));
      var outputLabel = document.querySelector("[data-trace-output-label]");
      var curl = document.querySelector("[data-trace-curl]");
      var action = document.querySelector("[data-trace-action]");
      var proof = document.querySelector("[data-trace-proof]");
      var receiptRepo = document.querySelector("[data-trace-receipt-repo]");
      var receiptPr = document.querySelector("[data-trace-receipt-pr]");
      var receiptSha = document.querySelector("[data-trace-receipt-sha]");
      if (!form || !progress || !progressBar || !state || !alert || !curl || !action || !proof || !outputLabel) return;
      function field(name, fallback) {
        var input = form.querySelector('[name="' + name + '"]');
        return input && input.value ? input.value.trim() : fallback;
      }
      function origin(value) {
        try {
          return new URL(value).origin;
        } catch (_) {
          return "https://pr-captcha.example.workers.dev";
        }
      }
      function token(value, fallback) {
        var cleaned = String(value || fallback)
          .trim()
          .replace(/[^a-zA-Z0-9._/-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^\\/+|\\/+$/g, "")
          .slice(0, 80);
        return cleaned || fallback;
      }
      function repoParts(value) {
        var cleaned = token(value, "aryabyte21/pr-captcha");
        var parts = cleaned.split("/");
        return {
          owner: token(parts[0], "aryabyte21"),
          repo: token(parts[1], "pr-captcha")
        };
      }
      function numberText(value, fallback) {
        var cleaned = String(value || "").replace(/[^0-9]/g, "").slice(0, 10);
        return cleaned && Number(cleaned) > 0 ? cleaned : fallback;
      }
      function shaText(value) {
        var cleaned = String(value || "").replace(/[^a-fA-F0-9]/g, "").slice(0, 40);
        return cleaned || "8f31c9a4d2e9b6f1c0a7e5d3b2a190f8e4c6d2b1";
      }
      function envName(value) {
        var cleaned = String(value || "")
          .trim()
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "")
          .slice(0, 64);
        return cleaned || "GITHUB_WEBHOOK_SECRET";
      }
      function checkedSteps() {
        return Array.prototype.slice.call(form.querySelectorAll(".trace-step input")).filter(function (input) {
          return input.checked;
        }).length;
      }
      function curlText(baseUrl, repo, prNumber, headSha, installationId, secretEnv) {
        var env = envName(secretEnv);
        return [
          "WORKER_URL='" + baseUrl + "'",
          "WEBHOOK_SECRET=\\"" + "$" + "{" + env + "}\\"",
          "DELIVERY_ID=\\"pr-captcha-smoke-$(date +%s)\\"",
          "node <<'NODE' >/tmp/pr-captcha-webhook.json",
          "const payload = {",
          "  action: 'opened',",
          "  installation: { id: " + numberText(installationId, "12345678") + " },",
          "  repository: {",
          "    name: '" + repo.repo + "',",
          "    full_name: '" + repo.owner + "/" + repo.repo + "',",
          "    owner: { login: '" + repo.owner + "' },",
          "    default_branch: 'main'",
          "  },",
          "  pull_request: {",
          "    number: " + prNumber + ",",
          "    draft: false,",
          "    html_url: 'https://github.com/" + repo.owner + "/" + repo.repo + "/pull/" + prNumber + "',",
          "    author_association: 'FIRST_TIME_CONTRIBUTOR',",
          "    user: { login: 'some-user', type: 'User' },",
          "    head: { sha: '" + headSha + "', ref: 'pr-captcha-smoke', repo: { full_name: 'some-user/" + repo.repo + "', fork: true, owner: { login: 'some-user' } } },",
          "    base: { ref: 'main', repo: { full_name: '" + repo.owner + "/" + repo.repo + "', owner: { login: '" + repo.owner + "' } } },",
          "    labels: []",
          "  }",
          "};",
          "console.log(JSON.stringify(payload));",
          "NODE",
          "SIGNATURE=$(node -e \\"const crypto=require('crypto');const fs=require('fs');const secret=process.env.WEBHOOK_SECRET;if(!secret)throw new Error('WEBHOOK_SECRET is required');const body=fs.readFileSync('/tmp/pr-captcha-webhook.json');process.stdout.write('sha256='+crypto.createHmac('sha256', secret).update(body).digest('hex'));\\")",
          "curl -i -X POST \\"$WORKER_URL/webhooks/github\\" \\\\",
          "  -H 'content-type: application/json' \\\\",
          "  -H 'x-github-event: pull_request' \\\\",
          "  -H \\"x-github-delivery: $DELIVERY_ID\\" \\\\",
          "  -H \\"x-hub-signature-256: $SIGNATURE\\" \\\\",
          "  --data-binary @/tmp/pr-captcha-webhook.json"
        ].join("\\n");
      }
      function actionYaml(baseUrl) {
        return [
          "name: CI",
          "",
          "on:",
          "  pull_request:",
          "",
          "jobs:",
          "  pr-captcha-human:",
          "    name: pr-captcha / human",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: aryabyte21/pr-captcha/packages/action@v1",
          "        with:",
          "          api-url: " + baseUrl,
          "",
          "  test:",
          "    needs: pr-captcha-human",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "      - run: npm test"
        ].join("\\n");
      }
      function proofText(baseUrl, repo, prNumber, headSha, installationId) {
        return [
          "Gate trace acceptance proof",
          "",
          "Worker: " + baseUrl,
          "Repository: " + repo.owner + "/" + repo.repo,
          "PR: #" + prNumber,
          "Head SHA: " + headSha,
          "Installation ID: " + numberText(installationId, "12345678"),
          "Required check: pr-captcha/human",
          "",
          "Evidence:",
          "- Signed webhook accepted by /webhooks/github.",
          "- Pending gate created for the exact repository, PR number, author, and SHA.",
          "- Gate page requires GitHub OAuth before Turnstile.",
          "- Turnstile token is verified server-side.",
          "- Status API fails while pending and passes only after the exact SHA is verified.",
          "- Check run changes from action_required to success.",
          "",
          "Status probe: " + baseUrl + "/api/v1/verifications/status?owner=" + encodeURIComponent(repo.owner) + "&repo=" + encodeURIComponent(repo.repo) + "&pr=" + encodeURIComponent(prNumber) + "&sha=" + encodeURIComponent(headSha),
          "Ready to require pr-captcha/human"
        ].join("\\n");
      }
      function activePanel() {
        var selected = document.querySelector('[data-trace-tab][aria-selected="true"]');
        var key = selected ? selected.getAttribute("data-trace-tab") : "curl";
        return document.querySelector('[data-trace-panel="' + key + '"] code') || curl;
      }
      function render() {
        var baseUrl = origin(field("worker_url", "https://pr-captcha.example.workers.dev"));
        var repo = repoParts(field("repository", "aryabyte21/pr-captcha"));
        var prNumber = numberText(field("pr_number", "184"), "184");
        var headSha = shaText(field("head_sha", "8f31c9a4d2e9b6f1c0a7e5d3b2a190f8e4c6d2b1"));
        var installationId = numberText(field("installation_id", "12345678"), "12345678");
        var complete = checkedSteps();
        var total = 6;
        var percent = Math.round((complete / total) * 100);
        progress.textContent = complete + " of " + total + " proven";
        progressBar.style.width = percent + "%";
        state.textContent = complete === total ? "ready" : complete > 0 ? "in progress" : "waiting";
        curl.textContent = curlText(baseUrl, repo, prNumber, headSha, installationId, field("secret_env", "GITHUB_WEBHOOK_SECRET"));
        action.textContent = actionYaml(baseUrl);
        proof.textContent = proofText(baseUrl, repo, prNumber, headSha, installationId);
        if (receiptRepo) receiptRepo.textContent = repo.owner + "/" + repo.repo;
        if (receiptPr) receiptPr.textContent = "#" + prNumber;
        if (receiptSha) receiptSha.textContent = headSha.slice(0, 12);
        stages.forEach(function (item, index) {
          item.setAttribute("data-state", index < complete ? "ready" : index === complete ? "active" : "waiting");
        });
        if (complete === total) {
          alert.removeAttribute("data-service-state");
          alert.innerHTML = '<span class="mini-shield">✓</span><div><strong>Ready to require pr-captcha/human</strong><p>The trace proves the webhook, gate, OAuth, CAPTCHA, SHA binding, and check publication path.</p></div>';
        } else {
          alert.setAttribute("data-service-state", "warn");
          alert.innerHTML = '<span class="mini-shield">!</span><div><strong>Trace not complete</strong><p>' + (total - complete) + " proof points still need evidence before branch protection.</p></div>";
        }
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value);
        }
        var textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (_) {
          copied = false;
        }
        textarea.remove();
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
      }
      Array.prototype.slice.call(form.querySelectorAll("input")).forEach(function (input) {
        input.addEventListener("input", render);
        input.addEventListener("change", render);
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-trace-tab]")).forEach(function (tab) {
        tab.addEventListener("click", function () {
          var key = tab.getAttribute("data-trace-tab") || "curl";
          Array.prototype.slice.call(document.querySelectorAll("[data-trace-tab]")).forEach(function (item) {
            item.setAttribute("aria-selected", item === tab ? "true" : "false");
          });
          Array.prototype.slice.call(document.querySelectorAll("[data-trace-panel]")).forEach(function (panel) {
            panel.hidden = panel.getAttribute("data-trace-panel") !== key;
          });
          outputLabel.textContent = key === "action" ? "action guard yaml" : key === "proof" ? "acceptance proof" : "signed webhook curl";
        });
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-copy-trace]")).forEach(function (button) {
        button.addEventListener("click", function () {
          render();
          var key = button.getAttribute("data-copy-trace");
          var target = key === "proof" ? proof : key === "action" ? action : key === "curl" ? curl : activePanel();
          var original = button.textContent || "Copy";
          copyText(target.textContent || "").then(function () {
            button.textContent = "Copied";
            button.setAttribute("data-copied", "true");
            window.setTimeout(function () {
              button.textContent = original;
              button.removeAttribute("data-copied");
            }, 1600);
          }).catch(function () {
            button.textContent = "Copy failed";
            window.setTimeout(function () {
              button.textContent = original;
            }, 1600);
          });
        });
      });
      render();
    })();
  </script>`;
}

function githubAppManifestScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-manifest-form]");
      var output = document.querySelector("[data-manifest-json]");
      var hidden = document.querySelector("[data-manifest-input]");
      var submit = document.querySelector("[data-manifest-submit]");
      var status = document.querySelector("[data-manifest-status]");
      var ready = document.querySelector("[data-manifest-ready]");
      var webhook = document.querySelector("[data-manifest-webhook]");
      var callback = document.querySelector("[data-manifest-callback]");
      var setup = document.querySelector("[data-manifest-setup]");
      var redirect = document.querySelector("[data-manifest-redirect]");
      if (!form || !output || !hidden || !submit || !webhook || !callback || !setup || !redirect) return;
      var state = randomState();

      function field(name, fallback) {
        var input = form.querySelector('[name="' + name + '"]');
        var value = input ? input.value.trim() : "";
        return value || fallback;
      }
      function target() {
        var input = form.querySelector('[name="target"]:checked');
        return input ? input.value : "personal";
      }
      function origin(value) {
        try {
          var url = new URL(value);
          return url.origin;
        } catch (_) {
          return "https://pr-captcha.example.workers.dev";
        }
      }
      function slug(value) {
        return String(value).toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "").slice(0, 39);
      }
      function randomState() {
        if (window.crypto && window.crypto.getRandomValues) {
          var bytes = new Uint8Array(12);
          window.crypto.getRandomValues(bytes);
          return "pr-captcha-" + Array.prototype.map.call(bytes, function (byte) {
            return byte.toString(16).padStart(2, "0");
          }).join("");
        }
        return "pr-captcha-" + Math.random().toString(36).slice(2);
      }
      function manifest(baseUrl, appName) {
        return {
          name: appName,
          url: baseUrl,
          hook_attributes: {
            url: baseUrl + "/webhooks/github",
            active: true
          },
          redirect_url: baseUrl + "/github-app-manifest/callback",
          callback_urls: [baseUrl + "/auth/github/callback"],
          setup_url: baseUrl + "/setup-wizard",
          description: "Human-origin checks for busy pull request queues.",
          public: false,
          setup_on_update: true,
          default_permissions: {
            actions: "write",
            checks: "write",
            contents: "read",
            issues: "write",
            pull_requests: "write"
          },
          default_events: ["pull_request"]
        };
      }
      function setReady(ok, title, body) {
        if (!ready) return;
        ready.setAttribute("data-state", ok ? "ready" : "error");
        ready.innerHTML =
          '<span class="mini-shield">' + (ok ? "✓" : "!") + "</span>" +
          "<div><strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(body) + "</p></div>";
      }
      function render() {
        var baseUrl = origin(field("worker_url", ""));
        var appName = field("app_name", "pr-captcha").slice(0, 34) || "pr-captcha";
        var orgSlug = slug(field("org_slug", ""));
        var payload = manifest(baseUrl, appName);
        var json = JSON.stringify(payload, null, 2);
        webhook.textContent = payload.hook_attributes.url;
        callback.textContent = payload.callback_urls[0];
        setup.textContent = payload.setup_url;
        redirect.textContent = payload.redirect_url;
        output.textContent = json;
        hidden.setAttribute("value", JSON.stringify(payload));
        if (target() === "organization") {
          if (orgSlug) {
            submit.setAttribute("action", "https://github.com/organizations/" + orgSlug + "/settings/apps/new?state=" + encodeURIComponent(state));
            setReady(true, "Ready for organization registration", "Submit only when " + orgSlug + " owns the production GitHub App.");
            if (status) status.textContent = "organization";
          } else {
            submit.setAttribute("action", "https://github.com/settings/apps/new?state=" + encodeURIComponent(state));
            setReady(false, "Organization slug required", "Enter the GitHub organization slug before submitting as an organization app.");
            if (status) status.textContent = "needs org";
          }
        } else {
          submit.setAttribute("action", "https://github.com/settings/apps/new?state=" + encodeURIComponent(state));
          setReady(true, "Ready to create the GitHub App", "Submit only after the Worker URL, OAuth callback, webhook endpoint, and Turnstile site are ready.");
          if (status) status.textContent = "ready";
        }
      }
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      Array.prototype.slice.call(form.querySelectorAll("input")).forEach(function (input) {
        input.addEventListener("input", render);
        input.addEventListener("change", render);
      });
      Array.prototype.slice.call(document.querySelectorAll("[data-copy-manifest]")).forEach(function (button) {
        button.addEventListener("click", function () {
          var original = button.textContent || "Copy manifest";
          render();
          if (!navigator.clipboard) {
            button.textContent = "Copy unavailable";
            window.setTimeout(function () {
              button.textContent = original;
            }, 1800);
            return;
          }
          navigator.clipboard.writeText(output.textContent || "").then(function () {
            button.textContent = "Copied";
            button.setAttribute("data-copied", "true");
            window.setTimeout(function () {
              button.textContent = original;
              button.removeAttribute("data-copied");
            }, 1800);
          }).catch(function () {
            button.textContent = "Copy failed";
            window.setTimeout(function () {
              button.textContent = original;
            }, 1800);
          });
        });
      });
      render();
    })();
  </script>`;
}

function manifestCallbackScript(): string {
  return `<script>
    (function () {
      var button = document.querySelector("[data-copy-manifest-conversion]");
      var script = document.querySelector("[data-manifest-conversion-script]");
      if (!button || !script) return;
      button.addEventListener("click", function () {
        var original = button.textContent || "Copy operator script";
        if (!navigator.clipboard) {
          button.textContent = "Copy unavailable";
          window.setTimeout(function () {
            button.textContent = original;
          }, 1800);
          return;
        }
        navigator.clipboard.writeText(script.textContent || "").then(function () {
          button.textContent = "Copied";
          button.setAttribute("data-copied", "true");
          window.setTimeout(function () {
            button.textContent = original;
            button.removeAttribute("data-copied");
          }, 1800);
        }).catch(function () {
          button.textContent = "Copy failed";
          window.setTimeout(function () {
            button.textContent = original;
          }, 1800);
        });
      });
    })();
  </script>`;
}

function configPreviewScript(): string {
  return `<script>
    (function () {
      var input = document.querySelector("[data-config-input]");
      var previewButton = document.querySelector("[data-preview-config]");
      var exampleButton = document.querySelector("[data-example-config]");
      var status = document.querySelector("[data-preview-status]");
      var policy = document.querySelector("[data-policy-summary]");
      var diagnostics = document.querySelector("[data-diagnostics]");
      var applies = document.querySelector("[data-apply-summary]");
      var example = ${JSON.stringify(configPreviewExampleYaml())};
      if (!input || !previewButton || !status || !policy || !diagnostics || !applies) return;

      function boolLabel(value) {
        return value ? "enabled" : "disabled";
      }
      function setStatus(ok, title, body) {
        status.setAttribute("data-state", ok ? "ready" : "error");
        status.innerHTML =
          '<span class="mini-shield">' + (ok ? "✓" : "!") + "</span>" +
          "<div><strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(body) + "</p></div>";
      }
      function renderPreview(payload) {
        var config = payload.config;
        var applyTo = config.apply_to || {};
        var skip = config.skip || { authors: [], labels: [] };
        setStatus(
          payload.ok,
          payload.ok ? "Ready for branch protection" : "Fix before branch protection",
          payload.config_source === "default"
            ? "Default hybrid policy is active."
            : payload.config_valid
              ? "Repository policy parsed successfully."
              : "Repository policy is invalid and defaults would apply."
        );
        policy.innerHTML = [
          ["Mode", config.mode],
          ["Required check", config.checks.name + " (" + boolLabel(config.checks.create_required_check) + ")"],
          ["Comment", boolLabel(config.comment.enabled)],
          ["Universal gate", config.universal_gate.rerun_after_verification ? "rerun after verification" : "no rerun"],
          ["Skips", (skip.authors || []).join(", ") + " / labels: " + (skip.labels || []).join(", ")]
        ].map(function (row) {
          return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
        }).join("");
        diagnostics.innerHTML = payload.diagnostics.map(function (item) {
          return '<li data-level="' + escapeHtml(item.level) + '"><strong>' + escapeHtml(item.code) + "</strong><span>" + escapeHtml(item.message) + "</span></li>";
        }).join("");
        applies.innerHTML = [
          ["all pull requests", applyTo.all_pull_requests],
          ["first-time contributors", applyTo.first_time_contributors],
          ["outside contributors", applyTo.outside_contributors],
          ["fork PRs", applyTo.fork_prs],
          ["bots", applyTo.bots]
        ].map(function (item) {
          return '<span data-enabled="' + String(Boolean(item[1])) + '">' + escapeHtml(item[0]) + "</span>";
        }).join("");
      }
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function preview() {
        previewButton.setAttribute("disabled", "disabled");
        previewButton.textContent = "Previewing";
        fetch("/api/public/config-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ config: input.value })
        })
          .then(function (response) {
            return response.json().then(function (payload) {
              if (!response.ok) throw new Error(payload.error || "Preview failed");
              return payload;
            });
          })
          .then(renderPreview)
          .catch(function (error) {
            setStatus(false, "Preview failed", error.message || "Try again.");
          })
          .finally(function () {
            previewButton.removeAttribute("disabled");
            previewButton.textContent = "Preview config";
          });
      }
      previewButton.addEventListener("click", preview);
      if (exampleButton) {
        exampleButton.addEventListener("click", function () {
          input.value = example;
          preview();
        });
      }
      preview();
    })();
  </script>`;
}

function setupWizardScript(baseUrl?: string): string {
  return `<script>
    (function () {
      var workerUrl = ${JSON.stringify(baseUrl ?? "https://<worker-domain>")};
      var form = document.querySelector("[data-setup-wizard]");
      var yaml = document.querySelector("[data-wizard-yaml]");
      var generateButton = document.querySelector("[data-generate-policy]");
      var copyButton = document.querySelector("[data-copy-yaml]");
      var previewButton = document.querySelector("[data-preview-generated]");
      var status = document.querySelector("[data-wizard-status]");
      var summary = document.querySelector("[data-wizard-summary]");
      var diagnostics = document.querySelector("[data-wizard-diagnostics]");
      var repositoryInput = document.querySelector("[data-wizard-repository]");
      var scanButton = document.querySelector("[data-wizard-scan]");
      var evidence = document.querySelector("[data-wizard-evidence]");
      var evidenceStatus = document.querySelector("[data-wizard-evidence-status]");
      var recommendation = document.querySelector("[data-wizard-recommendation]");
      var branchProtection = document.querySelector("[data-wizard-branch-protection]");
      var branchState = document.querySelector("[data-wizard-branch-state]");
      var workflowGuard = document.querySelector("[data-wizard-workflow]");
      var acceptanceProof = document.querySelector("[data-wizard-acceptance]");
      var copyWorkflowGuard = document.querySelector("[data-copy-workflow-guard]");
      var copyAcceptanceProof = document.querySelector("[data-copy-acceptance-proof]");
      if (!form || !yaml || !generateButton || !status || !summary || !diagnostics) return;

      function formatNumber(value) {
        return typeof value === "number" ? value.toLocaleString("en-US") : "limited";
      }
      function selectedValue(name) {
        var input = form.querySelector('[name="' + name + '"]:checked');
        return input ? input.value : "";
      }
      function checked(name) {
        var input = form.querySelector('[name="' + name + '"]');
        return Boolean(input && input.checked);
      }
      function inputValue(name) {
        var input = form.querySelector('[name="' + name + '"]');
        return input ? input.value : "";
      }
      function repoValue() {
        return repositoryInput && repositoryInput.value.trim() ? repositoryInput.value.trim() : "kubernetes/kubernetes";
      }
      function repoParts(value) {
        var cleaned = String(value || "kubernetes/kubernetes")
          .trim()
          .replace(/^https?:\\/\\/github\\.com\\//i, "")
          .replace(/^github\\.com\\//i, "")
          .replace(/^\\/+|\\/+$/g, "")
          .replace(/\\.git$/i, "");
        var parts = cleaned.split("/");
        return {
          owner: parts[0] || "kubernetes",
          repo: parts[1] || "kubernetes"
        };
      }
      function setMetric(name, value) {
        var node = document.querySelector("[data-wizard-evidence-" + name + "]");
        if (node) node.textContent = formatNumber(value);
      }
      function updateHandoffLinks() {
        var repo = repoParts(repoValue());
        var repository = repo.owner + "/" + repo.repo;
        var evidenceLink = document.querySelector('[data-wizard-link="evidence"]');
        var pilotLink = document.querySelector('[data-wizard-link="pilot"]');
        var diagnosticsLink = document.querySelector('[data-wizard-link="diagnostics"]');
        var launchLink = document.querySelector('[data-wizard-link="launch"]');
        if (evidenceLink) evidenceLink.href = "/evidence?repo=" + encodeURIComponent(repository);
        if (pilotLink) pilotLink.href = "/pilot?repo=" + encodeURIComponent(repository);
        if (diagnosticsLink) diagnosticsLink.href = "/diagnostics?owner=" + encodeURIComponent(repo.owner) + "&repo=" + encodeURIComponent(repo.repo);
        if (launchLink) launchLink.href = "/launch";
      }
      function setMode(mode) {
        var input = form.querySelector('[name="mode"][value="' + mode + '"]');
        if (input) input.checked = true;
      }
      function modeForEvidence(data) {
        if (data.risk_level === "high") return "hybrid";
        if (data.fork_pull_requests > 0) return "native_fork";
        return "required_check";
      }
      function splitList(value) {
        return String(value)
          .split(",")
          .map(function (item) {
            return item.trim();
          })
          .filter(Boolean);
      }
      function yamlString(value) {
        return "'" + String(value).replaceAll("'", "''") + "'";
      }
      function yamlArray(name, values) {
        if (!values.length) return "  " + name + ": []";
        return "  " + name + ":\\n" + values.map(function (value) {
          return "    - " + yamlString(value);
        }).join("\\n");
      }
      function fallbackCopy(value) {
        var textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        var copied = false;
        try {
          copied = document.execCommand("copy");
        } catch (_) {
          copied = false;
        }
        textarea.remove();
        return copied ? Promise.resolve() : Promise.reject(new Error("Copy unavailable"));
      }
      function copyText(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value).catch(function () {
            return fallbackCopy(value);
          });
        }
        return fallbackCopy(value);
      }
      function selectYaml() {
        if (!window.getSelection) return;
        var range = document.createRange();
        range.selectNodeContents(yaml);
        var selection = window.getSelection();
        if (!selection) return;
        selection.removeAllRanges();
        selection.addRange(range);
      }
      function boolLabel(value) {
        return value ? "enabled" : "disabled";
      }
      function branchProtectionState(config) {
        if (!config.checks.create_required_check) return "advisory";
        if (config.mode === "universal") return "workflow";
        return "protect";
      }
      function workflowNeeded(config) {
        return config.mode === "hybrid" || config.mode === "universal";
      }
      function workflowGuardYaml(config) {
        var apiUrl = workerUrl || "https://<worker-domain>";
        return [
          "name: CI",
          "",
          "on:",
          "  pull_request:",
          "",
          "jobs:",
          "  pr-captcha:",
          "    name: pr-captcha / human",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: aryabyte21/pr-captcha/packages/action@v1",
          "        with:",
          "          api-url: " + apiUrl,
          "",
          "  heavy-ci:",
          "    needs: pr-captcha",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "      - run: npm test"
        ].filter(function (line) {
          return line !== null;
        }).join("\\n");
      }
      function branchRows(config) {
        var repository = repoParts(repoValue()).owner + "/" + repoParts(repoValue()).repo;
        var state = branchProtectionState(config);
        var rows = [
          ["Commit policy", "Add .github/pr-captcha.yml to " + repository + "."],
          ["Install GitHub App", "Grant checks, pull request, issue comment, and workflow permissions."],
          ["Rehearse fork PR", "Open a disposable fork PR and solve the gate as the PR author."],
          ["Require check", config.checks.create_required_check ? "Add " + config.checks.name + " to branch protection." : "Leave branch protection advisory until checks are enabled."],
          ["Workflow guard", workflowNeeded(config) ? "Place the pr-captcha job before heavy CI jobs." : "Optional. Native fork or required-check mode can ship without it."],
          ["Rollback", "Remove " + config.checks.name + " from required checks and keep audit logging on."]
        ];
        if (branchState) branchState.textContent = state;
        return rows;
      }
      function acceptanceText(config) {
        var repo = repoParts(repoValue());
        var repository = repo.owner + "/" + repo.repo;
        return [
          "Repository: " + repository,
          "Policy file: .github/pr-captcha.yml",
          "Mode: " + config.mode,
          "Required check: " + config.checks.name + " (" + boolLabel(config.checks.create_required_check) + ")",
          "Solver: " + (config.require.solver_must_be_pr_author ? "PR author only" : "maintainer override allowed"),
          "Workflow guard: " + (workflowNeeded(config) ? "required before heavy jobs" : "optional"),
          "",
          "Acceptance:",
          "- Signed pull_request webhook creates a pending gate.",
          "- Action fails before the exact head SHA is verified.",
          "- Contributor solves CAPTCHA while logged in to GitHub.",
          "- " + config.checks.name + " is updated to success for the same SHA.",
          "- Action passes after verification.",
          "- Branch protection is enabled only after the fork PR rehearsal passes."
        ].join("\\n");
      }
      function renderInstallHandoff(config) {
        if (branchProtection) {
          branchProtection.innerHTML = branchRows(config).map(function (row) {
            return "<li><strong>" + escapeHtml(row[0]) + "</strong><span>" + escapeHtml(row[1]) + "</span></li>";
          }).join("");
        }
        if (workflowGuard) workflowGuard.textContent = workflowGuardYaml(config);
        if (acceptanceProof) acceptanceProof.textContent = acceptanceText(config);
      }
      function setStatus(ok, title, body) {
        status.setAttribute("data-state", ok ? "ready" : "error");
        status.innerHTML =
          '<span class="mini-shield">' + (ok ? "✓" : "!") + "</span>" +
          "<div><strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(body) + "</p></div>";
      }
      function buildYaml() {
        var mode = selectedValue("mode") || "hybrid";
        var maintainerOverride = checked("maintainer_override");
        return [
          "mode: " + mode,
          "",
          "captcha:",
          "  provider: cloudflare_turnstile",
          "",
          "require:",
          "  github_login: true",
          "  solver_must_be_pr_author: " + String(checked("require_pr_author") && !maintainerOverride),
          "  new_sha_requires_new_captcha: true",
          "",
          "apply_to:",
          "  all_pull_requests: " + String(checked("all_pull_requests")),
          "  first_time_contributors: " + String(checked("first_time_contributors")),
          "  outside_contributors: " + String(checked("outside_contributors")),
          "  fork_prs: " + String(checked("fork_prs")),
          "  bots: " + String(checked("bots")),
          "",
          "skip:",
          yamlArray("authors", splitList(inputValue("skip_authors"))),
          yamlArray("labels", splitList(inputValue("skip_labels"))),
          "",
          "checks:",
          "  create_required_check: " + String(checked("create_required_check") || mode === "required_check"),
          "  name: pr-captcha/human",
          "",
          "comment:",
          "  enabled: " + String(checked("post_comment")),
          "  tone: direct",
          "",
          "universal_gate:",
          "  rerun_after_verification: " + String(checked("rerun_after_verification"))
        ].join("\\n");
      }
      function renderYaml() {
        yaml.textContent = buildYaml();
      }
      function renderEvidence(data) {
        var recommendedMode = modeForEvidence(data);
        setMode(recommendedMode);
        if (evidence) evidence.setAttribute("data-risk", data.risk_level || "medium");
        if (evidenceStatus) evidenceStatus.textContent = data.partial ? "partial" : data.risk_level;
        if (recommendation) recommendation.textContent = data.recommendation || "Repository evidence scanned.";
        setMetric("open", data.open_pull_requests);
        setMetric("fork", data.fork_pull_requests);
        setMetric("unknown", data.unknown_authors);
        setMetric("bots", data.bot_pull_requests);
        setMetric("stale", data.stale_pull_requests);
        setMetric("spam", data.spam_label_matches);
        renderYaml();
        previewGenerated();
      }
      function scanEvidence() {
        if (!scanButton) return;
        updateHandoffLinks();
        scanButton.disabled = true;
        scanButton.textContent = "Scanning";
        if (evidenceStatus) evidenceStatus.textContent = "loading";
        fetch("/api/public/repo-evidence?repo=" + encodeURIComponent(repoValue()), {
          headers: {
            Accept: "application/json"
          }
        }).then(function (response) {
          return response.json().then(function (payload) {
            if (!response.ok) throw new Error(payload.error || "Evidence scan failed");
            return payload;
          });
        }).then(renderEvidence).catch(function (error) {
          if (evidence) evidence.setAttribute("data-risk", "error");
          if (evidenceStatus) evidenceStatus.textContent = "failed";
          if (recommendation) recommendation.textContent = error && error.message ? error.message : "Evidence scan failed.";
        }).finally(function () {
          scanButton.disabled = false;
          scanButton.textContent = "Scan public evidence";
        });
      }
      function renderPreview(payload) {
        var config = payload.config;
        setStatus(
          payload.ok,
          payload.ok ? "Ready for branch protection" : "Fix before branch protection",
          payload.config_valid
            ? "Generated policy parsed successfully."
            : "Generated policy is invalid and defaults would apply."
        );
        summary.innerHTML = [
          ["Mode", config.mode],
          ["Required check", config.checks.name + " (" + boolLabel(config.checks.create_required_check) + ")"],
          ["Comment", boolLabel(config.comment.enabled)],
          ["Workflow gate", config.universal_gate.rerun_after_verification ? "rerun after verification" : "manual rerun"],
          ["Solver", config.require.solver_must_be_pr_author ? "PR author only" : "trusted maintainer override allowed"]
        ].map(function (row) {
          return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
        }).join("");
        diagnostics.innerHTML = payload.diagnostics.map(function (item) {
          return '<li data-level="' + escapeHtml(item.level) + '"><strong>' + escapeHtml(item.code) + "</strong><span>" + escapeHtml(item.message) + "</span></li>";
        }).join("");
        renderInstallHandoff(config);
      }
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function previewGenerated() {
        renderYaml();
        generateButton.setAttribute("disabled", "disabled");
        if (previewButton) previewButton.setAttribute("disabled", "disabled");
        generateButton.textContent = "Generating";
        fetch("/api/public/config-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ config: yaml.textContent || "" })
        })
          .then(function (response) {
            return response.json().then(function (payload) {
              if (!response.ok) throw new Error(payload.error || "Preview failed");
              return payload;
            });
          })
          .then(renderPreview)
          .catch(function (error) {
            setStatus(false, "Preview failed", error.message || "Try again.");
          })
          .finally(function () {
            generateButton.removeAttribute("disabled");
            if (previewButton) previewButton.removeAttribute("disabled");
            generateButton.textContent = "Generate policy";
          });
      }
      form.addEventListener("change", renderYaml);
      form.addEventListener("input", renderYaml);
      if (repositoryInput) {
        repositoryInput.addEventListener("input", updateHandoffLinks);
      }
      if (scanButton) {
        scanButton.addEventListener("click", scanEvidence);
      }
      generateButton.addEventListener("click", previewGenerated);
      if (previewButton) {
        previewButton.addEventListener("click", previewGenerated);
      }
      if (copyButton) {
        var defaultCopyLabel = copyButton.textContent || "Copy YAML";
        copyButton.addEventListener("click", function () {
          renderYaml();
          copyText(yaml.textContent || "").then(function () {
            copyButton.textContent = "Copied";
            copyButton.setAttribute("data-copied", "true");
            window.setTimeout(function () {
              copyButton.textContent = defaultCopyLabel;
              copyButton.removeAttribute("data-copied");
            }, 1800);
          }).catch(function () {
            selectYaml();
            copyButton.textContent = "Select YAML";
            window.setTimeout(function () {
              copyButton.textContent = defaultCopyLabel;
            }, 1800);
          });
        });
      }
      if (copyWorkflowGuard && workflowGuard) {
        var defaultWorkflowLabel = copyWorkflowGuard.textContent || "Copy workflow";
        copyWorkflowGuard.addEventListener("click", function () {
          copyText(workflowGuard.textContent || "").then(function () {
            copyWorkflowGuard.textContent = "Copied";
            window.setTimeout(function () {
              copyWorkflowGuard.textContent = defaultWorkflowLabel;
            }, 1800);
          }).catch(function () {
            copyWorkflowGuard.textContent = "Copy failed";
            window.setTimeout(function () {
              copyWorkflowGuard.textContent = defaultWorkflowLabel;
            }, 1800);
          });
        });
      }
      if (copyAcceptanceProof && acceptanceProof) {
        var defaultProofLabel = copyAcceptanceProof.textContent || "Copy proof";
        copyAcceptanceProof.addEventListener("click", function () {
          copyText(acceptanceProof.textContent || "").then(function () {
            copyAcceptanceProof.textContent = "Copied";
            window.setTimeout(function () {
              copyAcceptanceProof.textContent = defaultProofLabel;
            }, 1800);
          }).catch(function () {
            copyAcceptanceProof.textContent = "Copy failed";
            window.setTimeout(function () {
              copyAcceptanceProof.textContent = defaultProofLabel;
            }, 1800);
          });
        });
      }
      renderYaml();
      renderInstallHandoff({
        mode: selectedValue("mode") || "hybrid",
        checks: {
          create_required_check: checked("create_required_check"),
          name: "pr-captcha/human"
        },
        require: {
          solver_must_be_pr_author: checked("require_pr_author") && !checked("maintainer_override")
        }
      });
      updateHandoffLinks();
      previewGenerated();
    })();
  </script>`;
}

function repositoryDiagnosticsScript(): string {
  return `<script>
    (function () {
      var form = document.querySelector("[data-diagnostics-form]");
      var runButton = document.querySelector("[data-run-diagnostics]");
      var status = document.querySelector("[data-diagnostics-status]");
      var repository = document.querySelector("[data-diagnostics-repository]");
      var policy = document.querySelector("[data-diagnostics-policy]");
      var diagnostics = document.querySelector("[data-diagnostics-list]");
      var audit = document.querySelector("[data-diagnostics-audit]");
      if (!form || !runButton || !status || !repository || !policy || !diagnostics || !audit) return;

      function field(name) {
        var input = form.querySelector('[name="' + name + '"]');
        return input ? input.value.trim() : "";
      }
      function boolLabel(value) {
        return value ? "enabled" : "disabled";
      }
      function setStatus(ok, title, body) {
        status.setAttribute("data-state", ok ? "ready" : "error");
        status.innerHTML =
          '<span class="mini-shield">' + (ok ? "✓" : "!") + "</span>" +
          "<div><strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(body) + "</p></div>";
      }
      function renderRows(target, rows) {
        target.innerHTML = rows.map(function (row) {
          return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
        }).join("");
      }
      function renderDiagnostics(items) {
        diagnostics.innerHTML = items.map(function (item) {
          return '<li data-level="' + escapeHtml(item.level) + '"><strong>' + escapeHtml(item.code) + "</strong><span>" + escapeHtml(item.message) + "</span></li>";
        }).join("");
      }
      function renderPayload(payload) {
        var config = payload.config;
        var repo = payload.repository;
        setStatus(
          payload.ok,
          payload.ok ? "Repository readable" : "Policy needs fixes",
          payload.config_valid
            ? "GitHub App access and repository policy are valid."
            : "Repository access works, but the policy needs attention."
        );
        renderRows(repository, [
          ["Repository", repo.full_name],
          ["Installation", repo.installation_id],
          ["Default branch", repo.default_branch],
          ["Ref inspected", repo.ref],
          ["Config source", payload.config_source]
        ]);
        renderRows(policy, [
          ["Mode", config.mode],
          ["Required check", config.checks.name + " (" + boolLabel(config.checks.create_required_check) + ")"],
          ["Comment", boolLabel(config.comment.enabled)],
          ["Workflow gate", config.universal_gate.rerun_after_verification ? "rerun after verification" : "manual rerun"],
          ["Config valid", String(Boolean(payload.config_valid))]
        ]);
        renderDiagnostics(payload.diagnostics || []);
        audit.innerHTML =
          "<strong>diagnostics.checked</strong><span>" +
          escapeHtml(repo.full_name + " at " + repo.ref) +
          "</span>";
      }
      function renderError(error) {
        setStatus(false, "Diagnostics failed", error.message || "Try again.");
        renderDiagnostics([
          {
            level: "error",
            code: "diagnostics_failed",
            message: error.message || "The diagnostics request failed."
          }
        ]);
        audit.innerHTML = "<strong>diagnostics.not_written</strong><span>No audit event was confirmed.</span>";
      }
      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var owner = field("owner");
        var repo = field("repo");
        var installationId = field("installation_id");
        var token = field("admin_token");
        var ref = field("ref");
        if (!owner || !repo || !installationId || !token) {
          renderError(new Error("Owner, repository, installation id, and admin token are required."));
          return;
        }
        var params = new URLSearchParams({ installation_id: installationId });
        if (ref) params.set("ref", ref);
        runButton.setAttribute("disabled", "disabled");
        runButton.textContent = "Running";
        fetch(
          "/api/admin/repositories/" +
            encodeURIComponent(owner) +
            "/" +
            encodeURIComponent(repo) +
            "/diagnostics?" +
            params.toString(),
          {
            headers: {
              Accept: "application/json",
              Authorization: "Bearer " + token
            }
          }
        )
          .then(function (response) {
            return response.json().then(function (payload) {
              if (!response.ok) throw new Error(payload.error || "Diagnostics failed");
              return payload;
            });
          })
          .then(renderPayload)
          .catch(renderError)
          .finally(function () {
            runButton.removeAttribute("disabled");
            runButton.textContent = "Run diagnostics";
          });
      });
    })();
  </script>`;
}

function statusPageScript(): string {
  return `<script>
    (function () {
      var overall = document.querySelector("[data-status-overall]");
      var details = document.querySelector("[data-status-details]");
      var actions = document.querySelector("[data-status-actions]");
      var raw = document.querySelector("[data-status-json]");
      var checked = document.querySelector("[data-status-checked]");
      var refreshButton = document.querySelector("[data-refresh-status]");
      if (!overall || !details || !actions || !raw) return;

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      }
      function stateText(state) {
        if (state === "ready") return "ready";
        if (state === "warn") return "needs setup";
        if (state === "error") return "failing";
        return "checking";
      }
      function setOverall(state, title, body) {
        overall.setAttribute("data-state", state === "error" ? "error" : "ready");
        overall.setAttribute("data-service-state", state);
        overall.innerHTML =
          '<span class="mini-shield">' + (state === "error" ? "!" : "✓") + "</span>" +
          "<div><strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(body) + "</p></div>";
      }
      function setTile(id, state, label) {
        var tile = document.querySelector('[data-status-tile="' + id + '"]');
        if (!tile) return;
        tile.setAttribute("data-state", state);
        var mark = tile.querySelector(".status-mark");
        var statusLabel = tile.querySelector("[data-status-label]");
        if (mark) mark.setAttribute("data-state", state);
        if (statusLabel) statusLabel.textContent = label || stateText(state);
      }
      function renderRows(rows) {
        details.innerHTML = rows.map(function (row) {
          return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
        }).join("");
      }
      function renderActions(items) {
        actions.innerHTML = items.map(function (item) {
          return '<li data-level="' + escapeHtml(item.level) + '"><strong>' + escapeHtml(item.title) + "</strong><span>" + escapeHtml(item.body) + "</span></li>";
        }).join("");
      }
      function checkedLabel(result) {
        if (!result || result.status === 0) return "unreachable";
        var ms = typeof result.ms === "number" ? " in " + result.ms + " ms" : "";
        return "HTTP " + result.status + ms;
      }
      function fetchJson(path) {
        var started = Date.now();
        return fetch(path, { headers: { Accept: "application/json" } })
          .then(function (response) {
            return response.json().catch(function () {
              return {};
            }).then(function (payload) {
              return {
                ok: response.ok && payload.ok === true,
                status: response.status,
                ms: Date.now() - started,
                payload: payload
              };
            });
          })
          .catch(function (error) {
            return {
              ok: false,
              status: 0,
              ms: Date.now() - started,
              payload: { error: error.message || "Request failed" }
            };
          });
      }
      function run() {
        if (refreshButton) {
          refreshButton.setAttribute("disabled", "disabled");
          refreshButton.textContent = "Refreshing";
        }
        setOverall("checking", "Checking service", "Loading public health checks.");
        setTile("worker", "checking", "checking");
        setTile("ready", "checking", "checking");
        setTile("database", "checking", "checking");
        setTile("config", "checking", "checking");
        Promise.all([fetchJson("/health"), fetchJson("/health/ready")])
          .then(function (results) {
            var health = results[0];
            var readiness = results[1];
            var missing = Array.isArray(readiness.payload.missing) ? readiness.payload.missing : [];
            var warnings = Array.isArray(readiness.payload.warnings) ? readiness.payload.warnings : [];
            var databaseOk = readiness.payload.database === true;
            var configOk = missing.length === 0;
            var productionReady = readiness.payload.production_ready === true;
            var workerState = health.ok ? "ready" : "error";
            var readinessState = readiness.ok ? (productionReady ? "ready" : "warn") : health.ok ? "warn" : "error";
            var databaseState = databaseOk ? "ready" : "error";
            var configState = configOk && !warnings.length ? "ready" : "warn";
            setTile("worker", workerState, health.ok ? "online" : "failing");
            setTile("ready", readinessState, productionReady ? "production ready" : readiness.ok ? "warnings" : "not ready");
            setTile("database", databaseState, databaseOk ? "queryable" : "unavailable");
            setTile("config", configState, configOk && !warnings.length ? "complete" : configOk ? "warnings" : "missing");
            if (productionReady) {
              setOverall("ready", "Service ready", "Worker, D1, and required configuration checks are passing.");
              renderActions([
                { level: "info", title: "Ready", body: "Run repository diagnostics before installing branch protection." },
                { level: "info", title: "Install path", body: "Use the setup wizard, then require pr-captcha/human where appropriate." }
              ]);
            } else if (readiness.ok) {
              setOverall("warn", "Production warnings", "The Worker responds and D1 is queryable, but production warnings remain.");
              renderActions(warnings.length ? warnings.map(function (warning) {
                return {
                  level: "warning",
                  title: warning.code || "warning",
                  body: warning.message || "Review this production warning."
                };
              }) : [
                { level: "warning", title: "Inspect readiness", body: "Review /health/ready before requiring the check." }
              ]);
            } else if (health.ok) {
              setOverall("warn", "Setup incomplete", "The Worker responds, but readiness checks are not all passing.");
              var items = [];
              if (missing.length) {
                items.push({ level: "warning", title: "Set missing configuration", body: missing.join(", ") });
              }
              if (!databaseOk) {
                items.push({ level: "error", title: "Check D1", body: "Bind D1 and apply migrations before production traffic." });
              }
              if (!items.length) {
                items.push({ level: "warning", title: "Inspect readiness", body: "Open operations docs and retry health checks." });
              }
              renderActions(items);
            } else {
              setOverall("error", "Service unavailable", "The public Worker heartbeat did not pass.");
              renderActions([
                { level: "error", title: "Worker unreachable", body: "Check Worker deploy, route, and Cloudflare service status." }
              ]);
            }
            renderRows([
              ["Worker", checkedLabel(health)],
              ["Readiness", checkedLabel(readiness)],
              ["D1 database", databaseOk ? "queryable" : "not queryable"],
              ["Configuration", configOk ? "all required names present" : "missing: " + missing.join(", ")],
              ["Production ready", productionReady ? "yes" : "no"],
              ["Warnings", warnings.length ? warnings.map(function (warning) { return warning.code || "warning"; }).join(", ") : "none"],
              ["Service", readiness.payload.service || health.payload.service || "pr-captcha"]
            ]);
            raw.textContent = JSON.stringify({ health: health, readiness: readiness }, null, 2);
            if (checked) checked.textContent = "checked " + new Date().toLocaleTimeString();
          })
          .finally(function () {
            if (refreshButton) {
              refreshButton.removeAttribute("disabled");
              refreshButton.textContent = "Refresh status";
            }
          });
      }
      if (refreshButton) refreshButton.addEventListener("click", run);
      run();
    })();
  </script>`;
}

export function renderFaviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect x="3" y="3" width="42" height="42" rx="12" fill="#080d14"/>
    <path fill="#fff" fill-rule="evenodd" d="M17 36V13h10.3C34 13 38 16.8 38 22.3S34 31.8 27.3 31.8H23V36h-6Zm6-10.2h4c3 0 4.8-1.3 4.8-3.5S30 18.8 27 18.8h-4v7Z"/>
    <circle cx="35" cy="35" r="5" fill="#16a35c"/>
  </svg>`;
}

export function renderBadgeSvg(
  input: {
    label?: string | undefined;
    message?: string | undefined;
    tone?: string | undefined;
    style?: string | undefined;
  } = {},
): string {
  const label = badgeText(input.label, "protected by");
  const message = badgeText(input.message, "pr-captcha");
  const tone = badgeTone(input.tone);
  const style = badgeStyle(input.style);
  const leftWidth = badgeWidth(label);
  const rightWidth = badgeWidth(message);
  const width = leftWidth + rightWidth;
  const radius = style === "flat" ? 0 : 6;
  const messageColor =
    tone === "black" ? "#080d14" : tone === "amber" ? "#b45309" : "#109b55";
  const title = `${label} ${message}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" viewBox="0 0 ${width} 28" role="img" aria-label="${escapeXml(title)}">
    <title>${escapeXml(title)}</title>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
      <stop offset="1" stop-color="#000" stop-opacity=".08"/>
    </linearGradient>
    <clipPath id="r"><rect width="${width}" height="28" rx="${radius}"/></clipPath>
    <g clip-path="url(#r)">
      <rect width="${leftWidth}" height="28" fill="#080d14"/>
      <rect x="${leftWidth}" width="${rightWidth}" height="28" fill="${messageColor}"/>
      <rect width="${width}" height="28" fill="url(#s)"/>
    </g>
    <g fill="#fff" font-family="Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12" font-weight="750" text-anchor="middle">
      <text x="${Math.round(leftWidth / 2)}" y="18">${escapeXml(label)}</text>
      <text x="${leftWidth + Math.round(rightWidth / 2)}" y="18">${escapeXml(message)}</text>
    </g>
  </svg>`;
}

export function renderProofCardSvg(
  input: {
    repo?: string | undefined;
    pr?: string | undefined;
    sha?: string | undefined;
    user?: string | undefined;
    result?: string | undefined;
    theme?: string | undefined;
  } = {},
): string {
  const repo = proofText(input.repo, "octo-org/awesome-repo", 44);
  const pr = proofNumber(input.pr, "184");
  const sha = proofText(input.sha, "8f31c9a", 18);
  const user = proofText(input.user, "some-user", 28);
  const result = proofResult(input.result);
  const theme = proofTheme(input.theme);
  const title = `${repo} #${pr} ${result}`;
  const isDark = theme === "dark";
  const isCompact = theme === "compact";
  const background = isDark ? "#080d14" : "#ffffff";
  const card = isDark ? "#111a25" : "#ffffff";
  const text = isDark ? "#f8fbff" : "#080d14";
  const muted = isDark ? "#aab5c4" : "#384452";
  const line = isDark ? "#263241" : "#d9dee6";
  const stateColor =
    result === "verified"
      ? "#109b55"
      : result === "pending"
        ? "#b45309"
        : "#c8372d";
  const stateLabel =
    result === "verified"
      ? "Human verified"
      : result === "pending"
        ? "Verification pending"
        : "Verification denied";
  const stateCopy =
    result === "verified"
      ? "GitHub login and CAPTCHA solved for this exact PR head SHA."
      : result === "pending"
        ? "The PR waits until a GitHub-authenticated human verifies this SHA."
        : "The gate did not produce a human-origin signal for this SHA.";
  const cardX = isCompact ? 90 : 70;
  const cardY = isCompact ? 86 : 70;
  const cardWidth = isCompact ? 1020 : 1060;
  const cardHeight = isCompact ? 458 : 490;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
    <title>${escapeXml(title)}</title>
    <rect width="1200" height="630" fill="${background}"/>
    <defs>
      <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse">
        <path d="M52 0H0v52" fill="none" stroke="${line}" stroke-opacity=".65" stroke-width="1"/>
      </pattern>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#080d14" flood-opacity="${isDark ? ".26" : ".12"}"/>
      </filter>
    </defs>
    <rect width="1200" height="630" fill="url(#grid)" opacity="${isDark ? ".18" : ".7"}"/>
    <g transform="translate(${cardX} ${cardY})" filter="url(#shadow)">
      <rect width="${cardWidth}" height="${cardHeight}" rx="10" fill="${card}" stroke="${line}"/>
      <rect width="${cardWidth}" height="70" rx="10" fill="#080d14"/>
      <path d="M0 60h${cardWidth}v20H0z" fill="#080d14"/>
      <g transform="translate(26 17)">
        <rect width="36" height="36" rx="10" fill="#ffffff"/>
        <path fill="#080d14" fill-rule="evenodd" d="M13 27V10h7.8c5 0 8 2.8 8 6.9 0 4.2-3 7.1-8 7.1h-3.2v3H13Zm4.6-7.4h3c2.2 0 3.6-1 3.6-2.7s-1.4-2.7-3.8-2.7h-2.8v5.4Z"/>
        <circle cx="27" cy="27" r="4" fill="#109b55"/>
      </g>
      <text x="78" y="46" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="25" font-weight="860" fill="#ffffff">pr-captcha</text>
      <text x="${cardWidth - 28}" y="44" text-anchor="end" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="720" fill="#cbd3df">proof card</text>
      <g transform="translate(36 116)">
        <text x="0" y="0" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="${isCompact ? "48" : "58"}" font-weight="900" fill="${text}">
          <tspan x="0" dy="0">${escapeXml(repo)}</tspan>
          <tspan x="0" dy="${isCompact ? "58" : "68"}">PR #${escapeXml(pr)}</tspan>
        </text>
        <g transform="translate(0 ${isCompact ? "134" : "154"})">
          <rect width="${isCompact ? "342" : "386"}" height="58" rx="8" fill="${stateColor}"/>
          <path d="m26 30 9 9 19-23" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="6"/>
          <text x="72" y="37" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="23" font-weight="860" fill="#fff">${escapeXml(stateLabel)}</text>
        </g>
        <text x="0" y="${isCompact ? "238" : "264"}" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="25" font-weight="620" fill="${muted}">
          <tspan x="0" dy="0">${escapeXml(stateCopy)}</tspan>
          <tspan x="0" dy="38">No patch checkout. Verification is bound to one commit.</tspan>
        </text>
      </g>
      <g transform="translate(${isCompact ? "640" : "664"} 124)">
        ${proofMetaRow("Repository", repo, text, muted, line, 0)}
        ${proofMetaRow("Commit", sha, text, muted, line, 86)}
        ${proofMetaRow("GitHub user", user, text, muted, line, 172)}
        ${proofMetaRow("Trust boundary", "metadata only", text, muted, line, 258)}
      </g>
      <text x="36" y="${cardHeight - 34}" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="18" font-weight="720" fill="${muted}">Make AI slop prove a human is present.</text>
      <text x="${cardWidth - 36}" y="${cardHeight - 34}" text-anchor="end" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="18" font-weight="720" fill="${muted}">one user / one commit / one signal</text>
    </g>
  </svg>`;
}

export function renderScorecardSvg(
  input: {
    repo?: string | undefined;
    risk?: string | undefined;
    open?: string | undefined;
    fork?: string | undefined;
    unknown?: string | undefined;
    labels?: string | undefined;
    recommendation?: string | undefined;
    theme?: string | undefined;
  } = {},
): string {
  const repo = scorecardText(input.repo, "tldraw/tldraw", 44);
  const risk = scorecardRisk(input.risk);
  const open = scorecardNumber(input.open, "85");
  const fork = scorecardNumber(input.fork, "0");
  const unknown = scorecardNumber(input.unknown, "0");
  const labels = scorecardNumber(input.labels, "0");
  const recommendation = scorecardText(
    input.recommendation,
    scorecardRecommendation(risk),
    112,
  );
  const theme = scorecardTheme(input.theme);
  const isDark = theme === "dark";
  const background = isDark ? "#080d14" : "#ffffff";
  const card = isDark ? "#111a25" : "#ffffff";
  const text = isDark ? "#f8fbff" : "#080d14";
  const muted = isDark ? "#aab5c4" : "#384452";
  const line = isDark ? "#263241" : "#d9dee6";
  const soft = isDark ? "#152433" : "#f8fafc";
  const riskColor =
    risk === "high" ? "#c8372d" : risk === "medium" ? "#b45309" : "#109b55";
  const riskSoft =
    risk === "high" ? "#fff1f2" : risk === "medium" ? "#fffbeb" : "#ecfdf3";
  const title = `${repo} ${risk} PR queue risk`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
    <title>${escapeXml(title)}</title>
    <rect width="1200" height="630" fill="${background}"/>
    <defs>
      <pattern id="scorecard-grid" width="52" height="52" patternUnits="userSpaceOnUse">
        <path d="M52 0H0v52" fill="none" stroke="${line}" stroke-opacity=".65" stroke-width="1"/>
      </pattern>
      <filter id="scorecard-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#080d14" flood-opacity="${isDark ? ".28" : ".12"}"/>
      </filter>
    </defs>
    <rect width="1200" height="630" fill="url(#scorecard-grid)" opacity="${isDark ? ".18" : ".72"}"/>
    <g transform="translate(70 66)" filter="url(#scorecard-shadow)">
      <rect width="1060" height="500" rx="10" fill="${card}" stroke="${line}"/>
      <rect width="1060" height="72" rx="10" fill="#080d14"/>
      <path d="M0 60h1060v20H0z" fill="#080d14"/>
      <g transform="translate(28 18)">
        <rect width="36" height="36" rx="10" fill="#ffffff"/>
        <path fill="#080d14" fill-rule="evenodd" d="M13 27V10h7.8c5 0 8 2.8 8 6.9 0 4.2-3 7.1-8 7.1h-3.2v3H13Zm4.6-7.4h3c2.2 0 3.6-1 3.6-2.7s-1.4-2.7-3.8-2.7h-2.8v5.4Z"/>
        <circle cx="27" cy="27" r="4" fill="#109b55"/>
      </g>
      <text x="80" y="47" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="25" font-weight="860" fill="#ffffff">pr-captcha</text>
      <text x="1032" y="46" text-anchor="end" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="720" fill="#cbd3df">OSS PR queue scorecard</text>
      <g transform="translate(38 126)">
        <text x="0" y="0" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="60" font-weight="920" fill="${text}">${escapeXml(repo)}</text>
        <g transform="translate(0 48)">
          <rect width="270" height="58" rx="8" fill="${riskColor}"/>
          <path d="m25 30 9 9 19-23" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="6"/>
          <text x="72" y="38" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="24" font-weight="880" fill="#fff">${escapeXml(risk.toUpperCase())} RISK</text>
        </g>
        <text x="0" y="156" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="25" font-weight="620" fill="${muted}">
          <tspan x="0" dy="0">${escapeXml(recommendation.slice(0, 70))}</tspan>
          <tspan x="0" dy="36">${escapeXml(recommendation.slice(70))}</tspan>
        </text>
      </g>
      <g transform="translate(38 342)">
        ${scorecardMetric("Open PRs", open, text, muted, line, soft, 0)}
        ${scorecardMetric("Fork PRs", fork, text, muted, line, soft, 244)}
        ${scorecardMetric("Unknown authors", unknown, text, muted, line, soft, 488)}
        ${scorecardMetric("Spam labels", labels, text, muted, line, soft, 732)}
      </g>
      <g transform="translate(760 126)">
        <rect width="260" height="164" rx="10" fill="${riskSoft}" stroke="${riskColor}" stroke-opacity=".42"/>
        <text x="24" y="44" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="820" fill="${riskColor}">Recommended next step</text>
        <text x="24" y="82" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="23" font-weight="900" fill="#080d14">${risk === "high" ? "Require pilot" : risk === "medium" ? "Pilot first" : "Audit first"}</text>
        <text x="24" y="120" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="650" fill="#384452">
          <tspan x="24" dy="0">Scan evidence, plan rollout,</tspan>
          <tspan x="24" dy="24">then protect pr-captcha/human.</tspan>
        </text>
      </g>
      <text x="38" y="470" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="18" font-weight="720" fill="${muted}">Live GitHub evidence. No patch checkout. Human-origin gate before maintainer work.</text>
      <text x="1022" y="470" text-anchor="end" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="18" font-weight="800" fill="${muted}">protected by pr-captcha</text>
    </g>
  </svg>`;
}

export function renderOpenGraphImageSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#ffffff"/>
    <path d="M0 0h1200v630H0z" fill="url(#grid)"/>
    <defs>
      <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M64 0H0v64" fill="none" stroke="#e8edf3" stroke-width="1"/>
      </pattern>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#080d14" flood-opacity="0.16"/>
      </filter>
    </defs>
    <g transform="translate(64 58)">
      <rect x="0" y="0" width="48" height="48" rx="13" fill="#080d14"/>
      <path fill="#fff" fill-rule="evenodd" d="M17 36V13h10.3C34 13 38 16.8 38 22.3S34 31.8 27.3 31.8H23V36h-6Zm6-10.2h4c3 0 4.8-1.3 4.8-3.5S30 18.8 27 18.8h-4v7Z"/>
      <circle cx="35" cy="35" r="5" fill="#109b55"/>
      <text x="64" y="34" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="31" font-weight="850" fill="#080d14">pr-captcha</text>
    </g>
    <g transform="translate(64 146)">
      <text x="0" y="0" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="78" font-weight="900" fill="#080d14">
        <tspan x="0" dy="0">Make AI slop prove</tspan>
        <tspan x="0" dy="84">a human is present.</tspan>
      </text>
      <text x="0" y="210" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="30" font-weight="520" fill="#384452">
        <tspan x="0" dy="0">GitHub login, browser verification, exact commit SHA.</tspan>
        <tspan x="0" dy="42">No AI detection. No PR code run.</tspan>
      </text>
      <g transform="translate(0 318)">
        <rect width="56" height="56" rx="14" fill="#109b55"/>
        <path d="m17 29 8 8 16-20" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="6"/>
        <text x="76" y="36" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="30" font-weight="850" fill="#080d14">One user. One commit. No PR code run.</text>
      </g>
    </g>
    <g transform="translate(724 110)" filter="url(#shadow)">
      <rect width="400" height="386" rx="10" fill="#fff" stroke="#d9dee6"/>
      <rect width="400" height="58" rx="10" fill="#080d14"/>
      <path d="M0 48h400v20H0z" fill="#080d14"/>
      <text x="24" y="38" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="19" font-weight="850" fill="#fff">octo-org / awesome-repo</text>
      <text x="285" y="38" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="600" fill="#b8c0cc">PR #184</text>
      <text x="24" y="104" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="25" font-weight="850" fill="#080d14">Add feature <tspan fill="#697586">#184</tspan></text>
      <g transform="translate(24 136)">
        <rect width="352" height="74" rx="8" fill="#fffdf8" stroke="#d9dee6"/>
        <circle cx="22" cy="28" r="8" fill="none" stroke="#f3a000" stroke-width="3"/>
        <text x="46" y="27" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="820" fill="#080d14">GitHub Actions / ci.yml</text>
        <text x="294" y="27" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="600" fill="#5b6673">Held</text>
        <text x="46" y="52" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="500" fill="#5b6673">Waiting for human verification.</text>
      </g>
      <g transform="translate(24 210)">
        <rect width="352" height="82" rx="8" fill="#ffffff" stroke="#d9dee6"/>
        <rect x="15" y="20" width="24" height="24" rx="7" fill="#080d14"/>
        <path fill="#fff" d="M23 37V25h5.2c3.4 0 5.4 1.9 5.4 4.7s-2 4.8-5.4 4.8h-2.1V37H23Zm3.1-5.1h2c1.5 0 2.4-.7 2.4-1.8 0-1.1-.9-1.8-2.4-1.8h-2v3.6Z"/>
        <circle cx="35" cy="37" r="3" fill="#109b55"/>
        <text x="54" y="34" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="850" fill="#080d14">pr-captcha / human</text>
        <text x="286" y="34" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="600" fill="#5b6673">Waiting</text>
        <text x="54" y="58" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="500" fill="#5b6673">Bound to exact head SHA.</text>
      </g>
      <g transform="translate(24 318)">
        <rect width="352" height="44" rx="8" fill="#080d14"/>
        <text x="94" y="29" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="17" font-weight="850" fill="#fff">Mark PR as human</text>
      </g>
    </g>
    <text x="64" y="574" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="760" fill="#5b6673">Anti AI-slop checks for busy pull request queues.</text>
  </svg>`;
}

export function renderRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /api/admin/
Disallow: /auth/github/
Disallow: /gate/
Sitemap: ${baseUrl}/sitemap.xml
`;
}

export function renderSitemapXml(baseUrl: string): string {
  const urls = [
    "",
    "/demo",
    "/queue-pressure",
    "/evidence",
    "/radar",
    "/pilot",
    "/trust",
    "/badge-builder",
    "/proof-card",
    "/scorecard-builder",
    "/github-app-manifest",
    "/launch",
    "/rehearsal",
    "/gate-trace",
    "/setup-wizard",
    "/diagnostics",
    "/status",
    "/config-preview",
    "/setup.md",
    "/trust.md",
    "/privacy.md",
    "/terms.md",
    "/security.md",
    "/abuse.md",
    "/incident.md",
    "/beta.md",
    "/support.md",
    "/github-app.md",
    "/config.md",
    "/operations.md",
    "/production-goal.md",
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

export function renderSecurityTxt(baseUrl: string, expiresAt: Date): string {
  return `Contact: https://github.com/aryabyte21/pr-captcha/issues
Policy: ${baseUrl}/trust
Policy: ${baseUrl}/security.md
Preferred-Languages: en
Expires: ${expiresAt.toISOString()}
Canonical: ${baseUrl}/.well-known/security.txt
`;
}

function brandMark(size: "default" | "small" | "tiny" = "default"): string {
  const className = size === "default" ? "brand-mark" : `brand-mark ${size}`;
  return `<svg class="${className}" viewBox="0 0 48 48" aria-hidden="true">
    <rect x="3" y="3" width="42" height="42" rx="12"></rect>
    <path fill-rule="evenodd" d="M17 36V13h10.3C34 13 38 16.8 38 22.3S34 31.8 27.3 31.8H23V36h-6Zm6-10.2h4c3 0 4.8-1.3 4.8-3.5S30 18.8 27 18.8h-4v7Z"></path>
    <circle cx="35" cy="35" r="5"></circle>
  </svg>`;
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

function demoStepButton(
  index: string,
  title: string,
  body: string,
  active = false,
): string {
  return `<button class="demo-step" type="button" data-demo-step="${escapeHtml(index)}"${active ? ' data-active="true" aria-pressed="true"' : ' aria-pressed="false"'}>
    <span>${escapeHtml(String(Number(index) + 1))}</span>
    <strong>${escapeHtml(title)}</strong>
    <small>${escapeHtml(body)}</small>
  </button>`;
}

function queueField(
  label: string,
  name: string,
  value: string,
  min: string,
  max: string,
  unit = "",
): string {
  const step = "1";
  const prefix = unit === "$" ? '<span aria-hidden="true">$</span>' : "";
  const suffix = unit === "%" ? '<span aria-hidden="true">%</span>' : "";
  return `<label class="queue-field">
    <span>${escapeHtml(label)}</span>
    <div>
      ${prefix}
      <input type="number" name="${escapeHtml(name)}" value="${escapeHtml(value)}" min="${escapeHtml(min)}" max="${escapeHtml(max)}" step="${step}" inputmode="decimal" />
      ${suffix}
    </div>
  </label>`;
}

function evidenceReportUrl(
  baseUrl: string | undefined,
  repository: string,
): string {
  const path = `/evidence?repo=${encodeURIComponent(repository)}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

function pilotPlannerUrl(
  baseUrl: string | undefined,
  repository: string,
): string {
  const path = `/pilot?repo=${encodeURIComponent(repository)}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

function defaultPilotIssueText(
  baseUrl: string | undefined,
  repository: string,
): string {
  return [
    "Run the pr-captcha pilot planner before filing this issue.",
    "",
    `Pilot planner: ${pilotPlannerUrl(baseUrl, repository)}`,
    `Evidence report: ${evidenceReportUrl(baseUrl, repository)}`,
  ].join("\n");
}

function githubIssueUrl(
  repository: string,
  title: string,
  body: string,
): string {
  const [owner, repo] = repository.split("/");
  const params = new URLSearchParams({ title, body });
  return `https://github.com/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(repo ?? "")}/issues/new?${params.toString()}`;
}

function evidenceMetric(
  id: string,
  label: string,
  value: string,
  detail: string,
): string {
  return `<article class="evidence-metric" data-evidence-metric="${escapeHtml(id)}">
    <span>${escapeHtml(label)}</span>
    <strong data-evidence-${escapeHtml(id)}>${escapeHtml(value)}</strong>
    <p data-evidence-${escapeHtml(id)}-detail>${escapeHtml(detail)}</p>
  </article>`;
}

function radarQueryLink(label: string, query: string, tone: string): string {
  const href = `https://github.com/search?q=${encodeURIComponent(query)}&type=pullrequests`;
  return `<a class="radar-query" href="${escapeHtml(href)}" target="_blank" rel="noreferrer" data-tone="${escapeHtml(tone)}">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(query)}</strong>
  </a>`;
}

function trustDocRow(
  title: string,
  body: string,
  href: string,
  status: "ready" | "beta" | "blocked",
): string {
  return `<a class="trust-doc-row" href="${escapeHtml(href)}" data-state="${escapeHtml(status)}">
    <span class="trust-status">${escapeHtml(status)}</span>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(body)}</p>
    <code>${escapeHtml(href)}</code>
  </a>`;
}

function badgeField(
  label: string,
  name: string,
  value: string,
  type = "text",
): string {
  return `<label class="badge-field">
    <span>${escapeHtml(label)}</span>
    <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" spellcheck="false" />
  </label>`;
}

function badgeText(value: string | undefined, fallback: string): string {
  const text = (value ?? fallback).trim().replace(/\s+/g, " ");
  return (text || fallback).slice(0, 28);
}

function badgeTone(value: string | undefined): BadgeTone {
  return value === "black" || value === "amber" ? value : "green";
}

function badgeStyle(value: string | undefined): BadgeStyle {
  return value === "flat" ? "flat" : "rounded";
}

function badgeWidth(value: string): number {
  return Math.max(76, Math.ceil(value.length * 7.2) + 24);
}

function proofField(
  label: string,
  name: string,
  value: string,
  type = "text",
): string {
  return `<label class="proof-field">
    <span>${escapeHtml(label)}</span>
    <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" spellcheck="false" />
  </label>`;
}

function launchField(
  label: string,
  name: string,
  value: string,
  type = "text",
): string {
  return `<label class="launch-field">
    <span>${escapeHtml(label)}</span>
    <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" spellcheck="false" />
  </label>`;
}

function launchStep(name: string, label: string, body: string): string {
  return `<label class="launch-step" data-launch-key="${escapeHtml(name)}" data-launch-step="${escapeHtml(label)}" data-launch-step-body="${escapeHtml(body)}">
    <input type="checkbox" name="${escapeHtml(name)}" data-launch-check />
    <span class="launch-step-mark" aria-hidden="true"></span>
    <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(body)}</small></span>
  </label>`;
}

function launchProofStage(key: string, label: string, body: string): string {
  return `<li data-launch-proof-stage="${escapeHtml(key)}">
    <b aria-hidden="true"></b>
    <strong>${escapeHtml(label)}</strong>
    <small>${escapeHtml(body)}</small>
  </li>`;
}

function launchRepoParts(repository: string): { owner: string; repo: string } {
  const [owner, repo] = repository.split("/", 2);
  return {
    owner: owner || "aryabyte21",
    repo: repo || "pr-captcha",
  };
}

function launchPagesUrl(repository: string): string {
  const { owner, repo } = launchRepoParts(repository);
  return `https://${owner}.github.io/${repo}/`;
}

function launchCommandsText(
  workerUrl: string,
  repository: string,
  databaseName: string,
  pagesUrl = launchPagesUrl(repository),
): string {
  const { owner, repo } = launchRepoParts(repository);
  const diagnosticsUrl = `${workerUrl}/diagnostics?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  return [
    "cd apps/worker",
    `npx wrangler d1 create ${databaseName}`,
    `npx wrangler d1 migrations apply ${databaseName} --remote`,
    `gh api repos/${owner}/${repo}/pages >/dev/null 2>&1 || gh api -X POST repos/${owner}/${repo}/pages -f build_type=workflow`,
    `gh api -X PUT repos/${owner}/${repo}/pages -f build_type=workflow`,
    `gh api repos/${owner}/${repo}/pages --jq '.html_url'`,
    "npx wrangler secret put APP_BASE_URL",
    "npx wrangler secret put GITHUB_APP_ID",
    "npx wrangler secret put GITHUB_PRIVATE_KEY",
    "npx wrangler secret put GITHUB_WEBHOOK_SECRET",
    "npx wrangler secret put GITHUB_CLIENT_ID",
    "npx wrangler secret put GITHUB_CLIENT_SECRET",
    "npx wrangler secret put TURNSTILE_SITE_KEY",
    "npx wrangler secret put TURNSTILE_SECRET_KEY",
    "npx wrangler secret put SESSION_SECRET",
    "npm run deploy",
    `curl -fsS ${workerUrl}/health/ready`,
    pagesUrl,
    diagnosticsUrl,
  ].join("\n");
}

function launchShareText(
  workerUrl: string,
  repository: string,
  appSlug: string,
  pagesUrl = launchPagesUrl(repository),
): string {
  return [
    "pr-captcha launch checklist",
    `Worker: ${workerUrl}`,
    `Pages redirect: ${pagesUrl}`,
    `Repository: ${repository}`,
    `GitHub App: ${appSlug}`,
    "Gates: Worker, D1, GitHub App, Turnstile, Repository policy, Diagnostics, Fork PR test.",
    `Runbook: ${workerUrl}/launch`,
  ].join("\n");
}

function launchBadgeMarkdown(workerUrl: string, repository: string): string {
  const badgeUrl = `${workerUrl}/badge.svg?label=protected%20by&message=pr-captcha&tone=green&style=rounded`;
  return `[![protected by pr-captcha](${badgeUrl})](${workerUrl}/demo?repo=${encodeURIComponent(repository)})`;
}

function launchIssueText(
  workerUrl: string,
  repository: string,
  pagesUrl = launchPagesUrl(repository),
): string {
  return [
    "## Add pr-captcha before untrusted PRs hit CI",
    "",
    `This repository can require \`pr-captcha/human\` for every PR, or for narrower configured targets, before maintainers spend review or runner time.`,
    "",
    "What it proves:",
    "- GitHub login plus browser CAPTCHA completed.",
    "- Verification is bound to one repository, PR number, author, and exact head SHA.",
    "- The gate treats pull request content as metadata only and never checks out the patch.",
    "- Held fork CI can be released after human verification.",
    "",
    `Repository: ${repository}`,
    `Demo: ${workerUrl}/demo`,
    `Setup wizard: ${workerUrl}/setup-wizard`,
    `Status: ${workerUrl}/status`,
    `Pages redirect fallback: ${pagesUrl}`,
    `README badge: ${launchBadgeMarkdown(workerUrl, repository)}`,
  ].join("\n");
}

function rehearsalField(
  label: string,
  name: string,
  value: string,
  type = "text",
): string {
  return `<label class="rehearsal-field">
    <span>${escapeHtml(label)}</span>
    <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" spellcheck="false" />
  </label>`;
}

function rehearsalStep(name: string, label: string, body: string): string {
  return `<label class="rehearsal-step" data-rehearsal-step="${escapeHtml(label)}" data-rehearsal-step-body="${escapeHtml(body)}">
    <input type="checkbox" name="${escapeHtml(name)}" />
    <span class="launch-step-mark" aria-hidden="true"></span>
    <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(body)}</small></span>
  </label>`;
}

function rehearsalStage(
  number: string,
  title: string,
  body: string,
  state: "waiting" | "ready",
): string {
  return `<li data-state="${escapeHtml(state)}">
    <b>${escapeHtml(number)}</b>
    <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(body)}</small></span>
  </li>`;
}

function rehearsalRunbookText(
  workerUrl: string,
  repository: string,
  installationId: string,
  checkName: string,
): string {
  const { owner, repo } = launchRepoParts(repository);
  return [
    "Fork PR rehearsal",
    "",
    `Worker URL: ${workerUrl}`,
    `Repository: ${repository}`,
    `Installation ID: ${installationId}`,
    `Expected check: ${checkName}`,
    "",
    "1. Open a disposable fork PR with a small README-only change.",
    `2. Confirm diagnostics: ${workerUrl}/diagnostics?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
    `3. Confirm the PR shows ${checkName} as action_required or pending.`,
    "4. Open the gate link as the PR author and complete GitHub OAuth plus Turnstile.",
    "5. Re-run the workflow gate and confirm the exact head SHA is verified.",
    "6. Require the check only after this rehearsal passes on a fresh PR.",
  ].join("\n");
}

function rehearsalIssueText(
  workerUrl: string,
  repository: string,
  installationId: string,
): string {
  return [
    "## Fork PR rehearsal before branch protection",
    "",
    `Repository: ${repository}`,
    `Worker: ${workerUrl}`,
    `Installation ID: ${installationId}`,
    "",
    "Evidence to collect:",
    "- [ ] Open test fork PR",
    "- [ ] Webhook created gate",
    "- [ ] Contributor solves CAPTCHA",
    "- [ ] Action sees verified SHA",
    "- [ ] Ready for branch protection",
    "",
    "Acceptance criteria:",
    "- The gate appears on a new PR head SHA.",
    "- The verification link requires GitHub login and Turnstile.",
    "- The Action fails while pending and passes after verification.",
    "- Pushing a new commit requires a new human check.",
  ].join("\n");
}

function rehearsalActionYaml(workerUrl: string): string {
  return `name: CI

on:
  pull_request:

jobs:
  human-gate:
    name: pr-captcha / human gate
    runs-on: ubuntu-latest
    steps:
      - uses: aryabyte21/pr-captcha/packages/action@v1
        with:
          api-url: ${workerUrl}

  test:
    needs: human-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test`;
}

function traceField(
  label: string,
  name: string,
  value: string,
  type = "text",
): string {
  return `<label class="trace-field">
    <span>${escapeHtml(label)}</span>
    <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" spellcheck="false" />
  </label>`;
}

function traceStep(name: string, label: string, body: string): string {
  return `<label class="trace-step" data-trace-step="${escapeHtml(label)}" data-trace-step-body="${escapeHtml(body)}">
    <input type="checkbox" name="${escapeHtml(name)}" />
    <span class="launch-step-mark" aria-hidden="true"></span>
    <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(body)}</small></span>
  </label>`;
}

function traceStage(
  number: string,
  title: string,
  body: string,
  state: "waiting" | "ready",
): string {
  return `<li data-state="${escapeHtml(state)}">
    <b>${escapeHtml(number)}</b>
    <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(body)}</small></span>
  </li>`;
}

function traceCurlText(
  workerUrl: string,
  repository: string,
  prNumber: string,
  headSha: string,
  installationId: string,
  secretEnv: string,
): string {
  const { owner, repo } = launchRepoParts(repository);
  const safePrNumber = positiveNumberText(prNumber, "184");
  const safeSha = shaText(headSha);
  const envName = envNameText(secretEnv);
  return [
    `WORKER_URL='${workerUrl}'`,
    `WEBHOOK_SECRET="\${${envName}}"`,
    'DELIVERY_ID="pr-captcha-smoke-$(date +%s)"',
    "node <<'NODE' >/tmp/pr-captcha-webhook.json",
    "const payload = {",
    "  action: 'opened',",
    `  installation: { id: ${installationIdText(installationId)} },`,
    "  repository: {",
    `    name: '${repo}',`,
    `    full_name: '${owner}/${repo}',`,
    `    owner: { login: '${owner}' },`,
    "    default_branch: 'main'",
    "  },",
    "  pull_request: {",
    `    number: ${safePrNumber},`,
    "    draft: false,",
    `    html_url: 'https://github.com/${owner}/${repo}/pull/${safePrNumber}',`,
    "    author_association: 'FIRST_TIME_CONTRIBUTOR',",
    "    user: { login: 'some-user', type: 'User' },",
    `    head: { sha: '${safeSha}', ref: 'pr-captcha-smoke', repo: { full_name: 'some-user/${repo}', fork: true, owner: { login: 'some-user' } } },`,
    `    base: { ref: 'main', repo: { full_name: '${owner}/${repo}', owner: { login: '${owner}' } } },`,
    "    labels: []",
    "  }",
    "};",
    "console.log(JSON.stringify(payload));",
    "NODE",
    "SIGNATURE=$(node -e \"const crypto=require('crypto');const fs=require('fs');const secret=process.env.WEBHOOK_SECRET;if(!secret)throw new Error('WEBHOOK_SECRET is required');const body=fs.readFileSync('/tmp/pr-captcha-webhook.json');process.stdout.write('sha256='+crypto.createHmac('sha256', secret).update(body).digest('hex'));\")",
    'curl -i -X POST "$WORKER_URL/webhooks/github" \\',
    "  -H 'content-type: application/json' \\",
    "  -H 'x-github-event: pull_request' \\",
    '  -H "x-github-delivery: $DELIVERY_ID" \\',
    '  -H "x-hub-signature-256: $SIGNATURE" \\',
    "  --data-binary @/tmp/pr-captcha-webhook.json",
  ].join("\n");
}

function traceActionYaml(workerUrl: string): string {
  return `name: CI

on:
  pull_request:

jobs:
  pr-captcha-human:
    name: pr-captcha / human
    runs-on: ubuntu-latest
    steps:
      - uses: aryabyte21/pr-captcha/packages/action@v1
        with:
          api-url: ${workerUrl}

  test:
    needs: pr-captcha-human
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test`;
}

function traceProofText(
  workerUrl: string,
  repository: string,
  prNumber: string,
  headSha: string,
  installationId: string,
): string {
  return [
    "Gate trace acceptance proof",
    "",
    `Worker: ${workerUrl}`,
    `Repository: ${repository}`,
    `PR: #${positiveNumberText(prNumber, "184")}`,
    `Head SHA: ${shaText(headSha)}`,
    `Installation ID: ${installationIdText(installationId)}`,
    "Required check: pr-captcha/human",
    "",
    "Evidence:",
    "- Signed webhook accepted by /webhooks/github.",
    "- Pending gate created for the exact repository, PR number, author, and SHA.",
    "- Gate page requires GitHub OAuth before Turnstile.",
    "- Turnstile token is verified server-side.",
    "- Status API fails while pending and passes only after the exact SHA is verified.",
    "- Check run changes from action_required to success.",
    "",
    `Status probe: ${workerUrl}/api/v1/verifications/status?owner=${encodeURIComponent(launchRepoParts(repository).owner)}&repo=${encodeURIComponent(launchRepoParts(repository).repo)}&pr=${encodeURIComponent(positiveNumberText(prNumber, "184"))}&sha=${encodeURIComponent(shaText(headSha))}`,
    "Ready to require pr-captcha/human",
  ].join("\n");
}

function positiveNumberText(value: string, fallback: string): string {
  const cleaned = value.replace(/[^0-9]/g, "").slice(0, 10);
  return cleaned && Number(cleaned) > 0 ? cleaned : fallback;
}

function shaText(value: string): string {
  const cleaned = value.replace(/[^a-fA-F0-9]/g, "").slice(0, 40);
  return cleaned || "8f31c9a4d2e9b6f1c0a7e5d3b2a190f8e4c6d2b1";
}

function installationIdText(value: string): string {
  return positiveNumberText(value, "12345678");
}

function envNameText(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return cleaned || "GITHUB_WEBHOOK_SECRET";
}

function manifestField(
  label: string,
  name: string,
  value: string,
  type = "text",
  hint = "",
): string {
  return `<label class="manifest-field">
    <span>${escapeHtml(label)}${hint ? `<small>${escapeHtml(hint)}</small>` : ""}</span>
    <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" spellcheck="false" />
  </label>`;
}

function githubAppManifest(
  workerUrl: string,
  appName: string,
): {
  name: string;
  url: string;
  hook_attributes: { url: string; active: boolean };
  redirect_url: string;
  callback_urls: string[];
  setup_url: string;
  description: string;
  public: boolean;
  setup_on_update: boolean;
  default_permissions: Record<string, string>;
  default_events: string[];
} {
  return {
    name: appName,
    url: workerUrl,
    hook_attributes: {
      url: `${workerUrl}/webhooks/github`,
      active: true,
    },
    redirect_url: `${workerUrl}/github-app-manifest/callback`,
    callback_urls: [`${workerUrl}/auth/github/callback`],
    setup_url: `${workerUrl}/setup-wizard`,
    description: "Human-origin checks for busy pull request queues.",
    public: false,
    setup_on_update: true,
    default_permissions: {
      actions: "write",
      checks: "write",
      contents: "read",
      issues: "write",
      pull_requests: "write",
    },
    default_events: ["pull_request"],
  };
}

function proofText(
  value: string | undefined,
  fallback: string,
  maxLength: number,
): string {
  const text = (value ?? fallback).trim().replace(/\s+/g, " ");
  return (text || fallback).slice(0, maxLength);
}

function proofNumber(value: string | undefined, fallback: string): string {
  const text = (value ?? fallback).replace(/[^0-9]/g, "");
  return (text || fallback).slice(0, 6);
}

function proofResult(value: string | undefined): ProofResult {
  return value === "pending" || value === "denied" ? value : "verified";
}

function proofTheme(value: string | undefined): ProofTheme {
  return value === "dark" || value === "compact" ? value : "light";
}

function scorecardText(
  value: string | undefined,
  fallback: string,
  maxLength: number,
): string {
  const text = (value ?? fallback).trim().replace(/\s+/g, " ");
  return (text || fallback).slice(0, maxLength);
}

function scorecardNumber(value: string | undefined, fallback: string): string {
  const text = (value ?? fallback).replace(/[^0-9]/g, "");
  return (text || fallback).slice(0, 7);
}

function scorecardRisk(value: string | undefined): ScorecardRisk {
  return value === "high" || value === "medium" ? value : "low";
}

function scorecardTheme(value: string | undefined): ScorecardTheme {
  return value === "dark" ? "dark" : "light";
}

function scorecardRecommendation(risk: ScorecardRisk): string {
  if (risk === "high") {
    return "Require pr-captcha/human on fork and outside contributor PRs before maintainer review starts.";
  }
  if (risk === "medium") {
    return "Pilot pr-captcha on fork PRs and first-time contributors before branch protection.";
  }
  return "Run advisory mode first, collect proof, then require the gate when queue pressure rises.";
}

function scorecardIssueText(input: {
  repository: string;
  risk: string;
  openPullRequests: string;
  forkPullRequests: string;
  unknownAuthors: string;
  labelMatches: string;
  scorecardUrl: string;
  pilotUrl: string;
  setupUrl: string;
}): string {
  return [
    "## Proposal: add pr-captcha to protect the PR queue",
    "",
    `${input.repository} is showing ${input.risk} PR queue pressure. I propose a 7-day pr-captcha pilot for fork, first-time, outside, and bot pull requests before maintainer review starts.`,
    "",
    `![pr-captcha queue scorecard](${input.scorecardUrl})`,
    "",
    "Current public signals",
    `- ${input.openPullRequests} open PRs`,
    `- ${input.forkPullRequests} fork PRs`,
    `- ${input.unknownAuthors} unknown or outside authors`,
    `- ${input.labelMatches} spam or invalid labels`,
    "",
    "Pilot scope",
    "- Gate fork PRs and first-time contributors for 7 days.",
    "- Require GitHub login plus CAPTCHA for the exact head SHA.",
    "- Keep pr-captcha from checking out or executing pull request code.",
    "- Enable branch protection only after one clean rehearsal PR.",
    "",
    "Links",
    `- Scorecard: ${input.scorecardUrl}`,
    `- Pilot planner: ${input.pilotUrl}`,
    `- Policy generator: ${input.setupUrl}`,
  ].join("\n");
}

function scorecardMetric(
  label: string,
  value: string,
  text: string,
  muted: string,
  line: string,
  fill: string,
  x: number,
): string {
  return `<g transform="translate(${x} 0)">
    <rect width="206" height="104" rx="8" fill="${fill}" stroke="${line}"/>
    <text x="18" y="34" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="820" fill="${muted}">${escapeXml(label)}</text>
    <text x="18" y="78" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="42" font-weight="920" fill="${text}">${escapeXml(value)}</text>
  </g>`;
}

function proofMetaRow(
  label: string,
  value: string,
  text: string,
  muted: string,
  line: string,
  y: number,
): string {
  return `<g transform="translate(0 ${y})">
    <rect width="360" height="64" rx="8" fill="none" stroke="${line}"/>
    <text x="18" y="25" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="780" fill="${muted}">${escapeXml(label)}</text>
    <text x="18" y="48" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="21" font-weight="840" fill="${text}">${escapeXml(value)}</text>
  </g>`;
}

function setupStep(
  number: string,
  title: string,
  body: string,
  href: string,
  action: string,
): string {
  return `<article class="setup-step">
    <span class="step-number">${escapeHtml(number)}</span>
    <div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </div>
    <a href="${escapeHtml(href)}">${escapeHtml(action)}</a>
  </article>`;
}

function setupSignal(title: string, body: string): string {
  return `<div class="setup-signal">
    <span class="mini-shield">✓</span>
    <strong>${escapeHtml(title)}</strong>
    <small>${escapeHtml(body)}</small>
  </div>`;
}

function statusTile(id: string, title: string, body: string): string {
  return `<article class="status-tile" data-status-tile="${escapeHtml(id)}">
    <span class="status-mark" data-state="checking"></span>
    <div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
    </div>
    <strong data-status-label>checking</strong>
  </article>`;
}

function workflowGateYaml(): string {
  return `name: CI

on:
  pull_request:

jobs:
  human-gate:
    name: pr-captcha / human gate
    runs-on: ubuntu-latest
    steps:
      - uses: aryabyte21/pr-captcha/packages/action@v1
        with:
          api-url: https://<worker-domain>

  test:
    needs: human-gate
    runs-on: ubuntu-latest`;
}

function setupWizardWorkflowGuardYaml(baseUrl?: string): string {
  const workerUrl = baseUrl ?? "https://<worker-domain>";
  return `name: CI

on:
  pull_request:

jobs:
  pr-captcha:
    name: pr-captcha / human
    runs-on: ubuntu-latest
    steps:
      - uses: aryabyte21/pr-captcha/packages/action@v1
        with:
          api-url: ${workerUrl}

  heavy-ci:
    needs: pr-captcha
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test`;
}

function setupWizardAcceptanceProof(repository: string): string {
  return `Repository: ${repository}
Policy file: .github/pr-captcha.yml
Mode: hybrid
Required check: pr-captcha/human (enabled)
Solver: PR author only
Workflow guard: required before heavy jobs

Acceptance:
- Signed pull_request webhook creates a pending gate.
- Action fails before the exact head SHA is verified.
- Contributor solves CAPTCHA while logged in to GitHub.
- pr-captcha/human is updated to success for the same SHA.
- Action passes after verification.
- Branch protection is enabled only after the fork PR rehearsal passes.`;
}

function configPreviewExampleYaml(): string {
  return `mode: hybrid

captcha:
  provider: cloudflare_turnstile

require:
  github_login: true
  solver_must_be_pr_author: true
  new_sha_requires_new_captcha: true

apply_to:
  all_pull_requests: false
  first_time_contributors: true
  outside_contributors: true
  fork_prs: true
  bots: true

skip:
  authors: []
  labels:
    - trusted-contributor
    - no-captcha

checks:
  create_required_check: true
  name: pr-captcha/human

comment:
  enabled: true
  tone: direct

universal_gate:
  rerun_after_verification: true`;
}

function queueStat(
  repo: string,
  value: string,
  label: string,
  source: string,
): string {
  return `<article class="queue-stat" data-pr-count-repo="${escapeHtml(repo)}">
    <span>${escapeHtml(repo)}</span>
    <strong data-pr-count>${escapeHtml(value)}</strong>
    <p>${escapeHtml(label)}</p>
    <small data-pr-count-source>${escapeHtml(source)}</small>
  </article>`;
}

function ossProofCard(input: {
  image: string;
  href: string;
  repo: string;
  title: string;
  meta: string;
}): string {
  return `<article class="proof-card">
    <a href="${escapeHtml(input.href)}" aria-label="${escapeHtml(input.title)} on GitHub">
      <img src="${escapeHtml(input.image)}" alt="GitHub pull request screenshot from ${escapeHtml(input.repo)}" />
    </a>
    <div>
      <strong>${escapeHtml(input.repo)}</strong>
      <h3>${escapeHtml(input.title)}</h3>
      <p>${escapeHtml(input.meta)}</p>
    </div>
  </article>`;
}

function pressurePanel(image: string, title: string, body: string): string {
  return `<article class="pressure-panel motion-reveal">
    <img src="${escapeHtml(image)}" alt="" aria-hidden="true" />
    <div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </div>
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
  csrfToken: string;
  session: SessionUser;
  turnstileSiteKey: string;
  error?: string;
  verified?: boolean;
  successDetail?: string;
}): string {
  const shortSha = input.gate.head_sha.slice(0, 7);
  const repoFullName = `${input.gate.owner}/${input.gate.repo}`;
  const pullRequestUrl = `https://github.com/${input.gate.owner}/${input.gate.repo}/pull/${input.gate.pr_number}`;
  const error = input.error
    ? `<div class="notice error">${escapeHtml(input.error)}</div>`
    : "";
  const successDetail =
    input.successDetail ??
    "The required check can turn green for this exact commit.";
  const success = input.verified
    ? `<div class="notice success"><strong>Human check passed</strong> <span>${escapeHtml(successDetail)}</span></div>`
    : "";
  const button = input.verified
    ? `<a class="button dark full" href="${escapeHtml(pullRequestUrl)}">Return to pull request</a>`
    : `<button class="button dark full" type="submit">Complete human check</button>`;
  const turnstile = input.verified
    ? ""
    : `<div class="turnstile-wrap">
        <div class="cf-turnstile" data-sitekey="${escapeHtml(input.turnstileSiteKey)}"></div>
      </div>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`;
  const metaTable = `<div class="meta-table" aria-label="Pull request verification target">
    ${metaRow("Repository", repoFullName)}
    ${metaRow("Pull request", `#${input.gate.pr_number}`)}
    ${metaRow("Commit", shortSha, true)}
    ${metaRow("GitHub user", input.session.login)}
  </div>`;
  const gateAction = input.verified
    ? `<div class="gate-complete-action">
        ${metaTable}
        ${button}
      </div>`
    : `<form method="post" action="/gate/${escapeHtml(input.gate.id)}">
        <input type="hidden" name="token" value="${escapeHtml(input.token)}" />
        <input type="hidden" name="csrf_token" value="${escapeHtml(input.csrfToken)}" />
        ${metaTable}
        ${turnstile}
        ${button}
      </form>`;
  const gateState = input.verified ? "verified" : "pending";

  return layout(
    "Finish this PR check",
    `<main id="main" class="gate-page">
      <section class="gate-shell" data-gate-shell data-gate-status="${gateState}">
        <div class="gate gate-primary">
          <div class="brand centered">${brandMark()}<span>pr-captcha</span></div>
          <h1>Finish this PR check</h1>
          <p class="intro">Signed in as <strong>${escapeHtml(input.session.login)}</strong>. This verifies <a href="${escapeHtml(pullRequestUrl)}">${escapeHtml(repoFullName)}#${input.gate.pr_number}</a> at <code>${escapeHtml(shortSha)}</code>.</p>
          <div class="status-strip">
            <span><span class="mini-shield">✓</span>Signed into GitHub</span>
            <span><span class="mini-shield">✓</span>Exact commit</span>
            <span><span class="mini-shield">✓</span>No PR code runs</span>
          </div>
          ${error}
          ${success}
          ${gateAction}
          <p class="fine-print">This verification is valid for this commit only. Pushing a new commit creates a fresh gate for the new SHA.</p>
        </div>
        <aside class="gate-side" aria-label="Verification details">
          <section class="gate-panel gate-receipt">
            <div class="gate-panel-head">
            <h2>Verification receipt</h2>
            <span class="gate-status-badge" data-state="${gateState}">${input.verified ? "verified" : "waiting"}</span>
          </div>
            <p>${input.verified ? "The human-origin signal is recorded." : "Complete the browser check to turn pr-captcha/human green for this commit."}</p>
            <dl class="gate-receipt-list">
              <div><dt>Required check</dt><dd><code>pr-captcha/human</code></dd></div>
              <div><dt>Target</dt><dd><a href="${escapeHtml(pullRequestUrl)}">${escapeHtml(repoFullName)}#${input.gate.pr_number}</a></dd></div>
              <div><dt>Commit binding</dt><dd><code>${escapeHtml(input.gate.head_sha)}</code></dd></div>
              <div><dt>Solver account</dt><dd>${escapeHtml(input.session.login)}</dd></div>
            </dl>
          </section>
          <section class="gate-panel">
            <h2>What this proves</h2>
            <ul class="gate-check-list">
              ${gateTrustItem("sha", "Exact SHA only", "The receipt applies only to this pull request head commit.")}
              ${gateTrustItem("github", "GitHub account", "The solver is tied to an authenticated GitHub login.")}
              ${gateTrustItem("sandbox", "No PR code runs here", "This page never checks out or executes contributor code.")}
              ${gateTrustItem("fresh", "New commits need a new check", "A pushed update cannot reuse an older receipt.")}
            </ul>
          </section>
        </aside>
      </section>
    </main>`,
  );
}

function gateTrustItem(id: string, title: string, body: string): string {
  return `<li data-gate-check="${escapeHtml(id)}">
    <span class="gate-check-icon">✓</span>
    <div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(body)}</small></div>
  </li>`;
}

export function renderMessagePage(
  title: string,
  message: string,
  status: "success" | "error" = "success",
): string {
  return layout(
    title,
    `<main id="main" class="gate-page">
      <section class="gate small">
        <div class="brand centered">${brandMark()}<span>pr-captcha</span></div>
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

function layout(
  title: string,
  body: string,
  metadata: {
    title?: string;
    description?: string;
    canonicalUrl?: string | undefined;
    imageUrl?: string;
  } = {},
): string {
  const metaTitle = metadata.title ?? title;
  const description = metadata.description ?? defaultDescription;
  const canonical = metadata.canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}" />`
    : "";
  const image = metadata.imageUrl ?? "/og.svg";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="pr-captcha" />
    <meta property="og:title" content="${escapeHtml(metaTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(metaTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    ${canonical}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
      :root {
        color-scheme: light;
        --bg: #f8faf9;
        --ink: #08111a;
        --text: #17202c;
        --muted: #596574;
        --faint: #f3f6f4;
        --line: #d8e1dc;
        --line-dark: #202a35;
        --green: #0f766e;
        --green-dark: #0a5d56;
        --green-soft: #e9f8ef;
        --amber: #d97706;
        --red: #b42318;
        --red-bg: #fff1f0;
        --success-bg: #ecfdf3;
        --blue: #0f766e;
        --shadow: 0 24px 70px rgba(21, 31, 44, 0.1);
        --shadow-soft: 0 12px 34px rgba(21, 31, 44, 0.07);
        --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
      }
      * {
        box-sizing: border-box;
      }
      html {
        scroll-behavior: smooth;
      }
      body {
        margin: 0;
        min-height: 100vh;
        overflow-x: hidden;
        background:
          radial-gradient(circle at 18% 8%, rgba(15, 118, 110, 0.08), transparent 28rem),
          radial-gradient(circle at 82% 12%, rgba(8, 17, 26, 0.035), transparent 24rem),
          linear-gradient(90deg, rgba(21, 31, 44, 0.035) 1px, transparent 1px),
          linear-gradient(180deg, rgba(21, 31, 44, 0.03) 1px, transparent 1px),
          var(--bg);
        background-size: auto, auto, 72px 72px, 72px 72px, auto;
        color: var(--text);
        font-family: Geist, "SF Pro Display", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
        font-variant-numeric: tabular-nums;
      }
      a {
        color: inherit;
        text-decoration: none;
      }
      :focus-visible {
        outline: 3px solid rgba(15, 118, 110, 0.25);
        outline-offset: 3px;
      }
      .skip-link {
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 20;
        transform: translateY(-150%);
        border-radius: 8px;
        padding: 10px 12px;
        background: var(--ink);
        color: #ffffff;
        font-size: 14px;
        font-weight: 840;
      }
      .skip-link:focus {
        transform: translateY(0);
      }
      [hidden] {
        display: none !important;
      }
      .nowrap {
        white-space: nowrap;
      }
      button,
      .button {
        font: inherit;
      }
      .site-header,
      .home,
      .site-footer {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
      }
      .site-header {
        position: sticky;
        top: 12px;
        z-index: 10;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-top: 12px;
        border: 1px solid rgba(216, 225, 220, 0.92);
        border-radius: 8px;
        padding: 0 14px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow:
          0 18px 46px rgba(8, 17, 26, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 840;
        font-size: 21px;
        color: var(--ink);
      }
      .brand.centered {
        display: flex;
        justify-content: center;
      }
      .brand-mark {
        width: 34px;
        height: 34px;
        display: block;
        flex: 0 0 auto;
        color: var(--ink);
        filter: drop-shadow(0 1px 0 rgba(8, 13, 20, 0.12));
      }
      .brand-mark rect {
        fill: currentColor;
      }
      .brand-mark path {
        fill: #ffffff;
      }
      .brand-mark circle {
        fill: #16a35c;
      }
      .brand-mark.small {
        width: 24px;
        height: 24px;
      }
      .brand-mark.tiny {
        width: 22px;
        height: 22px;
      }
      .site-nav {
        display: flex;
        align-items: center;
        gap: 4px;
        overflow-x: auto;
        scrollbar-width: none;
        color: #222c38;
        font-size: 13px;
        font-weight: 760;
      }
      .site-nav::-webkit-scrollbar {
        display: none;
      }
      .site-nav a {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border-radius: 6px;
        padding: 0 9px;
        color: #313b49;
        white-space: nowrap;
        transition:
          background 180ms var(--ease-out),
          color 180ms var(--ease-out);
      }
      .site-nav a:hover,
      .site-nav a[aria-current="page"] {
        background: rgba(17, 152, 95, 0.09);
        color: var(--green-dark);
      }
      .button {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        padding: 0 20px;
        border: 1px solid transparent;
        cursor: pointer;
        font-weight: 800;
        font-size: 15px;
        white-space: nowrap;
        transition:
          transform 180ms var(--ease-out),
          background 180ms var(--ease-out),
          border-color 180ms var(--ease-out),
          color 180ms var(--ease-out),
          box-shadow 180ms var(--ease-out);
      }
      .button:hover {
        transform: translateY(-1px);
      }
      .button:active {
        transform: translateY(1px) scale(0.99);
      }
      .button.primary,
      .button.dark,
      .gate-card button {
        background: var(--ink);
        color: #ffffff;
        box-shadow: 0 12px 24px rgba(21, 31, 44, 0.14);
      }
      .button.primary {
        background: var(--green);
        border-color: var(--green);
        box-shadow: 0 14px 28px rgba(16, 155, 85, 0.22);
      }
      .button.primary:hover {
        background: var(--green-dark);
        border-color: var(--green-dark);
      }
      .button.dark:hover,
      .gate-card button:hover {
        background: #1a232e;
      }
      .button.light {
        background: rgba(255, 255, 255, 0.92);
        border-color: var(--line);
        color: var(--ink);
      }
      .button.light:hover {
        border-color: rgba(17, 152, 95, 0.36);
        background: #ffffff;
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
        padding: 14px 0 46px;
      }
      .hero {
        min-height: min(680px, calc(100dvh - 96px));
        display: grid;
        grid-template-columns: minmax(360px, 0.82fr) minmax(560px, 1.18fr);
        align-items: center;
        gap: 54px;
        padding: 24px 0 34px;
      }
      .hero-copy {
        position: relative;
        z-index: 1;
      }
      .hero-copy h1 {
        max-width: 760px;
        margin: 0 0 18px;
        color: var(--ink);
        font-size: clamp(48px, 5.2vw, 76px);
        line-height: 0.98;
        letter-spacing: 0;
        text-wrap: balance;
      }
      .inline-proof-media {
        width: clamp(82px, 8vw, 126px);
        height: clamp(34px, 3.6vw, 48px);
        display: inline-block;
        margin: 0 0.08em;
        border: 2px solid #ffffff;
        border-radius: 999px;
        background-image:
          linear-gradient(90deg, rgba(7, 11, 16, 0.18), rgba(17, 152, 95, 0.2)),
          url("/assets/anti-slop-gate-hero.png");
        background-position: 50% 48%;
        background-size: 360%;
        box-shadow:
          0 12px 30px rgba(7, 11, 16, 0.16),
          inset 0 1px 0 rgba(255, 255, 255, 0.55);
        vertical-align: 0.02em;
      }
      .hero-copy p {
        max-width: 560px;
        margin: 0;
        color: #3e4957;
        font-size: 18px;
        line-height: 1.5;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 24px;
      }
      .proof-line {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 22px !important;
        color: var(--ink) !important;
        font-size: 20px !important;
        font-weight: 850;
        text-wrap: balance;
      }
      .signal-rail {
        max-width: 540px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }
      .signal-rail span {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        background: rgba(255, 255, 255, 0.76);
        color: #384452;
        font-size: 13px;
        font-weight: 760;
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
      .motion-ready .motion-reveal,
      .motion-ready .queue-stat,
      .motion-ready .proof-card {
        opacity: 0;
        transform: translateY(26px) scale(0.985);
        transition:
          opacity 720ms var(--ease-out),
          transform 720ms var(--ease-out);
        transition-delay: var(--reveal-delay, 0ms);
      }
      .motion-ready .motion-reveal.is-visible,
      .motion-ready .queue-stat.is-visible,
      .motion-ready .proof-card.is-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .hero-media {
        display: grid;
        gap: 14px;
      }
      .hero-media figure {
        position: relative;
        margin: 0;
        overflow: hidden;
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: #e9edf0;
        box-shadow: var(--shadow);
      }
      .hero-media figure::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(180deg, transparent 52%, rgba(7, 11, 16, 0.22)),
          radial-gradient(circle at 76% 22%, rgba(255, 255, 255, 0.3), transparent 28%);
        mix-blend-mode: multiply;
      }
      .hero-media img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        transform: scale(1.01);
      }
      .hero-media figcaption {
        position: absolute;
        left: 18px;
        bottom: 16px;
        z-index: 1;
        width: min(420px, calc(100% - 36px));
        margin: 0;
        color: #ffffff;
        font-size: 15px;
        font-weight: 780;
        text-shadow: 0 1px 16px rgba(7, 11, 16, 0.34);
      }
      .hero-proof-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--line);
        box-shadow: 0 16px 40px rgba(21, 31, 44, 0.07);
      }
      .hero-proof-grid div {
        min-height: 84px;
        display: grid;
        align-content: center;
        gap: 7px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.92);
      }
      .hero-proof-grid span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 760;
      }
      .hero-proof-grid strong {
        color: var(--ink);
        font-size: 17px;
        line-height: 1.2;
      }
      .product-stage {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.9fr);
        align-items: start;
        gap: 16px;
        width: 100%;
      }
      .repo-shell,
      .bot-comment,
      .gate-card,
      .proof-card,
      .timeline-section,
      .integration-section,
      .roadmap-card {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
      }
      .repo-shell {
        overflow: hidden;
        box-shadow: var(--shadow);
      }
      .repo-topbar {
        min-height: 54px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 16px;
        background: #090e15;
        color: #ffffff;
      }
      .repo-topbar span {
        color: #b8c0cc;
        font-size: 13px;
      }
      .repo-pr {
        padding: 14px 16px;
      }
      .repo-pr h2,
      .gate-card h3 {
        margin: 0;
        color: var(--ink);
        line-height: 1.2;
      }
      .repo-pr h2 {
        font-size: 21px;
      }
      .pr-num {
        color: var(--muted);
        font-weight: 600;
      }
      .repo-pr p,
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
      .checks {
        margin: 0 16px 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
      }
      .check-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 14px;
        padding: 12px 14px;
      }
      .check-row + .check-row {
        border-top: 1px solid var(--line);
      }
      .check-row.warn {
        background: #fffdf8;
      }
      .check-icon {
        align-self: start;
        margin-top: 1px;
      }
      .warn-dot {
        width: 18px;
        height: 18px;
        border: 2px solid var(--amber);
        border-radius: 999px;
      }
      .req-dot {
        width: 22px;
        height: 22px;
      }
      .check-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .check-head strong {
        color: var(--ink);
        font-size: 14px;
      }
      .check-head span {
        color: var(--muted);
        font-size: 12px;
        white-space: nowrap;
      }
      .check-body p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .check-row button {
        min-height: 34px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #ffffff;
        color: var(--ink);
        padding: 0 16px;
        font-weight: 760;
        cursor: pointer;
        white-space: nowrap;
      }
      .check-row button:hover {
        border-color: #aeb7c2;
      }
      .bot-comment {
        margin: 0 16px 14px;
        padding: 14px;
      }
      .bot-comment p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }
      .card-top {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #2a3542;
        font-size: 13px;
        font-weight: 760;
      }
      .card-top span:last-child {
        margin-left: auto;
        color: var(--muted);
        font-weight: 400;
      }
      .gate-card {
        padding: 16px;
        box-shadow: 0 24px 60px rgba(21, 31, 44, 0.12);
      }
      .audit-stream {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        margin: 0 16px 14px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--line);
      }
      .audit-stream div {
        min-height: 76px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 4px 8px;
        align-content: center;
        background: #ffffff;
        padding: 12px;
      }
      .audit-stream strong {
        color: var(--ink);
        font-size: 12px;
      }
      .audit-stream small {
        grid-column: 2;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.25;
      }
      .audit-dot {
        width: 10px;
        height: 10px;
        align-self: center;
        border-radius: 999px;
        background: var(--green);
      }
      .audit-dot.warn-dot {
        width: 10px;
        height: 10px;
        border-width: 2px;
        background: transparent;
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
      .proof-section,
      .integration-section,
      .roadmap-section {
        margin-top: 40px;
      }
      .proof-section {
        display: grid;
        gap: 24px;
        margin-top: 18px;
      }
      .section-heading {
        max-width: 760px;
        margin: 0 auto 28px;
        text-align: center;
      }
      .section-heading.split {
        max-width: none;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
        gap: 28px;
        margin-bottom: 0;
        text-align: left;
      }
      .section-heading h2 {
        margin: 0;
        color: var(--ink);
        font-size: 36px;
        line-height: 1.1;
      }
      .section-heading p {
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.55;
      }
      .section-heading span {
        color: var(--muted);
        font-size: 13px;
        font-weight: 720;
        white-space: nowrap;
      }
      .proof-grid {
        display: grid;
        grid-template-columns: 1.12fr 0.94fr 0.94fr;
        gap: 16px;
        align-items: start;
      }
      .queue-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--line);
      }
      .queue-stat {
        min-height: 150px;
        display: grid;
        align-content: start;
        background: #ffffff;
        padding: 20px;
      }
      .queue-stat span {
        color: var(--muted);
        font-size: 13px;
        font-weight: 820;
      }
      .queue-stat strong {
        margin-top: 16px;
        color: var(--ink);
        font-size: clamp(38px, 5vw, 64px);
        line-height: 0.95;
        letter-spacing: 0;
      }
      .queue-stat p {
        margin: 8px 0 0;
        color: var(--ink);
        font-size: 16px;
        font-weight: 800;
      }
      .queue-stat small {
        margin-top: 18px;
        color: var(--muted);
        font-size: 12px;
      }
      .proof-card {
        overflow: hidden;
        box-shadow: 0 16px 42px rgba(8, 13, 20, 0.08);
      }
      .proof-card:first-child {
        transform: translateY(18px);
      }
      .proof-card:nth-child(2) {
        transform: translateY(-8px);
      }
      .proof-card:nth-child(3) {
        transform: translateY(28px);
      }
      .proof-card img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        object-position: top left;
        border-bottom: 1px solid var(--line);
      }
      .proof-card div {
        padding: 16px;
      }
      .proof-card strong {
        color: var(--muted);
        font-size: 12px;
        font-weight: 820;
      }
      .proof-card h3 {
        margin: 8px 0 8px;
        color: var(--ink);
        font-size: 17px;
        line-height: 1.25;
      }
      .proof-card p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .proof-footnote {
        max-width: 840px;
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }
      .pressure-section {
        display: grid;
        grid-template-columns: minmax(300px, 0.7fr) minmax(0, 1.3fr);
        gap: 32px;
        align-items: stretch;
        margin-top: 72px;
      }
      .pressure-copy {
        align-self: center;
        max-width: 480px;
      }
      .pressure-copy h2 {
        margin: 0;
        color: var(--ink);
        font-size: clamp(38px, 4.8vw, 68px);
        line-height: 0.98;
        letter-spacing: 0;
        text-wrap: balance;
      }
      .pressure-copy p {
        margin: 20px 0 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.55;
      }
      .pressure-accordion {
        min-height: 470px;
        display: flex;
        overflow: hidden;
        border: 1px solid rgba(21, 31, 44, 0.12);
        border-radius: 8px;
        background: #0a1018;
        box-shadow: var(--shadow);
      }
      .pressure-panel {
        position: relative;
        min-width: 0;
        flex: 1 1 0;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
        border-right: 1px solid rgba(255, 255, 255, 0.16);
        transition:
          flex 620ms var(--ease-out),
          opacity 720ms var(--ease-out),
          transform 720ms var(--ease-out);
      }
      .pressure-panel:last-child {
        border-right: 0;
      }
      .pressure-panel:first-child,
      .pressure-panel:hover,
      .pressure-panel:focus-within {
        flex-grow: 1.75;
      }
      .pressure-panel img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: grayscale(0.85) contrast(1.12) saturate(0.72);
        opacity: 0.54;
        transform: scale(1.02);
        transition:
          transform 760ms var(--ease-out),
          opacity 760ms var(--ease-out),
          filter 760ms var(--ease-out);
      }
      .pressure-panel::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(180deg, rgba(7, 11, 16, 0.08), rgba(7, 11, 16, 0.84)),
          radial-gradient(circle at 18% 16%, rgba(17, 152, 95, 0.24), transparent 34%);
      }
      .pressure-panel:hover img,
      .pressure-panel:focus-within img {
        opacity: 0.72;
        filter: grayscale(0.3) contrast(1.12) saturate(0.92);
        transform: scale(1.08);
      }
      .pressure-panel div {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 12px;
        padding: 24px;
        color: #ffffff;
      }
      .pressure-panel h3 {
        margin: 0;
        font-size: clamp(22px, 2vw, 30px);
        line-height: 1;
        text-wrap: balance;
      }
      .pressure-panel p {
        width: min(340px, 48vw);
        margin: 0;
        color: rgba(255, 255, 255, 0.78);
        font-size: 14px;
        line-height: 1.5;
      }
      .timeline-section,
      .integration-section {
        padding: 32px;
      }
      .timeline-section h2,
      .integration-section h2,
      .roadmap-section h2 {
        margin: 0;
      }
      .timeline {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0;
        border-top: 1px solid var(--line);
      }
      .timeline-item {
        position: relative;
        min-height: 170px;
        padding: 22px 18px 0;
        border: 0;
        border-left: 1px solid var(--line);
        background: transparent;
      }
      .timeline-item:first-child {
        border-left: 0;
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
        margin: 22px 0 10px;
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
      .setup-section {
        display: grid;
        grid-template-columns: minmax(0, 0.82fr) minmax(520px, 1fr);
        gap: 30px;
        align-items: start;
        margin-top: 48px;
        padding-top: 6px;
      }
      .setup-copy h2 {
        margin: 0;
        color: var(--ink);
        font-size: 40px;
        line-height: 1.08;
        text-wrap: balance;
      }
      .setup-copy > p {
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.6;
      }
      .setup-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }
      .setup-actions .button[data-copied="true"] {
        border-color: var(--green);
        color: var(--green-dark);
      }
      .setup-steps {
        display: grid;
        gap: 10px;
        margin-top: 24px;
      }
      .setup-step {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 14px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.9);
      }
      .step-number {
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--ink);
        color: #ffffff;
        font-weight: 850;
      }
      .setup-step h3,
      .ready-panel h3 {
        margin: 0;
        color: var(--ink);
        font-size: 18px;
        line-height: 1.25;
      }
      .setup-step p,
      .ready-panel p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .setup-step a {
        color: var(--ink);
        font-size: 13px;
        font-weight: 800;
        white-space: nowrap;
      }
      .setup-step a:hover {
        color: var(--green-dark);
      }
      .setup-board {
        display: grid;
        gap: 14px;
      }
      .workflow-panel,
      .ready-panel {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .panel-top {
        min-height: 52px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 0 18px;
        background: #091018;
        color: #ffffff;
      }
      .panel-top strong {
        font-size: 15px;
      }
      .panel-top span {
        color: #b8c0cc;
        font-size: 13px;
        font-weight: 650;
      }
      .workflow-panel pre {
        margin: 0;
        overflow-x: auto;
        padding: 20px;
        background: #fbfcfd;
      }
      .workflow-panel code {
        display: block;
        padding: 0;
        border: 0;
        background: transparent;
        color: #111827;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 13px;
        line-height: 1.55;
        white-space: pre;
      }
      .ready-panel {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(280px, 1fr);
        gap: 18px;
        align-items: center;
        padding: 20px;
      }
      .setup-signals {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .setup-signal {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 3px 8px;
        align-items: center;
        min-height: 62px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px;
        background: #fbfcfd;
      }
      .setup-signal strong {
        color: var(--ink);
        font-size: 13px;
      }
      .setup-signal small {
        grid-column: 2;
        color: var(--muted);
        font-size: 12px;
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
      .preview-page {
        width: min(1180px, calc(100% - 40px));
        margin: 0 auto;
        padding: 52px 0 72px;
      }
      .preview-heading {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.56fr);
        gap: 32px;
        align-items: end;
        margin-bottom: 34px;
      }
      .preview-heading > * {
        min-width: 0;
      }
      .preview-heading h1 {
        max-width: 860px;
        margin: 0;
        color: var(--ink);
        font-size: clamp(46px, 5vw, 72px);
        line-height: 0.98;
        font-weight: 930;
        text-wrap: balance;
      }
      .preview-heading p {
        max-width: 650px;
        margin: 16px 0 0;
        color: #3e4957;
        font-size: 18px;
        line-height: 1.55;
      }
      .eyebrow {
        width: fit-content;
        margin: 0 0 14px !important;
        border: 1px solid rgba(15, 118, 110, 0.18);
        border-radius: 999px;
        padding: 7px 11px;
        background: rgba(233, 248, 239, 0.88);
        color: var(--green-dark) !important;
        font-size: 12px !important;
        font-weight: 900;
        line-height: 1 !important;
        text-transform: uppercase;
      }
      .preview-guarantees {
        display: grid;
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--line);
        box-shadow: var(--shadow-soft);
      }
      .preview-guarantees span {
        min-height: 52px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        background: rgba(255, 255, 255, 0.92);
        color: var(--ink);
        font-weight: 780;
      }
      .queue-shell,
      .badge-shell,
      .proof-shell,
      .manifest-shell {
        display: grid;
        grid-template-columns: minmax(340px, 0.68fr) minmax(620px, 1.2fr);
        gap: 18px;
        align-items: start;
      }
      .queue-controls,
      .queue-results,
      .queue-summary-card,
      .badge-controls,
      .badge-live,
      .badge-snippets,
      .proof-controls,
      .proof-live,
      .proof-snippets,
      .manifest-controls {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .queue-presets {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        border-bottom: 1px solid var(--line);
        padding: 14px 18px;
      }
      .queue-presets .button {
        min-width: 0;
        padding: 0 10px;
      }
      .queue-fields {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .queue-field {
        display: grid;
        gap: 7px;
      }
      .queue-field > span {
        color: var(--ink);
        font-size: 13px;
        font-weight: 820;
      }
      .queue-field div {
        min-height: 44px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        background: #fbfcfd;
      }
      .queue-field div span {
        color: var(--muted);
        font-size: 13px;
        font-weight: 820;
      }
      .queue-field input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: none;
        background: transparent;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
        font-weight: 760;
      }
      .queue-field div:focus-within {
        border-color: #9be0b5;
        box-shadow: 0 0 0 3px rgba(16, 155, 85, 0.12);
      }
      .queue-results {
        display: grid;
        gap: 14px;
        padding: 14px;
      }
      .queue-scoreboard {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .queue-metric {
        min-height: 150px;
        display: grid;
        align-content: start;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 16px;
        background: #fbfcfd;
      }
      .queue-metric span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 850;
      }
      .queue-metric strong {
        margin-top: 14px;
        color: var(--ink);
        font-size: clamp(38px, 4vw, 58px);
        line-height: 0.95;
      }
      .queue-metric p {
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.35;
      }
      .queue-recommendation {
        display: grid;
        gap: 14px;
        border: 1px solid #ffe2a8;
        border-radius: 7px;
        padding: 16px;
        background: #fffaf0;
      }
      .queue-recommendation[data-queue-recommendation-state="ready"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .queue-recommendation > div:first-child {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
      }
      .queue-recommendation h2 {
        margin: 0;
        color: var(--ink);
        font-size: 21px;
        line-height: 1.2;
      }
      .queue-recommendation p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .queue-recommendation dl {
        display: grid;
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--line);
        margin: 0;
      }
      .queue-recommendation dl div {
        display: grid;
        grid-template-columns: minmax(130px, 0.42fr) minmax(0, 1fr);
        background: #ffffff;
      }
      .queue-recommendation dt,
      .queue-recommendation dd {
        min-height: 40px;
        display: flex;
        align-items: center;
        margin: 0;
        padding: 10px 12px;
        font-size: 13px;
        line-height: 1.35;
      }
      .queue-recommendation dt {
        color: #27303b;
        background: #fbfcfd;
        font-weight: 820;
      }
      .queue-recommendation dd {
        color: var(--muted);
        word-break: break-word;
      }
      .queue-summary-card {
        box-shadow: none;
      }
      .queue-summary {
        max-height: 170px;
        border: 0;
        border-radius: 0;
      }
      .evidence-page .button.primary {
        border-color: var(--green);
        background: var(--green);
        color: #ffffff;
      }
      .evidence-shell {
        display: grid;
        grid-template-columns: minmax(320px, 0.58fr) minmax(0, 1.42fr);
        gap: 18px;
        align-items: start;
      }
      .evidence-shell > * {
        min-width: 0;
      }
      .evidence-controls,
      .evidence-results,
      .evidence-prs,
      .evidence-summary-card,
      .evidence-brief-card {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .evidence-controls {
        position: sticky;
        top: 18px;
      }
      .evidence-field {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-bottom: 1px solid var(--line);
      }
      .evidence-field label {
        color: var(--ink);
        font-size: 13px;
        font-weight: 840;
      }
      .evidence-field div {
        min-height: 46px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 6px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 0 12px;
        background: #fbfcfd;
      }
      .evidence-field div:focus-within {
        border-color: #8fcbbf;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
      }
      .evidence-field span {
        color: #6b7280;
        font-size: 13px;
        font-weight: 780;
      }
      .evidence-field input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: none;
        background: transparent;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
        font-weight: 780;
      }
      .evidence-presets {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--line);
      }
      .evidence-presets .button {
        min-width: 0;
        padding: 0 10px;
      }
      .evidence-presets .button[data-active="true"] {
        border-color: #8fcbbf;
        background: var(--green-soft);
        color: var(--green-dark);
      }
      .evidence-explain {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-bottom: 1px solid var(--line);
      }
      .evidence-explain h2 {
        margin: 0;
        color: var(--ink);
        font-size: 17px;
      }
      .evidence-explain p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .evidence-actions {
        display: grid;
        gap: 1px;
        background: var(--line);
      }
      .evidence-actions a {
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 18px;
        background: #ffffff;
        color: var(--ink);
        font-size: 14px;
        font-weight: 820;
        text-decoration: none;
      }
      .evidence-actions a::after {
        content: ">";
        color: var(--green);
      }
      .evidence-results {
        display: grid;
        gap: 14px;
        padding: 14px;
      }
      .evidence-recommendation {
        display: grid;
        gap: 14px;
        border: 1px solid #b7efc9;
        border-radius: 8px;
        padding: 16px;
        background: var(--green-soft);
      }
      .evidence-recommendation[data-evidence-risk="high"] {
        border-color: #fecaca;
        background: #fff1f2;
      }
      .evidence-recommendation[data-evidence-risk="medium"] {
        border-color: #fde68a;
        background: #fffbeb;
      }
      .evidence-recommendation[data-evidence-risk="low"] {
        border-color: #bbf7d0;
        background: var(--green-soft);
      }
      .evidence-recommendation > div:first-child {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
      }
      .evidence-recommendation h2 {
        margin: 0;
        color: var(--ink);
        font-size: 22px;
        line-height: 1.2;
      }
      .evidence-recommendation p {
        margin: 6px 0 0;
        color: #394556;
        font-size: 14px;
        line-height: 1.5;
      }
      .evidence-recommendation dl {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 0;
      }
      .evidence-recommendation dl div {
        display: grid;
        gap: 5px;
        min-height: 70px;
        border: 1px solid rgba(8, 13, 20, 0.08);
        border-radius: 7px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.72);
      }
      .evidence-recommendation dt {
        color: #4b5563;
        font-size: 12px;
        font-weight: 840;
      }
      .evidence-recommendation dd {
        margin: 0;
        color: var(--ink);
        font-size: 13px;
        font-weight: 800;
        overflow-wrap: anywhere;
      }
      .evidence-share {
        display: grid;
        gap: 8px;
        border: 1px solid rgba(8, 13, 20, 0.08);
        border-radius: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.78);
      }
      .evidence-share label {
        color: #4b5563;
        font-size: 12px;
        font-weight: 860;
      }
      .evidence-share div {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
      }
      .evidence-share input {
        width: 100%;
        min-width: 0;
        min-height: 40px;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 0 11px;
        background: #ffffff;
        color: var(--ink);
        font: inherit;
        font-size: 13px;
        font-weight: 760;
        outline: none;
      }
      .evidence-share input:focus {
        border-color: #8fcbbf;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
      }
      .evidence-share small {
        color: #4b5563;
        font-size: 12px;
        line-height: 1.4;
      }
      .evidence-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .evidence-metric {
        min-height: 132px;
        display: grid;
        align-content: start;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 15px;
        background: #fbfcfd;
      }
      .evidence-metric span {
        color: #5b6472;
        font-size: 12px;
        font-weight: 860;
      }
      .evidence-metric strong {
        margin-top: 12px;
        color: var(--ink);
        font-size: clamp(30px, 3vw, 44px);
        line-height: 1;
      }
      .evidence-metric p {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.35;
      }
      .evidence-prs {
        box-shadow: none;
      }
      .evidence-empty {
        display: grid;
        gap: 8px;
        padding: 22px;
        color: var(--muted);
      }
      .evidence-empty strong {
        color: var(--ink);
      }
      .evidence-empty p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }
      .evidence-pr-list {
        display: grid;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--line);
      }
      .evidence-pr-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(90px, 0.22fr);
        gap: 8px 14px;
        padding: 13px 14px;
        background: #ffffff;
      }
      .evidence-pr-row > a {
        min-width: 0;
        color: var(--ink);
        font-size: 14px;
        font-weight: 820;
        line-height: 1.35;
        text-decoration: none;
        overflow-wrap: anywhere;
      }
      .evidence-pr-row > a:hover {
        color: var(--green);
      }
      .evidence-author {
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
        text-align: right;
        overflow-wrap: anywhere;
      }
      .evidence-pr-meta {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .evidence-badge {
        min-height: 24px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0 9px;
        background: #f8fafc;
        color: #526171;
        font-size: 12px;
        font-weight: 820;
      }
      .evidence-badge[data-tone="ready"] {
        border-color: #b7efc9;
        background: var(--green-soft);
        color: #087a3f;
      }
      .evidence-badge[data-tone="warning"] {
        border-color: #fde68a;
        background: #fffbeb;
        color: #92400e;
      }
      .evidence-badge[data-tone="danger"] {
        border-color: #fecaca;
        background: #fff1f2;
        color: #b91c1c;
      }
      .evidence-summary-card {
        box-shadow: none;
      }
      .evidence-brief-card {
        box-shadow: none;
      }
      .evidence-brief-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 14px;
        border-bottom: 1px solid var(--line);
        background: #f8fafc;
      }
      .evidence-brief-actions p {
        margin: 0;
        color: #4b5563;
        font-size: 13px;
        line-height: 1.45;
      }
      .evidence-summary {
        max-height: 220px;
        border: 0;
        border-radius: 0;
      }
      .evidence-summary.evidence-brief {
        max-height: 310px;
      }
      .radar-heading {
        align-items: start;
      }
      .radar-proof,
      .radar-panel,
      .radar-results,
      .radar-clusters-card,
      .radar-summary-card {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .radar-proof {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        min-width: 0;
      }
      .radar-proof div {
        display: grid;
        gap: 8px;
        min-height: 96px;
        align-content: center;
        padding: 18px;
        border-bottom: 1px solid var(--line);
      }
      .radar-proof div:nth-child(odd) {
        border-right: 1px solid var(--line);
      }
      .radar-proof div:nth-last-child(-n + 2) {
        border-bottom: 0;
      }
      .radar-proof div:last-child {
        border-bottom: 0;
      }
      .radar-proof span,
      .radar-totals dt {
        color: #5b6472;
        font-size: 12px;
        font-weight: 860;
      }
      .radar-proof strong,
      .radar-totals dd {
        margin: 0;
        color: var(--ink);
        font-size: 22px;
        font-weight: 900;
        line-height: 1.1;
      }
      .radar-query-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin: 0 0 22px;
      }
      .radar-query {
        display: grid;
        gap: 8px;
        min-width: 0;
        min-height: 86px;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        color: var(--ink);
        text-decoration: none;
      }
      .radar-query:hover {
        border-color: #0b0f16;
        box-shadow: 0 12px 32px rgba(8, 13, 20, 0.08);
      }
      .radar-query span {
        color: #5b6472;
        font-size: 12px;
        font-weight: 860;
        text-transform: uppercase;
      }
      .radar-query strong {
        min-width: 0;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        font-weight: 760;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .radar-query[data-tone="spam"] {
        border-color: #fecaca;
      }
      .radar-query[data-tone="invalid"] {
        border-color: #fed7aa;
      }
      .radar-query[data-tone="stale"] {
        border-color: #d1d5db;
      }
      .radar-shell {
        display: grid;
        grid-template-columns: minmax(260px, 0.36fr) minmax(0, 1fr);
        grid-template-areas:
          "panel results"
          "side side";
        gap: 18px;
        align-items: start;
      }
      .radar-shell > * {
        min-width: 0;
      }
      .radar-panel {
        grid-area: panel;
        position: sticky;
        top: 18px;
      }
      .radar-recommendation {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        border-bottom: 1px solid var(--line);
        padding: 18px;
        background: var(--green-soft);
      }
      .radar-recommendation h2 {
        margin: 0;
        color: var(--ink);
        font-size: 20px;
        line-height: 1.2;
      }
      .radar-recommendation p {
        margin: 7px 0 0;
        color: #394556;
        font-size: 14px;
        line-height: 1.48;
      }
      .radar-totals {
        display: grid;
        gap: 1px;
        margin: 0;
        background: var(--line);
        border-bottom: 1px solid var(--line);
      }
      .radar-totals div {
        display: grid;
        grid-template-columns: minmax(120px, 0.64fr) minmax(0, 1fr);
        gap: 12px;
        align-items: center;
        min-height: 58px;
        padding: 12px 18px;
        background: #ffffff;
      }
      .radar-results {
        grid-area: results;
        box-shadow: none;
      }
      .radar-side-column {
        display: grid;
        grid-area: side;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 18px;
        align-content: start;
        min-width: 0;
      }
      .radar-empty {
        display: grid;
        gap: 8px;
        padding: 22px;
        color: var(--muted);
      }
      .radar-empty strong {
        color: var(--ink);
      }
      .radar-empty p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }
      .radar-clusters-card {
        box-shadow: none;
      }
      .radar-cluster-empty {
        display: grid;
        gap: 8px;
        padding: 18px;
        color: var(--muted);
      }
      .radar-cluster-empty strong {
        color: var(--ink);
      }
      .radar-cluster-empty p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }
      .radar-cluster-list {
        display: grid;
        gap: 1px;
        margin: 0;
        max-height: 300px;
        overflow: auto;
        padding: 0;
        list-style: none;
        background: var(--line);
      }
      .radar-cluster-item {
        display: grid;
        background: #ffffff;
      }
      .radar-cluster-button {
        display: grid;
        gap: 8px;
        width: 100%;
        min-width: 0;
        border: 0;
        padding: 14px;
        background: #ffffff;
        color: var(--ink);
        text-align: left;
        cursor: pointer;
      }
      .radar-cluster-button:hover,
      .radar-cluster-item[data-selected="true"] .radar-cluster-button {
        background: #f0fdf4;
      }
      .radar-cluster-item[data-selected="true"] .radar-cluster-button {
        box-shadow: inset 3px 0 0 #059669;
      }
      .radar-cluster-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        min-width: 0;
      }
      .radar-cluster-top strong {
        min-width: 0;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .radar-cluster-signal {
        flex: 0 0 auto;
        min-height: 22px;
        border-radius: 999px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 900;
        line-height: 1;
        text-transform: uppercase;
      }
      .radar-cluster-signal[data-tone="danger"] {
        background: #fee2e2;
        color: #991b1b;
      }
      .radar-cluster-signal[data-tone="warning"] {
        background: #ffedd5;
        color: #9a3412;
      }
      .radar-cluster-signal[data-tone="muted"] {
        background: #f1f5f9;
        color: #334155;
      }
      .radar-cluster-detail,
      .radar-cluster-latest {
        color: #5b6472;
        font-size: 12px;
        font-weight: 760;
        line-height: 1.4;
        overflow-wrap: anywhere;
      }
      .radar-cluster-latest {
        color: #334155;
      }
      .radar-cluster-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        border-top: 1px solid var(--line);
        background: var(--line);
      }
      .radar-cluster-actions a {
        display: grid;
        min-height: 38px;
        place-items: center;
        padding: 0 10px;
        background: #ffffff;
        color: #0f172a;
        font-size: 12px;
        font-weight: 900;
        text-decoration: none;
      }
      .radar-cluster-actions a:hover {
        background: #0b0f16;
        color: #ffffff;
      }
      .radar-list {
        display: grid;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--line);
      }
      .radar-table[hidden] {
        display: none;
      }
      .radar-table-head {
        display: grid;
        grid-template-columns: minmax(126px, 0.44fr) minmax(220px, 1fr) minmax(92px, 0.28fr) minmax(56px, 0.18fr) minmax(190px, 0.72fr);
        gap: 12px;
        padding: 11px 14px;
        border-top: 1px solid var(--line);
        background: #f8fafc;
        color: #5b6472;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .radar-row {
        display: grid;
        grid-template-columns: minmax(126px, 0.44fr) minmax(220px, 1fr) minmax(92px, 0.28fr) minmax(56px, 0.18fr) minmax(190px, 0.72fr);
        gap: 10px 12px;
        align-items: start;
        padding: 14px;
        background: #ffffff;
      }
      .radar-row:hover {
        background: #fbfdf9;
      }
      .radar-repo,
      .radar-title {
        min-width: 0;
        color: var(--ink);
        font-weight: 820;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .radar-repo {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
      }
      .radar-title {
        font-size: 14px;
      }
      .radar-repo:hover,
      .radar-title:hover {
        color: #059669;
      }
      .radar-age {
        color: #5b6472;
        font-size: 13px;
        font-weight: 820;
      }
      .radar-row .evidence-pr-meta {
        grid-column: auto;
        align-content: start;
      }
      .radar-row .evidence-badge {
        min-height: 22px;
        padding: 0 7px;
        font-size: 11px;
      }
      .radar-summary-card {
        box-shadow: none;
      }
      .radar-summary {
        max-height: 240px;
        border: 0;
        border-radius: 0;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
      }
      .pilot-shell {
        display: grid;
        grid-template-columns: minmax(320px, 0.54fr) minmax(0, 1.46fr);
        gap: 18px;
        align-items: start;
      }
      .pilot-shell > * {
        min-width: 0;
      }
      .pilot-controls,
      .pilot-results,
      .pilot-card,
      .pilot-recommendation {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .pilot-controls {
        position: sticky;
        top: 18px;
      }
      .pilot-field {
        display: grid;
        gap: 8px;
        padding: 18px;
        border-bottom: 1px solid var(--line);
      }
      .pilot-field > span,
      .pilot-stance legend {
        color: var(--ink);
        font-size: 13px;
        font-weight: 850;
      }
      .pilot-field div {
        min-height: 46px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 6px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 0 12px;
        background: #fbfcfd;
      }
      .pilot-field div:focus-within {
        border-color: #8fcbbf;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
      }
      .pilot-field div span {
        color: #6b7280;
        font-size: 13px;
        font-weight: 780;
      }
      .pilot-field input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: none;
        background: transparent;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
        font-weight: 780;
      }
      .pilot-stance {
        display: grid;
        gap: 10px;
        border: 0;
        border-bottom: 1px solid var(--line);
        margin: 0;
        padding: 16px 18px;
      }
      .pilot-stance label {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: #fbfcfd;
        cursor: pointer;
      }
      .pilot-stance label:has(input:checked) {
        border-color: #8fcbbf;
        background: var(--green-soft);
      }
      .pilot-stance input {
        width: 17px;
        height: 17px;
        margin: 2px 0 0;
        accent-color: var(--green);
      }
      .pilot-stance strong,
      .pilot-stance small {
        display: block;
      }
      .pilot-stance strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.25;
      }
      .pilot-stance small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .pilot-presets {
        grid-template-columns: 1fr 1fr;
      }
      .pilot-results {
        display: grid;
        gap: 14px;
        padding: 14px;
      }
      .pilot-recommendation {
        display: grid;
        gap: 14px;
        padding: 16px;
        box-shadow: none;
        background: var(--green-soft);
        border-color: #b7efc9;
      }
      .pilot-recommendation[data-pilot-risk="high"],
      .pilot-recommendation[data-pilot-risk="error"] {
        border-color: #fecaca;
        background: #fff1f2;
      }
      .pilot-recommendation[data-pilot-risk="medium"] {
        border-color: #fde68a;
        background: #fffbeb;
      }
      .pilot-recommendation[data-pilot-risk="low"] {
        border-color: #bbf7d0;
        background: var(--green-soft);
      }
      .pilot-recommendation > div:first-child {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
      }
      .pilot-recommendation h2 {
        margin: 0;
        color: var(--ink);
        font-size: 22px;
        line-height: 1.2;
      }
      .pilot-recommendation p {
        margin: 6px 0 0;
        color: #394556;
        font-size: 14px;
        line-height: 1.48;
      }
      .pilot-metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin: 0;
      }
      .pilot-metrics div {
        display: grid;
        gap: 5px;
        min-height: 72px;
        border: 1px solid rgba(8, 13, 20, 0.08);
        border-radius: 7px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.72);
      }
      .pilot-metrics dt {
        color: #4b5563;
        font-size: 12px;
        font-weight: 850;
      }
      .pilot-metrics dd {
        margin: 0;
        color: var(--ink);
        font-size: 24px;
        font-weight: 920;
        line-height: 1;
      }
      .pilot-card {
        box-shadow: none;
      }
      .pilot-card-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .pilot-timeline,
      .pilot-list {
        display: grid;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--line);
      }
      .pilot-timeline li,
      .pilot-list li {
        display: grid;
        gap: 5px;
        min-height: 64px;
        padding: 13px 14px;
        background: #ffffff;
      }
      .pilot-timeline strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.3;
      }
      .pilot-timeline span,
      .pilot-list li,
      .pilot-rollback p {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .pilot-list li::before {
        content: "✓";
        color: #059669;
        font-weight: 900;
      }
      .pilot-list li {
        grid-template-columns: auto minmax(0, 1fr);
        align-items: start;
      }
      .pilot-rollback p {
        margin: 0;
        padding: 16px;
      }
      .pilot-issue {
        max-height: 320px;
        border: 0;
        border-radius: 0;
      }
      .pilot-issue-actions {
        border-top: 1px solid var(--line);
        background: #fbfcfd;
      }
      .pilot-issue-actions .button {
        flex: 1 1 180px;
        justify-content: center;
      }
      .trust-heading {
        align-items: stretch;
      }
      .trust-readiness,
      .trust-docs,
      .trust-rail {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .trust-readiness {
        display: grid;
      }
      .trust-readiness div {
        display: grid;
        gap: 8px;
        min-height: 104px;
        align-content: center;
        border-bottom: 1px solid var(--line);
        padding: 18px;
      }
      .trust-readiness div:last-child {
        border-bottom: 0;
      }
      .trust-readiness span,
      .trust-doc-row p,
      .trust-checklist span {
        color: var(--muted);
      }
      .trust-readiness span {
        font-size: 12px;
        font-weight: 860;
      }
      .trust-readiness strong {
        color: var(--ink);
        font-size: 28px;
        font-weight: 900;
        line-height: 1;
      }
      .trust-readiness small {
        color: #495464;
        font-size: 13px;
        line-height: 1.42;
      }
      .trust-shell {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.42fr);
        gap: 18px;
        align-items: start;
      }
      .trust-shell > * {
        min-width: 0;
      }
      .trust-docs {
        display: grid;
      }
      .trust-doc-row {
        min-height: 96px;
        display: grid;
        grid-template-columns: minmax(96px, 0.16fr) minmax(170px, 0.22fr) minmax(0, 1fr) minmax(120px, 0.2fr);
        gap: 14px;
        align-items: center;
        border-top: 1px solid var(--line);
        padding: 14px 18px;
        background: #ffffff;
      }
      .trust-doc-row > * {
        min-width: 0;
      }
      .trust-doc-row:hover {
        background: #fbfcfd;
      }
      .trust-status {
        width: max-content;
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        border: 1px solid #bbf7d0;
        border-radius: 999px;
        padding: 0 10px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 12px;
        font-weight: 880;
      }
      .trust-doc-row[data-state="beta"] .trust-status {
        border-color: #fde68a;
        background: #fffbeb;
        color: #92400e;
      }
      .trust-doc-row[data-state="blocked"] .trust-status {
        border-color: #fecaca;
        background: #fff1f2;
        color: #b91c1c;
      }
      .trust-doc-row strong {
        color: var(--ink);
        font-size: 16px;
        line-height: 1.25;
      }
      .trust-doc-row p {
        margin: 0;
        font-size: 14px;
        line-height: 1.42;
      }
      .trust-doc-row code {
        color: var(--green);
        font: inherit;
        font-size: 13px;
        font-weight: 820;
        text-align: right;
        overflow-wrap: anywhere;
      }
      .trust-rail {
        position: sticky;
        top: 18px;
      }
      .trust-checklist {
        display: grid;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--line);
      }
      .trust-checklist li {
        display: grid;
        gap: 6px;
        padding: 14px 18px;
        background: #ffffff;
      }
      .trust-checklist li[data-state="ready"] {
        background: var(--green-soft);
      }
      .trust-checklist li[data-state="beta"] {
        background: #fffbeb;
      }
      .trust-checklist li[data-state="blocked"] {
        background: #fff1f2;
      }
      .trust-checklist strong {
        color: var(--ink);
        font-size: 14px;
      }
      .trust-checklist span {
        font-size: 13px;
        line-height: 1.42;
      }
      .trust-actions {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .trust-actions .button {
        width: 100%;
      }
      .badge-fields,
      .proof-fields,
      .manifest-fields {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .badge-field,
      .proof-field,
      .manifest-field {
        display: grid;
        gap: 7px;
      }
      .badge-field span,
      .badge-toggle-group legend,
      .proof-field span,
      .proof-toggle-group legend,
      .manifest-field span,
      .manifest-target legend {
        color: var(--ink);
        font-size: 13px;
        font-weight: 820;
      }
      .manifest-field span {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .manifest-field small {
        color: var(--muted);
        font-size: 12px;
        font-weight: 720;
      }
      .badge-field input,
      .proof-field input,
      .manifest-field input {
        width: 100%;
        min-width: 0;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        background: #fbfcfd;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
        font-weight: 700;
        outline: none;
      }
      .badge-field input:focus,
      .proof-field input:focus,
      .manifest-field input:focus {
        border-color: #9be0b5;
        box-shadow: 0 0 0 3px rgba(16, 155, 85, 0.12);
      }
      .badge-toggle-group,
      .proof-toggle-group {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        border: 0;
        border-top: 1px solid var(--line);
        margin: 0;
        padding: 14px 18px;
      }
      .badge-toggle-group legend,
      .proof-toggle-group legend {
        grid-column: 1 / -1;
        padding: 0 0 2px;
      }
      .badge-toggle-group .button,
      .proof-toggle-group .button {
        min-width: 0;
        padding: 0 10px;
      }
      .badge-toggle-group .button[aria-pressed="true"],
      .proof-toggle-group .button[aria-pressed="true"] {
        border-color: #9be0b5;
        background: var(--green-soft);
        color: var(--green-dark);
      }
      .badge-preview-panel,
      .proof-preview-panel {
        display: grid;
        gap: 14px;
      }
      .badge-preview-frame {
        min-height: 142px;
        display: grid;
        align-content: center;
        justify-items: start;
        gap: 16px;
        padding: 24px;
        background:
          linear-gradient(#ffffff, #fbfcfd),
          linear-gradient(90deg, rgba(217, 222, 230, 0.55) 1px, transparent 1px),
          linear-gradient(rgba(217, 222, 230, 0.55) 1px, transparent 1px);
        background-size: auto, 28px 28px, 28px 28px;
      }
      .badge-preview-frame img {
        max-width: 100%;
        height: 28px;
      }
      .badge-preview-frame a {
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
      }
      .proof-preview-frame {
        display: grid;
        gap: 16px;
        padding: 18px;
        background:
          linear-gradient(#ffffff, #fbfcfd),
          linear-gradient(90deg, rgba(217, 222, 230, 0.55) 1px, transparent 1px),
          linear-gradient(rgba(217, 222, 230, 0.55) 1px, transparent 1px);
        background-size: auto, 28px 28px, 28px 28px;
      }
      .proof-preview-frame img {
        width: 100%;
        height: auto;
        aspect-ratio: 1200 / 630;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        object-fit: contain;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
      }
      .proof-preview-frame a {
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
      }
      .badge-snippets .panel-top,
      .proof-snippets .panel-top {
        min-height: 54px;
      }
      .badge-snippet,
      .proof-snippet {
        max-height: 152px;
        border: 0;
        border-radius: 0;
      }
      .scorecard-page {
        --scorecard-blue: var(--green);
      }
      .scorecard-heading .actions {
        align-items: stretch;
      }
      .scorecard-preview-frame {
        padding: 24px;
      }
      .scorecard-url-card .proof-snippet,
      .scorecard-share {
        max-height: 112px;
      }
      .scorecard-page .proof-snippet {
        background: #fbfcfd;
        color: var(--ink);
      }
      .scorecard-adoption-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1fr);
        gap: 18px;
        align-items: stretch;
        margin-top: 18px;
      }
      .scorecard-issue-card,
      .scorecard-routing-card {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .scorecard-issue {
        max-height: 232px;
        white-space: pre-wrap;
      }
      .scorecard-issue-card .preview-actions {
        border-top: 1px solid var(--line);
        padding: 14px;
      }
      .scorecard-action-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1px;
        background: var(--line);
      }
      .scorecard-action {
        min-width: 0;
        min-height: 128px;
        display: grid;
        gap: 8px;
        align-content: start;
        border: 0;
        border-radius: 0;
        padding: 16px;
        background: #ffffff;
        color: inherit;
        font: inherit;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
      }
      .scorecard-action:hover,
      .scorecard-action:focus-visible {
        background: var(--green-soft);
        outline: none;
      }
      .scorecard-action[data-copied="true"] {
        background: var(--green-soft);
      }
      .scorecard-action[data-copied="failed"] {
        background: #fff1f2;
      }
      .scorecard-action strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.25;
      }
      .scorecard-action span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.42;
      }
      .scorecard-routing-card .scorecard-share {
        border-top: 1px solid var(--line);
      }
      .manifest-output {
        min-width: 0;
        display: grid;
        gap: 14px;
      }
      .manifest-output .workflow-panel pre {
        max-height: 520px;
        overflow: auto;
      }
      .manifest-target {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        border: 0;
        border-top: 1px solid var(--line);
        margin: 0;
        padding: 14px 18px;
      }
      .manifest-target legend {
        grid-column: 1 / -1;
        padding: 0 0 2px;
      }
      .manifest-target label {
        min-height: 46px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        background: #fbfcfd;
        cursor: pointer;
      }
      .manifest-target label:has(input:checked) {
        border-color: #9be0b5;
        background: var(--green-soft);
      }
      .manifest-target input {
        width: 17px;
        height: 17px;
        accent-color: var(--green);
      }
      .manifest-target span {
        color: var(--ink);
        font-size: 13px;
        font-weight: 780;
      }
      .manifest-url-list,
      .manifest-permissions {
        display: grid;
        gap: 1px;
        border-top: 1px solid var(--line);
        background: var(--line);
      }
      .manifest-url-list div {
        display: grid;
        gap: 6px;
        background: #ffffff;
        padding: 12px 18px;
      }
      .manifest-url-list span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 850;
      }
      .manifest-url-list code {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
        padding: 8px 10px;
        background: #fbfcfd;
      }
      .manifest-permission-row {
        min-height: 58px;
        display: grid;
        grid-template-columns: minmax(110px, 0.8fr) auto minmax(0, 1.2fr);
        gap: 10px;
        align-items: center;
        background: #ffffff;
        padding: 10px 18px;
      }
      .manifest-permission-row strong {
        color: var(--ink);
        font-size: 13px;
      }
      .manifest-permission-row span {
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #b7efc9;
        border-radius: 5px;
        padding: 0 10px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 12px;
        font-weight: 850;
      }
      .manifest-permission-row small {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .manifest-actions {
        align-items: stretch;
      }
      .manifest-actions form {
        display: contents;
      }
      .manifest-callback-shell {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(380px, 0.82fr);
        gap: 18px;
        align-items: start;
      }
      .launch-shell {
        display: grid;
        grid-template-columns: minmax(320px, 0.72fr) minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }
      .launch-decision-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin: -4px 0 18px;
      }
      .launch-decision-card,
      .launch-blocker-alert {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: var(--shadow-soft);
      }
      .launch-decision-card {
        display: grid;
        gap: 6px;
        min-height: 104px;
        align-content: center;
        padding: 16px;
      }
      .launch-decision-card span {
        color: #5b6472;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .launch-decision-card strong {
        color: var(--ink);
        font-size: 28px;
        font-weight: 930;
        line-height: 1;
      }
      .launch-decision-card p {
        margin: 0;
        color: #394556;
        font-size: 13px;
        font-weight: 680;
        line-height: 1.42;
      }
      .launch-decision-card[data-state="blocked"] {
        border-color: #fed7aa;
        background: #fffbeb;
      }
      .launch-decision-card[data-state="almost"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .launch-decision-card[data-state="ready"] {
        border-color: #bbf7d0;
        background: #f0fdf4;
      }
      .launch-panel,
      .launch-commands,
      .launch-proof-lane,
      .launch-gaps > .preview-status,
      .launch-gaps > .preview-card,
      .launch-actions-row a {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .launch-progress {
        height: 8px;
        border-top: 1px solid var(--line);
        background: #eef2f7;
      }
      .launch-progress span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, var(--green), var(--green-dark));
        transition: width 180ms ease;
      }
      .launch-fields {
        display: grid;
        gap: 10px;
        padding: 14px 16px;
      }
      .launch-advanced {
        min-width: 0;
      }
      .launch-advanced summary {
        min-height: 54px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 0 16px;
        color: var(--ink);
        cursor: pointer;
        font-weight: 850;
        list-style: none;
      }
      .launch-advanced summary::-webkit-details-marker {
        display: none;
      }
      .launch-advanced summary::after {
        content: "+";
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: var(--faint);
        color: var(--green-dark);
        font-weight: 930;
      }
      .launch-advanced[open] summary::after {
        content: "-";
      }
      .launch-advanced summary span {
        color: var(--muted);
        font-size: 12px;
        font-weight: 780;
      }
      .launch-field-details {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fbfcfd;
      }
      .launch-field-details summary {
        min-height: 46px;
        padding: 0 12px;
        font-size: 13px;
      }
      .launch-field-details[open] {
        padding-bottom: 12px;
      }
      .launch-field-details[open] .launch-field {
        padding: 0 12px;
      }
      .launch-field {
        display: grid;
        gap: 7px;
      }
      .launch-field span,
      .launch-checklist legend {
        color: var(--ink);
        font-size: 13px;
        font-weight: 820;
      }
      .launch-field input {
        width: 100%;
        min-width: 0;
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        background: #fbfcfd;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
        font-weight: 700;
        outline: none;
      }
      .launch-field input:focus {
        border-color: #9be0b5;
        box-shadow: 0 0 0 3px rgba(16, 155, 85, 0.12);
      }
      .launch-checklist {
        display: grid;
        gap: 7px;
        border: 0;
        margin: 0;
        padding: 14px 16px;
      }
      .launch-checklist legend {
        padding: 0 0 4px;
      }
      .launch-step {
        min-height: 62px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 4px 10px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 10px 12px;
        background: #fbfcfd;
        cursor: pointer;
        transition:
          transform 160ms var(--ease-out),
          border-color 160ms var(--ease-out),
          background 160ms var(--ease-out);
      }
      .launch-step:hover {
        border-color: rgba(17, 152, 95, 0.34);
        transform: translateY(-1px);
      }
      .launch-step:has(input:checked) {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .launch-step input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .launch-step-mark {
        grid-row: 1 / 3;
        width: 24px;
        height: 24px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #ffffff;
      }
      .launch-step input:checked + .launch-step-mark,
      .rehearsal-step input:checked + .launch-step-mark {
        border-color: var(--green);
        background: var(--green);
      }
      .launch-step input:checked + .launch-step-mark::after,
      .rehearsal-step input:checked + .launch-step-mark::after {
        content: "✓";
        display: grid;
        place-items: center;
        height: 100%;
        color: #ffffff;
        font-size: 14px;
        font-weight: 900;
      }
      .launch-step strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.2;
      }
      .launch-step small {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .launch-center,
      .launch-gaps {
        min-width: 0;
        display: grid;
        gap: 12px;
      }
      .launch-gaps {
        grid-column: 1 / -1;
        grid-template-columns: minmax(280px, 0.72fr) minmax(280px, 0.68fr) minmax(0, 1fr);
        align-items: start;
      }
      .launch-commands pre {
        max-height: 420px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .launch-human-demo {
        overflow: hidden;
      }
      .receipt-story {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        border-top: 1px solid var(--line);
        background: var(--line);
      }
      .receipt-story div {
        display: grid;
        gap: 8px;
        padding: 18px;
        background: #ffffff;
      }
      .receipt-story span {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 13px;
        font-weight: 930;
      }
      .receipt-story strong {
        color: var(--ink);
        font-size: 15px;
      }
      .receipt-story p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        font-weight: 650;
        line-height: 1.45;
      }
      .launch-gate-details {
        border-top: 1px solid var(--line);
      }
      .launch-gate-details summary {
        background: #ffffff;
      }
      .launch-gate-details summary strong {
        color: var(--green-dark);
        font-size: 12px;
      }
      .launch-actions-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .launch-actions-row a {
        display: grid;
        gap: 6px;
        padding: 13px;
        color: inherit;
        text-decoration: none;
        box-shadow: none;
        transition:
          transform 160ms var(--ease-out),
          border-color 160ms var(--ease-out),
          background 160ms var(--ease-out);
      }
      .launch-actions-row a:hover {
        border-color: #9be0b5;
        background: var(--green-soft);
        transform: translateY(-1px);
      }
      .launch-readiness {
        display: grid;
        gap: 14px;
      }
      .launch-readiness-head {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: start;
        justify-content: space-between;
      }
      .launch-readiness-head h2 {
        margin: 0 0 6px;
      }
      .launch-readiness-head p {
        max-width: 42ch;
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .launch-readiness .preview-status {
        align-items: flex-start;
      }
      .launch-readiness-list {
        max-height: 235px;
        overflow: auto;
      }
      .launch-adoption-card {
        margin-top: 0;
      }
      .launch-adoption-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 16px;
      }
      .launch-adoption-copy h2 {
        margin: 0;
        color: var(--ink);
        font-size: 24px;
        line-height: 1.15;
      }
      .launch-adoption-copy p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .launch-adoption-meta {
        display: grid;
        gap: 8px;
        margin: 16px 0 0;
      }
      .launch-adoption-meta div {
        display: grid;
        grid-template-columns: minmax(110px, 0.42fr) minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 9px 11px;
        background: #fbfcfd;
      }
      .launch-adoption-meta dt {
        color: var(--ink);
        font-size: 12px;
        font-weight: 840;
      }
      .launch-adoption-meta dd {
        min-width: 0;
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .launch-adoption-meta a {
        color: var(--green-dark);
        font-weight: 820;
      }
      .launch-adoption-meta code {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .launch-adoption-issue {
        min-width: 0;
        display: grid;
        gap: 12px;
      }
      .launch-adoption-issue pre {
        max-height: 330px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
        background: #fbfcfd;
        color: var(--ink);
        font-size: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .launch-adoption-issue code {
        display: block;
        white-space: inherit;
        overflow-wrap: anywhere;
      }
      .launch-actions-row strong {
        color: var(--ink);
        font-size: 14px;
      }
      .launch-actions-row span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .launch-proof-list {
        display: grid;
        gap: 1px;
        margin: 0;
        padding: 0;
        list-style: none;
        background: var(--line);
      }
      .launch-proof-list li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 4px 10px;
        align-items: center;
        min-height: 58px;
        padding: 12px 14px;
        background: #ffffff;
      }
      .launch-proof-list b {
        grid-row: 1 / 3;
        width: 24px;
        height: 24px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: #ffffff;
      }
      .launch-proof-list li[data-state="ready"] {
        background: #f0fdf4;
      }
      .launch-proof-list li[data-state="ready"] b {
        display: grid;
        place-items: center;
        border-color: var(--green);
        background: var(--green);
      }
      .launch-proof-list li[data-state="ready"] b::after {
        content: "✓";
        color: #ffffff;
        font-size: 13px;
        font-weight: 900;
      }
      .launch-proof-list li[data-state="active"] {
        background: var(--green-soft);
      }
      .launch-proof-list li[data-state="active"] b {
        border-color: var(--green);
        box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.12);
      }
      .launch-proof-list strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.25;
      }
      .launch-proof-list small {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .launch-blocker-alert {
        display: grid;
        gap: 12px;
        padding: 16px;
      }
      .launch-blocker-alert[data-state="blocked"] {
        border-color: #fed7aa;
        background: #fffbeb;
      }
      .launch-blocker-alert[data-state="ready"] {
        border-color: #bbf7d0;
        background: #f0fdf4;
      }
      .launch-blocker-alert strong {
        color: var(--ink);
        font-size: 17px;
      }
      .launch-blocker-alert p {
        margin: 6px 0 0;
        color: #394556;
        font-size: 13px;
        line-height: 1.45;
      }
      .launch-blocker-alert ul {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .launch-blocker-alert li {
        display: grid;
        gap: 3px;
        border: 1px solid rgba(251, 146, 60, 0.32);
        border-radius: 7px;
        padding: 10px;
        background: #ffffff;
        color: #9a3412;
        font-size: 12px;
        font-weight: 800;
        line-height: 1.35;
      }
      .launch-blocker-alert li span {
        color: #5b6472;
        font-weight: 650;
      }
      .launch-share-card {
        display: grid;
        gap: 12px;
      }
      .launch-share-card pre {
        max-height: 170px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 12px;
        background: #071018;
        color: #e8eef5;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .launch-commands code,
      .launch-share-card code {
        display: block;
        border: 0;
        border-radius: 0;
        padding: 0;
        background: transparent;
        color: inherit;
        font-size: inherit;
        white-space: inherit;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .rehearsal-shell {
        display: grid;
        grid-template-columns: minmax(320px, 0.72fr) minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }
      .rehearsal-output {
        grid-column: 1 / -1;
      }
      .rehearsal-panel {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .rehearsal-fields {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .rehearsal-field {
        display: grid;
        gap: 7px;
      }
      .rehearsal-field span,
      .rehearsal-checklist legend {
        color: var(--ink);
        font-size: 13px;
        font-weight: 820;
      }
      .rehearsal-field input {
        width: 100%;
        min-width: 0;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        background: #fbfcfd;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
        font-weight: 700;
        outline: none;
      }
      .rehearsal-field input:focus {
        border-color: #9be0b5;
        box-shadow: 0 0 0 3px rgba(16, 155, 85, 0.12);
      }
      .rehearsal-checklist {
        display: grid;
        gap: 8px;
        border: 0;
        border-top: 1px solid var(--line);
        margin: 0;
        padding: 16px 18px;
      }
      .rehearsal-checklist legend {
        padding: 0 0 4px;
      }
      .rehearsal-step {
        min-height: 70px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 4px 10px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 10px 12px;
        background: #fbfcfd;
        cursor: pointer;
      }
      .rehearsal-step:has(input:checked) {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .rehearsal-step input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .rehearsal-step strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.2;
      }
      .rehearsal-step small {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .rehearsal-timeline {
        display: grid;
        gap: 14px;
        padding-bottom: 14px;
      }
      .rehearsal-alert {
        margin: 14px 14px 0;
      }
      .rehearsal-stage-list {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0 14px;
      }
      .rehearsal-stage-list li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: #fbfcfd;
      }
      .rehearsal-stage-list li[data-state="active"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .rehearsal-stage-list li[data-state="ready"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .rehearsal-stage-list b {
        display: grid;
        width: 28px;
        height: 28px;
        place-items: center;
        border-radius: 7px;
        background: #ffffff;
        color: var(--ink);
        font-size: 12px;
        font-weight: 900;
      }
      .rehearsal-stage-list li[data-state="ready"] b {
        background: var(--green);
        color: #ffffff;
      }
      .rehearsal-stage-list strong {
        display: block;
        color: var(--ink);
        font-size: 14px;
      }
      .rehearsal-stage-list small {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .rehearsal-links {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: 0 14px;
      }
      .rehearsal-links a {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        color: var(--ink);
        font-size: 12px;
        font-weight: 840;
        text-decoration: none;
      }
      .rehearsal-links a:hover {
        border-color: #0b0f16;
      }
      .rehearsal-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        border-bottom: 1px solid var(--line);
        padding: 12px 14px;
        background: #fbfcfd;
      }
      .rehearsal-tabs button {
        min-height: 38px;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: #ffffff;
        color: var(--muted);
        font: inherit;
        font-size: 12px;
        font-weight: 850;
        cursor: pointer;
      }
      .rehearsal-tabs button[aria-selected="true"] {
        border-color: #0b0f16;
        background: #0b0f16;
        color: #ffffff;
      }
      .rehearsal-pre {
        max-height: 545px;
        min-height: 545px;
        margin: 0;
        overflow: auto;
        padding: 18px;
        background: #fbfcfd;
        color: var(--ink);
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .rehearsal-pre[hidden] {
        display: none;
      }
      .rehearsal-output-actions {
        border-top: 1px solid var(--line);
      }
      .rehearsal-output-actions .button[data-copied="true"] {
        border-color: var(--green);
        color: var(--green-dark);
      }
      .trace-shell {
        display: grid;
        grid-template-columns: minmax(320px, 0.72fr) minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }
      .trace-output {
        grid-column: 1 / -1;
      }
      .trace-panel {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .trace-fields {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .trace-field {
        display: grid;
        gap: 7px;
      }
      .trace-field span,
      .trace-checklist legend {
        color: var(--ink);
        font-size: 13px;
        font-weight: 820;
      }
      .trace-field input {
        width: 100%;
        min-width: 0;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        background: #fbfcfd;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
        font-weight: 700;
        outline: none;
      }
      .trace-field input:focus {
        border-color: #9be0b5;
        box-shadow: 0 0 0 3px rgba(16, 155, 85, 0.12);
      }
      .trace-secret-note {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        margin: 0 18px 16px;
        border: 1px solid #ffe2a8;
        border-radius: 7px;
        padding: 11px;
        background: #fffaf0;
      }
      .trace-secret-note .mini-shield {
        background: var(--amber);
      }
      .trace-secret-note p {
        margin: 0;
        color: #684300;
        font-size: 12px;
        line-height: 1.45;
      }
      .trace-checklist {
        display: grid;
        gap: 8px;
        border: 0;
        border-top: 1px solid var(--line);
        margin: 0;
        padding: 16px 18px;
      }
      .trace-checklist legend {
        padding: 0 0 4px;
      }
      .trace-step {
        min-height: 66px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 4px 10px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 10px 12px;
        background: #fbfcfd;
        cursor: pointer;
      }
      .trace-step:has(input:checked) {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .trace-step input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .trace-step input:checked + .launch-step-mark {
        border-color: var(--green);
        background: var(--green);
      }
      .trace-step input:checked + .launch-step-mark::after {
        content: "✓";
        display: grid;
        place-items: center;
        height: 100%;
        color: #ffffff;
        font-size: 14px;
        font-weight: 900;
      }
      .trace-step strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.2;
      }
      .trace-step small {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .trace-chain {
        display: grid;
        gap: 14px;
        padding-bottom: 14px;
      }
      .trace-alert {
        margin: 14px 14px 0;
      }
      .trace-stage-list {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0 14px;
      }
      .trace-stage-list li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: #fbfcfd;
      }
      .trace-stage-list li[data-state="active"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .trace-stage-list li[data-state="ready"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .trace-stage-list b {
        display: grid;
        width: 28px;
        height: 28px;
        place-items: center;
        border-radius: 7px;
        background: #ffffff;
        color: var(--ink);
        font-size: 12px;
        font-weight: 900;
      }
      .trace-stage-list li[data-state="ready"] b {
        background: var(--green);
        color: #ffffff;
      }
      .trace-stage-list strong {
        display: block;
        color: var(--ink);
        font-size: 14px;
      }
      .trace-stage-list small {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .trace-receipt-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: 0 14px;
      }
      .trace-receipt-strip div {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 10px;
        background: #ffffff;
      }
      .trace-receipt-strip span {
        display: block;
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .trace-receipt-strip strong {
        display: block;
        margin-top: 5px;
        overflow: hidden;
        color: var(--ink);
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .trace-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        border-bottom: 1px solid var(--line);
        padding: 12px 14px;
        background: #fbfcfd;
      }
      .trace-tabs button {
        min-height: 38px;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: #ffffff;
        color: var(--muted);
        font: inherit;
        font-size: 12px;
        font-weight: 850;
        cursor: pointer;
      }
      .trace-tabs button[aria-selected="true"] {
        border-color: #0b0f16;
        background: #0b0f16;
        color: #ffffff;
      }
      .trace-pre {
        max-height: 565px;
        min-height: 565px;
        margin: 0;
        overflow: auto;
        padding: 18px;
        background: #fbfcfd;
        color: var(--ink);
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .trace-pre[hidden] {
        display: none;
      }
      .trace-output-actions {
        border-top: 1px solid var(--line);
      }
      .trace-output-actions .button[data-copied="true"] {
        border-color: var(--green);
        color: var(--green-dark);
      }
      .demo-actions {
        margin-top: 22px;
      }
      .demo-lab-strip,
      .demo-install-strip {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
      }
      .demo-lab-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-bottom: 18px;
        overflow: hidden;
      }
      .demo-lab-strip div {
        min-width: 0;
        padding: 18px;
        border-right: 1px solid var(--line);
      }
      .demo-lab-strip div:last-child {
        border-right: 0;
      }
      .demo-lab-strip strong {
        display: block;
        color: var(--ink);
        font-size: 18px;
        line-height: 1.15;
      }
      .demo-lab-strip span {
        display: block;
        margin-top: 8px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .demo-shell {
        display: grid;
        grid-template-columns: minmax(340px, 0.68fr) minmax(620px, 1.2fr);
        gap: 18px;
        align-items: start;
      }
      .demo-control,
      .demo-pr-panel,
      .demo-audit-panel,
      .demo-next {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
        overflow: hidden;
      }
      .demo-steps {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .demo-step {
        min-height: 78px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 4px 12px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: #fbfcfd;
        color: inherit;
        cursor: pointer;
        text-align: left;
      }
      .demo-step:hover,
      .demo-step[data-active="true"] {
        border-color: #9be0b5;
        background: var(--green-soft);
      }
      .demo-step span {
        grid-row: 1 / 3;
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--ink);
        color: #ffffff;
        font-weight: 850;
      }
      .demo-step strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.2;
      }
      .demo-step small {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .demo-copy-check {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        border-top: 1px solid var(--line);
        padding: 14px 18px;
      }
      .demo-copy-check span {
        grid-column: 1 / -1;
        color: var(--muted);
        font-size: 12px;
        font-weight: 820;
      }
      .demo-copy-check code {
        width: fit-content;
        min-width: 0;
      }
      .demo-stage {
        min-width: 0;
        display: grid;
        gap: 14px;
      }
      .demo-status {
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid #ffe2a8;
        border-radius: 8px;
        padding: 14px;
        background: #fffaf0;
      }
      .demo-status[data-state="ready"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .demo-status[data-state="ready"] .mini-shield {
        background: var(--green);
      }
      .demo-status .mini-shield {
        background: var(--amber);
      }
      .demo-status strong {
        display: block;
        color: var(--ink);
        font-size: 17px;
      }
      .demo-status p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .demo-pr-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(260px, 0.62fr);
        gap: 14px;
        align-items: start;
      }
      .demo-pr-panel {
        box-shadow: none;
      }
      .demo-checks {
        display: grid;
        gap: 10px;
        padding: 0 16px 14px;
      }
      .demo-check {
        min-height: 74px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: #fbfcfd;
      }
      .demo-check[data-state="held"],
      .demo-check[data-state="waiting"] {
        border-color: #ffe2a8;
        background: #fffaf0;
      }
      .demo-check[data-state="verified"],
      .demo-check[data-state="ready"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .demo-check-mark {
        display: inline-grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 1px solid var(--line);
        background: #ffffff;
      }
      .demo-check[data-state="held"] .demo-check-mark,
      .demo-check[data-state="waiting"] .demo-check-mark {
        border-color: var(--amber);
      }
      .demo-check[data-state="verified"] .demo-check-mark,
      .demo-check[data-state="ready"] .demo-check-mark {
        border-color: var(--green);
        background: var(--green);
      }
      .demo-check strong {
        display: block;
        color: var(--ink);
        font-size: 14px;
      }
      .demo-check p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .demo-check > span:last-child {
        color: #27303b;
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
      }
      .demo-comment {
        margin: 0 16px 16px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
        background: #ffffff;
      }
      .demo-comment p {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }
      .demo-comment .button {
        margin-top: 12px;
      }
      .demo-audit-panel {
        box-shadow: none;
      }
      .demo-audit-list {
        display: grid;
        gap: 8px;
        padding: 14px;
      }
      .demo-audit-list div {
        display: grid;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px 12px;
        background: #fbfcfd;
      }
      .demo-audit-list div[data-level="warning"] {
        border-color: #ffe2a8;
        background: #fffaf0;
      }
      .demo-audit-list div[data-level="success"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .demo-audit-list strong {
        color: var(--ink);
        font-size: 13px;
      }
      .demo-audit-list span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .demo-next {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 24px;
        align-items: center;
        margin-top: 18px;
        padding: 24px;
      }
      .demo-next h2 {
        margin: 0;
        color: var(--ink);
        font-size: 26px;
      }
      .demo-next p {
        max-width: 720px;
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.5;
      }
      .demo-next-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
      }
      .demo-install-strip {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 0.8fr) auto;
        gap: 18px;
        align-items: center;
        margin-top: 18px;
        padding: 22px;
      }
      .demo-install-strip h2 {
        margin: 0;
        color: var(--ink);
        font-size: 24px;
        line-height: 1.15;
      }
      .demo-install-strip p {
        max-width: 560px;
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .demo-install-strip pre {
        max-height: 180px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
        background: #fbfcfd;
        color: var(--ink);
        font-size: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
      }
      .preview-shell {
        display: grid;
        grid-template-columns: minmax(420px, 0.9fr) minmax(0, 1.1fr);
        gap: 18px;
        align-items: start;
      }
      .wizard-shell {
        display: grid;
        grid-template-columns: minmax(420px, 0.9fr) minmax(420px, 0.86fr);
        gap: 18px;
        align-items: start;
      }
      .diagnostics-shell {
        display: grid;
        grid-template-columns: minmax(360px, 0.72fr) minmax(560px, 1fr);
        gap: 18px;
        align-items: start;
      }
      .status-shell {
        display: grid;
        grid-template-columns: minmax(360px, 0.78fr) minmax(560px, 1fr);
        gap: 18px;
        align-items: start;
      }
      .wizard-options,
      .diagnostics-form,
      .status-board,
      .wizard-output .workflow-panel {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .status-list {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
      }
      .status-tile {
        min-height: 76px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: #fbfcfd;
        transition:
          transform 160ms var(--ease-out),
          border-color 160ms var(--ease-out);
      }
      .status-tile:hover {
        border-color: rgba(17, 152, 95, 0.32);
        transform: translateY(-1px);
      }
      .status-tile[data-state="ready"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .status-tile[data-state="warn"] {
        border-color: #ffe2a8;
        background: #fffaf0;
      }
      .status-tile[data-state="error"] {
        border-color: #ffcdc9;
        background: var(--red-bg);
      }
      .status-mark {
        width: 28px;
        height: 28px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
      }
      .status-mark[data-state="checking"] {
        background:
          linear-gradient(
            90deg,
            transparent 0,
            rgba(8, 13, 20, 0.05) 50%,
            transparent 100%
          ),
          #ffffff;
      }
      .status-mark[data-state="ready"] {
        border-color: var(--green);
        background: var(--green);
      }
      .status-mark[data-state="warn"] {
        border-color: var(--amber);
        background: var(--amber);
      }
      .status-mark[data-state="error"] {
        border-color: var(--red);
        background: var(--red);
      }
      .status-tile h2 {
        margin: 0;
        color: var(--ink);
        font-size: 15px;
        line-height: 1.2;
      }
      .status-tile p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.35;
      }
      .status-tile > strong {
        justify-self: end;
        color: #27303b;
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
      }
      .wizard-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        border: 0;
        border-top: 1px solid var(--line);
        margin: 0;
        padding: 22px 18px 18px;
      }
      .wizard-group > * {
        min-width: 0;
      }
      .wizard-group:first-of-type {
        grid-template-columns: 1fr;
      }
      .wizard-repository-group {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
      }
      .wizard-group.diagnostics-fields:first-of-type {
        grid-template-columns: 1fr 1fr;
      }
      .wizard-group legend {
        grid-column: 1 / -1;
        width: 100%;
        margin: 0 0 8px;
        padding: 0;
        color: var(--ink);
        font-size: 15px;
        font-weight: 850;
        line-height: 1.25;
      }
      .wizard-choice {
        min-height: 76px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 7px;
        padding: 12px;
        background: #fbfcfd;
        cursor: pointer;
      }
      .wizard-choice:has(input:checked) {
        border-color: #9be0b5;
        background: var(--green-soft);
      }
      .wizard-choice input {
        width: 17px;
        height: 17px;
        margin: 2px 0 0;
        accent-color: var(--green);
      }
      .wizard-choice strong,
      .wizard-choice small,
      .wizard-field span {
        display: block;
      }
      .wizard-choice strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.25;
      }
      .wizard-choice small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .wizard-field {
        display: grid;
        gap: 8px;
      }
      .wizard-field.wide {
        grid-column: 1 / -1;
      }
      .wizard-field span {
        color: var(--ink);
        font-size: 13px;
        font-weight: 820;
      }
      .wizard-field input {
        min-height: 42px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 12px;
        outline: none;
        color: var(--text);
        background: #fbfcfd;
        font: inherit;
        font-size: 13px;
      }
      .wizard-field input:focus {
        border-color: #9be0b5;
        box-shadow: 0 0 0 3px rgba(16, 155, 85, 0.12);
      }
      .wizard-repository-field {
        min-width: 0;
      }
      .wizard-evidence {
        grid-column: 1 / -1;
        display: grid;
        gap: 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 14px;
        background: #fbfcfd;
      }
      .wizard-evidence[data-risk="high"] {
        border-color: #fbbf24;
        background: #fffbeb;
      }
      .wizard-evidence[data-risk="medium"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .wizard-evidence[data-risk="low"] {
        border-color: #b7efc9;
        background: var(--green-soft);
      }
      .wizard-evidence[data-risk="error"] {
        border-color: #ffcdc9;
        background: var(--red-bg);
      }
      .wizard-evidence-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
      }
      .wizard-evidence-head strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.35;
      }
      .wizard-evidence-head span {
        min-height: 24px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0 9px;
        background: #ffffff;
        color: #526171;
        font-size: 11px;
        font-weight: 860;
        text-transform: uppercase;
      }
      .wizard-evidence dl {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        margin: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: var(--line);
      }
      .wizard-evidence dl div {
        display: grid;
        gap: 5px;
        min-height: 66px;
        align-content: center;
        padding: 10px;
        background: #ffffff;
      }
      .wizard-evidence dt {
        color: #5b6472;
        font-size: 11px;
        font-weight: 860;
      }
      .wizard-evidence dd {
        margin: 0;
        color: var(--ink);
        font-size: 19px;
        font-weight: 900;
        line-height: 1;
      }
      .wizard-handoff {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .wizard-handoff a {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: #ffffff;
        color: var(--ink);
        font-size: 12px;
        font-weight: 840;
      }
      .wizard-handoff a:hover {
        border-color: #0b0f16;
      }
      .wizard-output {
        display: grid;
        gap: 14px;
        min-width: 0;
        position: sticky;
        top: 92px;
      }
      .wizard-install-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .wizard-install-card {
        display: grid;
        gap: 14px;
      }
      .wizard-install-card.wide {
        grid-column: 1 / -1;
      }
      .install-card-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
      }
      .install-card-head h2 {
        margin: 0;
      }
      .install-card-head p {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .install-card-head > span {
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        border: 1px solid #b7efc9;
        border-radius: 999px;
        padding: 0 10px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 11px;
        font-weight: 860;
        text-transform: uppercase;
      }
      .install-checklist {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .install-checklist li {
        display: grid;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px 12px;
        background: #fbfcfd;
      }
      .install-checklist strong {
        color: var(--ink);
        font-size: 13px;
        line-height: 1.25;
      }
      .install-checklist span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      .install-code {
        max-height: 300px;
      }
      .install-code code {
        display: block;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
      }
      .diagnostics-output {
        min-width: 0;
      }
      .status-output {
        min-width: 0;
      }
      .diagnostics-actions {
        border-top: 1px solid var(--line);
        padding: 14px 18px;
      }
      .diagnostics-actions .button {
        width: 100%;
      }
      .wizard-output .workflow-panel pre {
        max-height: 380px;
        overflow: auto;
      }
      .wizard-output .preview-output {
        box-shadow: 0 18px 44px rgba(8, 13, 20, 0.08);
      }
      .preview-actions .button[data-copied="true"] {
        border-color: var(--green);
        color: var(--green-dark);
      }
      .audit-result {
        display: grid;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 12px;
        background: #fbfcfd;
      }
      .audit-result strong {
        color: var(--ink);
        font-size: 13px;
      }
      .audit-result span {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .preview-editor,
      .preview-output,
      .preview-card {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: var(--shadow-soft);
        overflow: hidden;
      }
      .preview-editor textarea {
        width: 100%;
        min-height: 590px;
        display: block;
        resize: vertical;
        border: 0;
        border-bottom: 1px solid var(--line);
        padding: 18px 20px;
        outline: none;
        background: #fbfcfd;
        color: #101821;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 13px;
        line-height: 1.55;
      }
      .preview-editor textarea:focus {
        box-shadow: inset 0 0 0 2px rgba(16, 155, 85, 0.22);
      }
      .preview-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 14px;
      }
      .preview-actions .button[disabled] {
        opacity: 0.72;
        cursor: wait;
      }
      .preview-output {
        display: grid;
        gap: 14px;
        padding: 14px;
      }
      .preview-status {
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid #b7efc9;
        border-radius: 7px;
        padding: 14px;
        background: var(--green-soft);
      }
      .preview-status[data-state="error"] {
        border-color: #ffcdc9;
        background: var(--red-bg);
      }
      .preview-status[data-service-state="warn"] {
        border-color: #ffe2a8;
        background: #fffaf0;
      }
      .preview-status[data-service-state="error"] {
        border-color: #ffcdc9;
        background: var(--red-bg);
      }
      .preview-status[data-service-state="warn"] .mini-shield {
        background: var(--amber);
      }
      .preview-status[data-service-state="error"] .mini-shield {
        background: var(--red);
      }
      .preview-status[data-state="error"] .mini-shield {
        background: var(--red);
      }
      .preview-status strong {
        display: block;
        color: var(--ink);
        font-size: 16px;
      }
      .preview-status p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .preview-result-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .preview-card {
        box-shadow: none;
        padding: 18px;
      }
      .preview-card.wide {
        grid-column: 1 / -1;
      }
      .preview-card h2 {
        margin: 0 0 14px;
        color: var(--ink);
        font-size: 18px;
      }
      .preview-card dl {
        display: grid;
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--line);
        margin: 0;
      }
      .preview-card dl div {
        display: grid;
        grid-template-columns: minmax(120px, 0.62fr) minmax(0, 1fr);
        background: #ffffff;
      }
      .preview-card dt,
      .preview-card dd {
        min-height: 42px;
        display: flex;
        align-items: center;
        margin: 0;
        padding: 10px 12px;
        font-size: 13px;
        line-height: 1.35;
      }
      .preview-card dt {
        color: #27303b;
        background: #fbfcfd;
        font-weight: 820;
      }
      .preview-card dd {
        color: var(--muted);
        word-break: break-word;
      }
      .status-json {
        max-height: 260px;
        margin: 0;
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 12px;
        background: #071018;
        color: #e8eef5;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.5;
      }
      .diagnostic-list {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .diagnostic-list li {
        display: grid;
        gap: 4px;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px 12px;
        background: #fbfcfd;
      }
      .diagnostic-list li[data-level="error"] {
        border-color: #ffcdc9;
        background: var(--red-bg);
      }
      .diagnostic-list li[data-level="warning"] {
        border-color: #ffe2a8;
        background: #fffaf0;
      }
      .diagnostic-list strong {
        color: var(--ink);
        font-size: 13px;
      }
      .diagnostic-list span {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .policy-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .policy-tags span {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0 11px;
        background: #fbfcfd;
        color: var(--muted);
        font-size: 13px;
        font-weight: 760;
      }
      .policy-tags span[data-enabled="true"] {
        border-color: #b7efc9;
        background: var(--green-soft);
        color: var(--green-dark);
      }
      .gate-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 34px 20px;
        background:
          radial-gradient(circle at 50% 0%, rgba(17, 152, 95, 0.09), transparent 32rem),
          linear-gradient(90deg, rgba(21, 31, 44, 0.03) 1px, transparent 1px),
          linear-gradient(180deg, rgba(21, 31, 44, 0.025) 1px, transparent 1px);
        background-size: auto, 72px 72px, 72px 72px;
      }
      .gate-shell {
        width: min(1080px, 100%);
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.68fr);
        gap: 18px;
        align-items: stretch;
      }
      .gate {
        width: 100%;
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: var(--shadow);
        padding: 30px;
        text-align: left;
      }
      .gate .brand.centered {
        justify-content: flex-start;
      }
      .gate.small {
        width: min(480px, 100%);
      }
      .gate-primary {
        min-height: 100%;
      }
      .gate h1 {
        margin: 22px 0 12px;
        color: var(--ink);
        font-size: clamp(32px, 5vw, 44px);
        line-height: 1.08;
        text-wrap: balance;
      }
      .intro,
      .fine-print {
        color: var(--muted);
        line-height: 1.5;
      }
      .intro {
        margin: 0 0 22px;
        max-width: 620px;
        font-size: 17px;
      }
      .intro strong,
      .intro a,
      .intro code {
        color: var(--ink);
        font-weight: 820;
      }
      .fine-print {
        margin: 16px 0 0;
        max-width: 560px;
        font-size: 14px;
      }
      .status-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 20px;
        background: rgba(255, 255, 255, 0.92);
      }
      .status-strip > span {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 52px;
        color: var(--green);
        font-size: 14px;
        font-weight: 760;
      }
      .status-strip > span + span {
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
        min-height: 104px;
        margin-top: 18px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: linear-gradient(#ffffff, #f8fafc);
      }
      .button.full {
        width: 100%;
        min-height: 54px;
        margin-top: 22px;
        font-size: 17px;
      }
      .gate-complete-action .button.full {
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
      .notice strong,
      .notice span {
        display: block;
      }
      .notice strong {
        margin-bottom: 4px;
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
      .gate-side {
        display: grid;
        gap: 18px;
        align-content: start;
      }
      .gate-panel {
        border: 1px solid rgba(21, 31, 44, 0.11);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.95);
        padding: 22px;
        box-shadow: var(--shadow-soft);
      }
      .gate-panel-head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 14px;
      }
      .gate-panel h2 {
        margin: 0;
        color: var(--ink);
        font-size: 18px;
        line-height: 1.2;
      }
      .gate-panel p {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .gate-status-badge {
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        border: 1px solid #f2d085;
        border-radius: 999px;
        padding: 0 10px;
        background: #fff9e8;
        color: #8b5c00;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .gate-status-badge[data-state="verified"] {
        border-color: #b7efc9;
        background: var(--green-soft);
        color: var(--green-dark);
      }
      .gate-receipt-list {
        margin: 18px 0 0;
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
      }
      .gate-receipt-list div {
        display: grid;
        grid-template-columns: 0.86fr minmax(0, 1.14fr);
      }
      .gate-receipt-list div + div {
        border-top: 1px solid var(--line);
      }
      .gate-receipt-list dt,
      .gate-receipt-list dd {
        margin: 0;
        min-height: 46px;
        display: flex;
        align-items: center;
        padding: 0 12px;
        font-size: 13px;
      }
      .gate-receipt-list dt {
        border-right: 1px solid var(--line);
        background: var(--faint);
        color: #27303b;
        font-weight: 760;
      }
      .gate-receipt-list dd {
        min-width: 0;
        color: var(--muted);
        overflow-wrap: anywhere;
      }
      .gate-receipt-list a {
        color: var(--ink);
        font-weight: 720;
      }
      .gate-check-list {
        display: grid;
        gap: 12px;
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
      }
      .gate-check-list li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fbfcfd;
        padding: 13px;
      }
      .gate-check-icon {
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: var(--green-soft);
        color: var(--green-dark);
        font-size: 13px;
        font-weight: 900;
      }
      .gate-check-list strong,
      .gate-check-list small {
        display: block;
      }
      .gate-check-list strong {
        color: var(--ink);
        font-size: 14px;
        line-height: 1.2;
      }
      .gate-check-list small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      @media (prefers-reduced-transparency: reduce) {
        .site-header {
          background: #fbfcfd;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
      }
      @media (max-width: 980px) {
        .site-header,
        .home,
        .preview-page,
        .site-footer {
          width: min(100% - 32px, 1200px);
        }
        .site-header {
          align-items: flex-start;
          flex-direction: column;
          padding: 18px 0;
        }
        .site-nav {
          width: 100%;
          flex-wrap: wrap;
          gap: 18px;
        }
        .site-nav a {
          flex: 0 0 auto;
        }
        .header-cta {
          width: 100%;
        }
        .hero,
        .preview-heading,
        .queue-shell,
        .evidence-shell,
        .radar-shell,
        .radar-query-strip,
        .pilot-shell,
        .pilot-card-grid,
        .trust-shell,
        .badge-shell,
        .proof-shell,
        .scorecard-adoption-grid,
        .manifest-shell,
        .manifest-callback-shell,
        .launch-decision-strip,
        .launch-shell,
        .launch-gaps,
        .launch-adoption-grid,
        .gate-shell,
        .rehearsal-shell,
        .trace-shell,
        .demo-shell,
        .demo-pr-grid,
        .demo-install-strip,
        .demo-next,
        .preview-shell,
        .wizard-shell,
        .diagnostics-shell,
        .status-shell,
        .setup-section,
        .security-band,
        .pressure-section,
        .site-footer {
          grid-template-columns: 1fr;
        }
        .hero {
          min-height: auto;
          gap: 34px;
        }
        .product-stage {
          grid-template-columns: 1fr;
        }
        .hero-proof-grid {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .pressure-copy {
          max-width: 760px;
        }
        .pressure-accordion {
          min-height: 420px;
        }
        .audit-stream {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .timeline,
        .proof-grid,
        .queue-strip,
        .roadmap-grid {
          grid-template-columns: 1fr;
        }
        .scorecard-action-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .proof-card,
        .proof-card:first-child,
        .proof-card:nth-child(2),
        .proof-card:nth-child(3) {
          transform: none;
        }
        .timeline {
          border-top: 0;
        }
        .timeline-item {
          min-height: auto;
          padding: 18px 0 18px 44px;
          border-left: 1px solid var(--line);
        }
        .timeline-item:first-child {
          border-left: 1px solid var(--line);
        }
        .timeline-item span {
          position: absolute;
          top: 18px;
          left: -15px;
        }
        .section-heading.split {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .security-grid,
        .ready-panel,
        .preview-result-grid,
        .demo-next-actions,
        .footer-points {
          grid-template-columns: 1fr;
        }
        .demo-next-actions {
          justify-content: flex-start;
        }
        .queue-scoreboard {
          grid-template-columns: 1fr;
        }
        .evidence-controls {
          position: static;
        }
        .radar-shell {
          grid-template-areas: none;
        }
        .radar-panel {
          grid-area: auto;
          position: static;
        }
        .wizard-output {
          position: static;
        }
        .radar-results,
        .radar-side-column,
        .radar-summary-card {
          grid-area: auto;
        }
        .radar-side-column {
          grid-template-columns: 1fr;
        }
        .radar-cluster-list {
          max-height: none;
          overflow: visible;
        }
        .pilot-controls {
          position: static;
        }
        .trust-rail {
          position: static;
        }
        .radar-summary-card {
          grid-column: 1;
        }
        .radar-table-head {
          display: none;
        }
        .evidence-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .demo-lab-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .demo-lab-strip div:nth-child(2) {
          border-right: 0;
        }
        .demo-lab-strip div:nth-child(-n + 2) {
          border-bottom: 1px solid var(--line);
        }
        .demo-install-strip {
          align-items: stretch;
        }
        .demo-install-strip .button {
          width: fit-content;
        }
        .launch-actions-row {
          grid-template-columns: 1fr;
        }
        .launch-decision-card {
          min-height: 96px;
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
        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }
        body {
          background-size: 52px 52px;
        }
        .site-header,
        .home,
        .preview-page,
        .site-footer {
          width: calc(100% - 32px);
          max-width: calc(100% - 32px);
        }
        .site-header {
          gap: 16px;
        }
        .site-nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding-bottom: 0;
          font-size: 13px;
          line-height: 1;
        }
        .site-nav a {
          min-width: 0;
          overflow: hidden;
          text-align: center;
          text-overflow: ellipsis;
        }
        .site-nav a:nth-child(4),
        .site-nav a:nth-child(5),
        .site-nav a:nth-child(6),
        .site-nav a:nth-child(8),
        .site-nav a:nth-child(9),
        .site-nav a:nth-child(10) {
          display: none;
        }
        .utility-header .site-nav {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .utility-header .site-nav a:nth-child(4),
        .utility-header .site-nav a:nth-child(8) {
          display: block;
        }
        .utility-header .site-nav a:nth-child(5),
        .utility-header .site-nav a:nth-child(6),
        .utility-header .site-nav a:nth-child(7),
        .utility-header .site-nav a:nth-child(9) {
          display: none;
        }
        .rehearsal-header .site-nav {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .rehearsal-header .site-nav a:nth-child(3),
        .rehearsal-header .site-nav a:nth-child(4),
        .rehearsal-header .site-nav a:nth-child(8),
        .rehearsal-header .site-nav a:nth-child(10) {
          display: none;
        }
        .rehearsal-header .site-nav a:nth-child(5),
        .rehearsal-header .site-nav a:nth-child(6),
        .rehearsal-header .site-nav a:nth-child(7),
        .rehearsal-header .site-nav a:nth-child(9) {
          display: block;
        }
        .trace-header .site-nav {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .trace-header .site-nav a:nth-child(4),
        .trace-header .site-nav a:nth-child(6),
        .trace-header .site-nav a:nth-child(7),
        .trace-header .site-nav a:nth-child(9) {
          display: none;
        }
        .trace-header .site-nav a:nth-child(5),
        .trace-header .site-nav a:nth-child(8) {
          display: block;
        }
        .proof-header .site-nav a:nth-child(5) {
          display: block;
        }
        .proof-header .site-nav a:nth-child(8) {
          display: none;
        }
        .manifest-header .site-nav a:nth-child(6) {
          display: block;
        }
        .manifest-header .site-nav a:nth-child(8) {
          display: none;
        }
        .brand {
          font-size: 24px;
        }
        .header-cta {
          display: none;
        }
        .hero-copy h1 {
          font-size: clamp(42px, 12vw, 54px);
          line-height: 1;
          margin-bottom: 16px;
        }
        .preview-heading h1 {
          max-width: 100%;
          font-size: 42px;
          line-height: 1.02;
          overflow-wrap: break-word;
          text-wrap: auto;
        }
        .preview-heading p {
          max-width: 100%;
          font-size: 16px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .preview-heading .actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .preview-heading .actions .button {
          width: 100%;
        }
        .demo-lab-strip {
          grid-template-columns: 1fr;
        }
        .demo-lab-strip div {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }
        .demo-lab-strip div:last-child {
          border-bottom: 0;
        }
        .demo-install-strip {
          padding: 16px;
        }
        .demo-install-strip pre {
          max-height: 160px;
          font-size: 11px;
        }
        .demo-install-strip .button {
          width: 100%;
        }
        .hero-copy p {
          font-size: 17px;
          line-height: 1.42;
        }
        .queue-presets {
          grid-template-columns: 1fr;
        }
        .evidence-presets,
        .evidence-metrics,
        .evidence-recommendation dl,
        .pilot-presets,
        .pilot-metrics {
          grid-template-columns: 1fr;
        }
        .evidence-share div {
          grid-template-columns: 1fr;
        }
        .evidence-share .button {
          width: 100%;
        }
        .evidence-brief-actions {
          grid-template-columns: 1fr;
        }
        .evidence-brief-actions .button {
          width: 100%;
        }
        .evidence-pr-row {
          grid-template-columns: 1fr;
        }
        .radar-proof,
        .radar-totals div,
        .radar-row,
        .trust-doc-row {
          grid-template-columns: 1fr;
        }
        .radar-cluster-top {
          display: grid;
        }
        .radar-proof div {
          border-right: 0 !important;
        }
        .radar-proof {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .radar-proof div {
          min-height: 86px;
          padding: 14px;
        }
        .radar-proof div:nth-child(odd) {
          border-right: 1px solid var(--line) !important;
        }
        .radar-proof strong {
          font-size: 19px;
        }
        .trust-readiness small,
        .trust-doc-row p,
        .trust-checklist span {
          overflow-wrap: anywhere;
        }
        .trust-doc-row code {
          text-align: left;
        }
        .evidence-author {
          text-align: left;
        }
        .queue-recommendation dl div {
          grid-template-columns: 1fr;
        }
        .badge-toggle-group {
          grid-template-columns: 1fr;
        }
        .proof-toggle-group {
          grid-template-columns: 1fr;
        }
        .scorecard-action-grid {
          grid-template-columns: 1fr;
        }
        .scorecard-action {
          min-height: 92px;
        }
        .manifest-target {
          grid-template-columns: 1fr;
        }
        .manifest-permission-row {
          grid-template-columns: 1fr;
          align-items: start;
        }
        .manifest-permission-row span {
          justify-self: start;
        }
        .launch-fields,
        .launch-checklist {
          padding: 14px;
        }
        .launch-adoption-grid {
          padding: 12px;
        }
        .launch-adoption-copy h2 {
          font-size: 21px;
        }
        .launch-adoption-meta div {
          grid-template-columns: 1fr;
          gap: 4px;
        }
        .launch-adoption-issue pre {
          max-height: 260px;
          font-size: 11px;
        }
        .launch-adoption-issue .preview-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .launch-adoption-issue .button {
          width: 100%;
        }
        .launch-step {
          min-height: 72px;
        }
        .launch-commands pre {
          max-height: 320px;
        }
        .launch-share-card pre {
          max-height: 150px;
        }
        .rehearsal-fields,
        .rehearsal-checklist,
        .trace-fields,
        .trace-checklist {
          padding: 14px;
        }
        .rehearsal-stage-list,
        .rehearsal-links,
        .trace-stage-list {
          padding-left: 14px;
          padding-right: 14px;
        }
        .trace-secret-note {
          margin-left: 14px;
          margin-right: 14px;
        }
        .rehearsal-pre,
        .trace-pre {
          min-height: 360px;
          max-height: 360px;
          font-size: 11px;
        }
        .rehearsal-tabs,
        .rehearsal-links,
        .rehearsal-output-actions,
        .trace-tabs,
        .trace-receipt-strip,
        .trace-output-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .launch-proof-list li {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .rehearsal-output-actions .button,
        .trace-output-actions .button {
          width: 100%;
        }
        .hero {
          gap: 18px;
          padding-bottom: 18px;
        }
        .product-stage {
          display: grid;
          gap: 12px;
        }
        .hero-media figcaption {
          position: static;
          width: auto;
          padding: 13px 14px;
          color: var(--ink);
          background: #ffffff;
          text-shadow: none;
        }
        .hero-media figure::after {
          display: none;
        }
        .hero-proof-grid {
          grid-template-columns: 1fr;
        }
        .hero-proof-grid div {
          min-height: 64px;
          padding: 13px 14px;
        }
        .pressure-section {
          margin-top: 44px;
        }
        .pressure-copy h2 {
          font-size: clamp(34px, 10vw, 46px);
        }
        .pressure-copy p {
          font-size: 16px;
          line-height: 1.45;
        }
        .pressure-accordion {
          min-height: auto;
          display: grid;
          grid-template-columns: 1fr;
        }
        .pressure-panel,
        .pressure-panel:first-child,
        .pressure-panel:hover,
        .pressure-panel:focus-within {
          min-height: 220px;
          flex: none;
        }
        .pressure-panel {
          border-right: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.16);
        }
        .pressure-panel:last-child {
          border-bottom: 0;
        }
        .pressure-panel p {
          width: auto;
        }
        .repo-topbar {
          min-height: 46px;
          padding: 0 12px;
          font-size: 13px;
        }
        .repo-topbar span {
          font-size: 11px;
        }
        .repo-pr {
          padding: 10px 12px;
        }
        .repo-pr h2 {
          font-size: 18px;
        }
        .repo-pr p,
        .check-body p {
          display: none;
        }
        .repo-pr p,
        .check-body p,
        .bot-comment p,
        .gate-card p {
          font-size: 12px;
        }
        .checks {
          margin: 0 12px 12px;
        }
        .check-row {
          grid-template-columns: auto minmax(0, 1fr);
          gap: 10px;
          padding: 8px 10px;
        }
        .check-row button {
          grid-column: 2;
          width: fit-content;
          min-height: 32px;
          padding: 0 14px;
        }
        .audit-stream {
          grid-template-columns: 1fr;
          margin: 0 12px 12px;
        }
        .audit-stream div {
          min-height: 48px;
          grid-template-columns: auto minmax(0, 1fr);
          padding: 9px 11px;
        }
        .bot-comment {
          margin: 0 12px 12px;
          padding: 12px;
        }
        .gate-card {
          padding: 14px;
        }
        .gate-brand {
          margin-bottom: 12px;
        }
        .gate-card h3 {
          font-size: 18px;
        }
        .gate-card dl {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 14px 0;
        }
        .gate-card dd {
          font-size: 13px;
        }
        .captcha-box {
          min-height: 54px;
        }
        .proof-line {
          margin-top: 16px !important;
          font-size: 17px !important;
        }
        .success-shield {
          width: 28px;
          height: 28px;
        }
        .signal-rail {
          display: none;
        }
        .proof-section {
          margin-top: 14px;
        }
        .setup-section {
          margin-top: 34px;
        }
        .setup-copy h2 {
          font-size: 30px;
        }
        .setup-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .setup-step {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .setup-step a {
          grid-column: 2;
        }
        .panel-top {
          align-items: flex-start;
          flex-direction: column;
          justify-content: center;
          padding: 12px 16px;
        }
        .workflow-panel pre {
          padding: 16px;
        }
        .setup-signals {
          grid-template-columns: 1fr;
        }
        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .actions .button {
          width: 100%;
          min-width: 0;
          padding: 0 12px;
          white-space: normal;
          text-align: center;
        }
        .demo-actions {
          grid-template-columns: 1fr;
        }
        .manifest-actions {
          grid-template-columns: 1fr;
        }
        .manifest-actions .button {
          width: 100%;
        }
        .manifest-url-list code {
          font-size: 11px;
        }
        .proof-page {
          width: calc(100% - 32px);
          overflow: hidden;
        }
        .proof-heading {
          gap: 16px;
          margin-bottom: 20px;
        }
        .proof-heading h1 {
          font-size: clamp(38px, 11vw, 46px);
          line-height: 1.02;
        }
        .proof-heading p {
          max-width: 100%;
          font-size: 16px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .proof-heading .preview-guarantees {
          gap: 8px;
        }
        .proof-heading .preview-guarantees span {
          min-height: 42px;
          padding: 0 12px;
        }
        .proof-controls .panel-top,
        .proof-live .panel-top,
        .proof-snippets .panel-top {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
        .demo-copy-check {
          grid-template-columns: 1fr;
        }
        .demo-copy-check code,
        .demo-copy-check .button {
          width: 100%;
        }
        .demo-check {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .demo-check > span:last-child {
          grid-column: 2;
          justify-self: start;
        }
        .demo-next-actions .button {
          width: 100%;
        }
        .header-cta,
        .gate-card button,
        .button.full {
          width: 100%;
        }
        .audit-stream,
        .bot-comment,
        .gate-card {
          display: none;
        }
        .proof-card img {
          height: 220px;
          aspect-ratio: auto;
          object-fit: cover;
          object-position: top left;
          background: var(--faint);
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
        .section-heading {
          margin-bottom: 22px;
          text-align: left;
        }
        .section-heading h2 {
          font-size: 30px;
        }
        .section-heading p {
          font-size: 16px;
        }
        .section-heading span {
          white-space: normal;
        }
        .preview-page {
          padding-top: 24px;
        }
        .preview-heading {
          gap: 18px;
          margin-bottom: 20px;
        }
        .preview-heading h1 {
          font-size: clamp(38px, 11vw, 52px);
        }
        .preview-heading p {
          font-size: 16px;
          line-height: 1.48;
        }
        .preview-guarantees {
          gap: 8px;
        }
        .preview-editor textarea {
          min-height: 480px;
          padding: 14px;
          font-size: 12px;
        }
        .preview-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .preview-actions .button {
          width: 100%;
        }
        .preview-card dl div {
          grid-template-columns: 1fr;
        }
        .preview-card dt {
          min-height: 34px;
        }
        .preview-card dd {
          min-height: 38px;
        }
        .status-tile {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .status-tile > strong {
          grid-column: 2;
          justify-self: start;
        }
        .wizard-group {
          grid-template-columns: 1fr;
          padding: 14px;
        }
        .wizard-group.diagnostics-fields:first-of-type {
          grid-template-columns: 1fr;
        }
        .wizard-choice {
          min-height: auto;
        }
        .wizard-output .workflow-panel pre {
          max-height: 520px;
        }
        .wizard-install-grid,
        .install-card-head {
          grid-template-columns: 1fr;
        }
        .install-card-head .button {
          width: 100%;
        }
        .install-code {
          max-height: 240px;
        }
        .wizard-evidence-head,
        .wizard-evidence dl,
        .wizard-handoff {
          grid-template-columns: 1fr;
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
        .gate {
          padding: 24px 18px;
        }
        .status-strip,
        .meta-row,
        .gate-receipt-list div {
          grid-template-columns: 1fr;
        }
        .status-strip > span + span,
        .meta-row > div:first-child,
        .gate-receipt-list dt {
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
        .gate-panel {
          padding: 18px;
        }
        .gate-receipt-list dt,
        .gate-receipt-list dd {
          min-height: 40px;
        }
      }
    </style>
  </head>
  <body><a class="skip-link" href="#main">Skip to content</a>${body}</body>
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

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
