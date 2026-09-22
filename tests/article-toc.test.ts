import assert from "node:assert/strict";
import test from "node:test";
import { buildToc, headingId } from "../src/lib/articleToc.ts";

// 目錄編號：h2 是「1.」「2.」，h3 掛在前一個 h2 底下成「1.1」「1.2」。
test("numbers h2 as sections and h3 as subsections", () => {
  const toc = buildToc([
    { level: 2, text: "習性", id: "習性" },
    { level: 3, text: "作息", id: "作息" },
    { level: 3, text: "個性", id: "個性" },
    { level: 2, text: "花費", id: "花費" },
  ]);
  assert.deepEqual(
    toc.map((entry) => entry.number),
    ["1.", "1.1", "1.2", "2."],
  );
  assert.deepEqual(
    toc.map((entry) => entry.level),
    [2, 3, 3, 2],
  );
  assert.equal(toc[1].id, "作息");
});

// 舊文常常只用 h3 分節：沒有任何 h2 時 h3 就是第一層。
test("promotes h3 to the first level when the article has no h2", () => {
  const toc = buildToc([
    { level: 3, text: "一", id: "一" },
    { level: 3, text: "二", id: "二" },
  ]);
  assert.deepEqual(
    toc.map((entry) => entry.number),
    ["1.", "2."],
  );
  assert.deepEqual(
    toc.map((entry) => entry.level),
    [2, 2],
  );
});

// 第一個 h2 之前的 h3 沒有上層可掛，升成第一層而不是編成 0.1。
test("an h3 before the first h2 does not produce a 0.x number", () => {
  const toc = buildToc([
    { level: 3, text: "前置", id: "前置" },
    { level: 2, text: "主題", id: "主題" },
    { level: 3, text: "細節", id: "細節" },
  ]);
  assert.deepEqual(
    toc.map((entry) => entry.number),
    ["1.", "2.", "2.1"],
  );
});

// 只有一個標題（或沒有）的目錄沒有導覽價值，不出。
test("returns nothing for fewer than two headings", () => {
  assert.deepEqual(buildToc([{ level: 2, text: "唯一", id: "唯一" }]), []);
  assert.deepEqual(buildToc([]), []);
});

test("headingId keeps Chinese and turns whitespace into dashes", () => {
  assert.equal(headingId("刺蝟 飼養", new Set()), "刺蝟-飼養");
  assert.equal(headingId("  多個   空白\t與換行\n", new Set()), "多個-空白-與換行");
});

test("headingId de-duplicates repeated headings", () => {
  const used = new Set<string>();
  assert.equal(headingId("小結", used), "小結");
  assert.equal(headingId("小結", used), "小結-2");
  assert.equal(headingId("小結", used), "小結-3");
  assert.deepEqual([...used], ["小結", "小結-2", "小結-3"]);
});

test("headingId falls back to sec-N for empty text", () => {
  const used = new Set<string>();
  assert.equal(headingId("", used), "sec-1");
  assert.equal(headingId("   ", used), "sec-2");
  // 只剩會被拿掉的字元也算空
  assert.equal(headingId("#?&", used), "sec-3");
});

test("headingId strips characters that break urls or attributes", () => {
  const id = headingId(`Q&A: 為什麼? #1 "引號" <標籤>`, new Set());
  assert.doesNotMatch(id, /[#?&"'<>]/);
  assert.equal(id, "QA:-為什麼-1-引號-標籤");
});
