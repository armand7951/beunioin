# Guardian Events Registration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish the approved guardian-event posters and replace the broken Vercel JSON registration flow with persistent, validated Supabase-backed registration.

**Architecture:** Vercel Functions preserve the existing `/api/events` client contract and call Supabase with server-side environment configuration. PostgreSQL tables, RLS, constraints, and an atomic registration function protect attendee data and prevent duplicate, closed, ended, or over-capacity registrations.

**Tech Stack:** React 19, TypeScript, Vite, Vercel Functions, Supabase Postgres, Node test runner

---

### Task 1: Capture approved event behavior in tests

**Files:**
- Create: `tests/guardian-events.test.mjs`
- Create: `src/lib/eventStatus.ts`
- Modify: `src/components/EventCalendar.tsx`

**Step 1: Write failing tests**

Add tests that require the four approved activity IDs, local poster paths, and an exported status helper that returns `ended`, `full`, `closed`, or `open`.

**Step 2: Run tests and verify RED**

Run: `node --test tests/guardian-events.test.mjs`

Expected: FAIL because the seeded activity data and status helper do not exist.

**Step 3: Implement the smallest status helper**

Use an explicit `endsAt` value and `registrationOpen` flag. Do not infer completion from the browser's locale-formatted date.

**Step 4: Run tests and verify GREEN**

Run: `node --test tests/guardian-events.test.mjs`

Expected: PASS.

**Step 5: Commit**

```bash
git add tests/guardian-events.test.mjs src/lib/eventStatus.ts src/components/EventCalendar.tsx
git commit -m "test: specify guardian event status behavior"
```

### Task 2: Create the Supabase schema and seed data

**Files:**
- Create: `supabase/migrations/<generated_timestamp>_guardian_events_registration.sql`
- Create: `supabase/seed.sql`
- Test: database SQL assertions executed through Supabase

**Step 1: Generate the migration file**

Run: `supabase migration new guardian_events_registration`

Expected: a timestamped migration file created by the CLI.

**Step 2: Write schema assertions before applying DDL**

Query `information_schema.tables` and confirm `events` and `event_registrations` are absent.

**Step 3: Implement schema and security**

Create:

- `public.events` with validated capacity/count fields.
- `public.event_registrations` with length checks and a unique `(event_id, normalized_email)` constraint.
- RLS that permits public event reads but no public registration reads.
- A restricted atomic registration database function that locks the selected event, validates status/capacity, inserts the registration, and increments the count.

Explicitly grant only required Data API permissions because April 2026 Supabase projects no longer expose new tables automatically.

**Step 4: Apply and verify**

Apply the migration, seed the four approved activities, query them back, test one temporary registration, verify duplicate/ended/full rejection, then remove the temporary data.

**Step 5: Run security and performance advisors**

Use Supabase security and performance advisors. Resolve new findings related to these tables/functions.

**Step 6: Commit**

```bash
git add supabase
git commit -m "feat: add secure guardian event database"
```

### Task 3: Add Vercel event APIs

**Files:**
- Create: `api/events/index.ts`
- Create: `api/events/[id]/register.ts`
- Create: `api/lib/supabase.ts`
- Create: `api/lib/registration.ts`
- Create: `tests/registration-api.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Write failing API tests**

Test input trimming, required fields, valid Email/phone formats, maximum lengths, known database error mapping, and safe responses that never expose internal error details.

**Step 2: Run tests and verify RED**

Run: `node --test tests/registration-api.test.mjs`

Expected: FAIL because validation and handlers are missing.

**Step 3: Install a pinned Supabase client**

Run: `npm install --save-exact @supabase/supabase-js@<verified-current-version>`

Commit the lockfile so deployed dependency resolution is reproducible.

**Step 4: Implement API functions**

Initialize the server client with `SUPABASE_URL` and a server-only key, disable auth persistence, and return consistent JSON/status codes. The registration endpoint calls the atomic database operation rather than issuing separate count and insert requests.

**Step 5: Run tests and verify GREEN**

Run: `node --test tests/registration-api.test.mjs`

Expected: PASS.

**Step 6: Commit**

```bash
git add api package.json package-lock.json tests/registration-api.test.mjs
git commit -m "feat: add persistent event registration API"
```

### Task 4: Publish posters and update the event UI

**Files:**
- Create: `public/events/62603.png`
- Create: `public/events/62607.jpg`
- Create: `public/events/EDM1.jpg`
- Modify: `src/components/EventCalendar.tsx`
- Modify: `tests/guardian-events.test.mjs`

**Step 1: Copy the original approved poster files**

Copy the three user-provided originals without recompression or AI regeneration. Verify dimensions and SHA-256 hashes.

**Step 2: Write the failing UI assertions**

Require local `/events/...` sources, an ended badge, disabled ended registration button, loading failure state, and accessible image alternative text.

**Step 3: Run tests and verify RED**

Run: `node --test tests/guardian-events.test.mjs`

Expected: FAIL on missing poster/UI behavior.

**Step 4: Implement the event cards**

Render all event statuses through the shared helper. Use `object-contain` for portrait posters so text is not cropped. Keep the existing responsive card layout and registration modal.

**Step 5: Run tests and verify GREEN**

Run: `node --test tests/guardian-events.test.mjs`

Expected: PASS.

**Step 6: Commit**

```bash
git add public/events src/components/EventCalendar.tsx tests/guardian-events.test.mjs
git commit -m "feat: publish guardian event posters"
```

### Task 5: Configure and verify deployment

**Files:**
- Modify only Vercel project environment configuration; do not commit secrets.

**Step 1: Configure environment variables**

Set `SUPABASE_URL` and the required server-side Supabase key for Preview and Production in the existing BeUnion Vercel project.

**Step 2: Run the complete local verification gate**

Run:

```bash
node --test tests/*.test.mjs
npm run lint
npm run build
git diff --check
```

Expected: all commands exit 0.

**Step 3: Push safely**

Fetch `origin/main`, ensure the new commits apply without overwriting newer work, then push the reviewed branch to `main`.

**Step 4: Verify Vercel production**

Confirm:

- `/api/events` returns the four seeded events.
- All three poster files return HTTP 200 and match local hashes.
- The 7/19 card displays ended and cannot submit.
- A temporary test event accepts one registration, rejects a duplicate, and is cleaned up afterward.

**Step 5: Commit or report**

No deployment-only secrets are committed. Report the final commit SHA, production URL, test counts, and any remaining limitation.
