-- 20260914000000_courses.sql —— 線上課程
--
-- 設計移植自 happyhands（apps/web + supabase/migrations 20260808~20260828），但只抄
-- 它的三個核心決定，不抄它的電商鏈：
--
--   1. 「有沒有權限看」只問一張表：private.course_entitlements(user_id, course_id)
--      這列存在且未過期。所有頁面、所有 API 都問同一個地方。
--   2. 影片 ID 只在授權判斷通過之後才交出去（lesson_access），前端永遠拿不到
--      未授權的 youtube_id。happyhands 用欄位級 grant 擋瀏覽器直查；beunion 的
--      表對 anon/authenticated 本來就全關（同 events/posts），所以這裡比它更簡單。
--   3. 學員歸戶靠 email：匯入時用 auth.admin.createUser({ email_confirm: true })
--      預建帳號，直接綁 user_id 發權限。不走 happyhands 的 orders → claim → cron。
--
-- 工會課程沒有金流，權限由後台直接開通／撤銷，每一筆都進稽核日誌。


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. 資料表
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.courses (
  id              text primary key,
  title           text not null check (char_length(title) between 1 and 200),
  description     text not null default '' check (char_length(description) <= 4000),
  cover_image_url text not null default '' check (char_length(cover_image_url) <= 500),
  status          text not null default 'draft' check (status in ('draft', 'published')),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id              uuid primary key default gen_random_uuid(),
  course_id       text not null references public.courses (id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 200),
  body            text not null default '',
  -- 只存解析後的 11 碼 ID，不存整個網址。解析在 API 層（youtube.ts），
  -- 認不出來的網址整筆擋掉，不會有「存了一串垃圾、播放時才壞」的情況。
  youtube_id      text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  duration_sec    integer not null default 0 check (duration_sec >= 0),
  sort_order      integer not null default 0,
  is_free_preview boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- DEFERRABLE 是刻意的：後台調換單元順序是「A 從 2 改成 3、B 從 3 改成 2」，
  -- 非 deferrable 的唯一約束會在第一個 UPDATE 就撞到 B 而失敗。happyhands 為此
  -- 寫了兩階段 PARK→FINAL 的搬移邏輯；改成交易結束才檢查，一句 UPDATE 就能換。
  constraint course_lessons_order_unique unique (course_id, sort_order)
    deferrable initially deferred
);

create index if not exists course_lessons_by_course
  on public.course_lessons (course_id, sort_order);

-- 權限表放 private schema：對 anon/authenticated 完全不可見，連 PostgREST 的
-- schema 列舉都看不到它。跟 admin_users 同一個原則。
create table if not exists private.course_entitlements (
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  text not null references public.courses (id) on delete cascade,
  granted_at timestamptz not null default now(),
  -- null = 永久。後台表單要做這個欄位（happyhands 的 access_days 沒 UI 是技術債）。
  expires_at timestamptz,
  source     text not null default 'admin' check (source in ('admin', 'legacy_import')),
  primary key (user_id, course_id)
);

create index if not exists course_entitlements_by_course
  on private.course_entitlements (course_id);

-- 只做「完成」旗標。user 決定不搬舊平台的進度；新站往後有打勾就夠。
create table if not exists public.course_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  lesson_id  uuid not null references public.course_lessons (id) on delete cascade,
  completed  boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- 三張 public 表全部對外關閉，讀寫一律經 serverless + service_role。
-- 沒有任何 RLS policy 是刻意的：沒有 policy = 沒有路徑可以繞過 API 的檢查。
alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_progress enable row level security;

revoke all on public.courses from public, anon, authenticated;
revoke all on public.course_lessons from public, anon, authenticated;
revoke all on public.course_progress from public, anon, authenticated;
revoke all on private.course_entitlements from public, anon, authenticated;

