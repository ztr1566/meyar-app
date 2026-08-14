/**
 * Meyar (معيار) Bilingual Translation Engine
 * Handles instant client-side switching between Arabic (RTL) and English (LTR),
 * dynamic DOM translation updates, interpolation, event broadcasting, and persistent preference.
 */

import { translations } from '../data/translations.js';

export class I18n {
  static LANG_KEY = 'meyar_lang';

  /**
   * Get current active language code ('ar' or 'en')
   * Defaults to 'ar' (Arabic)
   * @returns {'ar'|'en'}
   */
  static getLang() {
    try {
      const stored = localStorage.getItem(this.LANG_KEY);
      return stored === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  }

  /**
   * Set active language, sync DOM attributes, translate elements, and notify listeners
   * @param {string} lang - 'ar' or 'en'
   */
  static setLang(lang) {
    const validLang = lang === 'en' ? 'en' : 'ar';
    try {
      localStorage.setItem(this.LANG_KEY, validLang);
    } catch {
      // Storage unavailable or disabled
    }

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('lang', validLang);
      document.documentElement.setAttribute('dir', validLang === 'ar' ? 'rtl' : 'ltr');
      this.translatePage();
      this.updateLanguageButtons(validLang);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('meyar:lang-changed', {
            detail: { lang: validLang }
          })
        );
      } catch {
        // Fallback for custom event
      }
    }

    return validLang;
  }

  /**
   * Toggle between Arabic and English
   * @returns {'ar'|'en'} The newly active language
   */
  static toggleLang() {
    const current = this.getLang();
    const next = current === 'ar' ? 'en' : 'ar';
    this.setLang(next);
    return next;
  }

  /**
   * Translate a key with optional dynamic parameter interpolation
   * @param {string} key - Dictionary translation key
   * @param {Record<string, string|number>} [params] - Interpolation params, e.g. { number: 1 }
   * @returns {string}
   */
  static t(key, params = {}) {
    if (!key) return '';
    const lang = this.getLang();
    const dict = translations[lang] || translations.ar || {};
    const fallbackDict = translations.en || {};

    let text = dict[key] !== undefined 
      ? dict[key] 
      : (fallbackDict[key] !== undefined ? fallbackDict[key] : key);

    if (typeof text !== 'string') {
      text = String(text);
    }

    if (params && typeof params === 'object') {
      Object.keys(params).forEach((param) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
      });
    }

    return text;
  }

  /**
   * Scan and translate all DOM nodes carrying data-i18n attributes
   * @param {HTMLElement|Document} [root=document]
   */
  static translatePage(root = typeof document !== 'undefined' ? document : null) {
    if (!root) return;

    const lang = this.getLang();
    const dict = translations[lang] || translations.ar || {};
    const fallbackDict = translations.en || {};

    const resolveTranslation = (k) => {
      return dict[k] !== undefined ? dict[k] : (fallbackDict[k] !== undefined ? fallbackDict[k] : null);
    };

    // 1. Text content: [data-i18n]
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = resolveTranslation(key);
      if (val !== null) {
        el.textContent = val;
      }
    });

    // 2. Form Placeholders: [data-i18n-placeholder]
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = resolveTranslation(key);
      if (val !== null) {
        el.setAttribute('placeholder', val);
      }
    });

    // 3. Titles & Tooltips: [data-i18n-title]
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const val = resolveTranslation(key);
      if (val !== null) {
        el.setAttribute('title', val);
      }
    });

    // 4. Accessibility Labels: [data-i18n-aria-label]
    root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      const val = resolveTranslation(key);
      if (val !== null) {
        el.setAttribute('aria-label', val);
      }
    });
  }

  /**
   * Update visual labels of language toggle buttons
   * @param {'ar'|'en'} lang - Current active language
   */
  static updateLanguageButtons(lang) {
    if (typeof document === 'undefined') return;

    // Display the opposing language name as the target to switch to
    const targetLabel = lang === 'ar' ? 'English' : 'العربية';
    const targetLangCode = lang === 'ar' ? 'en' : 'ar';

    document.querySelectorAll('[data-action="toggle-lang"]').forEach((btn) => {
      btn.setAttribute('data-target-lang', targetLangCode);
      btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية');

      const label = btn.querySelector('.lang-label');
      if (label) {
        label.textContent = targetLabel;
      }
    });
  }

  /**
   * Initialize i18n engine on page load
   */
  static init() {
    const lang = this.getLang();
    this.setLang(lang);

    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e) => {
        const toggleBtn = e.target && e.target.closest ? e.target.closest('[data-action="toggle-lang"]') : null;
        if (toggleBtn) {
          e.preventDefault();
          this.toggleLang();
        }
      });
    }
  }
}
