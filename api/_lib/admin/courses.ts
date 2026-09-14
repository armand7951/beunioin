import { getVerifiedUser } from "../auth.js";
import { getSupabaseAdmin } from "../supabase.js";
import { parseYouTubeId } from "../youtube.js";

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
  COURSE_ID_REQUIRED: "課程代碼不可空白。",
  INVALID_STATUS: "課程狀態不正確。",
  COURSE_NOT_FOUND: "找不到這門課程，可能已被其他人刪除。",
  LESSON_NOT_FOUND: "有單元已不存在，請重新整理後再儲存。",
  LESSONS_MUST_BE_ARRAY: "單元資料格式不正確。",
};

function fail(res: ApiResponse, message: string | undefined) {
  if (!message) return false;
  const code = Object.keys(ERROR_MESSAGES).find((key) => message.includes(key));
  if (!code) return false;
  res.status(code === "ADMIN_REQUIRED" ? 403 : 400).json({ error: ERROR_MESSAGES[code] });
  return true;
}

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const q = (req: ApiRequest, key: string) => {
  const raw = Array.isArray(req.query?.[key]) ? req.query?.[key]?.[0] : req.query?.[key];
  return typeof raw === "string" ? raw.trim() : "";
};

// GET  ?          → 課程列表
// GET  ?id=X      → 該課程的單元
// POST {course}   → 新增／編輯課程
// PUT  {courseId, lessons[]} → 整批儲存單元（先解析 YouTube 網址，認不出來整批擋）
// DELETE ?id=X    → 刪課程
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const method = req.method ?? "GET";
  if (!["GET", "POST", "PUT", "DELETE"].includes(method)) {
    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }
  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });
  const supabase = getSupabaseAdmin();

  if (method === "GET") {
    const courseId = q(req, "id");
    if (courseId) {
      const { data, error } = await supabase.rpc("admin_list_lessons", {
        p_admin_user_id: user.id,
        p_course_id: courseId,
      });
      if (fail(res, error?.message)) return;
      if (error) {
        console.error("Unable to list lessons:", error.message);
        return res.status(500).json({ error: "單元暫時無法載入。" });
      }
      return res.status(200).json(
        (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          youtubeId: row.youtube_id,
          durationSec: row.duration_sec,
          sortOrder: row.sort_order,
          isFreePreview: row.is_free_preview,
        })),
      );
    }

    const { data, error } = await supabase.rpc("admin_list_courses", { p_admin_user_id: user.id });
    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to list admin courses:", error.message);
      return res.status(500).json({ error: "課程列表暫時無法載入。" });
    }
    return res.status(200).json(
      (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        status: row.status,
        sortOrder: row.sort_order,
        lessonCount: row.lesson_count,
        studentCount: row.student_count,
        updatedAt: row.updated_at,
      })),
    );
  }

  if (method === "POST") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = str(body.status, "draft");
    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({ error: "課程狀態不正確。" });
    }
    const { data, error } = await supabase.rpc("admin_upsert_course", {
      p_admin_user_id: user.id,
      p_id: str(body.id).trim(),
      p_title: str(body.title).trim(),
      p_description: str(body.description),
      p_cover_image_url: str(body.coverImageUrl),
      p_status: status,
      p_sort_order: Number.isInteger(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    });
    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to save course:", error.message);
      return res.status(400).json({ error: "課程儲存失敗，請檢查各欄位長度是否超過限制。" });
    }
    return res.status(200).json({ id: data });
  }

  if (method === "PUT") {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const courseId = str(body.courseId).trim();
    const raw = Array.isArray(body.lessons) ? (body.lessons as Record<string, unknown>[]) : null;
    if (!courseId || !raw) return res.status(400).json({ error: "缺少課程代碼或單元資料。" });

    // 在這裡把網址解析成 ID。任何一筆認不出來就整批拒絕並指出是第幾個單元，
    // 不讓一串垃圾進資料庫等播放時才壞。
    const lessons: Record<string, unknown>[] = [];
    for (let i = 0; i < raw.length; i += 1) {
      const item = raw[i];
      const title = str(item.title).trim();
      if (!title) return res.status(400).json({ error: `第 ${i + 1} 個單元缺少標題。` });
      const youtubeInput = str(item.youtubeUrl).trim();
      let youtubeId: string | null = null;
      if (youtubeInput) {
        youtubeId = parseYouTubeId(youtubeInput);
        if (!youtubeId) {
          return res.status(400).json({
            error: `第 ${i + 1} 個單元「${title}」的 YouTube 網址無法辨識，請貼上 youtube.com/watch?v=… 或 youtu.be/… 的連結。`,
          });
        }
      }
      lessons.push({
        id: str(item.id) || undefined,
        title,
        body: str(item.body),
        youtubeId: youtubeId ?? "",
        durationSec: Math.max(0, Math.floor(Number(item.durationSec) || 0)),
        sortOrder: i + 1,
        isFreePreview: item.isFreePreview === true,
      });
    }

    const { data, error } = await supabase.rpc("admin_upsert_lessons", {
      p_admin_user_id: user.id,
      p_course_id: courseId,
      p_lessons: lessons,
    });
    if (fail(res, error?.message)) return;
    if (error) {
      console.error("Unable to save lessons:", error.message);
      return res.status(400).json({ error: "單元儲存失敗，請檢查各欄位。" });
    }
    return res.status(200).json({ count: data });
  }

  const courseId = q(req, "id");
  if (!courseId) return res.status(400).json({ error: "缺少課程代碼。" });
  const { data, error } = await supabase.rpc("admin_delete_course", {
    p_admin_user_id: user.id,
    p_course_id: courseId,
  });
  if (fail(res, error?.message)) return;
  if (error) {
    console.error("Unable to delete course:", error.message);
    return res.status(500).json({ error: "課程刪除失敗。" });
  }
  const row = Array.isArray(data) ? data[0] : data;
  return res.status(200).json({
    deletedLessons: row?.deleted_lessons ?? 0,
    deletedEnrollments: row?.deleted_enrollments ?? 0,
  });
}
