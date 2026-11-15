begin;

-- 1) MFA opt-in must be restrictive (AND), never permissive (OR).
create or replace function private.quotamob_mfa_pode_aceder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    (select auth.uid()) is not null
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
    and case
      when exists (
        select 1
        from auth.mfa_factors f
        where f.user_id = (select auth.uid())
          and f.status = 'verified'::auth.factor_status
      )
      then coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      else true
    end;
$function$;

revoke all on function private.quotamob_mfa_pode_aceder() from public, anon;
grant execute on function private.quotamob_mfa_pode_aceder() to authenticated;

-- Tighten the helper used by all RLS policies.
create or replace function public.quotamob_mfa_pode_aceder()
returns boolean
language sql
stable
security definer
set search_path = 'pg_catalog'
as $function$
  select private.quotamob_mfa_pode_aceder();
$function$;
revoke all on function public.quotamob_mfa_pode_aceder() from public, anon, authenticated;

-- Replace the permissive MFA bypass with a restrictive policy on exposed data.
drop policy if exists mfa_opt_in_aal2 on public.motoristas;
create policy mfa_opt_in_aal2 on public.motoristas
  as restrictive for all to authenticated
  using ((select private.quotamob_mfa_pode_aceder()))
  with check ((select private.quotamob_mfa_pode_aceder()));

drop policy if exists mfa_opt_in_aal2 on public.quotas;
create policy mfa_opt_in_aal2 on public.quotas
  as restrictive for all to authenticated
  using ((select private.quotamob_mfa_pode_aceder()))
  with check ((select private.quotamob_mfa_pode_aceder()));

drop policy if exists mfa_opt_in_aal2 on public.pagamentos;
create policy mfa_opt_in_aal2 on public.pagamentos
  as restrictive for all to authenticated
  using ((select private.quotamob_mfa_pode_aceder()))
  with check ((select private.quotamob_mfa_pode_aceder()));

drop policy if exists mfa_opt_in_aal2 on public.auditoria_pagamentos;
create policy mfa_opt_in_aal2 on public.auditoria_pagamentos
  as restrictive for all to authenticated
  using ((select private.quotamob_mfa_pode_aceder()))
  with check ((select private.quotamob_mfa_pode_aceder()));

drop policy if exists mfa_opt_in_aal2 on public.configuracoes_pagamento;
create policy mfa_opt_in_aal2 on public.configuracoes_pagamento
  as restrictive for all to authenticated
  using ((select private.quotamob_mfa_pode_aceder()))
  with check ((select private.quotamob_mfa_pode_aceder()));

-- Storage: apply the same MFA rule to authenticated access to private proofs and uploads.
drop policy if exists quotamob_mfa_restrictive on storage.objects;
create policy quotamob_mfa_restrictive on storage.objects
  as restrictive for all to authenticated
  using ((select private.quotamob_mfa_pode_aceder()))
  with check ((select private.quotamob_mfa_pode_aceder()));

-- 2) Owner access is only for active drivers; admin access still uses active-admin helper.
drop policy if exists motoristas_read_self_or_admin on public.motoristas;
create policy motoristas_read_self_or_admin on public.motoristas
  for select to authenticated
  using (
    (id = (select auth.uid()) and ativo = true)
    or (select private.is_admin())
  );

drop policy if exists quotas_read_owner_or_admin on public.quotas;
create policy quotas_read_owner_or_admin on public.quotas
  for select to authenticated
  using (
    (
      motorista_id = (select auth.uid())
      and exists (
        select 1 from public.motoristas m
        where m.id = (select auth.uid()) and m.ativo = true
      )
    )
    or (select private.is_admin())
  );

drop policy if exists pagamentos_read_owner_or_admin on public.pagamentos;
create policy pagamentos_read_owner_or_admin on public.pagamentos
  for select to authenticated
  using (
    (
      motorista_id = (select auth.uid())
      and exists (
        select 1 from public.motoristas m
        where m.id = (select auth.uid()) and m.ativo = true
      )
    )
    or (select private.is_admin())
  );

