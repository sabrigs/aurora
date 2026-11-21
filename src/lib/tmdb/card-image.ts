// Fundo dos cards de título: o backdrop (ou o pôster, se não houver) como <img>, mais uma cópia
// borrada na parte de baixo. Usar <img> deixa o navegador carregar sob demanda (lazy), reaproveitar o
// cache HTTP e mostrar o card inteiro de uma vez, em vez de o efeito aparecer depois da imagem.
import { posterUrl } from './images';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

// O backdrop é fixo para cada título: sempre o mesmo tamanho (w780), então a URL não muda e o cache vale.
export const backdropUrl = (backdropPath: string | null, posterPath: string | null) =>
  backdropPath ? `${IMAGE_BASE}/w780${backdropPath}` : posterUrl(posterPath, 'w500');

// Marcação do fundo, igual nos templates do Explore, das listas e dos relacionados.
export const CARD_MEDIA_HTML =
  '<div class="title-card__media" aria-hidden="true"><img class="title-card__backdrop" alt="" decoding="async" /><div class="title-card__blur"><img alt="" decoding="async" /></div></div>';

// Aplica a imagem de fundo num card criado no cliente. `eager` carrega já (primeiros cards da tela);
// os demais só quando chegam perto da área visível. O card aparece (is-loaded) quando a imagem chega.
export function setCardBackdrop(card: HTMLElement, url: string | null, eager = false) {
  const images = card.querySelectorAll<HTMLImageElement>('.title-card__media img');
  const main = images[0];
  const done = () => card.classList.add('is-loaded');

  if (!url || !main) {
    done();
    return;
  }

  main.addEventListener('load', done, { once: true });
  main.addEventListener('error', done, { once: true });
  images.forEach((image) => {
    image.loading = eager ? 'eager' : 'lazy';
    if (eager) image.fetchPriority = 'high';
    image.src = url;
  });
  if (main.complete && main.naturalWidth > 0) done();
}
