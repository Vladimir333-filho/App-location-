-- Explicitly document that API roles can never read or write the internal push outbox.
drop policy if exists push_events_deny_api_roles on public.push_events;
create policy push_events_deny_api_roles
on public.push_events
for all
to anon, authenticated
using (false)
with check (false);
