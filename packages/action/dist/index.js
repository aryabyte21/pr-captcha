// src/index.ts
import { readFileSync } from "fs";
async function run() {
  const event = readEvent();
  if (!event.pull_request) {
    info("No pull request context found. pr-captcha gate is not required.");
    return;
  }
  const repository = event.repository ?? repositoryFromEnv();
  if (!repository) {
    throw new Error("Unable to determine repository owner and name.");
  }
  const apiUrl = getInput("api-url", true).replace(/\/+$/, "");
  const statusUrl = new URL(`${apiUrl}/api/v1/verifications/status`);
  statusUrl.searchParams.set("owner", repository.owner.login);
  statusUrl.searchParams.set("repo", repository.name);
  statusUrl.searchParams.set("pr", String(event.pull_request.number));
  statusUrl.searchParams.set("sha", event.pull_request.head.sha);
  const response = await fetch(statusUrl);
  const status = await readStatusResponse(response);
  if (!response.ok) {
    throw new Error(
      status.error ?? `pr-captcha status request failed with ${response.status}`
    );
  }
  if (status.verified) {
    info(
      `pr-captcha verified by ${status.solver_login ?? "unknown"} at ${status.captcha_passed_at ?? "unknown time"}.`
    );
    return;
  }
  if (status.verification_url) {
    setFailed(
      `Human verification required before expensive CI can run: ${status.verification_url}`
    );
    return;
  }
  setFailed(
    "Human verification required, but pr-captcha has not created a gate for this SHA yet."
  );
}
async function readStatusResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("application/json")) {
    return await response.json();
  }
  return {
    verified: false,
    error: await response.text()
  };
}
function readEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    return {};
  }
  return JSON.parse(readFileSync(eventPath, "utf8"));
}
function repositoryFromEnv() {
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
      login: owner
    }
  };
}
run().catch((error) => {
  setFailed(error instanceof Error ? error.message : String(error));
});
function getInput(name, required) {
  const key = `INPUT_${name.replaceAll(" ", "_").replaceAll("-", "_").toUpperCase()}`;
  const value = process.env[key]?.trim() ?? "";
  if (required && !value) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return value;
}
function info(message) {
  console.log(message);
}
function setFailed(message) {
  console.error(`::error::${escapeWorkflowCommand(message)}`);
  process.exitCode = 1;
}
function escapeWorkflowCommand(message) {
  return message.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}
