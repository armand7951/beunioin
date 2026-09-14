import complete from "../_lib/courses/complete.js";
import lesson from "../_lib/courses/lesson.js";
import list from "../_lib/courses/list.js";
import mine from "../_lib/courses/mine.js";

// 跟 api/admin/[resource].ts 同一招：Vercel Hobby 每次部署最多 12 支 function，
// api/ 底下每個 .ts 都算一支。四個課程端點併成這一支，實作留在 _lib/courses/。
// 這支上線後全站是 7 支。

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

const ROUTES: Record<string, Handler> = { list, mine, lesson, complete };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const raw = Array.isArray(req.query?.resource) ? req.query?.resource[0] : req.query?.resource;
  const route = ROUTES[typeof raw === "string" ? raw : ""];
  if (!route) return res.status(404).json({ error: "找不到這個端點。" });
  return route(req, res);
}
