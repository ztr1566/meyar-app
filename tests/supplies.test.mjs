import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { Modal } from '../js/core/modal.js';
import { SuppliesPage } from '../js/pages/supplies.js';
import { RFQManager } from '../js/modules/rfq.js';

// Setup Mock DOM environment
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
      this._textContent = '';
      this.value = '';
      this.src = '';
      this.alt = '';
      this.min = '';
      this.name = '';
      this.checked = false;
      this.elements = {};
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
      if (child.name) {
        this.elements[child.name] = child;
      }
      if (child.id) {
        this.elements[child.id] = child;
      }
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
          if (stopped) break;
        }
        curr = curr.parentElement || (curr === docMockRef ? null : docMockRef);
      }
      return true;
    }

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

    focus() {
      this.focused = true;
    }

    reset() {
      this.children.forEach(c => {
        if (c.value !== undefined) c.value = '';
      });
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set innerHTML(val) {
      this._innerHTML = String(val);
      this.children = [];
    }

    get textContent() {
      return this._textContent;
    }

    set textContent(val) {
      this._textContent = String(val);
      this._innerHTML = String(val);
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
        if (inner.includes('=')) {
          const [attr, val] = inner.split('=');
          const cleanVal = val.replace(/['"]/g, '');
          return this.getAttribute(attr) === cleanVal;
        }
        return this.hasAttribute(inner);
      }
      return this.tagName.toLowerCase() === s.toLowerCase();
    }

    matches(selector) {
      if (!selector) return false;
      const parts = selector.split(',').map(p => p.trim());
      return parts.some(part => this._matchSingle(part));
    }

    querySelector(selector) {
      const all = this.querySelectorAll(selector);
      return all.length > 0 ? all[0] : null;
    }

    querySelectorAll(selector) {
      const matches = [];
      const traverse = (node) => {
        for (const child of node.children) {
          if (child.matches && child.matches(selector)) {
            matches.push(child);
          }
          traverse(child);
        }
      };
      traverse(this);
      return matches;
    }
  }

  const documentMock = {
    readyState: 'complete',
    body: new Element('body'),
    documentElement: new Element('html'),
    createElement(tag) {
      return new Element(tag);
    },
    getElementById(id) {
      const traverse = (node) => {
        if (node.id === id) return node;
        for (const child of node.children) {
          const res = traverse(child);
          if (res) return res;
        }
        return null;
      };
      return traverse(this.body) || traverse(this.documentElement);
    },
    querySelector(sel) {
      return this.body.querySelector(sel) || this.documentElement.querySelector(sel);
    },
    querySelectorAll(sel) {
      return [...this.body.querySelectorAll(sel), ...this.documentElement.querySelectorAll(sel)];
    },
    addEventListener(event, callback) {
      if (!listeners.has(this)) {
        listeners.set(this, new Map());
      }
      const docMap = listeners.get(this);
      if (!docMap.has(event)) {
        docMap.set(event, []);
      }
      docMap.get(event).push(callback);
    },
    dispatchEvent(evt) {
      const docMap = listeners.get(this);
      if (docMap && docMap.has(evt.type)) {
        docMap.get(evt.type).forEach(cb => cb(evt));
      }
      return true;
    }
  };
  docMockRef = documentMock;

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

  const windowListeners = new Map();
  const windowMock = {
    addEventListener(event, callback) {
      if (!windowListeners.has(event)) {
        windowListeners.set(event, []);
      }
      windowListeners.get(event).push(callback);
    },
    removeEventListener(event, callback) {
      if (windowListeners.has(event)) {
        const arr = windowListeners.get(event).filter(cb => cb !== callback);
        windowListeners.set(event, arr);
      }
    },
    dispatchEvent(evt) {
      if (windowListeners.has(evt.type)) {
        windowListeners.get(evt.type).forEach(cb => cb(evt));
      }
      return true;
    },
    matchMedia: () => ({ matches: false })
  };

  globalThis.document = documentMock;
  globalThis.localStorage = localStorageMock;
  globalThis.window = windowMock;
  globalThis.Element = Element;
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail || null;
    }
  };

  return { documentMock, localStorageMock, windowMock };
}

