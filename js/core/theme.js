export class ThemeManager {
  static THEME_KEY = 'meyar_theme';

  static getTheme() {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  static setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(this.THEME_KEY, theme);
    window.dispatchEvent(new CustomEvent('meyar:theme-changed', { detail: { theme } }));
    this.updateToggleButtons(theme);
  }

  static toggleTheme() {
    const current = this.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  static updateToggleButtons(theme) {
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }

  static init() {
    const theme = this.getTheme();
    this.setTheme(theme);

    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle-theme"]');
      if (toggleBtn) {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