grant all on public.courses to service_role;
grant all on public.course_lessons to service_role;
grant all on public.course_progress to service_role;
grant all on private.course_entitlements to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. 公開讀取：課程總覽（不含 youtube_id、不含 body）
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.list_published_courses()
returns table (
  id text,
  title text,
  description text,
  cover_image_url text,
  sort_order integer,
  lesson_count integer,
  total_duration_sec integer,
  lessons jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, c.title, c.description, c.cover_image_url, c.sort_order,
    coalesce(l.n, 0)::integer,
    coalesce(l.dur, 0)::integer,
    coalesce(l.items, '[]'::jsonb)
  from public.courses c
  left join lateral (
    select
      count(*) as n,
      sum(x.duration_sec) as dur,
      jsonb_agg(
        jsonb_build_object(
          'id', x.id, 'title', x.title, 'durationSec', x.duration_sec,
          'sortOrder', x.sort_order, 'isFreePreview', x.is_free_preview
        ) order by x.sort_order
      ) as items
    from public.course_lessons x
    where x.course_id = c.id
  ) l on true
  where c.status = 'published'
  order by c.sort_order, c.created_at desc;
$$;

revoke all on function public.list_published_courses() from public, anon, authenticated;
grant execute on function public.list_published_courses() to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. 會員：我的課程（有權限且未過期）
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.my_courses(p_user_id uuid)
returns table (
  id text,
  title text,
  description text,
  cover_image_url text,
  expires_at timestamptz,
  lessons jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, c.title, c.description, c.cover_image_url, e.expires_at,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', x.id, 'title', x.title, 'durationSec', x.duration_sec,
          'sortOrder', x.sort_order, 'isFreePreview', x.is_free_preview,
          'completed', coalesce(p.completed, false)
        ) order by x.sort_order
      )
      from public.course_lessons x
      left join public.course_progress p
        on p.lesson_id = x.id and p.user_id = p_user_id
      where x.course_id = c.id
    ), '[]'::jsonb)
  from private.course_entitlements e
  join public.courses c on c.id = e.course_id
  where e.user_id = p_user_id
    and (e.expires_at is null or e.expires_at > now())
  order by e.granted_at desc;
$$;

revoke all on function public.my_courses(uuid) from public, anon, authenticated;
grant execute on function public.my_courses(uuid) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. 唯一的授權判斷：能不能看這一堂
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 影片與內文只從這裡出去。順序：課程必須已發布（草稿對外不存在）→ 試看單元
-- 不用登入 → 其餘要有未過期的 entitlement。拒絕時丟代號，API 層轉成 401/403，
-- 而且回應裡絕不夾帶 youtube_id。

