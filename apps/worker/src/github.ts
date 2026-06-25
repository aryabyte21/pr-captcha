import { importPKCS8, SignJWT } from "jose";
import type { Env } from "./env";
import { fetchWithTimeout, isAbortError } from "./http";
import type { WebhookPullRequest } from "./types";

const githubRequestTimeoutMs = 10000;

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
    readonly path = "",
    readonly method = "",
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

type RepositoryMetadata = {
  fullName: string;
  defaultBranch: string;
};

export type RepositoryUserPermission = {
  permission: "admin" | "write" | "read" | "none";
  roleName: string | null;
};

export async function getInstallationToken(
  env: Env,
  installationId: string | number,
): Promise<string> {
  const jwt = await createGitHubAppJwt(env);
  const response = await githubRequest<unknown>(
    jwt,
    `/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
    },
  );
  if (!isRecord(response) || !nonEmptyString(response.token)) {
    throw new Error("GitHub installation token response is invalid");
  }
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

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `https://api.github.com${path}`,
      init,
      githubRequestTimeoutMs,
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw new GitHubApiError(
        "GitHub API request timed out",
        504,
        "",
        path,
        init.method ?? "GET",
      );
    }
    throw error;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new GitHubApiError(
      `GitHub API request failed: ${response.status}`,
      response.status,
      text,
      path,
      init.method ?? "GET",
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
    const file = await githubRequest<unknown>(
      token,
      `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
    );
    if (
      !isRecord(file) ||
      typeof file.content !== "string" ||
      file.encoding !== "base64"
    ) {
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

export async function getRepositoryMetadata(
  token: string,
  owner: string,
  repo: string,
): Promise<RepositoryMetadata> {
  const repository = await githubRequest<unknown>(
    token,
    `/repos/${owner}/${repo}`,
  );
  if (
    !isRecord(repository) ||
    !nonEmptyString(repository.full_name) ||
    !nonEmptyString(repository.default_branch)
  ) {
    throw new Error("GitHub repository response is invalid");
  }
  return {
    fullName: repository.full_name,
    defaultBranch: repository.default_branch,
  };
}

export async function getRepositoryUserPermission(
  token: string,
  owner: string,
  repo: string,
  username: string,
): Promise<RepositoryUserPermission> {
  try {
    const permission = await githubRequest<unknown>(
      token,
      `/repos/${owner}/${repo}/collaborators/${encodeURIComponent(username)}/permission`,
    );
    if (!isRepositoryPermissionResponse(permission)) {
      throw new Error("GitHub repository permission response is invalid");
    }
    return {
      permission: permission.permission,
      roleName: permission.role_name ?? null,
    };
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) {
      return {
        permission: "none",
        roleName: null,
      };
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
  const check = await githubRequest<unknown>(
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
  if (!isCheckRun(check)) {
    throw new Error("GitHub check run response is invalid");
  }
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
  const check = await githubRequest<unknown>(
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
  if (!isCheckRun(check) || check.id !== input.checkRunId) {
    throw new Error("GitHub check run update response is invalid");
  }
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
  const comments = await githubPaginatedRequest(
    token,
    `/repos/${input.owner}/${input.repo}/issues/${input.prNumber}/comments`,
    undefined,
    isGitHubComment,
  );
  const existing = comments.find(
    (comment) =>
      comment.body.includes(input.marker) && comment.user?.type === "Bot",
  );
  if (existing) {
    await updateIssueComment(token, {
      owner: input.owner,
      repo: input.repo,
      commentId: existing.id,
      body: input.body,
    });
    return existing.id;
  }
  const created = await githubRequest<unknown>(
    token,
    `/repos/${input.owner}/${input.repo}/issues/${input.prNumber}/comments`,
    {
      method: "POST",
      body: {
        body: input.body,
      },
    },
  );
  if (!isGitHubComment(created)) {
    throw new Error("GitHub comment response is invalid");
  }
  return created.id;
}

export async function updateIssueComment(
  token: string,
  input: {
    owner: string;
    repo: string;
    commentId: number;
    body: string;
  },
): Promise<void> {
  const comment = await githubRequest<unknown>(
    token,
    `/repos/${input.owner}/${input.repo}/issues/comments/${input.commentId}`,
    {
      method: "PATCH",
      body: {
        body: input.body,
      },
    },
  );
  if (
    !isRecord(comment) ||
    !isPositiveInteger(comment.id) ||
    comment.id !== input.commentId
  ) {
    throw new Error("GitHub comment update response is invalid");
  }
}

export async function getPullRequest(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PullRequestResponse> {
  const pullRequest = await githubRequest<unknown>(
    token,
    `/repos/${owner}/${repo}/pulls/${prNumber}`,
  );
  if (!isPullRequestResponse(pullRequest)) {
    throw new Error("GitHub pull request response is invalid");
  }
  return pullRequest;
}

export async function approveWorkflowRunsForSha(
  token: string,
  owner: string,
  repo: string,
  headSha: string,
): Promise<number> {
  const runs = await githubPaginatedRequest(
    token,
    `/repos/${owner}/${repo}/actions/runs?event=pull_request&head_sha=${encodeURIComponent(headSha)}`,
    "workflow_runs",
    isWorkflowRun,
  );
  let approved = 0;
  for (const run of runs) {
    if (
      run.head_sha !== headSha ||
      (run.status !== "action_required" && run.conclusion !== "action_required")
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
  const runs = await githubPaginatedRequest(
    token,
    `/repos/${owner}/${repo}/actions/runs?event=pull_request&head_sha=${encodeURIComponent(headSha)}&status=completed`,
    "workflow_runs",
    isWorkflowRun,
  );
  let rerun = 0;
  for (const run of runs) {
    if (run.head_sha !== headSha || run.conclusion !== "failure") {
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

async function githubPaginatedRequest<T>(
  token: string,
  path: string,
  collectionKey?: string,
  validateItem?: (value: unknown) => value is T,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const payload = await githubRequest<unknown>(token, withPage(path, page));
    const pageItems = collectionKey
      ? isRecord(payload)
        ? payload[collectionKey]
        : undefined
      : payload;
    if (!Array.isArray(pageItems)) {
      throw new Error("GitHub paginated response is invalid");
    }
    if (validateItem && !pageItems.every(validateItem)) {
      throw new Error("GitHub paginated response item is invalid");
    }
    if (pageItems.length === 0) {
      return items;
    }
    items.push(...(pageItems as T[]));
    if (pageItems.length < 100) {
      return items;
    }
  }
}

function withPage(path: string, page: number): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}per_page=100&page=${page}`;
}

async function createGitHubAppJwt(env: Env): Promise<string> {
  const privateKey = normalizeGitHubPrivateKey(env.GITHUB_PRIVATE_KEY);
  const key = await importPKCS8(privateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .setIssuer(env.GITHUB_APP_ID)
    .sign(key);
}

export function normalizeGitHubPrivateKey(privateKey: string): string {
  const normalized = privateKey.replaceAll("\\n", "\n").trim();
  if (!normalized.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    return normalized;
  }
  const pkcs1 = pemToBytes(normalized, "RSA PRIVATE KEY");
  return bytesToPem("PRIVATE KEY", pkcs8FromPkcs1(pkcs1));
}

function pkcs8FromPkcs1(pkcs1: Uint8Array): Uint8Array {
  return derSequence([
    derIntegerZero(),
    derSequence([
      Uint8Array.from([
        0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
      ]),
      Uint8Array.from([0x05, 0x00]),
    ]),
    derOctetString(pkcs1),
  ]);
}

function derIntegerZero(): Uint8Array {
  return Uint8Array.from([0x02, 0x01, 0x00]);
}

function derOctetString(value: Uint8Array): Uint8Array {
  return derValue(0x04, value);
}

function derSequence(values: Uint8Array[]): Uint8Array {
  return derValue(0x30, concatBytes(values));
}

function derValue(tag: number, value: Uint8Array): Uint8Array {
  return concatBytes([Uint8Array.from([tag]), derLength(value.length), value]);
}

function derLength(length: number): Uint8Array {
  if (length < 0x80) {
    return Uint8Array.from([length]);
  }
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>= 8;
  }
  return Uint8Array.from([0x80 | bytes.length, ...bytes]);
}

function concatBytes(values: Uint8Array[]): Uint8Array {
  const totalLength = values.reduce((sum, value) => sum + value.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const value of values) {
    result.set(value, offset);
    offset += value.length;
  }
  return result;
}

function pemToBytes(pem: string, label: string): Uint8Array {
  const body = pem
    .replace(`-----BEGIN ${label}-----`, "")
    .replace(`-----END ${label}-----`, "")
    .replaceAll(/\s+/g, "");
  const binary = atob(body);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToPem(label: string, bytes: Uint8Array): string {
  const base64 = bytesToBase64(bytes);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let index = 0; index < bytes.length; index += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(index, index + 0x8000)));
  }
  return btoa(chunks.join(""));
}

