-- 20260905120000_admin_roles_and_audit.sql —— 兩層角色、人員管理、稽核日誌
--
-- 在這之前 private.admin_users 是一張純粹的白名單：在裡面就有全部權限，要加人得
-- 手動下 SQL，而且沒有任何紀錄說明誰改了什麼。這一支把它變成有角色的名冊，並且
-- 開始記帳。
--
-- 設計沿用台大農經（agec-web/supabase/migrations/20260902100000）的模型，但**沒有**
-- 照抄它的 `admin_role()` / `is_manager()` 那組 helper。農經把 admin_users 放在
-- public 並且用 RLS policy 控管，所以需要一組 authenticated 叫得動的函式讓 policy
-- 引用；beunion 從 20260719090000 起走的是另一條路 —— 表在 private schema、對
-- anon 與 authenticated 完全關閉，所有存取都經過 service_role 的 RPC，身分驗證留在
-- serverless function（api/lib/auth.ts）。兩種都成立，但混用會出現「有一條路徑繞過
-- 另一條的檢查」，所以這裡維持 beunion 既有的那一種。


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. 角色
-- ═══════════════════════════════════════════════════════════════════════════
--
--   admin    管理者 —— 額外能管人員名冊（新增、改角色、移除）與看稽核日誌
--   operator 操作者 —— 活動與報名的全部操作，但動不了人員
--
-- default 'operator'：日後任何漏填角色的新增路徑，落點是權限小的那一邊。

alter table private.admin_users
  add column if not exists role text not null default 'operator';

alter table private.admin_users drop constraint if exists admin_users_role_valid;
alter table private.admin_users
  add constraint admin_users_role_valid check (role in ('admin', 'operator'));

-- 既有成員都是在有角色概念之前加進來的，當時等同全權，所以一律升為 admin。
-- 若這裡預設成 operator，會在這支 migration 跑完的瞬間變成沒有任何管理者，
-- 而人員管理是 admin 才能做的 —— 直接把自己鎖在門外。
update private.admin_users set role = 'admin' where role <> 'admin';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. 不能移除最後一位管理者
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 移除與降級都要擋。少了降級那一半，把唯一的管理者改成 operator 一樣會鎖死，
-- 而且比刪除更容易手滑。

create or replace function private.admin_users_keep_manager()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  select count(*)
  into remaining
  from private.admin_users
  where private.admin_users.role = 'admin'
    and private.admin_users.user_id <> old.user_id;

  if remaining = 0 then
    raise exception using errcode = 'P0001', message = 'LAST_MANAGER';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists admin_users_keep_manager_on_delete on private.admin_users;
create trigger admin_users_keep_manager_on_delete
before delete on private.admin_users
for each row when (old.role = 'admin')
execute function private.admin_users_keep_manager();

drop trigger if exists admin_users_keep_manager_on_demote on private.admin_users;
create trigger admin_users_keep_manager_on_demote
before update on private.admin_users
for each row when (old.role = 'admin' and new.role <> 'admin')
execute function private.admin_users_keep_manager();


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. 稽核日誌
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 actor_id 刻意**不加**外鍵指向 auth.users。這個坑農經實測撞過：加了外鍵之後，
--    刪掉某人的 auth 帳號會 cascade 掉他的名冊列，而那個 delete 要寫的日誌又得引用
--    「正在被刪的那個人」—— 外鍵違反，於是日誌把它自己要記錄的操作弄失敗。
--    更根本地說，存 actor_email 快照又要外鍵是自相矛盾的：快照存在的理由就是
--    「這個帳號可能會消失」。稽核日誌是 append-only 的事實紀錄，不是關聯表。

create table if not exists private.admin_audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  actor_email text,
  action      text not null,
  entity      text not null,
  entity_id   text,
  label       text,
  changed_at  timestamptz not null default now()
);

create index if not exists admin_audit_log_recent
  on private.admin_audit_log (changed_at desc);

revoke all on private.admin_audit_log from public, anon, authenticated;

