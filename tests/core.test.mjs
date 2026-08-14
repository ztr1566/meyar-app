import test from 'node:test';
import assert from 'node:assert/strict';

// Helper to set up a mock DOM environment
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
      this._innerHTML = '';
      this.listeners = new Map();
      this.focused = false;
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

    focus() {
      this.focused = true;
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
      if (s.includes(':not(')) {
        const base = s.split(':not(')[0];
        const neg = s.split(':not(')[1].replace(')', '');
        return this._matchSingle(base) && !this._matchSingle(neg);
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
      const results = this.querySelectorAll(selector);
      return results.length > 0 ? results[0] : null;
    }

    querySelectorAll(selector) {
      const results = [];
      const traverse = (el) => {
        for (const child of el.children) {
          if (child.matches && child.matches(selector)) {
            results.push(child);
          }
          traverse(child);
        }
      };
      traverse(this);
      return results;
    }

    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];
      if (html.includes('<button')) {
        const btn = new Element('button');
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-label', 'Close');
        this.appendChild(btn);
      }
      if (html.includes('<h4')) {
        const h4 = new Element('h4');
        this.appendChild(h4);
      }
      if (html.includes('<p')) {
        const p = new Element('p');
        this.appendChild(p);
      }
    }

    get innerHTML() {
      return this._innerHTML;
    }
  }

  const documentElement = new Element('html');
  const body = new Element('body');
  documentElement.appendChild(body);

  const docListeners = new Map();

  const documentMock = {
    documentElement,
    body,
    createElement(tag) {
      return new Element(tag);
    },
    getElementById(id) {
      const find = (el) => {
        if (el.id === id) return el;
        for (const c of el.children) {
          const res = find(c);
          if (res) return res;
        }
        return null;
      };
      return find(documentElement);
    },
    querySelector(selector) {
      return documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      return documentElement.querySelectorAll(selector);
    },
    addEventListener(event, callback) {
      if (!docListeners.has(event)) {
        docListeners.set(event, []);
      }
      docListeners.get(event).push(callback);
    },
    dispatchEvent(evt) {
      const handlers = docListeners.get(evt.type) || [];
      for (const h of handlers) {
        h(evt);
      }
    }
  };

  const localStorageMock = {
    getItem(k) {
      return storage.has(k) ? storage.get(k) : null;
    },
    setItem(k, v) {
      storage.set(k, String(v));
    },
    removeItem(k) {
      storage.delete(k);
    },
    clear() {
      storage.clear();
    }
  };

  let mediaQueryMatches = false;
  const mediaQueryListeners = [];
  const winListeners = new Map();

  const windowMock = {
    addEventListener(event, callback) {
      if (!winListeners.has(event)) {
        winListeners.set(event, []);
      }
      winListeners.get(event).push(callback);
    },
    dispatchEvent(evt) {
      const handlers = winListeners.get(evt.type) || [];
      for (const h of handlers) {
        h(evt);
      }
    },
    matchMedia(query) {
      return {
        matches: query.includes('light') ? mediaQueryMatches : !mediaQueryMatches,
        addEventListener(event, cb) {
          mediaQueryListeners.push(cb);
        }
      };
    },
    _setMediaMatch(matchesLight) {
      mediaQueryMatches = matchesLight;
      mediaQueryListeners.forEach(cb => cb({ matches: !matchesLight }));
    }
  };

  class CustomEventMock {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail || {};
    }
  }

  globalThis.document = documentMock;
  globalThis.localStorage = localStorageMock;
  globalThis.window = windowMock;
  globalThis.CustomEvent = CustomEventMock;
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

  return {
    documentMock,
    localStorageMock,
    windowMock,
    fireDocumentEvent(type, eventObj) {
      eventObj.type = type;
      eventObj.preventDefault = () => {};
      const handlers = docListeners.get(type) || [];
      for (const h of handlers) {
        h(eventObj);
      }
    }
  };
}

test('ThemeManager - gets, sets, toggles theme, and synchronizes state', async () => {
  const dom = setupDOM();
  const { ThemeManager } = await import('../js/core/theme.js');

  // Test 1: getTheme fallback when storage empty (matchMedia dark)
  assert.equal(ThemeManager.getTheme(), 'dark');

  // Test 2: setTheme('dark') adds .dark to html
  ThemeManager.setTheme('dark');
  assert.ok(globalThis.document.documentElement.classList.contains('dark'));
  assert.equal(globalThis.localStorage.getItem('meyar_theme'), 'dark');

  // Test 3: setTheme('light') removes .dark from html
  ThemeManager.setTheme('light');
  assert.ok(!globalThis.document.documentElement.classList.contains('dark'));
  assert.equal(globalThis.localStorage.getItem('meyar_theme'), 'light');

  // Test 4: toggleTheme
  const toggled = ThemeManager.toggleTheme();
  assert.equal(toggled, 'dark');
  assert.ok(globalThis.document.documentElement.classList.contains('dark'));

  // Test 5: updateToggleButtons
  const toggleBtn = globalThis.document.createElement('button');
  toggleBtn.setAttribute('data-action', 'toggle-theme');
  globalThis.document.body.appendChild(toggleBtn);

  ThemeManager.updateToggleButtons('dark');
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'true');

  ThemeManager.updateToggleButtons('light');
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');

  // Test 6: ThemeManager.init and click handling
  globalThis.localStorage.clear();
  let themeEventDetail = null;
  globalThis.window.addEventListener('meyar:theme-changed', (e) => {
    themeEventDetail = e.detail;
  });

  ThemeManager.init();
  assert.equal(themeEventDetail.theme, 'dark');

  // Simulate click on toggleBtn
  dom.fireDocumentEvent('click', {
    target: toggleBtn
  });
  assert.equal(themeEventDetail.theme, 'light');
  assert.equal(toggleBtn.getAttribute('aria-pressed'), 'false');
});

