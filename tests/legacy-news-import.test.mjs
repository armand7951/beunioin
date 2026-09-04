import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const dataPath = "src/data/news.ts";
const newsBoard = readFileSync("src/components/NewsBoard.tsx", "utf8");

test("the two approved legacy articles are included", () => {
  assert.equal(existsSync(dataPath), true, "local news data must exist");
  const data = readFileSync(dataPath, "utf8");

  assert.match(data, /刺蝟飼養全指南/);
  assert.match(data, /2025國際同伴動物日/);
});

test("the excluded shop article is not imported", () => {
  const data = readFileSync(dataPath, "utf8");
  assert.doesNotMatch(data, /椰奶雜貨[鋪舖]/);
});

test("all imported images are local and exist", () => {
  const data = readFileSync(dataPath, "utf8");
  const imagePaths = [...data.matchAll(/["']?imageUrl["']?\s*:\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.ok(imagePaths.length >= 10, "article and gallery images are expected");
  for (const imagePath of imagePaths) {
    assert.match(imagePath, /^\/news\//);
    assert.equal(existsSync(`public${imagePath}`), true, imagePath);
  }
});

// 這幾篇文章已經匯入 posts 表，後台可以編輯與刪除。公佈欄因此改讀 /api/posts，
// 並且**不再**跟打包進 bundle 的 IMPORTED_NEWS 合併 —— 合併會讓後台刪掉的文章
// 又從靜態備份冒出來。原本的 /api/news 從來沒被移植成 serverless function，
// 在正式站一直是 404。
test("the news board reads posts from the database with no bundled fallback", () => {
  assert.match(newsBoard, /fetch\("\/api\/posts"\)/);
  assert.doesNotMatch(newsBoard, /fetch\("\/api\/news"\)/);
  assert.doesNotMatch(newsBoard, /IMPORTED_NEWS/);
  assert.doesNotMatch(newsBoard, /mergeNews/);
});

// 點文章要進到該文章的頁面，不是開彈窗。
test("the news board navigates to the article instead of opening a modal", () => {
  assert.match(newsBoard, /onOpenPost/);
  assert.doesNotMatch(newsBoard, /setSelectedItem/);
  assert.doesNotMatch(newsBoard, /fixed inset-0/);
});
