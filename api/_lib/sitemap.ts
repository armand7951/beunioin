// 純函式：把 { path, lastmod } 陣列組成 sitemap XML。不碰網路、不用
// service_role，單元測試（tests/sitemap.test.ts）可以直接 import 使用。
// 真正查資料庫、決定「哪些算已發布」的邏輯留在 api/sitemap.ts。

const SITE_ORIGIN = "https://beunion.tw";

// 六個固定頁：首頁 + 三個列表頁（各自的文章／活動／課程明細另外從資料庫查）
// + welfare／shield 兩個單頁。
export const STATIC_PATHS = ["/", "/blog", "/events", "/courses", "/welfare", "/shield"];

export interface SitemapEntry {
  path: string;
  lastmod?: string | null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const loc = escapeXml(`${SITE_ORIGIN}${entry.path}`);
      const lastmod = toIsoDate(entry.lastmod);
      return lastmod
        ? `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
        : `  <url>\n    <loc>${loc}</loc>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
