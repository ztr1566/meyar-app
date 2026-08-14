import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Modal } from '../js/core/modal.js';
import { SearchModule, normalizeSearchQuery } from '../js/modules/search.js';
import { initApp, ThemeManager, Toast } from '../js/app.js';

// Comprehensive DOM mocking environment for testing Search & App shell
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
      this.value = '';
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
      let stopped = false;
      evt.stopPropagation = () => { stopped = true; };
      evt.preventDefault = evt.preventDefault || (() => {});

      let curr = this;
      while (curr && !stopped) {
        curr.currentTarget = curr;
        const elMap = listeners.get(curr);
        const handlers = (elMap && elMap.get(evt.type)) || [];
        for (const h of handlers) {
          h(evt);
        }
        curr = curr.parentElement;
      }

      if (!stopped && docMockRef) {
        docMockRef.dispatchEvent(evt);
      }
      return true;
    }

    focus() {
      this.focused = true;
    }

    select() {}

    scrollIntoView() {}

    click() {
      this.clicked = true;
      const evt = {
        type: 'click',
        target: this,
        currentTarget: this,
        preventDefault() {},
        stopPropagation() {}
      };
      this.dispatchEvent(evt);
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

      // Parse simulated elements from HTML string for querySelectorAll
      if (html.includes('search-result-item')) {
        const matches = html.match(/<a\s+href="([^"]+)"\s+class="([^"]*search-result-item[^"]*)"/g) || [];
        matches.forEach(m => {
          const item = new Element('a');
          const hrefMatch = m.match(/href="([^"]+)"/);
          if (hrefMatch) item.setAttribute('href', hrefMatch[1]);
          item.className = 'search-result-item flex items-center gap-3 p-2.5';
          this.appendChild(item);
        });
      }
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set textContent(val) {
      this._textContent = String(val);
    }

    get textContent() {
      return this._textContent !== undefined ? this._textContent : '';
    }
  }

  const documentElement = new Element('html');
  const body = new Element('body');
  documentElement.appendChild(body);

  const docListeners = new Map();

  const documentMock = {
    documentElement,
    body,
    readyState: 'complete',
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

  docMockRef = documentMock;

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

  const winListeners = new Map();

  const windowMock = {
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
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
      return true;
    }
  };

  global.document = documentMock;
  global.localStorage = localStorageMock;
  global.window = windowMock;
  global.Element = Element;
  global.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail || null;
    }
  };
  global.requestAnimationFrame = (cb) => cb();

  return { documentMock, localStorageMock, windowMock, Element };
}

// -------------------------------------------------------------
// Test Suite 1: Arabic & English Query Normalization
// -------------------------------------------------------------
test('Search Query Normalizer - Handles Arabic Diacritics and Letter Variations', () => {
  assert.equal(normalizeSearchQuery(''), '');
  assert.equal(normalizeSearchQuery(null), '');
  assert.equal(normalizeSearchQuery(undefined), '');

  // Alef variants
  assert.equal(normalizeSearchQuery('أحمد'), 'احمد');
  assert.equal(normalizeSearchQuery('إبراهيم'), 'ابراهيم');
  assert.equal(normalizeSearchQuery('آسيا'), 'اسيا');
  assert.equal(normalizeSearchQuery('ٱلله'), 'الله');

  // Ta Marbuta & Alef Maksura
  assert.equal(normalizeSearchQuery('شوربة'), 'شوربه');
  assert.equal(normalizeSearchQuery('موسيقى'), 'موسيقي');
  assert.equal(normalizeSearchQuery('ليلى'), 'ليلي');

  // Tashkeel / Harakat removal
  assert.equal(normalizeSearchQuery('مَعْيار'), 'معيار');
  assert.equal(normalizeSearchQuery('شَيْفٌ'), 'شيف');
  assert.equal(normalizeSearchQuery('طَازَجٌ'), 'طازج');

  // English trimming and lowercase
  assert.equal(normalizeSearchQuery('  Wagyu Beef  '), 'wagyu beef');
});

