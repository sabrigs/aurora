-- Aurora: endurecimento de segurança do schema inicial.
-- Aplicar via SQL Editor ou `supabase db push`.

-- 1. Limites de tamanho: a API do Supabase é pública, então o banco não pode confiar no cliente.
alter table public.profiles
  add constraint profiles_display_name_len check (display_name is null or char_length(display_name) <= 60);
alter table public.lists
  add constraint lists_name_len check (char_length(name) between 1 and 60);
alter table public.list_items
  add constraint list_items_title_len check (char_length(title) between 1 and 300),
  add constraint list_items_poster_path_fmt check (poster_path is null or poster_path ~ '^/[A-Za-z0-9_.-]{1,100}$');
alter table public.user_streamings
  add constraint user_streamings_name_len check (char_length(provider_name) between 1 and 100),
  add constraint user_streamings_logo_fmt check (logo_path is null or logo_path ~ '^/[A-Za-z0-9_.-]{1,100}$');

-- 2. As funções de trigger não devem ser chamáveis por anon/authenticated via RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_list_rules() from public, anon, authenticated;

-- 3. enforce_list_rules só rodava no INSERT: mover um item de lista (UPDATE) burlava as regras.
-- Itens nunca são editados pelo app, então o UPDATE passa a ser bloqueado.
create or replace function public.forbid_list_item_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'list_items_are_immutable' using errcode = 'P0001';
end;
$$;
revoke execute on function public.forbid_list_item_update() from public, anon, authenticated;

create trigger list_items_forbid_update
  before update on public.list_items
  for each row execute function public.forbid_list_item_update();

-- 4. Listas de sistema não podem ser apagadas nem trocar de tipo (o app depende delas).
drop policy "own lists" on public.lists;
create policy "own lists read" on public.lists
  for select using (user_id = auth.uid());
create policy "own custom lists insert" on public.lists
  for insert with check (user_id = auth.uid() and kind = 'custom');
create policy "own custom lists update" on public.lists
  for update using (user_id = auth.uid() and kind = 'custom')
  with check (user_id = auth.uid() and kind = 'custom');
create policy "own custom lists delete" on public.lists
  for delete using (user_id = auth.uid() and kind = 'custom');

-- 5. Perfis são criados só pelo trigger; o usuário lê e edita, mas não cria nem apaga.
drop policy "own profile" on public.profiles;
create policy "own profile read" on public.profiles
  for select using (user_id = auth.uid());
create policy "own profile update" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
