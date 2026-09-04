import { getSupabaseAdmin } from "../_lib/supabase.js";

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}
interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }

  const raw = Array.isArray(req.query?.id) ? req.query?.id[0] : req.query?.id;
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id) return res.status(400).json({ error: "缺少文章代碼。" });

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("posts")
      .select("id,title,excerpt,content_html,category,cover_image_url,author_name,is_pinned,published_at,post_categories(label)")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    // 草稿與不存在都回 404，對外不區分 —— 否則等於承認「有這篇但還沒發布」。
    if (!data) return res.status(404).json({ error: "找不到這篇文章。" });

    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({
      id: data.id,
      title: data.title,
      excerpt: data.excerpt,
      contentHtml: data.content_html,
      category: data.category,
      categoryLabel: (data.post_categories as { label?: string } | null)?.label ?? null,
      coverImageUrl: data.cover_image_url,
      authorName: data.author_name,
      isPinned: data.is_pinned,
      publishedAt: data.published_at,
    });
  } catch (error) {
    console.error("Unable to load post:", error);
    return res.status(500).json({ error: "文章暫時無法載入，請稍候再試。" });
  }
}