// -------------------------------------------------------------
// Test Suite 2: Multi-Domain Query Engine (Recipes, Chefs, Supplies, Courses)
// -------------------------------------------------------------
test('SearchModule.query - Recipes Domain Queries (Arabic & English)', () => {
  // Empty query
  const emptyRes = SearchModule.query('');
  assert.equal(emptyRes.total, 0);
  assert.equal(emptyRes.recipes.length, 0);

  // Arabic recipe title search: Wagyu
  const wagyuAr = SearchModule.query('واغيو');
  assert.ok(wagyuAr.recipes.length > 0);
  assert.equal(wagyuAr.recipes[0].id, 'recipe-1');

  // English recipe title search: Sea Bass
  const seaBassEn = SearchModule.query('Sea Bass');
  assert.ok(seaBassEn.recipes.length > 0);
  assert.equal(seaBassEn.recipes[0].id, 'recipe-2');

  // Recipe by Italian cuisine
  const italianRes = SearchModule.query('إيطالي');
  assert.ok(italianRes.recipes.some(r => r.id === 'recipe-3'));

  // Recipe by tags: Truffle
  const truffleRes = SearchModule.query('Truffle');
  assert.ok(truffleRes.recipes.some(r => r.tags.includes('Truffle')));

  // Recipe by author name
  const authorRes = SearchModule.query('فيصل الهاشمي');
  assert.ok(authorRes.recipes.some(r => r.author_id === 'chef-1'));
});

test('SearchModule.query - Chefs Domain Queries (Arabic & English)', () => {
  // Arabic chef name: Faisal
  const faisalAr = SearchModule.query('فيصل');
  assert.ok(faisalAr.chefs.length > 0);
  assert.equal(faisalAr.chefs[0].id, 'chef-1');

  // English chef name: Elena
  const elenaEn = SearchModule.query('Elena Rostova');
  assert.ok(elenaEn.chefs.length > 0);
  assert.equal(elenaEn.chefs[0].id, 'chef-2');

  // Japanese Chef: Kenji
  const kenjiRes = SearchModule.query('Kenji');
  assert.ok(kenjiRes.chefs.length > 0);
  assert.equal(kenjiRes.chefs[0].id, 'chef-4');

  // Specialty search in Arabic
  const smokeAr = SearchModule.query('المشاوي');
  assert.ok(smokeAr.chefs.some(c => c.id === 'chef-3'));

  // Handle search
  const handleRes = SearchModule.query('@marco_pastaio');
  assert.ok(handleRes.chefs.length > 0);
  assert.equal(handleRes.chefs[0].id, 'chef-6');
});

test('SearchModule.query - B2B Supplies Domain Queries (Arabic & English)', () => {
  // Arabic supplies: Spiral mixer / dough kneader
  const mixerAr = SearchModule.query('عجانة');
  assert.ok(mixerAr.supplies.length > 0);
  assert.equal(mixerAr.supplies[0].id, 'supply-1');

  // English supplies: Damascus knife
  const knifeEn = SearchModule.query('Damascus');
  assert.ok(knifeEn.supplies.length > 0);
  assert.equal(knifeEn.supplies[0].id, 'supply-3');

  // Saffron bulk supply
  const saffronRes = SearchModule.query('Saffron');
  assert.ok(saffronRes.supplies.some(s => s.id === 'supply-8'));

  // Supplier search in Arabic
  const joufAr = SearchModule.query('الجوف');
  assert.ok(joufAr.supplies.some(s => s.id === 'supply-2'));
});

test('SearchModule.query - Masterclasses & Courses Domain Queries (Arabic & English)', () => {
  // Arabic course title: Fermentation
  const fermAr = SearchModule.query('التخمير');
  assert.ok(fermAr.courses.length > 0);
  assert.equal(fermAr.courses[0].id, 'course-1');

  // English course title: Viennoiserie
  const pastryEn = SearchModule.query('Viennoiserie');
  assert.ok(pastryEn.courses.length > 0);
  assert.equal(pastryEn.courses[0].id, 'course-2');

  // Instructor name query in Arabic
  const instAr = SearchModule.query('طارق منصور');
  assert.ok(instAr.courses.some(co => co.id === 'course-3'));

  // Course level query
  const levelRes = SearchModule.query('masterclass');
  assert.ok(levelRes.courses.length > 0);
});

