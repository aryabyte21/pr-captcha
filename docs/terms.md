# Beta Terms

Last updated: June 19, 2026

These beta terms are for maintainers testing the free hosted pr-captcha beta.

## Beta status

pr-captcha is not yet a generally available production service. The codebase is designed for a closed beta, and the live service still requires production Cloudflare, GitHub App, OAuth, Turnstile, and D1 setup.

## Intended use

pr-captcha is intended to add a human-origin intake gate for configured pull request targets. By default that includes owner branches, member branches, forks, first-time contributors, outside contributors, and bot accounts.

It is not:

- AI detection.
- Code review.
- Malware scanning.
- A replacement for branch protection.
- A guarantee that a pull request is safe.

## Maintainer responsibilities

Maintainers are responsible for:

- Choosing an appropriate repository policy.
- Understanding GitHub App permissions before installation.
- Testing the gate on a non-critical repository first.
- Keeping existing branch protection and review requirements in place.
- Avoiding any workflow design that exposes secrets to untrusted pull request code.

## Availability

No service-level agreement is provided during beta. The beta may change, break, or be limited while rate limits, abuse controls, and operational procedures are tuned.

## Liability

Use the beta at your own risk. pr-captcha reduces one intake class of maintainer toil but does not remove the need for normal security review, CI hygiene, or repository governance.

## Contact

Use GitHub issues for beta support:

```txt
https://github.com/aryabyte21/pr-captcha/issues
```

A longer public terms page should be finalized before broader public traffic.