create or replace function public.lesson_access(p_user_id uuid, p_lesson_id uuid)
returns table (
  course_id text,
  course_title text,
  lesson_title text,
  youtube_id text,
  body text,
  is_free_preview boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  l record;
begin
  select x.id, x.course_id, x.title, x.youtube_id, x.body, x.is_free_preview,
         c.title as course_title, c.status
  into l
  from public.course_lessons x
  join public.courses c on c.id = x.course_id
  where x.id = p_lesson_id;

  if not found or l.status <> 'published' then
    raise exception using errcode = 'P0001', message = 'LESSON_NOT_FOUND';
  end if;

  if not l.is_free_preview then
    if p_user_id is null then
      raise exception using errcode = 'P0001', message = 'LOGIN_REQUIRED';
    end if;
    if not exists (
      select 1 from private.course_entitlements e
      where e.user_id = p_user_id
        and e.course_id = l.course_id
        and (e.expires_at is null or e.expires_at > now())
    ) then
      raise exception using errcode = '42501', message = 'NO_ACCESS';
    end if;
  end if;

  course_id := l.course_id;
  course_title := l.course_title;
  lesson_title := l.title;
  youtube_id := l.youtube_id;
  body := l.body;
  is_free_preview := l.is_free_preview;
  return next;
end;
$$;

revoke all on function public.lesson_access(uuid, uuid) from public, anon, authenticated;
grant execute on function public.lesson_access(uuid, uuid) to service_role;


create or replace function public.mark_lesson_complete(p_user_id uuid, p_lesson_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 先過同一道門。沒權限的人不該能在別人的課上留下完成紀錄。
  perform public.lesson_access(p_user_id, p_lesson_id);

  insert into public.course_progress (user_id, lesson_id, completed)
  values (p_user_id, p_lesson_id, true)
  on conflict (user_id, lesson_id) do update
    set completed = true, updated_at = now();
end;
$$;

revoke all on function public.mark_lesson_complete(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mark_lesson_complete(uuid, uuid) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. 後台：課程
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.admin_list_courses(p_admin_user_id uuid)
returns table (
  id text,
  title text,
  description text,
  cover_image_url text,
  status text,
  sort_order integer,
  lesson_count integer,
  student_count integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin(p_admin_user_id);
  return query
  select
    c.id, c.title, c.description, c.cover_image_url, c.status, c.sort_order,
    (select count(*)::integer from public.course_lessons x where x.course_id = c.id),
    (select count(*)::integer from private.course_entitlements e where e.course_id = c.id),
    c.updated_at
  from public.courses c
  order by c.sort_order, c.created_at desc;
end;
$$;

revoke all on function public.admin_list_courses(uuid) from public, anon, authenticated;
grant execute on function public.admin_list_courses(uuid) to service_role;


create or replace function public.admin_upsert_course(
  p_admin_user_id uuid,
  p_id text,
  p_title text,
  p_description text,
  p_cover_image_url text,
  p_status text,
  p_sort_order integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id text;
  was_new boolean;
begin
  perform private.require_admin(p_admin_user_id);

  if btrim(coalesce(p_id, '')) = '' then
    raise exception using errcode = 'P0001', message = 'COURSE_ID_REQUIRED';
  end if;
  if p_status not in ('draft', 'published') then
    raise exception using errcode = 'P0001', message = 'INVALID_STATUS';
  end if;

  was_new := not exists (select 1 from public.courses c where c.id = btrim(p_id));

  insert into public.courses (id, title, description, cover_image_url, status, sort_order)
  values (
    btrim(p_id), btrim(p_title), btrim(coalesce(p_description, '')),
    btrim(coalesce(p_cover_image_url, '')), p_status, coalesce(p_sort_order, 0)
  )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    cover_image_url = excluded.cover_image_url,
    status = excluded.status,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning public.courses.id into saved_id;

  perform private.write_audit(
    p_admin_user_id, case when was_new then 'insert' else 'update' end,
    'courses', saved_id, btrim(p_title)
  );
  return saved_id;
end;
$$;

revoke all on function public.admin_upsert_course(uuid, text, text, text, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.admin_upsert_course(uuid, text, text, text, text, text, integer)
  to service_role;


create or replace function public.admin_delete_course(p_admin_user_id uuid, p_course_id text)
returns table (deleted_lessons integer, deleted_enrollments integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_title text;
begin
  perform private.require_admin(p_admin_user_id);

  select c.title into target_title from public.courses c where c.id = p_course_id;
  if target_title is null then
    raise exception using errcode = 'P0001', message = 'COURSE_NOT_FOUND';
  end if;

  select count(*)::integer into deleted_lessons
    from public.course_lessons x where x.course_id = p_course_id;
  select count(*)::integer into deleted_enrollments
    from private.course_entitlements e where e.course_id = p_course_id;

  delete from public.courses c where c.id = p_course_id;

  perform private.write_audit(p_admin_user_id, 'delete', 'courses', p_course_id, target_title);
  return next;
end;
$$;

revoke all on function public.admin_delete_course(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_delete_course(uuid, text) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. 後台：單元（整批）
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 收整批 jsonb，有 id 的 UPDATE、沒 id 的 INSERT、不在清單裡的 DELETE。
-- 用 UPDATE 而不是砍掉重建：course_progress 掛在 lesson_id 上，delete-insert
-- 會把學員的完成紀錄整批洗掉。順序對調靠 DEFERRABLE 約束在交易結束才檢查。

create or replace function public.admin_list_lessons(p_admin_user_id uuid, p_course_id text)
returns table (
  id uuid,
  title text,
  body text,
  youtube_id text,
  duration_sec integer,
  sort_order integer,
  is_free_preview boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin(p_admin_user_id);
  return query
  select x.id, x.title, x.body, x.youtube_id, x.duration_sec, x.sort_order, x.is_free_preview
  from public.course_lessons x
  where x.course_id = p_course_id
  order by x.sort_order;
end;
$$;

revoke all on function public.admin_list_lessons(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_list_lessons(uuid, text) to service_role;


create or replace function public.admin_upsert_lessons(
  p_admin_user_id uuid,
  p_course_id text,
  p_lessons jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  kept uuid[] := '{}';
  new_id uuid;
  n integer := 0;
  course_title text;
begin
  perform private.require_admin(p_admin_user_id);

  select c.title into course_title from public.courses c where c.id = p_course_id;
  if course_title is null then
    raise exception using errcode = 'P0001', message = 'COURSE_NOT_FOUND';
  end if;
  if jsonb_typeof(p_lessons) <> 'array' then
    raise exception using errcode = 'P0001', message = 'LESSONS_MUST_BE_ARRAY';
  end if;

  for item in select * from jsonb_array_elements(p_lessons) loop
    if item ? 'id' and (item->>'id') is not null and (item->>'id') <> '' then
      update public.course_lessons x set
        title = btrim(item->>'title'),
        body = coalesce(item->>'body', ''),
        youtube_id = nullif(item->>'youtubeId', ''),
        duration_sec = coalesce((item->>'durationSec')::integer, 0),
        sort_order = coalesce((item->>'sortOrder')::integer, 0),
        is_free_preview = coalesce((item->>'isFreePreview')::boolean, false),
        updated_at = now()
      where x.id = (item->>'id')::uuid and x.course_id = p_course_id
      returning x.id into new_id;
      if new_id is null then
        raise exception using errcode = 'P0001', message = 'LESSON_NOT_FOUND';
      end if;
    else
      insert into public.course_lessons
        (course_id, title, body, youtube_id, duration_sec, sort_order, is_free_preview)
      values (
        p_course_id, btrim(item->>'title'), coalesce(item->>'body', ''),
        nullif(item->>'youtubeId', ''), coalesce((item->>'durationSec')::integer, 0),
        coalesce((item->>'sortOrder')::integer, 0),
        coalesce((item->>'isFreePreview')::boolean, false)
      )
      returning id into new_id;
    end if;
    kept := kept || new_id;
    n := n + 1;
  end loop;

  delete from public.course_lessons x
  where x.course_id = p_course_id and not (x.id = any(kept));

  perform private.write_audit(
    p_admin_user_id, 'update', 'course_lessons', p_course_id,
    course_title || '（' || n || ' 個單元）'
  );
  return n;
end;
$$;

revoke all on function public.admin_upsert_lessons(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_upsert_lessons(uuid, text, jsonb) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. 後台：學員權限
-- ═══════════════════════════════════════════════════════════════════════════

-- 用 email 反查 auth.users。後台加學員手上只有信箱；匯入舊學員也是。
-- 只給 service_role：這支函式能把 email 對到 user id，不能讓登入者拿來探測
-- 「某個 email 有沒有帳號」。
create or replace function public.find_user_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from auth.users u
  where lower(btrim(u.email)) = lower(btrim(p_email))
  limit 1;
$$;

revoke all on function public.find_user_by_email(text) from public, anon, authenticated;
grant execute on function public.find_user_by_email(text) to service_role;


create or replace function public.admin_list_enrollments(p_admin_user_id uuid, p_course_id text)
returns table (
  user_id uuid,
  email text,
  full_name text,
  granted_at timestamptz,
  expires_at timestamptz,
  source text,
  completed_lessons integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin(p_admin_user_id);
  return query
  select
    e.user_id, u.email::text, coalesce(p.full_name, ''), e.granted_at, e.expires_at, e.source,
    (select count(*)::integer from public.course_progress g
      join public.course_lessons x on x.id = g.lesson_id
      where g.user_id = e.user_id and x.course_id = p_course_id and g.completed)
  from private.course_entitlements e
  join auth.users u on u.id = e.user_id
  left join public.profiles p on p.id = e.user_id
  where e.course_id = p_course_id
  order by e.granted_at desc;
end;
$$;

revoke all on function public.admin_list_enrollments(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_list_enrollments(uuid, text) to service_role;


create or replace function public.admin_grant_course(
  p_admin_user_id uuid,
  p_course_id text,
  p_user_id uuid,
  p_expires_at timestamptz,
  p_source text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_email text;
begin
  perform private.require_admin(p_admin_user_id);
  if p_source not in ('admin', 'legacy_import') then
    raise exception using errcode = 'P0001', message = 'INVALID_SOURCE';
  end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id) then
    raise exception using errcode = 'P0001', message = 'COURSE_NOT_FOUND';
  end if;
  select u.email into target_email from auth.users u where u.id = p_user_id;
  if target_email is null then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  insert into private.course_entitlements (user_id, course_id, expires_at, source)
  values (p_user_id, p_course_id, p_expires_at, p_source)
  on conflict (user_id, course_id) do update set
    -- 只放寬不收緊：已經永久（null）就維持永久；否則取較晚的那個。
    -- 重複開通不該把人家的期限縮短。
    expires_at = case
      when private.course_entitlements.expires_at is null or excluded.expires_at is null then null
      else greatest(private.course_entitlements.expires_at, excluded.expires_at)
    end,
    source = excluded.source;

  perform private.write_audit(
    p_admin_user_id, 'insert', 'course_entitlements',
    p_user_id::text, target_email || ' → ' || p_course_id
  );
end;
$$;

revoke all on function public.admin_grant_course(uuid, text, uuid, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.admin_grant_course(uuid, text, uuid, timestamptz, text)
  to service_role;


create or replace function public.admin_revoke_course(
  p_admin_user_id uuid,
  p_course_id text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_email text;
begin
  perform private.require_admin(p_admin_user_id);
  select u.email into target_email from auth.users u where u.id = p_user_id;

  delete from private.course_entitlements e
  where e.user_id = p_user_id and e.course_id = p_course_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'ENROLLMENT_NOT_FOUND';
  end if;

  perform private.write_audit(
    p_admin_user_id, 'delete', 'course_entitlements',
    p_user_id::text, coalesce(target_email, '') || ' ✕ ' || p_course_id
  );
end;
$$;

revoke all on function public.admin_revoke_course(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_revoke_course(uuid, text, uuid) to service_role;
