// Script único a colar no SQL Editor do Supabase. Liga a reposição automática
// de palavras-passe, sem serviço externo e sem chaves privadas na app.
export const SQL_AUTENTICACAO = String.raw`-- QuotaMob · reposição automática de palavras-passe
-- Corre este script uma vez no SQL Editor do Supabase.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.quotamob_email(p_telefone text)
returns text language sql immutable as $$
  select regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g') || '@quotamob.app';
$$;

-- 1) Tesoureiro: define a palavra-passe de um número que já existe na autenticação
create or replace function public.quotamob_admin_definir_senha(p_telefone text, p_senha text)
returns uuid
language plpgsql security definer set search_path = public, extensions, auth
as $$
declare
  v_email text;
  v_id uuid;
begin
  if not exists (
    select 1 from public.motoristas m
     where m.id = auth.uid() and lower(coalesce(m.role, '')) like '%admin%'
  ) then
    raise exception 'Só o tesoureiro pode repor palavras-passe.';
  end if;

  if length(coalesce(p_senha, '')) < 6 then
    raise exception 'A palavra-passe precisa de pelo menos 6 caracteres.';
  end if;

  v_email := public.quotamob_email(p_telefone);

  select u.id into v_id from auth.users u where lower(u.email) = lower(v_email) limit 1;

  if v_id is null then
    raise exception 'NÃO_EXISTE';
  end if;

  update auth.users
     set encrypted_password = crypt(p_senha, gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = v_id;

  return v_id;
end;
$$;

grant execute on function public.quotamob_admin_definir_senha(text, text) to authenticated;

-- 2) Motorista: repõe sozinho, confirmando telefone + nome do registo
create or replace function public.quotamob_repor_senha(p_telefone text, p_nome text, p_nova text)
returns boolean
language plpgsql security definer set search_path = public, extensions, auth
as $$
declare
  v_tel text;
  v_email text;
  v_id uuid;
  v_nome text;
begin
  v_tel := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');

  if length(v_tel) <> 9 then
    raise exception 'Escreve os 9 dígitos do teu número de telefone.';
  end if;

  if length(coalesce(p_nova, '')) < 6 then
    raise exception 'A nova palavra-passe precisa de pelo menos 6 caracteres.';
  end if;

  select m.nome into v_nome
    from public.motoristas m
   where regexp_replace(coalesce(m.telefone, ''), '\D', '', 'g') = v_tel
   limit 1;

  if v_nome is null then
    raise exception 'Este número não está registado. Fala com o tesoureiro.';
  end if;

  if lower(trim(v_nome)) <> lower(trim(coalesce(p_nome, ''))) then
    raise exception 'O nome não corresponde ao registo deste número.';
  end if;

  v_email := public.quotamob_email(v_tel);

  select u.id into v_id from auth.users u where lower(u.email) = lower(v_email) limit 1;

  if v_id is null then
    raise exception 'A conta deste número não existe. Pede ao tesoureiro para a criar outra vez.';
  end if;

  update auth.users
     set encrypted_password = crypt(p_nova, gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = v_id;

  return true;
end;
$$;

grant execute on function public.quotamob_repor_senha(text, text, text) to anon, authenticated;

-- 3) Tesoureiro: apaga a conta de autenticação de um motorista eliminado.
-- Sem isto o número fica preso e nunca mais pode ser registado outra vez.
create or replace function public.quotamob_apagar_motorista(p_id uuid)
returns boolean
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.motoristas m
     where m.id = auth.uid() and lower(coalesce(m.role, '')) like '%admin%'
  ) then
    raise exception 'Só o tesoureiro pode apagar contas.';
  end if;

  delete from auth.users where id = p_id;
  return true;
end;
$$;

grant execute on function public.quotamob_apagar_motorista(uuid) to authenticated;

-- 4) Motorista: assume um número que já tem conta na autenticação mas ficou sem
-- perfil (motorista apagado). Não mexe em números que continuam registados.
create or replace function public.quotamob_activar_numero(p_telefone text, p_nome text, p_senha text)
returns boolean
language plpgsql security definer set search_path = public, extensions, auth
as $$
declare
  v_tel text;
  v_email text;
  v_id uuid;
begin
  v_tel := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_email := public.quotamob_email(v_tel);

  if length(coalesce(p_senha, '')) < 6 then
    raise exception 'A palavra-passe precisa de pelo menos 6 caracteres.';
  end if;

  if exists (
    select 1 from public.motoristas m
     where regexp_replace(coalesce(m.telefone, ''), '\D', '', 'g') = v_tel
  ) then
    raise exception 'Este número já está registado. Fala com o tesoureiro.';
  end if;

  select u.id into v_id from auth.users u where lower(u.email) = lower(v_email) limit 1;

  if v_id is null then
    raise exception 'Este número ainda não tem conta. Usa "Criar conta".';
  end if;

  update auth.users
     set encrypted_password = crypt(p_senha, gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = v_id;

  insert into public.motoristas (id, nome, telefone, role, ativo)
  values (v_id, coalesce(nullif(trim(coalesce(p_nome, '')), ''), 'Motorista'), v_tel, 'motorista', true)
  on conflict (id) do update
    set nome = excluded.nome,
        telefone = excluded.telefone,
        ativo = true;

  return true;
end;
$$;

grant execute on function public.quotamob_activar_numero(text, text, text) to anon, authenticated;
`;