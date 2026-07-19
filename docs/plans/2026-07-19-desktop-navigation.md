# Desktop Navigation Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove secondary links from the Header, prevent desktop horizontal menu scrolling, and place the three secondary services in the renamed Footer section.

**Architecture:** Keep the existing hash navigation and component structure. Change only the Header menu data and responsive utility classes, then narrow the Footer link list without changing navigation IDs.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner, Vite

---

### Task 1: Add navigation regression coverage

**Files:**
- Create: `tests/navigation-layout.test.mjs`
- Inspect: `src/components/Header.tsx`
- Inspect: `src/components/Footer.tsx`

**Step 1: Write the failing test**

Read both components and assert:

- Header menu data contains only `home`, `mascots`, `welfare`, and `shield`.
- Header still contains `header-quick-chat-btn`.
- Header navigation has desktop non-scrolling classes and desktop-hidden gradients.
- Footer heading is `更多服務`.
- Footer service list contains only `quiz`, `chat`, and `report`.

**Step 2: Run test to verify it fails**

Run: `node --test tests/navigation-layout.test.mjs`

Expected: FAIL because the Header still contains seven menu items, desktop scrolling remains active, and the Footer still says 快速巡邏.

### Task 2: Implement the minimal responsive navigation change

**Files:**
- Modify: `src/components/Header.tsx:13-84`
- Modify: `src/components/Footer.tsx:37-77`
- Test: `tests/navigation-layout.test.mjs`

**Step 1: Update the Header**

- Remove `quiz`, `chat`, and `report` from `menuItems`.
- Add `lg:overflow-visible` to the navigation wrapper.
- Hide both scroll-edge gradients at `lg`.
- Add `lg:overflow-visible`, `lg:snap-none`, and `lg:px-0` to the navigation.

**Step 2: Update the Footer**

- Rename the heading to `更多服務`.
- Remove the primary navigation links.
- Retain only buttons navigating to `quiz`, `chat`, and `report`.

**Step 3: Run the focused test**

Run: `node --test tests/navigation-layout.test.mjs`

Expected: PASS.

### Task 3: Verify and publish

**Files:**
- Verify: `src/components/Header.tsx`
- Verify: `src/components/Footer.tsx`
- Verify: `tests/navigation-layout.test.mjs`

**Step 1: Run complete verification**

Run:

```bash
npx tsx --test tests/*.test.*
npm run lint
npm run build
git diff --check
```

Expected: all commands exit successfully.

**Step 2: Inspect desktop layout locally**

At a desktop viewport, verify the Header shows four primary links with no horizontal scrolling and the Footer shows the three 更多服務 links.

**Step 3: Commit and push**

```bash
git add src/components/Header.tsx src/components/Footer.tsx tests/navigation-layout.test.mjs docs/plans/2026-07-19-desktop-navigation.md
git commit -m "fix: simplify desktop navigation"
git push origin HEAD:main
```

**Step 4: Verify production**

Wait for the Vercel production deployment, assign `beunion.vercel.app` to the new deployment if needed, and repeat the desktop Header/Footer inspection.
