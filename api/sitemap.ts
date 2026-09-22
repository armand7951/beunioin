import { getSupabaseAdmin } from "./_lib/supabase.js";
import { buildSitemapXml, STATIC_PATHS, type SitemapEntry } from "./_lib/sitemap.js";

interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
  send(body: string): void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }

  try {
    // 跟 api/events/index.ts、api/posts/index.ts 同一個坑：service_role 會繞過
    // RLS，「只收已發布」要自己在這裡擋，否則草稿會被 Google 收錄。
    const supabase = getSupabaseAdmin();
    const [postsResult, eventsResult, coursesResult] = await Promise.all([
      supabase.from("posts").select("id,updated_at").eq("status", "published"),
      supabase.from("events").select("id,updated_at").eq("is_published", true),
      supabase.from("courses").select("id,updated_at").eq("status", "published"),
    ]);

    if (postsResult.error) throw postsResult.error;
    if (eventsResult.error) throw eventsResult.error;
    if (coursesResult.error) throw coursesResult.error;

    const entries: SitemapEntry[] = [
      ...STATIC_PATHS.map((path) => ({ path })),
      ...(postsResult.data ?? []).map((post) => ({
        path: `/blog/${encodeURIComponent(post.id)}`,
        lastmod: post.updated_at as string | null,
      })),
      ...(eventsResult.data ?? []).map((event) => ({
        path: `/events/${encodeURIComponent(event.id)}`,
        lastmod: event.updated_at as string | null,
      })),
      ...(coursesResult.data ?? []).map((course) => ({
        path: `/courses/${encodeURIComponent(course.id)}`,
        lastmod: course.updated_at as string | null,
      })),
    ];

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(buildSitemapXml(entries));
  } catch (error) {
    console.error("Unable to build sitemap:", error);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(500).send("Sitemap 暫時無法產生，請稍候再試。");
  }
}
