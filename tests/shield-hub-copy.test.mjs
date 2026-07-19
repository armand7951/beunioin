import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shieldHub = readFileSync("src/components/ShieldHub.tsx", "utf8");

test("the Shield Hub uses the approved badge and heading", () => {
  assert.match(shieldHub, /BeUnion • 台灣環境生態護育產業工會/);
  assert.match(shieldHub, /我們保護為萬物挺身而出的人/);
  assert.doesNotMatch(shieldHub, /官網資訊庫/);
  assert.doesNotMatch(shieldHub, /我們將/);
});
