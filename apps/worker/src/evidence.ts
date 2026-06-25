import { fetchWithTimeout } from "./http";

const evidenceFetchTimeoutMs = 5000;
const trustedAssociations = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
const unknownAssociations = new Set([
  "NONE",
  "FIRST_TIMER",
  "FIRST_TIME_CONTRIBUTOR",
]);

export type RepoEvidencePull = {
  number: number;
  title: string;
  url: string;
  author: string;
  author_association: string;
  created_at: string;
  age_days: number;
  is_fork: boolean;
  is_bot: boolean;
  labels: string[];
};

export type RepoEvidence = {
  repository: string;
  generated_at: string;
  live: boolean;
  partial: boolean;
  errors: string[];
  open_pull_requests: number | null;
  sample_size: number;
  fork_pull_requests: number;
  unknown_authors: number;
  external_authors: number;
  bot_pull_requests: number;
  stale_pull_requests: number;
  spam_label_matches: number | null;
  invalid_label_matches: number | null;
  repeated_title_clusters: number;
  risk_level: "low" | "medium" | "high";
  recommendation: string;
  pulls: RepoEvidencePull[];
};

type GitHubPull = {
  number?: unknown;
  title?: unknown;
  html_url?: unknown;
  created_at?: unknown;
  author_association?: unknown;
  user?: {
    login?: unknown;
    type?: unknown;
  } | null;
  head?: {
    repo?: {
      full_name?: unknown;
      fork?: unknown;
    } | null;
  } | null;
  labels?: Array<{
    name?: unknown;
  }>;
};

type GitHubSearchResponse = {
  total_count?: unknown;
  items?: unknown;
};

export function normalizeRepositorySlug(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  let value = trimmed.replace(/^git@github\.com:/i, "");
  try {
    const parsed = new URL(value);
    if (parsed.hostname.toLowerCase() !== "github.com") {
      return null;
    }
    value = parsed.pathname;
  } catch {
    value = value.replace(/^https?:\/\/github\.com\//i, "");
    value = value.replace(/^github\.com\//i, "");
  }
  const path = value.split(/[?#]/, 1)[0] ?? "";
  value = path.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "");
  const parts = value.split("/");
  const owner = parts[0] ?? "";
  const repo = parts[1] ?? "";
  if (!validSlugPart(owner) || !validSlugPart(repo)) {
    return null;
  }
  return `${owner}/${repo}`;
}

export async function fetchRepoEvidence(
  repository: string,
  now = new Date(),
): Promise<RepoEvidence> {
  const errors: string[] = [];
  const [openPullRequests, pulls, spamLabels, invalidLabels] =
    await Promise.all([
      fetchOpenPullRequestCount(repository).catch((error) => {
        errors.push(errorMessage(error));
        return null;
      }),
      fetchPullSample(repository, now).catch((error) => {
        errors.push(errorMessage(error));
        return null;
      }),
      fetchSearchCount(repository, "label:spam").catch((error) => {
        errors.push(errorMessage(error));
        return null;
      }),
      fetchSearchCount(repository, "label:invalid").catch((error) => {
        errors.push(errorMessage(error));
        return null;
      }),
    ]);
  const sample = pulls ?? [];
  const stats = evidenceStats(sample);
  const live = Boolean(pulls);
  const partial = errors.length > 0;
  const riskLevel = riskLevelFor({
    openPullRequests,
    sampleSize: sample.length,
    forkPullRequests: stats.forkPullRequests,
    unknownAuthors: stats.unknownAuthors,
    stalePullRequests: stats.stalePullRequests,
    spamLabelMatches: spamLabels,
    invalidLabelMatches: invalidLabels,
  });
  return {
    repository,
    generated_at: now.toISOString(),
    live,
    partial,
    errors,
    open_pull_requests: openPullRequests,
    sample_size: sample.length,
    fork_pull_requests: stats.forkPullRequests,
    unknown_authors: stats.unknownAuthors,
    external_authors: stats.externalAuthors,
    bot_pull_requests: stats.botPullRequests,
    stale_pull_requests: stats.stalePullRequests,
    spam_label_matches: spamLabels,
    invalid_label_matches: invalidLabels,
    repeated_title_clusters: stats.repeatedTitleClusters,
    risk_level: riskLevel,
    recommendation: recommendationFor(riskLevel),
    pulls: sample,
  };
}

async function fetchPullSample(
  repository: string,
  now: Date,
): Promise<RepoEvidencePull[]> {
  const [owner, repo] = repository.split("/", 2);
  if (!owner || !repo) {
    throw new Error("GitHub repository is invalid");
  }
  const response = await githubFetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=30&sort=created&direction=desc`,
  );
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error("GitHub pull request response was invalid");
  }
  const pulls = payload
    .map((item) => pullFromGitHub(repository, item as GitHubPull, now))
    .filter((pull): pull is RepoEvidencePull => Boolean(pull));
  return pulls;
}

async function fetchOpenPullRequestCount(
  repository: string,
): Promise<number | null> {
  const [owner, repo] = repository.split("/", 2);
  if (!owner || !repo) {
    throw new Error("GitHub repository is invalid");
  }
  const response = await githubFetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=1`,
  );
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error("GitHub pull request count response was invalid");
  }
  return (
    pullCountFromLinkHeader(response.headers.get("link")) ?? payload.length
  );
}

async function fetchSearchCount(
  repository: string,
  qualifier: string,
): Promise<number | null> {
  const response = await githubFetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${repository} is:pr ${qualifier}`)}&per_page=1`,
  );
  const payload = (await response.json()) as GitHubSearchResponse;
  return typeof payload.total_count === "number" ? payload.total_count : null;
}

