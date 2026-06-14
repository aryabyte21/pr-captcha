# Production Goal

## Objective

Turn ci-captcha from an MVP into the default human gate for open-source repositories that want to stop suspicious, first-time, and fork pull requests from burning GitHub Actions minutes before a human shows up.

The production product should let a maintainer install a GitHub App, enable a clear policy, and trust that CI is released only after a GitHub-authenticated, CAPTCHA-verified user approves the exact pull request head SHA.

## Product Promise

No CAPTCHA, no CI.

ci-captcha should make agent-generated PR spam more expensive without adding maintainer toil.

## Production Definition

ci-captcha is production-ready when:

- A maintainer can install the GitHub App in under five minutes.
- A fork pull request can be held by GitHub and released by ci-captcha without maintainer action.
- Verification is bound to repository, PR number, PR author, and exact head SHA.
- A new commit always requires a new verification.
- The app never checks out, builds, tests, or executes untrusted pull request code.
- Failures are visible, retryable, and do not leave maintainers guessing.
- The system has rate limits, replay protection, audit logs, and production monitoring.
- The universal Action gate works for same-repo and private repository workflows.
- Required checks can be safely used with branch protection.
- The setup docs are clear enough for a maintainer to self-serve.

## Current MVP

The MVP includes:

- GitHub App webhook receiver.
- GitHub OAuth login.
- Cloudflare Turnstile server-side validation.
- D1 verification store.
- SHA-bound signed verification links.
- PR comments with a gate URL.
- `ci-captcha/human` check runs.
- Native fork workflow approval.
- Optional universal Action gate.
- Basic docs and examples.

## Phase 1: Closed Beta

Goal: make the product reliable for 5 to 10 friendly repositories.

Required work:

- Create the real GitHub App and OAuth app.
- Deploy the Worker to Cloudflare with production secrets.
- Create the D1 production database and migrations workflow.
- Add webhook replay tests from real GitHub payload fixtures.
- Add end-to-end tests for fork PR gate, required check, and universal Action mode.
- Add rate limiting by IP, repository, PR number, GitHub login, and installation.
- Add an allowlist for beta installations.
- Add structured logs with request IDs and redaction.
- Add an admin retry endpoint for failed workflow approvals.
- Add cleanup for expired gates and verification rows.

Exit criteria:

- 100 successful fork PR gate releases in beta repositories.
- Zero known cases where verification applies to the wrong SHA.
- Zero privileged execution of untrusted PR code.
- Clear operator path for webhook, OAuth, Turnstile, and GitHub API failures.

## Phase 2: Security Hardening

Goal: make abuse expensive and make trust boundaries explicit.

Required work:

- Add single-use nonce tracking for gate links.
- Store hashed gate tokens only.
- Add CSRF protection to form submission.
- Add webhook delivery deduplication.
- Add GitHub App permission audit docs.
- Add solver policy options for author-only, collaborator, maintainer, or any logged-in GitHub user.
- Add repository config validation with actionable errors.
- Add audit log rows for gate created, viewed, solved, denied, approved, and rerun.
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

- Add a setup wizard for repository owners.
- Add a config preview page for `.github/ci-captcha.yml`.
- Add a diagnostic endpoint for installed repositories.
- Add clearer PR comment updates with one persistent comment per PR.
- Add maintainer override labels and audit logs.
- Add GitHub Checks output with exact failure reason and retry guidance.
- Add docs for native fork gate, universal Action gate, required check, and hybrid mode.
- Add copy-ready workflow examples for Node, Python, Rust, Go, and monorepos.

Exit criteria:

- A maintainer can install, configure, and validate ci-captcha without support.
- The PR UI always shows the next required action.
- A failed gate can be diagnosed from GitHub UI plus ci-captcha logs.

## Phase 4: Public Launch

Goal: launch as a credible maintainer tool.

Required work:

- Public landing page and docs site.
- Demo repository with fork PR video or GIF.
- GitHub Marketplace listing.
- Terms, privacy policy, and security contact.
- Status page and incident process.
- Billing plan or free beta policy.
- Abuse reporting path.
- Support mailbox and triage process.

Exit criteria:

- Demo flow works from a clean fork PR.
- Marketplace install path is live.
- Docs cover every permission and integration mode.
- Support and incident paths are ready before public traffic.

## Phase 5: Scale

Goal: support larger repositories and organizations.

Required work:

- Team and organization policy controls.
- Per-repository rules and inherited defaults.
- Analytics for blocked runs, released runs, and saved CI starts.
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
4. Capture real webhook fixtures and add replay tests.
5. Add rate limits and webhook delivery deduplication.
6. Add audit log table and event writes.
7. Add a setup guide with screenshots.
8. Recruit 3 friendly repositories for beta testing.

## Non-Goals

- AI detection.
- Code review.
- Running CI.
- Replacing GitHub branch protection.
- Checking out or executing pull request code.
- Enterprise SSO before public launch.
