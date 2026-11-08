// Consultas de filmes e séries usadas pelas telas (Explore, detalhes, backdrop).
import { tmdbFetch, type MediaType } from './client';

export interface TitleSummary {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  voteAverage: number;
}

export interface TitlePage {
  items: TitleSummary[];
  totalPages: number;
}

interface RawTitle {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
}

interface RawPerson {
  id: number;
  media_type?: string;
  known_for?: RawTitle[];
}

interface Paged<T> {
  page: number;
  total_pages: number;
  results: T[];
}

const MAX_PAGES = 500; // limite da TMDB API

const isTitleType = (value: string | undefined): value is MediaType => value === 'movie' || value === 'tv';

const toSummary = (raw: RawTitle, mediaType: MediaType): TitleSummary => ({
  id: raw.id,
  mediaType,
  title: raw.title ?? raw.name ?? '',
  posterPath: raw.poster_path,
  backdropPath: raw.backdrop_path,
  overview: raw.overview,
  voteAverage: raw.vote_average,
});

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

// Explore → "Trending": títulos em alta na última semana.
export async function getTrending(page = 1): Promise<TitlePage> {
  const data = await tmdbFetch<Paged<RawTitle & { media_type?: string }>>('/trending/all/week', { page });
  return {
    items: data.results
      .filter((item) => isTitleType(item.media_type))
      .map((item) => toSummary(item, item.media_type as MediaType)),
    totalPages: Math.min(data.total_pages, MAX_PAGES),
  };
}

// Explore → "On Theater": filmes em cartaz na região do usuário (código ISO, ex.: BR).
export async function getOnTheater(region: string, page = 1): Promise<TitlePage> {
  const data = await tmdbFetch<Paged<RawTitle>>('/movie/now_playing', { page, region });
  return {
    items: data.results.map((item) => toSummary(item, 'movie')),
    totalPages: Math.min(data.total_pages, MAX_PAGES),
  };
}

// Filmes em cartaz no Brasil, usado para marcar "In theaters" nos detalhes.
// Lê as páginas de now_playing (mesma fonte da aba On Theater), com cache de 1 hora.
const THEATER_CACHE_MS = 60 * 60 * 1000;
let theaterCache: { ids: Set<number>; expires: number } | null = null;

async function getBrazilTheaterIds(): Promise<Set<number>> {
  if (theaterCache && theaterCache.expires > Date.now()) {
    return theaterCache.ids;
  }

  const first = await tmdbFetch<Paged<RawTitle>>('/movie/now_playing', { page: 1, region: 'BR' });
  const ids = new Set(first.results.map((item) => item.id));
  const pages = Math.min(first.total_pages, 10);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      tmdbFetch<Paged<RawTitle>>('/movie/now_playing', { page: index + 2, region: 'BR' }),
    ),
  );
  rest.forEach((data) => data.results.forEach((item) => ids.add(item.id)));

  theaterCache = { ids, expires: Date.now() + THEATER_CACHE_MS };
  return ids;
}

export async function isInBrazilTheaters(mediaType: MediaType, id: number): Promise<boolean> {
  if (mediaType !== 'movie') return false;
  return (await getBrazilTheaterIds()).has(id);
}

// Busca por título ou artista. Para artistas, entram os títulos conhecidos deles (known_for).
export async function searchTitles(query: string, page = 1): Promise<TitlePage> {
  const data = await tmdbFetch<Paged<RawTitle & RawPerson>>('/search/multi', {
    query,
    page,
    include_adult: false,
  });

  const items: TitleSummary[] = [];
  for (const result of data.results) {
    if (isTitleType(result.media_type)) {
      items.push(toSummary(result, result.media_type));
    } else if (result.media_type === 'person') {
      for (const known of result.known_for ?? []) {
        if (isTitleType(known.media_type)) {
          items.push(toSummary(known, known.media_type));
        }
      }
    }
  }

  // Remove duplicados (um título pode aparecer por mais de um artista).
  const unique = new Map(items.map((item) => [`${item.mediaType}:${item.id}`, item]));
  return {
    items: [...unique.values()],
    totalPages: Math.min(data.total_pages, MAX_PAGES),
  };
}

export interface Trailer {
  key: string; // id do vídeo no YouTube
  name: string;
}

export interface Director {
  id: number;
  name: string;
}

export interface CastMember {
  name: string;
  character: string;
  profilePath: string | null;
}

export interface TitleDetails extends TitleSummary {
  genres: string[];
  runtime: number | null;
  imdbId: string | null;
  cast: CastMember[];
  // Tamanho do elenco completo na TMDB (`cast` traz só os primeiros).
  castTotal: number;
  trailers: Trailer[];
  // Filme: diretor. Série: criador. Nulo quando a TMDB não informa.
  director: Director | null;
  // Lançamento: status da TMDB (ex.: "Released", "Post Production"), data global e, para filmes,
  // a data de estreia nos cinemas do Brasil (YYYY-MM-DD).
  status: string;
  // Temporadas de uma série (sem a temporada 0); 0 para filmes.
  seasons: number;
  releaseDate: string | null;
  brazilReleaseDate: string | null;
}

