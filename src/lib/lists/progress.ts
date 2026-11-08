// Progresso de episódios no Supabase (tabela episode_progress; RLS garante que só o dono lê e altera).
import { supabase } from '../supabase.js';

export interface EpisodeRef {
  seasonNumber: number;
  episodeNumber: number;
}

export const EPISODES_CHANGED_EVENT = 'aurora:episodes-changed';

// Chave de um episódio dentro do conjunto de assistidos: "temporada:episódio".
export const episodeKey = (episode: EpisodeRef) => `${episode.seasonNumber}:${episode.episodeNumber}`;

// Cache em memória por série, descartado sempre que o progresso muda.
const CACHE_TTL_MS = 5 * 60 * 1000;
const watchedCache = new Map<number, { value: Promise<Set<string>>; expires: number }>();

const PAGE_SIZE = 1000; // limite de linhas por consulta da API do Supabase
const WRITE_CHUNK = 500;

const notifyChanged = (tmdbId: number) => {
  watchedCache.delete(tmdbId);
  window.dispatchEvent(new CustomEvent(EPISODES_CHANGED_EVENT, { detail: { tmdbId } }));
};

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) {
    throw new Error('not_authenticated');
  }
  return userId;
}

async function fetchWatched(tmdbId: number): Promise<Set<string>> {
  const watched = new Set<string>();
  // Séries longas passam de 1.000 episódios: lê em páginas.
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('episode_progress')
      .select('season_number, episode_number')
      .eq('tmdb_id', tmdbId)
      .order('season_number')
      .order('episode_number')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    for (const row of data ?? []) {
      watched.add(`${row.season_number}:${row.episode_number}`);
    }
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }
  return watched;
}

// Episódios assistidos da série, como conjunto de chaves (ver episodeKey).
export function getWatchedEpisodes(tmdbId: number): Promise<Set<string>> {
  const cached = watchedCache.get(tmdbId);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const value = fetchWatched(tmdbId);
  watchedCache.set(tmdbId, { value, expires: Date.now() + CACHE_TTL_MS });
  // Falha não fica em cache: a próxima chamada tenta de novo.
  value.catch(() => watchedCache.delete(tmdbId));
  return value;
}

const chunks = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

// Marca episódios como assistidos. Os que já estavam marcados são ignorados.
export async function markEpisodesWatched(tmdbId: number, episodes: EpisodeRef[]) {
  if (episodes.length === 0) return;
  const userId = await currentUserId();

  for (const chunk of chunks(episodes, WRITE_CHUNK)) {
    const { error } = await supabase.from('episode_progress').upsert(
      chunk.map((episode) => ({
        user_id: userId,
        tmdb_id: tmdbId,
        season_number: episode.seasonNumber,
        episode_number: episode.episodeNumber,
      })),
      { onConflict: 'user_id,tmdb_id,season_number,episode_number', ignoreDuplicates: true },
    );
    if (error) throw error;
  }
  notifyChanged(tmdbId);
}

// Desmarca episódios (a consulta agrupa por temporada).
export async function unmarkEpisodes(tmdbId: number, episodes: EpisodeRef[]) {
  if (episodes.length === 0) return;

  const bySeason = new Map<number, number[]>();
  for (const episode of episodes) {
    bySeason.set(episode.seasonNumber, [...(bySeason.get(episode.seasonNumber) ?? []), episode.episodeNumber]);
  }

  for (const [seasonNumber, numbers] of bySeason) {
    for (const chunk of chunks(numbers, WRITE_CHUNK)) {
      const { error } = await supabase
        .from('episode_progress')
        .delete()
        .eq('tmdb_id', tmdbId)
        .eq('season_number', seasonNumber)
        .in('episode_number', chunk);
      if (error) throw error;
    }
  }
  notifyChanged(tmdbId);
}

// Apaga todo o progresso da série (ex.: ao removê-la das listas).
export async function clearSeriesProgress(tmdbId: number) {
  const { error } = await supabase.from('episode_progress').delete().eq('tmdb_id', tmdbId);
  if (error) throw error;
  notifyChanged(tmdbId);
}
