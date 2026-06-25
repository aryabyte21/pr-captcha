import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSpamRadar, normalizeRepositorySlug } from "./evidence";
import { app } from "./index";

type EvidenceResponse = {
  repository: string;
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
  risk_level: "low" | "medium" | "high";
  recommendation: string;
  pulls: Array<{
    number: number;
    title: string;
    author: string;
    is_fork: boolean;
    is_bot: boolean;
    age_days: number;
  }>;
};

type SpamRadarResponse = {
  live: boolean;
  partial: boolean;
  errors: string[];
  sample_size: number;
  repositories: number;
  spam_label_matches: number | null;
  invalid_label_matches: number | null;
  stale_label_matches: number | null;
  recommendation: string;
  items: Array<{
    repository: string;
    number: number;
    title: string;
    author: string;
    age_days: number;
    labels: string[];
    reasons: string[];
  }>;
  repository_clusters: Array<{
    repository: string;
    sample_size: number;
    top_signal: "spam" | "invalid" | "stale";
  }>;
};

describe("public repo evidence", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("normalizes GitHub repository inputs", () => {
    expect(normalizeRepositorySlug("godotengine/godot")).toBe(
      "godotengine/godot",
    );
    expect(
      normalizeRepositorySlug("https://github.com/tldraw/tldraw/pulls"),
    ).toBe("tldraw/tldraw");
    expect(
      normalizeRepositorySlug("git@github.com:freeCodeCamp/freeCodeCamp.git"),
    ).toBe("freeCodeCamp/freeCodeCamp");
    expect(normalizeRepositorySlug("https://example.com/nope/repo")).toBeNull();
    expect(normalizeRepositorySlug("owner")).toBeNull();
  });

  it("returns live repo evidence with computed queue risk", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T00:00:00.000Z"));
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (
        url.pathname === "/repos/godotengine/godot/pulls" &&
        url.searchParams.get("per_page") === "1"
      ) {
        return Response.json([], {
          headers: {
            Link: '<https://api.github.com/repos/godotengine/godot/pulls?state=open&per_page=1&page=521>; rel="last"',
          },
        });
      }
      if (
        url.pathname === "/repos/godotengine/godot/pulls" &&
        url.searchParams.get("per_page") === "30"
      ) {
        return Response.json([
          {
            number: 98,
            title: "Hardened Juice Shop for AI pentest benchmarks",
            html_url: "https://github.com/godotengine/godot/pull/98",
            created_at: "2026-06-01T00:00:00.000Z",
            author_association: "NONE",
            user: { login: "new-user", type: "User" },
            head: {
              repo: { full_name: "new-user/godot", fork: true },
            },
            labels: [{ name: "invalid" }, { name: "spam" }],
          },
          {
            number: 97,
            title: "Fix editor crash",
            html_url: "https://github.com/godotengine/godot/pull/97",
            created_at: "2026-06-17T00:00:00.000Z",
            author_association: "MEMBER",
            user: { login: "maintainer", type: "User" },
            head: {
              repo: { full_name: "godotengine/godot", fork: false },
            },
            labels: [],
          },
          {
            number: 96,
            title: "fix contribution 10",
            html_url: "https://github.com/godotengine/godot/pull/96",
            created_at: "2026-06-18T00:00:00.000Z",
            author_association: "NONE",
            user: { login: "ci-helper[bot]", type: "Bot" },
            head: {
              repo: { full_name: "ci-helper/godot", fork: true },
            },
            labels: [],
          },
        ]);
      }
      if (url.pathname === "/search/issues") {
        const q = url.searchParams.get("q") ?? "";
        if (q.includes("label:spam")) {
          return Response.json({ total_count: 3 });
        }
        if (q.includes("label:invalid")) {
          return Response.json({ total_count: 8 });
        }
      }
      throw new Error(`Unexpected request: ${url.href}`);
    });

    const response = await app.request(
      "/api/public/repo-evidence?repo=godotengine/godot",
    );
    const body = (await response.json()) as EvidenceResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("max-age=300");
    expect(body).toMatchObject({
      repository: "godotengine/godot",
      live: true,
      partial: false,
      open_pull_requests: 521,
      sample_size: 3,
      fork_pull_requests: 2,
      unknown_authors: 2,
      external_authors: 2,
      bot_pull_requests: 1,
      stale_pull_requests: 1,
      spam_label_matches: 3,
      invalid_label_matches: 8,
      risk_level: "high",
    });
    expect(body.recommendation).toContain("fork and outside contributor PRs");
    expect(body.pulls[0]).toMatchObject({
      number: 98,
      author: "new-user",
      is_fork: true,
      is_bot: false,
      age_days: 17,
    });
  });

  it("returns partial evidence when GitHub limits public requests", async () => {
    vi.stubGlobal("fetch", async () => {
      return new Response("rate limited", { status: 403 });
    });

    const response = await app.request(
      "/api/public/repo-evidence?repo=kubernetes/kubernetes",
    );
    const body = (await response.json()) as EvidenceResponse;

    expect(response.status).toBe(200);
    expect(body.live).toBe(false);
    expect(body.partial).toBe(true);
    expect(body.open_pull_requests).toBeNull();
    expect(body.sample_size).toBe(0);
    expect(body.errors.length).toBeGreaterThan(0);
  });

  it("rejects malformed repository inputs", async () => {
    const response = await app.request("/api/public/repo-evidence?repo=owner");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid GitHub repository",
    });
  });

  it("returns a live cross-repository spam radar", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T00:00:00.000Z"));
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/search/issues");
      const q = url.searchParams.get("q") ?? "";
      if (q.includes("label:spam")) {
        return Response.json({
          total_count: 12,
          items: [
            searchIssue({
              repository: "owner-a/repo-a",
              number: 11,
              title: "Add SEO generated content",
              label: "spam",
              createdAt: "2026-06-01T00:00:00.000Z",
            }),
          ],
        });
      }
      if (q.includes("label:invalid")) {
        return Response.json({
          total_count: 8,
          items: [
            searchIssue({
              repository: "owner-b/repo-b",
              number: 22,
              title: "fix everything",
              label: "invalid",
              createdAt: "2026-06-10T00:00:00.000Z",
            }),
          ],
        });
      }
      if (q.includes("label:stale")) {
        return Response.json({
          total_count: 180,
          items: [
            searchIssue({
              repository: "owner-c/repo-c",
              number: 33,
              title: "drive-by patch",
              label: "needs-triage",
              createdAt: "2026-05-01T00:00:00.000Z",
            }),
          ],
        });
      }
      throw new Error(`Unexpected radar request: ${url.href}`);
    });

    const radar = await fetchSpamRadar();

    expect(radar).toMatchObject({
      live: true,
      partial: false,
      sample_size: 3,
      repositories: 3,
      spam_label_matches: 12,
      invalid_label_matches: 8,
      stale_label_matches: 180,
    });
    expect(radar.recommendation).toContain("scan your repository");
    expect(radar.items[0]).toMatchObject({
      repository: "owner-a/repo-a",
      number: 11,
      author: "drive-by-user",
      age_days: 17,
      reasons: ["spam label"],
    });
    expect(radar.repository_clusters).toEqual([
      expect.objectContaining({
        repository: "owner-a/repo-a",
        sample_size: 1,
        top_signal: "spam",
        spam_items: 1,
        latest_pr_number: 11,
      }),
      expect.objectContaining({
        repository: "owner-b/repo-b",
        sample_size: 1,
        top_signal: "invalid",
        invalid_items: 1,
        latest_pr_number: 22,
      }),
      expect.objectContaining({
        repository: "owner-c/repo-c",
        sample_size: 1,
        top_signal: "stale",
        stale_items: 1,
        latest_pr_number: 33,
      }),
    ]);
  });

  it("serves the public spam radar API with cache headers", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T00:00:00.000Z"));
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const q = url.searchParams.get("q") ?? "";
      return Response.json({
        total_count: q.includes("label:spam") ? 2 : 0,
        items: q.includes("label:spam")
          ? [
              searchIssue({
                repository: "octo-org/noisy-repo",
                number: 44,
                title: "please merge now",
                label: "spam",
                createdAt: "2026-06-17T00:00:00.000Z",
              }),
            ]
          : [],
      });
    });

    const response = await app.request("/api/public/spam-radar");
    const body = (await response.json()) as SpamRadarResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("max-age=300");
    expect(body.live).toBe(true);
    expect(body.sample_size).toBe(1);
    expect(body.items[0]).toMatchObject({
      repository: "octo-org/noisy-repo",
      title: "please merge now",
    });
    expect(body.repository_clusters[0]).toMatchObject({
      repository: "octo-org/noisy-repo",
      top_signal: "spam",
      sample_size: 1,
    });
  });
});

function searchIssue(input: {
  repository: string;
  number: number;
  title: string;
  label: string;
  createdAt: string;
}) {
  return {
    number: input.number,
    title: input.title,
    html_url: `https://github.com/${input.repository}/pull/${input.number}`,
    created_at: input.createdAt,
    repository_url: `https://api.github.com/repos/${input.repository}`,
    user: { login: "drive-by-user", type: "User" },
    labels: [{ name: input.label }],
  };
}
