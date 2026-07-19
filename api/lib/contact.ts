export interface ContactSubmission {
  name: string;
  email: string;
  phone: string;
  message: string;
}

type ContactValidationResult =
  | { ok: true; spam: true }
  | { ok: true; spam: false; value: ContactSubmission }
  | { ok: false; status: 400; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()#\-\s]{6,30}$/;

function readString(
  input: Record<string, unknown>,
  field: string,
): string | null {
  const value = input[field];
  return typeof value === "string" ? value.trim() : null;
}

export function validateContactPayload(
  input: unknown,
): ContactValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, status: 400, error: "聯絡資料格式不正確。" };
  }

  const fields = input as Record<string, unknown>;
  const website = readString(fields, "website");
  if (website) {
    return { ok: true, spam: true };
  }

  const name = readString(fields, "name");
  const email = readString(fields, "email")?.toLowerCase() ?? null;
  const phone = readString(fields, "phone");
  const message = readString(fields, "message") ?? "";

  if (!name || !email || !phone) {
    return {
      ok: false,
      status: 400,
      error: "請填寫姓名、Email 與手機號碼。",
    };
  }

  if (
    name.length > 100 ||
    email.length > 254 ||
    phone.length > 30 ||
    message.length > 2000
  ) {
    return {
      ok: false,
      status: 400,
      error: "部分欄位內容過長，請縮短後再送出。",
    };
  }

  if (/[\r\n]/.test(name) || !EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      status: 400,
      error: "請填寫有效的姓名與 Email。",
    };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return {
      ok: false,
      status: 400,
      error: "請填寫有效的手機號碼。",
    };
  }

  return {
    ok: true,
    spam: false,
    value: { name, email, phone, message },
  };
}

export function buildContactEmail(submission: ContactSubmission) {
  const safeSubjectName = submission.name.replace(/[\r\n<>]/g, "").trim();

  return {
    subject: `BeUnion 官網聯絡表單｜${safeSubjectName}`,
    replyTo: submission.email,
    text: [
      "BeUnion 官網收到新的聯絡表單",
      "",
      `姓名：${submission.name}`,
      `Email：${submission.email}`,
      `手機號碼：${submission.phone}`,
      "",
      "目前從事的工作／聯絡內容：",
      submission.message || "（未填寫）",
    ].join("\n"),
  };
}
