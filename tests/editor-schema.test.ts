// 真的跑 TipTap schema 的一輪測試：HTML → generateJSON → generateHTML，確認後台編輯器的
// 擴充組合（與 src/components/RichTextEditor.tsx 同一份清單）不會把表格、圖說、提示框、
// 分隔線、底線任何一樣弄丟。這是「舊文章重存不能掉東西」的直接證據——正式 DB 那兩篇
// legacy 文章就是 <figure><img><figcaption> 形式，content_json 為 null，編輯器吃 HTML。
//
// Node 沒有 DOM，專案也刻意不裝 jsdom。ProseMirror 的解析器與序列化器只用到很小一撮
// DOM 介面（nodeType／childNodes／getAttribute／matches／querySelector／createElement…），
// 這裡自己補一個夠用的最小 DOM，掛到 window／document 上讓 @tiptap/core 的
// generateJSON／generateHTML 直接跑。⚠️ 它只吃結構良好的 HTML（標籤要對稱）——編輯器
// 產出與舊文匯入的 HTML 都是這種；遇到不對稱的標籤會直接丟錯，不會靜默吞掉。
import assert from "node:assert/strict";
import test from "node:test";
import { generateHTML, generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Figure } from "../src/lib/tiptap/figure.ts";
import { Callout } from "../src/lib/tiptap/callout.ts";

// ---------- 最小 DOM ----------

const VOID_TAGS = new Set(["img", "br", "hr", "col", "input", "meta", "link", "source", "wbr", "area", "base", "embed", "track"]);

const escapeText = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const decode = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

class MiniNode {
  parentNode: MiniNode | null = null;
  childNodes: MiniNode[] = [];
  constructor(
    public readonly nodeType: number,
    public readonly nodeName: string,
    public readonly ownerDocument: MiniDocument,
  ) {}
  get firstChild() {
    return this.childNodes[0] ?? null;
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }
  get nextSibling(): MiniNode | null {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }
  get previousSibling(): MiniNode | null {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    return siblings[siblings.indexOf(this) - 1] ?? null;
  }
  appendChild(child: MiniNode) {
    // DocumentFragment 是搬它的子節點，不是把 fragment 自己掛上去。
    if (child.nodeType === 11) {
      for (const grandchild of [...child.childNodes]) this.appendChild(grandchild);
      return child;
    }
    child.parentNode?.removeChild(child);
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }
  removeChild(child: MiniNode) {
    const index = this.childNodes.indexOf(child);
    if (index >= 0) this.childNodes.splice(index, 1);
    child.parentNode = null;
    return child;
  }
  contains(other: MiniNode | null): boolean {
    for (let node = other; node; node = node.parentNode) if (node === this) return true;
    return false;
  }
  get children(): MiniNode[] {
    return this.childNodes.filter((child) => child.nodeType === 1);
  }
  get textContent(): string {
    return this.childNodes.map((child) => child.textContent).join("");
  }
  get innerHTML(): string {
    return this.childNodes.map((child) => child.outerHTML).join("");
  }
  get outerHTML(): string {
    return this.innerHTML;
  }
}

class MiniText extends MiniNode {
  constructor(public nodeValue: string, ownerDocument: MiniDocument) {
    super(3, "#text", ownerDocument);
  }
  override get textContent() {
    return this.nodeValue;
  }
  override get outerHTML() {
    return escapeText(this.nodeValue);
  }
}

class MiniElement extends MiniNode {
  readonly tagName: string;
  readonly namespaceURI = "http://www.w3.org/1999/xhtml";
  private readonly attributes = new Map<string, string>();
  // ProseMirror 只在 style 物件「存在且 length > 0」時才讀樣式規則；序列化時若 style 存在
  // 就會走 style.cssText = …。給一個空的、cssText 轉存成 attribute 的 style 就夠了。
  readonly style: { length: number; whiteSpace: string; fontWeight: string; fontStyle: string; cssText: string; getPropertyValue: (name: string) => string };

