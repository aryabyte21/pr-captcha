import { importPKCS8, SignJWT } from "jose";
import type { Env } from "./env";
import type { WebhookPullRequest } from "./types";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
  }
}

type GitHubOptions = {
  method?: string;
  body?: unknown;
};

type GitHubComment = {
  id: number;
  body: string;
  user: {
    type: string;
  } | null;
};

type CheckRun = {
  id: number;
};

type WorkflowRun = {
  id: number;
  event: string;
  status: string | null;
  conclusion: string | null;
  head_sha: string;
};

type PullRequestResponse = WebhookPullRequest;

export async function getInstallationToken(
  env: Env,
  installationId: string | number,
): Promise<string> {
  const jwt = await createGitHubAppJwt(env);
  const response = await githubRequest<{ token: string }>(
    jwt,
    `/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
    },
  );
  return response.token;
}

export async function githubRequest<T>(
  token: string,
  path: string,
  options: GitHubOptions = {},
): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "pr-captcha",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GitHubApiError(
      `GitHub API request failed: ${response.status}`,
      response.status,
      text,
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function getRepositoryFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<string | null> {
  try {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const file = await githubRequest<{ content: string; encoding: string }>(
      token,
      `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
    );
    if (file.encoding !== "base64") {
      return null;
    }
    return decodeBase64(file.content);
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createCheckRun(
  token: string,
  input: {
    owner: string;
    repo: string;
    name: string;
    headSha: string;
    detailsUrl: string;
    title: string;
    summary: string;
    conclusion: "action_required" | "success" | "failure";
  },
): Promise<number> {
  const check = await githubRequest<CheckRun>(
    token,
    `/repos/${input.owner}/${input.repo}/check-runs`,
    {
      method: "POST",
      body: {
        name: input.name,
        head_sha: input.headSha,
        status: "completed",
        conclusion: input.conclusion,
        details_url: input.detailsUrl,
        output: {
          title: input.title,
          summary: input.summary,
        },
      },
    },
  );
  return check.id;
}

export async function updateCheckRun(
  token: string,
  input: {
    owner: string;
    repo: string;
    checkRunId: number;
    detailsUrl: string;
    title: string;
    summary: string;
    conclusion: "action_required" | "success" | "failure";
  },
): Promise<void> {
  await githubRequest(
    token,
    `/repos/${input.owner}/${input.repo}/check-runs/${input.checkRunId}`,
    {
      method: "PATCH",
      body: {
        status: "completed",
        conclusion: input.conclusion,
        details_url: input.detailsUrl,
        output: {
          title: input.title,
          summary: input.summary,
        },
      },
    },
  );
}

export async function createOrUpdateGateComment(
  token: string,
  input: {
    owner: string;
    repo: string;
    prNumber: number;
    body: string;
    marker: string;
  },
): Promise<number> {
  const comments = await githubRequest<GitHubComment[]>(
    token,
    `/repos/${input.owner}/${input.repo}/issues/${input.prNumber}/comments?per_page=100`,
  );
  const existing = comments.find(
    (comment) =>
      comment.body.includes(input.marker) && comment.user?.type === "Bot",
  );
  if (existing) {
    await githubRequest(
      token,
      `/repos/${input.owner}/${input.repo}/issues/comments/${existing.id}`,
      {
        method: "PATCH",
        body: {
          body: input.body,
        },
      },
    );
    return existing.id;
  }
  const created = await githubRequest<GitHubComment>(
    token,
    `/repos/${input.owner}/${input.repo}/issues/${input.prNumber}/comments`,
    {
      method: "POST",
      body: {
        body: input.body,
      },
    },
  );
  return created.id;
}

export async function getPullRequest(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PullRequestResponse> {
  return githubRequest<PullRequestResponse>(
    token,
    `/repos/${owner}/${repo}/pulls/${prNumber}`,
  );
}

export async function approveWorkflowRunsForSha(
  token: string,
  owner: string,
  repo: string,
  headSha: string,
): Promise<number> {
  const runs = await githubRequest<{ workflow_runs: WorkflowRun[] }>(
    token,
    `/repos/${owner}/${repo}/actions/runs?event=pull_request&head_sha=${encodeURIComponent(headSha)}&per_page=100`,
  );
  let approved = 0;
  for (const run of runs.workflow_runs) {
    if (
      run.status !== "action_required" &&
      run.conclusion !== "action_required"
    ) {
      continue;
    }
    try {
      await githubRequest(
        token,
        `/repos/${owner}/${repo}/actions/runs/${run.id}/approve`,
        {
          method: "POST",
        },
      );
      approved += 1;
    } catch (error) {
      if (
        !(error instanceof GitHubApiError && [403, 404].includes(error.status))
      ) {
        throw error;
      }
    }
  }
  return approved;
}

export async function rerunFailedWorkflowRunsForSha(
  token: string,
  owner: string,
  repo: string,
  headSha: string,
): Promise<number> {
  const runs = await githubRequest<{ workflow_runs: WorkflowRun[] }>(
    token,
    `/repos/${owner}/${repo}/actions/runs?event=pull_request&head_sha=${encodeURIComponent(headSha)}&status=completed&per_page=100`,
  );
  let rerun = 0;
  for (const run of runs.workflow_runs) {
    if (run.conclusion !== "failure") {
      continue;
    }
    await githubRequest(
      token,
      `/repos/${owner}/${repo}/actions/runs/${run.id}/rerun-failed-jobs`,
      {
        method: "POST",
      },
    );
    rerun += 1;
  }
  return rerun;
}

async function createGitHubAppJwt(env: Env): Promise<string> {
  const privateKey = env.GITHUB_PRIVATE_KEY.replaceAll("\\n", "\n");
  const key = await importPKCS8(privateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .setIssuer(env.GITHUB_APP_ID)
    .sign(key);
}

function decodeBase64(value: string): string {
  const binary = atob(value.replaceAll("\n", ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
