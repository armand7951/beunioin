// 從各種 YouTube 網址形式抽出 11 碼影片 ID。認不出來回 null，呼叫端要把整筆擋掉——
// 不能存一串垃圾進去等播放時才發現壞了。移植自 happyhands。⚠️ api/_lib/youtube.ts 有同一份，改要一起改；
// 伺服器那份才是真正擋垃圾的門，這份只給後台表單即時顯示解析結果。
//
// 支援：watch?v=ID、youtu.be/ID、/embed/ID、/shorts/ID、/live/ID、以及裸 ID。
const ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (ID.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return ID.test(id) ? id : null;
  }
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;

  const v = url.searchParams.get("v");
  if (v && ID.test(v)) return v;

  const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})(?:[/?]|$)/);
  return match ? match[1] : null;
}
