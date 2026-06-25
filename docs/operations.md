# Operations

## Deploy Worker

Production deploys are automated by `.github/workflows/worker-deploy.yml` on pushes to `main` that touch Worker, docs, package, or Action files. The workflow validates the repo, applies remote D1 migrations, then deploys the Worker.

Required GitHub Actions secrets:

```txt
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

The Cloudflare API token must be able to deploy Workers and apply D1 migrations for the `pr-captcha` database.

The deploy workflow runs `npm run check:deploy-env` before dependency install. The preflight fails if GitHub Actions is missing Cloudflare secrets or `apps/worker/wrangler.toml` still contains the placeholder D1 `database_id`.

Run the same check locally when preparing production:

```sh
CLOUDFLARE_ACCOUNT_ID=<account-id> CLOUDFLARE_API_TOKEN=<api-token> npm run check:deploy-env
```

Worker runtime secrets are still stored in Cloudflare with `npx wrangler secret put`. After deploy, `/health/ready` verifies those runtime secrets and the D1 binding without exposing values.

Manual deploys use the same Worker package:

```sh
cd apps/worker
npm run deploy
```

After deploy, verify both endpoints:

```txt
https://<worker-domain>/health
https://<worker-domain>/health/ready
```

`/health/ready` returns `503` until required Worker secrets, valid `APP_BASE_URL` URL syntax, and the D1 binding are present. It reports missing or invalid secret names only, not secret values.

Maintainers and operators can also open the public status page:

```txt
https://<worker-domain>/status
```

The page calls `/health` and `/health/ready`, summarizes Worker, D1, and configuration state, and shows the response payload without exposing secret values.

## Deploy GitHub Pages

The redirect fallback and public docs are deployed by `.github/workflows/pages.yml` from the `docs` directory.

Enable GitHub Pages in repository settings with source set to GitHub Actions. After the first successful run, the Pages URL redirects people to the hosted Worker while the public markdown docs remain browsable.

The equivalent API setup is:

```sh
gh api repos/<owner>/<repo>/pages >/dev/null 2>&1 || gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow
gh api -X PUT repos/<owner>/<repo>/pages -f build_type=workflow
gh api repos/<owner>/<repo>/pages --jq '.html_url'
```

GitHub Pages does not process webhooks, OAuth callbacks, CAPTCHA solves, or secrets. It only redirects users to the configured Worker URL.

## Local Webhook Testing

Use a webhook relay or GitHub App test delivery pointed at:

```txt
http://localhost:8787/webhooks/github
```

The Worker rejects unsigned webhook payloads. Use a real GitHub App test delivery for end-to-end testing.

For the local mocked critical path, run:

```sh
npm test --workspace @pr-captcha/worker -- gate-flow.test.ts
```

That test covers a signed `pull_request` webhook creating a pending gate, the Action-facing status API returning the verification URL, the gate page rendering, a GitHub-authenticated Turnstile solve, check-run success publishing, nonce consumption, audit events, and the final verified status response. It does not replace replaying a real GitHub delivery fixture before public traffic.

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

Current request limits:

- Invalid webhook signatures: 20 requests per IP per minute.
- Signed pull request webhooks: 1000 requests per installation per 10 minutes.
- Signed pull request webhooks: 300 requests per repository per 10 minutes.
- Signed pull request webhooks: 60 requests per PR per 10 minutes.
- Gate submissions: 30 requests per IP per minute.
- Gate submissions: 20 requests per GitHub login per 10 minutes.
- Gate submissions: 20 requests per gate link per 10 minutes.
- Admin retry requests: 10 requests per IP per minute.
- Admin audit export requests: 60 requests per IP per minute.
- Admin repository diagnostics requests: 30 requests per IP per minute.
- Public config preview requests: 60 requests per IP per minute.

Set `ALLOWED_INSTALLATION_IDS` during closed beta to process only known GitHub App installation IDs. When this setting is present, disallowed installations are ignored at webhook intake, existing gate links are denied, Action status checks fail closed, and admin retry refuses to publish them.

Gate form submissions use a signed CSRF token tied to the current GitHub session and gate token. Gate links carry a nonce hash that is consumed after a successful CAPTCHA solve, so a used link cannot create another verification.

Gate records store a tokenless gate URL, a gate token hash, and a nonce hash. Signed verification URLs are generated for comments, check details, and Action status responses, but raw gate tokens are not stored in D1.

Public landing-page PR counts use GitHub's public API with a short timeout. If GitHub is slow, rate-limited, or unavailable, the page keeps the captured snapshot counts instead of blocking render.

Rendered pages and JSON responses include default browser hardening headers: CSP, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Permissions-Policy`. The CSP allows the Worker itself, GitHub App manifest form submission, and Cloudflare Turnstile.

