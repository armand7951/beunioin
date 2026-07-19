import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shieldHub = readFileSync("src/components/ShieldHub.tsx", "utf8");

test("the Shield Hub contact tab contains the legacy contact fields", () => {
  assert.match(shieldHub, /貴姓大名|姓名/);
  assert.match(shieldHub, /Email/);
  assert.match(shieldHub, /手機號碼/);
  assert.match(shieldHub, /目前從事的工作／聯絡內容/);
  assert.match(shieldHub, /required/);
});

test("the contact form submits to the contact API with status feedback", () => {
  assert.match(shieldHub, /fetch\("\/api\/contact"/);
  assert.match(shieldHub, /method:\s*"POST"/);
  assert.match(shieldHub, /name="website"/);
  assert.match(shieldHub, /訊息已成功送出/);
  assert.match(shieldHub, /role="status"/);
  assert.match(shieldHub, /role="alert"/);
});

test("the contact tab exposes the official fallback inbox", () => {
  assert.match(shieldHub, /volt02332@gmail\.com/);
  assert.doesNotMatch(shieldHub, /beunion\.tw@gmail\.com/);
  assert.doesNotMatch(shieldHub, /LINE 官方帳號/);
});
