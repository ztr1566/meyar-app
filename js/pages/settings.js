/**
 * Meyar (معيار) Account & Platform Settings Controller
 * Handles multi-section tabs (Profile, Security, Language, Theme, Notifications, B2B),
 * live theme & language switching, form validation, password matching,
 * session revocation, and transient session state.
 */

import { SETTING_FIXTURES, USER_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { ThemeManager } from '../core/theme.js';
import { Toast } from '../core/toast.js';
import { Modal } from '../core/modal.js';

export class SettingsPage {
  static activeTab = 'profile'; // profile | security | language | theme | notifications | business
  static isInitialized = false;
  static settingsStore = null;
  static pendingMedia = {};
  static pendingCv;
  static mediaEditor = {
    kind: null,
    image: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    drag: null
  };
  static MEDIA_CONFIG = {
    avatar: { width: 400, height: 400, titleKey: 'settings.edit_avatar' },
    cover: { width: 1600, height: 500, titleKey: 'settings.edit_cover' }
  };

  /**
   * Reset in-memory settings store (for test isolation)
   */
  static reset() {
    this.settingsStore = null;
    this.activeTab = 'profile';
    this.isInitialized = false;
    this.pendingMedia = {};
    this.pendingCv = undefined;
    this.resetMediaEditor();
  }

  static resetMediaEditor() {
    this.mediaEditor = {
      kind: null,
      image: null,
      zoom: 1,
      panX: 0,
      panY: 0,
      drag: null
    };
  }

  /**
   * Return initial reference settings combined with the active fixture user
   * @returns {object}
   */
  static getDefaultSettings() {
    const user = USER_FIXTURES || {};
    const biz = user.business_profile || {};
    const settings = JSON.parse(JSON.stringify(SETTING_FIXTURES || {}));

    return {
      profile: {
        ...settings.profile,
        name_ar: user.name_ar,
        name_en: user.name_en,
        handle: user.handle,
        email: user.email,
        title_ar: user.title_ar,
        title_en: user.title_en,
        bio_ar: user.bio_ar,
        bio_en: user.bio_en,
        avatar: user.avatar,
        cover: user.cover
      },
      security: {
        ...settings.security,
        active_sessions_count: settings.security?.active_sessions_count ?? settings.security?.sessions_count ?? 1
      },
      language: {
        ...settings.language,
        lang: I18n.getLang() || settings.language?.lang || 'ar'
      },
      theme: {
        ...settings.theme,
        theme: ThemeManager.getTheme() || settings.theme?.theme || 'dark'
      },
      notifications: { ...settings.notifications },
      business: {
        ...settings.business,
        company_name_ar: biz.company_name_ar,
        company_name_en: biz.company_name_en,
        cr_number: biz.cr_number,
        vat_number: biz.vat_number,
        category: biz.category,
        location_ar: biz.location_ar,
        location_en: biz.location_en
      }
    };
  }

  /**
   * Load current session settings or fallback to the reference fixture
   * @returns {object}
   */
  static getSettings() {
    if (!this.settingsStore) {
      this.settingsStore = this.getDefaultSettings();
    }
    return this.settingsStore;
  }

  /**
   * Save settings object directly to the current page session
   * @param {object} settings 
   * @param {boolean} [dispatchEvent=true] 
   */
  static saveSettings(settings, dispatchEvent = true) {
    this.settingsStore = settings;

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
    setVal('setting-profile-experience', settings.profile.years_experience);
    setVal('setting-profile-specialties', settings.profile.specialties);
    setVal('setting-profile-website', settings.profile.website);

    // Profile previews
    const avatar = Object.prototype.hasOwnProperty.call(this.pendingMedia, 'avatar')
      ? this.pendingMedia.avatar
      : settings.profile.avatar;
    const cover = Object.prototype.hasOwnProperty.call(this.pendingMedia, 'cover')
      ? this.pendingMedia.cover
      : settings.profile.cover;
    this.renderMediaPreview('avatar', avatar);
    this.renderMediaPreview('cover', cover);
    this.renderCvPreview(this.pendingCv !== undefined ? this.pendingCv : settings.profile.cv);

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
      return el ? String(el.value ?? '').trim() : fallback;
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
        years_experience: getVal('setting-profile-experience', currentSettings.profile.years_experience),
        specialties: getVal('setting-profile-specialties', currentSettings.profile.specialties),
        website: getVal('setting-profile-website', currentSettings.profile.website),
        avatar: Object.prototype.hasOwnProperty.call(this.pendingMedia, 'avatar')
          ? this.pendingMedia.avatar
          : currentSettings.profile.avatar,
        cover: Object.prototype.hasOwnProperty.call(this.pendingMedia, 'cover')
          ? this.pendingMedia.cover
          : currentSettings.profile.cover,
        cv: this.pendingCv !== undefined ? this.pendingCv : currentSettings.profile.cv
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

  static renderMediaPreview(kind, src) {
    if (typeof document === 'undefined') return;
    const preview = document.getElementById(`setting-${kind}-preview`);
    if (preview && src) preview.src = src;
  }

  static renderCvPreview(cv) {
    if (typeof document === 'undefined') return;

    const label = document.getElementById('setting-profile-cv-name');
    const link = document.getElementById('setting-profile-cv-link');
    const file = typeof cv === 'string' ? { name: cv } : cv;
    const name = file?.name || '';

    if (label) label.textContent = name || I18n.t('settings.no_cv');
    if (link) {
      if (name && file?.dataUrl) {
        link.href = file.dataUrl;
        link.download = name;
        link.classList.remove('hidden');
      } else {
        link.removeAttribute('href');
        link.classList.add('hidden');
      }
    }
  }

  static handleMediaFile(kind, file) {
    if (!file) return;

    const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name || '');
    if (!isImage) {
      Toast.error(I18n.t('settings.image_type_error'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      Toast.error(I18n.t('settings.image_size_error'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.openMediaEditor(kind, reader.result);
    reader.onerror = () => Toast.error(I18n.t('settings.image_read_error'));
    reader.readAsDataURL(file);
  }

  static openMediaEditor(kind, src) {
    const config = this.MEDIA_CONFIG[kind];
    const modal = document.getElementById('setting-image-editor-modal');
    const stage = document.getElementById('setting-image-editor-stage');
    if (!config || !modal || !stage || typeof Image === 'undefined') return;

    this.mediaEditor = { kind, image: null, zoom: 1, panX: 0, panY: 0, drag: null };
    stage.style.aspectRatio = `${config.width} / ${config.height}`;

    const title = document.getElementById('setting-image-editor-title');
    if (title) {
      title.setAttribute('data-i18n', config.titleKey);
      title.textContent = I18n.t(config.titleKey);
    }

    const zoomInput = document.getElementById('setting-image-editor-zoom');
    const zoomOutput = document.getElementById('setting-image-editor-zoom-value');
    if (zoomInput) zoomInput.value = '1';
    if (zoomOutput) zoomOutput.textContent = '100%';

    const preview = document.getElementById('setting-image-editor-image');
    if (preview) preview.src = src;
    Modal.open(modal.id);

    const image = new Image();
    image.onload = () => {
      this.mediaEditor.image = image;
      this.updateMediaEditor();
    };
    image.onerror = () => {
      this.closeMediaEditor();
      Toast.error(I18n.t('settings.image_read_error'));
    };
    image.src = src;
  }

  static getMediaCropMetrics({
    stageWidth,
    stageHeight,
    imageWidth,
    imageHeight,
    zoom = 1,
    panX = 0,
    panY = 0
  }) {
    if (![stageWidth, stageHeight, imageWidth, imageHeight].every(dimension => Number(dimension) > 0)) {
      return null;
    }

    const safeZoom = Math.max(1, Number(zoom) || 1);
    const scale = Math.max(stageWidth / imageWidth, stageHeight / imageHeight) * safeZoom;
    const renderWidth = imageWidth * scale;
    const renderHeight = imageHeight * scale;
    const maxPanX = Math.max(0, (renderWidth - stageWidth) / 2);
    const maxPanY = Math.max(0, (renderHeight - stageHeight) / 2);
    const safePanX = Math.max(-1, Math.min(1, Number(panX) || 0));
    const safePanY = Math.max(-1, Math.min(1, Number(panY) || 0));

    return {
      renderWidth,
      renderHeight,
      left: (stageWidth - renderWidth) / 2 + safePanX * maxPanX,
      top: (stageHeight - renderHeight) / 2 + safePanY * maxPanY,
      maxPanX,
      maxPanY
    };
  }

  static updateMediaEditor() {
    const stage = document.getElementById('setting-image-editor-stage');
    const preview = document.getElementById('setting-image-editor-image');
    const image = this.mediaEditor.image;
    if (!stage || !preview || !image?.naturalWidth || !image?.naturalHeight) return;

    const metrics = this.getMediaCropMetrics({
      stageWidth: stage.clientWidth,
      stageHeight: stage.clientHeight,
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      zoom: this.mediaEditor.zoom,
      panX: this.mediaEditor.panX,
      panY: this.mediaEditor.panY
    });
    if (!metrics) return;

    preview.src = image.src;
    preview.style.width = `${metrics.renderWidth}px`;
    preview.style.height = `${metrics.renderHeight}px`;
    preview.style.left = `${metrics.left}px`;
    preview.style.top = `${metrics.top}px`;
  }

  static updateMediaZoom(event) {
    this.mediaEditor.zoom = Math.max(1, Number(event.target.value) || 1);
    const output = document.getElementById('setting-image-editor-zoom-value');
    if (output) output.textContent = `${Math.round(this.mediaEditor.zoom * 100)}%`;
    this.updateMediaEditor();
  }

  static startMediaPan(event) {
    if (!this.mediaEditor.image) return;
    this.mediaEditor.drag = { x: event.clientX, y: event.clientY };
    event.currentTarget.classList.add('cursor-grabbing');
    if (event.currentTarget.setPointerCapture && event.pointerId !== undefined) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  static moveMediaPan(event) {
    const drag = this.mediaEditor.drag;
    const stage = event.currentTarget;
    if (!drag || !stage) return;

    const image = this.mediaEditor.image;
    const metrics = this.getMediaCropMetrics({
      stageWidth: stage.clientWidth,
      stageHeight: stage.clientHeight,
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      zoom: this.mediaEditor.zoom,
      panX: this.mediaEditor.panX,
      panY: this.mediaEditor.panY
    });
    if (!metrics) return;

    this.mediaEditor.panX = metrics.maxPanX ? this.mediaEditor.panX + (event.clientX - drag.x) / metrics.maxPanX : 0;
    this.mediaEditor.panY = metrics.maxPanY ? this.mediaEditor.panY + (event.clientY - drag.y) / metrics.maxPanY : 0;
    this.mediaEditor.panX = Math.max(-1, Math.min(1, this.mediaEditor.panX));
    this.mediaEditor.panY = Math.max(-1, Math.min(1, this.mediaEditor.panY));
    this.mediaEditor.drag = { x: event.clientX, y: event.clientY };
    this.updateMediaEditor();
  }

  static endMediaPan(event) {
    this.mediaEditor.drag = null;
    if (event.currentTarget) event.currentTarget.classList.remove('cursor-grabbing');
  }

  static applyMediaEdit() {
    const { kind, image, zoom, panX, panY } = this.mediaEditor;
    const config = this.MEDIA_CONFIG[kind];
    if (!kind || !image || !config) return;

    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    const context = canvas.getContext('2d');
    if (!context) {
      Toast.error(I18n.t('settings.image_read_error'));
      return;
    }

    const metrics = this.getMediaCropMetrics({
      stageWidth: config.width,
      stageHeight: config.height,
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      zoom,
      panX,
      panY
    });
    context.drawImage(image, metrics.left, metrics.top, metrics.renderWidth, metrics.renderHeight);

    const src = canvas.toDataURL('image/jpeg', 0.9);
    this.pendingMedia[kind] = src;
    this.renderMediaPreview(kind, src);
    this.closeMediaEditor();
    Toast.success(I18n.t('settings.image_saved'));
  }

  static closeMediaEditor() {
    const modal = document.getElementById('setting-image-editor-modal');
    if (modal && !modal.classList.contains('hidden')) Modal.close(modal);
    this.resetMediaEditor();
  }

  static handleCvFile(file) {
    if (!file) return;

    const isCv = /\.(pdf|doc|docx)$/i.test(file.name || '') || /application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/i.test(file.type || '');
    if (!isCv) {
      Toast.error(I18n.t('settings.cv_type_error'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Toast.error(I18n.t('settings.cv_size_error'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.pendingCv = {
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result
      };
      this.renderCvPreview(this.pendingCv);
      Toast.success(I18n.t('settings.cv_selected'));
    };
    reader.onerror = () => Toast.error(I18n.t('settings.cv_read_error'));
    reader.readAsDataURL(file);
  }

  /**
   * Save settings to the current session and apply live system changes
   */
  static handleSave() {
    const validation = this.validateForm();
    if (!validation.valid) {
      Toast.error(validation.message || 'خطأ في التحقق من صحة البيانات');
      return;
    }

    const updated = this.collectFormData();
    this.saveSettings(updated, true);
    this.pendingMedia = {};
    this.pendingCv = undefined;

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
    this.pendingMedia = {};
    this.pendingCv = undefined;
    this.closeMediaEditor();
    this.populateForm();
    Toast.info(I18n.t('settings.discard_changes'));
  }

  /**
   * Revoke all other active sessions
   */
  static revokeSessions() {
    const settings = this.getSettings();
    settings.security.active_sessions_count = 1;
    this.saveSettings(settings, true);

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

    // 7. Profile media and CV uploads
    ['avatar', 'cover'].forEach((kind) => {
      const changeBtn = document.getElementById(`setting-${kind}-change-btn`);
      const fileInput = document.getElementById(`setting-${kind}-file`);
      if (changeBtn && fileInput) {
        changeBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
          this.handleMediaFile(kind, e.target.files?.[0]);
          e.target.value = '';
        });
      }
    });

    const cvInput = document.getElementById('setting-profile-cv');
    const cvButton = document.getElementById('setting-profile-cv-btn');
    if (cvInput && cvButton) {
      cvButton.addEventListener('click', () => cvInput.click());
      cvInput.addEventListener('change', (e) => {
        this.handleCvFile(e.target.files?.[0]);
        e.target.value = '';
      });
    }

    const editorStage = document.getElementById('setting-image-editor-stage');
    if (editorStage) {
      editorStage.addEventListener('pointerdown', (e) => this.startMediaPan(e));
      editorStage.addEventListener('pointermove', (e) => this.moveMediaPan(e));
      editorStage.addEventListener('pointerup', (e) => this.endMediaPan(e));
      editorStage.addEventListener('pointercancel', (e) => this.endMediaPan(e));
    }

    const zoomInput = document.getElementById('setting-image-editor-zoom');
    if (zoomInput) zoomInput.addEventListener('input', (e) => this.updateMediaZoom(e));

    const applyMediaBtn = document.getElementById('setting-image-editor-apply');
    if (applyMediaBtn) {
      applyMediaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyMediaEdit();
      });
    }

    // 8. System Lang Changed Listener
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

      window.addEventListener('meyar:modal-closed', (e) => {
        if (e.detail?.modalId === 'setting-image-editor-modal') this.resetMediaEditor();
      });
      window.addEventListener('resize', () => this.updateMediaEditor());
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
    if (typeof document !== 'undefined' && this.lastDocument !== document) {
      this.isInitialized = false;
      this.lastDocument = document;
      this.pendingMedia = {};
      this.pendingCv = undefined;
      this.resetMediaEditor();
    }
    if (this.isInitialized) return;
    if (typeof document === 'undefined') return;

    this.parseURL();
    this.populateForm();
    this.switchTab(this.activeTab);
    this.attachEventListeners();
    this.isInitialized = true;
  }
}
