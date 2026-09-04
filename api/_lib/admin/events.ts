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

// RPC 丟回來的是給機器看的代號（見 20260905000000）。後台使用者要看的是中文，
// 而且訊息要講清楚下一步該做什麼，不是只說「失敗」。
const ERROR_MESSAGES: Record<string, string> = {
  ADMIN_REQUIRED: "此帳號沒有管理員權限。",
  EVENT_ID_REQUIRED: "活動代碼不可空白。",
  END_BEFORE_START: "結束時間必須晚於開始時間。",
  SEATS_BELOW_REGISTERED: "名額不能少於目前已報名人數。",
  EVENT_NOT_FOUND: "找不到這場活動，可能已被其他人刪除。",
};

function describe(message: string | undefined) {
  if (!message) return null;
  const code = Object.keys(ERROR_MESSAGES).find((key) => message.includes(key));
  return code ? { code, text: ERROR_MESSAGES[code] } : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

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
    const { data, error } = await supabase.rpc("admin_list_events", {
      p_admin_user_id: user.id,
    });
    const known = describe(error?.message);
    if (known) {
      return res
        .status(known.code === "ADMIN_REQUIRED" ? 403 : 400)
        .json({ error: known.text });
    }
    if (error) {
      console.error("Unable to load admin events:", error.message);
      return res.status(500).json({ error: "活動資料暫時無法載入。" });
    }

    return res.status(200).json(
      (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        date: row.event_date,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        time: row.time_label,
        location: row.location,
        lecturer: row.lecturer,
        description: row.description,
        maxSeats: row.max_seats,
        registeredCount: row.registered_count,
        actualRegistrations: row.actual_registrations,
        imageUrl: row.image_url,
        registrationOpen: row.registration_open,
        lifecycleStatus: row.lifecycle_status,
        isPublished: row.is_published,
        updatedAt: row.updated_at,
      })),
    );
  }

  if (method === "POST") {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const maxSeats = Number(body.maxSeats);
    if (!Number.isInteger(maxSeats) || maxSeats < 1 || maxSeats > 10000) {
      return res.status(400).json({ error: "名額必須是 1 到 10000 之間的整數。" });
    }

    const lifecycleStatus = asString(body.lifecycleStatus, "scheduled");
    if (!["scheduled", "ended", "cancelled"].includes(lifecycleStatus)) {
      return res.status(400).json({ error: "活動狀態不正確。" });
    }

    const { data, error } = await supabase.rpc("admin_upsert_event", {
      p_admin_user_id: user.id,
      p_id: asString(body.id).trim(),
      p_title: asString(body.title).trim(),
      p_event_date: asString(body.date),
      p_starts_at: asString(body.startsAt),
      p_ends_at: asString(body.endsAt),
      p_time_label: asString(body.time).trim(),
      p_location: asString(body.location).trim(),
      p_lecturer: asString(body.lecturer),
      p_description: asString(body.description),
      p_max_seats: maxSeats,
      p_image_url: asString(body.imageUrl),
      p_registration_open: body.registrationOpen !== false,
      p_lifecycle_status: lifecycleStatus,
      p_is_published: body.isPublished === true,
    });

    const known = describe(error?.message);
    if (known) {
      return res
        .status(known.code === "ADMIN_REQUIRED" ? 403 : 400)
        .json({ error: known.text });
    }
    if (error) {
      console.error("Unable to save event:", error.message);
      // CHECK 約束（標題長度、地點長度…）的原文對使用者沒有意義，但也不能吞掉，
      // 否則後台只會看到「儲存失敗」而查不出是哪個欄位。
      return res.status(400).json({ error: "活動儲存失敗，請檢查各欄位長度是否超過限制。" });
    }

    return res.status(200).json({ id: data });
  }

  const eventId = asString(
    Array.isArray(req.query?.id) ? req.query?.id[0] : req.query?.id,
  ).trim();
  if (!eventId) {
    return res.status(400).json({ error: "缺少活動代碼。" });
  }

  const { data, error } = await supabase.rpc("admin_delete_event", {
    p_admin_user_id: user.id,
    p_event_id: eventId,
  });

  const known = describe(error?.message);
  if (known) {
    return res
      .status(known.code === "ADMIN_REQUIRED" ? 403 : 400)
      .json({ error: known.text });
  }
  if (error) {
    console.error("Unable to delete event:", error.message);
    return res.status(500).json({ error: "活動刪除失敗。" });
  }

  return res.status(200).json({ deletedRegistrations: data ?? 0 });
}
