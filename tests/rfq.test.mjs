import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { Modal } from '../js/core/modal.js';
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
      this.elements = {};
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
        const elMap = listeners.get(curr);
        if (elMap && elMap.has(evt.type)) {
          const cbs = elMap.get(evt.type);
          for (const cb of cbs) {
            cb(evt);
            if (stopped) break;
          }
        }
        curr = curr.parentElement || (curr === docMockRef ? null : docMockRef);
      }
      return true;
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

    matches(selector) {
      if (!selector) return false;
      if (selector.startsWith('#')) {
        return this.id === selector.slice(1);
      }
      if (selector.startsWith('.')) {
        return this.classList.contains(selector.slice(1));
      }
      if (selector.startsWith('[') && selector.endsWith(']')) {
        const inner = selector.slice(1, -1);
        if (inner.includes('=')) {
          const [attr, val] = inner.split('=');
          const cleanVal = val.replace(/['"]/g, '');
          return this.getAttribute(attr) === cleanVal;
        }
        return this.hasAttribute(inner);
      }
      return this.tagName.toLowerCase() === selector.toLowerCase();
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

test('RFQManager - Price Estimate & Financial Calculations', () => {
  setupDOM();
  I18n.setLang('ar');

  // 1 unit of 14,500 SAR
  const est1 = RFQManager.calculateEstimate(14500, 1);
  assert.equal(est1.unitPrice, 14500);
  assert.equal(est1.quantity, 1);
  assert.equal(est1.subtotal, 14500);
  assert.equal(est1.vat, 2175); // 15% VAT
  assert.equal(est1.total, 16675);
  assert.ok(est1.formattedTotal.includes('ر.س'));

  // 4 units of 1,850 SAR
  const est2 = RFQManager.calculateEstimate(1850, 4);
  assert.equal(est2.subtotal, 7400);
  assert.equal(est2.vat, 1110);
  assert.equal(est2.total, 8510);

  // Negative / invalid fallback
  const est3 = RFQManager.calculateEstimate(-500, 0);
  assert.equal(est3.unitPrice, 0);
  assert.equal(est3.quantity, 1);
});

test('RFQManager - Form Validation Logic', () => {
  setupDOM();
  I18n.setLang('ar');

  const supplyItem = MOCK_DATA.supplies[1]; // supply-2 (MOQ = 2)

  // 1. Invalid: quantity < MOQ
  const res1 = RFQManager.validateRFQ({
    quantity: 1,
    destination: 'الرياض - حي الملز',
    target_date: '2026-09-01'
  }, supplyItem);

  assert.equal(res1.isValid, false);
  assert.ok(res1.errors.quantity);

  // 2. Invalid: missing destination
  const res2 = RFQManager.validateRFQ({
    quantity: 2,
    destination: '',
    target_date: '2026-09-01'
  }, supplyItem);

  assert.equal(res2.isValid, false);
  assert.ok(res2.errors.destination);

  // 3. Invalid: missing target_date
  const res3 = RFQManager.validateRFQ({
    quantity: 2,
    destination: 'الدرعية',
    target_date: ''
  }, supplyItem);

  assert.equal(res3.isValid, false);
  assert.ok(res3.errors.target_date);

  // 4. Valid form data
  const res4 = RFQManager.validateRFQ({
    quantity: 5,
    destination: 'الرياض - الدرعية',
    target_date: '2026-09-15'
  }, supplyItem);

  assert.equal(res4.isValid, true);
  assert.equal(Object.keys(res4.errors).length, 0);
});

test('RFQManager - Save RFQ Session State & Event Dispatch', () => {
  setupDOM();
  I18n.setLang('ar');

  let eventFired = false;
  let eventDetail = null;

  window.addEventListener('meyar:rfq-submitted', (e) => {
    eventFired = true;
    eventDetail = e.detail;
  });

  const supplyItem = MOCK_DATA.supplies[0]; // supply-1 (Spiral Mixer)

  const saved = RFQManager.saveRFQ({
    supplyItem,
    quantity: 2,
    destination: 'الرياض - حي النرجس',
    target_date: '2026-09-10',
    notes: 'مطلوب توريد مع التركيب والتدريب الموقعي'
  });

  assert.ok(saved.rfq_id);
  assert.equal(saved.item_id, 'supply-1');
  assert.equal(saved.quantity, 2);
  assert.equal(saved.status, 'pending');
  assert.equal(saved.target_price, 29000); // 14500 * 2
  assert.equal(eventFired, true);
  assert.equal(eventDetail.rfq.item_id, 'supply-1');

  // Verify retrieved from session state
  const allRFQs = RFQManager.getRFQs();
  assert.ok(allRFQs.length > 0);
  assert.equal(allRFQs[0].rfq_id, saved.rfq_id);

  const single = RFQManager.getRFQById(saved.rfq_id);
  assert.equal(single.rfq_id, saved.rfq_id);
});

test('RFQManager - Status Updates & Event Broadcast', () => {
  setupDOM();
  I18n.setLang('ar');

  let statusUpdated = false;
  window.addEventListener('meyar:rfq-status-updated', (e) => {
    if (e.detail.rfqId === 'rfq-9801') {
      statusUpdated = true;
    }
  });

  const success = RFQManager.updateRFQStatus('rfq-9801', 'accepted');
  assert.equal(success, true);
  assert.equal(statusUpdated, true);

  const rfq = RFQManager.getRFQById('rfq-9801');
  assert.equal(rfq.status, 'accepted');
});

test('RFQManager - Drawer Lifecycle, Preloading & Live Estimate', () => {
  const { documentMock } = setupDOM();
  I18n.setLang('ar');

  // Create Mock Drawer in DOM
  const drawer = documentMock.createElement('div');
  drawer.id = 'rfq-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.className = 'hidden';

  const previewImg = documentMock.createElement('img');
  previewImg.setAttribute('data-rfq-item-img', '');
  drawer.appendChild(previewImg);

  const previewTitle = documentMock.createElement('h4');
  previewTitle.setAttribute('data-rfq-item-title', '');
  drawer.appendChild(previewTitle);

  const previewSupplier = documentMock.createElement('span');
  previewSupplier.setAttribute('data-rfq-supplier-name', '');
  drawer.appendChild(previewSupplier);

  const previewMoq = documentMock.createElement('span');
  previewMoq.setAttribute('data-rfq-item-moq', '');
  drawer.appendChild(previewMoq);

  const previewPrice = documentMock.createElement('p');
  previewPrice.setAttribute('data-rfq-item-price', '');
  drawer.appendChild(previewPrice);

  const form = documentMock.createElement('form');
  form.id = 'rfq-form';

  const idInput = documentMock.createElement('input');
  idInput.id = 'rfq-item-id';
  idInput.name = 'item_id';
  form.appendChild(idInput);

  const qtyInput = documentMock.createElement('input');
  qtyInput.id = 'rfq-quantity';
  qtyInput.name = 'quantity';
  form.appendChild(qtyInput);

  const destInput = documentMock.createElement('input');
  destInput.id = 'rfq-destination';
  destInput.name = 'destination';
  form.appendChild(destInput);

  const dateInput = documentMock.createElement('input');
  dateInput.id = 'rfq-target-date';
  dateInput.name = 'target_date';
  form.appendChild(dateInput);

  const estUnit = documentMock.createElement('span');
  estUnit.setAttribute('data-rfq-est-unit', '');
  drawer.appendChild(estUnit);

  const estQty = documentMock.createElement('span');
  estQty.setAttribute('data-rfq-est-qty', '');
  drawer.appendChild(estQty);

  const estSubtotal = documentMock.createElement('span');
  estSubtotal.setAttribute('data-rfq-est-subtotal', '');
  drawer.appendChild(estSubtotal);

  const estTotal = documentMock.createElement('span');
  estTotal.setAttribute('data-rfq-est-total', '');
  drawer.appendChild(estTotal);

  drawer.appendChild(form);
  documentMock.body.appendChild(drawer);

  // Open drawer for supply-1
  RFQManager.openDrawer('supply-1');

  assert.equal(RFQManager.activeItem.id, 'supply-1');
  assert.equal(idInput.value, 'supply-1');
  assert.equal(Number(qtyInput.value), 1);
  assert.ok(previewTitle.textContent.includes('عجانة'));
  assert.ok(estSubtotal.textContent.includes('14,500'));

  // Stepper increment
  RFQManager.changeQuantity(1);
  assert.equal(RFQManager.currentQuantity, 2);
  assert.equal(Number(qtyInput.value), 2);
  assert.ok(estSubtotal.textContent.includes('29,000'));

  // Stepper decrement
  RFQManager.changeQuantity(-1);
  assert.equal(RFQManager.currentQuantity, 1);
  assert.equal(Number(qtyInput.value), 1);

  // Close drawer
  RFQManager.closeDrawer();
  assert.equal(RFQManager.activeItem, null);
});

test('RFQManager - Form Submission Flow & Validation Rejection', () => {
  const { documentMock } = setupDOM();
  I18n.setLang('ar');

  const drawer = documentMock.createElement('div');
  drawer.id = 'rfq-drawer';
  drawer.className = 'hidden';

  const form = documentMock.createElement('form');
  form.id = 'rfq-form';

  const idInput = documentMock.createElement('input');
  idInput.name = 'item_id';
  idInput.value = 'supply-3'; // Knife (MOQ = 5)
  form.appendChild(idInput);

  const qtyInput = documentMock.createElement('input');
  qtyInput.name = 'quantity';
  qtyInput.value = '2'; // Less than MOQ 5
  form.appendChild(qtyInput);

  const destInput = documentMock.createElement('input');
  destInput.name = 'destination';
  destInput.value = '';
  form.appendChild(destInput);

  const dateInput = documentMock.createElement('input');
  dateInput.name = 'target_date';
  dateInput.value = '';
  form.appendChild(dateInput);

  const errQty = documentMock.createElement('p');
  errQty.setAttribute('data-error-for', 'quantity');
  form.appendChild(errQty);

  const errDest = documentMock.createElement('p');
  errDest.setAttribute('data-error-for', 'destination');
  form.appendChild(errDest);

  drawer.appendChild(form);
  documentMock.body.appendChild(drawer);

  RFQManager.activeItem = MOCK_DATA.supplies[2]; // supply-3

  // Submit with invalid fields
  const failed = RFQManager.submitRFQ(form);
  assert.equal(failed, false);

  // Fix fields
  qtyInput.value = '10';
  destInput.value = 'جدة - حي الشاطئ';
  dateInput.value = '2026-09-20';

  const success = RFQManager.submitRFQ(form);
  assert.ok(success);
  assert.equal(success.quantity, 10);
  assert.equal(success.destination, 'جدة - حي الشاطئ');
});

test('RFQManager - Render History List', () => {
  const { documentMock } = setupDOM();
  RFQManager.reset();
  I18n.setLang('ar');

  const container = documentMock.createElement('div');
  container.id = 'rfq-history-list';
  documentMock.body.appendChild(container);

  // Initial render
  RFQManager.renderHistory(container);
  assert.ok(container.innerHTML.length > 0);
  assert.ok(container.innerHTML.includes('#rfq-9801') || container.innerHTML.includes('rfq-'));

  // Empty storage
  RFQManager.rfqsStore = [];
  RFQManager.renderHistory(container);
  assert.ok(container.innerHTML.includes('supplies.rfq_history_empty') || container.innerHTML.includes('لا توجد طلبات'));
});
