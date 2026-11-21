// Navegação de volta: restaura o estado da tela anterior quando o usuário volta pelo histórico.

// True quando esta entrada do histórico já foi visitada antes (ex.: o usuário voltou para ela).
// Marca a entrada na primeira visita, então funciona com navegação completa e com a
// navegação sem recarregar a página (ClientRouter).
export function isReturningVisit(): boolean {
  const returning = history.state?.auroraVisited === true;
  history.replaceState({ ...history.state, auroraVisited: true }, '');
  return returning;
}

// Executa `save` antes de sair da tela, seja por recarregamento ou por navegação interna.
export function onLeave(save: () => void) {
  window.addEventListener('pagehide', save);
  document.addEventListener('astro:before-preparation', save);
}

// Estado guardado por tela (aba, filtros, itens já carregados) entre navegações.
export function saveScreenState<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Armazenamento indisponível (modo privado, bloqueio): a tela só não é restaurada.
  }
}

export function loadScreenState<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// Há uma tela anterior do próprio app? `history.length` não serve: conta também páginas de fora e entradas
// à frente, e o "voltar" sairia do app. O roteador numera as entradas (state.index; 0 = a primeira do app nesta aba)
// e, quando a tela foi aberta por navegação completa, o referrer do mesmo site mostra de onde ela veio.
export function hasInAppHistory(): boolean {
  const index = history.state?.index;
  if (typeof index === 'number' && index > 0) return true;
  try {
    return document.referrer !== '' && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

// Botão "Back": volta no histórico (o mesmo destino do voltar do navegador) quando há uma tela anterior do app;
// senão segue o href do link, que é a tela "mãe".
export function bindBackLink(link: HTMLAnchorElement) {
  link.addEventListener('click', (event) => {
    if (hasInAppHistory()) {
      event.preventDefault();
      history.back();
    }
  });
}
