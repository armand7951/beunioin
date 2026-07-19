# Mobile Collapsing Header Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Collapse the mobile sticky Header to its brand block while scrolling down and restore the full Header while scrolling up.

**Architecture:** Put direction and distance-threshold behavior in a pure TypeScript state reducer so it can be tested without the browser. Header listens to passive scroll and resize events, applies the reducer only below 1024px, and animates mobile-only expandable areas while desktop overrides keep everything visible.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner through `tsx`, Vite

---

### Task 1: Test and implement scroll-direction state

**Files:**
- Create: `src/lib/mobileHeaderScroll.ts`
- Create: `tests/mobile-header-collapse.test.mjs`

**Step 1: Write the failing behavior tests**

Cover these sequences:

- The Header remains expanded at or near the top.
- Downward movement must accumulate at least 12px before collapse.
- Upward movement must accumulate at least 12px before expansion.
- Changing direction resets accumulated movement.
- Desktop input always returns an expanded state.

**Step 2: Run the focused test**

Run: `npx tsx --test tests/mobile-header-collapse.test.mjs`

Expected: FAIL because `src/lib/mobileHeaderScroll.ts` does not exist.

**Step 3: Implement the pure reducer**

Create:

```ts
export type ScrollDirection = "up" | "down" | null;

export interface MobileHeaderScrollState {
  lastY: number;
  direction: ScrollDirection;
  distance: number;
  collapsed: boolean;
}

export function createMobileHeaderScrollState(): MobileHeaderScrollState;

export function updateMobileHeaderScroll(
  state: MobileHeaderScrollState,
  currentY: number,
  isMobile: boolean,
  threshold?: number,
  topBoundary?: number,
): MobileHeaderScrollState;
```

Clamp negative positions, expand at the top, reset on desktop, accumulate movement
only in the current direction, and toggle only after the threshold.

**Step 4: Run the focused test**

Run: `npx tsx --test tests/mobile-header-collapse.test.mjs`

Expected: reducer behavior tests PASS while the component integration assertion still fails.

### Task 2: Integrate the mobile-only Header animation

**Files:**
- Modify: `src/components/Header.tsx`
- Test: `tests/mobile-header-collapse.test.mjs`

**Step 1: Add failing source integration assertions**

Assert that Header:

- Imports `createMobileHeaderScrollState` and `updateMobileHeaderScroll`.
- Registers passive `scroll` and `resize` listeners.
- Uses a `mobile-header-expandable` marker.
- Applies `lg:` visibility overrides so desktop remains expanded.

Run: `npx tsx --test tests/mobile-header-collapse.test.mjs`

Expected: integration assertion FAIL.

**Step 2: Implement minimal Header integration**

- Add `useEffect`, `useRef`, and `useState`.
- Update scroll state only when `window.innerWidth < 1024`.
- Keep the brand button visible in both states.
- Tighten mobile Header padding and logo height while collapsed.
- Animate the navigation and account areas with max-height, opacity, and transform.
- Use `lg:max-h-none lg:opacity-100 lg:pointer-events-auto lg:translate-y-0`.
- Add `motion-reduce:transition-none`.

**Step 3: Run the focused test**

Run: `npx tsx --test tests/mobile-header-collapse.test.mjs`

Expected: all focused tests PASS.

### Task 3: Verify and publish

**Files:**
- Verify: `src/lib/mobileHeaderScroll.ts`
- Verify: `src/components/Header.tsx`
- Verify: `tests/mobile-header-collapse.test.mjs`

**Step 1: Run complete verification**

```bash
npx tsx --test tests/*.test.*
npm run lint
npm run build
git diff --check
```

Expected: all commands exit successfully.

**Step 2: Inspect locally**

At a mobile viewport:

- At the top, the full Header is visible.
- After scrolling down, only the compact brand block remains.
- A small upward scroll below 12px does not expand it.
- Continued upward scrolling restores the full Header.

At a desktop viewport, verify the full Header remains visible regardless of
scroll direction.

**Step 3: Commit and push**

```bash
git add src/lib/mobileHeaderScroll.ts src/components/Header.tsx tests/mobile-header-collapse.test.mjs docs/plans/2026-07-19-mobile-collapsing-header.md
git commit -m "feat: collapse mobile header while reading"
git push origin HEAD:main
```

**Step 4: Verify production**

Wait for the Vercel production deployment, update the `beunion.vercel.app` alias
if necessary, and repeat the mobile and desktop checks.
