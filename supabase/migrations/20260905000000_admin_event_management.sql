-- 20260905000000_admin_event_management.sql —— 後台活動上架與報名管理
--
-- 在這之前活動只能靠 migration 硬寫（20260718175521 §seed），後台只有唯讀的報名
-- 名單。這一支補上「活動的增刪改」與「取消報名」，兩者都必須是管理員才能做。
--
-- 授權模型沿用 20260719090000 的作法，不另外發明：函式一律 security definer +
-- set search_path = ''，開頭查 private.admin_users，然後 revoke 掉 anon 與
-- authenticated、只 grant 給 service_role。理由是前端拿得到的是 publishable key，
-- 只要 authenticated 能 execute，任何登入者猜到管理員 UUID 就能直接呼叫 ——
-- 驗 JWT 這件事必須留在 serverless function 那一層（api/lib/auth.ts）。
--
-- ⚠️ registered_count 不是 event_registrations 的列數。seed 進來的活動一開始就帶
--    著線下既有的報名人數（45/19/14/7），而 event_registrations 只有站上報名的那
--    幾筆。所以取消報名只能「遞減」，**絕對不能**改成 count(*) 重算，那會把線下
--    人數一次抹掉。


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. 草稿／發布
-- ═══════════════════════════════════════════════════════════════════════════
--
-- default true：既有 4 場活動都是已經對外的，加欄位不能讓它們憑空消失。

alter table public.events
  add column if not exists is_published boolean not null default true;

-- 公開讀取排除草稿。用 alter policy 而不是 drop + create，因為 drop 到 create 中
-- 間那一瞬間 events 會沒有任何 select policy，前台活動列表會空掉。
alter policy "Public can read guardian events"
on public.events
using (is_published);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. 報名要擋掉草稿
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 簽名與 20260719090000 完全一致（含預設值），只改函式體 —— returns table 的形狀
-- 沒動，所以 create or replace 不會踩到「不能改 RETURNS TABLE」那個限制。
--
-- 草稿回 EVENT_NOT_FOUND 而不是 REGISTRATION_CLOSED：對外不應該洩漏「有這場活動
-- 但還沒上架」這件事。