-- 3) Fix payment submission validation: submitted amount must equal the real quota amount.
drop policy if exists pagamentos_owner_submit on public.pagamentos;
create policy pagamentos_owner_submit on public.pagamentos
  for insert to authenticated
  with check (
    motorista_id = (select auth.uid())
    and estado = 'em_analise'
    and valor_kz > 0
    and comprovativo_path like (motorista_id::text || '/%')
    and exists (
      select 1
      from public.quotas q
      join public.motoristas m on m.id = q.motorista_id
      where q.id = pagamentos.quota_id
        and q.motorista_id = (select auth.uid())
        and q.estado = 'pendente'
        and q.valor_kz = pagamentos.valor_kz
        and m.ativo = true
    )
  );

-- 4) Financial records and quota history are immutable through the Data API.
drop policy if exists quotas_delete on public.quotas;
drop policy if exists pagamentos_delete on public.pagamentos;
drop policy if exists auditoria_delete on public.auditoria_pagamentos;
drop policy if exists auditoria_admin_insert on public.auditoria_pagamentos;

-- Remove all anonymous table access and all TRUNCATE grants.
revoke all on all tables in schema public from anon;
revoke truncate on all tables in schema public from authenticated;
revoke delete on table
  public.motoristas,
  public.quotas,
  public.pagamentos,
  public.auditoria_pagamentos
from authenticated;

-- Least-privilege grants for the current application flows.
revoke all on table
  public.motoristas,
  public.quotas,
  public.pagamentos,
  public.auditoria_pagamentos,
  public.configuracoes_pagamento
from authenticated;

grant select on table
  public.motoristas,
  public.quotas,
  public.pagamentos,
  public.auditoria_pagamentos,
  public.configuracoes_pagamento
to authenticated;

grant insert (id, nome, telefone, role, ativo)
  on public.motoristas to authenticated;
grant update (nome, telefone, role, ativo)
  on public.motoristas to authenticated;

grant insert (motorista_id, referencia, valor_kz, vencimento, estado, observacao)
  on public.quotas to authenticated;
grant update
  on public.quotas to authenticated;

grant insert (quota_id, motorista_id, valor_kz, comprovativo_path, estado)
  on public.pagamentos to authenticated;
grant update (estado, motivo_rejeicao)
  on public.pagamentos to authenticated;

-- Audit rows are written only by the protected payment trigger.
grant select on public.auditoria_pagamentos to authenticated;

-- Payment configuration remains admin-managed under its existing RLS policies.
grant insert, update, delete on public.configuracoes_pagamento to authenticated;

-- Prevent future tables/functions created by the project roles from inheriting broad anon access.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke delete, truncate on tables from authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon;
alter default privileges for role supabase_admin in schema public
  revoke all on tables from anon;
alter default privileges for role supabase_admin in schema public
  revoke delete, truncate on tables from authenticated;
alter default privileges for role supabase_admin in schema public
  revoke execute on functions from public, anon;

-- 5) Safer SECURITY DEFINER functions: fixed search_path and fully-qualified objects.
create or replace function public.quotamob_email(p_telefone text)
returns text
language sql
immutable
set search_path = 'pg_catalog'
as $function$
  select regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g') || '@quotamob.app';
$function$;

