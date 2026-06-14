# Repository Config

Add this file at `.github/ci-captcha.yml`:

```yaml
mode: hybrid

captcha:
  provider: cloudflare_turnstile

require:
  github_login: true
  solver_must_be_pr_author: true
  new_sha_requires_new_captcha: true

apply_to:
  first_time_contributors: true
  outside_contributors: true
  fork_prs: true
  bots: true

skip:
  authors:
    - dependabot[bot]
    - renovate[bot]
  labels:
    - trusted-contributor
    - no-captcha

checks:
  create_required_check: true
  name: ci-captcha/human

comment:
  enabled: true
  tone: direct

universal_gate:
  rerun_after_verification: true
```

## Modes

`native_fork` gates only pull requests from forks and approves GitHub-held workflow runs after verification.

`universal` supports the optional Action gate and can rerun failed workflows after verification.

`required_check` creates the check run only.

`hybrid` enables native fork, universal, and required check behavior where applicable.
