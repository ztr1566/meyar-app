import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { ThemeManager } from '../js/core/theme.js';
import { Toast } from '../js/core/toast.js';
import { SettingsPage } from '../js/pages/settings.js';

// Setup Mock DOM environment for Settings
function setupDOM() {
  const listeners = new Map();
  const storage = new Map();

  class ClassList {
    constructor() {
      this._classes = new Set();
    }
    add(...cls) {
      cls.forEach(c => {
        if (c) c.split(/\s+/).filter(Boolean).forEach(item => this._classes.add(item));
      });
    }
    remove(...cls) {
      cls.forEach(c => {
        if (c) c.split(/\s+/).filter(Boolean).forEach(item => this._classes.delete(item));
      });
    }
    toggle(c) {
      if (this._classes.has(c)) {
        this._classes.delete(c);
        return false;
      } else {
        this._classes.add(c);
        return true;
      }
    }
    contains(c) {
      return this._classes.has(c);
    }
    toString() {
      return Array.from(this._classes).join(' ');
    }
  }

  let docMockRef = null;

  class Element {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.id = '';
      this.classList = new ClassList();
      this.attributes = new Map();
      this.children = [];
      this.parentElement = null;
      this._innerHTML = '';
      this._textContent = '';
      this.value = '';
      this.src = '';
      this.alt = '';
      this.name = '';
      this.type = 'text';
      this.checked = false;
      this.focused = false;
      this.clicked = false;
    }

    set className(val) {
      this.classList._classes.clear();
      if (val) {
        val.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
      }
    }

    get className() {
      return this.classList.toString();
    }

    set innerHTML(val) {
      this._innerHTML = String(val);
      this.children = [];
      this._parseAndBuildChildren(val);
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set textContent(val) {
      this.children = [];
      this._innerHTML = '';
      this._textContent = String(val);
    }

    get textContent() {
      if (this.children.length > 0) {
        return this.children.map(c => c.textContent).join('');
      }
      return this._textContent;
    }

    setAttribute(key, val) {
      this.attributes.set(key, String(val));
      if (key === 'id') this.id = String(val);
      if (key === 'name') this.name = String(val);
      if (key === 'type') this.type = String(val);
      if (key === 'value') this.value = String(val);
    }

    getAttribute(key) {
      return this.attributes.has(key) ? this.attributes.get(key) : null;
    }

    removeAttribute(key) {
      this.attributes.delete(key);
    }

    hasAttribute(key) {
      return this.attributes.has(key);
    }

    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentElement = null;
      }
      return child;
    }

    remove() {
      if (this.parentElement) {
        this.parentElement.removeChild(this);
      }
    }

    addEventListener(event, callback) {
      if (!listeners.has(this)) {
        listeners.set(this, new Map());
      }
      const elMap = listeners.get(this);
      if (!elMap.has(event)) {
        elMap.set(event, []);
      }
      elMap.get(event).push(callback);
    }

    dispatchEvent(evt) {
      evt.target = evt.target || this;
      evt.currentTarget = this;
      const elMap = listeners.get(this);
      const handlers = (elMap && elMap.get(evt.type)) || [];
      for (const h of handlers) {
        h(evt);
      }

      // Propagate / bubble up
      if (this.parentElement) {
        this.parentElement.dispatchEvent(evt);
      } else if (docMockRef && this !== docMockRef) {
        docMockRef.dispatchEvent(evt);
      }

      return true;
    }

    closest(selector) {
      let curr = this;
      while (curr) {
        if (curr.matches && curr.matches(selector)) {
          return curr;
        }
        curr = curr.parentElement;
      }
      return null;
    }

    _matchSingle(singleSel) {
      const s = singleSel.trim();
      if (!s) return false;
      if (s.startsWith('#')) {
        return this.id === s.slice(1);
      }
      if (s.startsWith('.')) {
        return this.classList.contains(s.slice(1));
      }
      if (s.startsWith('[') && s.endsWith(']')) {
        const inner = s.slice(1, -1);
        const [attrName, rawVal] = inner.split('=');
        if (rawVal !== undefined) {
          const expectedVal = rawVal.replace(/^['"]|['"]$/g, '');
          if (attrName === 'name') return this.name === expectedVal;
          if (attrName === 'value') return this.value === expectedVal;
          return this.getAttribute(attrName) === expectedVal;
        }
        return this.hasAttribute(attrName);
      }
      if (s.toLowerCase() === this.tagName.toLowerCase()) {
        return true;
      }
      return false;
    }

    matches(selector) {
      const parts = selector.split(',').map(p => p.trim());
      return parts.some(part => this._matchSingle(part));
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
      const matched = [];
      function recurse(node) {
        for (const child of node.children) {
          if (child.matches(selector)) {
            matched.push(child);
          }
          recurse(child);
        }
      }
      recurse(this);
      return matched;
    }

    _parseAndBuildChildren(html) {
      if (!html || typeof html !== 'string') return;
      const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9\-]+)([^>]*)\/>/g;
      let match;
      while ((match = tagRegex.exec(html)) !== null) {
        const tagName = match[1] || match[4];
        const rawAttrs = match[2] || match[5] || '';
        const inner = match[3] || '';

        const child = new Element(tagName);
        const attrRegex = /([a-zA-Z0-9\-]+)(?:=["']([^"']*)["'])?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
          const attrName = attrMatch[1];
          const attrVal = attrMatch[2] !== undefined ? attrMatch[2] : '';
          if (attrName === 'id') {
            child.id = attrVal;
          } else if (attrName === 'class') {
            child.className = attrVal;
          } else {
            child.setAttribute(attrName, attrVal);
          }
        }

        if (inner && !/<[a-zA-Z0-9\-]+/.test(inner)) {
          child.textContent = inner.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        } else if (inner) {
          child._parseAndBuildChildren(inner);
        }

        child.parentElement = this;
        this.children.push(child);
      }
    }
  }

  const documentElement = new Element('html');
  const body = new Element('body');
  documentElement.appendChild(body);

  const documentMock = {
    documentElement,
    body,
    createElement(tag) {
      return new Element(tag);
    },
    getElementById(id) {
      function recurse(node) {
        if (node.id === id) return node;
        for (const child of node.children) {
          const res = recurse(child);
          if (res) return res;
        }
        return null;
      }
      return recurse(documentElement);
    },
    querySelector(selector) {
      return documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      return documentElement.querySelectorAll(selector);
    },
    addEventListener(event, callback) {
      if (!listeners.has(documentMock)) {
        listeners.set(documentMock, new Map());
      }
      const elMap = listeners.get(documentMock);
      if (!elMap.has(event)) {
        elMap.set(event, []);
      }
      elMap.get(event).push(callback);
    },
    dispatchEvent(evt) {
      evt.target = evt.target || documentMock;
      const elMap = listeners.get(documentMock);
      const handlers = (elMap && elMap.get(evt.type)) || [];
      for (const h of handlers) {
        h(evt);
      }
      return true;
    }
  };

  docMockRef = documentMock;

  const windowMock = {
    listeners: new Map(),
    location: {
      search: '',
      hash: '',
      href: 'http://localhost/settings.html'
    },
    history: {
      replaceState(state, title, url) {
        if (url && url.startsWith('#')) {
          windowMock.location.hash = url;
        }
      }
    },
    matchMedia: () => ({ matches: true, addEventListener: () => {} }),
    addEventListener(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    },
    dispatchEvent(evt) {
      const handlers = this.listeners.get(evt.type) || [];
      for (const h of handlers) {
        h(evt);
      }
      return true;
    }
  };

  const localStorageMock = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, val) {
      storage.set(key, String(val));
    },
    removeItem(key) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    }
  };

  class CustomEventMock {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail || {};
    }
  }

  globalThis.document = documentMock;
  globalThis.window = windowMock;
  globalThis.localStorage = localStorageMock;
  globalThis.CustomEvent = CustomEventMock;
  globalThis.HTMLElement = Element;
  globalThis.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };

  // Build basic settings DOM elements
  const tabIds = ['profile', 'security', 'language', 'theme', 'notifications', 'business'];
  
  // Tab buttons
  tabIds.forEach(id => {
    const btn = new Element('button');
    btn.setAttribute('data-tab-target', id);
    btn.setAttribute('aria-selected', id === 'profile' ? 'true' : 'false');
    body.appendChild(btn);

    const panel = new Element('div');
    panel.id = `tab-panel-${id}`;
    panel.setAttribute('data-tab-panel', id);
    if (id !== 'profile') panel.className = 'hidden';
    body.appendChild(panel);
  });

  // Profile Inputs
  const profileFields = [
    'setting-profile-name-ar', 'setting-profile-name-en', 'setting-profile-handle',
    'setting-profile-email', 'setting-profile-phone', 'setting-profile-location-ar',
    'setting-profile-location-en', 'setting-profile-title-ar', 'setting-profile-title-en',
    'setting-profile-bio-ar', 'setting-profile-bio-en'
  ];
  profileFields.forEach(id => {
    const input = new Element(id.includes('bio') ? 'textarea' : 'input');
    input.id = id;
    body.appendChild(input);
  });

  // Security Inputs
  const sec2fa = new Element('input');
  sec2fa.id = 'setting-security-2fa';
  sec2fa.type = 'checkbox';
  body.appendChild(sec2fa);

  const secAlerts = new Element('input');
  secAlerts.id = 'setting-security-login-alerts';
  secAlerts.type = 'checkbox';
  body.appendChild(secAlerts);

  const currPwd = new Element('input');
  currPwd.id = 'setting-curr-pwd';
  currPwd.type = 'password';
  body.appendChild(currPwd);

  const newPwd = new Element('input');
  newPwd.id = 'setting-new-pwd';
  newPwd.type = 'password';
  body.appendChild(newPwd);

  const confPwd = new Element('input');
  confPwd.id = 'setting-confirm-pwd';
  confPwd.type = 'password';
  body.appendChild(confPwd);

  const revokeBtn = new Element('button');
  revokeBtn.id = 'setting-revoke-sessions-btn';
  body.appendChild(revokeBtn);

  const sessionList = new Element('div');
  sessionList.id = 'setting-sessions-list';
  const secSession = new Element('div');
  secSession.className = 'secondary-session';
  sessionList.appendChild(secSession);
  body.appendChild(sessionList);

  // Language & Region Inputs
  const langSelect = new Element('select');
  langSelect.id = 'setting-lang-select';
  body.appendChild(langSelect);

  const countrySelect = new Element('select');
  countrySelect.id = 'setting-country-select';
  body.appendChild(countrySelect);

  const timezoneSelect = new Element('select');
  timezoneSelect.id = 'setting-timezone-select';
  body.appendChild(timezoneSelect);

  const currencySelect = new Element('select');
  currencySelect.id = 'setting-currency-select';
  body.appendChild(currencySelect);

  // Theme Inputs
  const themeDark = new Element('input');
  themeDark.name = 'setting-theme-mode';
  themeDark.value = 'dark';
  themeDark.type = 'radio';
  body.appendChild(themeDark);

  const themeLight = new Element('input');
  themeLight.name = 'setting-theme-mode';
  themeLight.value = 'light';
  themeLight.type = 'radio';
  body.appendChild(themeLight);

  const themeContrast = new Element('input');
  themeContrast.id = 'setting-theme-high-contrast';
  themeContrast.type = 'checkbox';
  body.appendChild(themeContrast);

  const themeCompact = new Element('input');
  themeCompact.id = 'setting-theme-compact-mode';
  themeCompact.type = 'checkbox';
  body.appendChild(themeCompact);

  // Notifications Inputs
  const notifIds = [
    'setting-notif-email-digest', 'setting-notif-email-rfq', 'setting-notif-email-courses',
    'setting-notif-push-messages', 'setting-notif-push-social', 'setting-notif-push-followers',
    'setting-notif-sms-urgent', 'setting-notif-sms-security'
  ];
  notifIds.forEach(id => {
    const cb = new Element('input');
    cb.id = id;
    cb.type = 'checkbox';
    body.appendChild(cb);
  });

  // Business B2B Inputs
  const bizFields = [
    'setting-biz-name-ar', 'setting-biz-name-en', 'setting-biz-cr',
    'setting-biz-vat', 'setting-biz-category', 'setting-biz-location-ar'
  ];
  bizFields.forEach(id => {
    const input = new Element('input');
    input.id = id;
    body.appendChild(input);
  });

  const bizAutoQuote = new Element('input');
  bizAutoQuote.id = 'setting-biz-auto-quote';
  bizAutoQuote.type = 'checkbox';
  body.appendChild(bizAutoQuote);

  // Actions
  const saveBtn = new Element('button');
  saveBtn.setAttribute('data-action', 'save-settings');
  body.appendChild(saveBtn);

  const resetBtn = new Element('button');
  resetBtn.setAttribute('data-action', 'reset-settings');
  body.appendChild(resetBtn);

  return { documentMock, windowMock, localStorageMock };
}

