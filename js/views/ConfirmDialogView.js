/**
 * ConfirmDialogView
 * Custom, accessible modal confirmation dialog adhering strictly to the warm minimalist design system.
 * Eliminates all native browser dialogs (confirm, alert, prompt).
 */

export class ConfirmDialogView {
  constructor() {
    this.modal = document.getElementById('confirm-modal');
    this.title = document.getElementById('confirm-title');
    this.message = document.getElementById('confirm-message');
    this.btnAccept = document.getElementById('btn-accept-confirm');
    this.btnCancel = document.getElementById('btn-cancel-confirm');
    this.btnClose = document.getElementById('btn-close-confirm');
    this._onConfirm = null;

    this._bindInternalEvents();
  }

  show({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = true,
    onConfirm
  }) {
    if (this.title) this.title.textContent = title;
    if (this.message) this.message.textContent = message;
    if (this.btnCancel) this.btnCancel.textContent = cancelText;

    if (this.btnAccept) {
      this.btnAccept.textContent = confirmText;
      this.btnAccept.className = danger ? 'btn-danger-cta' : 'btn-primary-cta';
    }

    this._onConfirm = onConfirm;

    if (this.modal) {
      this.modal.classList.add('open');
      this.modal.setAttribute('aria-hidden', 'false');
      if (this.btnAccept) this.btnAccept.focus();
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('open');
      this.modal.setAttribute('aria-hidden', 'true');
    }
    this._onConfirm = null;
  }

  isOpen() {
    return this.modal ? this.modal.classList.contains('open') : false;
  }

  _bindInternalEvents() {
    if (this.btnCancel) {
      this.btnCancel.addEventListener('click', () => this.close());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.close());
    }
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });
    }
    if (this.btnAccept) {
      this.btnAccept.addEventListener('click', () => {
        const callback = this._onConfirm;
        this.close();
        if (callback) callback();
      });
    }
  }
}