test('SuppliesPage - Initial Catalog & Card Rendering', () => {
  const { documentMock } = setupDOM();
  I18n.setLang('ar');

  const grid = documentMock.createElement('div');
  grid.id = 'supplies-grid';
  documentMock.body.appendChild(grid);

  const countContainer = documentMock.createElement('span');
  countContainer.id = 'supplies-results-count';
  documentMock.body.appendChild(countContainer);

  const emptyState = documentMock.createElement('div');
  emptyState.id = 'supplies-empty-state';
  emptyState.className = 'hidden';
  documentMock.body.appendChild(emptyState);

  SuppliesPage.clearFilters();
  SuppliesPage.renderCatalog();

  assert.ok(grid.innerHTML.length > 0);
  assert.ok(grid.innerHTML.includes('عجانة لولبية تجارية'));
  assert.ok(grid.innerHTML.includes('زيت زيتون بكر'));
  assert.ok(grid.innerHTML.includes('سكين الشيف الاحترافي دمشقي'));
  assert.ok(countContainer.textContent.includes('8'));
});

test('SuppliesPage - Bookmark / Save Supply Toggle and Persistence', () => {
  setupDOM();
  I18n.setLang('ar');

  assert.equal(SuppliesPage.getSavedSupplyIds().length, 0);

  // Toggle Save on supply-1
  const isSaved = SuppliesPage.toggleSaveSupply('supply-1');
  assert.equal(isSaved, true);
  assert.deepEqual(SuppliesPage.getSavedSupplyIds(), ['supply-1']);

  // Toggle Save on supply-2
  SuppliesPage.toggleSaveSupply('supply-2');
  assert.deepEqual(SuppliesPage.getSavedSupplyIds(), ['supply-1', 'supply-2']);

  // Toggle Unsave on supply-1
  const isUnsaved = SuppliesPage.toggleSaveSupply('supply-1');
  assert.equal(isUnsaved, false);
  assert.deepEqual(SuppliesPage.getSavedSupplyIds(), ['supply-2']);
});

test('SuppliesPage - Category Filtering Logic', () => {
  setupDOM();
  I18n.setLang('ar');

  // All categories
  SuppliesPage.currentCategory = 'all';
  const all = SuppliesPage.filterSupplies();
  assert.equal(all.length, 8);

  // Heavy equipment
  SuppliesPage.currentCategory = 'heavy_equipment';
  const heavy = SuppliesPage.filterSupplies();
  assert.ok(heavy.length > 0);
  assert.ok(heavy.every(i => i.category === 'heavy_equipment'));

  // Knives & Cutlery
  SuppliesPage.currentCategory = 'knives_cutlery';
  const knives = SuppliesPage.filterSupplies();
  assert.equal(knives.length, 1);
  assert.equal(knives[0].id, 'supply-3');

  // Bulk ingredients
  SuppliesPage.currentCategory = 'bulk_ingredients';
  const bulk = SuppliesPage.filterSupplies();
  assert.ok(bulk.length >= 3);
  assert.ok(bulk.every(i => i.category === 'bulk_ingredients'));

  // Eco packaging
  SuppliesPage.currentCategory = 'eco_packaging';
  const eco = SuppliesPage.filterSupplies();
  assert.equal(eco.length, 1);
  assert.equal(eco[0].id, 'supply-6');
});

test('SuppliesPage - MOQ Filtering Logic', () => {
  setupDOM();

  SuppliesPage.currentCategory = 'all';

  // MOQ = 1
  SuppliesPage.selectedMOQ = '1';
  const moq1 = SuppliesPage.filterSupplies();
  assert.ok(moq1.every(i => i.moq === 1));

  // MOQ <= 2
  SuppliesPage.selectedMOQ = '2';
  const moq2 = SuppliesPage.filterSupplies();
  assert.ok(moq2.every(i => i.moq <= 2));

  // MOQ <= 5
  SuppliesPage.selectedMOQ = '5';
  const moq5 = SuppliesPage.filterSupplies();
  assert.ok(moq5.every(i => i.moq <= 5));

  // MOQ 10+ / 5+
  SuppliesPage.selectedMOQ = '10+';
  const moq10 = SuppliesPage.filterSupplies();
  assert.ok(moq10.every(i => i.moq >= 5));
});

