create policy "Public cannot access event registrations"
on public.event_registrations
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
