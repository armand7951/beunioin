const EMAIL_PATTERN =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const PHONE_PATTERN = /^[0-9+() -]+$/;
const VOLUNTEER_TYPES = new Set(["animal", "plant", "eco", "other"]);

export interface RegistrationInput {
  name: string;
  email: string;
  phone: string;
  volunteerType: "animal" | "plant" | "eco" | "other";
  notes: string;
}

export type RegistrationValidationResult =
  | { ok: true; value: RegistrationInput }
  | { ok: false; status: 400; error: string };

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRegistrationPayload(
  payload: unknown,
): RegistrationValidationResult {
  const body =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const name = textValue(body.name);
  const email = textValue(body.email).toLowerCase();
  const phone = textValue(body.phone);
  const notes = textValue(body.notes);
  const requestedVolunteerType = textValue(body.volunteerType);
  const volunteerType = VOLUNTEER_TYPES.has(requestedVolunteerType)
    ? (requestedVolunteerType as RegistrationInput["volunteerType"])
    : "other";

  if (!name || !email || !phone) {
    return {
      ok: false,
      status: 400,
      error: "請填寫姓名、Email 與聯絡電話。",
    };
  }

  if (name.length > 100) {
    return { ok: false, status: 400, error: "姓名不可超過 100 個字。" };
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, status: 400, error: "請輸入有效的 Email。" };
  }

  if (
    phone.length < 8 ||
    phone.length > 30 ||
    !PHONE_PATTERN.test(phone)
  ) {
    return { ok: false, status: 400, error: "請輸入有效的聯絡電話。" };
  }

  if (notes.length > 500) {
    return { ok: false, status: 400, error: "備註不可超過 500 個字。" };
  }

  return {
    ok: true,
    value: { name, email, phone, volunteerType, notes },
  };
}

const DATABASE_ERROR_RESPONSES: Record<
  string,
  { status: number; error: string }
> = {
  EVENT_NOT_FOUND: { status: 404, error: "找不到該活動。" },
  EVENT_ENDED: { status: 409, error: "此活動已結束，無法再報名。" },
  REGISTRATION_CLOSED: { status: 409, error: "此活動目前未開放報名。" },
  EVENT_FULL: { status: 409, error: "抱歉，此活動報名名額已滿。" },
  DUPLICATE_REGISTRATION: {
    status: 409,
    error: "這個 Email 已經報名過此活動。",
  },
};

export function mapRegistrationError(message: string): {
  status: number;
  error: string;
} {
  return (
    DATABASE_ERROR_RESPONSES[message] ?? {
      status: 500,
      error: "報名暫時無法完成，請稍候再試。",
    }
  );
}