function decodeBase64(value: string): string {
  const binary = atob(value.replaceAll("\n", ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isCheckRun(value: unknown): value is CheckRun {
  return isRecord(value) && isPositiveInteger(value.id);
}

function isGitHubComment(value: unknown): value is GitHubComment {
  return (
    isRecord(value) &&
    isPositiveInteger(value.id) &&
    typeof value.body === "string" &&
    (value.user === null ||
      (isRecord(value.user) && typeof value.user.type === "string"))
  );
}

function isWorkflowRun(value: unknown): value is WorkflowRun {
  return (
    isRecord(value) &&
    isPositiveInteger(value.id) &&
    value.event === "pull_request" &&
    (value.status === null || typeof value.status === "string") &&
    (value.conclusion === null || typeof value.conclusion === "string") &&
    typeof value.head_sha === "string"
  );
}

function isPullRequestResponse(value: unknown): value is PullRequestResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isPositiveInteger(value.number) &&
    typeof value.draft === "boolean" &&
    nonEmptyString(value.html_url) &&
    nonEmptyString(value.author_association) &&
    isGitHubUser(value.user) &&
    isPullRequestHead(value.head) &&
    isPullRequestBase(value.base) &&
    Array.isArray(value.labels) &&
    value.labels.every(isPullRequestLabel)
  );
}

function isGitHubUser(value: unknown): value is PullRequestResponse["user"] {
  return (
    isRecord(value) && nonEmptyString(value.login) && nonEmptyString(value.type)
  );
}

function isPullRequestHead(
  value: unknown,
): value is PullRequestResponse["head"] {
  return (
    isRecord(value) &&
    nonEmptyString(value.sha) &&
    nonEmptyString(value.ref) &&
    (value.repo === null || isPullRequestHeadRepo(value.repo))
  );
}

function isPullRequestHeadRepo(
  value: unknown,
): value is NonNullable<PullRequestResponse["head"]["repo"]> {
  return (
    isRecord(value) &&
    nonEmptyString(value.full_name) &&
    typeof value.fork === "boolean" &&
    isGitHubOwner(value.owner)
  );
}

function isPullRequestBase(
  value: unknown,
): value is PullRequestResponse["base"] {
  return (
    isRecord(value) &&
    nonEmptyString(value.ref) &&
    isRecord(value.repo) &&
    nonEmptyString(value.repo.full_name) &&
    isGitHubOwner(value.repo.owner)
  );
}

function isGitHubOwner(value: unknown): value is { login: string } {
  return isRecord(value) && nonEmptyString(value.login);
}

function isPullRequestLabel(
  value: unknown,
): value is PullRequestResponse["labels"][number] {
  return isRecord(value) && typeof value.name === "string";
}

function isRepositoryPermissionResponse(value: unknown): value is {
  permission: RepositoryUserPermission["permission"];
  role_name?: string;
} {
  return (
    isRecord(value) &&
    ["admin", "write", "read", "none"].includes(String(value.permission)) &&
    (value.role_name === undefined || typeof value.role_name === "string")
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
