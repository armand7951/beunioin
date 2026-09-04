import { getVerifiedUser } from "../auth.js";
import { getSupabaseAdmin } from "../supabase.js";

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
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

  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });

  const raw = Array.isArray(req.query?.limit) ? req.query?.limit[0] : req.query?.limit;
  const limit = Number(raw);

  const { data, error } = await getSupabaseAdmin().rpc("admin_list_audit_log", {
    p_admin_user_id: user.id,
    p_limit: Number.isInteger(limit) && limit > 0 ? limit : 200,
  });

  if (error?.message.includes("MANAGER_REQUIRED")) {
    return res.status(403).json({ error: "只有管理者可以查看操作紀錄。" });
  }
  if (error?.message.includes("ADMIN_REQUIRED")) {
    return res.status(403).json({ error: "此帳號沒有管理員權限。" });
  }
  if (error) {
    console.error("Unable to load audit log:", error.message);
    return res.status(500).json({ error: "操作紀錄暫時無法載入。" });
  }

  return res.status(200).json(
    (data ?? []).map((row) => ({
      id: row.id,
      actorEmail: row.actor_email,
      action: row.action,
      entity: row.entity,
      entityId: row.entity_id,
      label: row.label,
      changedAt: row.changed_at,
    })),
  );
}
