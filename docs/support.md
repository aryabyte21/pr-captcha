# Support Path

Last updated: June 19, 2026

## Beta support

Use GitHub issues for beta setup questions, bugs, and feature requests:

```txt
https://github.com/aryabyte21/pr-captcha/issues
```

Include:

- Worker URL.
- Repository owner and name.
- Pull request number if relevant.
- Expected behavior.
- Actual behavior.
- Request ID if available.
- `/health/ready` result if relevant.

Do not include secrets, private keys, OAuth client secrets, Turnstile secrets, or bearer tokens.

## Production support requirement

Before public launch, create:

- A support mailbox.
- A security mailbox or GitHub private vulnerability reporting path.
- An abuse reporting path.
- An incident status communication path.

## Self-serve checks

Use these pages before opening a support request:

- `/status` for Worker and readiness checks.
- `/setup-wizard` for policy generation.
- `/evidence` for a live repo risk scan.
- `/demo` for a dry run of the full gate.
