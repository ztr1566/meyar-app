import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { RecipePage } from '../js/pages/recipe-page.js';

// Setup Mock DOM environment for testing Recipe page
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
      this.style = {};
      this.src = '';
      this.alt = '';
      this.href = '';
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
        if (elMap && elMap.has(evt.type)) {
          elMap.get(evt.type).forEach(cb => cb(evt));
        }
        curr = curr.parentElement;
      }
      if (!stopped && docMockRef) {
        const docMap = listeners.get(docMockRef);
        if (docMap && docMap.has(evt.type)) {
          docMap.get(evt.type).forEach(cb => cb(evt));
        }
      }
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

      // Tag with attribute or bare attribute
      const tagAttrMatch = s.match(/^([a-zA-Z0-9]+)?\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]$/);
      if (tagAttrMatch) {
        const [_, tagName, attrName, attrVal] = tagAttrMatch;
        if (tagName && this.tagName.toLowerCase() !== tagName.toLowerCase()) {
          return false;
        }
        if (attrVal !== undefined) {
          return this.getAttribute(attrName) === attrVal;
        }
        return this.hasAttribute(attrName);
      }

      if (s.toLowerCase() === this.tagName.toLowerCase()) {
        return true;
      }
      return false;
    }

    matches(selector) {
      if (!selector) return false;
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

    set textContent(val) {
      this._textContent = String(val);
      this.children = [];
    }

    get textContent() {
      if (this.children.length > 0) {
        return this.children.map(c => c.textContent).join(' ');
      }
      return this._textContent;
    }

    set innerHTML(val) {
      this._innerHTML = String(val);
      this.children = [];
      this.parseMockHTML(String(val));
    }

    get innerHTML() {
      return this._innerHTML;
    }

    parseMockHTML(htmlStr) {
      const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9-]+)([^>]*)\/>/g;
      let match;
      while ((match = tagRegex.exec(htmlStr)) !== null) {
        const tagName = match[1] || match[4];
        const rawAttrs = match[2] || match[5] || '';
        const innerContent = match[3] || '';

        const el = new Element(tagName);
        const attrRegex = /([a-zA-Z0-9-_:]+)(?:=["']([^"']*)["'])?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
          const key = attrMatch[1];
          const val = attrMatch[2] !== undefined ? attrMatch[2] : '';
          if (key === 'id') el.id = val;
          else if (key === 'class') el.className = val;
          else el.setAttribute(key, val);
        }

        if (innerContent.trim()) {
          el.innerHTML = innerContent;
          if (el.children.length === 0) {
            el._textContent = innerContent.replace(/<[^>]*>/g, '').trim();
          }
        }

        this.appendChild(el);
      }
    }
  }

  const elementsById = new Map();

  function registerElement(id, tagName = 'div') {
    const el = new Element(tagName);
    el.id = id;
    elementsById.set(id, el);
    return el;
  }

  // Pre-create required Recipe page element IDs
  const requiredIds = [
    'recipe-breadcrumb-title',
    'recipe-badge-cuisine',
    'recipe-badge-category',
    'recipe-badge-difficulty',
    'recipe-rating',
    'recipe-reviews-count',
    'recipe-title',
    'recipe-description',
    'recipe-prep-time',
    'recipe-cook-time',
    'recipe-total-time',
    'recipe-calories',
    'recipe-chef-link',
    'recipe-chef-avatar',
    'recipe-chef-name',
    'recipe-chef-title',
    'recipe-chef-handle',
    'btn-follow-chef',
    'btn-start-cooking',
    'btn-save-recipe',
    'btn-like-recipe',
    'recipe-likes-count',
    'btn-share-recipe',
    'btn-print-recipe',
    'recipe-hero-card',
    'recipe-hero-image',
    'recipe-gallery-thumbnails',
    'card-ingredients',
    'scaler-serving-count',
    'scaler-base-count',
    'scaler-btn-minus',
    'scaler-btn-plus',
    'scaler-btn-reset',
    'recipe-ingredients-list',
    'btn-copy-ingredients',
    'btn-order-supplies',
    'card-pairings',
    'pairing-drink',
    'pairing-side',
    'pairing-notes',
    'card-nutrition',
    'nutr-calories',
    'nutr-protein',
    'nutr-carbs',
    'nutr-fats',
    'nutr-fiber',
    'nutr-sodium',
    'card-cooking-mode',
    'cooking-progress-text',
    'cooking-progress-bar',
    'btn-reset-cooking',
    'recipe-steps-container',
    'card-chef-notes',
    'recipe-chef-notes-body',
    'section-related-recipes',
    'related-recipes-container',
    'share-recipe-modal',
    'share-url-input',
    'btn-copy-share-url'
  ];

  requiredIds.forEach(id => registerElement(id));

  // Add inner sub-elements for specific buttons
  const saveBtn = elementsById.get('btn-save-recipe');
  const bookmarkIcon = new Element('svg');
  bookmarkIcon.className = 'bookmark-icon';
  const saveLabel = new Element('span');
  saveLabel.className = 'save-label';
  saveBtn.appendChild(bookmarkIcon);
  saveBtn.appendChild(saveLabel);

  const likeBtn = elementsById.get('btn-like-recipe');
  const heartIcon = new Element('svg');
  heartIcon.className = 'heart-icon';
  likeBtn.appendChild(heartIcon);

  const followBtn = elementsById.get('btn-follow-chef');
  const followText = new Element('span');
  followText.className = 'btn-text';
  followBtn.appendChild(followText);

  const documentMock = {
    title: '',
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: (selector) => {
      if (selector.startsWith('#')) return elementsById.get(selector.slice(1)) || null;
      if (selector === '[role="progressbar"]') {
        let p = elementsById.get('progressbar');
        if (!p) {
          p = registerElement('progressbar');
          p.setAttribute('role', 'progressbar');
        }
        return p;
      }
      return null;
    },
    querySelectorAll: (selector) => {
      const results = [];
      for (const el of elementsById.values()) {
        if (el.matches(selector)) results.push(el);
      }
      return results;
    },
    createElement: (tag) => new Element(tag),
    documentElement: new Element('html'),
    addEventListener: (event, cb) => {
      if (!listeners.has(documentMock)) listeners.set(documentMock, new Map());
      const elMap = listeners.get(documentMock);
      if (!elMap.has(event)) elMap.set(event, []);
      elMap.get(event).push(cb);
    },
    removeEventListener: () => {}
  };

  const bodyEl = new Element('body');
  documentMock.body = bodyEl;
  documentMock.documentElement.appendChild(bodyEl);

  docMockRef = documentMock;

  const windowMock = {
    location: {
      search: '',
      href: 'https://meyar.sa/recipe.html?id=recipe-1'
    },
    addEventListener: (event, cb) => {
      if (!listeners.has(windowMock)) listeners.set(windowMock, new Map());
      const elMap = listeners.get(windowMock);
      if (!elMap.has(event)) elMap.set(event, []);
      elMap.get(event).push(cb);
    },
    removeEventListener: () => {},
    dispatchEvent: (evt) => {
      const elMap = listeners.get(windowMock);
      if (elMap && elMap.has(evt.type)) {
        elMap.get(evt.type).forEach(cb => cb(evt));
      }
    },
    matchMedia: () => ({ matches: false }),
    print: () => {}
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

  globalThis.document = documentMock;
  globalThis.window = windowMock;
  globalThis.localStorage = localStorageMock;
  globalThis.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail || {};
    }
  };

  RecipePage.isInitialized = false;

  return { documentMock, elementsById, storage };
}

