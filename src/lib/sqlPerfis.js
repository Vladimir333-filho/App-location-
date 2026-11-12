// Script único a colar no SQL Editor do Supabase. Liga as fotografias de perfil:
// cria a coluna, o espaço de armazenamento e a função que cada um usa para a sua.
export const SQL_PERFIS = String.raw`-- QuotaMob · fotografias de perfil
-- Corre este script uma vez no SQL Editor do Supabase.

alter table public.motoristas add column if not exists foto_url text;

insert into storage.buckets (id, name, public)
values ('perfis', 'perfis', true)
on conflict (id) do update set public = true;

drop policy if exists "perfis leitura" on storage.objects;
create policy "perfis leitura" on storage.objects
  for select using (bucket_id = 'perfis');

drop policy if exists "perfis escrita" on storage.objects;
create policy "perfis escrita" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'perfis' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "perfis atualizacao" on storage.objects;
create policy "perfis atualizacao" on storage.objects
  for update to authenticated
  using (bucket_id = 'perfis' and (storage.foldername(name))[1] = auth.uid()::text);

-- Cada conta só consegue mudar a sua própria fotografia (nunca o papel ou o nome).
create or replace function public.quotamob_definir_foto(p_url text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sem sessão.';
  end if;

  update public.motoristas set foto_url = p_url where id = auth.uid();

  if not found then
    raise exception 'Perfil não encontrado para esta conta.';
  end if;
end;
$$;

grant execute on function public.quotamob_definir_foto(text) to authenticated;
`;