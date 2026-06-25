# Repository Config

Add this file at `.github/pr-captcha.yml`:

Generate a starter policy with the setup wizard:

```txt
https://<worker-domain>/setup-wizard
```

Preview the effective policy before committing it:

```txt
https://<worker-domain>/config-preview
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

## Modes

Default `hybrid` mode is not first-time forks only. It gates every enabled pull request target in `apply_to`. With `all_pull_requests: true`, owner branches, member branches, forks, outside contributors, first-time contributors, and bots are gated.

`outside_contributors` means any GitHub `author_association` that is not `OWNER`, `MEMBER`, or `COLLABORATOR`. It includes repeat external contributors, first-time contributors, and users with no prior relationship.

`skip.authors` and `skip.labels` are matched case-insensitively.

`native_fork` gates only pull requests from forks and approves GitHub-held workflow runs after verification.

`universal` supports the optional Action gate and can rerun failed workflows after verification.

`required_check` creates the check run only.

`hybrid` enables native fork, universal, and required check behavior where applicable.

`required_check` always creates a check run, even if `checks.create_required_check` is set to `false`.

For `native_fork` and `hybrid`, if checks are disabled and comments are disabled, pr-captcha keeps the comment enabled so the contributor still has a verification link. `universal` can run without a check or comment because the Action receives the verification URL from the status endpoint.

## Security Invariants

`github_login` and `new_sha_requires_new_captcha` are always enforced, even if repository config sets them to `false`. pr-captcha is intentionally GitHub-authenticated and exact-SHA-bound.

`solver_must_be_pr_author` is configurable. Set it to `false` only when repository maintainers with write, maintain, or admin access may verify on behalf of contributors. Bot-authored pull requests can also be verified by maintainers because bot accounts cannot complete GitHub OAuth.
