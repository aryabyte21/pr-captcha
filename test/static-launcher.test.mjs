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

test("static Pages front door only redirects to the hosted Worker", () => {
  assert.match(
    html,
    /http-equiv="refresh"\s+content="0; url=https:\/\/pr-captcha\.aryaabyte\.workers\.dev\/"/,
  );
  assert.match(
    html,
    /window\.location\.replace\("https:\/\/pr-captcha\.aryaabyte\.workers\.dev\/"\)/,
  );
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/pr-captcha\.aryaabyte\.workers\.dev\/" \/>/,
  );
  assert.doesNotMatch(html, /data-share-copy/);
  assert.doesNotMatch(html, /function launcherLink/);
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
