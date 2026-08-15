import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../js/data/translations.js';
import { I18n } from '../js/core/i18n.js';

// Setup DOM Mock Environment
function setupDOM() {
  const listeners = new Map();
  const storage = new Map();

  class ClassList {
    constructor() {
      this._classes = new Set();
    }
    add(...cls) {
      cls.forEach(c => this._classes.add(c));
    }
    remove(...cls) {
      cls.forEach(c => this._classes.delete(c));
    }
    contains(c) {
      return this._classes.has(c);
    }
    toString() {
      return Array.from(this._classes).join(' ');
    }
  }

  class Element {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.id = '';
      this.classList = new ClassList();
      this.attributes = new Map();
      this.children = [];
      this.parentElement = null;
      this._textContent = '';
      this.listeners = new Map();
    }

    get textContent() {
      if (this.children.length > 0) {
        return this.children.map(c => c.textContent).join('');
      }
      return this._textContent;
    }

    set textContent(val) {
      this.children = [];
      this._textContent = String(val);
    }

    setAttribute(key, val) {
      this.attributes.set(key, String(val));
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

  const windowMock = {
    listeners: new Map(),
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

  return { documentMock, windowMock, localStorageMock };
}

test('Translation Dictionary - Symmetry and Completeness', async (t) => {
  await t.test('Arabic and English dictionaries exist and are non-empty', () => {
    assert.ok(translations.ar, 'translations.ar should exist');
    assert.ok(translations.en, 'translations.en should exist');
    assert.ok(Object.keys(translations.ar).length > 150, `ar keys count ${Object.keys(translations.ar).length} > 150`);
    assert.ok(Object.keys(translations.en).length > 150, `en keys count ${Object.keys(translations.en).length} > 150`);
  });

  await t.test('Complete 100% key symmetry between AR and EN dictionaries', () => {
    const arKeys = Object.keys(translations.ar).sort();
    const enKeys = Object.keys(translations.en).sort();

    const missingInEn = arKeys.filter(k => !(k in translations.en));
    const missingInAr = enKeys.filter(k => !(k in translations.ar));

    assert.deepEqual(missingInEn, [], `Keys in AR but missing in EN: ${missingInEn.join(', ')}`);
    assert.deepEqual(missingInAr, [], `Keys in EN but missing in AR: ${missingInAr.join(', ')}`);
  });

  await t.test('No empty or non-string values in translation dictionaries', () => {
    for (const [key, val] of Object.entries(translations.ar)) {
      assert.equal(typeof val, 'string', `AR key [${key}] must be string`);
      assert.ok(val.trim().length > 0, `AR key [${key}] must not be empty`);
    }
    for (const [key, val] of Object.entries(translations.en)) {
      assert.equal(typeof val, 'string', `EN key [${key}] must be string`);
      assert.ok(val.trim().length > 0, `EN key [${key}] must not be empty`);
    }
  });

  await t.test('All critical required domain categories are present', () => {
    const requiredPrefixes = [
      'nav.', 'role.', 'btn.', 'recipe.', 'units.',
      'supplies.', 'rfq.', 'courses.', 'chef.',
      'dashboard.', 'chat.', 'notifications.',
      'settings.', 'auth.', 'feed.', 'explore.',
      'search.', 'toast.', 'common.', 'modal.'
    ];

    const arKeys = Object.keys(translations.ar);
    for (const prefix of requiredPrefixes) {
      const matching = arKeys.filter(k => k.startsWith(prefix));
      assert.ok(matching.length > 0, `Prefix "${prefix}" should have keys, found ${matching.length}`);
    }
  });
});

test('I18n Engine - State Management and Translation Lookup', async (t) => {
  setupDOM();

  await t.test('Defaults to Arabic (ar) when storage is empty', () => {
    localStorage.clear();
    assert.equal(I18n.getLang(), 'ar');
  });

  await t.test('setLang updates localStorage, document attributes (lang, dir), and broadcasts event', () => {
    localStorage.clear();
    let eventDetail = null;
    window.addEventListener('meyar:lang-changed', (e) => {
      eventDetail = e.detail;
    });

    const result = I18n.setLang('en');
    assert.equal(result, 'en');
    assert.equal(localStorage.getItem('meyar_lang'), 'en');
    assert.equal(document.documentElement.getAttribute('lang'), 'en');
    assert.equal(document.documentElement.getAttribute('dir'), 'ltr');
    assert.deepEqual(eventDetail, { lang: 'en' });

    I18n.setLang('ar');
    assert.equal(localStorage.getItem('meyar_lang'), 'ar');
    assert.equal(document.documentElement.getAttribute('lang'), 'ar');
    assert.equal(document.documentElement.getAttribute('dir'), 'rtl');
    assert.deepEqual(eventDetail, { lang: 'ar' });
  });

  await t.test('toggleLang toggles between ar and en and returns new language', () => {
    I18n.setLang('ar');
    const next1 = I18n.toggleLang();
    assert.equal(next1, 'en');
    assert.equal(I18n.getLang(), 'en');
    assert.equal(document.documentElement.getAttribute('dir'), 'ltr');

    const next2 = I18n.toggleLang();
    assert.equal(next2, 'ar');
    assert.equal(I18n.getLang(), 'ar');
    assert.equal(document.documentElement.getAttribute('dir'), 'rtl');
  });

  await t.test('t() returns translated string according to current language', () => {
    I18n.setLang('ar');
    assert.equal(I18n.t('nav.recipes'), 'الوصفات');
    assert.equal(I18n.t('btn.save'), 'حفظ');

    I18n.setLang('en');
    assert.equal(I18n.t('nav.recipes'), 'Recipes');
    assert.equal(I18n.t('btn.save'), 'Save');
  });

  await t.test('t() interpolates parameters correctly', () => {
    I18n.setLang('ar');
    assert.equal(I18n.t('recipe.step_num', { number: 4 }), 'الخطوة 4');

    I18n.setLang('en');
    assert.equal(I18n.t('recipe.step_num', { number: 4 }), 'Step 4');
  });

  await t.test('t() handles fallback and unknown keys safely', () => {
    assert.equal(I18n.t('unknown.missing.key'), 'unknown.missing.key');
    assert.equal(I18n.t(''), '');
  });
});

test('I18n Engine - DOM Translation & Page Scanner', async (t) => {
  setupDOM();

  const container = document.createElement('div');
  document.body.appendChild(container);

  const textEl = document.createElement('span');
  textEl.setAttribute('data-i18n', 'nav.supplies');
  container.appendChild(textEl);

  const inputEl = document.createElement('input');
  inputEl.setAttribute('data-i18n-placeholder', 'search.placeholder');
  container.appendChild(inputEl);

  const buttonEl = document.createElement('button');
  buttonEl.setAttribute('data-i18n-title', 'btn.saved');
  buttonEl.setAttribute('data-i18n-aria-label', 'btn.saved');
  container.appendChild(buttonEl);

  const toggleBtn = document.createElement('button');
  toggleBtn.setAttribute('data-action', 'toggle-lang');
  const langLabel = document.createElement('span');
  langLabel.classList.add('lang-label');
  toggleBtn.appendChild(langLabel);
  container.appendChild(toggleBtn);

  await t.test('Translates all data-i18n* DOM attributes when switching to AR', () => {
    I18n.setLang('ar');
    assert.equal(textEl.textContent, 'التوريدات');
    assert.equal(inputEl.getAttribute('placeholder'), 'ابحث في الوصفات، الطهاة، التوريدات، والدورات...');
    assert.equal(buttonEl.getAttribute('title'), 'محفوظ');
    assert.equal(buttonEl.getAttribute('aria-label'), 'محفوظ');
    assert.equal(langLabel.textContent, 'English');
  });

  await t.test('Translates all data-i18n* DOM attributes when switching to EN', () => {
    I18n.setLang('en');
    assert.equal(textEl.textContent, 'Supplies');
    assert.equal(inputEl.getAttribute('placeholder'), 'Search recipes, chefs, supplies, masterclasses...');
    assert.equal(buttonEl.getAttribute('title'), 'Saved');
    assert.equal(buttonEl.getAttribute('aria-label'), 'Saved');
    assert.equal(langLabel.textContent, 'العربية');
  });

  await t.test('I18n.init registers click delegation on [data-action="toggle-lang"]', () => {
    I18n.setLang('ar');
    I18n.init();

    // Trigger click on toggleBtn
    const fakeEvent = {
      type: 'click',
      target: toggleBtn,
      preventDefault() {}
    };
    document.dispatchEvent(fakeEvent);

    assert.equal(I18n.getLang(), 'en');
    assert.equal(document.documentElement.getAttribute('dir'), 'ltr');
    assert.equal(langLabel.textContent, 'العربية');
  });
});