test('SearchModule.query - Multi-Entity Cross-Domain Hits', () => {
  // "فيصل" should return recipes authored by Faisal, his Chef profile, and his Masterclass course
  const multiRes = SearchModule.query('فيصل');
  assert.ok(multiRes.recipes.length > 0, 'Should match recipes authored by Faisal');
  assert.ok(multiRes.chefs.length > 0, 'Should match Chef Faisal');
  assert.ok(multiRes.courses.length > 0, 'Should match Masterclass course by Faisal');
  assert.ok(multiRes.total >= 3);

  // "Truffle" should match recipe-3 (Wild Truffle Agnolotti), chef-6 (Truffle specialist), and supply-5 (Truffle oil)
  const truffleMulti = SearchModule.query('Truffle');
  assert.ok(truffleMulti.recipes.length > 0);
  assert.ok(truffleMulti.chefs.length > 0);
  assert.ok(truffleMulti.supplies.length > 0);
});

// -------------------------------------------------------------
// Test Suite 3: Rendering Results in Arabic and English
// -------------------------------------------------------------
test('SearchModule.renderResults - Empty and No-Result States', () => {
  const { documentMock, Element } = setupDOM();
  const container = new Element('div');
  container.id = 'search-results-container';
  documentMock.body.appendChild(container);

  // 1. Empty query prompt
  SearchModule.renderResults('', container);
  assert.ok(container.innerHTML.includes('data-i18n="search.type_prompt"'));

  // 2. Non-matching query
  SearchModule.renderResults('xyzxyznonexistent9999', container);
  assert.ok(container.innerHTML.includes('data-i18n="search.no_results"'));
});

test('SearchModule.renderResults - Multi-Domain Result HTML & Bilingual Labels', () => {
  const { documentMock, Element } = setupDOM();
  const container = new Element('div');
  container.id = 'search-results-container';
  documentMock.body.appendChild(container);

  // Render search in Arabic mode
  I18n.setLang('ar');
  SearchModule.renderResults('Wagyu', container);

  assert.ok(container.innerHTML.includes('recipe.html?id=recipe-1'));
  assert.ok(container.innerHTML.includes('ستيك واغيو'));
  assert.ok(container.innerHTML.includes('bg-surface-1'));
  assert.ok(container.innerHTML.includes('border-border-subtle'));

  // Render search in English mode
  I18n.setLang('en');
  SearchModule.renderResults('Wagyu', container);
  assert.ok(container.innerHTML.includes('Wagyu Ribeye'));
});

// -------------------------------------------------------------
// Test Suite 4: Keyboard Navigation & Shortcuts (Ctrl+K, Arrows, Escape)
// -------------------------------------------------------------
test('SearchModule.open and close - Interacts with Modal and focuses input', () => {
  const { documentMock, Element } = setupDOM();

  const modal = new Element('div');
  modal.id = 'search-modal';
  modal.classList.add('hidden');
  documentMock.body.appendChild(modal);

  const input = new Element('input');
  input.id = 'global-search-input';
  modal.appendChild(input);

  const container = new Element('div');
  container.id = 'search-results-container';
  modal.appendChild(container);

  SearchModule.isInitialized = false;
  SearchModule.init();

  // Test Open
  SearchModule.open();
  assert.equal(modal.classList.contains('hidden'), false);
  assert.equal(modal.classList.contains('flex'), true);

  // Test Close
  SearchModule.close();
  assert.equal(modal.classList.contains('hidden'), true);
});

test('SearchModule Keyboard Navigation - ArrowDown, ArrowUp and Enter selection', () => {
  const { documentMock, Element } = setupDOM();

  const container = new Element('div');
  container.id = 'search-results-container';
  documentMock.body.appendChild(container);

  SearchModule.renderResults('Truffle', container);

  // Check that search result item links were rendered
  const items = container.querySelectorAll('.search-result-item');
  assert.ok(items.length >= 2);

  // Simulate ArrowDown
  SearchModule.handleKeyboardNavigation({ key: 'ArrowDown', preventDefault() {} });
  assert.equal(SearchModule.activeIndex, 0);
  assert.ok(items[0].classList.contains('ring-brand-gold'));

  // Simulate ArrowDown again
  SearchModule.handleKeyboardNavigation({ key: 'ArrowDown', preventDefault() {} });
  assert.equal(SearchModule.activeIndex, 1);
  assert.ok(items[1].classList.contains('ring-brand-gold'));
  assert.equal(items[0].classList.contains('ring-brand-gold'), false);

  // Simulate ArrowUp
  SearchModule.handleKeyboardNavigation({ key: 'ArrowUp', preventDefault() {} });
  assert.equal(SearchModule.activeIndex, 0);
  assert.ok(items[0].classList.contains('ring-brand-gold'));

  // Simulate Enter
  let itemClicked = false;
  items[0].addEventListener('click', () => { itemClicked = true; });
  SearchModule.handleKeyboardNavigation({ key: 'Enter', preventDefault() {} });
  assert.equal(itemClicked, true);
});