create or replace function public.quotamob_admin_definir_senha(p_telefone text, p_senha text)
returns uuid
language plpgsql
security definer
set search_path = 'pg_catalog'
as $function$
declare
  v_telefone text;
  v_id uuid;
  v_total integer;
  v_hash text;
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Só um administrador activo pode repor palavras-passe.';
  end if;

  v_telefone := regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g');
  if v_telefone !~ '^9[0-9]{8}$' then
    raise exception 'O telefone deve conter exactamente 9 dígitos e começar por 9.';
  end if;
  if length(coalesce(p_senha, '')) < 8 then
    raise exception 'A palavra-passe temporária precisa de pelo menos 8 caracteres.';
  end if;

  select count(*) into v_total
    from public.motoristas m
   where regexp_replace(coalesce(m.telefone, ''), '[^0-9]', '', 'g') = v_telefone
     and m.ativo = true
     and lower(coalesce(m.role, 'motorista')) not like '%admin%';
  if v_total <> 1 then
    raise exception 'Não foi encontrado um único motorista activo com este número.';
  end if;

  select m.id into v_id
    from public.motoristas m
   where regexp_replace(coalesce(m.telefone, ''), '[^0-9]', '', 'g') = v_telefone
     and m.ativo = true
     and lower(coalesce(m.role, 'motorista')) not like '%admin%'
   limit 1;

  v_hash := extensions.crypt(p_senha, extensions.gen_salt('bf'));
  update auth.users
     set encrypted_password = v_hash,
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
           || jsonb_build_object('quotamob_must_change_password', true),
         updated_at = now()
   where id = v_id;
  if not found then
    raise exception 'A conta de autenticação deste motorista não existe.';
  end if;

  insert into private.quotamob_password_reset_state(user_id, temp_password_hash, created_at)
  values (v_id, v_hash, now())
  on conflict (user_id) do update
    set temp_password_hash = excluded.temp_password_hash,
        created_at = excluded.created_at;

  delete from auth.sessions where user_id = v_id;
  return v_id;
end;
$function$;

create or replace function public.quotamob_concluir_alteracao_senha(p_nova text)
returns boolean
language plpgsql
security definer
set search_path = 'pg_catalog'
as $function$
declare
  v_id uuid := auth.uid();
  v_hash_actual text;
  v_hash_temporario text;
begin
  if v_id is null then
    raise exception 'Inicia sessão para concluir a alteração da palavra-passe.';
  end if;
  if length(coalesce(p_nova, '')) < 8 then
    raise exception 'A nova palavra-passe precisa de pelo menos 8 caracteres.';
  end if;
  if not exists (
    select 1 from public.motoristas m
    where m.id = v_id and m.ativo = true
  ) then
    raise exception 'A conta não possui um perfil activo.';
  end if;

  select s.temp_password_hash into v_hash_temporario
    from private.quotamob_password_reset_state s
   where s.user_id = v_id
   for update;
  if v_hash_temporario is null then
    raise exception 'Não existe uma reposição temporária pendente para esta conta.';
  end if;

  select u.encrypted_password into v_hash_actual
    from auth.users u where u.id = v_id;
  if v_hash_actual is null or extensions.crypt(p_nova, v_hash_actual) <> v_hash_actual then
    raise exception 'A nova palavra-passe ainda não foi confirmada pelo serviço de autenticação.';
  end if;
  if extensions.crypt(p_nova, v_hash_temporario) = v_hash_temporario then
    raise exception 'Escolhe uma palavra-passe diferente da temporária.';
  end if;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
           - 'quotamob_must_change_password',
         updated_at = now()
   where id = v_id;

  delete from private.quotamob_password_reset_state where user_id = v_id;
  return true;
end;
$function$;

create or replace function public.quotamob_definir_foto(p_url text)
returns void
language plpgsql
security definer
set search_path = 'pg_catalog'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Sem sessão.';
  end if;
  if not exists (
    select 1 from public.motoristas m
    where m.id = auth.uid() and m.ativo = true
  ) then
    raise exception 'Só um motorista activo pode alterar a fotografia.';
  end if;
  if p_url is null or length(p_url) > 2048 or p_url !~ '^https://' then
    raise exception 'Endereço da fotografia inválido.';
  end if;
  update public.motoristas set foto_url = p_url where id = auth.uid();
  if not found then
    raise exception 'Perfil não encontrado para esta conta.';
  end if;
end;
$function$;