Every request receives an `X-Request-Id` response header. Unhandled failures return a generic error with that request id and emit one structured JSON log with redacted secret values.

GitHub publishing paths validate successful API response shapes before recording check run IDs, comment IDs, workflow approvals, live pull request state, or retry success. Malformed success responses are treated as failures so operators can retry after the upstream issue is understood.

Audit logs are stored in D1 for gate lifecycle and abuse-control events:

- Duplicate webhook delivery.
- Invalid signed webhook payload.
- Rate limit exceeded.
- Gate created, updated, viewed, skipped, solved, denied, published, and publish failed.
- Held workflow approvals and universal-gate reruns.
- Scheduled cleanup completed.

Audit rows store repository, PR number, head SHA, gate id, installation id, GitHub login when known, and structured details. They do not store raw IP addresses, raw gate tokens, OAuth tokens, or CAPTCHA tokens.

Webhook delivery IDs are deduped after successful processing. Malformed signed pull request payloads are completed with a `400` and audit log because retrying the same body will not fix it. Retryable processing failures release the delivery so GitHub can resend it. If a Worker crashes after claiming a delivery but before completing it, the same delivery can be reclaimed after 10 minutes so GitHub retries do not get stuck behind a stale `processing` marker.

The Worker runs a cleanup cron every 30 minutes. It removes expired rate limit buckets, expired gates, expired verifications, and webhook delivery markers older than 7 days.

## Admin Retry

Verified gates can be retried by an operator if GitHub publishing failed after the human check passed:

```sh
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://<worker-domain>/api/admin/gates/<gate-id>/retry
```

The endpoint requires `ADMIN_TOKEN`, only accepts gates in `verified` status, reloads the current PR before publishing, and records retry success or failure in the audit log. If a gate already has a GitHub check run, retry updates that existing check to success even when current repository config no longer creates new checks.

## Repository Diagnostics

Operators can verify that an installation can read a repository and determine the effective pr-captcha policy with the admin diagnostics endpoint:

```sh
curl \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://<worker-domain>/api/admin/repositories/<owner>/<repo>/diagnostics?installation_id=<installation-id>"
```

Pass `ref=<branch-or-sha>` to inspect a branch other than the repository default branch. The endpoint fetches repository metadata, reads `.github/pr-captcha.yml`, reports whether defaults are active, returns the normalized config, and records a `diagnostics.checked` audit event. It never returns raw GitHub, OAuth, Turnstile, session, or admin tokens.

## Audit Export

Operators can export recent audit logs as JSON:

```sh
curl \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://<worker-domain>/api/admin/audit-logs?owner=octo-org&repo=awesome-repo&pr=184&limit=100"
```

Supported filters are `owner`, `repo`, `pr`, `gate_id`, `event`, and `limit`. The limit defaults to 100 and is capped at 500 rows. The endpoint returns parsed `details` objects and is rate limited to 60 requests per IP per minute.

Before public launch:

- Add webhook replay fixture coverage from real GitHub deliveries.
- Tune rate-limit thresholds from beta traffic.
