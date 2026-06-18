# Incident Process

Last updated: June 19, 2026

This process covers service, security, and data-handling incidents for pr-captcha.

## Severity levels

| Severity | Examples                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | Verification applies to the wrong SHA, repository, PR author, or pull request. Secrets are exposed. The Worker approves a workflow run incorrectly. |
| High     | GitHub webhooks are not verified correctly. CAPTCHA failures are not rate limited. Production D1 data is unavailable.                               |
| Medium   | Status pages are stale. Diagnostics fail. PR comments or checks are delayed.                                                                        |
| Low      | Documentation, copy, or launch-page issues that do not affect gating behavior.                                                                      |

## Response steps

1. Capture the request ID, GitHub delivery ID, repository, PR number, head SHA, and timestamp.
2. Preserve relevant Worker logs, audit logs, D1 rows, and GitHub delivery details.
3. Stop additional impact by disabling the affected installation, beta allowlist entry, or Worker route if needed.
4. Identify whether the issue affects verification correctness, workflow release, data handling, or availability.
5. Fix forward and add a regression test.
6. Notify affected maintainers when the incident changes trust in a verification signal or exposes data.
7. Write a short post-incident note with root cause, timeline, impact, and prevention.

## Recovery checks

Before closing an incident, verify:

- `/health` and `/health/ready`.
- D1 queryability.
- GitHub webhook delivery handling.
- Gate creation, verification, and check-run publication.
- Native fork workflow approval behavior if affected.
- Universal Action gate behavior if affected.

## Public launch requirement

Before public traffic, assign an incident owner, support channel, security contact, and status communication path.
