import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeRepositorySlug } from "./evidence";
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
});
