import assert from "node:assert/strict";
import test from "node:test";
import { buildSitemapXml, STATIC_PATHS } from "../api/_lib/sitemap.ts";

test("starts with the xml declaration and has a urlset root", () => {
  const xml = buildSitemapXml([{ path: "/" }]);
  assert.match(xml, /^<\?xml/);
  assert.match(xml, /<urlset/);
});

// 文章 id 可能含中文（例如「第八屆動保錄案員培訓」）。呼叫端要先自己
// encodeURIComponent 過再傳進來，這裡只驗證輸出真的是編碼後的樣子，
// 不是把中文字原封不動塞進 XML。
test("percent-encodes non-ASCII path segments", () => {
  const xml = buildSitemapXml([{ path: `/blog/${encodeURIComponent("第八屆")}` }]);
  assert.match(xml, /%E7%AC%AC/);
});

test("escapes & in <loc> as &amp;", () => {
  const xml = buildSitemapXml([{ path: "/blog/a&b" }]);
  assert.match(xml, /<loc>https:\/\/beunion\.tw\/blog\/a&amp;b<\/loc>/);
});

test("STATIC_PATHS covers exactly the six fixed pages", () => {
  assert.deepEqual(
    [...STATIC_PATHS].sort(),
    ["/", "/blog", "/courses", "/events", "/shield", "/welfare"].sort(),
  );
});

test("every static path shows up as its own <loc>", () => {
  const xml = buildSitemapXml(STATIC_PATHS.map((path) => ({ path })));
  for (const path of STATIC_PATHS) {
    assert.match(xml, new RegExp(`<loc>https://beunion\\.tw${path}</loc>`));
  }
});

test("formats lastmod as YYYY-MM-DD", () => {
  const xml = buildSitemapXml([{ path: "/blog/a", lastmod: "2026-09-10T03:24:00Z" }]);
  assert.match(xml, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
});

test("omits <lastmod> entirely when not provided", () => {
  const xml = buildSitemapXml([{ path: "/blog/a" }]);
  assert.doesNotMatch(xml, /<lastmod>/);
});