create or replace function private.write_audit(
  p_actor_id uuid,
  p_action text,
  p_entity text,
  p_entity_id text,
  p_label text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.admin_audit_log (actor_id, actor_email, action, entity, entity_id, label)
  values (
    p_actor_id,
    (select auth.users.email from auth.users where auth.users.id = p_actor_id),
    p_action, p_entity, p_entity_id, p_label
  );
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. 權限檢查 helper
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 每支 RPC 開頭都要驗一次，抽出來免得日後新增函式時漏寫或寫得不一樣。
-- p_need_manager = true 表示這個操作只有 admin 能做。

create or replace function private.require_admin(
  p_user_id uuid,
  p_need_manager boolean default false
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  found_role text;
begin
  select private.admin_users.role
  into found_role
  from private.admin_users
  where private.admin_users.user_id = p_user_id;

  if found_role is null then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  if p_need_manager and found_role <> 'admin' then
    raise exception using errcode = '42501', message = 'MANAGER_REQUIRED';
  end if;

  return found_role;
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. 人員名冊的讀寫（僅 admin）
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.admin_list_admins(p_admin_user_id uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  is_self boolean,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin(p_admin_user_id, true);

  return query
  select
    admins.user_id,
    users.email::text,
    admins.role,
    admins.user_id = p_admin_user_id as is_self,
    users.last_sign_in_at
  from private.admin_users admins
  join auth.users users on users.id = admins.user_id
  order by admins.role, users.email;
end;
$$;

revoke all on function public.admin_list_admins(uuid) from public, anon, authenticated;
grant execute on function public.admin_list_admins(uuid) to service_role;


-- 用 email 加人，而不是 UUID：後台使用者手上有的是同事的信箱。對方必須已經有帳號
-- （在站上註冊過），這裡不建帳號 —— 建帳號要設密碼，那是另一件事，混進來會讓這支
-- 函式同時掌管「誰能進後台」與「誰有帳號」兩件不同的權責。
create or replace function public.admin_add_admin(
  p_admin_user_id uuid,
  p_email text,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  perform private.require_admin(p_admin_user_id, true);

  if p_role not in ('admin', 'operator') then
    raise exception using errcode = 'P0001', message = 'INVALID_ROLE';
  end if;

  select auth.users.id
  into target_id
  from auth.users
  where lower(auth.users.email) = lower(btrim(p_email));

  if target_id is null then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  insert into private.admin_users (user_id, role)
  values (target_id, p_role)
  on conflict (user_id) do update set role = excluded.role;

  perform private.write_audit(
    p_admin_user_id, 'insert', 'admin_users', target_id::text,
    btrim(p_email) || '（' || p_role || '）'
  );

  return target_id;
end;
$$;

revoke all on function public.admin_add_admin(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_add_admin(uuid, text, text) to service_role;


create or replace function public.admin_remove_admin(
  p_admin_user_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_email text;
begin
  perform private.require_admin(p_admin_user_id, true);

  -- 擋自我移除。技術上「最後一位管理者」那個 trigger 已經擋掉最糟的情況，但兩位
  -- 管理者互刪或自刪仍然可能發生，而那通常是手滑不是本意。要退出請別人移除。
  if p_target_user_id = p_admin_user_id then
    raise exception using errcode = 'P0001', message = 'CANNOT_REMOVE_SELF';
  end if;

  select auth.users.email into target_email from auth.users where auth.users.id = p_target_user_id;

  delete from private.admin_users
  where private.admin_users.user_id = p_target_user_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'ADMIN_NOT_FOUND';
  end if;

  perform private.write_audit(
    p_admin_user_id, 'delete', 'admin_users', p_target_user_id::text, target_email
  );
end;
$$;

revoke all on function public.admin_remove_admin(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_remove_admin(uuid, uuid) to service_role;


create or replace function public.admin_set_admin_role(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_email text;
begin
  perform private.require_admin(p_admin_user_id, true);

  if p_role not in ('admin', 'operator') then
    raise exception using errcode = 'P0001', message = 'INVALID_ROLE';
  end if;

  select auth.users.email into target_email from auth.users where auth.users.id = p_target_user_id;

  update private.admin_users
  set role = p_role
  where private.admin_users.user_id = p_target_user_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'ADMIN_NOT_FOUND';
  end if;

  perform private.write_audit(
    p_admin_user_id, 'update', 'admin_users', p_target_user_id::text,
    coalesce(target_email, '') || ' → ' || p_role
  );
end;
$$;

revoke all on function public.admin_set_admin_role(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_admin_role(uuid, uuid, text) to service_role;


create or replace function public.admin_list_audit_log(
  p_admin_user_id uuid,
  p_limit integer default 200
)
returns table (
  id bigint,
  actor_email text,
  action text,
  entity text,
  entity_id text,
  label text,
  changed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin(p_admin_user_id, true);

  return query
  select
    log.id, log.actor_email, log.action, log.entity, log.entity_id, log.label, log.changed_at
  from private.admin_audit_log log
  order by log.changed_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 1000);
end;
$$;

revoke all on function public.admin_list_audit_log(uuid, integer) from public, anon, authenticated;
grant execute on function public.admin_list_audit_log(uuid, integer) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. 回報自己的角色
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 前端要靠這個決定「人員」與「日誌」兩個選項要不要顯示。回傳 null 代表不是管理員，
-- 讓 /api/admin/me 可以一次拿到「是不是」與「哪一層」。

create or replace function public.admin_my_role(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select private.admin_users.role
  from private.admin_users
  where private.admin_users.user_id = p_user_id;
$$;

revoke all on function public.admin_my_role(uuid) from public, anon, authenticated;
grant execute on function public.admin_my_role(uuid) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. 既有的活動與報名 RPC 改用 require_admin，並開始寫日誌
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 這幾支維持 operator 也能用（活動與報名本來就是操作者的日常），只是把重複的白名單
-- 查詢換成 helper，並在有副作用的三支補上稽核紀錄。
-- 簽名與 returns 形狀都沒動，所以 create or replace 是安全的。

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
  was_new boolean;
begin
  perform private.require_admin(p_admin_user_id);

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

  was_new := not found;

  if not was_new and p_max_seats < existing_count then
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

  perform private.write_audit(
    p_admin_user_id,
    case when was_new then 'insert' else 'update' end,
    'events', saved_id, btrim(p_title)
  );

  return saved_id;
end;
$$;


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
  target_title text;
begin
  perform private.require_admin(p_admin_user_id);

  select count(*)::integer
  into cascaded
  from public.event_registrations
  where public.event_registrations.event_id = p_event_id;

  select events.title into target_title from public.events where events.id = p_event_id;

  delete from public.events where public.events.id = p_event_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'EVENT_NOT_FOUND';
  end if;

  perform private.write_audit(
    p_admin_user_id, 'delete', 'events', p_event_id, target_title
  );

  return cascaded;
end;
$$;


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
  target_name text;
begin
  perform private.require_admin(p_admin_user_id);

  select public.event_registrations.event_id, public.event_registrations.name
  into target_event_id, target_name
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

  perform private.write_audit(
    p_admin_user_id, 'delete', 'event_registrations', p_registration_id::text,
    coalesce(target_name, '') || '（' || target_event_id || '）'
  );

  event_id := target_event_id;
  return next;
end;
$$;


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
  perform private.require_admin(p_admin_user_id);

  return query
  select
    events.id, events.title, events.event_date, events.starts_at, events.ends_at,
    events.time_label, events.location, events.lecturer, events.description,
    events.max_seats, events.registered_count, events.image_url,
    events.registration_open, events.lifecycle_status, events.is_published,
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


create or replace function public.list_event_registrations_for_admin(p_admin_user_id uuid)
returns table (
  id uuid,
  event_id text,
  event_title text,
  event_date date,
  user_id uuid,
  name text,
  email text,
  phone text,
  volunteer_type text,
  notes text,
  registered_at timestamptz
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
    registrations.id,
    registrations.event_id,
    events.title,
    events.event_date,
    registrations.user_id,
    registrations.name,
    registrations.email,
    registrations.phone,
    registrations.volunteer_type,
    registrations.notes,
    registrations.registered_at
  from public.event_registrations registrations
  join public.events events on events.id = registrations.event_id
  order by registrations.registered_at desc;
end;
$$;
