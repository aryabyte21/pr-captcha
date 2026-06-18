import { describe, expect, it } from "vitest";
import {
  defaultConfig,
  inspectRepoConfig,
  parseRepoConfig,
  shouldGatePullRequest,
} from "./config";
import type { WebhookPullRequest } from "./types";

const pullRequest: WebhookPullRequest = {
  number: 12,
  draft: false,
  html_url: "https://github.com/owner/repo/pull/12",
  author_association: "FIRST_TIME_CONTRIBUTOR",
  user: {
    login: "new-user",
    type: "User",
  },
  head: {
    sha: "abc123",
    ref: "feature",
    repo: {
      full_name: "new-user/repo",
      fork: true,
      owner: {
        login: "new-user",
      },
    },
  },
  base: {
    ref: "main",
    repo: {
      full_name: "owner/repo",
      owner: {
        login: "owner",
      },
    },
  },
  labels: [],
};

describe("shouldGatePullRequest", () => {
  it("gates all pull requests by default", () => {
    expect(shouldGatePullRequest(pullRequest, defaultConfig)).toEqual({
      gate: true,
      reasons: [
        "all pull requests",
        "fork pull request",
        "first-time contributor",
        "outside contributor",
      ],
    });
  });

  it("gates same-repo first-time contributors by default", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          head: {
            ...pullRequest.head,
            repo: {
              ...pullRequest.base.repo,
              fork: false,
            },
          },
        },
        defaultConfig,
      ),
    ).toEqual({
      gate: true,
      reasons: [
        "all pull requests",
        "first-time contributor",
        "outside contributor",
      ],
    });
  });

  it("gates same-repo owner branches by default", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          author_association: "OWNER",
          user: {
            login: "owner",
            type: "User",
          },
          head: {
            ...pullRequest.head,
            repo: {
              ...pullRequest.base.repo,
              fork: false,
            },
          },
        },
        defaultConfig,
      ),
    ).toEqual({
      gate: true,
      reasons: ["all pull requests"],
    });
  });

  it("gates bot accounts by default", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          author_association: "MEMBER",
          user: {
            login: "release-bot",
            type: "Bot",
          },
          head: {
            ...pullRequest.head,
            repo: {
              ...pullRequest.base.repo,
              fork: false,
            },
          },
        },
        defaultConfig,
      ),
    ).toEqual({
      gate: true,
      reasons: ["all pull requests", "bot account"],
    });
  });

  it("treats repeat external contributors as outside contributors", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          author_association: "CONTRIBUTOR",
        },
        {
          ...defaultConfig,
          apply_to: {
            all_pull_requests: false,
            first_time_contributors: false,
            outside_contributors: true,
            fork_prs: false,
            bots: false,
          },
        },
      ),
    ).toEqual({
      gate: true,
      reasons: ["outside contributor"],
    });
  });

  it("can narrow policy away from collaborators", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          author_association: "COLLABORATOR",
          head: {
            ...pullRequest.head,
            repo: {
              ...pullRequest.base.repo,
              fork: false,
            },
          },
        },
        {
          ...defaultConfig,
          apply_to: {
            ...defaultConfig.apply_to,
            all_pull_requests: false,
          },
        },
      ),
    ).toEqual({ gate: false, reasons: [] });
  });

  it("normalizes author associations before applying policy", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          author_association: "member",
          head: {
            ...pullRequest.head,
            repo: {
              ...pullRequest.base.repo,
              fork: false,
            },
          },
        },
        {
          ...defaultConfig,
          apply_to: {
            ...defaultConfig.apply_to,
            all_pull_requests: false,
          },
        },
      ),
    ).toEqual({ gate: false, reasons: [] });

    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          author_association: "first_timer",
        },
        defaultConfig,
      ).reasons,
    ).toContain("first-time contributor");
  });

  it("keeps native fork mode limited to fork pull requests", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          head: {
            ...pullRequest.head,
            repo: {
              ...pullRequest.base.repo,
              fork: false,
            },
          },
        },
        { ...defaultConfig, mode: "native_fork" },
      ),
    ).toEqual({ gate: false, reasons: [] });
  });

  it("skips trusted labels", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          labels: [{ name: "trusted-contributor" }],
        },
        defaultConfig,
      ),
    ).toEqual({ gate: false, reasons: [] });
  });

  it("matches skipped authors and labels case-insensitively", () => {
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          labels: [{ name: "Trusted-Contributor" }],
        },
        defaultConfig,
      ),
    ).toEqual({ gate: false, reasons: [] });

    const skipAuthorConfig = {
      ...defaultConfig,
      skip: {
        ...defaultConfig.skip,
        authors: ["Dependabot[Bot]"],
      },
    };
    expect(
      shouldGatePullRequest(
        {
          ...pullRequest,
          user: {
            login: "dependabot[bot]",
            type: "Bot",
          },
        },
        skipAuthorConfig,
      ),
    ).toEqual({ gate: false, reasons: [] });
  });
});

