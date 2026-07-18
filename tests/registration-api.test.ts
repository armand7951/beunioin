import assert from "node:assert/strict";
import test from "node:test";

import {
  mapRegistrationError,
  validateRegistrationPayload,
} from "../api/lib/registration";

test("registration input is trimmed and normalized", () => {
  assert.deepEqual(
    validateRegistrationPayload({
      name: "  王小明 ",
      email: " USER@example.com ",
      phone: " 0912-345-678 ",
      volunteerType: "animal",
      notes: "  素食 ",
    }),
    {
      ok: true,
      value: {
        name: "王小明",
        email: "user@example.com",
        phone: "0912-345-678",
        volunteerType: "animal",
        notes: "素食",
      },
    },
  );
});

test("required registration fields are rejected", () => {
  const result = validateRegistrationPayload({
    name: "",
    email: "",
    phone: "",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
    assert.match(result.error, /姓名、Email 與聯絡電話/);
  }
});

test("invalid email and phone formats are rejected", () => {
  const invalidEmail = validateRegistrationPayload({
    name: "王小明",
    email: "not-an-email",
    phone: "0912-345-678",
  });
  const invalidPhone = validateRegistrationPayload({
    name: "王小明",
    email: "user@example.com",
    phone: "call-me",
  });

  assert.equal(invalidEmail.ok, false);
  assert.equal(invalidPhone.ok, false);
});

test("oversized input is rejected", () => {
  const result = validateRegistrationPayload({
    name: "王".repeat(101),
    email: "user@example.com",
    phone: "0912-345-678",
    notes: "a".repeat(501),
  });

  assert.equal(result.ok, false);
});

test("database registration errors map to safe client responses", () => {
  assert.deepEqual(mapRegistrationError("EVENT_NOT_FOUND"), {
    status: 404,
    error: "找不到該活動。",
  });
  assert.deepEqual(mapRegistrationError("EVENT_ENDED"), {
    status: 409,
    error: "此活動已結束，無法再報名。",
  });
  assert.deepEqual(mapRegistrationError("REGISTRATION_CLOSED"), {
    status: 409,
    error: "此活動目前未開放報名。",
  });
  assert.deepEqual(mapRegistrationError("EVENT_FULL"), {
    status: 409,
    error: "抱歉，此活動報名名額已滿。",
  });
  assert.deepEqual(mapRegistrationError("DUPLICATE_REGISTRATION"), {
    status: 409,
    error: "這個 Email 已經報名過此活動。",
  });
  assert.deepEqual(mapRegistrationError("internal database details"), {
    status: 500,
    error: "報名暫時無法完成，請稍候再試。",
  });
});
