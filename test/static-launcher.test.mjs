import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const html = await readFile(
  new URL("../docs/index.html", import.meta.url),
  "utf8",
);
const robots = await readFile(
  new URL("../docs/robots.txt", import.meta.url),
  "utf8",
);
const sitemap = await readFile(
  new URL("../docs/sitemap.xml", import.meta.url),
  "utf8",
);
const securityTxt = await readFile(
  new URL("../docs/.well-known/security.txt", import.meta.url),
  "utf8",
);

test("static launcher can produce shareable repo links", () => {
  assert.match(html, /data-share-copy/);
  assert.match(html, /function launcherLink\(repo, base\)/);
  assert.match(html, /url\.searchParams\.set\("repo", repo\)/);
  assert.match(html, /url\.searchParams\.set\("worker_url", base\)/);
  assert.match(html, /params\.get\("repo"\)/);
  assert.match(html, /params\.get\("worker_url"\)/);
});

test("static Pages front door exposes crawl and security metadata", () => {
  assert.match(
    robots,
    /Sitemap: https:\/\/aryabyte21\.github\.io\/pr-captcha\/sitemap\.xml/,
  );
  assert.match(
    sitemap,
    /<loc>https:\/\/aryabyte21\.github\.io\/pr-captcha\/<\/loc>/,
  );
  assert.match(
    sitemap,
    /<loc>https:\/\/aryabyte21\.github\.io\/pr-captcha\/setup\.md<\/loc>/,
  );
  assert.match(
    securityTxt,
    /Canonical: https:\/\/aryabyte21\.github\.io\/pr-captcha\/\.well-known\/security\.txt/,
  );
  assert.match(
    securityTxt,
    /Policy: https:\/\/aryabyte21\.github\.io\/pr-captcha\/security\.md/,
  );
});
