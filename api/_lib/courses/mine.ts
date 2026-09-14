import { getVerifiedUser } from "../auth.js";
import { getSupabaseAdmin } from "../supabase.js";
import { mapCourse, type ApiRequest, type ApiResponse } from "./types.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }
  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });

  const { data, error } = await getSupabaseAdmin().rpc("my_courses", { p_user_id: user.id });
  if (error) {
    console.error("Unable to list my courses:", error.message);
    return res.status(500).json({ error: "課程資料暫時無法載入。" });
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json((data ?? []).map(mapCourse));
}
