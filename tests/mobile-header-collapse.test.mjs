import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createMobileHeaderScrollState,
  updateMobileHeaderScroll,
} from "../src/lib/mobileHeaderScroll.ts";

const header = readFileSync("src/components/Header.tsx", "utf8");

test("the mobile Header stays expanded at the top", () => {
  const collapsed = {
    ...createMobileHeaderScrollState(),
    collapsed: true,
    lastY: 80,
  };

  const next = updateMobileHeaderScroll(collapsed, 20, true);

  assert.equal(next.collapsed, false);
  assert.equal(next.distance, 0);
});

test("downward movement must reach the threshold before collapse", () => {
  let state = updateMobileHeaderScroll(
    createMobileHeaderScrollState(),
    20,
    true,
  );
  state = updateMobileHeaderScroll(state, 28, true);
  assert.equal(state.collapsed, false);

  state = updateMobileHeaderScroll(state, 33, true);
  assert.equal(state.collapsed, true);
});

test("upward movement must reach the threshold before expansion", () => {
  let state = {
    ...createMobileHeaderScrollState(),
    collapsed: true,
    lastY: 100,
  };

  state = updateMobileHeaderScroll(state, 94, true);
  assert.equal(state.collapsed, true);

  state = updateMobileHeaderScroll(state, 87, true);
  assert.equal(state.collapsed, false);
});

test("changing direction resets accumulated movement", () => {
  let state = updateMobileHeaderScroll(
    createMobileHeaderScrollState(),
    20,
    true,
  );
  state = updateMobileHeaderScroll(state, 29, true);
  state = updateMobileHeaderScroll(state, 25, true);
  state = updateMobileHeaderScroll(state, 33, true);

  assert.equal(state.collapsed, false);
  assert.equal(state.direction, "down");
  assert.equal(state.distance, 8);
});

test("desktop always returns an expanded state", () => {
  const collapsed = {
    ...createMobileHeaderScrollState(),
    collapsed: true,
    lastY: 200,
  };

  const next = updateMobileHeaderScroll(collapsed, 260, false);

  assert.equal(next.collapsed, false);
  assert.equal(next.distance, 0);
  assert.equal(next.direction, null);
});

// 導覽改成抽屜後，捲動縮起來的對象只剩下標題列本身（logo 與上下留白），
// 不再是整條選單，所以這裡不再檢查那組 mobile-header-expandable 的 class。
test("Header still shrinks itself while scrolling on phones", () => {
  assert.match(header, /createMobileHeaderScrollState/);
  assert.match(header, /updateMobileHeaderScroll/);
  assert.match(header, /addEventListener\("scroll", handleScroll, \{ passive: true \}\)/);
  assert.match(header, /addEventListener\("resize", handleScroll\)/);
  assert.match(header, /isMobileCollapsed \? "h-10" : "h-12"/);
});
