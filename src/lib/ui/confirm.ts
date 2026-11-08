// Diálogo de confirmação: bottom sheet no mobile, caixa centralizada no desktop.
// A ação principal roda dentro do diálogo: ele mostra "busy" enquanto processa e uma mensagem de erro se falhar,
// sem fechar. Resolve true quando a ação termina e false quando a pessoa cancela.
import { openPopover } from './popover';

const DESKTOP_QUERY = '(min-width: 768px)';

export interface ConfirmOptions {
  title: string;
  // Texto do corpo; elementos (ex.: <em> com o nome da série) entram como estão.
  body: (string | Node)[];
  confirmLabel: string;
  busyLabel: string;
  errorMessage: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void>;
}

let counter = 0;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  const id = `confirm-${(counter += 1)}`;

  const dialog = document.createElement('dialog');
  dialog.className = 'popover confirm';
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  dialog.setAttribute('aria-describedby', `${id}-body`);

  const title = document.createElement('h2');
  title.id = `${id}-title`;
  title.className = 'confirm-title';
  title.textContent = options.title;

  const body = document.createElement('p');
  body.id = `${id}-body`;
  body.className = 'confirm-body';
  body.append(...options.body);

  const error = document.createElement('p');
  error.className = 'confirm-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;
  error.textContent = options.errorMessage;

  const actions = document.createElement('div');
  actions.className = 'confirm-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'confirm-button';
  cancel.textContent = options.cancelLabel ?? 'Cancel';
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'confirm-button confirm-button--primary';
  confirm.textContent = options.confirmLabel;
  actions.append(cancel, confirm);

  dialog.append(title, body, error, actions);
  document.body.append(dialog);

  return new Promise<boolean>((resolve) => {
    let busy = false;
    let succeeded = false;

    cancel.addEventListener('click', () => dialog.close());

    confirm.addEventListener('click', async () => {
      busy = true;
      error.hidden = true;
      cancel.disabled = true;
      confirm.disabled = true;
      confirm.textContent = options.busyLabel;
      try {
        await options.onConfirm();
        succeeded = true;
        busy = false;
        dialog.close();
      } catch (failure) {
        console.error(failure);
        busy = false;
        error.hidden = false;
        cancel.disabled = false;
        confirm.disabled = false;
        confirm.textContent = options.confirmLabel;
      }
    });

    // Esc e clique fora cancelam, exceto enquanto a ação está rodando.
    dialog.addEventListener('cancel', (event) => {
      if (busy) event.preventDefault();
    });
    dialog.addEventListener('click', (event) => {
      if (busy || event.target !== dialog || dialog.dataset.dragged === 'true') return;
      const rect = dialog.getBoundingClientRect();
      const outside =
        event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close();
    });

    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(succeeded);
    });

    if (window.matchMedia(DESKTOP_QUERY).matches) {
      dialog.showModal();
    } else {
      // No mobile o helper cuida do bottom sheet (alça e arrastar para fechar).
      openPopover(dialog, document.body);
    }
  });
}
