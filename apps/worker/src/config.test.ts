import { describe, expect, it } from "vitest";
import { defaultConfig, shouldGatePullRequest } from "./config";
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
  it("gates first-time fork pull requests by default", () => {
    expect(shouldGatePullRequest(pullRequest, defaultConfig)).toEqual({
      gate: true,
      reasons: [
        "fork pull request",
        "first-time contributor",
        "outside contributor",
      ],
    });
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
});
