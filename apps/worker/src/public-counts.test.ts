import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "./index";

type CountResponse = {
  as_of: string;
  repos: Array<{
    repo: string;
    open_prs: number;
    live: boolean;
  }>;
};

describe("public PR counts", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("falls back to snapshots when GitHub is unavailable", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("GitHub unavailable");
    });

    const response = await app.request("/api/public/pr-counts");
    const body = (await response.json()) as CountResponse;

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("max-age=300");
    expect(body.repos).toEqual([
      { repo: "microsoft/vscode", open_prs: 2044, live: false },
      { repo: "kubernetes/kubernetes", open_prs: 926, live: false },
      { repo: "vercel/next.js", open_prs: 1900, live: false },
      { repo: "rust-lang/rust", open_prs: 1113, live: false },
    ]);
  });

  it("keeps live counts that succeed and falls back per repo", async () => {
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/repos/microsoft/vscode/pulls")) {
        return Response.json([{ number: 1 }], {
          headers: {
            Link: '<https://api.github.com/repos/microsoft/vscode/pulls?state=open&per_page=1&page=1234>; rel="last"',
          },
        });
      }
      if (url.includes("/repos/kubernetes/kubernetes/pulls")) {
        return new Response("rate limited", { status: 403 });
      }
      if (url.includes("/repos/vercel/next.js/pulls")) {
        return Response.json({ total_count: "unknown" });
      }
      throw new Error("network timeout");
    });

    const response = await app.request("/api/public/pr-counts");
    const body = (await response.json()) as CountResponse;

    expect(response.status).toBe(200);
    expect(body.repos).toEqual([
      { repo: "microsoft/vscode", open_prs: 1234, live: true },
      { repo: "kubernetes/kubernetes", open_prs: 926, live: false },
      { repo: "vercel/next.js", open_prs: 1900, live: false },
      { repo: "rust-lang/rust", open_prs: 1113, live: false },
    ]);
  });

  it("uses the response page length when GitHub omits a last-page link", async () => {
    vi.stubGlobal("fetch", async () => Response.json([]));

    const response = await app.request("/api/public/pr-counts");
    const body = (await response.json()) as CountResponse;

    expect(response.status).toBe(200);
    expect(body.repos.every((repo) => repo.live)).toBe(true);
    expect(body.repos.every((repo) => repo.open_prs === 0)).toBe(true);
  });

  it("falls back when GitHub count requests hang", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      },
    );

    const pending = app.request("/api/public/pr-counts");
    await vi.advanceTimersByTimeAsync(2500);
    const response = await pending;
    const body = (await response.json()) as CountResponse;

    expect(response.status).toBe(200);
    expect(body.repos).toEqual([
      { repo: "microsoft/vscode", open_prs: 2044, live: false },
      { repo: "kubernetes/kubernetes", open_prs: 926, live: false },
      { repo: "vercel/next.js", open_prs: 1900, live: false },
      { repo: "rust-lang/rust", open_prs: 1113, live: false },
    ]);
  });
});
