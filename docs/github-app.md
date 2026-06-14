# GitHub App Setup

Create a GitHub App with these permissions:

| Permission    | Access | Why                                                                    |
| ------------- | ------ | ---------------------------------------------------------------------- |
| Metadata      | Read   | Required by GitHub Apps.                                               |
| Pull requests | Read   | Read PR author, head SHA, labels, fork state, and author association.  |
| Issues        | Write  | Create or update the PR comment with the verification link.            |
| Checks        | Write  | Create `pr-captcha/human` check runs for branch protection.            |
| Actions       | Write  | Approve held fork PR workflow runs and rerun universal-gate workflows. |
| Contents      | Read   | Optional `.github/pr-captcha.yml` config loading.                      |

Subscribe to these webhook events:

- `pull_request`
- `workflow_run`
- `installation`
- `installation_repositories`

Set the webhook URL to:

```txt
https://your-worker.example.com/webhooks/github
```

Set the callback URL to:

```txt
https://your-worker.example.com/auth/github/callback
```

Required Worker secrets:

```txt
GITHUB_APP_ID
GITHUB_PRIVATE_KEY
GITHUB_WEBHOOK_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
TURNSTILE_SECRET_KEY
TURNSTILE_SITE_KEY
SESSION_SECRET
APP_BASE_URL
```