  constructor(tagName: string, ownerDocument: MiniDocument) {
    super(1, tagName.toUpperCase(), ownerDocument);
    this.tagName = tagName.toUpperCase();
    const element = this;
    this.style = {
      length: 0,
      whiteSpace: "",
      fontWeight: "",
      fontStyle: "",
      get cssText() {
        return element.getAttribute("style") ?? "";
      },
      set cssText(value: string) {
        element.setAttribute("style", value);
      },
      getPropertyValue: () => "",
    };
  }
  getAttribute(name: string) {
    return this.attributes.get(name.toLowerCase()) ?? null;
  }
  hasAttribute(name: string) {
    return this.attributes.has(name.toLowerCase());
  }
  setAttribute(name: string, value: unknown) {
    this.attributes.set(name.toLowerCase(), String(value));
  }
  removeAttribute(name: string) {
    this.attributes.delete(name.toLowerCase());
  }
  get parentElement(): MiniElement | null {
    return this.parentNode instanceof MiniElement ? this.parentNode : null;
  }
  matches(selector: string) {
    return splitTopLevel(selector, ",").some((complex) => matchesComplex(this, splitTopLevel(complex, " ")));
  }
  closest(selector: string): MiniElement | null {
    for (let node: MiniElement | null = this; node; node = node.parentElement) if (node.matches(selector)) return node;
    return null;
  }
  querySelectorAll(selector: string): MiniElement[] {
    const found: MiniElement[] = [];
    for (const child of this.childNodes) {
      if (!(child instanceof MiniElement)) continue;
      if (child.matches(selector)) found.push(child);
      found.push(...child.querySelectorAll(selector));
    }
    return found;
  }
  querySelector(selector: string): MiniElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }
  override get outerHTML() {
    const tag = this.tagName.toLowerCase();
    const attrs = [...this.attributes].map(([name, value]) => ` ${name}="${escapeAttr(value)}"`).join("");
    if (VOID_TAGS.has(tag)) return `<${tag}${attrs}>`;
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }
}

class MiniFragment extends MiniNode {
  constructor(ownerDocument: MiniDocument) {
    super(11, "#document-fragment", ownerDocument);
  }
}

class MiniDocument {
  readonly implementation = { createHTMLDocument: () => new MiniDocument() };
  createElement(tagName: string) {
    return new MiniElement(tagName, this);
  }
  createTextNode(value: string) {
    return new MiniText(value, this);
  }
  createDocumentFragment() {
    return new MiniFragment(this);
  }
}

// 選擇器只支援擴充清單真正用到的形狀：tag、[attr]、[attr="v"]、[attr^="v"]、:not(…)、
// 逗號清單、後代／子代組合子（表格擴充會查 "colgroup > col"）。碰到其他語法直接丟錯，
// 免得「不支援」被當成「不匹配」而悄悄漏掉一條解析規則。

// 在中括號／小括號外面才切，:not([src^="data:"]) 裡的東西不能被拆開。
function splitTopLevel(selector: string, separator: "," | " "): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of selector.trim()) {
    if (char === "[" || char === "(") depth += 1;
    if (char === "]" || char === ")") depth -= 1;
    const isSeparator = depth === 0 && (separator === "," ? char === "," : char === " " || char === ">");
    if (!isSeparator) {
      current += char;
      continue;
    }
    if (current) parts.push(current);
    current = "";
    if (char === ">") parts.push(">");
  }
  if (current) parts.push(current);
  return parts.filter((part) => part !== "");
}

// 由右往左比對：最右邊的 compound 對元素本身，往左依組合子找父元素（>）或任一祖先（空白）。
function matchesComplex(element: MiniElement, parts: string[]): boolean {
  let index = parts.length - 1;
  if (!matchesCompound(element, parts[index])) return false;
  let node: MiniElement | null = element;
  index -= 1;
  while (index >= 0) {
    if (parts[index] === ">") {
      index -= 1;
      node = node.parentElement;
      if (!node || !matchesCompound(node, parts[index])) return false;
    } else {
      node = node.parentElement;
      while (node && !matchesCompound(node, parts[index])) node = node.parentElement;
      if (!node) return false;
    }
    index -= 1;
  }
  return true;
}

