import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { execSync } from "node:child_process";
import { parseYouTubeId } from "../api/_lib/youtube.ts";
import { parseYouTubeId as browserParse } from "../src/lib/youtube.ts";

const migration = readFileSync("supabase/migrations/20260914000000_courses.sql", "utf8");
const lessonApi = readFileSync("api/_lib/courses/lesson.ts", "utf8");
const enrollApi = readFileSync("api/_lib/admin/enrollments.ts", "utf8");

// 四張表對 anon/authenticated 一律關閉、沒有任何 RLS policy。
// 有 policy = 有一條繞過 API 的路。這是 beunion 全站的授權模型，不是課程獨有的。
test("course tables are closed to the browser roles and carry no RLS policies", () => {
  for (const table of ["public.courses", "public.course_lessons", "public.course_progress", "private.course_entitlements"]) {
    assert.match(migration, new RegExp(`revoke all on ${table.replace(".", "\\.")} from public, anon, authenticated`));
  }
  assert.doesNotMatch(migration, /create policy/);
});

// 影片 ID 與內文只從 lesson_access 出去；公開總覽的 RPC 不可以 select 這兩欄。
test("youtube_id and body leave the database only through lesson_access", () => {
  const listFn = migration.slice(migration.indexOf("function public.list_published_courses"));
  const listBody = listFn.slice(0, listFn.indexOf("$$;"));
  assert.doesNotMatch(listBody, /youtube_id/);
  assert.doesNotMatch(listBody, /\bbody\b/);
  // 只看函式本體到 $$ 結束為止，段落註解裡本來就會提到這兩個欄位名
  const myFn = migration.slice(migration.indexOf("function public.my_courses"));
  const myBody = myFn.slice(0, myFn.indexOf("$$;"));
  assert.doesNotMatch(myBody, /youtube_id/);
  // 唯一的門：草稿 → 試看 → 未登入 → 無權限，四個代號都要在
  const gate = migration.slice(migration.indexOf("function public.lesson_access"), migration.indexOf("function public.mark_lesson_complete"));
  for (const code of ["LESSON_NOT_FOUND", "LOGIN_REQUIRED", "NO_ACCESS"]) assert.match(gate, new RegExp(code));
  assert.match(gate, /is_free_preview/);
  // 標記完成也要先過同一道門
  assert.match(migration, /perform public\.lesson_access\(p_user_id, p_lesson_id\)/);
});

// 端點用 POST + no-store；拒絕時回應不可夾帶 youtubeId。
test("the lesson endpoint refuses to be cached and never leaks an id on refusal", () => {
  assert.match(lessonApi, /req\.method !== "POST"/);
  assert.match(lessonApi, /"Cache-Control", "no-store"/);
  // 比對會真的送出去的鍵 `youtubeId:`，而不是註解裡的字 —— 註解本來就會寫到它
  const refusals = lessonApi.split("return res.status(200)")[0];
  assert.doesNotMatch(refusals, /youtubeId\s*:/);
  assert.match(lessonApi.split("return res.status(200)")[1], /youtubeId\s*:/);
});

// 開通用 email：先找既有帳號、沒有才建，而且 email_confirm 一定是 true（happyhands 實測踩過的雷）。
test("enrolment by email reuses existing accounts and only creates verified ones", () => {
  assert.match(enrollApi, /find_user_by_email/);
  assert.match(enrollApi, /email_confirm: true/);
  assert.doesNotMatch(enrollApi, /password:/);
});

// 單元順序約束 DEFERRABLE：換序才不用兩階段搬移；單元用 UPDATE 不 delete-insert。
test("lessons reorder in one statement and are never recreated", () => {
  assert.match(migration, /unique \(course_id, sort_order\)\s+deferrable initially deferred/);
  const upsert = migration.slice(migration.indexOf("function public.admin_upsert_lessons"), migration.indexOf("function public.find_user_by_email"));
  assert.match(upsert, /update public\.course_lessons/);
  assert.match(upsert, /on delete cascade/.test(migration) ? /delete from public\.course_lessons x\s+where x\.course_id = p_course_id and not \(x\.id = any\(kept\)\)/ : /delete/);
});

// 已存在的權限重複開通只放寬不收緊。
test("regranting never shortens an existing entitlement", () => {
  const grant = migration.slice(migration.indexOf("function public.admin_grant_course"), migration.indexOf("function public.admin_revoke_course"));
  assert.match(grant, /greatest\(/);
  assert.match(grant, /is null or excluded\.expires_at is null then null/);
});

// YouTube 解析：各種形式都要抽得出同一個 ID，垃圾要回 null；瀏覽器版與伺服器版行為一致。
test("parseYouTubeId handles every common url shape and rejects junk", () => {
  const id = "dQw4w9WgXcQ";
  const shapes = [
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    `https://www.youtube.com/shorts/${id}`,
    `https://m.youtube.com/watch?v=${id}`,
    `youtube.com/watch?v=${id}`,
  ];
  for (const s of shapes) {
    assert.equal(parseYouTubeId(s), id, s);
    assert.equal(browserParse(s), id, `browser: ${s}`);
  }
  for (const junk of ["", "   ", "https://vimeo.com/123", "https://example.com/dQw4w9WgXcQ", "not a url", "dQw4w9WgXc", `https://www.youtube.com/watch?v=${id.slice(0, 10)}`]) {
    assert.equal(parseYouTubeId(junk), null, junk);
    assert.equal(browserParse(junk), null, `browser: ${junk}`);
  }
});

// Vercel Hobby 上限 12 支 function；課程功能加上去後是 7 支。
test("the function count stays within the Hobby limit", () => {
  const n = Number(execSync("find api -name '*.ts' -not -path '*/_lib/*' | wc -l").toString().trim());
  assert.equal(n, 7);
  assert.ok(n <= 12);
});