test('RecipePage - Load Recipe by ID, Query Param, and Fallback', (t) => {
  setupDOM();

  // 1. Explicit ID
  const r1 = RecipePage.loadRecipe('recipe-1');
  assert.equal(r1.id, 'recipe-1');
  assert.equal(r1.title_en, 'Wagyu Ribeye with Black Garlic Date Glaze');

  // 2. Query param ?id=recipe-2
  globalThis.window.location.search = '?id=recipe-2';
  const r2 = RecipePage.loadRecipe();
  assert.equal(r2.id, 'recipe-2');
  assert.equal(r2.title_en, 'Saffron Infused Sea Bass with Cardamom Emulsion');

  // 3. Fallback on invalid ID
  globalThis.window.location.search = '?id=non-existent-999';
  const fallback = RecipePage.loadRecipe();
  assert.equal(fallback.id, 'recipe-1');
});

test('RecipePage - Full Initialization & DOM Rendering', (t) => {
  const { elementsById } = setupDOM();
  I18n.setLang('ar');

  RecipePage.init('recipe-1');

  assert.equal(RecipePage.currentRecipe.id, 'recipe-1');
  assert.ok(RecipePage.scalerInstance);

  // Metadata verification
  const titleEl = elementsById.get('recipe-title');
  assert.equal(titleEl.textContent, 'ستيك واغيو ريب آي مع غليز التمر والثوم الأسود المعتق');

  const prepEl = elementsById.get('recipe-prep-time');
  assert.equal(prepEl.textContent, '35');

  const cookEl = elementsById.get('recipe-cook-time');
  assert.equal(cookEl.textContent, '45');

  const calEl = elementsById.get('recipe-calories');
  assert.equal(calEl.textContent, '680');

  // Chef Card verification
  const chefNameEl = elementsById.get('recipe-chef-name');
  assert.equal(chefNameEl.textContent, 'الشيف فيصل الهاشمي');

  // Nutrition Facts verification
  const protEl = elementsById.get('nutr-protein');
  assert.equal(protEl.textContent, '52g');

  // Scaler rendering verification
  const ingredientsList = elementsById.get('recipe-ingredients-list');
  assert.ok(ingredientsList.innerHTML.includes('لحم واغيو'));
  assert.ok(ingredientsList.innerHTML.includes('800'));

  // Steps rendering verification
  const stepsContainer = elementsById.get('recipe-steps-container');
  assert.ok(stepsContainer.innerHTML.includes('تحضير لحم الواغيو والتتبيل الأولي'));
  assert.ok(stepsContainer.innerHTML.includes('45:00')); // Step timer

  // Related recipes verification
  const relatedContainer = elementsById.get('related-recipes-container');
  assert.ok(relatedContainer.innerHTML.includes('قاروص البحر بالزعفران الملكي'));
});

