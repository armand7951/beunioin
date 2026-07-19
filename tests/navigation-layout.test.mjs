import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync("src/components/Header.tsx", "utf8");
const footer = readFileSync("src/components/Footer.tsx", "utf8");

const headerMenu = header.match(/const menuItems = \[([\s\S]*?)\n  \];/)?.[1] ?? "";
const footerServices =
  footer.match(/更多服務<\/h5>([\s\S]*?)<\/ul>/)?.[1] ?? "";

test("the Header keeps only primary destinations", () => {
  assert.match(headerMenu, /id: "home"/);
  assert.match(headerMenu, /id: "mascots"/);
  assert.match(headerMenu, /id: "welfare"/);
  assert.match(headerMenu, /id: "shield"/);
  assert.doesNotMatch(headerMenu, /id: "(quiz|chat|report)"/);
  assert.match(header, /id="header-quick-chat-btn"/);
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
  assert.match(footerServices, /onNavigate\("quiz"\)/);
  assert.match(footerServices, /onNavigate\("chat"\)/);
  assert.match(footerServices, /onNavigate\("report"\)/);
  assert.doesNotMatch(
    footerServices,
    /onNavigate\("(home|mascots|welfare|shield)"\)/,
  );
});
