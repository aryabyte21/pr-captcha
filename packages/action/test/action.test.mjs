import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("logs skipped gates as not required", async () => {
  const result = await runAction({
    status: {
      verified: true,
      skipped: true,
    },
  });

  assert.equal(result.exitCode, undefined);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.logs, [
    "pr-captcha gate is not required for this pull request SHA.",
  ]);
  assert.equal(result.requestUrl.searchParams.get("owner"), "octo-org");
  assert.equal(result.requestUrl.searchParams.get("repo"), "awesome-repo");
  assert.equal(result.requestUrl.searchParams.get("pr"), "184");
  assert.equal(result.requestUrl.searchParams.get("sha"), "8f31c9a");
});

test("fails pending pull requests with the verification URL", async () => {
  const result = await runAction({
    status: {
      verified: false,
      verification_url: "https://captcha.example.test/gate/gate-1?token=abc123",
    },
  });

  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.logs, []);
  assert.deepEqual(result.errors, [
    "::error::Human verification required before expensive CI can run: https://captcha.example.test/gate/gate-1?token=abc123",
  ]);
});

test("fails pending pull requests when the Worker has no gate yet", async () => {
  const result = await runAction({
    status: {
      verified: false,
      verification_url: null,
    },
  });

  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.logs, []);
  assert.deepEqual(result.errors, [
    "::error::Human verification required, but pr-captcha has not created a gate for this SHA yet.",
  ]);
});

test("skips non pull request events", async () => {
  const result = await runAction({
    event: {
      repository: {
        name: "awesome-repo",
        owner: {
          login: "octo-org",
        },
      },
    },
    status: {
      verified: false,
      verification_url: "https://captcha.example.test/gate/gate-1?token=abc123",
    },
  });

  assert.equal(result.exitCode, undefined);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.logs, [
    "No pull request context found. pr-captcha gate is not required.",
  ]);
  assert.equal(result.requestUrl, undefined);
});

test("reads hyphenated GitHub Action input environment variables", async () => {
  const result = await runAction({
    inputEnv: {
      "INPUT_API-URL": "https://hyphen.example.test/",
    },
    status: {
      verified: true,
      skipped: true,
    },
  });

  assert.equal(result.exitCode, undefined);
  assert.equal(result.requestUrl.origin, "https://hyphen.example.test");
});

test("logs verifier metadata for solved gates", async () => {
  const result = await runAction({
    status: {
      verified: true,
      solver_login: "some-user",
      captcha_passed_at: "2026-06-14T00:00:00.000Z",
    },
  });

  assert.equal(result.exitCode, undefined);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.logs, [
    "pr-captcha verified by some-user at 2026-06-14T00:00:00.000Z.",
  ]);
});

test("logs a clean solved message when metadata is missing", async () => {
  const result = await runAction({
    status: {
      verified: true,
    },
  });

  assert.equal(result.exitCode, undefined);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.logs, [
    "pr-captcha human verification is recorded for this pull request SHA.",
  ]);
});

test("rejects malformed successful status responses", async () => {
  await assert.rejects(
    () =>
      runAction({
        status: {
          verified: "yes",
        },
      }),
    /pr-captcha status response is invalid/,
  );
});

test("surfaces failed status response errors", async () => {
  await assert.rejects(
    () =>
      runAction({
        httpStatus: 403,
        status: {
          verified: false,
          error: "Installation is not allowed",
        },
      }),
    /Installation is not allowed/,
  );
});

test("rejects successful non-JSON status responses", async () => {
  await assert.rejects(
    () =>
      runAction({
        response: new Response("not json", {
          headers: {
            "content-type": "text/plain",
          },
        }),
      }),
    /pr-captcha status response is invalid/,
  );
});

test("rejects malformed pull request event payloads", async () => {
  await assert.rejects(
    () =>
      runAction({
        event: {
          repository: {
            name: "awesome-repo",
            owner: {
              login: "octo-org",
            },
          },
          pull_request: {
            number: "184",
            head: {
              sha: "8f31c9a",
            },
          },
        },
        status: {
          verified: true,
        },
      }),
    /GitHub pull request event payload is invalid/,
  );
});

async function runAction(input) {
  const previousEnv = { ...process.env };
  const previousExitCode = process.exitCode;
  const previousFetch = globalThis.fetch;
  const previousLog = console.log;
  const previousError = console.error;
  const dir = mkdtempSync(join(tmpdir(), "pr-captcha-action-"));
  const eventPath = join(dir, "event.json");
  const logs = [];
  const errors = [];
  let requestUrl;

  writeFileSync(
    eventPath,
    JSON.stringify(
      input.event ?? {
        repository: {
          name: "awesome-repo",
          owner: {
            login: "octo-org",
          },
        },
        pull_request: {
          number: 184,
          head: {
            sha: "8f31c9a",
          },
        },
      },
    ),
  );

  try {
    process.exitCode = undefined;
    process.env = {
      ...previousEnv,
      GITHUB_EVENT_PATH: eventPath,
      ...(input.inputEnv ?? {
        INPUT_API_URL: "https://captcha.example.test/",
      }),
    };
    globalThis.fetch = async (url) => {
      requestUrl = new URL(String(url));
      if (input.response) {
        return input.response;
      }
      return Response.json(input.status, { status: input.httpStatus ?? 200 });
    };
    console.log = (message) => logs.push(String(message));
    console.error = (message) => errors.push(String(message));

    const buildDir = process.env.ACTION_BUILD_DIR ?? "dist";
    const fileUrl = pathToFileURL(join(process.cwd(), buildDir, "index.js"));
    fileUrl.searchParams.set("case", crypto.randomUUID());
    const action = await import(fileUrl.href);
    await action.run();

    return {
      errors,
      exitCode: process.exitCode,
      logs,
      requestUrl,
    };
  } finally {
    process.env = previousEnv;
    process.exitCode = previousExitCode;
    globalThis.fetch = previousFetch;
    console.log = previousLog;
    console.error = previousError;
    rmSync(dir, { recursive: true, force: true });
  }
}
