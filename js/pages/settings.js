/**
 * Meyar (معيار) Account & Platform Settings Controller
 * Handles multi-section tabs (Profile, Security, Language, Theme, Notifications, B2B),
 * live theme & language switching, form validation, password matching,
 * session revocation, and localStorage persistence.
 */

import { MOCK_DATA } from '../data/mock-data.js';
import { I18n } from '../core/i18n.js';
import { ThemeManager } from '../core/theme.js';
import { Toast } from '../core/toast.js';

export class SettingsPage {
  static STORAGE_KEY = 'meyar_user_settings';
  static activeTab = 'profile'; // profile | security | language | theme | notifications | business
  static isInitialized = false;

  /**
   * Return initial default settings combined with mock user session
   * @returns {object}
   */
  static getDefaultSettings() {
    const user = MOCK_DATA.user || {};
    const biz = user.business_profile || {};

    return {
      profile: {
        name_ar: user.name_ar || 'الشيف فيصل الهاشمي',
        name_en: user.name_en || 'Chef Faisal Al-Hashemi',
        handle: user.handle || '@chef_faisal',
        email: user.email || 'faisal@meyar.sa',
        phone: '+966 50 123 4567',
        location_ar: 'الرياض، المملكة العربية السعودية',
        location_en: 'Riyadh, Saudi Arabia',
        title_ar: user.title_ar || 'المدير التنفيذي للطهي ومستشار فنون الطهي المعاصر',
        title_en: user.title_en || 'Executive Culinary Director & Gastronomy Consultant',
        bio_ar: user.bio_ar || 'رائد فنون الطهي السعودي المعاصر. يعيد ابتكار الوصفات التراثية النجدية والحجازية باستخدام أحدث تقنيات الإنضاج الجاف والتخمير الطبيعي وفنون الطهي الجزيئي.',
        bio_en: user.bio_en || 'Pioneer of modern Saudi fine dining. Reinventing heritage Najdi and Hejazi recipes through precision dry-aging, wild fermentation, and progressive molecular gastronomy.',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
        cover: user.cover || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
      },
      security: {
        two_factor: true,
        login_alerts: true,
        active_sessions_count: 2
      },
      language: {
        lang: I18n.getLang() || 'ar',
        country: 'SA',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        calendar: 'gregorian'
      },
      theme: {
        theme: ThemeManager.getTheme() || 'dark',
        high_contrast: false,
        compact_mode: false
      },
      notifications: {
        email_digest: true,
        email_rfq: true,
        email_courses: true,
        push_messages: true,
        push_social: true,
        push_followers: true,
        sms_urgent: true,
        sms_security: true
      },
      business: {
        company_name_ar: biz.company_name_ar || 'استوديو نجد لفنون الطهي والضيافة',
        company_name_en: biz.company_name_en || 'Najd Culinary Studio & Hospitality Consultancy',
        cr_number: biz.cr_number || '1010894521',
        vat_number: biz.vat_number || '310245896300003',
        category: biz.category || 'Fine Dining & Hospitality Consulting',
        location_ar: biz.location_ar || 'حي حطين، الرياض',
        location_en: biz.location_en || 'Hittin, Riyadh, Saudi Arabia',
        auto_quote: true
      }
    };
  }

