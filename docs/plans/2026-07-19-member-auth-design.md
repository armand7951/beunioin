# BeUnion 會員、活動報名與管理後台設計

日期：2026-07-19

## 目標

讓 BeUnion 訪客與會員都能報名守護活動，並提供完整的會員註冊、Email 驗證、登入、忘記密碼、會員報名紀錄與受保護的管理員名單。

## 已確認需求

- 訪客不必建立帳號，也可以用姓名、Email、電話報名。
- 會員以 Email 與密碼註冊，完成 Email 驗證後立即成為正式會員。
- 登入會員報名時自動帶入個人資料，並可查看自己的報名紀錄。
- 忘記密碼信由 Resend 寄送，寄件網域為 `beunion.tw`。
- 管理員可查看報名者的姓名、Email、電話與會員／訪客身分。
- 第一位管理員為 `gathertaiwan@gmail.com`。
- 已結束、已額滿或停止報名的活動不可報名。

## 架構

### 認證

使用 Supabase Auth 的 Email/Password 認證。註冊時將姓名與電話放入使用者 metadata，由資料庫 trigger 建立 `profiles`。Supabase 保持 Email 驗證開啟，SMTP 由 Resend 提供。

忘記密碼流程：

1. 使用者輸入 Email。
2. 前端呼叫 `resetPasswordForEmail`，redirect 到 `/reset-password`。
3. 使用者從信件開啟頁面後輸入新密碼。
4. 前端呼叫 `updateUser({ password })`。

### 資料模型

- `public.profiles`
  - `id` 對應 `auth.users.id`
  - `full_name`
  - `phone`
  - `created_at`
  - `updated_at`
- `private.admin_users`
  - `user_id`
  - `created_at`
- `public.event_registrations`
  - 新增 nullable `user_id`
  - 訪客報名為 `NULL`
  - 會員報名記錄驗證後的 Auth user id

管理員權限獨立放在 private schema，避免會員能修改自己的角色。使用者可透過 RLS 讀寫自己的 profile、讀取自己的報名紀錄，但不能讀取其他人的個資。

### API 與權限

- 公開活動清單只回傳可公開資料。
- 活動報名 API 可匿名使用；若附 Bearer token，後端以 Supabase Auth 驗證並綁定 `user_id`。
- 資料庫 RPC 以交易鎖定活動，原子檢查狀態、名額與重複報名。
- 管理員名單 API 必須同時：
  1. 驗證 Bearer token。
  2. 確認該 user id 存在於 `private.admin_users`。
  3. 只有通過後才以 server secret 讀取報名個資。

### 前端體驗

- Header 顯示「登入／註冊」；登入後顯示「會員中心」與「登出」。
- 認證頁提供登入、註冊、忘記密碼三個狀態。
- 註冊成功後清楚提示使用者檢查驗證信。
- 會員中心顯示基本資料與自己的活動報名紀錄。
- 守護活動卡片使用完整直式海報，不裁切；載入失敗時顯示明確替代訊息。
- 已結束活動顯示「已結束」且不提供報名按鈕。
- 報名表對登入會員預填姓名、Email、電話；訪客仍可直接填寫。
- `/admin` 未登入時要求登入，非管理員顯示無權限，管理員可查看完整報名名單。

## 安全原則

- Supabase secret key、service role、Resend API key 與 Vercel token只放在 server 或部署平台環境變數。
- 瀏覽器只使用 Supabase publishable key。
- 所有輸入在 API 層驗證與正規化，錯誤訊息不暴露內部資訊。
- 不以 `raw_user_meta_data` 判斷管理員權限。
- RLS 預設拒絕跨會員存取，管理員個資查詢只經受保護的 server API。

