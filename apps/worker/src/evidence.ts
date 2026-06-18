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

export type SpamRadarQuery = {
  key: "spam" | "invalid" | "stale";
  label: string;
  query: string;
  total_count: number | null;
};

export type SpamRadarItem = {
  repository: string;
  number: number;
  title: string;
  url: string;
  author: string;
  author_type: string;
  created_at: string;
  age_days: number;
  labels: string[];
  source: SpamRadarQuery["key"];
  reasons: string[];
};

export type SpamRadarRepositoryCluster = {
  repository: string;
  sample_size: number;
  top_signal: SpamRadarQuery["key"];
  spam_items: number;
  invalid_items: number;
  stale_items: number;
  latest_pr_url: string;
  latest_pr_title: string;
  latest_pr_number: number;
};

export type SpamRadar = {
  generated_at: string;
  live: boolean;
  partial: boolean;
  errors: string[];
  queries: SpamRadarQuery[];
  sample_size: number;
  repositories: number;
  spam_label_matches: number | null;
  invalid_label_matches: number | null;
  stale_label_matches: number | null;
  recommendation: string;
  items: SpamRadarItem[];
  repository_clusters: SpamRadarRepositoryCluster[];
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

type GitHubSearchIssue = {
  number?: unknown;
  title?: unknown;
  html_url?: unknown;
  created_at?: unknown;
  repository_url?: unknown;
  labels?: Array<{
    name?: unknown;
  }>;
  user?: {
    login?: unknown;
    type?: unknown;
  } | null;
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

export async function fetchSpamRadar(now = new Date()): Promise<SpamRadar> {
  const errors: string[] = [];
  const querySpecs: Array<Omit<SpamRadarQuery, "total_count">> = [
    {
      key: "spam",
      label: "Spam labels",
      query: "is:pr is:open label:spam archived:false",
    },
    {
      key: "invalid",
      label: "Invalid labels",
      query: "is:pr is:open label:invalid archived:false",
    },
    {
      key: "stale",
      label: "Stale labels",
      query: "is:pr is:open label:stale archived:false",
    },
  ];
  const results = await Promise.all(
    querySpecs.map(async (spec) => {
      try {
        const result = await fetchRadarSearch(spec, now);
        return { spec, result };
      } catch (error) {
        errors.push(`${spec.label}: ${errorMessage(error)}`);
        return {
          spec,
          result: {
            total_count: null,
            items: [] as SpamRadarItem[],
          },
        };
      }
    }),
  );
  const itemsByUrl = new Map<string, SpamRadarItem>();
  const queries = results.map(({ spec, result }) => {
    for (const item of result.items) {
      if (!itemsByUrl.has(item.url)) {
        itemsByUrl.set(item.url, item);
      }
    }
    return {
      ...spec,
      total_count: result.total_count,
    };
  });
  const items = Array.from(itemsByUrl.values()).slice(0, 24);
  const repositoryClusters = radarRepositoryClusters(items);
  const repositories = new Set(items.map((item) => item.repository)).size;
  const spamLabelMatches =
    queries.find((query) => query.key === "spam")?.total_count ?? null;
  const invalidLabelMatches =
    queries.find((query) => query.key === "invalid")?.total_count ?? null;
  const staleLabelMatches =
    queries.find((query) => query.key === "stale")?.total_count ?? null;
  return {
    generated_at: now.toISOString(),
    live: results.some(({ result }) => result.total_count !== null),
    partial: errors.length > 0,
    errors,
    queries,
    sample_size: items.length,
    repositories,
    spam_label_matches: spamLabelMatches,
    invalid_label_matches: invalidLabelMatches,
    stale_label_matches: staleLabelMatches,
    recommendation: radarRecommendation({
      spamLabelMatches,
      invalidLabelMatches,
      staleLabelMatches,
      sampleSize: items.length,
      repositories,
    }),
    items,
    repository_clusters: repositoryClusters,
  };
}

async function fetchRadarSearch(
  spec: Omit<SpamRadarQuery, "total_count">,
  now: Date,
): Promise<{ total_count: number | null; items: SpamRadarItem[] }> {
  const response = await githubFetch(
    `https://api.github.com/search/issues?q=${encodeURIComponent(spec.query)}&per_page=12&sort=created&order=desc`,
  );
  const payload = (await response.json()) as GitHubSearchResponse;
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  return {
    total_count:
      typeof payload.total_count === "number" ? payload.total_count : null,
    items: rawItems
      .map((item) =>
        radarItemFromGitHubIssue(item as GitHubSearchIssue, spec.key, now),
      )
      .filter((item): item is SpamRadarItem => Boolean(item)),
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

function radarItemFromGitHubIssue(
  issue: GitHubSearchIssue,
  source: SpamRadarQuery["key"],
  now: Date,
): SpamRadarItem | null {
  if (
    typeof issue.number !== "number" ||
    typeof issue.title !== "string" ||
    typeof issue.html_url !== "string" ||
    typeof issue.created_at !== "string"
  ) {
    return null;
  }
  const repository =
    typeof issue.repository_url === "string"
      ? repositoryFromApiUrl(issue.repository_url)
      : null;
  if (!repository) {
    return null;
  }
  const createdAt = Date.parse(issue.created_at);
  const ageDays = Number.isFinite(createdAt)
    ? Math.max(0, Math.floor((now.getTime() - createdAt) / 86_400_000))
    : 0;
  const labels = Array.isArray(issue.labels)
    ? issue.labels
        .map((label) => label.name)
        .filter((label): label is string => typeof label === "string")
    : [];
  return {
    repository,
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    author:
      typeof issue.user?.login === "string" ? issue.user.login : "unknown",
    author_type:
      typeof issue.user?.type === "string" ? issue.user.type : "Unknown",
    created_at: issue.created_at,
    age_days: ageDays,
    labels,
    source,
    reasons: radarReasons(source, labels, ageDays, issue.user?.type),
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

function radarReasons(
  source: SpamRadarQuery["key"],
  labels: string[],
  ageDays: number,
  userType: unknown,
): string[] {
  const normalized = labels.map((label) => label.toLowerCase());
  const reasons: string[] = [];
  if (source === "spam" || normalized.includes("spam")) {
    reasons.push("spam label");
  }
  if (source === "invalid" || normalized.includes("invalid")) {
    reasons.push("invalid label");
  }
  if (source === "stale" || ageDays >= 30) {
    reasons.push(`${ageDays}d open`);
  }
  if (userType === "Bot") {
    reasons.push("bot author");
  }
  return reasons.length > 0 ? reasons : ["public search match"];
}

function radarRepositoryClusters(
  items: SpamRadarItem[],
): SpamRadarRepositoryCluster[] {
  const clusters = new Map<
    string,
    {
      repository: string;
      sample_size: number;
      spam_items: number;
      invalid_items: number;
      stale_items: number;
      latest: SpamRadarItem;
    }
  >();
  for (const item of items) {
    const cluster = clusters.get(item.repository);
    if (!cluster) {
      clusters.set(item.repository, {
        repository: item.repository,
        sample_size: 1,
        spam_items: item.source === "spam" ? 1 : 0,
        invalid_items: item.source === "invalid" ? 1 : 0,
        stale_items: item.source === "stale" ? 1 : 0,
        latest: item,
      });
      continue;
    }
    cluster.sample_size += 1;
    if (item.source === "spam") {
      cluster.spam_items += 1;
    } else if (item.source === "invalid") {
      cluster.invalid_items += 1;
    } else {
      cluster.stale_items += 1;
    }
    if (Date.parse(item.created_at) > Date.parse(cluster.latest.created_at)) {
      cluster.latest = item;
    }
  }
  return Array.from(clusters.values())
    .map((cluster) => {
      const topSignal = topRadarSignal(cluster);
      return {
        repository: cluster.repository,
        sample_size: cluster.sample_size,
        top_signal: topSignal,
        spam_items: cluster.spam_items,
        invalid_items: cluster.invalid_items,
        stale_items: cluster.stale_items,
        latest_pr_url: cluster.latest.url,
        latest_pr_title: cluster.latest.title,
        latest_pr_number: cluster.latest.number,
      };
    })
    .sort((a, b) => {
      const severityDelta =
        radarSignalWeight(b.top_signal) - radarSignalWeight(a.top_signal);
      if (severityDelta !== 0) {
        return severityDelta;
      }
      return b.sample_size - a.sample_size;
    })
    .slice(0, 8);
}

function topRadarSignal(input: {
  spam_items: number;
  invalid_items: number;
  stale_items: number;
}): SpamRadarQuery["key"] {
  if (
    input.spam_items >= input.invalid_items &&
    input.spam_items >= input.stale_items
  ) {
    return "spam";
  }
  if (input.invalid_items >= input.stale_items) {
    return "invalid";
  }
  return "stale";
}

function radarSignalWeight(source: SpamRadarQuery["key"]): number {
  return source === "spam" ? 3 : source === "invalid" ? 2 : 1;
}

function radarRecommendation(input: {
  spamLabelMatches: number | null;
  invalidLabelMatches: number | null;
  staleLabelMatches: number | null;
  sampleSize: number;
  repositories: number;
}): string {
  const labelMatches =
    (input.spamLabelMatches ?? 0) + (input.invalidLabelMatches ?? 0);
  if (labelMatches >= 25 || input.repositories >= 10) {
    return "Open-source maintainers are already labeling PR intake noise. Start pr-captcha in hybrid mode for fork, outside, bot, and first-time contributor PRs.";
  }
  if (labelMatches > 0 || input.sampleSize > 0) {
    return "Use the radar as proof, then scan your repository and gate the pull request targets creating maintainer queue pressure.";
  }
  if ((input.staleLabelMatches ?? 0) > 0) {
    return "Stale PR labels are visible even without spam labels. Scan your repository before enabling a required check.";
  }
  return "GitHub public search did not return strong spam-label evidence right now. Scan your own repository for fork and author pressure.";
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
    return "Install pr-captcha on fork and outside contributor PRs first, then require pr-captcha/human before expensive CI.";
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

function repositoryFromApiUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() !== "api.github.com") {
      return null;
    }
    const match = url.pathname.match(/^\/repos\/([^/]+)\/([^/]+)$/);
    if (!match) {
      return null;
    }
    const owner = decodeURIComponent(match[1] ?? "");
    const repo = decodeURIComponent(match[2] ?? "");
    if (!validSlugPart(owner) || !validSlugPart(repo)) {
      return null;
    }
    return `${owner}/${repo}`;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "GitHub evidence failed";
}