interface RawDetails extends RawTitle {
  genres: { name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  imdb_id?: string | null;
  external_ids?: { imdb_id: string | null };
  credits?: {
    cast: { name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  created_by?: { id: number; name: string }[];
  status?: string;
  number_of_seasons?: number;
  seasons?: { season_number: number; episode_count: number }[];
  release_date?: string;
  first_air_date?: string;
  release_dates?: { results: { iso_3166_1: string; release_dates: { type: number; release_date: string }[] }[] };
  videos?: { results: { key: string; name: string; site: string; type: string; official: boolean }[] };
}

// Primeira estreia em cinemas (tipos 2 e 3) no Brasil, se a TMDB tiver.
function brazilTheatricalDate(results: NonNullable<RawDetails['release_dates']>['results']): string | null {
  const brazil = results.find((country) => country.iso_3166_1 === 'BR');
  const dates = (brazil?.release_dates ?? [])
    .filter((release) => release.type === 2 || release.type === 3)
    .map((release) => release.release_date.slice(0, 10))
    .sort();
  return dates[0] ?? null;
}

const MAX_TRAILERS = 4;

// Trailers do YouTube (oficiais primeiro). Sem trailer, usa teasers.
function pickTrailers(videos: NonNullable<RawDetails['videos']>['results']): Trailer[] {
  // A chave vai para URLs de embed e imagem: só aceita o formato de id do YouTube.
  const youtube = videos.filter((video) => video.site === 'YouTube' && /^[\w-]{6,20}$/.test(video.key));
  const trailers = youtube.filter((video) => video.type === 'Trailer');
  const chosen = trailers.length > 0 ? trailers : youtube.filter((video) => video.type === 'Teaser');
  return [...chosen]
    .sort((a, b) => Number(b.official) - Number(a.official))
    .slice(0, MAX_TRAILERS)
    .map((video) => ({ key: video.key, name: video.name }));
}

// Detalhes do título (Lista de metadados, sinopse e elenco).
export async function getTitleDetails(mediaType: MediaType, id: number): Promise<TitleDetails> {
  const raw = await tmdbFetch<RawDetails>(`/${mediaType}/${id}`, {
    // release_dates só existe para filmes.
    append_to_response: mediaType === 'movie' ? 'credits,external_ids,videos,release_dates' : 'credits,external_ids,videos',
    include_video_language: 'en,null',
  });

  return {
    ...toSummary(raw, mediaType),
    genres: raw.genres.map((genre) => genre.name),
    runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    imdbId: raw.external_ids?.imdb_id ?? raw.imdb_id ?? null,
    castTotal: raw.credits?.cast.length ?? 0,
    cast: (raw.credits?.cast ?? []).slice(0, 10).map((member) => ({
      name: member.name,
      character: member.character,
      profilePath: member.profile_path,
    })),
    status: raw.status ?? '',
    // Só temporadas regulares com episódios: a TMDB conta no number_of_seasons as já anunciadas, sem episódios.
    seasons: raw.seasons
      ? raw.seasons.filter((season) => season.season_number >= 1 && season.episode_count > 0).length
      : (raw.number_of_seasons ?? 0),
    releaseDate: raw.release_date || raw.first_air_date || null,
    brazilReleaseDate: brazilTheatricalDate(raw.release_dates?.results ?? []),
    trailers: pickTrailers(raw.videos?.results ?? []),
    director:
      mediaType === 'movie'
        ? (raw.credits?.crew.find((member) => member.job === 'Director') ?? null)
        : (raw.created_by?.[0] ?? null),
  };
}

// Elenco completo, na ordem de créditos da TMDB. Carregado só quando a pessoa pede ("Show all").
export async function getFullCast(mediaType: MediaType, id: number): Promise<CastMember[]> {
  const data = await tmdbFetch<{
    cast: { name: string; character: string; profile_path: string | null }[];
  }>(`/${mediaType}/${id}/credits`);

  return data.cast.map((member) => ({
    name: member.name,
    character: member.character,
    profilePath: member.profile_path,
  }));
}

export interface RelatedTitle extends TitleSummary {
  runtime: number | null;
  genre: string | null;
  // Situação da série na TMDB (ex.: "Ended"); vazia para filmes ou quando os detalhes falham.
  status: string;
  seasons: number;
}

interface RawCredit extends RawTitle {
  job: string;
  popularity: number;
}

const MAX_RELATED = 6;

// Outros títulos do mesmo diretor (filme) ou criador (série), mais populares primeiro.
export async function getSameDirectorTitles(
  mediaType: MediaType,
  personId: number,
  excludeId: number,
): Promise<RelatedTitle[]> {
  const endpoint = mediaType === 'movie' ? 'movie_credits' : 'tv_credits';
  const job = mediaType === 'movie' ? 'Director' : 'Creator';
  const data = await tmdbFetch<{ crew: RawCredit[] }>(`/person/${personId}/${endpoint}`);

  const unique = new Map<number, RawCredit>();
  for (const credit of data.crew) {
    if (credit.job === job && credit.id !== excludeId && (credit.backdrop_path || credit.poster_path)) {
      unique.set(credit.id, credit);
    }
  }

  const top = [...unique.values()].sort((a, b) => b.popularity - a.popularity).slice(0, MAX_RELATED);

  // Duração e gênero não vêm nos créditos: busca nos detalhes (cacheados).
  return Promise.all(
    top.map(async (credit) => {
      const summary = toSummary(credit, mediaType);
      try {
        const details = await getTitleDetails(mediaType, credit.id);
        return { ...summary, runtime: details.runtime, genre: details.genres[0] ?? null, status: details.status, seasons: details.seasons };
      } catch {
        return { ...summary, runtime: null, genre: null, status: '', seasons: 0 };
      }
    }),
  );
}

// Backdrop aleatório para o login: escolhe um título da tendência semanal.
export async function getRandomBackdrop(): Promise<string | null> {
  const { items } = await getTrending();
  const titles = items.filter((item) => item.backdropPath);
  if (titles.length === 0) {
    return null;
  }
  const pick = titles[Math.floor(Math.random() * titles.length)];
  return pick.backdropPath;
}
