import admins from "../_lib/admin/admins.js";
import audit from "../_lib/admin/audit.js";
import events from "../_lib/admin/events.js";
import me from "../_lib/admin/me.js";
import posts from "../_lib/admin/posts.js";
import registrations from "../_lib/admin/registrations.js";
import upload from "../_lib/admin/upload.js";

// Vercel Hobby 方案每次部署最多 12 支 serverless function，而 api/ 底下**每個**
// .ts 檔都算一支 —— 連只是被 import 的輔助模組也算。第一次撞到這個上限時是 16 支，
// 建置會全部跑完、最後停在「Deploying outputs」才失敗，錯誤訊息不會出現在 build log
// 裡，所以並不好認。
//
// 兩個對策都用上了：
//   1. 輔助模組移到 api/_lib/ —— 底線開頭的目錄 Vercel 不會當成 function。
//   2. 後台七個端點併成這一支動態路由，實作留在 _lib/admin/ 各自的檔案裡。
//
// 結果是 6 支 function（這支 + contact + events×2 + posts×2），還有成長空間。
// 新增後台端點時請加在下面這張表，不要在 api/admin/ 底下開新檔案。

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

type Handler = (req: ApiRequest, res: ApiResponse) => Promise<unknown>;

const ROUTES: Record<string, Handler> = {
  admins,
  audit,
  events,
  me,
  posts,
  registrations,
  upload,
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const raw = Array.isArray(req.query?.resource)
    ? req.query?.resource[0]
    : req.query?.resource;
  const resource = typeof raw === "string" ? raw : "";

  const route = ROUTES[resource];
  if (!route) {
    return res.status(404).json({ error: "找不到這個後台端點。" });
  }

  return route(req, res);
}
