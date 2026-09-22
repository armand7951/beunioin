import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("src/styles/article.css", "utf8");
const indexCss = readFileSync("src/index.css", "utf8");
const blog = readFileSync("src/components/Blog.tsx", "utf8");
const toc = readFileSync("src/components/ArticleToc.tsx", "utf8");
const crumbs = readFileSync("src/components/Breadcrumbs.tsx", "utf8");
const articleHtml = readFileSync("src/lib/articleHtml.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

// 文章頁原本掛 prose class，但 @tailwindcss/typography 根本沒裝，而 Tailwind v4 的
// preflight 又把標題字級與清單符號歸零，內文等於完全沒排版。改成自己寫的
// .article-body，前台與後台編輯器共用同一份。
test("the shared article stylesheet covers every block the editor can produce", () => {
  assert.ok(existsSync("src/styles/article.css"));
  for (const selector of [
    ".article-body h2",
    ".article-body h3",
    "table",
    "th",
    "figure",
    "figcaption",
    "[data-callout=",
    "hr",
    "scroll-margin-top",
    "overflow-x: auto",
    "is-editor-empty",
    "selectedCell",
    "tableWrapper",
  ]) {
    assert.ok(css.includes(selector), `article.css 缺少 ${selector}`);
  }
  // 清單符號與標題字級是 preflight 歸零的兩樣東西，一定要補回來
  assert.match(css, /\.article-body ul \{[^}]*list-style: disc/);
  assert.match(css, /\.article-body h2 \{[^}]*font-size/);
});

test("index.css pulls the article stylesheet in", () => {
  assert.ok(indexCss.includes('@import "./styles/article.css"'));
});

test("the post page renders the long-form layout", () => {
  for (const marker of [
    "article-body",
    "ArticleToc",
    "Breadcrumbs",
    "usePageMeta(",
    "prepareArticle(",
    "上一篇",
    "下一篇",
    "category=",
    "onNavigate",
  ]) {
    assert.ok(blog.includes(marker), `Blog.tsx 缺少 ${marker}`);
  }
  // 比對實際的 class 用法，不是註解裡的字
  assert.doesNotMatch(blog, /className="prose/);
  assert.doesNotMatch(blog, /navigator\.share/);
  // 上下篇切換走同一個元件，換 id 時要先清掉舊文
  assert.match(blog, /setPost\(null\)/);
});

// 列表頁的分類記在 ?category=，從內頁的麵包屑點分類回來要停在同一個分類。
test("the list restores its category from the query string", () => {
  assert.match(blog, /searchParams|URLSearchParams\(window\.location\.search\)/);
  assert.match(blog, /history\.replaceState\(/);
});

test("the table of contents is collapsible and scrolls smoothly", () => {
  assert.match(toc, /aria-expanded=/);
  assert.match(toc, /aria-controls=/);
  assert.ok(toc.includes("scrollIntoView("));
  assert.ok(toc.includes("本文目錄"));
  assert.match(toc, /prefers-reduced-motion/);
});

test("breadcrumbs are a labelled nav with the current page marked", () => {
  assert.ok(crumbs.includes('aria-label="麵包屑"'));
  assert.ok(crumbs.includes('aria-current={last ? "page" : undefined}') || crumbs.includes('aria-current="page"'));
});

// 淨化、外連 noopener、圖片懶載、表格可捲：四樣都在渲染前做完。
test("article html is sanitised and hardened before it reaches the DOM", () => {
  assert.ok(articleHtml.includes("DOMPurify.sanitize("));
  assert.ok(articleHtml.includes("ADD_ATTR"));
  assert.ok(articleHtml.includes("table-scroll"));
  assert.match(articleHtml, /setAttribute\("loading", "lazy"\)/);
  assert.ok(articleHtml.includes("noopener"));
});

// App 把 handleNavigation 交給文章頁，麵包屑與上下篇才有辦法換頁。
test("App hands navigation to the post page", () => {
  // 屬性裡有箭頭函式的 =>，不能用 [^>] 截；非貪婪找到第一個 /> 為止
  const tag = app.match(/<BlogPost[\s\S]*?\/>/)?.[0] ?? "";
  assert.ok(tag.includes("onNavigate={handleNavigation}"), `找不到 onNavigate：${tag}`);
});
