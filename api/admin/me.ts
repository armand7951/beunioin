import { getVerifiedUser } from "../lib/auth.js";
import { getSupabaseAdmin } from "../lib/supabase.js";

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
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
  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });

  // 一次拿到「是不是管理員」與「哪一層」。前端要靠 role 決定人員與日誌兩個選項
  // 顯不顯示 —— 那只是介面整潔，真正的權限判斷在每支 RPC 自己的 require_admin。
  const { data, error } = await getSupabaseAdmin().rpc("admin_my_role", {
    p_user_id: user.id,
  });
  if (error) {
    console.error("Unable to resolve admin role:", error.message);
    return res.status(500).json({ error: "無法確認管理員權限。" });
  }
  const role = typeof data === "string" ? data : null;
  return res.status(200).json({ isAdmin: role !== null, role });
}