describe("parseRepoConfig", () => {
  it("falls back to defaults for malformed YAML", () => {
    expect(parseRepoConfig("mode: [")).toEqual(defaultConfig);
  });

  it("falls back to defaults for non-object YAML", () => {
    expect(parseRepoConfig("- hybrid")).toEqual(defaultConfig);
  });

  it("returns request-local default config objects", () => {
    const first = parseRepoConfig(null);
    first.skip.labels.push("release-train");
    first.apply_to.fork_prs = false;

    const second = parseRepoConfig(null);

    expect(second.skip.labels).toEqual(defaultConfig.skip.labels);
    expect(second.apply_to.fork_prs).toBe(true);
    expect(second.apply_to.all_pull_requests).toBe(true);
  });

  it("ignores invalid runtime values that would weaken the gate", () => {
    expect(
      parseRepoConfig(`
mode: bananas
apply_to:
  all_pull_requests: false
  first_time_contributors: "false"
  outside_contributors: false
skip:
  authors: dependabot[bot]
checks:
  create_required_check: "false"
  name: ""
`),
    ).toMatchObject({
      mode: "hybrid",
      apply_to: {
        all_pull_requests: false,
        first_time_contributors: true,
        outside_contributors: false,
      },
      skip: defaultConfig.skip,
      checks: {
        create_required_check: true,
        name: "pr-captcha/human",
      },
    });
  });

  it("keeps GitHub login and new-SHA verification as fixed invariants", () => {
    expect(
      parseRepoConfig(`
require:
  github_login: false
  solver_must_be_pr_author: false
  new_sha_requires_new_captcha: false
`),
    ).toMatchObject({
      require: {
        github_login: true,
        solver_must_be_pr_author: false,
        new_sha_requires_new_captcha: true,
      },
    });
  });

  it("normalizes mode and check names from repository config", () => {
    expect(
      parseRepoConfig(`
mode: " OFF "
checks:
  name: "  custom/human  "
`),
    ).toMatchObject({
      mode: "off",
      checks: {
        name: "custom/human",
      },
    });
  });

  it("keeps required-check mode from disabling its check run", () => {
    expect(
      parseRepoConfig(`
mode: required_check
checks:
  create_required_check: false
comment:
  enabled: false
`),
    ).toMatchObject({
      mode: "required_check",
      checks: {
        create_required_check: true,
      },
      comment: {
        enabled: false,
      },
    });
  });

  it("keeps native and hybrid gates discoverable when checks are disabled", () => {
    for (const mode of ["native_fork", "hybrid"] as const) {
      expect(
        parseRepoConfig(`
mode: ${mode}
checks:
  create_required_check: false
comment:
  enabled: false
`),
      ).toMatchObject({
        mode,
        checks: {
          create_required_check: false,
        },
        comment: {
          enabled: true,
        },
      });
    }
  });

  it("allows universal mode to rely on the Action status URL only", () => {
    expect(
      parseRepoConfig(`
mode: universal
checks:
  create_required_check: false
comment:
  enabled: false
`),
    ).toMatchObject({
      mode: "universal",
      checks: {
        create_required_check: false,
      },
      comment: {
        enabled: false,
      },
    });
  });
});

describe("inspectRepoConfig", () => {
  it("reports missing repository config while using defaults", () => {
    expect(inspectRepoConfig(null)).toMatchObject({
      source: "default",
      valid: true,
      config: defaultConfig,
      diagnostics: [
        {
          level: "warning",
          code: "config_missing",
        },
      ],
    });
  });

  it("reports invalid YAML as an actionable error", () => {
    expect(inspectRepoConfig("mode: [")).toMatchObject({
      source: "repository",
      valid: false,
      config: defaultConfig,
      diagnostics: [
        {
          level: "error",
          code: "config_invalid",
        },
      ],
    });
  });

  it("reports repository configs that cannot gate any pull request target", () => {
    const inspection = inspectRepoConfig(`
apply_to:
  all_pull_requests: false
  first_time_contributors: false
  outside_contributors: false
  fork_prs: false
  bots: false
`);

    expect(inspection.valid).toBe(true);
    expect(inspection.diagnostics).toContainEqual(
      expect.objectContaining({
        level: "warning",
        code: "no_pr_targets",
      }),
    );
  });

  it("reports enforced security invariants", () => {
    const inspection = inspectRepoConfig(`
require:
  github_login: false
  new_sha_requires_new_captcha: false
`);

    expect(inspection.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "github_login_enforced" }),
        expect.objectContaining({ code: "sha_binding_enforced" }),
      ]),
    );
  });

  it("warns when verification is not limited to the PR author", () => {
    const inspection = inspectRepoConfig(`
require:
  solver_must_be_pr_author: false
`);

    expect(inspection.diagnostics).toContainEqual(
      expect.objectContaining({
        level: "warning",
        code: "broad_solver_policy",
      }),
    );
  });
});
