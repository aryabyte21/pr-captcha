# Abuse Reporting

Last updated: June 19, 2026

Use this process to report suspected abuse involving pr-captcha.

## Reportable abuse

Examples:

- Attempts to bypass CAPTCHA or OAuth verification.
- Repeated failed verification attempts.
- Suspicious use of maintainer override labels.
- A GitHub App installation that appears unauthorized.
- A verification signal applied to the wrong repository, pull request, author, or SHA.
- A workflow release that should not have been approved.

## Report path

For beta, report abuse through GitHub issues:

```txt
https://github.com/aryabyte21/pr-captcha/issues
```

Include:

- Repository owner and name.
- Pull request number.
- Head SHA.
- Approximate time.
- Screenshot or GitHub link.
- Any visible pr-captcha request ID.

Do not post secrets, private tokens, OAuth codes, or private vulnerability details in a public issue.

## Operator response

Operators should:

1. Check audit logs for the repository, PR number, author, and head SHA.
2. Inspect webhook delivery markers and rate-limit buckets.
3. Confirm whether verification was created, solved, published, skipped, or retried.
4. If needed, disable the affected installation or closed-beta allowlist entry.
5. Document the incident according to [incident.md](incident.md).

## Public launch requirement

A dedicated abuse reporting mailbox or form is required before public Marketplace launch.
