import { getVerifiedUser } from "../auth.js";
import { getSupabaseAdmin } from "../supabase.js";

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
  COURSE_NOT_FOUND: "找不到這門課程。",
  USER_NOT_FOUND: "找不到這個帳號。",
  ENROLLMENT_NOT_FOUND: "這位學員不在名單裡，可能已被移除。",
  INVALID_SOURCE: "來源不正確。",
};

function fail(res: ApiResponse, message: string | undefined) {
  if (!message) return false;
  const code = Object.keys(ERROR_MESSAGES).find((key) => message.includes(key));
  if (!code) return false;
  res.status(code === "ADMIN_REQUIRED" ? 403 : 400).json({ error: ERROR_MESSAGES[code] });
  return true;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const q = (req: ApiRequest, key: string) => {
  const raw = Array.isArray(req.query?.[key]) ? req.query?.[key]?.[0] : req.query?.[key];
  return typeof raw === "string" ? raw.trim() : "";
};

// 用 email 找到或建立帳號。這是 happyhands findOrCreateUser 的簡化版：
//   - 先找既有帳號（含已註冊的一般會員），有就直接用，**絕不建第二個**
//   - 沒有才用 Admin API 建，email_confirm 一定是 true —— Supabase 的 OAuth 自動
//     歸戶要求 email 已驗證；設 false 的話學員之後用 Google 登入會變成另一個帳號、
//     看不到自己的課（happyhands 實測踩過）
//   - 不設密碼：學員用「忘記密碼」自己設。不共用預設密碼。
async function findOrCreateUser(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  email: string,
  fullName: string,
): Promise<{ id: string; created: boolean } | { error: string }> {
  const normalized = email.trim().toLowerCase();
  const { data: existing, error: lookupError } = await supabase.rpc("find_user_by_email", {
    p_email: normalized,
  });
  if (lookupError) return { error: lookupError.message };
  if (typeof existing === "string" && existing) return { id: existing, created: false };

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : {},
  });
  if (error || !data.user) return { error: error?.message ?? "createUser failed" };
  return { id: data.user.id, created: true };
}

// GET    ?courseId=X                     → 名單
// POST   {courseId, emails[], names?, expiresAt?} → 逐個加人（可批次）
// DELETE ?courseId=X&userId=Y            → 撤銷
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const method = req.method ?? "GET";
  if (!["GET", "POST", "DELETE"].includes(method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }
  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });
  const supabase = getSupabaseAdmin();

  if (method === "GET") {
    const courseId = q(req, "courseId");
    if (!courseId) return res.status(400).json({ error: "缺少課程代碼。" });
    const { data, error } = await supabase.rpc("admin_list_enrollments", {
      p_admin_user_id: user.id,
      p_course_id: courseId,
    });
    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to list enrollments:", error.message);
      return res.status(500).json({ error: "學員名單暫時無法載入。" });
    }
    return res.status(200).json(
      (data ?? []).map((row) => ({
        userId: row.user_id,
        email: row.email,
        fullName: row.full_name,
        grantedAt: row.granted_at,
        expiresAt: row.expires_at,
        source: row.source,
        completedLessons: row.completed_lessons,
      })),
    );
  }

  if (method === "POST") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const courseId = str(body.courseId).trim();
    const rawEmails = Array.isArray(body.emails) ? body.emails : [];
    const names = (body.names ?? {}) as Record<string, unknown>;
    const expiresAt = str(body.expiresAt).trim() || null;
    const source = body.source === "legacy_import" ? "legacy_import" : "admin";
    if (!courseId) return res.status(400).json({ error: "缺少課程代碼。" });

    const emails = [...new Set(rawEmails.map((e) => str(e).trim().toLowerCase()).filter(Boolean))];
    if (emails.length === 0) return res.status(400).json({ error: "請至少輸入一個 Email。" });
    if (emails.length > 200) return res.status(400).json({ error: "一次最多 200 個 Email。" });

    const results: Array<{ email: string; ok: boolean; created?: boolean; error?: string }> = [];
    for (const email of emails) {
      if (!EMAIL.test(email)) {
        results.push({ email, ok: false, error: "格式不正確" });
        continue;
      }
      const found = await findOrCreateUser(supabase, email, str(names[email]).trim());
      if ("error" in found) {
        results.push({ email, ok: false, error: found.error });
        continue;
      }
      const { error } = await supabase.rpc("admin_grant_course", {
        p_admin_user_id: user.id,
        p_course_id: courseId,
        p_user_id: found.id,
        p_expires_at: expiresAt,
        p_source: source,
      });
      if (error) {
        const known = Object.keys(ERROR_MESSAGES).find((k) => error.message.includes(k));
        results.push({ email, ok: false, error: known ? ERROR_MESSAGES[known] : error.message });
        continue;
      }
      results.push({ email, ok: true, created: found.created });
    }

    const okCount = results.filter((r) => r.ok).length;
    return res.status(okCount > 0 || results.length === 0 ? 200 : 400).json({
      granted: okCount,
      createdAccounts: results.filter((r) => r.created).length,
      results,
    });
  }

  const courseId = q(req, "courseId");
  const userId = q(req, "userId");
  if (!courseId || !userId) return res.status(400).json({ error: "缺少課程代碼或學員編號。" });
  const { error } = await supabase.rpc("admin_revoke_course", {
    p_admin_user_id: user.id,
    p_course_id: courseId,
    p_user_id: userId,
  });
  if (fail(res, error?.message)) return;
  if (error) {
    console.error("Unable to revoke enrollment:", error.message);
    return res.status(500).json({ error: "移除學員失敗。" });
  }
  return res.status(200).json({ ok: true });
}
