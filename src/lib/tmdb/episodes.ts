// Temporadas e episódios de séries (endpoints /tv/{id} e /tv/{id}/season/{n} da TMDB).
// A temporada 0 ("Specials") não entra: o app só acompanha as temporadas regulares.
import { tmdbFetch } from './client';

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
}

export interface SeriesSeasons {
  seasons: SeasonSummary[];
  // Episódios já lançados (sem a temporada 0). Calculado sem baixar nenhum episódio.
  airedEpisodeCount: number;
  // Série encerrada: sem episódios novos a caminho.
  ended: boolean;
}

export interface Episode {
  episodeNumber: number;
  name: string;
  overview: string;
  airDate: string | null;
  runtime: number | null;
  stillPath: string | null;
}

interface RawSeries {
  status?: string;
  in_production?: boolean;
  seasons?: { season_number: number; name: string; episode_count: number; air_date: string | null }[];
  last_episode_to_air?: { season_number: number; episode_number: number } | null;
  next_episode_to_air?: unknown;
}

interface RawSeason {
  episodes?: {
    episode_number: number;
    name: string;
    overview: string;
    air_date: string | null;
    runtime: number | null;
    still_path: string | null;
  }[];
}

// Soma o episode_count das temporadas anteriores à do último episódio exibido e acrescenta
// quantos episódios dessa última temporada já saíram. Sem último episódio, nada foi lançado.
// Algumas séries (ex.: animes longos) usam numeração absoluta na TMDB: a temporada 23 de One Piece
// vai do episódio 1156 ao 1180. Nesse caso o número do episódio não serve de contagem,
// então conta os episódios da temporada com data de exibição até hoje.
async function countAired(id: number, seasons: SeasonSummary[], last: RawSeries['last_episode_to_air']): Promise<number> {
  if (!last || last.season_number < 1) return 0;
  const before = seasons
    .filter((season) => season.seasonNumber < last.season_number)
    .reduce((sum, season) => sum + season.episodeCount, 0);

  const lastSeason = seasons.find((season) => season.seasonNumber === last.season_number);
  if (!lastSeason || last.episode_number <= lastSeason.episodeCount) {
    return before + last.episode_number;
  }

  const today = new Date().toISOString().slice(0, 10);
  const episodes = await getSeasonEpisodes(id, last.season_number);
  return before + episodes.filter((episode) => episode.airDate && episode.airDate <= today).length;
}

export async function getSeriesSeasons(id: number): Promise<SeriesSeasons> {
  const raw = await tmdbFetch<RawSeries>(`/tv/${id}`);

  const seasons = (raw.seasons ?? [])
    // Temporada anunciada, ainda sem episódios (episode_count 0), não entra: não há o que acompanhar.
    .filter((season) => season.season_number >= 1 && season.episode_count > 0)
    .map((season) => ({
      seasonNumber: season.season_number,
      name: season.name,
      episodeCount: season.episode_count,
      airDate: season.air_date,
    }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);

  return {
    seasons,
    airedEpisodeCount: await countAired(id, seasons, raw.last_episode_to_air),
    ended: !raw.in_production && !raw.next_episode_to_air && ['Ended', 'Canceled'].includes(raw.status ?? ''),
  };
}

// Episódios de uma temporada, só com os campos usados pela interface
// (a TMDB também manda equipe e convidados, que pesam bastante).
export async function getSeasonEpisodes(id: number, seasonNumber: number): Promise<Episode[]> {
  const raw = await tmdbFetch<RawSeason>(`/tv/${id}/season/${seasonNumber}`);

  return (raw.episodes ?? [])
    .map((episode) => ({
      episodeNumber: episode.episode_number,
      name: episode.name,
      overview: episode.overview,
      airDate: episode.air_date || null,
      runtime: episode.runtime ?? null,
      stillPath: episode.still_path,
    }))
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
}

export interface AiredEpisode {
  seasonNumber: number;
  episodeNumber: number;
}

const SEASON_CONCURRENCY = 6;

// Todos os episódios já lançados, em ordem (temporada, episódio). Usado para marcar a série inteira
// e para achar o próximo episódio. Busca as temporadas em grupos pequenos para não estourar a cota da TMDB.
export async function getAiredEpisodes(id: number): Promise<{ episodes: AiredEpisode[]; ended: boolean }> {
  const { seasons, ended } = await getSeriesSeasons(id);
  const today = new Date().toISOString().slice(0, 10);
  const episodes: AiredEpisode[] = [];

  for (let start = 0; start < seasons.length; start += SEASON_CONCURRENCY) {
    const group = seasons.slice(start, start + SEASON_CONCURRENCY);
    const results = await Promise.all(
      group.map(async (season) => ({
        seasonNumber: season.seasonNumber,
        episodes: season.episodeCount > 0 ? await getSeasonEpisodes(id, season.seasonNumber) : [],
      })),
    );
    for (const result of results) {
      for (const episode of result.episodes) {
        if (episode.airDate && episode.airDate <= today) {
          episodes.push({ seasonNumber: result.seasonNumber, episodeNumber: episode.episodeNumber });
        }
      }
    }
  }
  return { episodes, ended };
}
