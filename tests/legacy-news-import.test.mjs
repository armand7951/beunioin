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

test("the news board merges local imports with managed news and renders images", () => {
  assert.match(newsBoard, /from "\.\.\/data\/news"/);
  assert.match(newsBoard, /IMPORTED_NEWS/);
  assert.match(newsBoard, /fetch\("\/api\/news"\)/);
  assert.match(newsBoard, /mergeNews/);
  assert.match(newsBoard, /block\.type === "image"/);
});