test('RecipePage - Dynamic Serving Scaler Integration', (t) => {
  const { elementsById } = setupDOM();
  RecipePage.init('recipe-1');

  assert.equal(RecipePage.scalerInstance.currentServings, 4);

  // Increment servings from 4 to 5
  RecipePage.scalerInstance.increment();
  assert.equal(RecipePage.scalerInstance.currentServings, 5);

  const servingCountEl = elementsById.get('scaler-serving-count');
  assert.equal(servingCountEl.textContent, '5');

  // Scale down to 2 servings (half)
  RecipePage.scalerInstance.scale(2);
  assert.equal(RecipePage.scalerInstance.currentServings, 2);

  const ingredientsList = elementsById.get('recipe-ingredients-list');
  assert.ok(ingredientsList.innerHTML.includes('400')); // 800 * (2/4) = 400
  assert.ok(ingredientsList.innerHTML.includes('لحم واغيو'));

  // Reset back to base servings
  RecipePage.scalerInstance.reset();
  assert.equal(RecipePage.scalerInstance.currentServings, 4);
});

test('RecipePage - Interactive Cooking Steps Completion & Progress Tracker', (t) => {
  const { elementsById } = setupDOM();
  RecipePage.reset();
  RecipePage.init('recipe-1');

  const totalSteps = RecipePage.currentRecipe.steps.length; // 5 steps
  assert.equal(totalSteps, 5);

  // Initial progress is 0
  assert.equal(RecipePage.completedSteps.size, 0);

  // Toggle step 1 completion
  RecipePage.toggleStep(1);
  assert.equal(RecipePage.completedSteps.has(1), true);
  assert.equal(RecipePage.completedSteps.size, 1);

  // Verify in-memory session state
  const saved = RecipePage.getCompletedSteps('recipe-1');
  assert.deepEqual(saved, [1]);

  // Toggle step 2 completion
  RecipePage.toggleStep(2);
  assert.equal(RecipePage.completedSteps.size, 2);

  const progressText = elementsById.get('cooking-progress-text');
  assert.ok(progressText.textContent.includes('2 من 5'));
  assert.ok(progressText.textContent.includes('40%'));

  // Uncheck step 1
  RecipePage.toggleStep(1);
  assert.equal(RecipePage.completedSteps.has(1), false);
  assert.equal(RecipePage.completedSteps.size, 1);

  // Reset all cooking steps
  RecipePage.resetSteps();
  assert.equal(RecipePage.completedSteps.size, 0);
  assert.ok(progressText.textContent.includes('0 من 5'));
  assert.ok(progressText.textContent.includes('0%'));
});

