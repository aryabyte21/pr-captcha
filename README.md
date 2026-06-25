<p align="center">
  <img src="docs/assets/pr-captcha-github-app-icon.png" alt="pr-captcha panda bouncer" width="104" height="104">
</p>

<h1 align="center">pr-captcha</h1>

<p align="center">
  A bouncer for your pull request queue.
</p>

<p align="center">
  <a href="https://github.com/apps/pr-captcha/installations/new"><img alt="Install the GitHub App" src="https://img.shields.io/badge/Install_the_GitHub_App-0b8f4d?style=for-the-badge&logo=github&logoColor=white"></a>
  &nbsp;
  <a href="https://pr-captcha.aryaabyte.workers.dev/"><img alt="Open the live site" src="https://img.shields.io/badge/Open_the_live_site-13161c?style=for-the-badge&logo=cloudflare&logoColor=white"></a>
  &nbsp;
  <a href="https://github.com/aryabyte21/pr-captcha"><img alt="Star on GitHub" src="https://img.shields.io/github/stars/aryabyte21/pr-captcha?style=for-the-badge&logo=github&label=Star&color=24292f"></a>
</p>

<p align="center">
  <video src="https://github.com/aryabyte21/pr-captcha/raw/main/docs/assets/pr-captcha-demo.mp4" width="760" autoplay loop muted playsinline>
    <a href="https://pr-captcha.aryaabyte.workers.dev/">Watch the 30-second demo</a>
  </video>
</p>

A free hosted GitHub App that checks ID at the door of your pull request queue.

> It's not a Turing test. It's a guest list. Opus can pass the CAPTCHA; it still can't be the GitHub account you ban at 2am. That is the whole point.

## What it does

- Posts a `pr-captcha/human` check on every PR, bound to the exact head SHA.
- Makes the contributor prove they are a logged-in GitHub human with a browser CAPTCHA.
- Optionally releases held fork CI once a human is verified.

## What it never does

- Never checks out, builds, or runs your PR's code.
- Never guesses whether a patch was written by AI.
- Never trusts an old verification: a new commit means a new check.

## Quick config

```yaml
# .github/pr-captcha.yml
mode: hybrid
apply_to:
  fork_prs: true
  outside_contributors: true
checks:
  create_required_check: true
```

Add the file, [install the app](https://github.com/apps/pr-captcha/installations/new), then require `pr-captcha/human` in branch protection. That is the whole setup.

## Why

When a PR costs nothing to send, maintainers inherit the spam. Reviews, labels, and branch protection all act after the queue already sees the work. pr-captcha adds the missing step at intake: a cheap human check before a PR earns attention.

## How it works

| Step | Event                             | pr-captcha                                                    |
| ---- | --------------------------------- | ------------------------------------------------------------- |
| 1    | PR opens under an enabled target  | Creates a gate for repo, PR number, author, and head SHA      |
| 2    | The pull request webhook arrives  | Posts a verification comment and creates `pr-captcha/human`   |
| 3    | Contributor opens the gate link   | Requires GitHub OAuth login                                   |
| 4    | Contributor solves the CAPTCHA    | Validates the Turnstile token server-side                     |
| 5    | Verification passes               | Marks the exact SHA human-verified and optionally releases CI |
| 6    | Contributor pushes another commit | The old verification no longer applies                        |

The app treats PR content as metadata. It publishes a human-origin signal and can approve held fork workflow runs, but never checks out or executes the patch. See [docs/architecture.md](docs/architecture.md) for the full flow.

## Integration modes

| Capability                         | PR intake check      | Native fork release        | Workflow gate           |
| ---------------------------------- | -------------------- | -------------------------- | ----------------------- |
| Creates PR-visible human signal    | Yes                  | Yes                        | Yes                     |
| Stops CI before runner starts      | No                   | Yes                        | Partially               |
| Works for fork PRs                 | Yes                  | Yes                        | Yes                     |
| Works for same-repo PRs            | Yes                  | No                         | Yes                     |
| Runner minutes before verification | Zero by itself       | Zero                       | Tiny gate job           |
| Best use case                      | Public triage queues | GitHub-held fork workflows | Broad workflow adoption |

The workflow gate is one step in your CI; heavy jobs depend on it:

```yaml
jobs:
  human-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: aryabyte21/pr-captcha/packages/action@v1
        with:
          api-url: https://pr-captcha.example.com
  test:
    needs: human-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
```

## Repository config

```yaml
# .github/pr-captcha.yml
mode: hybrid

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
  labels: [trusted-contributor, no-captcha]

checks:
  create_required_check: true
  name: pr-captcha/human

universal_gate:
  rerun_after_verification: true
```

`github_login` and `new_sha_requires_new_captcha` are enforced invariants: false values are ignored, so every passed gate stays bound to a GitHub user and the exact head SHA. `skip.authors` and `skip.labels` are case-insensitive. Set `solver_must_be_pr_author: false` to let maintainers with write, maintain, or admin access verify on behalf of contributors (and bots, which cannot complete OAuth).

## GitHub App permissions

| Permission    | Access | Why                                                       |
| ------------- | ------ | --------------------------------------------------------- |
| Metadata      | Read   | Required by GitHub Apps                                   |
| Pull requests | Write  | Read PR metadata, update PR review surfaces               |
| Issues        | Write  | Create or update the PR comment with the gate link        |
| Checks        | Write  | Create `pr-captcha/human` check runs                      |
| Actions       | Write  | Approve held fork runs and rerun universal-gate workflows |
| Contents      | Read   | Optional `.github/pr-captcha.yml` loading                 |

## Explore before installing

Every tool runs on the hosted Worker, no install required:

| Path            | What                                 |
| --------------- | ------------------------------------ |
| `/demo`         | Interactive dry run of the full gate |
| `/evidence`     | Scan a repo for queue risk           |
| `/setup-wizard` | Generate a policy file               |
| `/trust`        | Security, privacy, and policy docs   |
| `/status`       | Live service health                  |

## Local development

```sh
npm install
npm run check   # typecheck
npm run test    # all tests
npm run build   # build workspaces

cd apps/worker
npm run dev -- --port 8787   # serve at http://localhost:8787
npm run db:migrate:local     # apply local D1 migration
```

Run the critical-path contract test before changing webhook, CAPTCHA, check-run, OAuth, or Action behavior:

```sh
npm test --workspace @pr-captcha/worker -- gate-flow.test.ts
```

## Project layout

```txt
apps/worker      Cloudflare Worker, GitHub App backend, OAuth, Turnstile, pages
packages/action  Optional GitHub Action for the workflow gate
examples         Example config and workflow snippets
docs             Setup, architecture, config, operations, production goal
```

## Security model

Verification binds repository owner and name, PR number, PR author, exact head SHA, the GitHub OAuth session, and server-side Turnstile validation. The Worker never runs `npm install`, `pytest`, `go test`, or `make`.

Start with [docs/setup.md](docs/setup.md) to install, or [docs/production-goal.md](docs/production-goal.md) for the production path.
