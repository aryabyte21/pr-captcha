# Setup Guide

This guide is for a maintainer installing pr-captcha on a repository for the first time.

Before installing, use the public demo to walk through the PR lifecycle without creating a GitHub App installation:

```txt
https://<worker-domain>/demo
```

Use the repo evidence scanner to pull live GitHub signals before installing:

```txt
https://<worker-domain>/evidence
```

Review public security, privacy, terms, support, abuse, incident, and beta-policy docs before inviting outside contributors:

```txt
https://<worker-domain>/trust
```

## 1. Create the GitHub App

Create a GitHub App following [github-app.md](github-app.md) for permissions, webhook URL, callback URL, and Worker secrets.

Subscribe to the `pull_request` webhook event.

## 2. Create Cloudflare Resources

Create a Cloudflare Worker, a D1 database, and a Turnstile site.

Required Worker bindings and secrets:

```txt
DB
APP_BASE_URL
GITHUB_APP_ID
GITHUB_PRIVATE_KEY
GITHUB_WEBHOOK_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
TURNSTILE_SECRET_KEY
TURNSTILE_SITE_KEY
SESSION_SECRET
```

Set `ADMIN_TOKEN` if operators need the retry endpoint for verified gates.

Set `ALLOWED_INSTALLATION_IDS` during a closed beta if the public GitHub App should only process friendly installations. Use a comma or whitespace separated list of GitHub App installation IDs. Leave it unset to accept every installation.

## 3. Apply Migrations

```sh
cd apps/worker
wrangler d1 migrations apply pr-captcha --remote
```

## 4. Deploy the Worker

Production deploys run through the `Worker Deploy` GitHub Actions workflow after these repository secrets are configured:

```txt
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

The workflow runs `npm run check:deploy-env` before installing dependencies. It fails early if the GitHub Actions secrets are missing or `apps/worker/wrangler.toml` still has the placeholder D1 `database_id`.

Run the same preflight locally before enabling production deploys:

```sh
CLOUDFLARE_ACCOUNT_ID=<account-id> CLOUDFLARE_API_TOKEN=<api-token> npm run check:deploy-env
```

The workflow validates the repo, applies remote D1 migrations, and deploys the Worker on pushes to `main`.

For a local manual deploy:

```sh
cd apps/worker
npm run deploy
```

Then verify:

```txt
https://<worker-domain>/health
https://<worker-domain>/health/ready
```

`/health` only confirms the Worker is responding. `/health/ready` also checks required Worker secrets, `APP_BASE_URL` URL syntax, and the D1 binding without exposing secret values.

For a browser view of the same checks, open:

```txt
https://<worker-domain>/status
```

## 4.1. Deploy the Static Launcher

Enable GitHub Pages with source set to GitHub Actions. The `Pages` workflow publishes the `docs` directory as a static front door for setup and trust docs, and links into the Worker.

```sh
gh api repos/<owner>/<repo>/pages >/dev/null 2>&1 || gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow
gh api -X PUT repos/<owner>/<repo>/pages -f build_type=workflow
gh api repos/<owner>/<repo>/pages --jq '.html_url'
```

## 5. Add Repository Config

Add `.github/pr-captcha.yml` to the protected base branch.
Generate a starter policy with the setup wizard:

```txt
https://<worker-domain>/setup-wizard
```

```yaml
mode: hybrid

captcha:
  provider: cloudflare_turnstile

require:
  github_login: true
  solver_must_be_pr_author: true
  new_sha_requires_new_captcha: true

apply_to:
  all_pull_requests: true
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
  rerun_after_verification: true
```

Default `hybrid` mode is not first-time forks only. With `all_pull_requests: true`, it gates owner branches, member branches, forks, outside contributors, first-time contributors, and bot accounts. Use `native_fork` when the repository only wants pr-captcha to release GitHub-held fork workflows.

`outside_contributors` covers any GitHub PR author association that is not `OWNER`, `MEMBER`, or `COLLABORATOR`.

`skip.authors` and `skip.labels` are matched case-insensitively.

`github_login` and `new_sha_requires_new_captcha` are enforced even if set to `false`. Set `solver_must_be_pr_author: false` only if repository maintainers with write, maintain, or admin access may verify on behalf of contributors. Bot-authored pull requests can also be verified by maintainers because bot accounts cannot complete GitHub OAuth.

`required_check` always creates its check run. In `native_fork` and `hybrid`, pr-captcha keeps the PR comment enabled if checks are disabled so the verification link is still visible.

## 6. Enable Branch Protection

If using required-check mode, require:

```txt
pr-captcha/human
```

## 7. Enable Native Fork Holding

If using native fork release, enable GitHub's fork workflow approval setting:

```txt
Settings -> Actions -> General -> Fork pull request workflows
```

Choose the repository policy that requires approval for outside contributors.

## 8. Optional Workflow Gate

Use this mode when heavy jobs should wait on the human-origin signal.
The Action validates the status response schema and fails closed if the Worker returns a malformed status response.

```yaml
name: CI

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
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

## 9. Test the Install

Confirm service health in a browser at `https://<worker-domain>/status`, then open a test PR under an enabled target and verify:

- The PR receives a `pr-captcha/human` check.
- The PR receives one pr-captcha comment with a verification link.
- The link requires GitHub OAuth.
- The page requires Turnstile.
- Verification succeeds only for the configured solver.
- A new commit requires a new verification.
- If native fork holding is enabled, held workflow runs are released only after verification.

## 10. Operate the Beta

Watch audit logs for:

- `gate.created`
- `gate.solved`
- `gate.published`
- `gate.publish_failed`
- `rate_limited`
- `cleanup.completed`

If publishing fails after a gate is verified, retry with the admin endpoint documented in [operations.md](operations.md).

For a PR-specific audit export:

```sh
curl \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://<worker-domain>/api/admin/audit-logs?owner=<owner>&repo=<repo>&pr=<number>&limit=100"
```
