// Filtros da busca/Explore (botão de filtro ao lado da busca, na navbar). O estado vive aqui para que
// a navbar, que persiste entre telas, e o feed da Home usem os mesmos valores.
export type Category = 'all' | 'movie' | 'tv';
export type StreamingScope = 'all' | 'mine';

export interface ExploreFilters {
  // Esconde os títulos que já estão em alguma das listas do usuário.
  hideListed: boolean;
  category: Category;
  streamings: StreamingScope;
}

export const FILTERS_EVENT = 'aurora:filters';

export const DEFAULT_FILTERS: ExploreFilters = { hideListed: false, category: 'all', streamings: 'all' };

let current: ExploreFilters = { ...DEFAULT_FILTERS };

export const getFilters = (): ExploreFilters => ({ ...current });

export const filtersEqual = (a: ExploreFilters, b: ExploreFilters) =>
  a.hideListed === b.hideListed && a.category === b.category && a.streamings === b.streamings;

// Atualiza e avisa quem escuta (navbar para os checks, Explore para refazer a busca).
export const setFilters = (next: Partial<ExploreFilters>) => {
  const updated = { ...current, ...next };
  if (filtersEqual(updated, current)) return;
  current = updated;
  document.dispatchEvent(new CustomEvent(FILTERS_EVENT, { detail: getFilters() }));
};

// Quantos filtros estão ativos (para marcar o botão da navbar).
export const activeFilterCount = (filters: ExploreFilters = current) =>
  Number(filters.hideListed) + Number(filters.category !== 'all') + Number(filters.streamings !== 'all');
