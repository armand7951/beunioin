import { getVerifiedUser } from "../auth.js";
import { getSupabaseAdmin } from "../supabase.js";
import type { ApiRequest, ApiResponse } from "./types.js";

// 影片 ID 與內文唯一的出口。授權判斷全在 RPC lesson_access 裡，這裡只負責把
// 代號翻成 HTTP 狀態。用 POST 而不是 GET：避免任何一層快取把帶 ID 的回應留下來。
// 拒絕時回應絕不夾帶 youtubeId。
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }
  res.setHeader("Cache-Control", "no-store");

  const body = (req.body ?? {}) as Record<string, unknown>;
  const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(lessonId)) {
    return res.status(400).json({ error: "缺少單元編號。" });
  }

  // 未登入不是錯誤：試看單元不需要帳號，交給 RPC 依 is_free_preview 決定。
  const user = await getVerifiedUser(req.headers);

  const { data, error } = await getSupabaseAdmin().rpc("lesson_access", {
    p_user_id: user?.id ?? null,
    p_lesson_id: lessonId,
  });

  const message = error?.message ?? "";
  if (message.includes("LESSON_NOT_FOUND")) return res.status(404).json({ error: "找不到這個單元。" });
  if (message.includes("LOGIN_REQUIRED")) return res.status(401).json({ error: "請先登入後再觀看。" });
  if (message.includes("NO_ACCESS")) return res.status(403).json({ error: "此課程限已報名的學員觀看。" });
  if (error) {
    console.error("Unable to resolve lesson access:", error.message);
    return res.status(500).json({ error: "單元暫時無法載入。" });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return res.status(404).json({ error: "找不到這個單元。" });

  return res.status(200).json({
    courseId: row.course_id,
    courseTitle: row.course_title,
    title: row.lesson_title,
    youtubeId: row.youtube_id ?? null,
    body: row.body ?? "",
    isFreePreview: row.is_free_preview === true,
  });
}
