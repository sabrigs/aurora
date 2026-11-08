-- Aurora: marcar uma série inteira como assistida numa única transação.
-- Grava os episódios lançados, tira a série de "To watch"/"Watching" e coloca em "Watched".
-- Roda com os direitos de quem chama (security invoker): a RLS e os triggers continuam valendo.
-- Aplicar via SQL Editor ou `supabase db push`.

create or replace function public.mark_series_watched(
  p_tmdb_id integer,
  p_title text,
  p_poster_path text,
  p_episodes jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_watched_list uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_episodes) <> 'array' or jsonb_array_length(p_episodes) > 20000 then
    raise exception 'invalid_episodes' using errcode = 'P0001';
  end if;

  select id into v_watched_list from public.lists where user_id = v_user and kind = 'watched';
  if v_watched_list is null then
    raise exception 'list_not_found' using errcode = 'P0001';
  end if;

  insert into public.episode_progress (user_id, tmdb_id, season_number, episode_number)
  select v_user, p_tmdb_id, (e ->> 's')::integer, (e ->> 'e')::integer
  from jsonb_array_elements(p_episodes) as e
  on conflict do nothing;

  -- O banco não aceita o título em duas listas de status: sai das outras antes de entrar em "Watched".
  delete from public.list_items
  where user_id = v_user
    and tmdb_id = p_tmdb_id
    and media_type = 'tv'
    and list_id in (
      select id from public.lists where user_id = v_user and kind in ('to_watch', 'watching')
    );

  insert into public.list_items (list_id, user_id, tmdb_id, media_type, title, poster_path)
  values (v_watched_list, v_user, p_tmdb_id, 'tv', p_title, p_poster_path)
  on conflict (list_id, tmdb_id, media_type) do nothing;
end;
$$;

revoke execute on function public.mark_series_watched(integer, text, text, jsonb) from public, anon;
grant execute on function public.mark_series_watched(integer, text, text, jsonb) to authenticated;