test('Toast - creates container, displays different types, and dismisses', async () => {
  const dom = setupDOM();
  const { Toast } = await import('../js/core/toast.js');

  Toast.container = null; // reset container

  // Test 1: Success toast
  Toast.success('Saved successfully!', 'Success');
  const container = globalThis.document.getElementById('meyar-toast-container');
  assert.ok(container, 'Container should be created');
  assert.ok(container.classList.contains('fixed'));
  assert.ok(container.classList.contains('bottom-6'));
  assert.ok(container.classList.contains('end-6'));
  assert.equal(container.children.length, 1);

  const toast1 = container.children[0];
  assert.ok(toast1.innerHTML.includes('text-brand-emerald'));
  assert.ok(toast1.classList.contains('bg-surface-2'));

  // Test 2: Error toast
  Toast.error('Operation failed', 'Error');
  assert.equal(container.children.length, 2);
  const toast2 = container.children[1];
  assert.ok(toast2.innerHTML.includes('text-red-500'));

  // Test 3: Info toast
  Toast.info('New message arrived', 'Notice');
  assert.equal(container.children.length, 3);
  const toast3 = container.children[2];
  assert.ok(toast3.innerHTML.includes('text-brand-gold'));

  // Test 4: Toast dismissal
  Toast.dismiss(toast1);
  assert.ok(toast1.classList.contains('opacity-0'));
  assert.ok(toast1.classList.contains('translate-y-2'));
});

test('Modal - opens, closes, manages focus and backdrop/keyboard triggers', async () => {
  const dom = setupDOM();
  const { Modal } = await import('../js/core/modal.js');

  Modal.activeModal = null;
  Modal.init();

  // Create mock modal in DOM
  const modal = globalThis.document.createElement('div');
  modal.id = 'demo-modal';
  modal.setAttribute('role', 'dialog');
  modal.classList.add('hidden');

  const backdrop = globalThis.document.createElement('div');
  backdrop.setAttribute('data-modal-backdrop', 'true');
  modal.appendChild(backdrop);

  const closeBtn = globalThis.document.createElement('button');
  closeBtn.setAttribute('data-modal-close', 'true');
  modal.appendChild(closeBtn);

  const inputField = globalThis.document.createElement('input');
  modal.appendChild(inputField);

  globalThis.document.body.appendChild(modal);

  let openedModalId = null;
  let closedModalId = null;
  globalThis.window.addEventListener('meyar:modal-opened', (e) => {
    openedModalId = e.detail.modalId;
  });
  globalThis.window.addEventListener('meyar:modal-closed', (e) => {
    closedModalId = e.detail.modalId;
  });

  // Test 1: Open modal
  Modal.open('demo-modal');
  assert.ok(modal.classList.contains('flex'));
  assert.ok(!modal.classList.contains('hidden'));
  assert.equal(modal.getAttribute('aria-hidden'), 'false');
  assert.ok(globalThis.document.body.classList.contains('overflow-hidden'));
  assert.equal(Modal.activeModal, modal);
  assert.equal(openedModalId, 'demo-modal');
  assert.ok(closeBtn.focused, 'First focusable element should receive focus');

  // Test 2: Close modal
  Modal.close('demo-modal');
  assert.ok(modal.classList.contains('hidden'));
  assert.ok(!modal.classList.contains('flex'));
  assert.equal(modal.getAttribute('aria-hidden'), 'true');
  assert.ok(!globalThis.document.body.classList.contains('overflow-hidden'));
  assert.equal(Modal.activeModal, null);
  assert.equal(closedModalId, 'demo-modal');

  // Test 3: Trigger open via [data-modal-target]
  const triggerBtn = globalThis.document.createElement('button');
  triggerBtn.setAttribute('data-modal-target', 'demo-modal');
  globalThis.document.body.appendChild(triggerBtn);

  dom.fireDocumentEvent('click', { target: triggerBtn });
  assert.equal(Modal.activeModal, modal);
  assert.ok(modal.classList.contains('flex'));

  // Test 4: Trigger close via escape key
  dom.fireDocumentEvent('keydown', { key: 'Escape' });
  assert.equal(Modal.activeModal, null);
  assert.ok(modal.classList.contains('hidden'));

  // Test 5: Trigger open & close via backdrop
  Modal.open('demo-modal');
  assert.equal(Modal.activeModal, modal);
  dom.fireDocumentEvent('click', { target: backdrop });
  assert.equal(Modal.activeModal, null);
  assert.ok(modal.classList.contains('hidden'));
});