test('SearchModule Shortcut - Ctrl+K and Action Button Triggers Open', () => {
  const { documentMock, Element } = setupDOM();

  const modal = new Element('div');
  modal.id = 'search-modal';
  modal.classList.add('hidden');
  documentMock.body.appendChild(modal);

  const input = new Element('input');
  input.id = 'global-search-input';
  modal.appendChild(input);

  const openBtn = new Element('button');
  openBtn.setAttribute('data-action', 'open-search');
  documentMock.body.appendChild(openBtn);

  SearchModule.isInitialized = false;
  SearchModule.init();

  // Trigger via Ctrl+K
  documentMock.dispatchEvent({
    type: 'keydown',
    ctrlKey: true,
    key: 'k',
    preventDefault() {}
  });
  assert.equal(modal.classList.contains('hidden'), false);

  // Close modal
  SearchModule.close();
  assert.equal(modal.classList.contains('hidden'), true);

  // Trigger via Button click delegation
  openBtn.click();
  assert.equal(modal.classList.contains('hidden'), false);
});

// -------------------------------------------------------------
// Test Suite 5: App Shell Initialization (js/app.js)
// -------------------------------------------------------------
test('initApp - Initializes Theme, i18n, Modals, Search, Mobile Drawer, and Dropdowns', () => {
  const { documentMock, Element } = setupDOM();

  // Create UI Elements for app shell
  const mobileDrawer = new Element('div');
  mobileDrawer.id = 'mobile-drawer';
  mobileDrawer.classList.add('hidden');
  documentMock.body.appendChild(mobileDrawer);

  const toggleMobileBtn = new Element('button');
  toggleMobileBtn.setAttribute('data-action', 'toggle-mobile-menu');
  documentMock.body.appendChild(toggleMobileBtn);

  const closeMobileBtn = new Element('button');
  closeMobileBtn.setAttribute('data-action', 'close-mobile-menu');
  documentMock.body.appendChild(closeMobileBtn);

  const userDropdownTrigger = new Element('button');
  userDropdownTrigger.setAttribute('data-dropdown-trigger', 'user-dropdown-menu');
  documentMock.body.appendChild(userDropdownTrigger);

  const userDropdownMenu = new Element('div');
  userDropdownMenu.id = 'user-dropdown-menu';
  userDropdownMenu.setAttribute('data-dropdown', '');
  userDropdownMenu.classList.add('hidden');
  documentMock.body.appendChild(userDropdownMenu);

  const searchModal = new Element('div');
  searchModal.id = 'search-modal';
  searchModal.classList.add('hidden');
  documentMock.body.appendChild(searchModal);

  // Reset initialized flag for test isolation
  SearchModule.isInitialized = false;

  // Bootstrap app
  initApp();

  // 1. Mobile Drawer Toggle
  toggleMobileBtn.click();
  assert.equal(mobileDrawer.classList.contains('hidden'), false, 'Mobile drawer should open');

  closeMobileBtn.click();
  assert.equal(mobileDrawer.classList.contains('hidden'), true, 'Mobile drawer should close');

  // 2. Dropdown Menu Toggle
  userDropdownTrigger.click();
  assert.equal(userDropdownMenu.classList.contains('hidden'), false, 'Dropdown should open');

  // 3. Click outside closes dropdown
  const outsideEl = new Element('div');
  documentMock.body.appendChild(outsideEl);
  outsideEl.click();
  assert.equal(userDropdownMenu.classList.contains('hidden'), true, 'Dropdown should close on outside click');

  // 4. Escape key closes open dropdown and mobile drawer
  userDropdownTrigger.click();
  toggleMobileBtn.click();
  assert.equal(userDropdownMenu.classList.contains('hidden'), false);
  assert.equal(mobileDrawer.classList.contains('hidden'), false);

  documentMock.dispatchEvent({
    type: 'keydown',
    key: 'Escape'
  });
  assert.equal(userDropdownMenu.classList.contains('hidden'), true, 'Escape should close dropdown');
  assert.equal(mobileDrawer.classList.contains('hidden'), true, 'Escape should close mobile drawer');
});
