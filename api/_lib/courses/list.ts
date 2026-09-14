import { getSupabaseAdmin } from "../supabase.js";
import { mapCourse, type ApiRequest, type ApiResponse } from "./types.js";

// 公開的課程總覽。RPC 只回已發布的，而且不含 youtube_id 與 body ——
// 這支用 service_role，會繞過所有 RLS，所以「不外洩」靠的是 RPC 的 select 清單。
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }
  const { data, error } = await getSupabaseAdmin().rpc("list_published_courses");
  if (error) {
    console.error("Unable to list courses:", error.message);
    return res.status(500).json({ error: "課程資料暫時無法載入。" });
  }
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return res.status(200).json((data ?? []).map(mapCourse));
}
