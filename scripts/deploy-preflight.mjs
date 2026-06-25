import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const requiredGitHubSecrets = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
];

export const requiredWorkerSecrets = [
  "APP_BASE_URL",
  "GITHUB_APP_ID",
  "GITHUB_PRIVATE_KEY",
  "GITHUB_WEBHOOK_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "SESSION_SECRET",
];

const placeholderDatabaseIds = new Set([
  "",
  "replace-with-your-d1-database-id",
  "00000000-0000-0000-0000-000000000000",
]);

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const defaultWranglerPath = resolve(repoRoot, "apps/worker/wrangler.toml");

export async function readWranglerToml(path = defaultWranglerPath) {
  return readFile(path, "utf8");
}

export function parseD1DatabaseId(toml) {
  const match = toml.match(/^\s*database_id\s*=\s*"([^"]*)"\s*$/m);
  return match?.[1]?.trim() ?? "";
}

export function validateDeployPreflight({
  env = process.env,
  wranglerToml,
} = {}) {
  const missingGitHubSecrets = requiredGitHubSecrets.filter(
    (name) => !String(env[name] ?? "").trim(),
  );
  const databaseId = parseD1DatabaseId(wranglerToml ?? "");
  const problems = [];

  if (missingGitHubSecrets.length) {
    problems.push({
      heading: "Missing GitHub Actions secrets",
      items: missingGitHubSecrets,
    });
  }

  if (placeholderDatabaseIds.has(databaseId)) {
    problems.push({
      heading: "D1 database id is not configured",
      items: [
        databaseId
          ? `apps/worker/wrangler.toml database_id is ${databaseId}`
          : "apps/worker/wrangler.toml has no database_id",
      ],
    });
  }

  return {
    ok: problems.length === 0,
    missingGitHubSecrets,
    databaseId,
    requiredWorkerSecrets,
    problems,
  };
}

export function formatDeployPreflight(result) {
  const lines = result.ok
    ? ["pr-captcha deploy preflight passed."]
    : ["pr-captcha deploy preflight failed."];

  for (const problem of result.problems) {
    lines.push("", problem.heading + ":");
    for (const item of problem.items) {
      lines.push(`- ${item}`);
    }
  }

  lines.push(
    "",
    "GitHub repository secrets required by .github/workflows/worker-deploy.yml:",
  );
  for (const name of requiredGitHubSecrets) {
    lines.push(`- ${name}`);
  }

  lines.push("", "Worker runtime secrets that /health/ready verifies:");
  for (const name of requiredWorkerSecrets) {
    lines.push(`- ${name}`);
  }

  if (!result.ok) {
    lines.push(
      "",
      "Fix:",
      "- Add the missing repository secrets under Settings > Secrets and variables > Actions.",
      "- Run npx wrangler d1 create pr-captcha and copy the database_id into apps/worker/wrangler.toml.",
      "- Store Worker runtime values with npx wrangler secret put before public traffic.",
      '- After deploy, run curl -fsS "$APP_BASE_URL/health/ready".',
    );
  }

  return lines.join("\n");
}

async function main() {
  const wranglerToml = await readWranglerToml();
  const result = validateDeployPreflight({ wranglerToml });
  console.log(formatDeployPreflight(result));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
