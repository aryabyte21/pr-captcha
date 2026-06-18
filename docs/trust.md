# Trust Center

Last updated: June 19, 2026

This page summarizes the public trust posture for pr-captcha.

pr-captcha is a GitHub App and Cloudflare Worker that adds a human-origin intake gate for configured pull requests. It reads GitHub metadata, requires GitHub OAuth and Cloudflare Turnstile, and publishes a SHA-bound verification signal. It does not check out, build, test, or execute pull request code.

## Current launch posture

| Area                | Status         | Notes                                                                                                                             |
| ------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Security model      | Ready for beta | SHA binding, signed gate URLs, CSRF protection, nonce tracking, webhook dedupe, rate limits, and audit logs are implemented.      |
| Privacy policy      | Ready for beta | Metadata processing is documented in [privacy.md](privacy.md).                                                                    |
| Terms               | Beta           | Beta terms are documented in [terms.md](terms.md). A formal commercial agreement is still required before paid or enterprise use. |
| Abuse reporting     | Ready for beta | Abuse paths are documented in [abuse.md](abuse.md).                                                                               |
| Incident process    | Ready for beta | Triage and disclosure process is documented in [incident.md](incident.md).                                                        |
| Support path        | Beta           | GitHub issues are the beta support path. A dedicated support mailbox is required before public launch.                            |
| Production accounts | Blocked        | Cloudflare, GitHub App, OAuth, Turnstile, and D1 production credentials are still required for a live public service.             |

## Data handling summary

pr-captcha processes repository, pull request, author, installation, OAuth session, CAPTCHA validation, and verification status metadata needed to operate the intake gate.

It does not intentionally store pull request patch contents, repository source files, CI logs, GitHub secrets, or arbitrary user messages.

## Security contact

Use the repository issue tracker for non-sensitive reports:

```txt
https://github.com/aryabyte21/pr-captcha/issues
```

For sensitive vulnerability reports, use GitHub private vulnerability reporting if it is enabled for the repository. A dedicated security mailbox should be created before a public Marketplace launch.

## Public launch blockers

- Create production Cloudflare Worker, D1, Turnstile, and GitHub App credentials.
- Run a clean fork PR demo against a real test repository.
- Add real webhook replay fixtures from GitHub deliveries.
- Add a dedicated support mailbox and security mailbox.
- Finalize Marketplace listing, incident ownership, and support expectations.
