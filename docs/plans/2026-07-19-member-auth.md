# BeUnion 會員與報名系統實作計畫

> 依序以測試驅動完成；每一階段完成後執行對應測試、型別檢查與資料庫安全檢查。

## 1. 建立會員資料模型

- 新增 migration：
  - 建立 `profiles`。
  - 建立 `private.admin_users`。
  - 建立新使用者 profile trigger。
  - 為 `event_registrations` 新增 `user_id`。
  - 建立會員讀取本人 profile／報名紀錄所需 RLS。
  - 更新報名 RPC 支援安全的會員關聯。
- 更新 seed，保持四場活動資料與已結束狀態。
- 執行 linked migration、DB lint 與 security advisor。

## 2. 建立前端認證基礎

- 新增瀏覽器 Supabase client。
- 新增 Auth context，追蹤 session、profile 與管理員狀態。
- 新增認證畫面：
  - 登入
  - 會員註冊
  - 寄送忘記密碼信
  - 設定新密碼
- Header 整合會員入口與登出。

## 3. 建立會員中心

- 顯示姓名、Email、電話。
- 允許更新姓名與電話。
- 顯示本人活動報名紀錄與活動名稱、日期、狀態。
- 測試未登入、登入與空紀錄狀態。

## 4. 完成守護活動畫面與報名

- 加入三張原始活動圖檔。
- 從 `/api/events` 載入活動。
- 海報以 `object-contain` 完整呈現。
- 顯示載入錯誤與活動狀態。
- 實作訪客表單與會員預填。
- 登入時附 Bearer token，後端驗證後綁定會員。
- 成功後更新名額與會員報名紀錄。

## 5. 建立受保護管理後台

- 新增管理員身分 API。
- 新增管理員報名名單 API。
- `/admin` 加入登入、權限與載入狀態。
- 顯示活動、姓名、Email、電話、會員／訪客、報名時間。
- 驗證未登入與非管理員都無法取得個資。

## 6. 設定正式服務

- 將 Supabase site URL 與 redirect allow list 指向正式站。
- 設定 Resend SMTP：
  - sender `BeUnion <noreply@beunion.tw>`
  - 保持 Email confirmation 啟用。
- 設定 Vercel server/client 環境變數。
- 邀請 `gathertaiwan@gmail.com`，並將該 Auth user 加入 private 管理員名單。

## 7. 驗證、推送與部署

- 執行所有單元／整合測試。
- 執行 TypeScript lint 與 production build。
- 驗證 Supabase RLS、DB lint 與 advisors。
- 在本機瀏覽器測試桌機與手機流程。
- commit 並 push 到 GitHub 主分支。
- 確認 Vercel 自動部署成功。
- 在線上站測試活動清單、訪客報名、會員登入／註冊、忘記密碼與管理後台權限。

