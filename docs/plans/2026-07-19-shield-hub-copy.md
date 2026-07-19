# Shield Hub Copy Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Shield Hub introductory badge and heading with the approved copy.

**Architecture:** Keep the component and styles unchanged. Use a source regression test to verify the exact new strings and removal of the two replaced phrases.

**Tech Stack:** React, TypeScript, Node test runner, Vite

---

### Task 1: Add the copy regression test

**Files:**
- Create: `tests/shield-hub-copy.test.mjs`
- Inspect: `src/components/ShieldHub.tsx:45-60`

**Step 1: Write a failing test**

Assert that `ShieldHub.tsx` contains:

- `BeUnion • 台灣環境生態護育產業工會`
- `我們保護為萬物挺身而出的人`

Assert that it does not contain:

- `官網資訊庫`
- `我們將`

**Step 2: Verify failure**

Run: `node --test tests/shield-hub-copy.test.mjs`

Expected: FAIL because the old copy is still present.

### Task 2: Replace only the approved copy

**Files:**
- Modify: `src/components/ShieldHub.tsx:45-60`
- Test: `tests/shield-hub-copy.test.mjs`

**Step 1: Update the badge and heading**

Keep the existing wrapper classes and replace the two text blocks exactly.
Remove the nested `beunion.tw` underline span because it is no longer part of
the heading.

**Step 2: Verify the focused test**

Run: `node --test tests/shield-hub-copy.test.mjs`

Expected: PASS.

### Task 3: Verify and publish

**Step 1: Run complete verification**

```bash
npx tsx --test tests/*.test.*
npm run lint
npm run build
git diff --check
```

Expected: all commands exit successfully.

**Step 2: Commit and push**

```bash
git add src/components/ShieldHub.tsx tests/shield-hub-copy.test.mjs docs/plans/2026-07-19-shield-hub-copy.md
git commit -m "fix: update shield hub headline"
git push origin HEAD:main
```

**Step 3: Verify production**

Wait for Vercel, update the `beunion.vercel.app` alias if needed, open
`/shield`, and confirm both new strings are visible.
