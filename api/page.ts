// 單篇頁面的 HTML：拿 SPA 外殼，把該篇的 SEO meta 換進去再回傳。
// vercel.json 把 /blog/:slug、/events/:slug、/courses/:slug 導到這裡（帶 type 與 slug）。
//
// 守則：**任何一步失敗都要回原封不動的外殼**。meta 錯了只是預覽卡難看，
// 外殼沒回去整頁就白畫面——兩者嚴重性差太多，所以這支永遠不讓錯誤往外拋。
import { getSupabaseAdmin } from "./_lib/supabase.js";
import { injectPageMeta, toDescription, type PageMeta } from "./_lib/page-meta.js";

const SITE_ORIGIN = "https://beunion.tw";
const SITE_NAME = "台灣環境生態護育產業工會";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og.jpg`;
const DEFAULT_DESCRIPTION =
  "專為生態保育工作者與志工打造。提供職安通報、法律權益教育、活動報名與工會文章，讓我們一起守護台灣，也守護志工尊嚴與安全！";

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
  send(body: string): void;
}

type Kind = "blog" | "events" | "courses";

const PATH_PREFIX: Record<Kind, string> = { blog: "/blog", events: "/events", courses: "/courses" };

interface SharedFields {
  title: string;
  description: string;
  image: string;
}

// 每個來源各自把欄位寫死：select 字串若是動態組出來的，supabase-js 的型別推導
// 會解析失敗（TS2352），而且三張表的欄位名本來就不一樣，攤開來比對照表清楚。
// service_role 會繞過 RLS，所以「只收已發布」每一條都得自己加。
async function fetchShared(kind: Kind, slug: string): Promise<SharedFields | null> {
  const supabase = getSupabaseAdmin();

  if (kind === "blog") {
    const { data, error } = await supabase
      .from("posts")
      .select("title,excerpt,cover_image_url")
      .eq("id", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return data
      ? { title: data.title ?? "", description: data.excerpt ?? "", image: data.cover_image_url ?? "" }
      : null;
  }

  if (kind === "events") {
    const { data, error } = await supabase
      .from("events")
      .select("title,description,image_url")
      .eq("id", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return data
      ? { title: data.title ?? "", description: data.description ?? "", image: data.image_url ?? "" }
      : null;
  }

  const { data, error } = await supabase
    .from("courses")
    .select("title,description,cover_image_url")
    .eq("id", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data
    ? { title: data.title ?? "", description: data.description ?? "", image: data.cover_image_url ?? "" }
    : null;
}

// 外殼每個 lambda 實例抓一次就好。資產檔名含雜湊，所以同一份部署的外殼不會變；
// 給它一個短 TTL，是為了讓剛部署完的實例不會抱著上一版的外殼太久。
const SHELL_TTL_MS = 60_000;
let shellCache: { html: string; at: number } | null = null;

async function loadShell(): Promise<string> {
  if (shellCache && Date.now() - shellCache.at < SHELL_TTL_MS) return shellCache.html;

  // 優先抓同一份部署的外殼；部署網址受 Deployment Protection 保護，要帶自動化
  // 略過金鑰（Vercel 在開啟該功能後會自動注入這個環境變數）。拿不到就退回正式網域。
  const candidates: { url: string; headers?: Record<string, string> }[] = [];
  const deploymentUrl = process.env.VERCEL_URL;
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (deploymentUrl) {
    candidates.push({
      url: `https://${deploymentUrl}/index.html`,
      headers: bypass ? { "x-vercel-protection-bypass": bypass } : undefined,
    });
  }
  candidates.push({ url: `${SITE_ORIGIN}/index.html` });

  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate.url, { headers: candidate.headers });
      if (!response.ok) {
        lastError = new Error(`${candidate.url} → ${response.status}`);
        continue;
      }
      const html = await response.text();
      // 被保護頁或錯誤頁擋下來時拿到的不是我們的外殼，別存進快取。
      if (!html.includes('<div id="root">')) {
        lastError = new Error(`${candidate.url} 回傳的不是 SPA 外殼`);
        continue;
      }
      shellCache = { html, at: Date.now() };
      return html;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("無法取得 SPA 外殼");
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }

  const kind = first(req.query?.type) as Kind;
  const slug = first(req.query?.slug);
  const prefix = PATH_PREFIX[kind];

  let shell: string;
  try {
    shell = await loadShell();
  } catch (error) {
    // 外殼都拿不到就沒戲唱了，讓 Vercel 回錯誤比回一份壞 HTML 好。
    console.error("Unable to load the SPA shell:", error);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(500).send("頁面暫時無法載入，請稍候再試。");
  }

  const sendShell = (status: number) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
    return res.status(status).send(shell);
  };

  if (!prefix || !slug) return sendShell(200);

  try {
    const row = await fetchShared(kind, slug);
    if (!row) {
      // DB 答得出來但查無此篇 = 真的不存在，回 404 讓搜尋引擎別收錄；
      // 外殼照回，前台仍會畫自己的「找不到」畫面。
      return sendShell(404);
    }

    const title = row.title.trim();
    const meta: PageMeta = {
      title: title ? `${title}｜${SITE_NAME}` : SITE_NAME,
      description: toDescription(row.description, DEFAULT_DESCRIPTION),
      url: `${SITE_ORIGIN}${prefix}/${encodeURIComponent(slug)}`,
      image: row.image || DEFAULT_IMAGE,
      type: "article",
    };

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
    return res.status(200).send(injectPageMeta(shell, meta));
  } catch (error) {
    // DB 掛掉時寧可回預設 meta 的正常頁面，也不要讓整篇文章打不開。
    console.error(`Unable to build meta for ${kind}/${slug}:`, error);
    return sendShell(200);
  }
}