test('SuppliesPage - Stock Availability Filtering', () => {
  setupDOM();

  SuppliesPage.clearFilters();
  SuppliesPage.stockFilter = 'in_stock';
  const inStockItems = SuppliesPage.filterSupplies();
  assert.ok(inStockItems.every(i => i.in_stock && i.stock_count > 0));
});

test('SuppliesPage - Certifications Filtering', () => {
  setupDOM();

  SuppliesPage.clearFilters();
  SuppliesPage.selectedCertifications.add('SASO');
  const sasoItems = SuppliesPage.filterSupplies();
  assert.ok(sasoItems.length > 0);
  assert.ok(sasoItems.every(i => (i.certifications || []).some(c => c.toLowerCase().includes('saso'))));

  SuppliesPage.clearFilters();
  SuppliesPage.selectedCertifications.add('Organic');
  const organicItems = SuppliesPage.filterSupplies();
  assert.ok(organicItems.length > 0);
  assert.ok(organicItems.every(i => (i.certifications || []).some(c => c.toLowerCase().includes('organic'))));
});

test('SuppliesPage - Keyword Search Filtering with Normalization', () => {
  setupDOM();

  SuppliesPage.clearFilters();

  // Arabic search with diacritics / alef
  SuppliesPage.searchQuery = 'عجانة';
  const r1 = SuppliesPage.filterSupplies();
  assert.equal(r1.length, 1);
  assert.equal(r1[0].id, 'supply-1');

  // English search
  SuppliesPage.searchQuery = 'Damascus';
  const r2 = SuppliesPage.filterSupplies();
  assert.equal(r2.length, 1);
  assert.equal(r2[0].id, 'supply-3');

  // Supplier search
  SuppliesPage.searchQuery = 'الفنار';
  const r3 = SuppliesPage.filterSupplies();
  assert.ok(r3.length >= 2);
  assert.ok(r3.every(i => i.supplier.name_ar.includes('الفنار')));
});

test('SuppliesPage - Sorting Algorithms', () => {
  setupDOM();

  const items = MOCK_DATA.supplies;

  // Price Ascending
  SuppliesPage.sortBy = 'price_asc';
  const asc = SuppliesPage.sortSupplies(items);
  assert.equal(asc[0].price, 520); // eco-packaging
  for (let i = 1; i < asc.length; i++) {
    assert.ok(asc[i].price >= asc[i - 1].price);
  }

  // Price Descending
  SuppliesPage.sortBy = 'price_desc';
  const desc = SuppliesPage.sortSupplies(items);
  assert.equal(desc[0].price, 14500); // spiral mixer
  for (let i = 1; i < desc.length; i++) {
    assert.ok(desc[i].price <= desc[i - 1].price);
  }

  // Lowest MOQ
  SuppliesPage.sortBy = 'moq_asc';
  const moqAsc = SuppliesPage.sortSupplies(items);
  assert.equal(moqAsc[0].moq, 1);

  // Highest Rating
  SuppliesPage.sortBy = 'rating';
  const ratingSort = SuppliesPage.sortSupplies(items);
  assert.equal(ratingSort[0].supplier.rating, 4.98); // Al-Jouf Olive Mills
});

