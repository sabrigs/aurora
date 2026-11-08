// Fluxos de série no dropdown de status que precisam de confirmação, porque mexem no progresso dos episódios:
// marcar a série como assistida (todos os episódios entram como assistidos) e removê-la de uma lista (o progresso é apagado).
import { apiFetch } from '../api';
import { confirmDialog } from '../ui/confirm';
import { episodeKey, getWatchedEpisodes, type EpisodeRef } from './progress';
import {
  markFavorite,
  markSeriesWatched,
  markWatched,
  removeSeriesFromList,
  type SystemKind,
  type TitleRef,
} from './store';

interface AiredResponse {
  episodes: EpisodeRef[];
  ended: boolean;
}

// Episódios lançados, buscados uma vez por série (a rota percorre todas as temporadas).
const airedCache = new Map<number, Promise<AiredResponse>>();

export function fetchAiredEpisodes(tmdbId: number): Promise<AiredResponse> {
  let cached = airedCache.get(tmdbId);
  if (!cached) {
    cached = apiFetch(`/api/titles/tv/${tmdbId}/episodes`)
      .then((response) => {
        if (!response.ok) throw new Error(`episodes_${response.status}`);
        return response.json() as Promise<{ episodes: { seasonNumber: number; episodeNumber: number }[]; ended: boolean }>;
      });
    airedCache.set(tmdbId, cached);
    cached.catch(() => airedCache.delete(tmdbId));
  }
  return cached;
}

const em = (text: string) => {
  const element = document.createElement('em');
  element.textContent = text;
  return element;
};

const LIST_NAMES: Partial<Record<SystemKind, string>> = { watching: 'Watching', watched: 'Watched' };

// Mostra o diálogo de confirmação e marca a série inteira. Devolve true se a série acabou em "Watched".
async function confirmMarkWatched(ref: TitleRef, closeMenu: () => void): Promise<boolean> {
  const [aired, watched] = await Promise.all([fetchAiredEpisodes(ref.tmdbId), getWatchedEpisodes(ref.tmdbId)]);
  const total = aired.episodes.length;
  const missing = aired.episodes.filter((episode) => !watched.has(episodeKey(episode))).length;

  // Nada a marcar (todos já assistidos ou nenhum lançado): só muda a lista.
  if (missing === 0) {
    await markWatched(ref);
    return true;
  }

  const done = total - missing;
  const upcoming = aired.ended ? '' : " Episodes that haven't aired yet won't be marked.";
  const partial = done > 0;

  closeMenu();
  return confirmDialog({
    title: partial ? 'Mark the remaining episodes as watched?' : 'Mark the whole series as watched?',
    body: partial
      ? [`You've watched ${done} of ${total} episodes. The other ${missing} will be marked as watched, and `, em(ref.title), ` will move to Watched.${upcoming}`]
      : [em(ref.title), ` will move to Watched, and ${total === 1 ? 'its only episode' : `all ${total} episodes`} will be marked as watched.${upcoming}`],
    confirmLabel: 'Mark all as watched',
    busyLabel: 'Marking…',
    errorMessage: "Couldn't mark the episodes. Try again.",
    onConfirm: () => markSeriesWatched(ref, aired.episodes),
  });
}

// Pergunta antes de remover uma série que tem episódios marcados. Devolve null quando não há o que confirmar.
async function confirmRemove(ref: TitleRef, kind: SystemKind, closeMenu: () => void): Promise<boolean | null> {
  const count = (await getWatchedEpisodes(ref.tmdbId)).size;
  if (count === 0) return null;

  closeMenu();
  return confirmDialog({
    title: `Remove from ${LIST_NAMES[kind] ?? 'this list'}?`,
    body: ['Your progress on ', `${count} ${count === 1 ? 'episode' : 'episodes'}`, ' of ', em(ref.title), ' will be cleared.'],
    confirmLabel: 'Remove and clear progress',
    busyLabel: 'Removing…',
    errorMessage: "Couldn't remove the series. Try again.",
    onConfirm: () => removeSeriesFromList(kind, ref),
  });
}

// Devolve true quando o fluxo cuidou da ação (inclusive se a pessoa cancelou) e false para seguir o caminho padrão.
export type SeriesIntercept = (ref: TitleRef, status: Set<SystemKind>, closeMenu: () => void) => Promise<boolean>;

export const SERIES_INTERCEPTS: Record<string, SeriesIntercept> = {
  'mark-watched': async (ref, _status, closeMenu) => {
    await confirmMarkWatched(ref, closeMenu);
    return true;
  },
  'mark-favorite': async (ref, status, closeMenu) => {
    if (status.has('watched')) return false;
    if (await confirmMarkWatched(ref, closeMenu)) {
      // A série já está em "Watched": só falta entrar em "Favorites".
      await markFavorite(ref, new Set<SystemKind>(['watched']));
    }
    return true;
  },
  'remove-watching': async (ref, _status, closeMenu) => (await confirmRemove(ref, 'watching', closeMenu)) !== null,
  'remove-watched': async (ref, _status, closeMenu) => (await confirmRemove(ref, 'watched', closeMenu)) !== null,
};