async function githubFetch(url: string): Promise<Response> {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "pr-captcha",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
    evidenceFetchTimeoutMs,
  );
  if (!response.ok) {
    throw new Error(`GitHub evidence request failed with ${response.status}`);
  }
  return response;
}

function pullFromGitHub(
  repository: string,
  pull: GitHubPull,
  now: Date,
): RepoEvidencePull | null {
  if (
    typeof pull.number !== "number" ||
    typeof pull.title !== "string" ||
    typeof pull.html_url !== "string" ||
    typeof pull.created_at !== "string"
  ) {
    return null;
  }
  const author =
    typeof pull.user?.login === "string" ? pull.user.login : "unknown";
  const userType = typeof pull.user?.type === "string" ? pull.user.type : "";
  const headRepo =
    typeof pull.head?.repo?.full_name === "string"
      ? pull.head.repo.full_name
      : "";
  const createdAt = Date.parse(pull.created_at);
  const ageDays = Number.isFinite(createdAt)
    ? Math.max(0, Math.floor((now.getTime() - createdAt) / 86_400_000))
    : 0;
  const labels = Array.isArray(pull.labels)
    ? pull.labels
        .map((label) => label.name)
        .filter((label): label is string => typeof label === "string")
    : [];
  return {
    number: pull.number,
    title: pull.title,
    url: pull.html_url,
    author,
    author_association:
      typeof pull.author_association === "string"
        ? pull.author_association
        : "NONE",
    created_at: pull.created_at,
    age_days: ageDays,
    is_fork:
      pull.head?.repo?.fork === true ||
      Boolean(headRepo && headRepo.toLowerCase() !== repository.toLowerCase()),
    is_bot: userType === "Bot" || author.endsWith("[bot]"),
    labels,
  };
}

function evidenceStats(pulls: RepoEvidencePull[]) {
  const repeatedTitles = new Map<string, number>();
  for (const pull of pulls) {
    const key = titleClusterKey(pull.title);
    if (key) {
      repeatedTitles.set(key, (repeatedTitles.get(key) ?? 0) + 1);
    }
  }
  return {
    forkPullRequests: pulls.filter((pull) => pull.is_fork).length,
    unknownAuthors: pulls.filter((pull) =>
      unknownAssociations.has(pull.author_association),
    ).length,
    externalAuthors: pulls.filter(
      (pull) => !trustedAssociations.has(pull.author_association),
    ).length,
    botPullRequests: pulls.filter((pull) => pull.is_bot).length,
    stalePullRequests: pulls.filter((pull) => pull.age_days >= 14).length,
    repeatedTitleClusters: Array.from(repeatedTitles.values()).filter(
      (count) => count > 1,
    ).length,
  };
}

function riskLevelFor(input: {
  openPullRequests: number | null;
  sampleSize: number;
  forkPullRequests: number;
  unknownAuthors: number;
  stalePullRequests: number;
  spamLabelMatches: number | null;
  invalidLabelMatches: number | null;
}): RepoEvidence["risk_level"] {
  const sampleRisk =
    input.sampleSize === 0
      ? 0
      : (input.forkPullRequests +
          input.unknownAuthors +
          input.stalePullRequests) /
        input.sampleSize;
  const labelPressure =
    (input.spamLabelMatches ?? 0) + (input.invalidLabelMatches ?? 0);
  if (
    (input.openPullRequests ?? 0) >= 1000 ||
    labelPressure >= 10 ||
    sampleRisk >= 0.85
  ) {
    return "high";
  }
  if (
    (input.openPullRequests ?? 0) >= 100 ||
    labelPressure > 0 ||
    sampleRisk >= 0.4
  ) {
    return "medium";
  }
  return "low";
}

function recommendationFor(riskLevel: RepoEvidence["risk_level"]): string {
  if (riskLevel === "high") {
    return "Install pr-captcha on fork and outside contributor PRs first, then require pr-captcha/human before heavy CI.";
  }
  if (riskLevel === "medium") {
    return "Start with hybrid mode for fork PRs and first-time contributors, then expand only if queue pressure persists.";
  }
  return "Use audit mode first, collect proof on incoming PRs, then promote pr-captcha/human to required when risk grows.";
}

function titleClusterKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/#[0-9]+/g, "")
    .replace(/[0-9]+/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

function pullCountFromLinkHeader(linkHeader: string | null): number | null {
  if (!linkHeader) {
    return null;
  }
  for (const part of linkHeader.split(",")) {
    if (!part.includes('rel="last"')) {
      continue;
    }
    const match = part.match(/[?&]page=(\d+)/);
    if (!match) {
      continue;
    }
    const value = Number(match[1]);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  return null;
}

function validSlugPart(value: string): boolean {
  return /^[A-Za-z0-9_.-]{1,100}$/.test(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "GitHub evidence failed";
}