test('SuppliesPage - Technical Specs Modal Inspection', () => {
  const { documentMock } = setupDOM();
  I18n.setLang('ar');

  const modal = documentMock.createElement('div');
  modal.id = 'specs-modal';

  const title = documentMock.createElement('h3');
  title.id = 'specs-modal-title';
  modal.appendChild(title);

  const desc = documentMock.createElement('p');
  desc.id = 'specs-modal-description';
  modal.appendChild(desc);

  const price = documentMock.createElement('strong');
  price.id = 'specs-modal-price';
  modal.appendChild(price);

  const moq = documentMock.createElement('strong');
  moq.id = 'specs-modal-moq';
  modal.appendChild(moq);

  const supplierName = documentMock.createElement('h4');
  supplierName.id = 'specs-modal-supplier-name';
  modal.appendChild(supplierName);

  const table = documentMock.createElement('tbody');
  table.id = 'specs-modal-table';
  modal.appendChild(table);

  const certs = documentMock.createElement('div');
  certs.id = 'specs-modal-certs';
  modal.appendChild(certs);

  const leadTime = documentMock.createElement('p');
  leadTime.id = 'specs-modal-lead-time';
  modal.appendChild(leadTime);

  const warranty = documentMock.createElement('p');
  warranty.id = 'specs-modal-warranty';
  modal.appendChild(warranty);

  const rfqBtn = documentMock.createElement('button');
  rfqBtn.setAttribute('data-action', 'modal-open-rfq');
  modal.appendChild(rfqBtn);

  documentMock.body.appendChild(modal);

  // Open specs modal for supply-1
  SuppliesPage.openSpecsModal('supply-1');

  assert.ok(title.textContent.includes('عجانة'));
  assert.ok(price.textContent.includes('14,500'));
  assert.ok(supplierName.textContent.includes('الفنار'));
  assert.ok(table.innerHTML.includes('AISI 304') || table.innerHTML.includes('50 لتر'));
  assert.ok(certs.innerHTML.includes('CE Certified') || certs.innerHTML.includes('SASO'));
  assert.equal(rfqBtn.getAttribute('data-supply-id'), 'supply-1');
});

test('SuppliesPage - Strict HTML & Solid Surfaces Design Validation', () => {
  const htmlPath = path.resolve(process.cwd(), 'supplies.html');
  assert.ok(fs.existsSync(htmlPath), 'supplies.html must exist');

  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1. Anti-FOUC script
  assert.ok(html.includes('meyar_theme'), 'Anti-FOUC early theme check must exist');
  assert.ok(html.includes('meyar_lang'), 'Anti-FOUC early lang check must exist');

  // 2. Strict 100% Solid Surfaces - No glassmorphism
  assert.ok(!html.includes('backdrop-blur'), 'Forbidden: backdrop-blur must not be used');
  assert.ok(!html.includes('bg-opacity-'), 'Forbidden: bg-opacity must not be used for glass effects');

  // 3. Strict CSS Logical Properties - No physical margin/padding/alignment
  assert.ok(!html.includes('ml-'), 'Forbidden: physical ml-* must be replaced with ms-*');
  assert.ok(!html.includes('mr-'), 'Forbidden: physical mr-* must be replaced with me-*');
  assert.ok(!html.includes('pl-'), 'Forbidden: physical pl-* must be replaced with ps-*');
  assert.ok(!html.includes('pr-'), 'Forbidden: physical pr-* must be replaced with pe-*');
  assert.ok(!html.includes('left-'), 'Forbidden: physical left-* must be replaced with start-*');
  assert.ok(!html.includes('right-'), 'Forbidden: physical right-* must be replaced with end-*');
  assert.ok(!html.includes('text-left'), 'Forbidden: text-left must be text-start');
  assert.ok(!html.includes('text-right'), 'Forbidden: text-right must be text-end');
  assert.ok(!html.includes('border-l'), 'Forbidden: border-l must be border-s');
  assert.ok(!html.includes('border-r'), 'Forbidden: border-r must be border-e');

  // 4. Modals and Drawers Accessibility
  assert.ok(html.includes('id="rfq-drawer"'), 'RFQ drawer modal must exist');
  assert.ok(html.includes('id="specs-modal"'), 'Technical specs modal must exist');
  assert.ok(html.includes('id="rfq-history-modal"'), 'RFQ history modal must exist');
  assert.ok(html.includes('role="dialog"'), 'Dialog role must be present on modals');
  assert.ok(html.includes('aria-modal="true"'), 'aria-modal must be true on modals');

  // 5. Script Tags
  assert.ok(html.includes('src="./js/app.js"'), 'app.js module must be linked');
  assert.ok(html.includes('src="./js/modules/rfq.js"'), 'rfq.js module must be linked');
  assert.ok(html.includes('src="./js/pages/supplies.js"'), 'supplies.js module must be linked');
});