function matchesCompound(element: MiniElement, compound: string): boolean {
  let rest = compound;
  const tag = rest.match(/^(\*|[a-zA-Z][\w-]*)/);
  if (tag) {
    if (tag[1] !== "*" && element.tagName !== tag[1].toUpperCase()) return false;
    rest = rest.slice(tag[0].length);
  }
  while (rest) {
    const attr = rest.match(/^\[([\w-]+)(?:([~|^$*]?=)(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]/);
    if (attr) {
      const [, name, operator, doubleQuoted, singleQuoted, bare] = attr;
      const actual = element.getAttribute(name);
      if (actual === null) return false;
      if (operator) {
        const expected = doubleQuoted ?? singleQuoted ?? bare ?? "";
        const ok =
          operator === "=" ? actual === expected
          : operator === "^=" ? actual.startsWith(expected)
          : operator === "$=" ? actual.endsWith(expected)
          : operator === "*=" ? actual.includes(expected)
          : null;
        if (ok === null) throw new Error(`mini DOM 不支援的屬性運算子：${operator}`);
        if (!ok) return false;
      }
      rest = rest.slice(attr[0].length);
      continue;
    }
    const not = rest.match(/^:not\(([^)]*)\)/);
    if (not) {
      if (element.matches(not[1])) return false;
      rest = rest.slice(not[0].length);
      continue;
    }
    throw new Error(`mini DOM 不支援的選擇器：${compound}`);
  }
  return true;
}

function parseHTML(html: string, document: MiniDocument): MiniElement {
  const root = document.createElement("root");
  const stack: MiniElement[] = [root];
  const token = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let match: RegExpExecArray | null;
  let consumed = 0;
  while ((match = token.exec(html))) {
    if (match.index !== consumed) throw new Error(`mini DOM 解析不了：${html.slice(consumed, match.index + 20)}`);
    consumed = token.lastIndex;
    const [whole, closing, opening, rawAttrs, selfClosing, text] = match;
    if (whole.startsWith("<!--")) continue;
    const top = stack[stack.length - 1];
    if (text !== undefined) {
      top.appendChild(document.createTextNode(decode(text)));
    } else if (opening) {
      const element = document.createElement(opening);
      const attr = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
      let pair: RegExpExecArray | null;
      while ((pair = attr.exec(rawAttrs))) element.setAttribute(pair[1], decode(pair[2] ?? pair[3] ?? pair[4] ?? ""));
      top.appendChild(element);
      if (!selfClosing && !VOID_TAGS.has(opening.toLowerCase())) stack.push(element);
    } else if (closing) {
      if (top.tagName !== closing.toUpperCase()) throw new Error(`標籤不對稱：</${closing}> 對上 <${top.tagName.toLowerCase()}>`);
      stack.pop();
    }
  }
  if (consumed !== html.length) throw new Error(`mini DOM 解析不了：${html.slice(consumed, consumed + 20)}`);
  if (stack.length !== 1) throw new Error(`沒關起來的標籤：<${stack[stack.length - 1].tagName.toLowerCase()}>`);
  return root;
}

class MiniDOMParser {
  parseFromString(html: string) {
    const document = new MiniDocument();
    const root = parseHTML(html, document);
    const body = root.querySelector("body") ?? root;
    return { body };
  }
}

// 一定要等所有 import 跑完才掛 window／document：prosemirror-view 在載入當下會嗅探
// document.documentElement.style 之類的東西，提早掛上這個殘缺的 document 它會直接炸。
// generateJSON／generateHTML 是呼叫時才看 window／document，所以放在這裡剛好。
const miniDocument = new MiniDocument();
Object.assign(globalThis, { document: miniDocument, window: { document: miniDocument, DOMParser: MiniDOMParser } });

// 與 RichTextEditor.tsx 相同的 schema 組合（Placeholder 只是外掛、不進 schema，這裡不用）。
const extensions = [
  StarterKit.configure({
    link: { openOnClick: false, protocols: ["http", "https", "mailto"] },
    heading: { levels: [2, 3, 4] },
  }),
  Image.configure({ inline: false }),
  TableKit.configure({ table: { resizable: false } }),
  Figure,
  Callout,
];

const roundTrip = (html: string) => {
  const json = generateJSON(html, extensions);
  return { json, html: generateHTML(json as Parameters<typeof generateHTML>[0], extensions) };
};

test("mini DOM: 解析與序列化自己先對得起來", () => {
  const html = `<p>a &amp; b</p><img src="/x.jpg" alt="q&quot;t"><div data-callout="tip"><p>x</p></div>`;
  const body = new MiniDOMParser().parseFromString(`<body>${html}</body>`).body;
  assert.equal(body.innerHTML, html);
  assert.equal(body.querySelector("img")?.getAttribute("alt"), 'q"t');
  assert.ok(body.querySelector("img")?.matches('img[src]:not([src^="data:"])'));
  assert.ok(!body.querySelector("img")?.matches('img[src^="/x"]:not([src^="/x"])'));
  assert.ok(body.querySelector("div")?.matches("div[data-callout]"));
  const [outer, inner] = body.querySelectorAll("p");
  assert.ok(outer.matches("body > p"));
  assert.ok(!outer.matches("div > p"));
  assert.ok(inner.matches("div > p"));
  assert.ok(inner.matches("body p"));
  assert.ok(!inner.matches("body > p"));
  assert.equal(inner.closest("div[data-callout]")?.getAttribute("data-callout"), "tip");
  assert.equal(outer.closest("div[data-callout]"), null);
  assert.ok(body.querySelector("div")?.matches('div[data-callout="tip"]'));
  assert.ok(!body.querySelector("div")?.matches('div[data-callout="info"]'));
  assert.throws(() => new MiniDOMParser().parseFromString("<p><b>x</p>"), /不對稱/);
});

test("表格、圖說、提示框、分隔線、底線走一輪之後都還在", () => {
  const source =
    `<h2>a</h2>` +
    `<figure><img src="https://x/y.jpg"><figcaption>說明</figcaption></figure>` +
    `<div data-callout="warning"><p>注意</p></div>` +
    `<table><tr><th>A</th></tr><tr><td>1</td></tr></table>` +
    `<hr>` +
    `<p><u>u</u></p>`;
  const { json, html } = roundTrip(source);

  assert.deepEqual(
    (json.content as { type: string }[]).map((node) => node.type),
    ["heading", "figure", "callout", "table", "horizontalRule", "paragraph"],
  );
  assert.match(html, /<h2>a<\/h2>/);
  assert.match(html, /<figure/);
  assert.match(html, /<img src="https:\/\/x\/y\.jpg"/);
  assert.match(html, /<figcaption>說明<\/figcaption>/);
  assert.match(html, /data-callout="warning"/);
  assert.match(html, /<table/);
  assert.match(html, /<th/);
  assert.match(html, /<td/);
  assert.match(html, /<hr>/);
  assert.match(html, /<u>u<\/u>/);
  assert.doesNotMatch(html, /contenteditable/);
  assert.doesNotMatch(html, /draggable/);

  // 再走一輪要收斂：第二輪的輸出得跟第一輪一模一樣，否則每次重存都會漂移。
  assert.equal(roundTrip(html).html, html);
});

test("舊文的 figure 形式（自閉合 img、相對路徑、alt）原樣保留，圖說在 figcaption 而不是 figure 上", () => {
  const legacy = `<figure><img src="/news/hedgehog-eating.jpeg" alt="刺蝟正在進食" /><figcaption>刺蝟飼養需求細緻。圖片來源：Freepik。</figcaption></figure>`;
  const { json, html } = roundTrip(legacy);
  const figure = (json.content as { type: string; attrs: Record<string, unknown>; content?: unknown[] }[])[0];
  assert.equal(figure.type, "figure");
  assert.equal(figure.attrs.src, "/news/hedgehog-eating.jpeg");
  assert.equal(figure.attrs.alt, "刺蝟正在進食");
  assert.equal(figure.attrs.width, null);
  assert.match(html, /^<figure><img src="\/news\/hedgehog-eating\.jpeg" alt="刺蝟正在進食"><figcaption>刺蝟飼養需求細緻。圖片來源：Freepik。<\/figcaption><\/figure>/);
  // src/alt 不能跑到 <figure> 標籤上
  assert.doesNotMatch(html, /<figure [^>]*src=/);
  assert.doesNotMatch(html, /width="null"/);
});

test("沒有 figcaption 的舊 figure 不會讓解析器炸掉，也不會把圖片複製成兩張", () => {
  // legacy-companion-animal-day-2025 的九張圖全是這種形式
  const source = `<p>前言</p><figure><img src="/news/a.jpg" alt="a" /></figure><p>後文</p>`;
  const { json, html } = roundTrip(source);
  const types = (json.content as { type: string }[]).map((node) => node.type);
  assert.deepEqual(types, ["paragraph", "figure", "paragraph"]);
  assert.equal((html.match(/<img /g) ?? []).length, 1);
  assert.match(html, /<figure><img src="\/news\/a\.jpg" alt="a"><figcaption><\/figcaption><\/figure>/);
});

test("沒有 img 的 figure 不歸圖說節點管，裡面的內容照常解析", () => {
  const { json } = roundTrip(`<figure><blockquote><p>引言</p></blockquote></figure>`);
  const types = (json.content as { type: string }[]).map((node) => node.type);
  assert.ok(!types.includes("figure"));
  assert.ok(types.includes("blockquote"));
});

test("裸 <img>（三篇新文的形式）仍由 image 節點接住", () => {
  const { json, html } = roundTrip(`<p>x</p><img src="https://x/a.jpg" alt="a">`);
  const types = (json.content as { type: string }[]).map((node) => node.type);
  assert.deepEqual(types, ["paragraph", "image"]);
  assert.match(html, /<img src="https:\/\/x\/a\.jpg" alt="a">/);
});

test("提示框：不認識的型別退回 info；三種合法型別原樣保留；內容可以是多個區塊", () => {
  const { html: fallback } = roundTrip(`<div data-callout="danger"><p>x</p></div>`);
  assert.match(fallback, /data-callout="info"/);
  for (const kind of ["info", "warning", "tip"]) {
    const { html } = roundTrip(`<div data-callout="${kind}"><p>一</p><ul><li><p>二</p></li></ul></div>`);
    assert.match(html, new RegExp(`^<div data-callout="${kind}"><p>一</p><ul><li><p>二</p></li></ul></div>`));
  }
  // 沒有 data-callout 的 div 不是提示框，內容直接攤平
  const { json } = roundTrip(`<div><p>plain</p></div>`);
  assert.deepEqual((json.content as { type: string }[]).map((node) => node.type), ["paragraph"]);
});

test("表格存出去是裸 <table>（外框由前台 prepareArticle 補），表頭列與一般格子分得出來", () => {
  const { html } = roundTrip(`<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>`);
  assert.match(html, /^<table/);
  assert.doesNotMatch(html, /tableWrapper|table-scroll/);
  assert.equal((html.match(/<th/g) ?? []).length, 2);
  assert.equal((html.match(/<td/g) ?? []).length, 2);
  // 前台包過 .table-scroll 的 HTML 若被貼回編輯器，外框會被剝掉、表格不會少
  const { html: unwrapped } = roundTrip(`<div class="table-scroll">${html}</div>`);
  assert.equal(unwrapped, html);
});

test("連結只留安全協定，標題只認 h2–h4", () => {
  const { html } = roundTrip(`<p><a href="javascript:alert(1)">x</a><a href="https://beunion.tw">ok</a></p><h1>big</h1><h5>small</h5>`);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<a [^>]*href="https:\/\/beunion\.tw"/);
  // h1／h5 不在允許的層級裡，內容降成段落而不是消失
  assert.doesNotMatch(html, /<h1|<h5/);
  assert.match(html, /<p>big<\/p>/);
  assert.match(html, /<p>small<\/p>/);
});
