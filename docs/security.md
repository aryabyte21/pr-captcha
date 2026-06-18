# Security Model

Last updated: June 19, 2026

pr-captcha is designed around one security boundary: a pull request should not become trusted work just because it exists.

## Core guarantees

- Verification is bound to repository owner, repository name, pull request number, PR author, and exact head SHA.
- A new commit requires a new verification.
- The Worker does not check out, build, test, or execute pull request code.
- GitHub webhooks are signature verified.
- Gate URLs are signed and expire.
- Gate tokens are stored as hashes.
- Gate form submissions use CSRF protection.
- Gate nonce use is single-use.
- Rate limits apply to public and gate paths.
- Webhook deliveries are deduped.
- Audit events record important lifecycle transitions.

## Trust boundaries

| Boundary                      | How it is handled                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| GitHub webhook to Worker      | HMAC signature verification and delivery dedupe.                                         |
| Contributor browser to Worker | Signed gate token, CSRF token, OAuth session, CAPTCHA validation, and nonce consumption. |
| Worker to GitHub API          | GitHub App installation token with narrowly documented permissions.                      |
| Pull request code             | Treated as untrusted metadata only. The Worker does not execute it.                      |
| Admin endpoints               | Bearer token required. Admin token should be stored as a Cloudflare secret.              |

## Permission rationale

See [github-app.md](github-app.md) for the permission table. Before public launch, the GitHub App permission set should be reviewed against the exact GitHub API calls used by the Worker.

## Vulnerability reporting

For non-sensitive reports, use GitHub issues:

```txt
https://github.com/aryabyte21/pr-captcha/issues
```

For sensitive reports, use GitHub private vulnerability reporting if available. A dedicated `security@` mailbox should be created before public launch.

## Remaining hardening work

- Add real webhook replay fixtures from GitHub deliveries.
- Add a threat model document with abuse paths and mitigations.
- Review OAuth cookie SameSite, expiry, and rotation policy against production domain behavior.
- Add maintainer override audit coverage.
- Finalize private vulnerability reporting and disclosure ownership.