test('SettingsPage - Initial Settings, Defaults & Mock User Merge', async (t) => {
  setupDOM();
  localStorage.clear();

  await t.test('Loads default settings combining MOCK_DATA.user profile and B2B credentials', () => {
    const settings = SettingsPage.getSettings();
    assert.ok(settings, 'Settings object should exist');
    assert.strictEqual(settings.profile.name_ar, MOCK_DATA.user.name_ar);
    assert.strictEqual(settings.profile.email, MOCK_DATA.user.email);
    assert.strictEqual(settings.business.cr_number, MOCK_DATA.user.business_profile.cr_number);
    assert.strictEqual(settings.business.vat_number, MOCK_DATA.user.business_profile.vat_number);
    assert.strictEqual(settings.security.two_factor, true);
    assert.strictEqual(settings.notifications.email_rfq, true);
  });
});

test('SettingsPage - Tab Navigation Switching', async (t) => {
  setupDOM();
  localStorage.clear();

  await t.test('switchTab toggles visibility between tab panels and updates aria-selected', () => {
    SettingsPage.init();
    assert.strictEqual(SettingsPage.activeTab, 'profile');

    const profilePanel = document.getElementById('tab-panel-profile');
    const secPanel = document.getElementById('tab-panel-security');
    const bizPanel = document.getElementById('tab-panel-business');

    assert.ok(!profilePanel.classList.contains('hidden'));
    assert.ok(secPanel.classList.contains('hidden'));

    // Switch to Security
    SettingsPage.switchTab('security');
    assert.strictEqual(SettingsPage.activeTab, 'security');
    assert.ok(profilePanel.classList.contains('hidden'));
    assert.ok(!secPanel.classList.contains('hidden'));

    // Switch to Business
    SettingsPage.switchTab('business');
    assert.strictEqual(SettingsPage.activeTab, 'business');
    assert.ok(secPanel.classList.contains('hidden'));
    assert.ok(!bizPanel.classList.contains('hidden'));

    // Fallback for invalid tab name
    SettingsPage.switchTab('invalid-tab-xyz');
    assert.strictEqual(SettingsPage.activeTab, 'profile');
  });
});

