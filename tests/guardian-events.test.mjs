import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const calendar = readFileSync("src/components/EventCalendar.tsx", "utf8");
const seed = readFileSync("supabase/seed.sql", "utf8");

const approvedPosters = {
  "public/events/62607.jpg":
    "e26f6e68a4e1ee63a4b5aff5e7c409f95f3e836aa299311037f843c583b2d58a",
  "public/events/62603.png":
    "8b0b24fad2c6e012f36f1c8b682811462916ce6d401a2ba611adfc63a73420bf",
  "public/events/EDM1.jpg":
    "da1623d427103a98691e06a0a962184b7ee104aebf667cdaca516f636ca5b384",
};

test("the approved original event posters are installed unchanged", () => {
  for (const [path, expectedHash] of Object.entries(approvedPosters)) {
    const actualHash = createHash("sha256")
      .update(readFileSync(path))
      .digest("hex");
    assert.equal(actualHash, expectedHash, path);
  }
});

test("the four approved guardian events use local posters", () => {
  for (const eventId of [
    "songshan-harvest-2026",
    "volunteer-labor-training-2026",
    "animal-case-training-2026",
    "animal-trust-course-2026",
  ]) {
    assert.match(seed, new RegExp(`'${eventId}'`));
  }

  assert.match(seed, /'\/events\/EDM1\.jpg'/);
  assert.match(seed, /'\/events\/62603\.png'/);
  assert.equal((seed.match(/'\/events\/62607\.jpg'/g) ?? []).length, 2);
});

test("the July 19 event is explicitly ended", () => {
  assert.match(
    seed,
    /'songshan-harvest-2026'[\s\S]*?false,\s*'ended'/,
  );
});

test("the event calendar renders status through the shared helper", () => {
  assert.match(calendar, /getEventStatus\(ev\)/);
  assert.match(calendar, /活動已結束/);
});

// 「已結束」是算出來的，不是後台手動標記的：getEventStatus 的 ended 同時看
// lifecycleStatus 與 endsAt，所以活動時間一過就自己歸到已結束那一組，不需排程。
test("events fall into the ended tab on their own once they finish", () => {
  assert.match(calendar, /getEventStatus\(ev\) !== "ended"/);
  assert.match(calendar, /getEventStatus\(ev\) === "ended"/);
  assert.match(calendar, /進行中/);
  assert.match(calendar, /已結束/);

  const status = readFileSync("src/lib/eventStatus.ts", "utf8");
  assert.match(status, /new Date\(event\.endsAt\)\.getTime\(\) <= now\.getTime\(\)/);
});

// 點活動要進到該活動的頁面，報名表在那裡，不再是卡片上的彈窗。
test("the calendar opens an event page instead of a registration modal", () => {
  assert.match(calendar, /onOpenEvent/);
  assert.doesNotMatch(calendar, /setSelectedEvent/);
  assert.doesNotMatch(calendar, /fixed inset-0/);

  const detail = readFileSync("src/components/EventDetail.tsx", "utf8");
  assert.match(detail, /\/api\/events\/\$\{event\.id\}\/register/);
  // 報名表單只在可報名時出現，其餘狀態顯示原因而不是給一張送不出去的表。
  assert.match(detail, /status !== "open"/);
});

// 首頁的活動卡與文章卡共用 CARD_MEDIA（同高），所以這裡不再寫死長寬比 ——
// 「不裁切」真正靠的是 object-contain，直式海報會留白但完整可見。
test("portrait posters are shown without cropping", () => {
  assert.match(calendar, /CARD_MEDIA/);
  assert.match(calendar, /object-contain/);
  const layout = readFileSync("src/lib/cardLayout.ts", "utf8");
  assert.match(layout, /CARD_MEDIA/);
});

// 首頁兩區都是：手機一列可左右滑、桌機三欄、最多兩排。
test("home cards share one layout: swipeable on phones, three across, two rows", () => {
  const news = readFileSync("src/components/NewsBoard.tsx", "utf8");
  const layout = readFileSync("src/lib/cardLayout.ts", "utf8");

  assert.match(layout, /overflow-x-auto/);
  assert.match(layout, /snap-x/);
  assert.match(layout, /lg:grid-cols-3/);
  // shrink-0 少了的話卡片會被壓進一個螢幕寬，等於捲不動。
  assert.match(layout, /shrink-0/);
  assert.match(layout, /HOME_CARD_LIMIT = 6/);

  for (const source of [calendar, news]) {
    assert.match(source, /CARD_GRID/);
    assert.match(source, /CARD_ITEM/);
    assert.match(source, /HOME_CARD_LIMIT/);
    assert.match(source, /看更多/);
  }
});

test("event loading failures are visible to visitors", () => {
  assert.match(calendar, /setLoadError/);
  assert.match(calendar, /活動資料暫時無法載入/);
});
