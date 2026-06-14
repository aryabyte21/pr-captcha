# ci-captcha

CAPTCHA before CI for GitHub Actions.

Stop drive-by bots and agent-generated pull requests from burning maintainer time and CI minutes.

A contributor opens a PR. GitHub Actions stays paused. They solve a browser CAPTCHA. CI starts.

## Integration Modes

ci-captcha supports multiple maintainer setups:

1. **Native fork gate**
   - Best for public open-source repositories.
   - Maintainers enable GitHub's required approval for fork PR workflows.
   - ci-captcha approves held workflow runs only after GitHub login, CAPTCHA, and head SHA verification.
   - This is the only mode that starts at zero runner minutes.

2. **Universal gate Action**
   - Best for same-repo PRs, private repos, or repositories that cannot rely on fork approvals.
   - Add a tiny `human-gate` job before expensive jobs.
   - The job exits quickly until ci-captcha has a verification for the exact PR head SHA.

3. **Required check only**
   - Best when the goal is merge protection rather than CI-minute protection.
   - ci-captcha creates a `ci-captcha/human` check on the PR head SHA.
   - Maintainers can require this check in branch protection.

4. **Hybrid**
   - Recommended default.
   - Use native fork approval for forks, the Action gate for same-repo expensive workflows, and the required check for merge protection.

## Architecture

The production path is a GitHub App plus a small Cloudflare Worker backend:

```txt
pull_request webhook
        |
        v
Cloudflare Worker creates a SHA-bound gate
        |
        v
PR comment + check run point to signed gate URL
        |
        v
Contributor logs in with GitHub and solves Turnstile
        |
        v
Worker verifies OAuth user, Turnstile token, PR author, and head SHA
        |
        v
Worker approves held GitHub Actions workflow runs for that SHA
```

The privileged backend never checks out or executes pull request code.

## Packages

- `apps/worker`: Cloudflare Worker GitHub App backend, OAuth flow, Turnstile page, D1 persistence.
- `packages/action`: Optional gate Action for repos that want same-repo or private-repo gating.
- `docs/architecture.md`: Full architecture and threat model notes.
- `docs/github-app.md`: Required GitHub App permissions and setup.
- `docs/config.md`: Repository config file format.
- `docs/production-goal.md`: Production goal, phases, and launch criteria.

## Development

```sh
npm install
npm run check
npm run build
```

Run the Worker locally:

```sh
cd apps/worker
cp .dev.vars.example .dev.vars
npm run dev
```

Apply the D1 schema:

```sh
cd apps/worker
npm run db:migrate:local
```

## Universal Gate Action

```yaml
name: CI

on:
  pull_request:

jobs:
  human-gate:
    name: ci-captcha / human gate
    runs-on: ubuntu-latest
    steps:
      - uses: yourname/ci-captcha/packages/action@v1
        with:
          api-url: https://ci-captcha.example.com

  test:
    needs: human-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

## Security Model

Verification is bound to:

- repository owner and name
- pull request number
- PR author
- exact head SHA
- GitHub OAuth session
- server-side Turnstile validation

Pushing a new commit requires a new verification.
