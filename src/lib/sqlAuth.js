// QuotaMob · script seguro de reposição de palavra-passe por administrador.
// Não permite recuperação pública por telefone + nome. O administrador activo
// define uma senha temporária; o motorista altera-a após iniciar sessão.
export const SQL_AUTENTICACAO = String.raw`-- QuotaMob · reposição segura de palavra-passe
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table if not exists private.quotamob_password_reset_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  temp_password_hash text not null,
  created_at timestamptz not null default now()
);
alter table private.quotamob_password_reset_state enable row level security;
revoke all on table private.quotamob_password_reset_state from public, anon, authenticated;

create or replace function public.quotamob_admin_definir_senha(p_telefone text, p_senha text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
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
set search_path = pg_catalog
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
  if not exists (select 1 from public.motoristas m where m.id = v_id and m.ativo = true) then
    raise exception 'A conta não possui um perfil activo.';
  end if;
  select s.temp_password_hash into v_hash_temporario
    from private.quotamob_password_reset_state s
   where s.user_id = v_id
   for update;
  if v_hash_temporario is null then
    raise exception 'Não existe uma reposição temporária pendente para esta conta.';
  end if;
  select u.encrypted_password into v_hash_actual from auth.users u where u.id = v_id;
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

revoke all on function public.quotamob_admin_definir_senha(text, text) from public, anon, authenticated;
revoke all on function public.quotamob_concluir_alteracao_senha(text) from public, anon, authenticated;
grant execute on function public.quotamob_admin_definir_senha(text, text) to authenticated;
grant execute on function public.quotamob_concluir_alteracao_senha(text) to authenticated;

do $block$
begin
  if to_regprocedure('public.quotamob_repor_senha(text,text,text)') is not null then
    execute 'revoke all on function public.quotamob_repor_senha(text,text,text) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.quotamob_activar_numero(text,text,text)') is not null then
    execute 'revoke all on function public.quotamob_activar_numero(text,text,text) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.quotamob_apagar_motorista(uuid)') is not null then
    execute 'revoke all on function public.quotamob_apagar_motorista(uuid) from public, anon, authenticated';
  end if;
end;
$block$;

notify pgrst, 'reload schema';`;
