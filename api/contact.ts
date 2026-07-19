import {
  buildContactEmail,
  validateContactPayload,
} from "./lib/contact.js";

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

const CONTACT_RECIPIENT = "volt02332@gmail.com";
const DEFAULT_FROM_EMAIL = "BeUnion 官網 <noreply@gathertaiwan.com>";
const MAX_REQUEST_BYTES = 16_384;

function getHeader(req: ApiRequest, name: string): string | undefined {
  const headers = req.headers ?? {};
  const value =
    headers[name] ??
    headers[name.toLowerCase()] ??
    headers[name.toUpperCase()];
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "不支援此請求方式。" });
  }

  const contentType = getHeader(req, "content-type");
  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    return res.status(415).json({ error: "請使用 JSON 格式送出表單。" });
  }

  const contentLength = Number(getHeader(req, "content-length") ?? 0);
  if (
    !Number.isFinite(contentLength) ||
    contentLength < 0 ||
    contentLength > MAX_REQUEST_BYTES
  ) {
    return res.status(413).json({ error: "聯絡內容過長，請縮短後再送出。" });
  }

  const validated = validateContactPayload(req.body);
  if (validated.ok === false) {
    return res
      .status(validated.status)
      .json({ error: validated.error });
  }

  if (validated.spam === true) {
    return res.status(200).json({ success: true });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("Contact form email service is not configured.");
    return res
      .status(500)
      .json({ error: "聯絡表單暫時無法送出，請稍後再試。" });
  }

  const email = buildContactEmail(validated.value);

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? DEFAULT_FROM_EMAIL,
        to: [CONTACT_RECIPIENT],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
      }),
    });

    if (!resendResponse.ok) {
      console.error(
        `Unable to send contact email: Resend returned ${resendResponse.status}.`,
      );
      return res
        .status(502)
        .json({ error: "訊息目前無法寄出，請稍後再試或直接來信。" });
    }

    return res.status(200).json({ success: true });
  } catch {
    console.error("Unable to send contact email: network request failed.");
    return res
      .status(502)
      .json({ error: "訊息目前無法寄出，請稍後再試或直接來信。" });
  }
}