test('RecipePage - Step Timer Format & State Controls', (t) => {
  setupDOM();
  RecipePage.reset();

  // Test seconds formatter
  assert.equal(RecipePage.formatTimerSeconds(2700), '45:00');
  assert.equal(RecipePage.formatTimerSeconds(600), '10:00');
  assert.equal(RecipePage.formatTimerSeconds(65), '01:05');
  assert.equal(RecipePage.formatTimerSeconds(9), '00:09');
  assert.equal(RecipePage.formatTimerSeconds(0), '00:00');

  RecipePage.init('recipe-1');

  // Start timer for step 1 (45 minutes)
  RecipePage.toggleStepTimer(1, 45);
  let timer = RecipePage.activeTimers.get(1);
  assert.ok(timer);
  assert.equal(timer.isRunning, true);
  assert.equal(timer.totalSeconds, 2700);

  // Pause timer
  RecipePage.toggleStepTimer(1, 45);
  timer = RecipePage.activeTimers.get(1);
  assert.equal(timer.isRunning, false);

  // Reset timer
  RecipePage.resetStepTimer(1, 45);
  timer = RecipePage.activeTimers.get(1);
  assert.equal(timer.remainingSeconds, 2700);
  assert.equal(timer.isRunning, false);
});

test('RecipePage - Bookmark, Like, and Chef Follow Session State', (t) => {
  const { elementsById } = setupDOM();
  RecipePage.reset();
  RecipePage.init('recipe-1');
  assert.equal(elementsById.get('btn-follow-chef').classList.contains('hidden'), true, 'self-follow button must be hidden');

  // 1. Bookmark / Save
  const saved1 = RecipePage.toggleSave('recipe-1');
  assert.equal(saved1, true);
  assert.deepEqual(RecipePage.getSavedRecipeIds(), ['recipe-1']);

  const saved2 = RecipePage.toggleSave('recipe-1');
  assert.equal(saved2, false);
  assert.deepEqual(RecipePage.getSavedRecipeIds(), []);

  // 2. Like
  const liked1 = RecipePage.toggleLike('recipe-1');
  assert.equal(liked1, true);
  assert.deepEqual(RecipePage.getLikedRecipeIds(), ['recipe-1']);

  const liked2 = RecipePage.toggleLike('recipe-1');
  assert.equal(liked2, false);
  assert.deepEqual(RecipePage.getLikedRecipeIds(), []);

  // 3. Self-follow is rejected, while another chef can be followed.
  const followedSelf = RecipePage.toggleFollowChef('chef-1');
  assert.equal(followedSelf, false);
  assert.deepEqual(RecipePage.getFollowingChefIds(), []);

  const followed1 = RecipePage.toggleFollowChef('chef-2');
  assert.equal(followed1, true);
  assert.deepEqual(RecipePage.getFollowingChefIds(), ['chef-2']);

  const followed2 = RecipePage.toggleFollowChef('chef-2');
  assert.equal(followed2, false);
  assert.deepEqual(RecipePage.getFollowingChefIds(), []);
});

