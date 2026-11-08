// Estado da busca global (campo na navbar). Dois atributos no <html> guiam o CSS:
// - data-search-open: barra de busca aberta (mobile, aberta pela tab Search);
// - data-search="on": em modo busca, a Home esconde listas e abas e mostra só o resultado.
const root = document.documentElement;

export const headerSearchInput = () =>
  document.getElementById('header-search-input') as HTMLInputElement | null;

export const syncSearchMode = () => {
  const active = Boolean(headerSearchInput()?.value.trim()) || root.hasAttribute('data-search-open');
  if (active) root.setAttribute('data-search', 'on');
  else root.removeAttribute('data-search');
};

export const setSearchOpen = (open: boolean) => {
  if (open) root.setAttribute('data-search-open', '');
  else root.removeAttribute('data-search-open');
  syncSearchMode();
  if (open) headerSearchInput()?.focus();
};

export const setSearchQuery = (query: string) => {
  const input = headerSearchInput();
  if (input) input.value = query;
  syncSearchMode();
};

export const announceSearch = (query: string, immediate = false) =>
  document.dispatchEvent(new CustomEvent('aurora:search', { detail: { query, immediate } }));

// X da busca: limpa o texto, fecha a barra e devolve a Home ao normal.
export const clearSearch = () => {
  setSearchQuery('');
  setSearchOpen(false);
  announceSearch('', true);
};
