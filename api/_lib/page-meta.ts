// 把單篇文章／活動／課程的 SEO meta 寫進 index.html 的 <head>。
//
// 為什麼需要伺服器端做這件事：前台是 SPA，src/lib/pageMeta.ts 的 usePageMeta 是在
// 瀏覽器掛載後才改 <title>/description/canonical。Googlebot 會跑 JS 所以讀得到，
// 但 LINE、Facebook、X 的預覽抓取器**不跑 JS**，只讀原始 HTML——所以在這支出現之前，
// 分享任何一篇文章，預覽卡都是首頁的標題、描述與圖片。
//
// 這裡只做字串替換，不解析整份 HTML：index.html 的這些標籤是我們自己維護的固定格式，
// 用正則精準換掉 content 屬性最穩，也不必為了這件事扛一個 HTML parser 進函式。

export interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  /** 文章／活動／課程用 article，其餘維持 website。 */
  type?: "website" | "article";
}

/** 進 HTML 屬性值前先escape，標題裡的引號或 & 才不會把標籤切斷。 */
export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 摘要太長社群預覽會自己截斷，這裡先收斂到 160 字並把換行壓平。 */
export function toDescription(raw: string, fallback: string): string {
  const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 160 ? `${text.slice(0, 159)}…` : text;
}

function replaceAttr(html: string, pattern: RegExp, value: string): string {
  return html.replace(pattern, (_match, head: string, tail: string) => `${head}${value}${tail}`);
}

function metaPattern(attr: "name" | "property", key: string): RegExp {
  const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(<meta\\s+${attr}="${safeKey}"\\s+content=")[^"]*(")`);
}

export function injectPageMeta(html: string, meta: PageMeta): string {
  const title = escapeAttribute(meta.title);
  const description = escapeAttribute(meta.description);
  const url = escapeAttribute(meta.url);
  const image = escapeAttribute(meta.image);
  const type = meta.type ?? "website";

  let out = html;
  out = out.replace(/(<title>)[^<]*(<\/title>)/, `$1${title}$2`);
  out = replaceAttr(out, metaPattern("name", "title"), title);
  out = replaceAttr(out, metaPattern("name", "description"), description);
  out = replaceAttr(out, /(<link rel="canonical" href=")[^"]*(")/, url);

  out = replaceAttr(out, metaPattern("property", "og:type"), type);
  out = replaceAttr(out, metaPattern("property", "og:url"), url);
  out = replaceAttr(out, metaPattern("property", "og:title"), title);
  out = replaceAttr(out, metaPattern("property", "og:description"), description);
  out = replaceAttr(out, metaPattern("property", "og:image"), image);

  out = replaceAttr(out, metaPattern("property", "twitter:url"), url);
  out = replaceAttr(out, metaPattern("property", "twitter:title"), title);
  out = replaceAttr(out, metaPattern("property", "twitter:description"), description);
  out = replaceAttr(out, metaPattern("property", "twitter:image"), image);

  return out;
}