test('SettingsPage - Form Population, Collection & Validation', async (t) => {
  setupDOM();
  localStorage.clear();

  await t.test('populateForm fills input values from stored settings', () => {
    SettingsPage.populateForm();
    const nameInput = document.getElementById('setting-profile-name-ar');
    const crInput = document.getElementById('setting-biz-cr');
    assert.strictEqual(nameInput.value, MOCK_DATA.user.name_ar);
    assert.strictEqual(crInput.value, MOCK_DATA.user.business_profile.cr_number);
  });

  await t.test('collectFormData gathers updated values correctly', () => {
    document.getElementById('setting-profile-name-ar').value = 'الشيف عمر المنصوري';
    document.getElementById('setting-biz-name-ar').value = 'مؤسسة المنصوري للمطابخ';

    const collected = SettingsPage.collectFormData();
    assert.strictEqual(collected.profile.name_ar, 'الشيف عمر المنصوري');
    assert.strictEqual(collected.business.company_name_ar, 'مؤسسة المنصوري للمطابخ');
  });

  await t.test('validateForm checks email format and password mismatch', () => {
    // Valid email
    document.getElementById('setting-profile-email').value = 'valid@meyar.sa';
    assert.strictEqual(SettingsPage.validateForm().valid, true);

    // Invalid email
    document.getElementById('setting-profile-email').value = 'invalid-email';
    assert.strictEqual(SettingsPage.validateForm().valid, false);
    document.getElementById('setting-profile-email').value = 'valid@meyar.sa';

    // Password mismatch
    document.getElementById('setting-new-pwd').value = 'secret123';
    document.getElementById('setting-confirm-pwd').value = 'mismatch123';
    assert.strictEqual(SettingsPage.validateForm().valid, false);

    // Password short length (<6)
    document.getElementById('setting-new-pwd').value = '123';
    document.getElementById('setting-confirm-pwd').value = '123';
    assert.strictEqual(SettingsPage.validateForm().valid, false);

    // Matching password
    document.getElementById('setting-new-pwd').value = 'supersecret123';
    document.getElementById('setting-confirm-pwd').value = 'supersecret123';
    assert.strictEqual(SettingsPage.validateForm().valid, true);
  });
});

