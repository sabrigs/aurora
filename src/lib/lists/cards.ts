// Cards de lista (Home e My lists): proteção da rota e preenchimento com os dados do usuário.
import { supabase } from '../supabase.js';
import { getListSummaries, LISTS_CHANGED_EVENT, type ListSummary } from './store';
import { posterUrl } from '../tmdb/images';
import { releaseGate, rememberOnboarded } from '../auth/gate';

// Depois que o onboarding é concluído, não muda mais nesta aba: não precisa consultar de novo.
let onboardingDone = false;
let refreshCards: (() => Promise<void>) | null = null;

// Atualiza os cards quando uma lista muda (ex.: título adicionado pelo feed).
window.addEventListener(LISTS_CHANGED_EVENT, () => void refreshCards?.());

// Proteção da rota: sem sessão vai para o login; sem onboarding vai para o onboarding.
const redirectIfNeeded = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    window.location.replace('/login');
    return false;
  }
  if (onboardingDone) {
    releaseGate();
    return true;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('user_id', session.user.id)
    .single();
  if (!profile?.onboarding_completed) {
    window.location.replace('/onboarding');
    return false;
  }
  onboardingDone = true;
  rememberOnboarded(session.user.id);
  releaseGate();
  return true;
};

// Preenche um card: contador e prévia em leque (centro = mais recente).
const renderCard = (summary: ListSummary) => {
  const card = document.querySelector<HTMLElement>(`[data-list-kind="${summary.kind}"]`);
  if (!card) return;

  card.querySelector<HTMLElement>('[data-count]')!.textContent = String(summary.count);

  const slots = card.querySelectorAll<HTMLElement>('[data-poster]');
  // Ordem visual: esquerda, centro (mais recente), direita.
  const order = [1, 0, 2];
  order.forEach((slotIndex, position) => {
    const slot = slots[slotIndex];
    const item = summary.recent[position];
    const poster = posterUrl(item?.posterPath ?? null);

    slot.classList.remove('poster--loading');
    if (poster) {
      slot.style.backgroundImage = `url("${poster}")`;
      slot.style.backgroundSize = 'cover';
    } else {
      slot.classList.add('poster--silhouette');
    }
  });
};

const refresh = async () => {
  try {
    const summaries = await getListSummaries();
    summaries.forEach(renderCard);
  } catch (error) {
    console.error(error);
    // Sem dados: os pôsteres param de carregar e mostram a silhueta.
    document.querySelectorAll('[data-poster].poster--loading').forEach((slot) => {
      slot.classList.remove('poster--loading');
      slot.classList.add('poster--silhouette');
    });
  }
};

// Chamado a cada visita a uma tela com cards de lista.
export function initListCards() {
  refreshCards = refresh;
  void redirectIfNeeded().then((ok) => {
    if (ok) void refresh();
  });
}
