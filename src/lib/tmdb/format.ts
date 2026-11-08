// Texto da linha de informações dos cards: Movie, 2h 15min, Action, ★ 7.5.
export const formatRuntime = (minutes: number | null | undefined) => {
  if (!minutes) return null;
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes}min`;
};

type CardInfo = {
  mediaType: 'movie' | 'tv';
  runtime?: number | null;
  genre?: string | null;
  voteAverage?: number | null;
  // Temporadas de uma série (entram na linha de informações; ignoradas em filmes).
  seasons?: number | null;
};

export const cardMetaParts = (info: CardInfo): string[] =>
  [
    info.mediaType === 'movie' ? 'Movie' : 'Series',
    info.mediaType === 'tv' && info.seasons ? `${info.seasons} ${info.seasons === 1 ? 'season' : 'seasons'}` : null,
    formatRuntime(info.runtime),
    info.genre,
    info.voteAverage && info.voteAverage > 0 ? `★ ${info.voteAverage.toFixed(1)}` : null,
  ].filter((part): part is string => Boolean(part));

// Cada informação vira um <span>; o espaçamento entre elas é feito por gap no CSS.
export const setCardMeta = (element: HTMLElement, info: CardInfo) => {
  element.replaceChildren(
    ...cardMetaParts(info).map((part) => {
      const span = document.createElement('span');
      span.textContent = part;
      return span;
    }),
  );
};

export interface SeriesStatusTag {
  label: string;
  tone: 'ongoing' | 'ended' | 'canceled';
}

// Situação da série para as tags (página do título e cards). Filmes e situações sem tag devolvem null.
export const seriesStatusTag = (mediaType: 'movie' | 'tv', status: string | null | undefined): SeriesStatusTag | null => {
  if (mediaType !== 'tv') return null;
  switch (status) {
    case 'Returning Series':
    case 'In Production':
      return { label: 'Ongoing', tone: 'ongoing' };
    case 'Ended':
      return { label: 'Ended', tone: 'ended' };
    case 'Canceled':
      return { label: 'Canceled', tone: 'canceled' };
    default:
      return null;
  }
};

// Preenche a tag de situação de um card (elemento .title-card__status); sem situação, ela fica escondida.
export const setCardStatus = (element: HTMLElement, mediaType: 'movie' | 'tv', status: string | null | undefined) => {
  const tag = seriesStatusTag(mediaType, status);
  element.hidden = !tag;
  element.className = tag ? `title-card__status title-card__status--${tag.tone}` : 'title-card__status';
  element.textContent = tag?.label ?? '';
};