test('SettingsPage - Live Theme & Language Switching and Storage Persistence', async (t) => {
  setupDOM();
  localStorage.clear();

  await t.test('handleSave persists updated settings and triggers live system changes', () => {
    SettingsPage.init();

    // Modify values
    document.getElementById('setting-profile-email').value = 'test@meyar.sa';
    document.getElementById('setting-lang-select').value = 'en';
    
    // Select light theme
    const themeLightRadio = document.querySelector('input[name="setting-theme-mode"][value="light"]');
    if (themeLightRadio) themeLightRadio.checked = true;

    SettingsPage.handleSave();

    const saved = SettingsPage.getSettings();
    assert.strictEqual(saved.profile.email, 'test@meyar.sa');
    assert.strictEqual(saved.language.lang, 'en');
    assert.strictEqual(saved.theme.theme, 'light');

    assert.strictEqual(I18n.getLang(), 'en');
    assert.strictEqual(ThemeManager.getTheme(), 'light');
  });

  await t.test('revokeSessions terminates secondary sessions and persists updated session count', () => {
    SettingsPage.revokeSessions();
    const saved = SettingsPage.getSettings();
    assert.strictEqual(saved.security.active_sessions_count, 1);

    const secondarySessions = document.querySelectorAll('.secondary-session');
    assert.strictEqual(secondarySessions.length, 0);
  });
});