create or replace function public.register_for_event(
  p_event_id text,
  p_name text,
  p_email text,
  p_phone text,
  p_volunteer_type text default 'other',
  p_notes text default '',
  p_user_id uuid default null
)
returns table (
  registration_id uuid,
  new_registered_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_event public.events%rowtype;
  created_registration_id uuid;
begin
  select *
  into selected_event
  from public.events
  where id = p_event_id
  for update;

  if not found or not selected_event.is_published then
    raise exception using errcode = 'P0001', message = 'EVENT_NOT_FOUND';
  end if;

  if selected_event.lifecycle_status = 'ended' or now() >= selected_event.ends_at then
    raise exception using errcode = 'P0001', message = 'EVENT_ENDED';
  end if;

  if selected_event.lifecycle_status = 'cancelled' or not selected_event.registration_open then
    raise exception using errcode = 'P0001', message = 'REGISTRATION_CLOSED';
  end if;

  if selected_event.registered_count >= selected_event.max_seats then
    raise exception using errcode = 'P0001', message = 'EVENT_FULL';
  end if;

  insert into public.event_registrations (
    event_id,
    user_id,
    name,
    email,
    phone,
    volunteer_type,
    notes
  )
  values (
    p_event_id,
    p_user_id,
    btrim(p_name),
    btrim(p_email),
    btrim(p_phone),
    p_volunteer_type,
    btrim(p_notes)
  )
  returning id into created_registration_id;

  update public.events
  set
    registered_count = registered_count + 1,
    updated_at = now()
  where id = p_event_id
  returning registered_count into new_registered_count;

  registration_id := created_registration_id;
  return next;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'DUPLICATE_REGISTRATION';
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. 後台讀活動（含草稿）
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 不能重用 /api/events 那條路徑：它只回已發布的，而後台正需要看見草稿。

create or replace function public.admin_list_events(p_admin_user_id uuid)
returns table (
  id text,
  title text,
  event_date date,
  starts_at timestamptz,
  ends_at timestamptz,
  time_label text,
  location text,
  lecturer text,
  description text,
  max_seats integer,
  registered_count integer,
  image_url text,
  registration_open boolean,
  lifecycle_status text,
  is_published boolean,
  actual_registrations integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from private.admin_users
    where private.admin_users.user_id = p_admin_user_id
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  return query
  select
    events.id,
    events.title,
    events.event_date,
    events.starts_at,
    events.ends_at,
    events.time_label,
    events.location,
    events.lecturer,
    events.description,
    events.max_seats,
    events.registered_count,
    events.image_url,
    events.registration_open,
    events.lifecycle_status,
    events.is_published,
    -- 站上實際報名筆數，跟 registered_count（含線下）刻意分開顯示，
    -- 讓後台看得出兩者的差距而不會誤以為其中一個算錯了。
    (
      select count(*)::integer
      from public.event_registrations
      where public.event_registrations.event_id = events.id
    ) as actual_registrations,
    events.updated_at
  from public.events
  order by events.event_date desc, events.id;
end;
$$;

revoke all on function public.admin_list_events(uuid)
from public, anon, authenticated;
grant execute on function public.admin_list_events(uuid) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. 新增／編輯活動
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 新增與編輯共用同一支（後台表單也只有一張），用 on conflict 分流。
--
-- ⚠️ max_seats 有 CHECK：registered_count <= max_seats。若直接把名額改到比現有報名
--    數還小，PostgreSQL 丟出來的是 23514 check_violation，錯誤訊息對後台使用者毫無
--    意義。這裡先擋一次，回一個看得懂的 SEATS_BELOW_REGISTERED。

create or replace function public.admin_upsert_event(
  p_admin_user_id uuid,
  p_id text,
  p_title text,
  p_event_date date,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_time_label text,
  p_location text,
  p_lecturer text,
  p_description text,
  p_max_seats integer,
  p_image_url text,
  p_registration_open boolean,
  p_lifecycle_status text,
  p_is_published boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_count integer;
  saved_id text;
begin
  if not exists (
    select 1
    from private.admin_users
    where private.admin_users.user_id = p_admin_user_id
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  if btrim(coalesce(p_id, '')) = '' then
    raise exception using errcode = 'P0001', message = 'EVENT_ID_REQUIRED';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception using errcode = 'P0001', message = 'END_BEFORE_START';
  end if;

  select events.registered_count
  into existing_count
  from public.events
  where events.id = btrim(p_id)
  for update;

  if found and p_max_seats < existing_count then
    raise exception using errcode = 'P0001', message = 'SEATS_BELOW_REGISTERED';
  end if;

  insert into public.events (
    id, title, event_date, starts_at, ends_at, time_label, location,
    lecturer, description, max_seats, image_url, registration_open,
    lifecycle_status, is_published
  )
  values (
    btrim(p_id), btrim(p_title), p_event_date, p_starts_at, p_ends_at,
    btrim(p_time_label), btrim(p_location), btrim(coalesce(p_lecturer, '')),
    btrim(coalesce(p_description, '')), p_max_seats,
    btrim(coalesce(p_image_url, '')), p_registration_open,
    p_lifecycle_status, p_is_published
  )
  on conflict (id) do update
  set
    title = excluded.title,
    event_date = excluded.event_date,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    time_label = excluded.time_label,
    location = excluded.location,
    lecturer = excluded.lecturer,
    description = excluded.description,
    max_seats = excluded.max_seats,
    image_url = excluded.image_url,
    registration_open = excluded.registration_open,
    lifecycle_status = excluded.lifecycle_status,
    is_published = excluded.is_published,
    updated_at = now()
  returning public.events.id into saved_id;

  return saved_id;
end;
$$;

revoke all on function public.admin_upsert_event(
  uuid, text, text, date, timestamptz, timestamptz, text, text,
  text, text, integer, text, boolean, text, boolean
) from public, anon, authenticated;
grant execute on function public.admin_upsert_event(
  uuid, text, text, date, timestamptz, timestamptz, text, text,
  text, text, integer, text, boolean, text, boolean
) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. 刪除活動
-- ═══════════════════════════════════════════════════════════════════════════
--
-- event_registrations 有 on delete cascade，所以刪活動會連報名一起刪掉。回傳被連帶
-- 刪除的報名筆數，讓後台的二次確認可以講出「這會一併刪掉 N 筆報名」而不是只問
-- 「確定嗎」。

create or replace function public.admin_delete_event(
  p_admin_user_id uuid,
  p_event_id text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cascaded integer;
begin
  if not exists (
    select 1
    from private.admin_users
    where private.admin_users.user_id = p_admin_user_id
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  select count(*)::integer
  into cascaded
  from public.event_registrations
  where public.event_registrations.event_id = p_event_id;

  delete from public.events where public.events.id = p_event_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'EVENT_NOT_FOUND';
  end if;

  return cascaded;
end;
$$;

revoke all on function public.admin_delete_event(uuid, text)
from public, anon, authenticated;
grant execute on function public.admin_delete_event(uuid, text) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. 取消報名（含名額回收）
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 兩件事必須在同一句交易裡：刪掉報名列、把 registered_count 減一。順序是先鎖活動
-- 再刪報名，跟 register_for_event 的鎖順序一致（都是先 events 後 registrations），
-- 避免兩支函式併發時互相等待對方的鎖。
--
-- greatest(..., 0) 是防禦性的：正常情況減不到負數（CHECK 也會擋），但如果有人手動
-- 調過 registered_count，寧可停在 0 也不要讓整個取消操作因為 check_violation 失敗。

create or replace function public.admin_cancel_registration(
  p_admin_user_id uuid,
  p_registration_id uuid
)
returns table (
  event_id text,
  new_registered_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id text;
begin
  if not exists (
    select 1
    from private.admin_users
    where private.admin_users.user_id = p_admin_user_id
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  select public.event_registrations.event_id
  into target_event_id
  from public.event_registrations
  where public.event_registrations.id = p_registration_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'REGISTRATION_NOT_FOUND';
  end if;

  perform 1 from public.events where public.events.id = target_event_id for update;

  delete from public.event_registrations
  where public.event_registrations.id = p_registration_id;

  update public.events
  set
    registered_count = greatest(public.events.registered_count - 1, 0),
    updated_at = now()
  where public.events.id = target_event_id
  returning public.events.registered_count into new_registered_count;

  event_id := target_event_id;
  return next;
end;
$$;

revoke all on function public.admin_cancel_registration(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.admin_cancel_registration(uuid, uuid) to service_role;
