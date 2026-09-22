import { useEffect } from "react";
import { trackPageView } from "./analytics";

// 每頁 SEO meta 的共用 hook。index.html 原本寫死一份全站預設值（title／
// description／canonical／og:*），這支負責在頁面掛載時把它們換成該頁專屬的
// 內容，卸載時還原——所以 index.html 那份仍然是「沒有 JS 或還沒 hydrate 完」
// 時 Google 看到的預設值，不能刪。

export type PageMeta = {
  title: string;
  description?: string;
  noindex?: boolean;
};

const SITE_NAME = "台灣環境生態護育產業工會";
const SITE_ORIGIN = "https://beunion.tw";

type CachedDefaults = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
};

// 只在整個 app 生命週期第一次執行時快取 index.html 寫死的預設值，之後每次
// cleanup 都還原成這一份，而不是「上一頁留下的內容」。
let defaults: CachedDefaults | null = null;

function captureDefaults(): CachedDefaults {
  if (defaults) return defaults;
  defaults = {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? `${SITE_ORIGIN}/`,
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? "",
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? `${SITE_ORIGIN}/`,
  };
  return defaults;
}

function ensureMetaByName(name: string): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  return el;
}

function ensureMetaByProperty(property: string): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  return el;
}

function ensureCanonicalLink(): HTMLLinkElement {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  return el;
}

function removeRobotsMeta(): void {
  document.querySelector('meta[name="robots"]')?.remove();
}

// StrictMode 開發模式下同一個 effect 會掛載兩次，用「路徑 + 標題」當 key
// 去重，避免同一次瀏覽送出兩筆 page_view。
let lastTracked: string | null = null;

export function usePageMeta(meta: PageMeta | null): void {
  useEffect(() => {
    if (!meta) {
      // Detail 頁資料還沒載入完成時會先傳 null；這裡先不動任何 meta 標籤，
      // 等同一個 hook 之後帶著真正的內容再呼叫一次。
      return;
    }

    const cached = captureDefaults();
    const { title, description, noindex } = meta;
    const pageTitle = title.includes(SITE_NAME) ? title : `${title}｜${SITE_NAME}`;
    const pathname = window.location.pathname;
    const canonicalUrl = `${SITE_ORIGIN}${pathname}`;

    document.title = pageTitle;
    if (description) {
      ensureMetaByName("description").setAttribute("content", description);
    }
    ensureCanonicalLink().setAttribute("href", canonicalUrl);
    ensureMetaByProperty("og:title").setAttribute("content", pageTitle);
    if (description) {
      ensureMetaByProperty("og:description").setAttribute("content", description);
    }
    ensureMetaByProperty("og:url").setAttribute("content", canonicalUrl);

    if (noindex) {
      ensureMetaByName("robots").setAttribute("content", "noindex, nofollow");
    } else {
      removeRobotsMeta();
    }

    const trackKey = `${pathname}|${title}`;
    if (lastTracked !== trackKey) {
      lastTracked = trackKey;
      trackPageView(pathname, title);
    }

    return () => {
      document.title = cached.title;
      if (cached.description) {
        ensureMetaByName("description").setAttribute("content", cached.description);
      }
      ensureCanonicalLink().setAttribute("href", cached.canonical);
      ensureMetaByProperty("og:title").setAttribute("content", cached.ogTitle);
      ensureMetaByProperty("og:description").setAttribute("content", cached.ogDescription);
      ensureMetaByProperty("og:url").setAttribute("content", cached.ogUrl);
      removeRobotsMeta();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.title, meta?.description, meta?.noindex]);
}
