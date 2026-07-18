# BeUnion Logo Replacement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the header icon, footer icon, and browser favicon with the supplied BeUnion logo.

**Architecture:** Store one canonical image at `public/logo.png` and reference it by the public URL `/logo.png`. Keep existing component structure, brand text, and navigation behavior unchanged.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Node.js built-in test runner

---

### Task 1: Add a branding regression test

**Files:**
- Create: `tests/logo-branding.test.mjs`
- Test: `tests/logo-branding.test.mjs`

**Step 1: Write the failing test**

Create a Node test that:

- asserts `public/logo.png` exists;
- asserts `src/components/Header.tsx` contains `src="/logo.png"` and a descriptive logo alt;
- asserts `src/components/Footer.tsx` contains `src="/logo.png"` and a descriptive logo alt;
- asserts `index.html` contains `<link rel="icon" type="image/png" href="/logo.png" />`.

**Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/logo-branding.test.mjs
```

Expected: FAIL because `public/logo.png` and the three references do not exist yet.

**Step 3: Commit the failing test**

```bash
git add tests/logo-branding.test.mjs
git commit -m "test: specify BeUnion logo placement"
```

### Task 2: Install the shared logo asset

**Files:**
- Move: `logo.png` to `public/logo.png`

**Step 1: Create the public asset directory**

Create `public/` if it does not exist.

**Step 2: Move the supplied asset**

Move the unchanged PNG binary from the repository root to `public/logo.png`.

**Step 3: Verify image integrity**

Run:

```bash
file public/logo.png
sips -g pixelWidth -g pixelHeight -g hasAlpha public/logo.png
```

Expected: PNG, 549 × 455, alpha channel present.

### Task 3: Replace header, footer, and favicon

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `index.html`

**Step 1: Update the header**

Remove the header-only `Shield` import and replace the decorative shield wrapper with:

```tsx
<img
  src="/logo.png"
  alt="台灣環境生態護育產業工會標誌"
  className="w-12 h-12 object-contain shrink-0 transition-transform group-hover:rotate-3"
/>
```

Keep the existing logo button and `onNavigate("home")` behavior.

**Step 2: Update the footer**

Remove the footer-only `Shield` import and replace the decorative shield wrapper with:

```tsx
<img
  src="/logo.png"
  alt="台灣環境生態護育產業工會標誌"
  className="w-[52px] h-[52px] object-contain shrink-0"
/>
```

**Step 3: Update the favicon**

Add this inside the document `<head>`:

```html
<link rel="icon" type="image/png" href="/logo.png" />
```

**Step 4: Run the branding test**

Run:

```bash
node --test tests/logo-branding.test.mjs
```

Expected: PASS.

**Step 5: Commit the implementation**

```bash
git add public/logo.png src/components/Header.tsx src/components/Footer.tsx index.html
git commit -m "feat: apply BeUnion logo across site"
```

### Task 4: Verify and deploy

**Files:**
- Verify only

**Step 1: Run the TypeScript check**

Run:

```bash
npm run lint
```

Expected: exit 0 with no TypeScript errors.

**Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: exit 0 and a generated `dist/`.

**Step 3: Visually inspect**

Run the local site and inspect desktop and mobile widths. Confirm the full logo is visible in the header and footer without distortion or clipping.

**Step 4: Push the verified commits**

```bash
git push origin main
```

Expected: push succeeds and Vercel automatically creates a production deployment.

**Step 5: Verify production**

Confirm `https://beunion.vercel.app/logo.png` returns HTTP 200 and inspect the deployed page to verify the header, footer, and favicon reference the new asset.
