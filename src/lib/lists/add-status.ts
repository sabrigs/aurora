// Lógica do botão Add/status: "+ Add" vira badge verde com dropdown conforme o estado do título.
// Usado pelo componente AddStatusButton e pelos cards criados dinamicamente (Explore).
import {
  addToWatch,
  getTitleStatus,
  markFavorite,
  markWatched,
  removeFromFavorites,
  removeFromToWatch,
  removeFromWatched,
  type SystemKind,
  type TitleRef,
} from './store';
import { WebHaptics } from 'web-haptics';
import { enableLightDismiss, openPopover } from '../ui/popover';

// Em telas de toque o feedback é tátil; no desktop (mouse) a lib toca um clique de áudio no lugar.
const haptics = new WebHaptics({
  debug: typeof matchMedia === 'function' && !matchMedia('(pointer: coarse)').matches,
});

const svg = (body: string) =>
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const ICONS = {
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5" />'),
  heart: svg('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" />'),
  heartBroken: svg('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" /><path d="M12 7.4l-2 3.6 3 2-1.5 3.5" />'),
} as const;

type Action = (ref: TitleRef, status: Set<SystemKind>) => Promise<void>;

const ACTIONS: Record<string, { label: string; icon: string; run: Action }> = {
  'remove-to-watch': { icon: ICONS.trash, label: 'Remove from to watch', run: (ref) => removeFromToWatch(ref) },
  'mark-watched': { icon: ICONS.check, label: 'Mark as watched', run: (ref) => markWatched(ref) },
  'mark-favorite': { icon: ICONS.heart, label: 'Mark as favorite', run: (ref, status) => markFavorite(ref, status) },
  'remove-watched': { icon: ICONS.trash, label: 'Remove from watched', run: (ref) => removeFromWatched(ref) },
  'remove-favorite': { icon: ICONS.heartBroken, label: 'Remove from favorites', run: (ref) => removeFromFavorites(ref) },
};

// Opções mudam conforme o estado atual do título.
const menuFor = (status: Set<SystemKind>): string[] => {
  const keys: string[] = [];
  if (status.has('to_watch')) {
    keys.push('remove-to-watch', 'mark-watched', 'mark-favorite');
  }
  if (status.has('watched')) {
    keys.push('remove-watched');
    keys.push(status.has('favorites') ? 'remove-favorite' : 'mark-favorite');
  }
  return keys;
};

const refFrom = (root: HTMLElement): TitleRef => ({
  tmdbId: Number(root.dataset.tmdbId),
  mediaType: root.dataset.mediaType as TitleRef['mediaType'],
  title: root.dataset.title ?? '',
  posterPath: root.dataset.posterPath || null,
});

export const initAddStatus = async (root: HTMLElement) => {
  const addButton = root.querySelector<HTMLButtonElement>('[data-add]')!;
  const badge = root.querySelector<HTMLButtonElement>('[data-badge]')!;
  const dialog = root.querySelector<HTMLDialogElement>('[data-menu]')!;
  const itemsBox = root.querySelector<HTMLElement>('[data-menu-items]')!;
  const ref = refFrom(root);

  // Rótulos de acessibilidade com o título real (os cards são criados dinamicamente).
  badge.setAttribute('aria-label', `${ref.title} is in your lists. Open options`);
  dialog.setAttribute('aria-label', `Options for ${ref.title}`);

  enableLightDismiss(dialog);

  const render = (status: Set<SystemKind>, justAdded = false) => {
    const added = status.size > 0;
    addButton.hidden = added;
    badge.hidden = !added;
    if (added && justAdded) {
      badge.classList.remove('is-entering');
      void badge.offsetWidth;
      badge.classList.add('is-entering');
    }

    itemsBox.replaceChildren(
      ...menuFor(status).map((key) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'menu-item';
        button.innerHTML = `${ACTIONS[key].icon}<span></span>`;
        button.querySelector('span')!.textContent = ACTIONS[key].label;
        button.addEventListener('click', () => runAction(key, status));
        return button;
      }),
    );
  };

  const refresh = async (justAdded = false) => {
    const status = await getTitleStatus(ref);
    render(status, justAdded);
    return status;
  };

  const runAction = async (key: string, status: Set<SystemKind>) => {
    const buttons = itemsBox.querySelectorAll<HTMLButtonElement>('button');
    haptics.trigger('success');
    buttons.forEach((button) => (button.disabled = true));
    try {
      await ACTIONS[key].run(ref, status);
      dialog.close();
    } catch (error) {
      console.error(error);
      buttons.forEach((button) => (button.disabled = false));
    }
    await refresh();
  };

  addButton.addEventListener('click', async () => {
    haptics.trigger('success');
    addButton.disabled = true;
    try {
      await addToWatch(ref);
      await refresh(true);
    } catch (error) {
      console.error(error);
    } finally {
      addButton.disabled = false;
    }
  });

  badge.addEventListener('click', () => openPopover(dialog, badge));

  try {
    await refresh();
  } catch (error) {
    // Sem sessão ou sem rede: o botão fica oculto em vez de mostrar um estado errado.
    console.error(error);
  }
};
