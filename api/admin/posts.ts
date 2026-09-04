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
  MANAGER_REQUIRED: "此操作需要管理者權限。",
  POST_ID_REQUIRED: "文章代碼不可空白。",
  POST_TITLE_REQUIRED: "文章標題不可空白。",
  INVALID_STATUS: "文章狀態不正確。",
  POST_NOT_FOUND: "找不到這篇文章，可能已被其他人刪除。",
};

function describe(message: string | undefined) {
  if (!message) return null;
  const code = Object.keys(ERROR_MESSAGES).find((key) => message.includes(key));
  return code ? { code, text: ERROR_MESSAGES[code] } : null;
}

// 回傳「有沒有處理掉」而不是回傳 response —— res.json() 的型別是 void，
// 直接拿它的結果去做真假判斷會被 TS1345 擋下。
function fail(res: ApiResponse, message: string | undefined) {
  const known = describe(message);
  if (!known) return false;
  const status = known.code === "ADMIN_REQUIRED" || known.code === "MANAGER_REQUIRED" ? 403 : 400;
  res.status(status).json({ error: known.text });
  return true;
}

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

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
    const { data, error } = await supabase.rpc("admin_list_posts", {
      p_admin_user_id: user.id,
    });
    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to load admin posts:", error.message);
      return res.status(500).json({ error: "文章列表暫時無法載入。" });
    }
    return res.status(200).json(
      (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        excerpt: row.excerpt,
        contentHtml: row.content_html,
        contentJson: row.content_json,
        category: row.category,
        categoryLabel: row.category_label,
        coverImageUrl: row.cover_image_url,
        authorName: row.author_name,
        status: row.status,
        publishedAt: row.published_at,
        updatedAt: row.updated_at,
      })),
    );
  }

  if (method === "POST") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = str(body.status, "draft");
    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({ error: "文章狀態不正確。" });
    }

    const { data, error } = await supabase.rpc("admin_upsert_post", {
      p_admin_user_id: user.id,
      p_id: str(body.id).trim(),
      p_title: str(body.title).trim(),
      p_excerpt: str(body.excerpt),
      p_content_html: str(body.contentHtml),
      p_content_json: body.contentJson ?? null,
      p_category: str(body.category),
      p_cover_image_url: str(body.coverImageUrl),
      p_author_name: str(body.authorName),
      p_status: status,
    });

    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to save post:", error.message);
      return res.status(400).json({ error: "文章儲存失敗，請檢查各欄位長度是否超過限制。" });
    }
    return res.status(200).json({ id: data });
  }

  const raw = Array.isArray(req.query?.id) ? req.query?.id[0] : req.query?.id;
  const postId = typeof raw === "string" ? raw.trim() : "";
  if (!postId) return res.status(400).json({ error: "缺少文章代碼。" });

  const { error } = await supabase.rpc("admin_delete_post", {
    p_admin_user_id: user.id,
    p_post_id: postId,
  });
  if (fail(res, error?.message)) return;
  if (error) {
    console.error("Unable to delete post:", error.message);
    return res.status(500).json({ error: "文章刪除失敗。" });
  }
  return res.status(200).json({ ok: true });
}
