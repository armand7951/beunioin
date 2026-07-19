# Contact Form Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Shield Hub contact information panel with a secure contact form that emails submissions to `volt02332@gmail.com` through Resend.

**Architecture:** A React controlled form posts JSON to a Vercel function at `/api/contact`. Shared server helpers validate and normalize input, detect the honeypot, and create a plain-text Resend payload; the API owns the Resend secret and returns safe public errors.

**Tech Stack:** React 19, TypeScript, Vercel Functions, Resend REST API, Node test runner, Tailwind CSS.

---

### Task 1: Contact payload validation

**Files:**
- Create: `api/lib/contact.ts`
- Create: `tests/contact-api.test.ts`

**Step 1: Write the failing tests**

Add tests proving that:

```ts
validateContactPayload({
  name: " 王小明 ",
  email: " USER@example.com ",
  phone: " 0912-345-678 ",
  message: " 生態調查員 ",
  website: "",
})
```

returns trimmed fields and a lowercase Email. Add separate tests for missing required fields, malformed Email/phone, oversized input, and a filled honeypot.

**Step 2: Run the tests and verify RED**

Run:

```bash
npx tsx --test tests/contact-api.test.ts
```

Expected: FAIL because `api/lib/contact.ts` does not exist.

**Step 3: Implement minimal validation**

Create `validateContactPayload(input: unknown)` with:

- plain-object enforcement;
- required name, Email and phone;
- maximum lengths of 100, 254, 30 and 2,000 characters;
- basic Email and phone allow-list patterns;
- whitespace trimming and Email lowercasing;
- a `spam: true` success result when `website` is filled.

Also export `buildContactEmail()` to create a plain-text subject/body and `Reply-To` value without interpolating visitor data into HTML.

**Step 4: Verify GREEN**

Run:

```bash
npx tsx --test tests/contact-api.test.ts
```

Expected: all contact validation tests PASS.

**Step 5: Commit**

```bash
git add api/lib/contact.ts tests/contact-api.test.ts
git commit -m "feat: validate contact submissions"
```

### Task 2: Resend-backed contact API

**Files:**
- Create: `api/contact.ts`
- Modify: `tests/contact-api.test.ts`
- Modify: `.env.example`

**Step 1: Write failing handler tests**

Test the handler with small request/response fakes and a stubbed `globalThis.fetch`. Cover:

- non-POST requests return `405`;
- invalid JSON data returns `400`;
- honeypot data returns success without calling Resend;
- missing `RESEND_API_KEY` returns a safe `500`;
- a valid request calls `https://api.resend.com/emails` with the recipient `volt02332@gmail.com`;
- a non-success Resend response returns a safe `502`.

**Step 2: Run the tests and verify RED**

Run:

```bash
npx tsx --test tests/contact-api.test.ts
```

Expected: FAIL because `api/contact.ts` does not exist.

**Step 3: Implement the endpoint**

Create a Vercel handler that:

```ts
if (req.method !== "POST") {
  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "不支援此請求方式。" });
}
```

Then validate the body, silently accept spam, require `RESEND_API_KEY`, call Resend with `Authorization: Bearer ...`, use the verified sender from `CONTACT_FROM_EMAIL` with a safe default, set `reply_to` to the visitor Email, and return only localized generic errors.

Document `RESEND_API_KEY` and optional `CONTACT_FROM_EMAIL` names in `.env.example` without values.

**Step 4: Verify GREEN**

Run:

```bash
npx tsx --test tests/contact-api.test.ts
```

Expected: all endpoint tests PASS.

**Step 5: Commit**

```bash
git add api/contact.ts api/lib/contact.ts tests/contact-api.test.ts .env.example
git commit -m "feat: send contact messages through Resend"
```

### Task 3: Contact form UI

**Files:**
- Modify: `src/components/ShieldHub.tsx`
- Create: `tests/contact-form-ui.test.mjs`

**Step 1: Write the failing UI source test**

Assert that `ShieldHub.tsx` contains:

- labels for 姓名, Email, 手機號碼 and 目前從事的工作／聯絡內容;
- `fetch("/api/contact"` and `method: "POST"`;
- the honeypot field named `website`;
- success and error state copy;
- `volt02332@gmail.com`;
- no old three-card-only contact layout copy.

**Step 2: Run the test and verify RED**

Run:

```bash
node --test tests/contact-form-ui.test.mjs
```

Expected: FAIL because the contact form is not present.

**Step 3: Implement the form**

Add contact form state and a submit handler to `ShieldHub`. Replace the contact tab body with:

- a two-column responsive layout;
- accessible labels and required attributes;
- controlled inputs and hidden honeypot;
- disabled/loading submit button;
- `role="status"` success feedback and `role="alert"` error feedback;
- a compact contact-information card containing the telephone and `volt02332@gmail.com`.

Client validation improves feedback, but the API remains authoritative.

**Step 4: Verify GREEN**

Run:

```bash
node --test tests/contact-form-ui.test.mjs
npx tsx --test tests/contact-api.test.ts
```

Expected: both test files PASS.

**Step 5: Commit**

```bash
git add src/components/ShieldHub.tsx tests/contact-form-ui.test.mjs
git commit -m "feat: add Shield Hub contact form"
```

### Task 4: Security and production verification

**Files:**
- Review: `api/contact.ts`
- Review: `api/lib/contact.ts`
- Review: `src/components/ShieldHub.tsx`

**Step 1: Run the full verification suite**

```bash
node --test tests/*.test.mjs
npx tsx --test tests/*.test.ts
npm run lint
npm run build
```

Expected: all tests pass, TypeScript reports no errors, and the production build succeeds.

**Step 2: Review security boundaries**

Confirm no secrets are in source or built frontend assets, visitor data is never rendered as HTML, public errors do not include Resend responses, and the honeypot plus length/format restrictions are active.

**Step 3: Push and deploy**

```bash
git push origin HEAD:main
npx vercel ls beunion --yes
npx vercel inspect <deployment-url> --wait --timeout 2m
npx vercel alias set <deployment-url> beunion.vercel.app
```

**Step 4: Verify production**

Open `https://beunion.vercel.app/shield`, select 「聯絡我們」, verify desktop and mobile layouts, validate empty/error states, and confirm the production API rejects malformed data. Do not send a real visitor message during automated verification.
