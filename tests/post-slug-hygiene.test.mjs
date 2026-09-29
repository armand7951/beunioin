// 2026-09-29：一篇文章的代碼被存成 `…guide/`（從舊站複製網址時把結尾斜線一起貼進來），
// 結果不帶斜線的網址查不到、sitemap 輸出 `…guide%2F`；而帶斜線的網址又因為
// rewrite 的 `/blog/:slug` 不吃尾斜線而 404。兩邊都補上，這裡守住不再退化。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(root + p, "utf8");

test("the admin post endpoint strips slashes and spaces out of the slug", () => {
  const source = read("api/_lib/admin/posts.ts");
  // 送進 RPC 的必須是清洗過的變數，不能再是原始的 body.id
  assert.match(source, /p_id:\s*id,/);
  assert.match(source, /replace\(\/\[\/\\\\\\s\]\+\/g/);
  assert.doesNotMatch(source, /p_id:\s*str\(body\.id\)/);
  // 清洗後變空字串要擋下來，不能讓沒有代碼的文章進 DB
  assert.match(source, /文章代碼不能空白/);
});

test("urls with a trailing slash redirect instead of 404ing", () => {
  const config = JSON.parse(read("vercel.json"));
  // Vercel 的 trailingSlash:false 會把 /blog/x/ 308 到 /blog/x，
  // 否則 rewrite 的 /blog/:slug 比對不到帶尾斜線的路徑，整頁 404。
  assert.equal(config.trailingSlash, false);
  // 既有的轉址與 rewrite 不能因此被動到
  assert.ok(config.redirects.length >= 22);
  assert.ok(config.rewrites.some((r) => r.source === "/blog/:slug"));
});
