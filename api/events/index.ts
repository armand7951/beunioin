import { getSupabaseAdmin } from "../lib/supabase.js";

interface ApiRequest {
  method?: string;
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

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("events")
      .select(
        "id,title,event_date,starts_at,ends_at,time_label,location,lecturer,description,max_seats,registered_count,image_url,registration_open,lifecycle_status",
      )
      .order("event_date", { ascending: true });

    if (error) {
      throw error;
    }

    const events = (data ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      date: event.event_date,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      time: event.time_label,
      location: event.location,
      lecturer: event.lecturer,
      description: event.description,
      maxSeats: event.max_seats,
      registeredCount: event.registered_count,
      imageUrl: event.image_url,
      registrationOpen: event.registration_open,
      lifecycleStatus: event.lifecycle_status,
    }));

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60",
    );
    return res.status(200).json(events);
  } catch (error) {
    console.error("Unable to load guardian events:", error);
    return res
      .status(500)
      .json({ error: "活動資料暫時無法載入，請稍候再試。" });
  }
}
