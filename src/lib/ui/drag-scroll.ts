// Arrastar com o mouse para rolar um carrossel horizontal (no toque o navegador já rola sozinho).
// Durante o arraste o scroll-snap é desligado, para o conteúdo acompanhar o mouse; ao soltar, o
// navegador encaixa no card mais próximo. Um clique logo depois do arraste não abre o link.
const DRAG_THRESHOLD = 5; // px antes de virar arraste: cliques simples continuam funcionando

export function enableDragScroll(container: HTMLElement) {
  if (container.dataset.dragScroll) return;
  container.dataset.dragScroll = 'true';

  let startX = 0;
  let startScroll = 0;
  let pointerId: number | null = null;
  let dragging = false;
  let moved = false;

  // Links e imagens têm arraste nativo, que atrapalha o gesto.
  container.addEventListener('dragstart', (event) => event.preventDefault());

  container.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScroll = container.scrollLeft;
    dragging = false;
    moved = false;
  });

  container.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    if (!dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      dragging = true;
      moved = true;
      container.classList.add('is-dragging');
      container.setPointerCapture(event.pointerId);
    }
    container.scrollLeft = startScroll - dx;
  });

  const end = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    if (!dragging) return;
    dragging = false;
    container.classList.remove('is-dragging');
    if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
  };
  container.addEventListener('pointerup', end);
  container.addEventListener('pointercancel', end);

  // O clique que fecha o arraste não deve abrir o card.
  container.addEventListener(
    'click',
    (event) => {
      if (!moved) return;
      moved = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
}