-- 6) Legacy self-service recovery and account-deletion RPCs are no longer allowed.
revoke all on function public.quotamob_repor_senha(text, text, text) from public, anon, authenticated;
revoke all on function public.quotamob_activar_numero(text, text, text) from public, anon, authenticated;
revoke all on function public.quotamob_apagar_motorista(uuid) from public, anon, authenticated;
revoke all on function public.quotamob_mfa_pode_aceder() from public, anon, authenticated;

-- 7) Safe cancellation replaces deletion; it refuses any quota with payment history.
create or replace function public.quotamob_cancelar_quotas(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = 'pg_catalog'
as $function$
declare
  v_total integer;
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Só um administrador activo pode cancelar quotas.';
  end if;
  if p_ids is null or cardinality(p_ids) = 0 then
    return 0;
  end if;
  if cardinality(p_ids) > 500 then
    raise exception 'Não é permitido cancelar mais de 500 quotas de cada vez.';
  end if;
  if exists (
    select 1
      from public.pagamentos p
     where p.quota_id = any(p_ids)
  ) then
    raise exception 'Uma ou mais quotas têm pagamentos ou comprovativos associados. O histórico deve ser preservado.';
  end if;

  update public.quotas q
     set estado = 'cancelada',
         observacao = concat_ws(
           E'\n',
           nullif(q.observacao, ''),
           'Cancelada por ' || (select auth.uid())::text || ' em ' ||
           to_char(now(), 'YYYY-MM-DD HH24:MI:SS TZ')
         )
   where q.id = any(p_ids)
     and q.estado in ('pendente', 'atrasada');
  get diagnostics v_total = row_count;
  return v_total;
end;
$function$;

-- 8) Explicit function grants: only the RPCs used by the app remain callable.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.quotamob_admin_definir_senha(text, text) to authenticated;
grant execute on function public.quotamob_concluir_alteracao_senha(text) to authenticated;
grant execute on function public.quotamob_definir_foto(text) to authenticated;
grant execute on function public.quotamob_reconciliar_perfil_orfao(text, text) to authenticated;
grant execute on function public.quotamob_listar_meus_fatores_mfa() to authenticated;
grant execute on function public.quotamob_cancelar_quotas(uuid[]) to authenticated;

-- Ensure private helper used by RLS remains executable by authenticated users.
grant execute on function private.is_admin() to authenticated;

-- 9) Storage policies: only active drivers may upload/read their private proofs.
drop policy if exists comprovativos_read_owner_or_admin on storage.objects;
create policy comprovativos_read_owner_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'comprovativos'
    and (
      (
        (storage.foldername(name))[1] = (select auth.uid())::text
        and exists (
          select 1 from public.motoristas m
          where m.id = (select auth.uid()) and m.ativo = true
        )
      )
      or (select private.is_admin())
    )
  );

drop policy if exists comprovativos_upload_owner on storage.objects;
create policy comprovativos_upload_owner on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprovativos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.motoristas m
      where m.id = (select auth.uid()) and m.ativo = true
    )
  );

drop policy if exists "perfis escrita" on storage.objects;
create policy "perfis escrita" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'perfis'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.motoristas m
      where m.id = (select auth.uid()) and m.ativo = true
    )
  );

drop policy if exists "perfis atualizacao" on storage.objects;
create policy "perfis atualizacao" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'perfis'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.motoristas m
      where m.id = (select auth.uid()) and m.ativo = true
    )
  )
  with check (
    bucket_id = 'perfis'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.motoristas m
      where m.id = (select auth.uid()) and m.ativo = true
    )
  );

-- 10) Missing FK indexes from the performance advisor.
create index if not exists auditoria_pagamentos_admin_id_idx
  on public.auditoria_pagamentos (admin_id);
create index if not exists configuracoes_pagamento_updated_by_idx
  on public.configuracoes_pagamento (updated_by);
create index if not exists pagamentos_analisado_por_idx
  on public.pagamentos (analisado_por);
create index if not exists pagamentos_quota_motorista_fk_idx
  on public.pagamentos (quota_id, motorista_id);

commit;

notify pgrst, 'reload schema';
