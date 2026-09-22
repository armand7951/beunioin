// GA4 輕量掛點。只有設定 VITE_GA_MEASUREMENT_ID 才會動態插入 gtag.js；本機開發
// 或沒填 ID 的環境完全是 no-op，不留任何外部請求痕跡。ID 一律讀環境變數，
// 程式碼裡不寫死任何 GA 代碼。
//
// send_page_view 關閉：站內路由是手刻的 SPA pushState（見 src/App.tsx），
// gtag 自動送出的第一筆 page_view 會用初始載入的路徑，之後換頁也不會再送——
// 兩者都跟實際瀏覽行為對不上。改由 src/lib/pageMeta.ts 的 usePageMeta 在每次
// 換頁時呼叫 trackPageView，路徑與標題才會跟畫面一致。

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let measurementId: string | null = null;
let initialized = false;

export function initAnalytics(): void {
  if (initialized) return; // 防止重複呼叫（例如 React StrictMode）插入兩支 script

  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id) return; // 沒設定就是 no-op

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", id, { send_page_view: false });

  measurementId = id;
  initialized = true;
}

export function trackPageView(path: string, title: string): void {
  if (!initialized || !measurementId || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}
