import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const robots = readFileSync("public/robots.txt", "utf8");
const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
const analytics = readFileSync("src/lib/analytics.ts", "utf8");
const pageMeta = readFileSync("src/lib/pageMeta.ts", "utf8");
const indexHtml = readFileSync("index.html", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const mainTsx = readFileSync("src/main.tsx", "utf8");
const appTsx = readFileSync("src/App.tsx", "utf8");

// Google 要能找到 sitemap，而且不能被誤導去爬後台／會員／API 路徑。
test("robots.txt points crawlers at the sitemap and blocks private routes", () => {
  assert.match(robots, /Sitemap: https:\/\/beunion\.tw\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/admin/);
});

// /sitemap.xml 要被 rewrite 到 serverless function，且必須排在其他 SPA
// rewrite 前面，避免被更早的 catch-all 規則攔走。
test("vercel.json rewrites /sitemap.xml to the sitemap function first", () => {
  const first = vercelConfig.rewrites[0];
  assert.equal(first.source, "/sitemap.xml");
  assert.equal(first.destination, "/api/sitemap");
});

// Vercel Hobby 方案上限 12 支 function；api/sitemap.ts 上線後全站是 8 支。
test("the function count stays within the Hobby limit after adding the sitemap route", () => {
  const n = Number(
    execSync("find api -name '*.ts' -not -path '*/_lib/*' | wc -l").toString().trim(),
  );
  assert.equal(n, 8);
  assert.ok(n < 12);
});

// GA 的 measurement ID 只能來自環境變數，程式碼裡不可以寫死任何 G- 開頭的代碼
// ——不然日後要換 GA 帳號或別人 fork 這份程式碼時，會不小心把我們的 ID 帶走。
test("analytics.ts reads the GA id from env and never hardcodes one", () => {
  assert.match(analytics, /VITE_GA_MEASUREMENT_ID/);
  assert.doesNotMatch(analytics, /["'`]G-[A-Z0-9]{4,}/);
});

// index.html 只保留靜態預設值；gtag.js 一律由 analytics.ts 動態插入，沒設 ID
// 的環境（本機開發、預覽部署）才會完全不送出任何請求到 Google。
test("index.html does not load gtag.js directly", () => {
  assert.doesNotMatch(indexHtml, /googletagmanager/);
});

test(".env.example documents the GA measurement id", () => {
  assert.match(envExample, /VITE_GA_MEASUREMENT_ID/);
});

test("main.tsx wires up initAnalytics before the app renders", () => {
  assert.match(mainTsx, /initAnalytics\(\)/);
});

// pageMeta.ts 要能真的改到 title、canonical 與 description 三個欄位，
// 這是 index.html 那支寫死 canonical 能被改寫的唯一入口。
test("pageMeta.ts rewrites title, canonical and description", () => {
  assert.match(pageMeta, /document\.title/);
  assert.match(pageMeta, /rel="canonical"|canonical/);
  assert.match(pageMeta, /description/);
});

test("App.tsx wires fixed sections through usePageMeta", () => {
  assert.match(appTsx, /usePageMeta\(/);
});
