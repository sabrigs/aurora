// Fluxos de série no dropdown de status que precisam de confirmação, porque mexem no progresso dos episódios:
// marcar a série como assistida (todos os episódios entram como assistidos) e removê-la de uma lista (o progresso é apagado).
import { apiFetch } from '../api';
import { confirmDialog } from '../ui/confirm';
import { t } from '../i18n';
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

const LIST_KEYS: Partial<Record<SystemKind, string>> = { watching: 'list.watching', watched: 'list.watched' };

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
  const upcoming = aired.ended ? '' : t('flow.upcoming');
  const partial = done > 0;

  closeMenu();
  return confirmDialog({
    title: partial ? t('flow.markRemainingTitle') : t('flow.markWholeTitle'),
    body: partial
      ? [t('flow.markRemainingBody1', { done, total, missing }), em(ref.title), t('flow.markRemainingBody2', { upcoming })]
      : [
          em(ref.title),
          t('flow.markWholeBody2', {
            episodes: total === 1 ? t('flow.onlyEpisode') : t('flow.allEpisodes', { n: total }),
            upcoming,
          }),
        ],
    confirmLabel: t('flow.markAll'),
    busyLabel: t('flow.marking'),
    errorMessage: t('flow.markError'),
    onConfirm: () => markSeriesWatched(ref, aired.episodes),
  });
}

// Pergunta antes de remover uma série que tem episódios marcados. Devolve null quando não há o que confirmar.
async function confirmRemove(ref: TitleRef, kind: SystemKind, closeMenu: () => void): Promise<boolean | null> {
  const count = (await getWatchedEpisodes(ref.tmdbId)).size;
  if (count === 0) return null;

  closeMenu();
  return confirmDialog({
    title: t('flow.removeTitle', { list: LIST_KEYS[kind] ? t(LIST_KEYS[kind]!) : t('flow.thisList') }),
    body: [
      t('flow.removeBody1'),
      t(count === 1 ? 'flow.episode' : 'flow.episodes', { n: count }),
      t('flow.removeBody2'),
      em(ref.title),
      t('flow.removeBody3'),
    ],
    confirmLabel: t('flow.removeConfirm'),
    busyLabel: t('flow.removing'),
    errorMessage: t('flow.removeError'),
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
