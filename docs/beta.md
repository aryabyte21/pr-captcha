# Beta Policy

Last updated: June 19, 2026

pr-captcha is currently intended for controlled beta testing.

## Beta goals

- Verify the GitHub App install path.
- Test fork PR intake gates with friendly repositories.
- Tune rate limits and audit coverage.
- Capture real webhook fixtures for replay tests.
- Validate that maintainers can diagnose failures without support.

## Beta limits

- No service-level agreement.
- No dedicated support path.
- No public listing guarantee.
- Installations may be limited with `ALLOWED_INSTALLATION_IDS`.
- Behavior, copy, docs, and APIs may change before launch.

## Recommended beta rollout

1. Install on a non-critical test repository.
2. Use audit or hybrid mode first.
3. Open a clean fork PR from an unknown author.
4. Verify the `pr-captcha/human` check binds to the exact SHA.
5. Push a new commit and confirm a new verification is required.
6. Only then consider branch protection changes.

## Exit criteria

Closed beta should not end until:

- 100 successful PR intake verifications complete in beta repositories.
- Zero known cases apply verification to the wrong SHA.
- Zero privileged execution of untrusted pull request code occurs.
- Operators have clear paths for webhook, OAuth, Turnstile, and GitHub API failures.
