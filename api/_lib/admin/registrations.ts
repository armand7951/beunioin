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
  const method = req.method ?? "GET";
  if (method !== "GET" && method !== "DELETE") {
    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }

  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });

  // 取消報名。刪掉報名列與回收名額是同一句交易（admin_cancel_registration），
  // 不能拆成兩個 request，否則中間失敗會留下「人不見了但名額沒還」的髒資料。
  if (method === "DELETE") {
    const raw = Array.isArray(req.query?.id) ? req.query?.id[0] : req.query?.id;
    const registrationId = typeof raw === "string" ? raw.trim() : "";
    if (!registrationId) {
      return res.status(400).json({ error: "缺少報名編號。" });
    }

    const { data, error } = await getSupabaseAdmin().rpc(
      "admin_cancel_registration",
      { p_admin_user_id: user.id, p_registration_id: registrationId },
    );

    if (error?.message.includes("ADMIN_REQUIRED")) {
      return res.status(403).json({ error: "此帳號沒有管理員權限。" });
    }
    if (error?.message.includes("REGISTRATION_NOT_FOUND")) {
      return res.status(404).json({ error: "找不到這筆報名，可能已被取消。" });
    }
    if (error) {
      console.error("Unable to cancel registration:", error.message);
      return res.status(500).json({ error: "取消報名失敗。" });
    }

    const result = Array.isArray(data) ? data[0] : data;
    return res.status(200).json({
      eventId: result?.event_id ?? null,
      newRegisteredCount: result?.new_registered_count ?? null,
    });
  }

  const { data, error } = await getSupabaseAdmin().rpc(
    "list_event_registrations_for_admin",
    { p_admin_user_id: user.id },
  );
  if (error?.message.includes("ADMIN_REQUIRED")) {
    return res.status(403).json({ error: "此帳號沒有管理員權限。" });
  }
  if (error) {
    console.error("Unable to load admin registrations:", error.message);
    return res.status(500).json({ error: "報名名單暫時無法載入。" });
  }

  return res.status(200).json(
    (data ?? []).map((row) => ({
      id: row.id,
      eventId: row.event_id,
      eventTitle: row.event_title,
      eventDate: row.event_date,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      volunteerType: row.volunteer_type,
      notes: row.notes,
      registeredAt: row.registered_at,
    })),
  );
}
