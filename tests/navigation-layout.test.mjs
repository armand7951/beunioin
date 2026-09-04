import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync("src/components/Header.tsx", "utf8");
const footer = readFileSync("src/components/Footer.tsx", "utf8");

const headerMenu = header.match(/const menuItems = \[([\s\S]*?)\n  \];/)?.[1] ?? "";
const footerServices =
  footer.match(/更多服務<\/h5>([\s\S]*?)<\/ul>/)?.[1] ?? "";

// AI 守護獸與權益檢測挑戰已下架，改為連到兩個外部 Gemini Gem（src/lib/aiPartners.ts），
// 所以 mascots/quiz/chat 三個站內頁面連同導覽入口一起移除。
test("the Header keeps only primary destinations", () => {
  assert.match(headerMenu, /id: "home"/);
  assert.match(headerMenu, /id: "welfare"/);
  assert.match(headerMenu, /id: "shield"/);
  assert.doesNotMatch(headerMenu, /id: "(mascots|quiz|chat|report)"/);
  assert.doesNotMatch(header, /id="header-quick-chat-btn"/);
  assert.doesNotMatch(header, /守護獸/);
});

test("desktop Header navigation does not use horizontal scrolling", () => {
  const navigationClass =
    header.match(/<nav className="([^"]+)"/)?.[1] ?? "";
  const gradientCount = header.match(/lg:hidden[^"]*bg-gradient-to-/g)?.length ?? 0;

  assert.match(navigationClass, /lg:overflow-visible/);
  assert.match(navigationClass, /lg:snap-none/);
  assert.equal(gradientCount, 2);
});

test("the Footer exposes only the three secondary services", () => {
  assert.match(footer, />更多服務<\/h5>/);
  // 兩個 AI 小夥伴是外部連結，不走站內導覽。
  assert.match(footerServices, /AI_PARTNERS\.map/);
  assert.match(footerServices, /onNavigate\("report"\)/);
  assert.doesNotMatch(
    footerServices,
    /onNavigate\("(home|mascots|welfare|shield|quiz|chat)"\)/,
  );
});

// 外開的連結一定要帶 noopener（不讓對方頁面拿到 window.opener）
// 與 noreferrer（不外洩來源網址）。
test("the external AI partner links open safely", () => {
  const hero = readFileSync("src/components/Hero.tsx", "utf8");
  for (const source of [hero, footer]) {
    assert.match(source, /target="_blank"/);
    assert.match(source, /rel="noopener noreferrer"/);
  }
  const partners = readFileSync("src/lib/aiPartners.ts", "utf8");
  assert.match(partners, /gemini\.google\.com\/gem\//);
  // 只數真正的網址，別把介面裡的 `url: string;` 也算進去。
  assert.equal((partners.match(/url: "https:/g) ?? []).length, 2);
});
