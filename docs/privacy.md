# Privacy Policy

Last updated: June 19, 2026

This beta privacy policy explains what pr-captcha processes while operating a GitHub pull request human-origin gate.

## What pr-captcha processes

pr-captcha may process:

- GitHub App installation identifiers.
- Repository owner and repository name.
- Pull request number, author login, author association, head SHA, labels, and relevant workflow-run identifiers.
- GitHub OAuth login metadata needed to confirm the verifier.
- Cloudflare Turnstile validation result metadata.
- Verification status, timestamps, expiry times, audit log events, and rate-limit counters.
- Operator admin requests when diagnostics or audit export endpoints are used.

## What pr-captcha does not intentionally process

pr-captcha does not intentionally:

- Check out repository source code.
- Execute pull request code.
- Store pull request diffs or patch contents.
- Store repository secrets.
- Store CI logs.
- Sell personal data.

## Why data is processed

Data is processed to:

- Decide whether a pull request is in a configured gated target.
- Bind a verification to repository, pull request number, PR author, and exact head SHA.
- Validate GitHub OAuth and CAPTCHA completion.
- Publish or update the `pr-captcha/human` check.
- Approve eligible held fork workflow runs after verification.
- Rate limit abuse, dedupe webhooks, expire old gates, and support operator diagnostics.

## Retention

Verification, gate, webhook-delivery, rate-limit, and audit rows are stored in Cloudflare D1. Scheduled cleanup removes expired gates, verifications, webhook delivery markers, and rate-limit buckets according to the Worker cleanup logic.

Production retention periods should be reviewed before public launch and documented with exact durations.

## Subprocessors

pr-captcha depends on:

- GitHub for repository metadata, GitHub App APIs, OAuth, checks, comments, and workflow-run approval.
- Cloudflare Workers and D1 for runtime and storage.
- Cloudflare Turnstile for CAPTCHA validation.

## Contact

Use GitHub issues for beta privacy questions:

```txt
https://github.com/aryabyte21/pr-captcha/issues
```

A dedicated privacy contact mailbox is required before public launch.
