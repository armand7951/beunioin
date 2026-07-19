import assert from "node:assert/strict";
import test from "node:test";

import {
  buildContactEmail,
  validateContactPayload,
} from "../api/lib/contact";
import contactHandler from "../api/contact";

interface CapturedResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

function createResponse() {
  const captured: CapturedResponse = {
    statusCode: 200,
    body: undefined,
    headers: {},
  };

  const response = {
    setHeader(name: string, value: string) {
      captured.headers[name] = value;
    },
    status(code: number) {
      captured.statusCode = code;
      return response;
    },
    json(body: unknown) {
      captured.body = body;
    },
  };

  return { captured, response };
}

async function withMutedConsoleError(run: () => Promise<void>) {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await run();
  } finally {
    console.error = originalConsoleError;
  }
}

const validRequest = {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "content-length": "128",
  },
  body: {
    name: "王小明",
    email: "user@example.com",
    phone: "0912-345-678",
    message: "生態調查員",
    website: "",
  },
};

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

test("contact endpoint rejects non-POST requests", async () => {
  const { captured, response } = createResponse();

  await contactHandler(
    { method: "GET", headers: {}, body: undefined },
    response,
  );

  assert.equal(captured.statusCode, 405);
  assert.equal(captured.headers.Allow, "POST");
});

test("contact endpoint rejects invalid submissions", async () => {
  const { captured, response } = createResponse();

  await contactHandler(
    {
      ...validRequest,
      body: { ...validRequest.body, email: "invalid" },
    },
    response,
  );

  assert.equal(captured.statusCode, 400);
});

test("contact endpoint silently accepts honeypot spam", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  try {
    const { captured, response } = createResponse();
    await contactHandler(
      {
        ...validRequest,
        body: { ...validRequest.body, website: "https://spam.invalid" },
      },
      response,
    );

    assert.equal(captured.statusCode, 200);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("contact endpoint requires the Resend server key", async () => {
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    await withMutedConsoleError(async () => {
      const { captured, response } = createResponse();
      await contactHandler(validRequest, response);
      assert.equal(captured.statusCode, 500);
      assert.deepEqual(captured.body, {
        error: "聯絡表單暫時無法送出，請稍後再試。",
      });
    });
  } finally {
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  }
});

test("contact endpoint sends valid submissions to the union inbox", async () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = "test_resend_key";
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requestUrl = String(url);
    requestInit = init;
    return new Response(JSON.stringify({ id: "email_123" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const { captured, response } = createResponse();
    await contactHandler(validRequest, response);

    assert.equal(captured.statusCode, 200);
    assert.equal(requestUrl, "https://api.resend.com/emails");
    const payload = JSON.parse(String(requestInit?.body));
    assert.deepEqual(payload.to, ["volt02332@gmail.com"]);
    assert.equal(payload.reply_to, "user@example.com");
    assert.equal(typeof payload.text, "string");
    assert.equal("html" in payload, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
    else delete process.env.RESEND_API_KEY;
  }
});

test("contact endpoint maps Resend failures to a safe response", async () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = "test_resend_key";
  globalThis.fetch = (async () =>
    new Response("provider details", { status: 422 })) as typeof fetch;

  try {
    await withMutedConsoleError(async () => {
      const { captured, response } = createResponse();
      await contactHandler(validRequest, response);

      assert.equal(captured.statusCode, 502);
      assert.deepEqual(captured.body, {
        error: "訊息目前無法寄出，請稍後再試或直接來信。",
      });
      assert.doesNotMatch(JSON.stringify(captured.body), /provider details/);
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
    else delete process.env.RESEND_API_KEY;
  }
});
