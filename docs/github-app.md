# GitHub App Setup

Create a GitHub App at `https://github.com/settings/apps/new` (or your org's app settings). Set the webhook URL to `https://<worker-domain>/webhooks/github`, the OAuth callback URL to `https://<worker-domain>/auth/github/callback`, and the setup URL to `https://<worker-domain>/`. Apply the permissions below, then store the App ID, private key, webhook secret, client ID, and client secret as Worker secrets.

Use `docs/assets/pr-captcha-github-app-icon.png` as the GitHub App logo.

Create a GitHub App with these permissions:

| Permission    | Access | Why                                                                    |
| ------------- | ------ | ---------------------------------------------------------------------- |
| Metadata      | Read   | Required by GitHub Apps.                                               |
| Pull requests | Write  | Read PR metadata and update PR review surfaces.                        |
| Issues        | Write  | Create or update the PR comment with the verification link.            |
| Checks        | Write  | Create `pr-captcha/human` check runs for branch protection.            |
| Actions       | Write  | Approve held fork PR workflow runs and rerun universal-gate workflows. |
| Contents      | Read   | Optional `.github/pr-captcha.yml` config loading.                      |

Subscribe to these webhook events:

- `pull_request`

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

Optional Worker secret:

```txt
ADMIN_TOKEN
ALLOWED_INSTALLATION_IDS
```

Set `ADMIN_TOKEN` when operators need to retry publishing a verified gate through `/api/admin/gates/:id/retry`.

Set `ALLOWED_INSTALLATION_IDS` to a comma or whitespace separated list of GitHub App installation IDs during a closed beta. Leave it unset to accept every installation.
