import test from 'node:test';
import assert from 'node:assert/strict';
import { RecipeScaler } from '../js/modules/scaler.js';
import { I18n } from '../js/core/i18n.js';

// Setup Mock DOM environment for scaler tests
function setupDOM() {
  const listeners = new Map();
  const elements = new Map();

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

  class Element {
    constructor(tagName = 'div', id = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this.classList = new ClassList();
      this.attributes = new Map();
      this.children = [];
      this.parentElement = null;
      this._innerHTML = '';
      this._textContent = '';
      this.value = '';
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

    set innerHTML(val) {
      this._innerHTML = val;
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set textContent(val) {
      this._textContent = String(val);
    }

    get textContent() {
      return this._textContent;
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
      if (elMap && elMap.has(evt.type)) {
        elMap.get(evt.type).forEach(cb => cb(evt));
      }
    }
  }

  const documentMock = {
    getElementById: (id) => {
      if (!elements.has(id)) {
        const el = new Element('div', id);
        elements.set(id, el);
      }
      return elements.get(id);
    },
    querySelectorAll: (selector) => {
      const results = [];
      if (selector.includes('#scaler-serving-count')) {
        results.push(documentMock.getElementById('scaler-serving-count'));
      }
      if (selector.includes('#scaler-base-count')) {
        results.push(documentMock.getElementById('scaler-base-count'));
      }
      if (selector.includes('#scaler-btn-minus')) {
        results.push(documentMock.getElementById('scaler-btn-minus'));
      }
      if (selector.includes('#scaler-btn-plus')) {
        results.push(documentMock.getElementById('scaler-btn-plus'));
      }
      return results;
    },
    documentElement: {
      setAttribute: () => {},
      getAttribute: () => 'ar',
      classList: new ClassList()
    }
  };

  const localStorageMock = {
    _data: new Map(),
    getItem(key) {
      return this._data.has(key) ? this._data.get(key) : null;
    },
    setItem(key, val) {
      this._data.set(key, String(val));
    },
    removeItem(key) {
      this._data.delete(key);
    },
    clear() {
      this._data.clear();
    }
  };

  globalThis.document = documentMock;
  globalThis.localStorage = localStorageMock;
  globalThis.window = {
    matchMedia: () => ({ matches: false }),
    dispatchEvent: () => {}
  };

  return { documentMock, elements };
}

test('RecipeScaler - Mathematical Precision & Fraction Formatting', (t) => {
  setupDOM();
  const scaler = new RecipeScaler({ baseServings: 4 });

  // Integer values
  assert.equal(scaler.formatQuantity(1), '1');
  assert.equal(scaler.formatQuantity(4), '4');
  assert.equal(scaler.formatQuantity(800), '800');
  assert.equal(scaler.formatQuantity(0), '0');

  // Exact Fractions
  assert.equal(scaler.formatQuantity(0.25), '¼');
  assert.equal(scaler.formatQuantity(0.33), '⅓');
  assert.equal(scaler.formatQuantity(0.5), '½');
  assert.equal(scaler.formatQuantity(0.66), '⅔');
  assert.equal(scaler.formatQuantity(0.75), '¾');
  assert.equal(scaler.formatQuantity(0.125), '⅛');

  // Mixed numbers
  assert.equal(scaler.formatQuantity(1.5), '1 ½');
  assert.equal(scaler.formatQuantity(2.25), '2 ¼');
  assert.equal(scaler.formatQuantity(3.75), '3 ¾');
  assert.equal(scaler.formatQuantity(4.33), '4 ⅓');
  assert.equal(scaler.formatQuantity(2.67), '2 ⅔');

  // Decimals outside fraction mappings
  assert.equal(scaler.formatQuantity(1.2), '1.2');
  assert.equal(scaler.formatQuantity(5.4), '5.4');

  // Invalid or null inputs
  assert.equal(scaler.formatQuantity(null), '');
  assert.equal(scaler.formatQuantity(undefined), '');
  assert.equal(scaler.formatQuantity(NaN), '');
});

test('RecipeScaler - Increment, Decrement, and Scale Calculations', (t) => {
  setupDOM();
  let changeCount = 0;
  let lastServings = null;

  const mockIngredients = [
    { id: 'i1', name_ar: 'لحم واغيو', name_en: 'Wagyu Beef', baseAmount: 800, unit_ar: 'جرام', unit_en: 'g' },
    { id: 'i2', name_ar: 'ملح مدخن', name_en: 'Smoked Salt', baseAmount: 2, unit_ar: 'ملعقة صغيرة', unit_en: 'tsp' },
    { id: 'i3', name_ar: 'دبس تمر', name_en: 'Date Molasses', baseAmount: 0.5, unit_ar: 'كوب', unit_en: 'cup' }
  ];

  const scaler = new RecipeScaler({
    containerId: 'test-ingredients',
    baseServings: 4,
    ingredients: mockIngredients,
    onChange: (servings) => {
      changeCount++;
      lastServings = servings;
    }
  });

  assert.equal(scaler.currentServings, 4);
  assert.equal(scaler.baseServings, 4);

  // Increment to 5 servings
  scaler.increment();
  assert.equal(scaler.currentServings, 5);
  assert.equal(lastServings, 5);
  assert.equal(changeCount, 1);

  // Scale to 2 servings (half)
  scaler.scale(2);
  assert.equal(scaler.currentServings, 2);
  assert.equal(lastServings, 2);

  const halfScaled = scaler.getScaledIngredients();
  assert.equal(halfScaled[0].scaledAmount, 400); // 800 * 2/4 = 400
  assert.equal(halfScaled[0].formattedAmount, '400');
  assert.equal(halfScaled[1].scaledAmount, 1);   // 2 * 2/4 = 1
  assert.equal(halfScaled[1].formattedAmount, '1');
  assert.equal(halfScaled[2].scaledAmount, 0.25); // 0.5 * 2/4 = 0.25
  assert.equal(halfScaled[2].formattedAmount, '¼');

  // Decrement to 1 serving
  scaler.decrement();
  assert.equal(scaler.currentServings, 1);

  // Boundary check: cannot decrement below 1
  scaler.decrement();
  assert.equal(scaler.currentServings, 1);

  // Reset back to base servings
  scaler.reset();
  assert.equal(scaler.currentServings, 4);

  // Max boundary check
  scaler.scale(50);
  assert.equal(scaler.currentServings, 48);
  scaler.increment();
  assert.equal(scaler.currentServings, 48);
});

test('RecipeScaler - Bilingual Names and Unit Localization', (t) => {
  setupDOM();
  const mockIngredients = [
    {
      id: 'i1',
      name_ar: 'زعفران ملكي',
      name_en: 'Royal Saffron',
      baseAmount: 1,
      unit_ar: 'جرام',
      unit_en: 'g',
      notes_ar: 'منقوع في ماء ورد',
      notes_en: 'Steeped in rosewater'
    }
  ];

  const scaler = new RecipeScaler({
    containerId: 'test-ingredients',
    baseServings: 2,
    ingredients: mockIngredients
  });

  // Arabic mode
  I18n.setLang('ar');
  let scaled = scaler.getScaledIngredients();
  assert.equal(scaled[0].name, 'زعفران ملكي');
  assert.equal(scaled[0].unit, 'جرام');
  assert.equal(scaled[0].notes, 'منقوع في ماء ورد');

  // English mode
  I18n.setLang('en');
  scaled = scaler.getScaledIngredients();
  assert.equal(scaled[0].name, 'Royal Saffron');
  assert.equal(scaled[0].unit, 'g');
  assert.equal(scaled[0].notes, 'Steeped in rosewater');
});

test('RecipeScaler - DOM Rendering and HTML Generation', (t) => {
  const { documentMock } = setupDOM();
  I18n.setLang('ar');

  const mockIngredients = [
    { id: 'i1', name_ar: 'لحم واغيو', name_en: 'Wagyu Beef', baseAmount: 800, unit_ar: 'جرام', unit_en: 'g' }
  ];

  const scaler = new RecipeScaler({
    containerId: 'test-ingredients',
    baseServings: 4,
    ingredients: mockIngredients
  });

  const html = scaler.render();
  assert.ok(html.includes('لحم واغيو'));
  assert.ok(html.includes('800'));
  assert.ok(html.includes('جرام'));
  assert.ok(html.includes('data-ingredient-checkbox'));

  // Verify container innerHTML was updated
  const container = documentMock.getElementById('test-ingredients');
  assert.equal(container.innerHTML, html);
});
