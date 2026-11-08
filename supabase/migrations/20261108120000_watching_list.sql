-- Aurora: nova lista de sistema "watching" (entre "to_watch" e "watched").
-- Aplicar via SQL Editor ou `supabase db push`.

-- 1. O tipo da lista passa a aceitar 'watching'.
alter table public.lists drop constraint if exists lists_kind_check;
alter table public.lists
  add constraint lists_kind_check
  check (kind in ('to_watch', 'watching', 'watched', 'favorites', 'custom'));

-- 2. Regras entre listas de sistema.
-- Um título fica em no máximo uma entre "to_watch", "watching" e "watched".
-- Para mudar de uma para outra, o app remove da lista atual antes de inserir na nova.
-- "favorites" continua exigindo "watched" e não é alterada ao remover de "watched".
create or replace function public.enforce_list_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_kind text;
  current_kind text;
begin
  select kind into target_kind from public.lists where id = new.list_id;

  if target_kind in ('to_watch', 'watching', 'watched') then
    select l.kind into current_kind
    from public.list_items li
    join public.lists l on l.id = li.list_id
    where li.user_id = new.user_id
      and li.tmdb_id = new.tmdb_id
      and li.media_type = new.media_type
      and l.kind in ('to_watch', 'watching', 'watched')
      and l.kind <> target_kind
    limit 1;

    if current_kind = 'watched' then
      raise exception 'title_already_watched' using errcode = 'P0001';
    elsif current_kind = 'watching' then
      raise exception 'title_already_watching' using errcode = 'P0001';
    elsif current_kind = 'to_watch' then
      raise exception 'title_still_to_watch' using errcode = 'P0001';
    end if;
  end if;

  if target_kind = 'favorites' and not exists (
    select 1 from public.list_items li
    join public.lists l on l.id = li.list_id
    where li.user_id = new.user_id
      and li.tmdb_id = new.tmdb_id
      and li.media_type = new.media_type
      and l.kind = 'watched'
  ) then
    raise exception 'favorite_requires_watched' using errcode = 'P0001';
  end if;

  return new;
end;
$$;
revoke execute on function public.enforce_list_rules() from public, anon, authenticated;

-- 3. Novos usuários passam a receber as quatro listas de sistema.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  insert into public.lists (user_id, kind, name) values
    (new.id, 'to_watch', 'To watch'),
    (new.id, 'watching', 'Watching'),
    (new.id, 'watched', 'Watched'),
    (new.id, 'favorites', 'Favorites');
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4. Usuários que já existem ganham a lista "watching".
insert into public.lists (user_id, kind, name)
select u.id, 'watching', 'Watching'
from auth.users u
where not exists (
  select 1 from public.lists l where l.user_id = u.id and l.kind = 'watching'
);
