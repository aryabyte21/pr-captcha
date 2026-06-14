# Architecture

ci-captcha has one privileged control plane and several integration surfaces.

## Control Plane

The control plane is a GitHub App hosted as a Cloudflare Worker.

Responsibilities:

- Verify GitHub webhook signatures.
- Decide whether a pull request needs a gate.
- Create or update a SHA-bound gate record.
- Create a check run on the PR head SHA.
- Create or update one PR comment with a signed verification URL.
- Run GitHub OAuth for the solver.
- Validate Cloudflare Turnstile server-side.
- Confirm the solver is allowed for the PR and exact head SHA.
- Approve held workflow runs after verification.
- Rerun failed universal-gate workflows after verification when configured.

Non-responsibilities:

- Checking out pull request code.
- Running tests.
- Reading repository secrets.
- Acting as a CI system.

## Integration Modes

### Native Fork Gate

This is the primary product.

GitHub holds fork PR workflow runs until they are approved. ci-captcha becomes the approval layer and calls the workflow-run approval API only after human verification.

Benefits:

- Prevents expensive runner jobs from starting.
- Uses GitHub's native hold queue.
- Works without editing workflow YAML.

Limitations:

- Requires the repository to enable fork workflow approval settings.
- Only applies to workflow runs GitHub holds.

### Universal Gate Action

The Action checks whether ci-captcha already has a verification for the current PR and SHA.

If no verification exists, it fails quickly and prints the verification URL. Expensive jobs depend on this gate job.

Benefits:

- Works for same-repo PRs and private repositories.
- Gives maintainers a single YAML integration for expensive workflows.

Limitations:

- A small runner job still starts.
- Re-running the workflow after verification requires Actions write permission.

### Required Check

The GitHub App creates `ci-captcha/human` for each gated PR SHA.

Before verification:

```txt
status: completed
conclusion: action_required
```

After verification:

```txt
status: completed
conclusion: success
```

Benefits:

- Can be required in branch protection.
- Makes the human gate visible in GitHub's normal PR UI.

Limitations:

- It blocks merge, not CI startup, unless combined with native fork gate or the Action gate.

## Data Model

`gates` stores pending and solved gate metadata by PR and head SHA.

`verifications` stores the actual human verification event by repo, PR, and head SHA.

The key invariant is:

```txt
unique(owner, repo, pr_number, head_sha)
```

## SHA Binding

Verification is invalidated by any new commit.

```txt
PR #10 @ abc123 -> verified
PR #10 @ def456 -> verification required
```

The gate page checks the live pull request head SHA immediately before approving workflow runs.

## Trust Boundaries

Untrusted:

- Pull request title, body, branch name, and patch contents.
- Query string values.
- CAPTCHA token before server-side validation.
- GitHub username from the browser before OAuth validation.

Trusted after verification:

- GitHub webhook payload after signature verification.
- GitHub OAuth user from GitHub API.
- Turnstile token after siteverify success.
- GitHub App installation token scoped to the installed repository.

## Failure Behavior

- Invalid link: render a safe error page.
- Missing OAuth: redirect to GitHub login.
- Wrong GitHub user: deny and keep gate pending.
- Stale SHA: deny and ask contributor to use the newest PR comment/check link.
- Turnstile failure: deny and allow retry.
- GitHub approval failure: keep verification recorded, surface retryable error, and leave check non-success.
