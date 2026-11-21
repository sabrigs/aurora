// Cards de lista (Home e My lists): proteção da rota e preenchimento com os dados do usuário.
import { supabase } from '../supabase.js';
import { getListSummaries, LISTS_CHANGED_EVENT, peekListSummaries, type ListSummary } from './store';
import { posterUrl } from '../tmdb/images';
import { releaseGate, rememberOnboarded } from '../auth/gate';
import { apiFetch } from '../api';
import { currentLang } from '../i18n';
import { readCardSummary, writeCardSummary, type CardSummary } from '../tmdb/card-cache';

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

// Pôster no idioma da interface. Em inglês vale o que ficou salvo na lista; em outro idioma, o pôster vem da TMDB
// (cache local primeiro). Se não houver pôster traduzido, fica o que está salvo; nada é trocado à mão.
const applyPoster = (slot: HTMLElement, posterPath: string | null) => {
  const poster = posterUrl(posterPath, 'w185');
  slot.classList.remove('poster--loading');
  if (poster) {
    slot.classList.remove('poster--silhouette');
    slot.style.backgroundImage = `url("${poster}")`;
  } else {
    slot.style.backgroundImage = '';
    slot.classList.add('poster--silhouette');
  }
};

const localizePoster = (slot: HTMLElement, item: ListSummary['recent'][number]) => {
  const cached = readCardSummary(item.mediaType, item.tmdbId);
  if (cached) {
    if (cached.posterPath) applyPoster(slot, cached.posterPath);
    return;
  }
  void apiFetch(`/api/titles/${item.mediaType}/${item.tmdbId}`)
    .then((response) => (response.ok ? (response.json() as Promise<CardSummary>) : null))
    .then((summary) => {
      if (!summary) return;
      writeCardSummary(item.mediaType, item.tmdbId, summary);
      if (summary.posterPath) applyPoster(slot, summary.posterPath);
    })
    .catch(() => {});
};

// Preenche um card: contador e miniatura 2x2 (o mais recente fica no topo à esquerda).
const renderCard = (summary: ListSummary) => {
  const card = document.querySelector<HTMLElement>(`[data-list-kind="${summary.kind}"]`);
  if (!card) return;

  card.querySelector<HTMLElement>('[data-count]')!.textContent = String(summary.count);

  card.querySelectorAll<HTMLElement>('[data-poster]').forEach((slot, index) => {
    const item = summary.recent[index];
    applyPoster(slot, item?.posterPath ?? null);
    if (item && currentLang() !== 'en') localizePoster(slot, item);
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
  // Dados já em cache: preenche na hora, sem passar pelo skeleton. O skeleton fica só para quem espera a request.
  peekListSummaries()?.forEach(renderCard);
  void redirectIfNeeded().then((ok) => {
    if (ok) void refresh();
  });
}
