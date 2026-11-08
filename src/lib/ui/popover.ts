// Dropdown compartilhado, em <dialog> modal (o fundo fica inerte nos dois layouts).
// Desktop: ancorado ao gatilho. Mobile: bottom sheet com overlay de 50% e arrastar para baixo para fechar.

const DESKTOP_QUERY = '(min-width: 768px)';
const CLOSE_DISTANCE = 100; // px arrastados para fechar
const CLOSE_VELOCITY = 0.6; // px/ms

export function openPopover(dialog: HTMLDialogElement, anchor: HTMLElement) {
  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;

  if (!isDesktop) {
    prepareSheet(dialog);
    dialog.style.top = '';
    dialog.style.left = '';
    dialog.style.transform = '';
    dialog.showModal();
    // Sem rolagem, o sheet inteiro responde ao arrastar; com rolagem, só a alça (ver CSS).
    dialog.style.touchAction = dialog.scrollHeight > dialog.clientHeight ? '' : 'none';
    return;
  }

  dialog.showModal();
  const rect = anchor.getBoundingClientRect();
  const left = rect.right - dialog.offsetWidth;
  dialog.style.top = `${rect.bottom + 8}px`;
  dialog.style.left = `${Math.max(16, Math.min(left, window.innerWidth - dialog.offsetWidth - 16))}px`;
}

// Cria a alça e liga o gesto de arrastar, uma única vez por dialog.
function prepareSheet(dialog: HTMLDialogElement) {
  if (dialog.dataset.sheet) return;
  dialog.dataset.sheet = 'true';

  const handle = document.createElement('div');
  handle.className = 'sheet-handle';
  handle.setAttribute('aria-hidden', 'true');
  dialog.prepend(handle);

  const DRAG_THRESHOLD = 6;
  let startY = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocity = 0;
  let armed = false; // pointer apertado em área que pode arrastar
  let dragging = false;

  const onDown = (event: PointerEvent) => {
    dialog.dataset.dragged = '';
    if (window.matchMedia(DESKTOP_QUERY).matches) return;
    const fromHandle = handle.contains(event.target as Node);
    // Em conteúdo que rola, só a alça arrasta; sem rolagem, o sheet inteiro arrasta.
    const scrollable = dialog.scrollHeight > dialog.clientHeight;
    if (!fromHandle && (scrollable || dialog.scrollTop > 0)) return;

    armed = true;
    startY = lastY = event.clientY;
    lastTime = event.timeStamp;
    velocity = 0;
  };

  const onMove = (event: PointerEvent) => {
    if (!armed) return;
    const dy = Math.max(0, event.clientY - startY);
    if (!dragging) {
      // Só vira arrasto depois de um movimento para baixo: toques em itens continuam sendo cliques.
      if (dy < DRAG_THRESHOLD) return;
      dragging = true;
      dialog.dataset.dragged = 'true';
      dialog.style.transition = 'none';
      dialog.setPointerCapture(event.pointerId);
    }
    const dt = event.timeStamp - lastTime;
    if (dt > 0) velocity = (event.clientY - lastY) / dt;
    lastY = event.clientY;
    lastTime = event.timeStamp;
    dialog.style.transform = `translateY(${dy}px)`;
  };

  const onUp = (event: PointerEvent) => {
    armed = false;
    if (!dragging) return;
    dragging = false;
    if (dialog.hasPointerCapture(event.pointerId)) dialog.releasePointerCapture(event.pointerId);

    const dy = Math.max(0, event.clientY - startY);
    dialog.style.transition = 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)';

    if (dy > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) {
      dialog.style.transform = 'translateY(100%)';
      dialog.addEventListener(
        'transitionend',
        () => {
          dialog.close();
          dialog.style.transition = '';
          dialog.style.transform = '';
        },
        { once: true },
      );
    } else {
      dialog.style.transform = '';
    }
  };

  dialog.addEventListener('pointerdown', onDown);
  dialog.addEventListener('pointermove', onMove);
  dialog.addEventListener('pointerup', onUp);
  dialog.addEventListener('pointercancel', onUp);
  dialog.addEventListener('close', () => {
    dialog.style.transition = '';
    dialog.style.transform = '';
  });
}

// Fecha ao clicar fora da caixa do dropdown modal (o clique no backdrop cai no próprio <dialog>).
export function enableLightDismiss(dialog: HTMLDialogElement) {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog || dialog.dataset.dragged === 'true') return;
    const rect = dialog.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (outside) dialog.close();
  });
}
