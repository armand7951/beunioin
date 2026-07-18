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

  const { data, error } = await getSupabaseAdmin().rpc("is_admin_user", {
    p_user_id: user.id,
  });
  if (error) return res.status(500).json({ error: "無法確認管理員權限。" });
  return res.status(200).json({ isAdmin: data === true });
}
