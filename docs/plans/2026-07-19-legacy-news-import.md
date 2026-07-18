# Legacy News Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完整搬入舊站兩篇正式消息文章及其圖片，並讓 Vercel 正式站消息區可靠顯示。

**Architecture:** 將消息資料改為前端本地 TypeScript 資料源，文章內容使用結構化區塊，圖片下載至 `public/news/`。`NewsBoard` 直接讀取本地資料並沿用既有搜尋、分類與全文彈窗。

**Tech Stack:** React 19、TypeScript、Vite、Node test runner、Vercel static assets

---

### Task 1: 建立搬遷規格測試

**Files:**
- Create: `tests/legacy-news-import.test.mjs`

**Step 1: Write the failing test**

建立測試，要求：

- `src/data/news.ts` 存在。
- 包含兩篇指定文章。
- 不包含「椰奶雜貨鋪」。
- 圖片路徑只使用 `/news/`。
- 對應本地圖片皆存在。
- `NewsBoard.tsx` import 本地消息資料。

**Step 2: Run test to verify it fails**

Run: `node --test tests/legacy-news-import.test.mjs`

Expected: FAIL，因 `src/data/news.ts` 尚不存在。

### Task 2: 下載並驗證舊站圖片

**Files:**
- Create: `public/news/*`

**Step 1: Extract source image URLs**

從兩篇原始文章 HTML 取得文章主圖與內文圖片 URL，排除 logo、頁尾與分享圖示。

**Step 2: Download assets**

將圖片以可讀檔名保存至 `public/news/`。

**Step 3: Verify files**

Run: `file public/news/*`

Expected: 所有檔案皆為有效 JPEG、PNG 或 WebP。

### Task 3: 建立本地消息資料

**Files:**
- Create: `src/data/news.ts`
- Modify: `src/components/NewsBoard.tsx`

**Step 1: Add structured types**

新增 `NewsContentBlock`，支援 heading、paragraph、list、image。

**Step 2: Add the two imported articles**

保留標題、日期、分類、摘要、主要段落、小標、清單、圖片說明與原文 URL。

**Step 3: Use local data**

將 `NewsBoard` 初始資料改為 `IMPORTED_NEWS`，移除失敗的 `/api/news` 載入依賴。

**Step 4: Run import test**

Run: `node --test tests/legacy-news-import.test.mjs`

Expected: PASS。

### Task 4: 呈現結構化全文

**Files:**
- Modify: `src/components/NewsBoard.tsx`

**Step 1: Render content blocks**

在全文彈窗依類型渲染段落、小標題、列表與本地圖片。

**Step 2: Preserve legacy string support**

若既有消息仍使用字串內容，保留原本顯示方式。

**Step 3: Verify TypeScript and build**

Run:

```bash
npm run lint
npm run build
```

Expected: 兩者 exit 0。

### Task 5: 完整驗證、推送與部署

**Files:**
- Test: `tests/*.test.*`

**Step 1: Run full verification**

Run:

```bash
npx tsx --test tests/*.test.*
npm run lint
npm run build
git diff --check
```

Expected: 所有測試通過、無型別或格式錯誤。

**Step 2: Commit**

```bash
git add docs src public/news tests
git commit -m "feat: import legacy news articles"
```

**Step 3: Push**

```bash
git push origin HEAD:main
```

**Step 4: Verify production**

確認 Vercel Ready，並在正式站測試：

- 兩張消息卡顯示。
- 卡片圖片正常。
- 「閱讀全文」顯示文章段落與內文圖片。
- 搜尋與分類可用。
- 「椰奶雜貨鋪」不存在。

