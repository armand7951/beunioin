import { getVerifiedUser } from "../lib/auth.js";
import { getSupabaseAdmin } from "../lib/supabase.js";

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}
interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

const ERROR_MESSAGES: Record<string, string> = {
  ADMIN_REQUIRED: "此帳號沒有管理員權限。",
  MANAGER_REQUIRED: "只有管理者可以調整人員權限。",
  INVALID_ROLE: "角色不正確。",
  USER_NOT_FOUND: "查無此帳號。對方必須先在本站註冊過，才能加入後台。",
  ADMIN_NOT_FOUND: "找不到這位人員，可能已被其他人移除。",
  CANNOT_REMOVE_SELF: "不能移除自己。請由其他管理者操作。",
  LAST_MANAGER: "這是最後一位管理者，不能移除或降級，否則沒有人能再管理人員。",
};

// 回傳「有沒有處理掉」而不是回傳 response —— res.json() 的型別是 void，
// 直接拿它的結果去做真假判斷會被 TS1345 擋下。
function fail(res: ApiResponse, message: string | undefined) {
  if (!message) return false;
  const code = Object.keys(ERROR_MESSAGES).find((key) => message.includes(key));
  if (!code) return false;
  const status = code === "ADMIN_REQUIRED" || code === "MANAGER_REQUIRED" ? 403 : 400;
  res.status(status).json({ error: ERROR_MESSAGES[code] });
  return true;
}

const str = (value: unknown) => (typeof value === "string" ? value : "");

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const method = req.method ?? "GET";
  if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) {
    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }

  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });

  const supabase = getSupabaseAdmin();
  const body = (req.body ?? {}) as Record<string, unknown>;

  if (method === "GET") {
    const { data, error } = await supabase.rpc("admin_list_admins", {
      p_admin_user_id: user.id,
    });
    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to load admins:", error.message);
      return res.status(500).json({ error: "人員名單暫時無法載入。" });
    }
    return res.status(200).json(
      (data ?? []).map((row) => ({
        userId: row.user_id,
        email: row.email,
        role: row.role,
        isSelf: row.is_self,
        lastSignInAt: row.last_sign_in_at,
      })),
    );
  }

  if (method === "POST") {
    const { error } = await supabase.rpc("admin_add_admin", {
      p_admin_user_id: user.id,
      p_email: str(body.email).trim(),
      p_role: str(body.role) || "operator",
    });
    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to add admin:", error.message);
      return res.status(500).json({ error: "新增人員失敗。" });
    }
    return res.status(200).json({ ok: true });
  }

  if (method === "PATCH") {
    const { error } = await supabase.rpc("admin_set_admin_role", {
      p_admin_user_id: user.id,
      p_target_user_id: str(body.userId),
      p_role: str(body.role),
    });
    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to change admin role:", error.message);
      return res.status(500).json({ error: "調整角色失敗。" });
    }
    return res.status(200).json({ ok: true });
  }

  const raw = Array.isArray(req.query?.userId) ? req.query?.userId[0] : req.query?.userId;
  const targetId = typeof raw === "string" ? raw.trim() : "";
  if (!targetId) return res.status(400).json({ error: "缺少人員編號。" });

  const { error } = await supabase.rpc("admin_remove_admin", {
    p_admin_user_id: user.id,
    p_target_user_id: targetId,
  });
  if (fail(res, error?.message)) return;
  if (error) {
    console.error("Unable to remove admin:", error.message);
    return res.status(500).json({ error: "移除人員失敗。" });
  }
  return res.status(200).json({ ok: true });
}
