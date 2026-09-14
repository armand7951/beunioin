import { getVerifiedUser } from "../auth.js";
import { getSupabaseAdmin } from "../supabase.js";
import type { ApiRequest, ApiResponse } from "./types.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }
  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });

  const body = (req.body ?? {}) as Record<string, unknown>;
  const lessonId = typeof body.lessonId === "string" ? body.lessonId.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(lessonId)) {
    return res.status(400).json({ error: "缺少單元編號。" });
  }

  // RPC 內部會再過一次 lesson_access：沒權限的人不能在別人的課上留完成紀錄。
  const { error } = await getSupabaseAdmin().rpc("mark_lesson_complete", {
    p_user_id: user.id,
    p_lesson_id: lessonId,
  });
  const message = error?.message ?? "";
  if (message.includes("NO_ACCESS") || message.includes("LOGIN_REQUIRED")) {
    return res.status(403).json({ error: "此課程限已報名的學員。" });
  }
  if (message.includes("LESSON_NOT_FOUND")) return res.status(404).json({ error: "找不到這個單元。" });
  if (error) {
    console.error("Unable to mark lesson complete:", error.message);
    return res.status(500).json({ error: "無法儲存進度。" });
  }
  return res.status(200).json({ ok: true });
}
