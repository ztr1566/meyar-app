/**
 * Meyar (معيار) Authentication Controller
 * Handles Login/Register tab switching, 3-role archetype selection,
 * password visibility toggling, client-side validation, session persistence,
 * and social login simulation.
 */

import { I18n } from '../core/i18n.js';
import { Toast } from '../core/toast.js';

export class AuthPage {
  static activeTab = 'login';
  static selectedRole = 'chef';
  static USER_STORAGE_KEY = 'meyar_user';
  static TOKEN_STORAGE_KEY = 'meyar_token';

  /**
   * Initialize Auth Page controller
   */
  static init() {
    if (typeof document === 'undefined') return;

    this.bindTabEvents();
    this.bindRoleEvents();
    this.bindPasswordToggleEvents();
    this.bindFormEvents();
    this.bindSocialAuthEvents();
    this.bindLangListener();

    // Check URL parameters for initial tab and role
    this.initFromUrlParams();
  }

  /**
   * Read initial tab and role from URL search params (e.g. ?tab=register&role=supplier)
   */
  static initFromUrlParams() {
    if (typeof window === 'undefined' || !window.location || !window.location.search) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const roleParam = params.get('role');

      if (tabParam === 'register' || tabParam === 'login') {
        this.switchTab(tabParam, false);
      }
      if (roleParam && ['chef', 'enthusiast', 'supplier'].includes(roleParam)) {
        this.selectRole(roleParam);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  /**
   * Listen for language change events to update dynamic headers
   */
  static bindLangListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('meyar:lang-changed', () => {
      this.updateHeaderContent(this.activeTab);
    });
  }

  /**
   * Bind Login vs Register tab buttons and switch links
   */
  static bindTabEvents() {
    document.querySelectorAll('[data-auth-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-auth-tab');
        if (tab) this.switchTab(tab);
      });
    });

    document.querySelectorAll('[data-action="switch-to-register"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('register');
      });
    });

    document.querySelectorAll('[data-action="switch-to-login"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('login');
      });
    });
  }

  /**
   * Switch between 'login' and 'register' tabs
   * @param {'login'|'register'} tabName
   * @param {boolean} [updateUrl=true]
   */
  static switchTab(tabName, updateUrl = true) {
    const validTab = tabName === 'register' ? 'register' : 'login';
    this.activeTab = validTab;

    // 1. Update tab button active states
    document.querySelectorAll('[data-auth-tab]').forEach(btn => {
      const isCurrent = btn.getAttribute('data-auth-tab') === validTab;
      btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      
      if (isCurrent) {
        btn.classList.add('bg-surface-1', 'text-text-main', 'shadow-sm', 'border-border-subtle', 'font-bold');
        btn.classList.remove('text-text-muted', 'font-medium', 'border-transparent');
      } else {
        btn.classList.remove('bg-surface-1', 'text-text-main', 'shadow-sm', 'border-border-subtle', 'font-bold');
        btn.classList.add('text-text-muted', 'font-medium', 'border-transparent');
      }
    });

    // 2. Toggle form visibility
    const loginForm = document.getElementById('login-form') || document.querySelector('[data-auth-form="login"]');
    const registerForm = document.getElementById('register-form') || document.querySelector('[data-auth-form="register"]');

    if (loginForm && registerForm) {
      if (validTab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
      }
    }

    // 3. Update dynamic header title & subtitle
    this.updateHeaderContent(validTab);

    // 4. Optionally update URL query string
    if (updateUrl && typeof window !== 'undefined' && window.history && typeof window.history.replaceState === 'function') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', validTab);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Fallback if URL object unsupported
      }
    }

    // 5. Dispatch event
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('meyar:auth-tab-changed', { detail: { tab: validTab } }));
      } catch {
        // CustomEvent fallback
      }
    }

    return validTab;
  }

  /**
   * Update header title and subtitle based on active tab
   * @param {'login'|'register'} tab
   */
  static updateHeaderContent(tab) {
    const titleEl = document.getElementById('auth-title');
    const subtitleEl = document.getElementById('auth-subtitle');

    if (tab === 'login') {
      if (titleEl) {
        titleEl.setAttribute('data-i18n', 'auth.welcome_back');
        titleEl.textContent = I18n.t('auth.welcome_back');
      }
      if (subtitleEl) {
        subtitleEl.setAttribute('data-i18n', 'auth.subtitle_login');
        subtitleEl.textContent = I18n.t('auth.subtitle_login');
      }
    } else {
      if (titleEl) {
        titleEl.setAttribute('data-i18n', 'auth.create_account');
        titleEl.textContent = I18n.t('auth.create_account');
      }
      if (subtitleEl) {
        subtitleEl.setAttribute('data-i18n', 'auth.subtitle_register');
        subtitleEl.textContent = I18n.t('auth.subtitle_register');
      }
    }
  }

  /**
   * Bind role selection cards
   */
  static bindRoleEvents() {
    document.querySelectorAll('[data-role]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const role = card.getAttribute('data-role');
        if (role) this.selectRole(role);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const role = card.getAttribute('data-role');
          if (role) this.selectRole(role);
        }
      });
    });
  }

  /**
   * Select archetype role ('chef' | 'enthusiast' | 'supplier')
   * @param {'chef'|'enthusiast'|'supplier'} roleName
   */
  static selectRole(roleName) {
    const validRole = ['chef', 'enthusiast', 'supplier'].includes(roleName) ? roleName : 'chef';
    this.selectedRole = validRole;

    // 1. Update role card styles
    document.querySelectorAll('[data-role]').forEach(card => {
      const isSelected = card.getAttribute('data-role') === validRole;
      card.setAttribute('aria-checked', isSelected ? 'true' : 'false');

      const checkBadge = card.querySelector('.role-check-indicator');

      if (isSelected) {
        card.classList.add('border-brand-gold', 'bg-surface-1', 'ring-2', 'ring-brand-gold');
        card.classList.remove('border-border-subtle', 'bg-surface-2');
        if (checkBadge) checkBadge.classList.remove('hidden');
      } else {
        card.classList.remove('border-brand-gold', 'bg-surface-1', 'ring-2', 'ring-brand-gold');
        card.classList.add('border-border-subtle', 'bg-surface-2');
        if (checkBadge) checkBadge.classList.add('hidden');
      }
    });

    // 2. Update hidden role input
    const roleInput = document.getElementById('register-role') || document.querySelector('input[name="role"]');
    if (roleInput) {
      roleInput.value = validRole;
    }

    // 3. Show/hide supplier or chef business name field if desired
    const businessGroup = document.getElementById('business-name-group');
    if (businessGroup) {
      if (validRole === 'supplier' || validRole === 'chef') {
        businessGroup.classList.remove('hidden');
      } else {
        businessGroup.classList.add('hidden');
      }
    }

    // 4. Dispatch event
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('meyar:auth-role-changed', { detail: { role: validRole } }));
      } catch {
        // Fallback
      }
    }

    return validRole;
  }

  /**
   * Bind password show/hide toggle buttons
   */
  static bindPasswordToggleEvents() {
    document.querySelectorAll('[data-action="toggle-password"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePasswordVisibility(btn);
      });
    });
  }

  /**
   * Toggle visibility of a password input
   * @param {HTMLElement} btn - Toggle button element
   */
  static togglePasswordVisibility(btn) {
    const targetId = btn.getAttribute('data-target');
    let input = targetId ? document.getElementById(targetId) : null;
    if (!input) {
      input = btn.closest('.password-wrapper')?.querySelector('input') || btn.parentElement?.querySelector('input');
    }
    if (!input) return;

    const isPassword = input.getAttribute('type') === 'password';
    const newType = isPassword ? 'text' : 'password';
    input.setAttribute('type', newType);
    btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
    btn.setAttribute('aria-label', isPassword ? I18n.t('auth.hide_password') : I18n.t('auth.show_password'));

    const eyeIcon = btn.querySelector('.icon-eye');
    const eyeOffIcon = btn.querySelector('.icon-eye-off');

    if (eyeIcon && eyeOffIcon) {
      if (isPassword) {
        eyeIcon.classList.add('hidden');
        eyeOffIcon.classList.remove('hidden');
      } else {
        eyeIcon.classList.remove('hidden');
        eyeOffIcon.classList.add('hidden');
      }
    }

    return newType;
  }

  /**
   * Bind form submissions for login and register
   */
  static bindFormEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
  }

  /**
   * Handle Login Form Submission
   * @param {Event} e
   */
  static handleLogin(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const rememberInput = document.getElementById('login-remember');

    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';
    const remember = rememberInput?.checked || false;

    // Validation
    if (!email || !password) {
      Toast.error(I18n.t('auth.fill_required'), I18n.t('common.error'));
      return { success: false, error: 'missing_fields' };
    }

    if (!this.isValidEmail(email)) {
      Toast.error(I18n.t('auth.invalid_email'), I18n.t('common.error'));
      return { success: false, error: 'invalid_email' };
    }

    // Mock Login Session Creation
    const mockUser = {
      id: 'user-' + Date.now().toString(36),
      name_ar: email.split('@')[0],
      name_en: email.split('@')[0],
      email: email,
      role: 'chef',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
      remember: remember,
      loggedInAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem(this.TOKEN_STORAGE_KEY, 'mock_token_' + Date.now());
    } catch {
      // LocalStorage access issues
    }

    Toast.success(I18n.t('auth.login_success'), I18n.t('common.success'));

    // Simulated redirect
    if (typeof window !== 'undefined' && window.location) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }

    return { success: true, user: mockUser };
  }

  /**
   * Handle Registration Form Submission
   * @param {Event} e
   */
  static handleRegister(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const nameInput = document.getElementById('register-fullname');
    const emailInput = document.getElementById('register-email');
    const businessInput = document.getElementById('register-business');
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-confirm-password');
    const termsInput = document.getElementById('register-terms');

    const name = nameInput?.value?.trim() || '';
    const email = emailInput?.value?.trim() || '';
    const business = businessInput?.value?.trim() || '';
    const password = passwordInput?.value || '';
    const confirm = confirmInput?.value || '';
    const role = this.selectedRole || 'chef';
    const termsAccepted = termsInput ? termsInput.checked : true;

    // Validation checks
    if (!name || !email || !password || !confirm) {
      Toast.error(I18n.t('auth.fill_required'), I18n.t('common.error'));
      return { success: false, error: 'missing_fields' };
    }

    if (!this.isValidEmail(email)) {
      Toast.error(I18n.t('auth.invalid_email'), I18n.t('common.error'));
      return { success: false, error: 'invalid_email' };
    }

    if (password.length < 6) {
      Toast.error(I18n.t('auth.password_too_short'), I18n.t('common.error'));
      return { success: false, error: 'password_too_short' };
    }

    if (password !== confirm) {
      Toast.error(I18n.t('auth.password_mismatch'), I18n.t('common.error'));
      return { success: false, error: 'password_mismatch' };
    }

    if (!termsAccepted) {
      Toast.error(I18n.t('auth.terms_agreement'), I18n.t('common.error'));
      return { success: false, error: 'terms_not_accepted' };
    }

    // Create persistent registered user
    const newUser = {
      id: `${role}-${Date.now().toString(36)}`,
      name_ar: name,
      name_en: name,
      email: email,
      role: role,
      verified: role === 'chef' || role === 'supplier',
      business_profile: business ? {
        company_name_ar: business,
        company_name_en: business,
        category: role === 'supplier' ? 'Kitchen Equipment & Supplies' : 'Culinary Studio'
      } : null,
      avatar: role === 'chef'
        ? 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80'
        : (role === 'supplier'
          ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
      createdAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(this.TOKEN_STORAGE_KEY, 'mock_token_' + Date.now());
    } catch {
      // LocalStorage access issues
    }

    Toast.success(I18n.t('auth.register_success'), I18n.t('common.success'));

    // Simulated redirect based on chosen role
    if (typeof window !== 'undefined' && window.location) {
      setTimeout(() => {
        window.location.href = role === 'supplier' ? 'supplies.html' : 'index.html';
      }, 1200);
    }

    return { success: true, user: newUser };
  }

  /**
   * Bind Google & Apple social login buttons
   */
  static bindSocialAuthEvents() {
    document.querySelectorAll('[data-social]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const provider = btn.getAttribute('data-social');
        this.handleSocialAuth(provider);
      });
    });
  }

  /**
   * Handle simulated social OAuth login
   * @param {string} provider - 'google' | 'apple'
   */
  static handleSocialAuth(provider) {
    const providerName = provider === 'apple' ? 'Apple' : 'Google';
    
    const mockUser = {
      id: `${provider}-user-` + Date.now().toString(36),
      name_ar: `مستخدم ${providerName}`,
      name_en: `${providerName} User`,
      email: `user@${provider.toLowerCase()}.com`,
      role: this.selectedRole || 'enthusiast',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      authProvider: provider,
      loggedInAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(mockUser));
      localStorage.setItem(this.TOKEN_STORAGE_KEY, 'mock_oauth_' + Date.now());
    } catch {
      // LocalStorage access issues
    }

    Toast.success(`${providerName}: ${I18n.t('auth.login_success')}`, I18n.t('common.success'));

    if (typeof window !== 'undefined' && window.location) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }

    return mockUser;
  }

  /**
   * Basic Email Validator Regex
   * @param {string} email
   * @returns {boolean}
   */
  static isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Check if a user is currently logged in from localStorage
   * @returns {object|null}
   */
  static getCurrentUser() {
    try {
      const data = localStorage.getItem(this.USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear session data (logout)
   */
  static logout() {
    try {
      localStorage.removeItem(this.USER_STORAGE_KEY);
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = 'auth.html';
    }
  }
}

// Auto-initialize when running in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthPage.init());
  } else {
    AuthPage.init();
  }
}
