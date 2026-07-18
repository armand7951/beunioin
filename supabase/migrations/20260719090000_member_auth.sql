create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(btrim(full_name)) <= 100),
  phone text not null default '' check (
    phone = ''
    or (
      char_length(btrim(phone)) between 8 and 30
      and btrim(phone) ~ '^[0-9+() -]+$'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Members can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Members can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on public.profiles from anon, authenticated;
grant select, update (full_name, phone, updated_at)
on public.profiles to authenticated;
grant all on public.profiles to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100),
    case
      when btrim(coalesce(new.raw_user_meta_data ->> 'phone', ''))
        ~ '^[0-9+() -]{8,30}$'
      then btrim(new.raw_user_meta_data ->> 'phone')
      else ''
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on private.admin_users from public, anon, authenticated;

alter table public.event_registrations
add column user_id uuid references auth.users(id) on delete set null;

create index event_registrations_user_id_idx
on public.event_registrations(user_id)
where user_id is not null;

grant select on public.event_registrations to authenticated;

create policy "Members can read their own registrations"
on public.event_registrations
for select
to authenticated
using ((select auth.uid()) = user_id);

drop function if exists public.register_for_event(
  text,
  text,
  text,
  text,
  text,
  text
);

create function public.register_for_event(
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

  if not found then
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

revoke all on function public.register_for_event(
  text,
  text,
  text,
  text,
  text,
  text,
  uuid
) from public, anon, authenticated;
grant execute on function public.register_for_event(
  text,
  text,
  text,
  text,
  text,
  text,
  uuid
) to service_role;

create function public.is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.admin_users
    where user_id = p_user_id
  );
$$;

revoke all on function public.is_admin_user(uuid)
from public, anon, authenticated;
grant execute on function public.is_admin_user(uuid) to service_role;

create function public.list_event_registrations_for_admin(p_admin_user_id uuid)
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
  if not exists (
    select 1
    from private.admin_users
    where private.admin_users.user_id = p_admin_user_id
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

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
  from public.event_registrations as registrations
  join public.events as events on events.id = registrations.event_id
  order by registrations.registered_at desc;
end;
$$;

revoke all on function public.list_event_registrations_for_admin(uuid)
from public, anon, authenticated;
grant execute on function public.list_event_registrations_for_admin(uuid) to service_role;
