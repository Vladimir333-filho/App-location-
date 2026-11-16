-- QuotaMob: subscriptions for active administrators and payment push events.
-- No session, payment proof, or personal payment detail is included in push payloads.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_user_endpoint_key unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;

drop policy if exists push_subscriptions_admin_select_own on public.push_subscriptions;
create policy push_subscriptions_admin_select_own
on public.push_subscriptions for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.motoristas m
    where m.id = (select auth.uid()) and m.role = 'admin' and m.ativo = true
  )
);

drop policy if exists push_subscriptions_admin_insert_own on public.push_subscriptions;
create policy push_subscriptions_admin_insert_own
on public.push_subscriptions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.motoristas m
    where m.id = (select auth.uid()) and m.role = 'admin' and m.ativo = true
  )
);

drop policy if exists push_subscriptions_admin_update_own on public.push_subscriptions;
create policy push_subscriptions_admin_update_own
on public.push_subscriptions for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.motoristas m
    where m.id = (select auth.uid()) and m.role = 'admin' and m.ativo = true
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.motoristas m
    where m.id = (select auth.uid()) and m.role = 'admin' and m.ativo = true
  )
);

drop policy if exists push_subscriptions_admin_delete_own on public.push_subscriptions;
create policy push_subscriptions_admin_delete_own
on public.push_subscriptions for delete to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.motoristas m
    where m.id = (select auth.uid()) and m.role = 'admin' and m.ativo = true
  )
);

-- Private event outbox: no direct API access for anon/authenticated.
create table if not exists public.push_events (
  id bigint generated always as identity primary key,
  payment_id uuid not null unique references public.pagamentos(id) on delete cascade,
  motorista_id uuid not null,
  valor_kz numeric not null check (valor_kz > 0),
  created_at timestamptz not null default now()
);
alter table public.push_events enable row level security;
revoke all on table public.push_events from anon, authenticated;

create or replace function public.quotamob_registar_evento_push_pagamento()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.estado = 'em_analise' then
    insert into public.push_events (payment_id, motorista_id, valor_kz)
    values (new.id, new.motorista_id, new.valor_kz)
    on conflict (payment_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.quotamob_registar_evento_push_pagamento() from public, anon, authenticated;

drop trigger if exists quotamob_push_novo_pagamento on public.pagamentos;
create trigger quotamob_push_novo_pagamento
after insert on public.pagamentos
for each row execute function public.quotamob_registar_evento_push_pagamento();

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
