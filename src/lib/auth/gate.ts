// Memória local da autenticação: evita o "flash" de telas protegidas antes do redirecionamento
// e expira o acesso de quem ficou 30 dias sem usar o Aurora neste navegador.

export const IDLE_LIMIT_DAYS = 30;
export const IDLE_LIMIT_MS = IDLE_LIMIT_DAYS * 24 * 60 * 60 * 1000;

export const LAST_ACTIVE_KEY = 'aurora:last-active';
// Guarda o id do usuário que já concluiu o onboarding, para não esconder a tela a cada visita.
export const ONBOARDED_KEY = 'aurora:onboarded';

// Chave onde o supabase-js guarda a sessão (sb-<projeto>-auth-token).
export const sessionStorageKey = (supabaseUrl: string) =>
  `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

// Marca o uso agora. A cada visita, o prazo de 30 dias recomeça.
export function touchActivity() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {
    // Armazenamento indisponível (modo privado, bloqueio): a sessão só não expira por inatividade.
  }
}

// Se passaram 30 dias desde o último uso, apaga a sessão guardada antes de o cliente a ler.
export function enforceIdleLimit() {
  try {
    const last = Number(localStorage.getItem(LAST_ACTIVE_KEY) ?? 0);
    if (last && Date.now() - last > IDLE_LIMIT_MS) {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-'))
        .forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem(ONBOARDED_KEY);
    }
  } catch {
    // Ver touchActivity.
  }
  touchActivity();
}

// Mostra a tela de novo, depois que a proteção de rota confirmou o acesso.
export function releaseGate() {
  document.documentElement.removeAttribute('data-guard');
}

export function rememberOnboarded(userId: string) {
  try {
    localStorage.setItem(ONBOARDED_KEY, userId);
  } catch {
    // Sem armazenamento, a tela só fica escondida até a verificação terminar.
  }
}

// Ao sair, esquece o usuário e o uso.
export function clearAuthMemory() {
  try {
    localStorage.removeItem(ONBOARDED_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {
    // Ver touchActivity.
  }
}
