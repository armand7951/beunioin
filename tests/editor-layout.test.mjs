import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editor = readFileSync("src/components/RichTextEditor.tsx", "utf8");
const figure = readFileSync("src/lib/tiptap/figure.ts", "utf8");
const callout = readFileSync("src/lib/tiptap/callout.ts", "utf8");
const postsApi = readFileSync("api/_lib/admin/posts.ts", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

// 只看 import 與程式碼 pattern，不比對可能出現在註解裡的字。

// 後台要能編出前台長文排版需要的每一種東西：表格、圖說、提示框、分隔線、底線。
test("the editor registers every extension the article layout needs", () => {
  assert.match(editor, /StarterKit\.configure\(/);
  assert.match(editor, /TableKit\.configure\(/);
  assert.match(editor, /^\s+Figure,$/m);
  assert.match(editor, /^\s+Callout,$/m);
  assert.match(editor, /Placeholder\.configure\(/);
  assert.match(editor, /from "@tiptap\/extension-table"/);
  assert.match(editor, /from "@tiptap\/extensions"/);
  assert.match(editor, /from "\.\.\/lib\/tiptap\/figure"/);
  assert.match(editor, /from "\.\.\/lib\/tiptap\/callout"/);
});

// StarterKit 3 已內建 Link 與 Underline；再掛一份 @tiptap/extension-link 是重複註冊。
test("Link comes from StarterKit, not a second registration", () => {
  assert.doesNotMatch(editor, /from "@tiptap\/extension-link"/);
  assert.doesNotMatch(editor, /Link\.configure\(/);
  assert.match(editor, /link: \{[\s\S]*?openOnClick: false/);
  assert.match(editor, /protocols: \["http", "https", "mailto"\]/);
  assert.match(editor, /heading: \{ levels: \[2, 3, 4\] \}/);
});

// 工具列每個按鈕都要接到真正的指令。
test("the toolbar wires every command", () => {
  for (const command of [
    "toggleBold()",
    "toggleItalic()",
    "toggleUnderline()",
    "toggleStrike()",
    "toggleHeading({ level: 2 })",
    "toggleHeading({ level: 3 })",
    "toggleBlockquote()",
    'toggleCallout("info")',
    "toggleBulletList()",
    "toggleOrderedList()",
    "insertTable({ rows: 3, cols: 3, withHeaderRow: true })",
    "setHorizontalRule()",
    "undo()",
    "redo()",
  ]) {
    assert.ok(editor.includes(`.${command}.run()`), `missing toolbar command ${command}`);
  }
  // 插圖走 figure（圖片＋圖說），不再是裸 image
  assert.match(editor, /\.setFigure\(\{ src: url/);
  assert.doesNotMatch(editor, /\.setImage\(/);
});

// 游標在表格／提示框裡才出現的第二列。
test("the context row exposes table and callout operations", () => {
  for (const command of [
    "addRowBefore",
    "addRowAfter",
    "deleteRow",
    "addColumnBefore",
    "addColumnAfter",
    "deleteColumn",
    "toggleHeaderRow",
    "deleteTable",
  ]) {
    assert.ok(editor.includes(`.${command}().run()`), `missing table command ${command}`);
  }
  assert.match(editor, /active\.table && \(/);
  assert.match(editor, /active\.callout && \(/);
  assert.match(editor, /\.setCalloutKind\(kind\)/);
  for (const kind of ['kind: "info"', 'kind: "warning"', 'kind: "tip"']) assert.ok(editor.includes(kind));
});

// @tiptap/react 3 預設不因 transaction 重繪；工具列狀態要靠 useEditorState 才會即時。
test("toolbar state is derived through useEditorState", () => {
  assert.match(editor, /useEditorState\(\{/);
  assert.match(editor, /import \{[^}]*useEditorState[^}]*\} from "@tiptap\/react"/);
  assert.doesNotMatch(editor, /active=\{editor\.isActive\(/);
});

// 前後台共用 article-body；編輯器不再自己帶 prose。
test("the editor body shares the article-body class with the public article page", () => {
  const editorClass = editor.match(/class:\s*"([^"]+)"/)?.[1] ?? "";
  assert.match(editorClass, /\barticle-body\b/);
  assert.doesNotMatch(editorClass, /\bprose\b|prose-slate|\[&_h2\]/);
  assert.doesNotMatch(editor, /className: "prose/);
  assert.match(editor, /圖片插入後可直接在圖下方輸入圖說；表格內按 Tab 換格。/);
});

// AdminPostForm.tsx 靠這個 props 介面，不能動。
test("the props interface is unchanged", () => {
  const props = editor.match(/interface Props \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(props, /contentJson: JSONContent \| null;/);
  assert.match(props, /contentHtml: string;/);
  assert.match(props, /onChange: \(value: \{ html: string; json: JSONContent \}\) => void;/);
  assert.match(props, /onUploadImage: \(file: File\) => Promise<string>;/);
});

// figure 節點：屬性從內層 img 讀、內容從 figcaption 讀；存出去的 HTML 不能帶編輯器的殼。
test("the figure node parses <figure><img><figcaption> and renders clean HTML", () => {
  assert.match(figure, /name: "figure"/);
  assert.match(figure, /tag: "figure"/);
  assert.match(figure, /contentElement: \(element\) =>[\s\S]*?querySelector\("figcaption"\)/);
  assert.match(figure, /querySelector\("img"\)/);
  assert.match(figure, /\["figcaption", 0\]/);
  // renderHTML 裡不能出現這兩個屬性（比對「屬性名: 值」的寫法）
  assert.doesNotMatch(figure, /["']?contenteditable["']?\s*:/i);
  assert.doesNotMatch(figure, /\["img", \{[^}]*draggable/);
  assert.doesNotMatch(figure, /\["figure", [^\]]*draggable/);
  assert.match(figure, /setFigure:/);
  // 圖片屬性不可以掛到 <figure> 標籤上
  assert.match(figure, /rendered: false/);
});

// callout 節點：data-callout 屬性、包／解包走 wrapIn／lift。
test("the callout node toggles with wrapIn/lift and keeps kind in data-callout", () => {
  assert.match(callout, /name: "callout"/);
  assert.match(callout, /tag: "div\[data-callout\]"/);
  assert.match(callout, /"data-callout":/);
  assert.match(callout, /commands\.wrapIn\(this\.name, \{ kind \}\)/);
  assert.match(callout, /commands\.lift\(this\.name\)/);
  assert.match(callout, /commands\.updateAttributes\(this\.name, \{ kind \}\)/);
  assert.match(callout, /\["info", "warning", "tip"\]/);
});

// 沒有上限的 RPC 會照單全收 base64 圖片塞出來的幾 MB 內文，API 先擋。
test("the posts API refuses oversized content with 413", () => {
  assert.match(postsApi, /res\.status\(413\)/);
  assert.match(postsApi, /contentHtml\.length > 500_000/);
  assert.match(postsApi, /JSON\.stringify\(body\.contentJson \?\? null\)\.length > 1_000_000/);
});

// 表格套件要在 dependencies；extension-link 只該是 starter-kit 的傳遞依賴。
test("package.json carries the table extension and no direct link dependency", () => {
  assert.ok(pkg.dependencies["@tiptap/extension-table"]);
  assert.equal(pkg.dependencies["@tiptap/extension-link"], undefined);
  assert.equal(pkg.devDependencies?.["@tiptap/extension-link"], undefined);
});
