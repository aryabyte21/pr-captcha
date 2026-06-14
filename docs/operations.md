# Operations

## Deploy Worker

```sh
cd apps/worker
npm run deploy
```

## Local Webhook Testing

Use a webhook relay or GitHub App test delivery pointed at:

```txt
http://localhost:8787/webhooks/github
```

The Worker rejects unsigned webhook payloads. Use a real GitHub App test delivery for end-to-end testing.

## Required Repository Setting

For native fork gate mode, maintainers must enable GitHub's fork workflow approval behavior. pr-captcha does not replace that setting. It automates the approval after verification.

## Branch Protection

Require this check when using required-check mode:

```txt
pr-captcha/human
```

## Turnstile Test Keys

Cloudflare provides public test keys for local development. Replace them before production deploy.

## Production Hardening

Before public launch:

- Add rate limits by IP, GitHub login, repository, and PR number.
- Add install allowlisting during beta.
- Add structured logging with redaction.
- Add replay tests for webhook payloads.
- Add an admin retry path for approval failures.
- Add cleanup for expired gates and verifications.
- Add a public status page for maintainers.
