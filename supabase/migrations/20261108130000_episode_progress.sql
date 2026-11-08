-- Aurora: progresso de episódios das séries.
-- Guarda só os episódios assistidos; totais e metadados vêm da TMDB na hora de exibir.
-- Aplicar via SQL Editor ou `supabase db push`.

create table public.episode_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null,
  season_number integer not null check (season_number between 1 and 1000),
  episode_number integer not null check (episode_number between 1 and 10000),
  watched_at timestamptz not null default now(),
  -- A chave começa por (user_id, tmdb_id): cobre a consulta "progresso desta série".
  primary key (user_id, tmdb_id, season_number, episode_number)
);

alter table public.episode_progress enable row level security;

-- Cada usuário lê, marca e desmarca só os próprios episódios. Linhas não são editadas.
create policy "own episodes read" on public.episode_progress
  for select using (user_id = auth.uid());
create policy "own episodes insert" on public.episode_progress
  for insert with check (user_id = auth.uid());
create policy "own episodes delete" on public.episode_progress
  for delete using (user_id = auth.uid());
