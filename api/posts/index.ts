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

  const raw = Array.isArray(req.query?.category) ? req.query?.category[0] : req.query?.category;
  const category = typeof raw === "string" ? raw.trim() : "";

  try {
    // service_role 會繞過 posts 的 RLS，所以「只給已發布」必須在這裡自己擋。
    // 跟 /api/events 是同一個坑（20260905000000 §1）。
    let query = getSupabaseAdmin()
      .from("posts")
      .select("id,title,excerpt,category,cover_image_url,author_name,is_pinned,published_at,post_categories(label)")
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;

    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json(
      (data ?? []).map((post) => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        categoryLabel: (post.post_categories as { label?: string } | null)?.label ?? null,
        coverImageUrl: post.cover_image_url,
        authorName: post.author_name,
        isPinned: post.is_pinned,
        publishedAt: post.published_at,
      })),
    );
  } catch (error) {
    console.error("Unable to load posts:", error);
    return res.status(500).json({ error: "文章暫時無法載入，請稍候再試。" });
  }
}
