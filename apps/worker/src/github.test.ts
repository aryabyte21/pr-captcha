import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  approveWorkflowRunsForSha,
  createCheckRun,
  createOrUpdateGateComment,
  GitHubApiError,
  getInstallationToken,
  getPullRequest,
  getRepositoryMetadata,
  rerunFailedWorkflowRunsForSha,
  updateCheckRun,
  updateIssueComment,
} from "./github";

describe("GitHub API helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("creates installation tokens with GitHub RSA private keys", async () => {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
      },
    });
    const requests: Array<{ method: string; url: URL; jwt: string }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        const authorization = String(
          (init?.headers as Record<string, string>)?.Authorization ?? "",
        );
        requests.push({
          method,
          url,
          jwt: authorization.replace("Bearer ", ""),
        });

        if (
          url.pathname === "/app/installations/123/access_tokens" &&
          method === "POST"
        ) {
          return Response.json({ token: "installation-token" });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      getInstallationToken(
        {
          GITHUB_APP_ID: "4106777",
          GITHUB_PRIVATE_KEY: privateKey,
        } as never,
        "123",
      ),
    ).resolves.toBe("installation-token");

    expect(requests).toHaveLength(1);
    const request = requests[0];
    expect(request).toBeDefined();
    expect(request?.jwt.split(".")).toHaveLength(3);
  });

  it("finds an existing gate comment beyond the first page", async () => {
    const requests: Array<{ method: string; url: URL; body: string | null }> =
      [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({
          method,
          url,
          body: typeof init?.body === "string" ? init.body : null,
        });

        if (url.pathname.endsWith("/issues/184/comments") && method === "GET") {
          const page = url.searchParams.get("page");
          if (page === "1") {
            return Response.json(
              Array.from({ length: 100 }, (_, index) => ({
                id: index + 1,
                body: `regular comment ${index + 1}`,
                user: { type: "User" },
              })),
            );
          }
          return Response.json([
            {
              id: 250,
              body: "<!-- pr-captcha:octo-org/awesome-repo#184 --> existing",
              user: { type: "Bot" },
            },
          ]);
        }

        if (
          url.pathname.endsWith("/issues/comments/250") &&
          method === "PATCH"
        ) {
          return Response.json({ id: 250 });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      createOrUpdateGateComment("token", {
        owner: "octo-org",
        repo: "awesome-repo",
        prNumber: 184,
        marker: "<!-- pr-captcha:octo-org/awesome-repo#184 -->",
        body: "updated body",
      }),
    ).resolves.toBe(250);

    expect(
      requests.map((request) => [
        request.method,
        request.url.pathname,
        request.url.searchParams.get("page"),
      ]),
    ).toEqual([
      ["GET", "/repos/octo-org/awesome-repo/issues/184/comments", "1"],
      ["GET", "/repos/octo-org/awesome-repo/issues/184/comments", "2"],
      ["PATCH", "/repos/octo-org/awesome-repo/issues/comments/250", null],
    ]);
    expect(requests.at(-1)?.body).toBe(
      JSON.stringify({ body: "updated body" }),
    );
  });

  it("approves action-required workflow runs beyond the first page", async () => {
    const requests: Array<{ method: string; url: URL }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

        if (url.pathname.endsWith("/actions/runs") && method === "GET") {
          const page = url.searchParams.get("page");
          if (page === "1") {
            return Response.json({
              workflow_runs: Array.from({ length: 100 }, (_, index) => ({
                id: index + 1,
                event: "pull_request",
                status: "completed",
                conclusion: "success",
                head_sha: "8f31c9a",
              })),
            });
          }
          return Response.json({
            workflow_runs: [
              {
                id: 201,
                event: "pull_request",
                status: "action_required",
                conclusion: null,
                head_sha: "8f31c9a",
              },
              {
                id: 202,
                event: "pull_request",
                status: "completed",
                conclusion: "action_required",
                head_sha: "8f31c9a",
              },
            ],
          });
        }

        if (url.pathname.endsWith("/actions/runs/201/approve")) {
          return new Response(null, { status: 204 });
        }
        if (url.pathname.endsWith("/actions/runs/202/approve")) {
          return new Response(null, { status: 204 });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      approveWorkflowRunsForSha("token", "octo-org", "awesome-repo", "8f31c9a"),
    ).resolves.toBe(2);

    expect(
      requests.map((request) => [
        request.method,
        request.url.pathname,
        request.url.searchParams.get("page"),
      ]),
    ).toEqual([
      ["GET", "/repos/octo-org/awesome-repo/actions/runs", "1"],
      ["GET", "/repos/octo-org/awesome-repo/actions/runs", "2"],
      ["POST", "/repos/octo-org/awesome-repo/actions/runs/201/approve", null],
      ["POST", "/repos/octo-org/awesome-repo/actions/runs/202/approve", null],
    ]);
  });

  it("does not approve action-required workflow runs for a different head SHA", async () => {
    const requests: Array<{ method: string; url: URL }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

        if (url.pathname.endsWith("/actions/runs") && method === "GET") {
          return Response.json({
            workflow_runs: [
              {
                id: 201,
                event: "pull_request",
                status: "action_required",
                conclusion: null,
                head_sha: "different-sha",
              },
            ],
          });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      approveWorkflowRunsForSha("token", "octo-org", "awesome-repo", "8f31c9a"),
    ).resolves.toBe(0);

    expect(requests.map((request) => request.method)).toEqual(["GET"]);
  });

  it("reads repository metadata for diagnostics", async () => {
    const requests: Array<{ method: string; url: URL }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

        if (url.pathname === "/repos/octo-org/awesome-repo") {
          return Response.json({
            full_name: "octo-org/awesome-repo",
            default_branch: "trunk",
          });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      getRepositoryMetadata("token", "octo-org", "awesome-repo"),
    ).resolves.toEqual({
      fullName: "octo-org/awesome-repo",
      defaultBranch: "trunk",
    });
    expect(requests.map((request) => request.url.pathname)).toEqual([
      "/repos/octo-org/awesome-repo",
    ]);
  });

  it("times out stalled GitHub API requests", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      },
    );

    const pending = getPullRequest(
      "token",
      "octo-org",
      "awesome-repo",
      184,
    ).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(10000);
    const error = await pending;

    expect(error).toBeInstanceOf(GitHubApiError);
    expect(error).toMatchObject({
      status: 504,
      message: "GitHub API request timed out",
    });
  });

  it("does not rerun failed workflow runs for a different head SHA", async () => {
    const requests: Array<{ method: string; url: URL }> = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        requests.push({ method, url });

        if (url.pathname.endsWith("/actions/runs") && method === "GET") {
          return Response.json({
            workflow_runs: [
              {
                id: 201,
                event: "pull_request",
                status: "completed",
                conclusion: "failure",
                head_sha: "different-sha",
              },
            ],
          });
        }

        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      rerunFailedWorkflowRunsForSha(
        "token",
        "octo-org",
        "awesome-repo",
        "8f31c9a",
      ),
    ).resolves.toBe(0);

    expect(requests.map((request) => request.method)).toEqual(["GET"]);
  });

  it("rejects malformed check-run create responses", async () => {
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        if (url.pathname.endsWith("/check-runs") && method === "POST") {
          return Response.json({ ok: true });
        }
        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      createCheckRun("token", {
        owner: "octo-org",
        repo: "awesome-repo",
        name: "pr-captcha/human",
        headSha: "8f31c9a",
        detailsUrl: "https://captcha.example.test/gate/gate-1",
        title: "Human check required",
        summary: "Waiting for a human check.",
        conclusion: "action_required",
      }),
    ).rejects.toThrow("GitHub check run response is invalid");
  });

  it("rejects malformed check-run update responses", async () => {
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        if (url.pathname.endsWith("/check-runs/123") && method === "PATCH") {
          return Response.json({ id: 999 });
        }
        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      updateCheckRun("token", {
        owner: "octo-org",
        repo: "awesome-repo",
        checkRunId: 123,
        detailsUrl: "https://captcha.example.test/gate/gate-1",
        title: "Human check passed",
        summary: "Verified.",
        conclusion: "success",
      }),
    ).rejects.toThrow("GitHub check run update response is invalid");
  });

  it("rejects malformed created comment responses", async () => {
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        if (url.pathname.endsWith("/issues/184/comments") && method === "GET") {
          return Response.json([]);
        }
        if (
          url.pathname.endsWith("/issues/184/comments") &&
          method === "POST"
        ) {
          return Response.json({ id: "not-a-number" });
        }
        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      createOrUpdateGateComment("token", {
        owner: "octo-org",
        repo: "awesome-repo",
        prNumber: 184,
        marker: "<!-- pr-captcha:octo-org/awesome-repo#184 -->",
        body: "body",
      }),
    ).rejects.toThrow("GitHub comment response is invalid");
  });

  it("rejects malformed updated comment responses", async () => {
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        if (
          url.pathname.endsWith("/issues/comments/250") &&
          method === "PATCH"
        ) {
          return Response.json({ id: "250" });
        }
        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      updateIssueComment("token", {
        owner: "octo-org",
        repo: "awesome-repo",
        commentId: 250,
        body: "updated",
      }),
    ).rejects.toThrow("GitHub comment update response is invalid");
  });

  it("rejects malformed workflow run pages", async () => {
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        if (url.pathname.endsWith("/actions/runs") && method === "GET") {
          return Response.json({
            workflow_runs: [
              {
                id: "201",
                event: "pull_request",
                status: "action_required",
                conclusion: null,
                head_sha: "8f31c9a",
              },
            ],
          });
        }
        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      approveWorkflowRunsForSha("token", "octo-org", "awesome-repo", "8f31c9a"),
    ).rejects.toThrow("GitHub paginated response item is invalid");
  });

  it("returns valid pull request responses", async () => {
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        if (url.pathname.endsWith("/pulls/184") && method === "GET") {
          return Response.json(pullRequestResponse());
        }
        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      getPullRequest("token", "octo-org", "awesome-repo", 184),
    ).resolves.toMatchObject({
      number: 184,
      head: {
        sha: "8f31c9a",
      },
      base: {
        ref: "main",
      },
    });
  });

  it("rejects malformed pull request responses", async () => {
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        const method = init?.method ?? "GET";
        if (url.pathname.endsWith("/pulls/184") && method === "GET") {
          return Response.json({
            number: 184,
            head: {
              sha: "8f31c9a",
            },
          });
        }
        throw new Error(`Unexpected request: ${method} ${url.pathname}`);
      },
    );

    await expect(
      getPullRequest("token", "octo-org", "awesome-repo", 184),
    ).rejects.toThrow("GitHub pull request response is invalid");
  });
});

function pullRequestResponse() {
  return {
    number: 184,
    draft: false,
    html_url: "https://github.com/octo-org/awesome-repo/pull/184",
    author_association: "FIRST_TIME_CONTRIBUTOR",
    user: {
      login: "some-user",
      type: "User",
    },
    head: {
      sha: "8f31c9a",
      ref: "feature",
      repo: {
        full_name: "some-user/awesome-repo",
        fork: true,
        owner: {
          login: "some-user",
        },
      },
    },
    base: {
      ref: "main",
      repo: {
        full_name: "octo-org/awesome-repo",
        owner: {
          login: "octo-org",
        },
      },
    },
    labels: [],
  };
}
