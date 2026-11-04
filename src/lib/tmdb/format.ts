// Texto da linha de informações dos cards: "Movie • 2h 15min • Action • ★ 7.5".
export const formatRuntime = (minutes: number | null | undefined) => {
  if (!minutes) return null;
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes}min`;
};

export const cardMeta = (info: {
  mediaType: 'movie' | 'tv';
  runtime?: number | null;
  genre?: string | null;
  voteAverage?: number | null;
}) =>
  [
    info.mediaType === 'movie' ? 'Movie' : 'Series',
    formatRuntime(info.runtime),
    info.genre,
    info.voteAverage && info.voteAverage > 0 ? `★ ${info.voteAverage.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(' • ');