  /**
   * Load stored settings or fallback to defaults
   * @returns {object}
   */
  static getSettings() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const defaults = this.getDefaultSettings();
        // Deep merge with defaults to ensure all keys exist
        return {
          profile: { ...defaults.profile, ...(parsed.profile || {}) },
          security: { ...defaults.security, ...(parsed.security || {}) },
          language: { ...defaults.language, ...(parsed.language || {}) },
          theme: { ...defaults.theme, ...(parsed.theme || {}) },
          notifications: { ...defaults.notifications, ...(parsed.notifications || {}) },
          business: { ...defaults.business, ...(parsed.business || {}) }
        };
      }
    } catch (e) {
      console.warn('Failed to parse stored settings, using defaults', e);
    }

    const defaults = this.getDefaultSettings();
    this.saveSettingsToStorage(defaults, false);
    return defaults;
  }

  /**
   * Save settings object directly to localStorage
   * @param {object} settings 
   * @param {boolean} [dispatchEvent=true] 
   */
  static saveSettingsToStorage(settings, dispatchEvent = true) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }

    if (dispatchEvent && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('meyar:settings-updated', {
            detail: { settings }
          })
        );
      } catch (e) {}
    }
  }

  /**
   * Switch active navigation tab
   * @param {string} tabId - 'profile' | 'security' | 'language' | 'theme' | 'notifications' | 'business'
   */
  static switchTab(tabId) {
    const validTabs = ['profile', 'security', 'language', 'theme', 'notifications', 'business'];
    if (!validTabs.includes(tabId)) {
      tabId = 'profile';
    }

    this.activeTab = tabId;

    if (typeof document === 'undefined') return;

    // 1. Update tab navigation buttons
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      const target = btn.getAttribute('data-tab-target');
      const isSelected = target === tabId;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      if (isSelected) {
        btn.classList.remove('text-text-muted', 'bg-transparent', 'hover:bg-surface-2', 'hover:text-text-main');
        btn.classList.add('bg-surface-2', 'text-brand-gold', 'font-bold', 'border-s-2', 'border-brand-gold');
      } else {
        btn.classList.remove('bg-surface-2', 'text-brand-gold', 'font-bold', 'border-s-2', 'border-brand-gold');
        btn.classList.add('text-text-muted', 'bg-transparent', 'hover:bg-surface-2', 'hover:text-text-main');
      }
    });

    // 2. Toggle Tab Panels
    document.querySelectorAll('[data-tab-panel]').forEach(panel => {
      const panelId = panel.getAttribute('data-tab-panel');
      if (panelId === tabId) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    // 3. Update hash in URL
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', `#${tabId}`);
    }
  }

  /**
   * Populate all form fields with settings data
   */
  static populateForm() {
    if (typeof document === 'undefined') return;

    const settings = this.getSettings();

    // Helper for input setting
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    // Helper for checkbox / switch setting
    const setChecked = (id, checked) => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = Boolean(checked);
        // If it has aria-checked, update it
        el.setAttribute('aria-checked', el.checked ? 'true' : 'false');
      }
    };

    // 1. Profile
    setVal('setting-profile-name-ar', settings.profile.name_ar);
    setVal('setting-profile-name-en', settings.profile.name_en);
    setVal('setting-profile-handle', settings.profile.handle);
    setVal('setting-profile-email', settings.profile.email);
    setVal('setting-profile-phone', settings.profile.phone);
    setVal('setting-profile-title-ar', settings.profile.title_ar);
    setVal('setting-profile-title-en', settings.profile.title_en);
    setVal('setting-profile-bio-ar', settings.profile.bio_ar);
    setVal('setting-profile-bio-en', settings.profile.bio_en);
    setVal('setting-profile-location-ar', settings.profile.location_ar);
    setVal('setting-profile-location-en', settings.profile.location_en);

    // Profile previews
    const avatarImg = document.getElementById('setting-avatar-preview');
    if (avatarImg && settings.profile.avatar) {
      avatarImg.src = settings.profile.avatar;
    }

    // 2. Security
    setChecked('setting-security-2fa', settings.security.two_factor);
    setChecked('setting-security-login-alerts', settings.security.login_alerts);

    // 3. Language & Region
    const langSelect = document.getElementById('setting-lang-select');
    if (langSelect) {
      langSelect.value = settings.language.lang || I18n.getLang();
    }
    setVal('setting-country-select', settings.language.country);
    setVal('setting-timezone-select', settings.language.timezone);
    setVal('setting-currency-select', settings.language.currency);

    // 4. Theme & Appearance
    const currentTheme = settings.theme.theme || ThemeManager.getTheme();
    const themeRadios = document.querySelectorAll('input[name="setting-theme-mode"]');
    themeRadios.forEach(radio => {
      radio.checked = (radio.value === currentTheme);
    });
    setChecked('setting-theme-high-contrast', settings.theme.high_contrast);
    setChecked('setting-theme-compact-mode', settings.theme.compact_mode);

    // 5. Notifications
    setChecked('setting-notif-email-digest', settings.notifications.email_digest);
    setChecked('setting-notif-email-rfq', settings.notifications.email_rfq);
    setChecked('setting-notif-email-courses', settings.notifications.email_courses);
    setChecked('setting-notif-push-messages', settings.notifications.push_messages);
    setChecked('setting-notif-push-social', settings.notifications.push_social);
    setChecked('setting-notif-push-followers', settings.notifications.push_followers);
    setChecked('setting-notif-sms-urgent', settings.notifications.sms_urgent);
    setChecked('setting-notif-sms-security', settings.notifications.sms_security);

    // 6. Business B2B
    setVal('setting-biz-name-ar', settings.business.company_name_ar);
    setVal('setting-biz-name-en', settings.business.company_name_en);
    setVal('setting-biz-cr', settings.business.cr_number);
    setVal('setting-biz-vat', settings.business.vat_number);
    setVal('setting-biz-category', settings.business.category);
    setVal('setting-biz-location-ar', settings.business.location_ar);
    setChecked('setting-biz-auto-quote', settings.business.auto_quote);
  }

  /**
   * Collect form values from DOM elements
   * @returns {object}
   */
  static collectFormData() {
    if (typeof document === 'undefined') return this.getSettings();

    const getVal = (id, fallback = '') => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : fallback;
    };

    const getChecked = (id, fallback = false) => {
      const el = document.getElementById(id);
      return el ? el.checked : fallback;
    };

    const selectedThemeRadio = document.querySelector('input[name="setting-theme-mode"]:checked');
    const selectedTheme = selectedThemeRadio ? selectedThemeRadio.value : ThemeManager.getTheme();

    const currentSettings = this.getSettings();

    return {
      profile: {
        name_ar: getVal('setting-profile-name-ar', currentSettings.profile.name_ar),
        name_en: getVal('setting-profile-name-en', currentSettings.profile.name_en),
        handle: getVal('setting-profile-handle', currentSettings.profile.handle),
        email: getVal('setting-profile-email', currentSettings.profile.email),
        phone: getVal('setting-profile-phone', currentSettings.profile.phone),
        title_ar: getVal('setting-profile-title-ar', currentSettings.profile.title_ar),
        title_en: getVal('setting-profile-title-en', currentSettings.profile.title_en),
        bio_ar: getVal('setting-profile-bio-ar', currentSettings.profile.bio_ar),
        bio_en: getVal('setting-profile-bio-en', currentSettings.profile.bio_en),
        location_ar: getVal('setting-profile-location-ar', currentSettings.profile.location_ar),
        location_en: getVal('setting-profile-location-en', currentSettings.profile.location_en),
        avatar: currentSettings.profile.avatar,
        cover: currentSettings.profile.cover
      },
      security: {
        two_factor: getChecked('setting-security-2fa', currentSettings.security.two_factor),
        login_alerts: getChecked('setting-security-login-alerts', currentSettings.security.login_alerts),
        active_sessions_count: currentSettings.security.active_sessions_count
      },
      language: {
        lang: getVal('setting-lang-select', I18n.getLang()),
        country: getVal('setting-country-select', 'SA'),
        timezone: getVal('setting-timezone-select', 'Asia/Riyadh'),
        currency: getVal('setting-currency-select', 'SAR'),
        calendar: 'gregorian'
      },
      theme: {
        theme: selectedTheme,
        high_contrast: getChecked('setting-theme-high-contrast', false),
        compact_mode: getChecked('setting-theme-compact-mode', false)
      },
      notifications: {
        email_digest: getChecked('setting-notif-email-digest', true),
        email_rfq: getChecked('setting-notif-email-rfq', true),
        email_courses: getChecked('setting-notif-email-courses', true),
        push_messages: getChecked('setting-notif-push-messages', true),
        push_social: getChecked('setting-notif-push-social', true),
        push_followers: getChecked('setting-notif-push-followers', true),
        sms_urgent: getChecked('setting-notif-sms-urgent', true),
        sms_security: getChecked('setting-notif-sms-security', true)
      },
      business: {
        company_name_ar: getVal('setting-biz-name-ar', currentSettings.business.company_name_ar),
        company_name_en: getVal('setting-biz-name-en', currentSettings.business.company_name_en),
        cr_number: getVal('setting-biz-cr', currentSettings.business.cr_number),
        vat_number: getVal('setting-biz-vat', currentSettings.business.vat_number),
        category: getVal('setting-biz-category', currentSettings.business.category),
        location_ar: getVal('setting-biz-location-ar', currentSettings.business.location_ar),
        location_en: currentSettings.business.location_en,
        auto_quote: getChecked('setting-biz-auto-quote', true)
      }
    };
  }

  /**
   * Validate settings inputs before saving
   * @returns {{ valid: boolean, message?: string }}
   */
  static validateForm() {
    if (typeof document === 'undefined') return { valid: true };

    const emailEl = document.getElementById('setting-profile-email');
    if (emailEl && emailEl.value) {
      const email = emailEl.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { valid: false, message: 'يرجى إدخال بريد إلكتروني صالح / Please enter a valid email address' };
      }
    }

    // Password validation (if entered in security tab)
    const newPwdEl = document.getElementById('setting-new-pwd');
    const confirmPwdEl = document.getElementById('setting-confirm-pwd');
    if (newPwdEl && newPwdEl.value) {
      const newPwd = newPwdEl.value;
      const confirmPwd = confirmPwdEl ? confirmPwdEl.value : '';
      if (newPwd.length < 6) {
        return { valid: false, message: 'يجب أن لا تقل كلمة المرور عن 6 أحرف / Password must be at least 6 characters' };
      }
      if (newPwd !== confirmPwd) {
        return { valid: false, message: I18n.t('settings.passwords_mismatch') };
      }
    }

    return { valid: true };
  }

  /**
   * Save settings from form to storage and apply live system changes
   */
  static handleSave() {
    const validation = this.validateForm();
    if (!validation.valid) {
      Toast.error(validation.message || 'خطأ في التحقق من صحة البيانات');
      return;
    }

    const updated = this.collectFormData();
    this.saveSettingsToStorage(updated, true);

    // Apply Live Language Change if changed
    const currentLang = I18n.getLang();
    if (updated.language.lang && updated.language.lang !== currentLang) {
      I18n.setLang(updated.language.lang);
    }

    // Apply Live Theme Change if changed
    const currentTheme = ThemeManager.getTheme();
    if (updated.theme.theme && updated.theme.theme !== currentTheme) {
      ThemeManager.setTheme(updated.theme.theme);
    }

    // Clear password inputs
    const newPwdEl = document.getElementById('setting-new-pwd');
    const confirmPwdEl = document.getElementById('setting-confirm-pwd');
    const currPwdEl = document.getElementById('setting-curr-pwd');
    if (newPwdEl) newPwdEl.value = '';
    if (confirmPwdEl) confirmPwdEl.value = '';
    if (currPwdEl) currPwdEl.value = '';

    Toast.success(I18n.t('settings.save_success'));
  }

  /**
   * Reset form fields back to stored settings
   */
  static handleReset() {
    this.populateForm();
    Toast.info(I18n.t('settings.discard_changes'));
  }

  /**
   * Revoke all other active sessions
   */
  static revokeSessions() {
    const settings = this.getSettings();
    settings.security.active_sessions_count = 1;
    this.saveSettingsToStorage(settings, true);

    const sessionListEl = document.getElementById('setting-sessions-list');
    if (sessionListEl) {
      const secondarySessions = sessionListEl.querySelectorAll('.secondary-session');
      secondarySessions.forEach(s => s.remove());
    }

    Toast.success(I18n.getLang() === 'ar' ? 'تم إنهاء كافة الجلسات النشطة الأخرى بنجاح' : 'All other active sessions revoked successfully');
  }

  /**
   * Attach event listeners
   */
  static attachEventListeners() {
    if (typeof document === 'undefined') return;

    // 1. Tab Switching Listeners
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = btn.getAttribute('data-tab-target');
        this.switchTab(tabId);
      });
    });

    // 2. Save Settings Action Buttons
    document.querySelectorAll('[data-action="save-settings"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSave();
      });
    });

    // 3. Reset / Discard Changes Buttons
    document.querySelectorAll('[data-action="reset-settings"], [data-action="discard-settings"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleReset();
      });
    });

    // 4. Live Theme Radios Change
    document.querySelectorAll('input[name="setting-theme-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          ThemeManager.setTheme(e.target.value);
        }
      });
    });

    // 5. Live Language Select Change
    const langSelect = document.getElementById('setting-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        const newLang = e.target.value;
        if (newLang === 'ar' || newLang === 'en') {
          I18n.setLang(newLang);
        }
      });
    }

    // 6. Revoke Sessions Button
    const revokeBtn = document.getElementById('setting-revoke-sessions-btn');
    if (revokeBtn) {
      revokeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.revokeSessions();
      });
    }

    // 7. System Lang Changed Listener
    if (typeof window !== 'undefined') {
      window.addEventListener('meyar:lang-changed', () => {
        this.populateForm();
      });

      window.addEventListener('meyar:theme-changed', (e) => {
        const theme = e.detail?.theme;
        if (theme) {
          const radio = document.querySelector(`input[name="setting-theme-mode"][value="${theme}"]`);
          if (radio) radio.checked = true;
        }
      });
    }
  }

  /**
   * Parse initial URL hash or parameter
   */
  static parseURL() {
    if (typeof window === 'undefined') return;
    try {
      const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || hash;
      if (tabParam && ['profile', 'security', 'language', 'theme', 'notifications', 'business'].includes(tabParam)) {
        this.activeTab = tabParam;
      }
    } catch (e) {}
  }

  /**
   * Initialize settings page
   */
  static init() {
    if (typeof document === 'undefined') return;

    this.parseURL();
    this.populateForm();
    this.switchTab(this.activeTab);
    this.attachEventListeners();
    this.isInitialized = true;
  }
}

// Auto-bootstrap when running in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SettingsPage.init());
  } else {
    SettingsPage.init();
  }
}