test('SettingsPage - Strict HTML & Solid Surfaces Design Validation', async (t) => {
  const filePath = path.resolve(process.cwd(), 'settings.html');
  assert.ok(fs.existsSync(filePath), 'settings.html must exist on filesystem');

  const content = fs.readFileSync(filePath, 'utf8');

  await t.test('Includes Anti-FOUC inline synchronous script in <head>', () => {
    assert.ok(content.includes('localStorage.getItem(\'meyar_theme\')'), 'Anti-FOUC script must check theme');
    assert.ok(content.includes('localStorage.getItem(\'meyar_lang\')'), 'Anti-FOUC script must check language');
  });

  await t.test('Enforces 100% Solid Surfaces: strictly zero glassmorphism / zero backdrop-blur', () => {
    assert.ok(!content.includes('backdrop-blur-md'), 'No backdrop-blur-md allowed');
    assert.ok(!content.includes('backdrop-blur-lg'), 'No backdrop-blur-lg allowed');
    assert.ok(!content.includes('backdrop-filter'), 'No backdrop-filter allowed');
    assert.ok(!content.includes('bg-opacity-'), 'No semi-transparent background hacks');
  });

  await t.test('Strict CSS Logical Properties in markup', () => {
    assert.ok(content.includes('start-') || content.includes('ps-') || content.includes('pe-') || content.includes('text-start'), 'Must use CSS logical properties');
    assert.ok(!content.includes('left-0') && !content.includes('right-0'), 'Must not use non-logical left-0 / right-0 in primary layout');
  });

  await t.test('Includes all 6 settings tab panels', () => {
    assert.ok(content.includes('data-tab-panel="profile"'));
    assert.ok(content.includes('data-tab-panel="security"'));
    assert.ok(content.includes('data-tab-panel="language"'));
    assert.ok(content.includes('data-tab-panel="theme"'));
    assert.ok(content.includes('data-tab-panel="notifications"'));
    assert.ok(content.includes('data-tab-panel="business"'));
  });

  await t.test('Includes proper scripts and controllers', () => {
    assert.ok(content.includes('./js/app.js'), 'Must load app.js');
    assert.ok(content.includes('./js/pages/settings.js'), 'Must load settings.js');
  });
});
