create table public.events (
  id text primary key,
  title text not null check (char_length(title) between 1 and 160),
  event_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_label text not null check (char_length(time_label) between 1 and 160),
  location text not null check (char_length(location) between 1 and 240),
  lecturer text not null default '' check (char_length(lecturer) <= 240),
  description text not null default '' check (char_length(description) <= 4000),
  max_seats integer not null check (max_seats > 0 and max_seats <= 10000),
  registered_count integer not null default 0 check (
    registered_count >= 0 and registered_count <= max_seats
  ),
  image_url text not null default '' check (char_length(image_url) <= 500),
  registration_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (
    char_length(btrim(email)) between 3 and 254
    and btrim(email) ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$'
  ),
  normalized_email text generated always as (lower(btrim(email))) stored,
  phone text not null check (
    char_length(btrim(phone)) between 8 and 30
    and btrim(phone) ~ '^[0-9+() -]+$'
  ),
  volunteer_type text not null default 'other' check (
    volunteer_type in ('animal', 'plant', 'eco', 'other')
  ),
  notes text not null default '' check (char_length(notes) <= 500),
  registered_at timestamptz not null default now(),
  unique (event_id, normalized_email)
);

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

create policy "Public can read guardian events"
on public.events
for select
to anon, authenticated
using (true);

revoke all on public.events from anon, authenticated;
revoke all on public.event_registrations from anon, authenticated;
grant select on public.events to anon, authenticated;
grant all on public.events to service_role;
grant all on public.event_registrations to service_role;

create or replace function public.register_for_event(
  p_event_id text,
  p_name text,
  p_email text,
  p_phone text,
  p_volunteer_type text default 'other',
  p_notes text default ''
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

  if now() >= selected_event.ends_at then
    raise exception using errcode = 'P0001', message = 'EVENT_ENDED';
  end if;

  if not selected_event.registration_open then
    raise exception using errcode = 'P0001', message = 'REGISTRATION_CLOSED';
  end if;

  if selected_event.registered_count >= selected_event.max_seats then
    raise exception using errcode = 'P0001', message = 'EVENT_FULL';
  end if;

  insert into public.event_registrations (
    event_id,
    name,
    email,
    phone,
    volunteer_type,
    notes
  )
  values (
    p_event_id,
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
  text
) from public, anon, authenticated;
grant execute on function public.register_for_event(
  text,
  text,
  text,
  text,
  text,
  text
) to service_role;

insert into public.events (
  id,
  title,
  event_date,
  starts_at,
  ends_at,
  time_label,
  location,
  lecturer,
  description,
  max_seats,
  registered_count,
  image_url,
  registration_open
)
values
  (
    'songshan-harvest-2026',
    '水泥叢林見金黃・松菸食農續飄香',
    '2026-07-19',
    '2026-07-19 09:00:00+08',
    '2026-07-19 12:00:00+08',
    '09:00 - 12:00',
    '松菸食農教育園區（松山文創園區・忠孝東路四段轉進 553 巷走到底）',
    '陳俊安（臺北市政府產業發展局局長）',
    '115 年松菸水稻田豐收季！從泥土到餐桌，體驗最酷的都市農夫課。誠摯邀請關心都市農業與食農教育的市民夥伴共襄盛舉。',
    80,
    45,
    '/events/EDM1.jpg',
    false
  ),
  (
    'volunteer-labor-training-2026',
    '志工勞服組特殊訓練',
    '2026-08-22',
    '2026-08-22 10:00:00+08',
    '2026-08-22 17:00:00+08',
    '上午場 10:00 - 12:00・下午場 13:00 - 17:00',
    '工會教育訓練會館',
    '上午場：陳彥霖（勞動基準科股長）・下午場：左湘敏',
    '一起守護勞動權益，提升第一線服務能力。內容包含勞動法規基礎認識、志工於勞服中的角色與任務，以及實際案例分析。',
    50,
    18,
    '/events/62603.png',
    true
  ),
  (
    'animal-case-training-2026',
    '培訓第八屆・動保案件錄案員',
    '2026-09-20',
    '2026-09-20 09:30:00+08',
    '2026-09-20 16:30:00+08',
    '09:30 - 16:30',
    '臺北市捷運站附近（錄取後通知詳細地址）',
    '跨領域動保、社工、法律與犯罪防治師資團隊',
    '跨越動保、社工、法律與犯罪防治領域，深入探討 LINK 連結理論，並傳授 AI GEMs 使用方法，提升案件分析效率與精準度。',
    40,
    12,
    '/events/62607.jpg',
    true
  ),
  (
    'animal-trust-course-2026',
    '動保領域信託課程',
    '2026-10-17',
    '2026-10-17 14:00:00+08',
    '2026-10-17 16:30:00+08',
    '14:00 - 16:30',
    '臺北市捷運站附近教室',
    '信託制度與保險法律專家',
    '深入剖析預付型信託及保險如何轉信託，為動物照護、弱勢動物與動保團隊建立長久穩固的制度後盾。',
    30,
    6,
    '/events/62607.jpg',
    true
  );
