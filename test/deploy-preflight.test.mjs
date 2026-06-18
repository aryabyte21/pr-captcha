import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDeployPreflight,
  validateDeployPreflight,
} from "../scripts/deploy-preflight.mjs";

const validToml = `
name = "pr-captcha"

[[d1_databases]]
binding = "DB"
database_name = "pr-captcha"
database_id = "11111111-2222-3333-4444-555555555555"
`;

test("deploy preflight fails when Cloudflare secrets are missing", () => {
  const result = validateDeployPreflight({
    env: {},
    wranglerToml: validToml,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missingGitHubSecrets, [
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_API_TOKEN",
  ]);
  assert.match(formatDeployPreflight(result), /Missing GitHub Actions secrets/);
});

test("deploy preflight fails when wrangler still has the placeholder D1 id", () => {
  const result = validateDeployPreflight({
    env: {
      CLOUDFLARE_ACCOUNT_ID: "account",
      CLOUDFLARE_API_TOKEN: "token",
    },
    wranglerToml: `
[[d1_databases]]
binding = "DB"
database_name = "pr-captcha"
database_id = "replace-with-your-d1-database-id"
`,
  });

  assert.equal(result.ok, false);
  assert.equal(result.databaseId, "replace-with-your-d1-database-id");
  assert.match(
    formatDeployPreflight(result),
    /D1 database id is not configured/,
  );
});

test("deploy preflight passes with Cloudflare secrets and a real D1 id", () => {
  const result = validateDeployPreflight({
    env: {
      CLOUDFLARE_ACCOUNT_ID: "account",
      CLOUDFLARE_API_TOKEN: "token",
    },
    wranglerToml: validToml,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.missingGitHubSecrets, []);
  assert.equal(result.databaseId, "11111111-2222-3333-4444-555555555555");
  assert.match(formatDeployPreflight(result), /deploy preflight passed/);
});
