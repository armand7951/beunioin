// 文章目錄的純函式：從標題清單算出錨點 id 與「1.」「1.1」這種編號。
// 不碰 DOM，所以能在 Node 裡直接測（tests/article-toc.test.ts）；
// 掃 HTML、補 id 的那段在 articleHtml.ts。

export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
  number: string;
};

export type TocHeading = {
  level: 2 | 3;
  text: string;
  id: string;
};

// 標題文字 → 錨點 id。中文保留（瀏覽器的 id 與 #hash 都吃 Unicode），
// 只拿掉會弄壞網址或屬性的字元；空白換成 -，讓 #hash 不必百分比編碼一堆 %20。
// 同一篇裡重複的標題（例如每節都有一個「小結」）補 -2、-3，否則後面的永遠跳不到。
// 會把結果寫回 used：呼叫端照文章順序一路傳同一個 Set 就好。
export function headingId(text: string, used: Set<string>): string {
  const base = text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[#?&"'<>]/g, "");
  const candidate = base || `sec-${used.size + 1}`;
  let id = candidate;
  for (let n = 2; used.has(id); n += 1) id = `${candidate}-${n}`;
  used.add(id);
  return id;
}

// h2 是第一層（1.、2.），h3 掛在前一個 h2 底下（1.1、1.2）。
// 整篇都沒有 h2 時 h3 就當第一層 —— 不少舊文只用 h3 分節。
// 標題不到兩個就不出目錄：只有一個標題的目錄沒有導覽價值，只是多一個方框。
export function buildToc(headings: TocHeading[]): TocEntry[] {
  if (headings.length < 2) return [];

  const hasMajor = headings.some((heading) => heading.level === 2);
  let major = 0;
  let minor = 0;
  const entries: TocEntry[] = [];

  for (const heading of headings) {
    // 第一個 h2 之前的 h3 沒有可以掛的上層，升成第一層，免得出現 0.1 這種編號
    const isMajor = !hasMajor || heading.level === 2 || major === 0;
    if (isMajor) {
      major += 1;
      minor = 0;
      entries.push({ id: heading.id, text: heading.text, level: 2, number: `${major}.` });
    } else {
      minor += 1;
      entries.push({ id: heading.id, text: heading.text, level: 3, number: `${major}.${minor}` });
    }
  }

  return entries;
}
