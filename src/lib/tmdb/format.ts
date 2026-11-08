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
};

export const cardMetaParts = (info: CardInfo): string[] =>
  [
    info.mediaType === 'movie' ? 'Movie' : 'Series',
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
