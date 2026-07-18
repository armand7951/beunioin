import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync("src/components/Header.tsx", "utf8");
const footer = readFileSync("src/components/Footer.tsx", "utf8");
const indexHtml = readFileSync("index.html", "utf8");

test("the shared BeUnion logo asset is installed", () => {
  assert.equal(existsSync("public/logo.png"), true);
});

test("the header uses the shared BeUnion logo", () => {
  assert.match(header, /src="\/logo\.png"/);
  assert.match(header, /alt="台灣環境生態護育產業工會標誌"/);
});

test("the footer uses the shared BeUnion logo", () => {
  assert.match(footer, /src="\/logo\.png"/);
  assert.match(footer, /alt="台灣環境生態護育產業工會標誌"/);
});

test("the favicon uses the shared BeUnion logo", () => {
  assert.match(
    indexHtml,
    /<link rel="icon" type="image\/png" href="\/logo\.png" \/>/,
  );
});
