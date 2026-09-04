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

// 行動版原本是一條要左右滑的選單列（還得配一行「左右滑動選單」的提示才知道
// 能滑），改成標準漢堡抽屜。桌機維持原本的橫向導覽。
test("navigation is a drawer on phones and a row on desktop", () => {
  assert.match(header, /id="mobile-menu-toggle"/);
  assert.match(header, /id="mobile-menu"/);
  assert.match(header, /aria-expanded=\{menuOpen\}/);
  assert.match(header, /aria-controls="mobile-menu"/);

  // 桌機那條 nav 不再需要任何橫向捲動的補救措施
  assert.doesNotMatch(header, /overflow-x-auto/);
  assert.doesNotMatch(header, /snap-mandatory/);
  assert.doesNotMatch(header, /左右滑動選單/);
  assert.doesNotMatch(header, /bg-gradient-to-/);

  const navigationClass = header.match(/<nav className="([^"]+)"/)?.[1] ?? "";
  assert.match(navigationClass, /hidden lg:flex/);
});

// 選單項目按下去要順手關掉抽屜，否則點完還蓋在內容上。
test("the drawer closes after navigating", () => {
  const drawer = header.match(/id="mobile-menu"([\s\S]*?)\n    <\/header>/)?.[1] ?? header;
  assert.match(drawer, /setMenuOpen\(false\)/);
});

// 權益申訴表單已下架，申訴改走 Footer 公布的熱線與信箱。
test("the Footer lists the overview pages and the AI partners", () => {
  assert.match(footer, />更多服務<\/h5>/);
  assert.match(footerServices, /onNavigate\("events"\)/);
  assert.match(footerServices, /onNavigate\("blog"\)/);
  // 兩個 AI 小夥伴是外部連結，不走站內導覽。
  assert.match(footerServices, /AI_PARTNERS\.map/);
  assert.doesNotMatch(footerServices, /onNavigate\("report"\)/);
  // 申訴管道仍在，只是不再是站內表單
  assert.match(footer, /8666-8111/);
  assert.match(footer, /volt02332@gmail\.com/);
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

// 換頁不該包在 AnimatePresence 裡。它要等離場動畫跑完才卸載舊頁，而動畫靠
// requestAnimationFrame —— 分頁在背景時 rAF 不觸發，離場永遠不結束：
// 配 mode="wait" 會卡在舊頁看不到新頁，不配則兩頁同時留在畫面上。實際踩過。
test("switching pages does not depend on an exit animation", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  // 比對實際用法而不是任何提及 —— 上面那段說明就寫了這個元件的名字。
  assert.doesNotMatch(app, /<AnimatePresence/);
  assert.doesNotMatch(app, /from "motion\/react".*AnimatePresence/);
  assert.doesNotMatch(app, /exit=\{/);
  // key 換掉就讓 React 直接卸載舊頁
  assert.match(app, /key=\{activeSection\}/);
});
