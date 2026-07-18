alter table public.events
add column lifecycle_status text not null default 'scheduled'
check (lifecycle_status in ('scheduled', 'ended', 'cancelled'));

update public.events
set
  lifecycle_status = 'ended',
  registration_open = false,
  updated_at = now()
where id = 'songshan-harvest-2026';

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
