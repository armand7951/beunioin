// 前台是 SPA，usePageMeta 要等瀏覽器跑完 JS 才改得到 <head>；LINE／Facebook 的
// 預覽抓取器不跑 JS，所以單篇頁面的 meta 必須在伺服器端就寫進 HTML。
// 這裡拿真的 index.html 當輸入，確保注入後每一個分享用標籤都換成該篇專屬的值。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { injectPageMeta, escapeAttribute, toDescription } from "../api/_lib/page-meta.js";

const shell = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const META = {
  title: "測試標題｜台灣環境生態護育產業工會",
  description: "這是一篇測試文章的摘要。",
  url: "https://beunion.tw/blog/test-slug",
  image: "https://example.com/cover.webp",
  type: "article" as const,
};

test("every shared tag is replaced with the page's own value", () => {
  const html = injectPageMeta(shell, META);

  assert.match(html, /<title>測試標題｜台灣環境生態護育產業工會<\/title>/);
  for (const attr of ['name="title"', 'name="description"', 'property="og:title"',
                      'property="og:description"', 'property="og:url"', 'property="og:image"',
                      'property="twitter:title"', 'property="twitter:description"',
                      'property="twitter:url"', 'property="twitter:image"']) {
    const m = html.match(new RegExp(`<meta ${attr} content="([^"]*)"`));
    assert.ok(m, `${attr} 不見了`);
    assert.ok(
      [META.title, META.description, META.url, META.image].includes(m[1]),
      `${attr} 還是站台預設值：${m[1]}`,
    );
  }
  assert.match(html, /<link rel="canonical" href="https:\/\/beunion\.tw\/blog\/test-slug"/);
  assert.match(html, /<meta property="og:type" content="article"/);
});

test("the shell keeps everything the page still needs", () => {
  const html = injectPageMeta(shell, META);
  // 驗證碼掉了 Search Console 會判定驗證失效；root 與資產標籤掉了整頁白畫面。
  assert.match(html, /name="google-site-verification"/);
  assert.match(html, /<div id="root">/);
  assert.equal(html.match(/<script type="module"/g)?.length, 1);
  assert.equal(html.length > shell.length - 500, true);
});

test("quotes and angle brackets in a title cannot break out of the attribute", () => {
  const html = injectPageMeta(shell, { ...META, title: 'a"b<c>d&e' });
  assert.match(html, /<meta name="title" content="a&quot;b&lt;c&gt;d&amp;e"/);
  assert.doesNotMatch(html, /content="a"b/);
  assert.equal(escapeAttribute('"'), "&quot;");
});

test("descriptions are flattened, stripped of tags and capped", () => {
  assert.equal(toDescription("<p>一段\n摘要</p>", "預設"), "一段 摘要");
  assert.equal(toDescription("   ", "預設"), "預設");
  const long = toDescription("字".repeat(400), "預設");
  assert.equal(long.length, 160);
  assert.ok(long.endsWith("…"));
});

test("the detail routes are served by the meta function, list routes are not", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const find = (source: string) =>
    config.rewrites.find((r: { source: string }) => r.source === source)?.destination;

  assert.equal(find("/blog/:slug"), "/api/page?type=blog&slug=:slug");
  assert.equal(find("/events/:slug"), "/api/page?type=events&slug=:slug");
  assert.equal(find("/courses/:slug"), "/api/page?type=courses&slug=:slug");
  // 列表頁沒有單篇 meta 可注入，照舊走靜態外殼才不會白白多一次函式呼叫。
  assert.equal(find("/blog"), "/index.html");
  // /learn 是上課教室，本來就 noindex，不需要分享卡。
  assert.equal(find("/learn/:slug"), "/index.html");
});