test('RecipePage - Language Reactivity & Bilingual Re-rendering', (t) => {
  const { elementsById } = setupDOM();
  RecipePage.init('recipe-1');

  // Switch to English
  I18n.setLang('en');
  globalThis.window.dispatchEvent(new CustomEvent('meyar:lang-changed', { detail: { lang: 'en' } }));

  const titleEl = elementsById.get('recipe-title');
  assert.equal(titleEl.textContent, 'Wagyu Ribeye with Black Garlic Date Glaze');

  const cuisineEl = elementsById.get('recipe-badge-cuisine');
  assert.equal(cuisineEl.textContent, 'Contemporary Saudi');

  const categoryEl = elementsById.get('recipe-badge-category');
  assert.equal(categoryEl.textContent, 'Main Course');

  const diffEl = elementsById.get('recipe-badge-difficulty');
  assert.equal(diffEl.textContent, 'Hard');

  const chefTitleEl = elementsById.get('recipe-chef-title');
  assert.equal(chefTitleEl.textContent, 'Executive Culinary Director & Gastronomy Consultant');

  // Switch back to Arabic
  I18n.setLang('ar');
  globalThis.window.dispatchEvent(new CustomEvent('meyar:lang-changed', { detail: { lang: 'ar' } }));

  assert.equal(titleEl.textContent, 'ستيك واغيو ريب آي مع غليز التمر والثوم الأسود المعتق');
  assert.equal(cuisineEl.textContent, 'سعودي معاصر');
  assert.equal(categoryEl.textContent, 'أطباق رئيسية');
  assert.equal(diffEl.textContent, 'متقدم');
});

test('RecipePage - Strict Design & HTML Validation', (t) => {
  const htmlPath = path.join(process.cwd(), 'recipe.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // 1. Zero glassmorphism / Zero backdrop-blur
  assert.ok(!htmlContent.includes('backdrop-blur'), 'recipe.html must not use backdrop-blur glassmorphism');
  assert.ok(!htmlContent.includes('bg-white/'), 'recipe.html must not use semi-transparent background hacks');
  assert.ok(!htmlContent.includes('bg-black/20'), 'recipe.html must use solid surfaces');

  // 2. Anti-FOUC script present in <head>
  assert.ok(htmlContent.includes('meyar_theme'), 'recipe.html must have early anti-FOUC script');
  assert.ok(htmlContent.includes('meyar_lang'), 'recipe.html must have early anti-FOUC script');

  // 3. Essential components exist
  assert.ok(htmlContent.includes('id="recipe-ingredients-list"'), 'recipe.html must have ingredients list container');
  assert.ok(htmlContent.includes('id="recipe-steps-container"'), 'recipe.html must have steps container');
  assert.ok(htmlContent.includes('id="scaler-btn-minus"'), 'recipe.html must have decrement scaler button');
  assert.ok(htmlContent.includes('id="scaler-btn-plus"'), 'recipe.html must have increment scaler button');
  assert.ok(htmlContent.includes('id="card-pairings"'), 'recipe.html must have pairings card');
  assert.ok(htmlContent.includes('id="card-nutrition"'), 'recipe.html must have nutrition card');
  assert.ok(htmlContent.includes('id="related-recipes-container"'), 'recipe.html must have related recipes container');
  assert.ok(htmlContent.includes('id="share-recipe-modal"'), 'recipe.html must have share modal');
});
