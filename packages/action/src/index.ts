import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

type PullRequestEvent = {
  repository?: unknown;
  pull_request?: unknown;
};

type RepositoryContext = {
  name: string;
  owner: {
    login: string;
  };
};

type PullRequestContext = {
  number: number;
  head: {
    sha: string;
  };
};

type StatusResponse = {
  verified: boolean;
  skipped?: boolean;
  verification_url?: string | null;
  solver_login?: string;
  captcha_passed_at?: string;
  error?: string;
};

export async function run(): Promise<void> {
  const event = readEvent();
  const pullRequest = pullRequestFromEvent(event);
  if (!pullRequest) {
    info("No pull request context found. pr-captcha gate is not required.");
    return;
  }

  const repository = repositoryFromEvent(event) ?? repositoryFromEnv();
  if (!repository) {
    throw new Error("Unable to determine repository owner and name.");
  }

  const apiUrl = getInput("api-url", true).replace(/\/+$/, "");
  const statusUrl = new URL(`${apiUrl}/api/v1/verifications/status`);
  statusUrl.searchParams.set("owner", repository.owner.login);
  statusUrl.searchParams.set("repo", repository.name);
  statusUrl.searchParams.set("pr", String(pullRequest.number));
  statusUrl.searchParams.set("sha", pullRequest.head.sha);

  const response = await fetch(statusUrl);
  const status = await readStatusResponse(response);
  if (!response.ok) {
    throw new Error(
      status.error ??
        `pr-captcha status request failed with ${response.status}`,
    );
  }

  if (status.verified) {
    if (status.skipped) {
      info("pr-captcha gate is not required for this pull request SHA.");
      return;
    }
    if (status.solver_login && status.captcha_passed_at) {
      info(
        `pr-captcha verified by ${status.solver_login} at ${status.captcha_passed_at}.`,
      );
      return;
    }
    info(
      "pr-captcha human verification is recorded for this pull request SHA.",
    );
    return;
  }

  if (status.verification_url) {
    setFailed(
      `Human verification required before expensive CI can run: ${status.verification_url}`,
    );
    return;
  }

  setFailed(
    "Human verification required, but pr-captcha has not created a gate for this SHA yet.",
  );
}

async function readStatusResponse(response: Response): Promise<StatusResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("application/json")) {
    const body = (await response.json()) as unknown;
    if (isStatusResponse(body)) {
      return body;
    }
    if (!response.ok && isRecord(body) && typeof body.error === "string") {
      return {
        verified: false,
        error: body.error,
      };
    }
    throw new Error("pr-captcha status response is invalid.");
  }
  if (response.ok) {
    throw new Error("pr-captcha status response is invalid.");
  }
  return {
    verified: false,
    error: await response.text(),
  };
}

function readEvent(): PullRequestEvent {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    return {};
  }
  const event = JSON.parse(readFileSync(eventPath, "utf8")) as unknown;
  return isRecord(event) ? event : {};
}

function pullRequestFromEvent(
  event: PullRequestEvent,
): PullRequestContext | null {
  if (event.pull_request === undefined || event.pull_request === null) {
    return null;
  }
  if (!isPullRequestContext(event.pull_request)) {
    throw new Error("GitHub pull request event payload is invalid.");
  }
  return event.pull_request;
}

function repositoryFromEvent(
  event: PullRequestEvent,
): RepositoryContext | null {
  return isRepositoryContext(event.repository) ? event.repository : null;
}

function isPullRequestContext(value: unknown): value is PullRequestContext {
  if (!isRecord(value)) {
    return false;
  }
  const number = value.number;
  const head = value.head;
  return (
    typeof number === "number" &&
    Number.isSafeInteger(number) &&
    number > 0 &&
    isRecord(head) &&
    nonEmptyString(head.sha)
  );
}

function isRepositoryContext(value: unknown): value is RepositoryContext {
  return (
    isRecord(value) &&
    nonEmptyString(value.name) &&
    isRecord(value.owner) &&
    nonEmptyString(value.owner.login)
  );
}

function isStatusResponse(value: unknown): value is StatusResponse {
  return (
    isRecord(value) &&
    typeof value.verified === "boolean" &&
    optionalBoolean(value.skipped) &&
    optionalNullableString(value.verification_url) &&
    optionalString(value.solver_login) &&
    optionalString(value.captcha_passed_at) &&
    optionalString(value.error)
  );
}

function optionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === "boolean";
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function optionalNullableString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function repositoryFromEnv(): RepositoryContext | null {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return null;
  }
  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    return null;
  }
  return {
    name: repo,
    owner: {
      login: owner,
    },
  };
}

if (isMainModule()) {
  run().catch((error: unknown) => {
    setFailed(error instanceof Error ? error.message : String(error));
  });
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint
    ? import.meta.url === pathToFileURL(entrypoint).href
    : false;
}

function getInput(name: string, required: boolean): string {
  const value =
    inputEnvKeys(name)
      .map((key) => process.env[key])
      .find((candidate) => candidate?.trim())
      ?.trim() ?? "";
  if (required && !value) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return value;
}

function inputEnvKeys(name: string): string[] {
  const toolkitKey = `INPUT_${name.replaceAll(" ", "_").toUpperCase()}`;
  const normalizedKey = `INPUT_${name.replaceAll(" ", "_").replaceAll("-", "_").toUpperCase()}`;
  return toolkitKey === normalizedKey
    ? [toolkitKey]
    : [toolkitKey, normalizedKey];
}

function info(message: string): void {
  console.log(message);
}

function setFailed(message: string): void {
  console.error(`::error::${escapeWorkflowCommand(message)}`);
  process.exitCode = 1;
}

function escapeWorkflowCommand(message: string): string {
  return message
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
}
