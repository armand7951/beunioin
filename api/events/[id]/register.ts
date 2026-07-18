import {
  mapRegistrationError,
  validateRegistrationPayload,
} from "../../lib/registration.js";
import { getSupabaseAdmin } from "../../lib/supabase.js";

interface ApiRequest {
  method?: string;
  query: { id?: string | string[] };
  body?: unknown;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }

  const eventId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!eventId || eventId.length > 120) {
    return res.status(400).json({ error: "活動代碼不正確。" });
  }

  const validated = validateRegistrationPayload(req.body);
  if (validated.ok === false) {
    return res.status(validated.status).json({ error: validated.error });
  }

  const { name, email, phone, volunteerType, notes } = validated.value;

  try {
    const { data, error } = await getSupabaseAdmin().rpc(
      "register_for_event",
      {
        p_event_id: eventId,
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_volunteer_type: volunteerType,
        p_notes: notes,
      },
    );

    if (error) {
      const mapped = mapRegistrationError(error.message);
      return res.status(mapped.status).json({ error: mapped.error });
    }

    const registration = data?.[0];
    return res.status(201).json({
      success: true,
      registrationId: registration?.registration_id,
      registeredCount: registration?.new_registered_count,
    });
  } catch (error) {
    console.error("Unable to register for guardian event:", error);
    return res
      .status(500)
      .json({ error: "報名暫時無法完成，請稍候再試。" });
  }
}
