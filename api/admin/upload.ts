import { getVerifiedUser } from "../lib/auth.js";
import { getSupabaseAdmin } from "../lib/supabase.js";

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

const BUCKET = "event-images";

// 副檔名由 MIME 決定，不採信使用者送來的檔名。檔名可以是 "x.png" 但內容其實是
// SVG（可夾帶 script），公開 bucket 直接把它當 image/svg+xml 回應就是一個 XSS。
// bucket 本身也設了 allowed_mime_types 作為第二道。
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

// Vercel 的請求 body 上限是 4.5MB，base64 會膨脹約 33%，所以原圖實際只能到 ~3.3MB。
// 這裡抓 3MB，前端也擋一次，讓使用者在選檔當下就知道，而不是等上傳失敗。
const MAX_BYTES = 3 * 1024 * 1024;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }

  const user = await getVerifiedUser(req.headers);
  if (!user) return res.status(401).json({ error: "請先登入。" });

  const supabase = getSupabaseAdmin();

  // 上傳走的是 service_role，繞過所有 storage policy，所以管理員身分必須在這裡
  // 自己確認 —— 只驗到「是登入者」是不夠的。
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin_user", {
    p_user_id: user.id,
  });
  if (adminError) {
    console.error("Unable to verify admin for upload:", adminError.message);
    return res.status(500).json({ error: "無法確認管理員權限。" });
  }
  if (isAdmin !== true) {
    return res.status(403).json({ error: "此帳號沒有管理員權限。" });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const base64 = typeof body.data === "string" ? body.data : "";

  const extension = EXTENSIONS[contentType];
  if (!extension) {
    return res.status(400).json({ error: "只接受 JPG、PNG、WebP、AVIF 或 GIF 圖片。" });
  }
  if (!base64) {
    return res.status(400).json({ error: "沒有收到圖片內容。" });
  }

  // 前端送的是 data URL，前綴要先剝掉才是真正的 base64。
  const payload = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(payload, "base64");
  } catch {
    return res.status(400).json({ error: "圖片內容格式不正確。" });
  }
  if (buffer.byteLength === 0) {
    return res.status(400).json({ error: "圖片內容是空的。" });
  }
  if (buffer.byteLength > MAX_BYTES) {
    return res.status(413).json({ error: "圖片超過 3MB，請先壓縮再上傳。" });
  }

  // 檔名不沿用原檔名：中文與空白在 URL 裡要跳脫，重複檔名會互相覆蓋，而原檔名
  // 本身也可能洩漏無關資訊。用隨機名，副檔名由 MIME 決定。
  const objectName = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectName, buffer, { contentType, upsert: false });

  if (uploadError) {
    console.error("Unable to upload event image:", uploadError.message);
    return res.status(500).json({ error: "圖片上傳失敗，請稍後再試。" });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectName);
  return res.status(200).json({ url: data.publicUrl });
}
