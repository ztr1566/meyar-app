export class Toast {
  static container = null;

  static initContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'meyar-toast-container';
      this.container.className = 'fixed bottom-6 end-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none';
      document.body.appendChild(this.container);
    }
  }

  static show({ title = '', message = '', type = 'info', duration = 3500 } = {}) {
    this.initContainer();

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-start gap-3 p-4 bg-surface-2 border border-border-subtle shadow-xl rounded-lg text-start transition-all duration-300 transform translate-y-2 opacity-0';
    
    let iconSvg = '';
    let accentClass = 'text-brand-gold';
    if (type === 'success') {
      accentClass = 'text-brand-emerald';
      iconSvg = `<svg class="w-5 h-5 ${accentClass} shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
    } else if (type === 'error') {
      accentClass = 'text-red-500';
      iconSvg = `<svg class="w-5 h-5 ${accentClass} shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg class="w-5 h-5 ${accentClass} shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="flex-1">
        ${title ? `<h4 class="text-sm font-semibold text-text-main mb-0.5">${title}</h4>` : ''}
        <p class="text-xs text-text-muted leading-relaxed">${message}</p>
      </div>
      <button type="button" class="text-text-muted hover:text-text-main p-1 ms-2 shrink-0 rounded transition-colors" aria-label="Close">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }

  static dismiss(toast) {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }

  static success(message, title = '') {
    this.show({ title, message, type: 'success' });
  }

  static error(message, title = '') {
    this.show({ title, message, type: 'error' });
  }

  static info(message, title = '') {
    this.show({ title, message, type: 'info' });
  }
}
