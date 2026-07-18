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
