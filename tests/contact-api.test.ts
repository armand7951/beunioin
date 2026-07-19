import assert from "node:assert/strict";
import test from "node:test";

import {
  buildContactEmail,
  validateContactPayload,
} from "../api/lib/contact";

test("contact input is trimmed and normalized", () => {
  assert.deepEqual(
    validateContactPayload({
      name: "  王小明 ",
      email: " USER@example.com ",
      phone: " 0912-345-678 ",
      message: "  生態調查員 ",
      website: "",
    }),
    {
      ok: true,
      spam: false,
      value: {
        name: "王小明",
        email: "user@example.com",
        phone: "0912-345-678",
        message: "生態調查員",
      },
    },
  );
});

test("required contact fields are rejected", () => {
  const result = validateContactPayload({
    name: "",
    email: "",
    phone: "",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
    assert.match(result.error, /姓名、Email 與手機號碼/);
  }
});

test("invalid contact email and phone formats are rejected", () => {
  const invalidEmail = validateContactPayload({
    name: "王小明",
    email: "not-an-email",
    phone: "0912-345-678",
  });
  const invalidPhone = validateContactPayload({
    name: "王小明",
    email: "user@example.com",
    phone: "call-me",
  });

  assert.equal(invalidEmail.ok, false);
  assert.equal(invalidPhone.ok, false);
});

test("oversized contact input is rejected", () => {
  const result = validateContactPayload({
    name: "王".repeat(101),
    email: "user@example.com",
    phone: "0912-345-678",
    message: "a".repeat(2001),
  });

  assert.equal(result.ok, false);
});

test("filled honeypot is accepted as spam without exposing detection", () => {
  assert.deepEqual(
    validateContactPayload({
      name: "Robot",
      email: "robot@example.com",
      phone: "0912-345-678",
      website: "https://spam.invalid",
    }),
    { ok: true, spam: true },
  );
});

test("contact email is plain text and uses the visitor as reply-to", () => {
  const email = buildContactEmail({
    name: "<王小明>",
    email: "user@example.com",
    phone: "0912-345-678",
    message: "<script>alert(1)</script>",
  });

  assert.equal(email.replyTo, "user@example.com");
  assert.match(email.subject, /王小明/);
  assert.match(email.text, /<script>alert\(1\)<\/script>/);
  assert.equal("html" in email, false);
});
