export class Modal {
  static activeModal = null;

  static open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    this.activeModal = modal;

    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();

    window.dispatchEvent(new CustomEvent('meyar:modal-opened', { detail: { modalId } }));
  }

  static close(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    this.activeModal = null;

    window.dispatchEvent(new CustomEvent('meyar:modal-closed', { detail: { modalId: modal.id } }));
  }

  static init() {
    document.addEventListener('click', (e) => {
      const openTrigger = e.target.closest('[data-modal-target]');
      if (openTrigger) {
        e.preventDefault();
        const targetId = openTrigger.getAttribute('data-modal-target');
        this.open(targetId);
        return;
      }

      const closeTrigger = e.target.closest('[data-modal-close]');
      if (closeTrigger) {
        e.preventDefault();
        const modal = closeTrigger.closest('[role="dialog"]') || this.activeModal;
        if (modal) this.close(modal);
        return;
      }

      if (e.target.hasAttribute('data-modal-backdrop')) {
        const modal = e.target.closest('[role="dialog"]');
        if (modal) this.close(modal);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });
  }
}
