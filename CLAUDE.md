# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`pr-captcha` is a free hosted GitHub App that gates public-repo pull requests behind a GitHub-authenticated, CAPTCHA-verified human signal bound to the exact PR head SHA. The Worker treats PR content as untrusted metadata: it never checks out, builds, or runs the patch. It posts a `pr-captcha/human` check, can release GitHub-held fork workflows after verification, and ships an optional Action for a workflow-level gate.

## Commands

Run from the repo root unless noted. Node >= 20 (CI uses 22).

- `npm run check` - typecheck all workspaces (`tsc --noEmit`)
- `npm test` - root `node --test test/*.test.mjs` plus each workspace's tests (worker uses vitest)
- `npm run build` - build all workspaces; for the action this regenerates `packages/action/dist` (committed; CI fails if it drifts)
- `npm run format` - `prettier --check .`
- `npm run check:deploy-env` - deploy preflight; needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` set, validates the D1 id in `wrangler.toml`

Worker (`apps/worker`):

- `npm test --workspace @pr-captcha/worker -- gate-flow.test.ts` - the critical-path contract test; run before changing webhook, CAPTCHA, check-run, OAuth, or Action behavior
- `npm test --workspace @pr-captcha/worker -- <file>.test.ts` - single test file
- `cd apps/worker && npm run dev -- --port 8787` - local server at http://localhost:8787
- `cd apps/worker && npm run db:migrate:local` - apply D1 migrations to the local miniflare DB

## CI gates (`.github/workflows/ci.yml`)

CI runs check, test, build, then enforces: `git diff --exit-code packages/action/dist` (rebuild the action and commit dist), `prettier --check`, `git diff --check` (whitespace), and a text policy that rejects em dashes (`—`) anywhere in tracked source/docs. Match these locally before pushing.

## Architecture

Single privileged control plane (the Worker) + integration surfaces. Full flow diagrams live in `README.md` and `docs/architecture.md`.

**Worker (`apps/worker/src`)** is a Hono app on Cloudflare Workers. `index.ts` (~2800 lines) is the router and orchestration: webhook intake, OAuth, gate page, Turnstile validation, admin endpoints, public marketing/tooling pages, and a `*/30 * * * *` cron that cleans up expired rows. Static assets in `docs/` are served via the `ASSETS` binding (`run_worker_first = true`, so the Worker routes first).

Module map:

- `crypto.ts` - webhook signature verification, HMAC payload signing/verifying, sha256
- `github.ts` - GitHub App API: installation tokens, check runs, PR comments, workflow-run approval/rerun, repo metadata/permissions/config file
- `oauth.ts` - GitHub OAuth for the solver; session is a signed cookie (`SESSION_SECRET`)
- `turnstile.ts` - server-side Turnstile siteverify
- `config.ts` - parse `.github/pr-captcha.yml` and decide `shouldGatePullRequest`
- `db.ts` - all D1 access (gates, verifications, webhook dedup, rate limits, audit logs, nonce)
- `evidence.ts` - public repo-scan / spam-radar data fetching for the marketing pages
- `render.ts` - server-rendered HTML for every public page (large; mostly template strings)
- `env.ts` / `types.ts` - `Env` bindings/secrets and shared types
- `http.ts` - `fetchWithTimeout`

**Action (`packages/action`)** - optional universal-gate Action. Polls the Worker status API, validates the response schema, and fails closed on a malformed/unverified response. Built with tsup to a committed `dist/`.

## Core invariants (do not weaken)

- Verification is bound to `unique(owner, repo, pr_number, head_sha)`. Any new commit invalidates prior verification.
- `github_login: true` and `new_sha_requires_new_captcha: true` are enforced regardless of config; false values are ignored.
- Untrusted until validated: PR title/body/branch/patch, query strings, the CAPTCHA token (before siteverify), and the browser-claimed GitHub login (before OAuth).
- The gate page re-reads the live PR head SHA immediately before approving any workflow run.
- On GitHub approval failure: keep the verification recorded, surface a retryable error, leave the check non-success. Fail closed elsewhere.

## Secrets / bindings

`Env` (`env.ts`) lists Worker secrets: `APP_BASE_URL`, `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `SESSION_SECRET`, optional `ADMIN_TOKEN` and `ALLOWED_INSTALLATION_IDS` (beta allowlist). Bindings: `DB` (D1) and `ASSETS`. Local dev reads `.dev.vars` (see `.dev.vars.example`). Deploy GitHub Actions secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.

## Conventions

- TS is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (`tsconfig.base.json`). ESM everywhere (`"type": "module"`).
- Each new D1 schema change is a numbered file in `apps/worker/migrations/`.
- After editing `packages/action/src`, run `npm run build` and commit the regenerated `dist/`.
