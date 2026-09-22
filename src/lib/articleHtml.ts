import DOMPurify, { type Config } from "dompurify";
import { buildToc, headingId, type TocEntry, type TocHeading } from "./articleToc";

// 前台文章頁在渲染前對 content_html 做的整理。只在瀏覽器執行（需要 document）；
// 這個站沒有 SSR，所以不用守。
//
// 為什麼要先淨化：content_html 目前只有後台管理員能寫，但「只有管理員能寫」是
// 授權層的保證，不是內容層的 —— 帳號被盜、匯入工具出錯、或日後開放投稿，
// dangerouslySetInnerHTML 就是 XSS 的入口。DOMPurify 在前端多擋一道，成本是幾毫秒。

export type PreparedArticle = {
  /** 第一個標題之前的段落（前言），放在目錄上方 */
  intro: string;
  /** 第一個標題起的正文 */
  body: string;
  toc: TocEntry[];
  /** 整篇的純文字（空白已壓縮），給沒填摘要的文章當 meta description 用 */
  text: string;
};

// RETURN_DOM_FRAGMENT 要是字面量 true，TypeScript 才會選到回傳 DocumentFragment 的那個多載
const SANITIZE_OPTIONS: Config & { RETURN_DOM_FRAGMENT: true } = {
  USE_PROFILES: { html: true },
  // target 不在 DOMPurify 預設白名單，但編輯器的連結是 target=_blank；
  // 放行後下面一律補 rel=noopener，不讓外站拿到 window.opener。
  ADD_ATTR: ["target"],
  RETURN_DOM_FRAGMENT: true,
};

const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, td, th, figcaption, blockquote, pre, div";

// textContent 會把相鄰區塊黏在一起（「第一段第二段」），先在每個區塊尾端補個空白再取。
function plainText(root: HTMLElement): string {
  const copy = root.cloneNode(true) as HTMLElement;
  for (const block of copy.querySelectorAll(BLOCK_SELECTOR)) block.append(" ");
  return (copy.textContent ?? "").replace(/\s+/g, " ").trim();
}

function hardenLinks(root: HTMLElement): void {
  for (const anchor of root.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')) {
    const rel = new Set((anchor.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean));
    rel.add("noopener");
    rel.add("noreferrer");
    anchor.setAttribute("rel", [...rel].join(" "));
  }
}

function tuneImages(root: HTMLElement): void {
  for (const image of root.querySelectorAll<HTMLImageElement>("img")) {
    // 長文動輒六七張圖，全部一起載會拖慢首屏；封面另外由 Blog.tsx 用 eager 載。
    image.setAttribute("loading", "lazy");
    image.setAttribute("decoding", "async");
    if (image.getAttribute("alt")?.trim()) continue;
    // 舊文的圖片常常沒填 alt，但圖說有寫；拿圖說當替代文字總比空的好。
    const caption = image.closest("figure")?.querySelector("figcaption")?.textContent?.trim();
    if (caption) image.setAttribute("alt", caption);
  }
}

// 表格在手機上比螢幕寬，得有一層可以左右捲的容器，否則整頁被撐出橫向捲軸。
// 編輯器裡 TipTap 自己會包 .tableWrapper，但存進資料庫的 HTML 沒有這層。
function wrapTables(root: HTMLElement): void {
  for (const table of root.querySelectorAll("table")) {
    const parent = table.parentElement;
    if (!parent || parent.classList.contains("table-scroll")) continue;
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    parent.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  }
}

// 只看頂層的 h2／h3：包在引言或提示框裡的標題不是章節，不該進目錄。
function collectHeadings(root: HTMLElement): { headings: TocHeading[]; first: Element | null } {
  const used = new Set<string>();
  const headings: TocHeading[] = [];
  let first: Element | null = null;

  for (const child of root.children) {
    const level = child.tagName === "H2" ? 2 : child.tagName === "H3" ? 3 : null;
    if (!level) continue;
    const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
    // 編輯器會留下空標題（按了 H2 卻沒打字），跳過：目錄裡一個空項目誰也點不到
    if (!text) continue;
    child.id = headingId(text, used);
    headings.push({ level, text, id: child.id });
    // 分割點 = 第一個進目錄的標題。第一個 h2 之前的 h3 在 buildToc 會升成第一層，
    // 目錄不能排在自己第一個項目的後面，所以不能只認 h2。
    if (!first) first = child;
  }

  return { headings, first };
}

export function prepareArticle(html: string): PreparedArticle {
  const root = document.createElement("div");
  root.appendChild(DOMPurify.sanitize(html ?? "", SANITIZE_OPTIONS));

  hardenLinks(root);
  tuneImages(root);
  wrapTables(root);

  const { headings, first } = collectHeadings(root);
  const toc = buildToc(headings);
  const text = plainText(root);

  // 前言與正文分開輸出，目錄方框才能插在兩者之間（參考站的版面：前言 → 目錄 → 正文）
  const intro = document.createElement("div");
  if (first) {
    while (root.firstChild && root.firstChild !== first) intro.appendChild(root.firstChild);
  }

  return { intro: intro.innerHTML, body: root.innerHTML, toc, text };
}
