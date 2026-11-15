begin;
alter table public.quotas
  drop constraint if exists quotas_estado_check;

alter table public.quotas
  add constraint quotas_estado_check
  check (estado = any (array['pendente'::text, 'em_analise'::text, 'paga'::text, 'cancelada'::text]));
commit;
