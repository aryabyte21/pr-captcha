# Production Goal

## Objective

Turn pr-captcha from an MVP into the default human-origin intake check for open-source repositories that want unknown, first-time, outside, fork, and bot pull requests to prove there is a real GitHub user present before maintainers spend attention.

The production product should let a maintainer install a GitHub App, enable a clear policy, and trust that every gated PR gets a GitHub-authenticated, CAPTCHA-verified signal bound to the exact pull request head SHA.

## Product Promise

Make AI slop prove it has a human.

pr-captcha should make automated PR spam and AI slop more expensive without adding maintainer toil.

## Production Definition

pr-captcha is production-ready when:

- A maintainer can install the GitHub App in under five minutes.
- A pull request can receive a SHA-bound human-origin check without maintainer action.
- A fork pull request can still be held by GitHub and released by pr-captcha when the repository uses native fork workflow approval.
- Verification is bound to repository, PR number, PR author, and exact head SHA.
- A new commit always requires a new verification.
- The app never checks out, builds, tests, or executes untrusted pull request code.
- Failures are visible, retryable, and do not leave maintainers guessing.
- The system has rate limits, replay protection, audit logs, and production monitoring.
- The universal Action gate works when same-repo and private repository workflows should wait on the human-origin signal.
- Required checks can be safely used with branch protection.
- The setup docs are clear enough for a maintainer to self-serve.

## Current MVP

The MVP includes:

- GitHub App webhook receiver.
- GitHub OAuth login.
- Cloudflare Turnstile server-side validation.
- D1 verification store.
- SHA-bound signed verification links.
- Hashed gate token storage with tokenless gate URLs in D1.
- Single-use gate nonce tracking.
- CSRF protection for gate form submission.
- PR comments with a gate URL.
- `pr-captcha/human` check runs.
- Webhook delivery deduplication.
- Gate and webhook rate limits.
- Audit log table and gate lifecycle events.
- Admin audit log export.
- Admin repository diagnostics endpoint.
- Repository diagnostics console.
- Public interactive demo page.
- Public queue pressure calculator.
- Public open-source PR spam radar.
- Public Trust Center with security, privacy, terms, abuse, incident, beta, and support docs.
- Public README badge builder and badge SVG endpoint.
- Public PR proof-card generator and proof SVG endpoint.
- Public GitHub App manifest builder.
- Public status page for Worker and readiness checks.
- Public config preview page for `.github/pr-captcha.yml`.
- Beta installation allowlist.
- Mocked signed-webhook to solved-gate critical-path test.
- GitHub-shaped fork pull request webhook replay fixture for critical-path tests.
- GitHub Actions CI, GitHub Pages deploy, and Cloudflare Worker deploy workflows.
- Cloudflare deploy preflight for GitHub Actions secrets and real D1 binding configuration.
- Static GitHub Pages robots, sitemap, and security metadata for the public front door.
- Structured redacted error logs with request IDs.
- Scheduled cleanup for expired gates, verifications, webhook delivery markers, and rate limit buckets.
- Admin retry endpoint for verified gates.
- PR intake check and native fork workflow approval.
- Optional universal Action gate.
- Basic docs and examples.

## Phase 1: Closed Beta

Goal: make the product reliable for 5 to 10 friendly repositories.

Required work:

- Create the real GitHub App and OAuth app.
- Deploy the Worker to Cloudflare with production secrets.
- Create the D1 production database and configure deployment secrets.
- Add webhook replay tests from live beta GitHub payload fixtures.
- Expand end-to-end tests for native fork workflow release and universal Action mode.
- Tune rate-limit thresholds from beta traffic.
- Add backup and restore checks for the production D1 database.

Exit criteria:

- 100 successful PR intake verifications in beta repositories.
- Zero known cases where verification applies to the wrong SHA.
- Zero privileged execution of untrusted PR code.
- Clear operator path for webhook, OAuth, Turnstile, and GitHub API failures.

## Phase 2: Security Hardening

Goal: make abuse expensive and make trust boundaries explicit.

Required work:

- Add GitHub App permission audit docs.
- Add solver policy options for author-only, collaborator, maintainer, or any logged-in GitHub user.
- Add repository config validation with actionable errors.
- Expand audit coverage to config changes, maintainer overrides, and export paths.
- Add security review for OAuth session cookies, SameSite behavior, and token expiry.
- Add a threat model document with abuse paths and mitigations.

Exit criteria:

- Replay attempts fail safely.
- Stale SHA attempts fail safely.
- Wrong solver attempts fail safely.
- Failed CAPTCHA attempts are rate limited.
- Security model is documented and test-covered.

## Phase 3: Maintainer Experience

Goal: make installation and debugging self-serve.

Required work:

- Ship the setup wizard for repository owners.
- Expand the setup wizard with repository-aware checks.
- Expand repository diagnostics into a maintainer-facing self-serve check.
- Add clearer PR comment updates with one persistent comment per PR.
- Add maintainer override labels and audit logs.
- Add GitHub Checks output with exact failure reason and retry guidance.
- Add docs for PR intake check, native fork release, workflow gate, and hybrid mode.
- Add copy-ready workflow examples for Node, Python, Rust, Go, and monorepos.

Exit criteria:

- A maintainer can install, configure, and validate pr-captcha without support.
- The PR UI always shows the next required action.
- A failed gate can be diagnosed from GitHub UI plus pr-captcha logs.

## Phase 4: Public Launch

Goal: launch as a credible maintainer tool.

Required work:

- Public landing page and docs site.
- Demo repository with fork PR video or GIF.
- GitHub Marketplace listing.
- Terms, privacy policy, and security contact.
- Incident process.
- Billing plan or free beta policy.
- Abuse reporting path.
- Support mailbox and triage process.

Exit criteria:

- Demo flow works from a clean unknown-author PR.
- Marketplace install path is live.
- Docs cover every permission and integration mode.
- Support and incident paths are ready before public traffic.

## Phase 5: Scale

Goal: support larger repositories and organizations.

Required work:

- Team and organization policy controls.
- Per-repository rules and inherited defaults.
- Analytics for intake checks, released runs, and saved CI starts.
- Webhook notification integrations.
- Multi-region deploy strategy if latency or availability requires it.
- Billing, quotas, and account management.
- SLA targets and enterprise export logs.

Exit criteria:

- Product can serve high-volume repositories without manual operator work.
- Abuse controls can handle coordinated spam.
- Maintainers can prove what happened for each PR and SHA.

## First 14 Days

1. Create production GitHub App and Cloudflare project.
2. Deploy the Worker behind a real domain.
3. Run the native fork gate against a demo repository.
4. Capture live beta webhook fixtures and add replay tests.
5. Tune rate limits against beta traffic and replay fixture coverage.
6. Add backup and restore checks for D1.
7. Add setup screenshots and a demo recording.
8. Recruit 3 friendly repositories for beta testing.

## Non-Goals

- AI detection.
- Code review.
- Running CI.
- Replacing GitHub branch protection.
- Checking out or executing pull request code.
- Enterprise SSO before public launch.
