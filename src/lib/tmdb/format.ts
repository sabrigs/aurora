import { logoUrl } from './images';
import { currentLang, t, type Lang } from '../i18n';

// Texto das informações dos cards: Movie, 2024, 2h 15min / Action, ★ 7.5.
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
  // Ano de lançamento; em séries, `lastSeasonYear` é o ano da última temporada.
  year?: number | null;
  lastSeasonYear?: number | null;
};

// Filme: "2024". Série: "2020 - 2024" (ano da primeira e da última temporada) ou só "2020" se forem o mesmo.
export const formatYears = (info: Pick<CardInfo, 'mediaType' | 'year' | 'lastSeasonYear'>): string | null => {
  if (!info.year) return null;
  if (info.mediaType === 'tv' && info.lastSeasonYear && info.lastSeasonYear > info.year) {
    return `${info.year} - ${info.lastSeasonYear}`;
  }
  return String(info.year);
};

// Informações do card em duas linhas:
//   1) categoria, ano, (temporadas) e duração   2) gênero e nota.
export const cardMetaRows = (info: CardInfo, lang: Lang = currentLang()): string[][] =>
  [
    [
      info.mediaType === 'movie' ? t('card.movie', undefined, lang) : t('card.series', undefined, lang),
      formatYears(info),
      info.mediaType === 'tv' && info.seasons
        ? t(info.seasons === 1 ? 'card.season' : 'card.seasons', { n: info.seasons }, lang)
        : null,
      // Duração só para filmes: em séries o que importa são as temporadas.
      info.mediaType === 'movie' ? formatRuntime(info.runtime) : null,
    ],
    [info.genre, info.voteAverage && info.voteAverage > 0 ? `★ ${info.voteAverage.toFixed(1)}` : null],
  ]
    .map((row) => row.filter((part): part is string => Boolean(part)))
    .filter((row) => row.length > 0);

// Cada linha vira um <span class="title-card__meta-row"> e cada informação um <span>;
// o espaçamento é feito por gap no CSS.
export const setCardMeta = (element: HTMLElement, info: CardInfo) => {
  const lang = currentLang();
  element.replaceChildren(
    ...cardMetaRows(info, lang).map((row) => {
      const line = document.createElement('span');
      line.className = 'title-card__meta-row';
      line.replaceChildren(
        ...row.map((part) => {
          const span = document.createElement('span');
          span.textContent = part;
          return span;
        }),
      );
      return line;
    }),
  );
};

export interface SeriesStatusTag {
  label: string;
  tone: 'ongoing' | 'ended' | 'canceled';
}

// Situação da série para as tags (página do título e cards). Filmes e situações sem tag devolvem null.
export const seriesStatusTag = (
  mediaType: 'movie' | 'tv',
  status: string | null | undefined,
  lang: Lang = currentLang(),
): SeriesStatusTag | null => {
  if (mediaType !== 'tv') return null;
  switch (status) {
    case 'Returning Series':
    case 'In Production':
      return { label: t('status.ongoing', undefined, lang), tone: 'ongoing' };
    case 'Ended':
      return { label: t('status.ended', undefined, lang), tone: 'ended' };
    case 'Canceled':
      return { label: t('status.canceled', undefined, lang), tone: 'canceled' };
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

export const providerPillWidth = (count: number) => {
  const circles = Math.min(count, MAX_PROVIDER_LOGOS + 1);
  return circles === 0 ? 0 : 16 + 24 + (circles - 1) * 16;
};

export interface CardProviderLogo {
  name: string;
  logoPath: string | null;
}

// No máximo 3 logos; se houver mais streamings, entra um círculo com "+" no lugar do resto.
export const MAX_PROVIDER_LOGOS = 3;

// Preenche a pílula de logos de streaming do card (.title-card__providers); sem streamings, fica escondida.
export const setCardProviders = (element: HTMLElement, providers: CardProviderLogo[] | null | undefined) => {
  const list = providers ?? [];
  element.hidden = list.length === 0;
  const card = element.closest<HTMLElement>('.title-card');
  card?.classList.toggle('has-providers', list.length > 0);
  // Largura da pílula: padding de 8px + logos de 24px que se sobrepõem em 8px (máx. 3 logos + "+").
  card?.style.setProperty('--providers-w', `${providerPillWidth(list.length)}px`);
  element.replaceChildren(
    ...list.slice(0, MAX_PROVIDER_LOGOS).map((provider) => {
      const logo = document.createElement('img');
      logo.className = 'title-card__provider';
      logo.alt = provider.name;
      logo.title = provider.name;
      logo.loading = 'lazy';
      logo.decoding = 'async';
      const src = logoUrl(provider.logoPath);
      if (src) logo.src = src;
      return logo;
    }),
    ...(list.length > MAX_PROVIDER_LOGOS
      ? [
          Object.assign(document.createElement('span'), {
            className: 'title-card__provider title-card__provider--more',
            textContent: '+',
            ariaLabel: t('card.moreStreamings'),
          }),
        ]
      : []),
  );
};
