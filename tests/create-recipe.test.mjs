import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { CreateRecipeStudio } from '../js/pages/create-recipe.js';

// Setup Mock DOM environment for testing CreateRecipeStudio
function setupDOM() {
  const listeners = new Map();
  const storage = new Map();

  class ClassList {
    constructor() {
      this._classes = new Set();
    }
    add(...cls) {
      cls.forEach(c => {
        if (c) c.split(/\s+/).filter(Boolean).forEach(x => this._classes.add(x));
      });
    }
    remove(...cls) {
      cls.forEach(c => {
        if (c) c.split(/\s+/).filter(Boolean).forEach(x => this._classes.delete(x));
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
      this._value = undefined;
      this.checked = false;
      this.src = '';
      this.style = {};
      this.type = '';
    }

    get value() {
      if (this._value !== undefined) return this._value;
      if (this.tagName === 'TEXTAREA') return this._textContent || '';
      return '';
    }

    set value(val) {
      this._value = String(val);
      if (this.tagName === 'TEXTAREA') {
        this._textContent = String(val);
      }
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
      if (!child) return null;
      if (child.parentElement) {
        child.parentElement.removeChild(child);
      }
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

    insertBefore(newNode, referenceNode) {
      if (!newNode) return null;
      if (newNode.parentElement) {
        newNode.parentElement.removeChild(newNode);
      }
      newNode.parentElement = this;
      const refIdx = this.children.indexOf(referenceNode);
      if (refIdx === -1) {
        this.children.push(newNode);
      } else {
        this.children.splice(refIdx, 0, newNode);
      }
      return newNode;
    }

    get previousElementSibling() {
      if (!this.parentElement) return null;
      const sibs = this.parentElement.children;
      const idx = sibs.indexOf(this);
      return idx > 0 ? sibs[idx - 1] : null;
    }

    get nextElementSibling() {
      if (!this.parentElement) return null;
      const sibs = this.parentElement.children;
      const idx = sibs.indexOf(this);
      return idx !== -1 && idx < sibs.length - 1 ? sibs[idx + 1] : null;
    }

    addEventListener(event, callback) {
      if (!listeners.has(this)) {
        listeners.set(this, new Map());
      }
      const elListeners = listeners.get(this);
      if (!elListeners.has(event)) {
        elListeners.set(event, []);
      }
      elListeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
      if (listeners.has(this)) {
        const elListeners = listeners.get(this);
        if (elListeners.has(event)) {
          const arr = elListeners.get(event);
          const idx = arr.indexOf(callback);
          if (idx !== -1) arr.splice(idx, 1);
        }
      }
    }

    dispatchEvent(evt) {
      if (listeners.has(this)) {
        const elListeners = listeners.get(this);
        const eventType = typeof evt === 'string' ? evt : evt.type;
        if (elListeners.has(eventType)) {
          elListeners.get(eventType).forEach(cb => cb(evt));
        }
      }
    }

    click() {
      this.dispatchEvent({ type: 'click', target: this, stopPropagation: () => {}, preventDefault: () => {} });
    }

    reset() {
      this.querySelectorAll('input, textarea, select').forEach(input => {
        if (input.type === 'checkbox') {
          input.checked = false;
        } else {
          input.value = '';
        }
      });
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];

      if (!html || html.trim() === '') return;

      const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9-]+)([^>]*)\/?>/g;
      let match;

      while ((match = tagRegex.exec(html)) !== null) {
        const tagName = match[1] || match[4];
        const rawAttrs = match[2] || match[5] || '';
        const content = match[3] || '';

        const child = new Element(tagName);

        const idMatch = rawAttrs.match(/id=["']([^"']+)["']/);
        if (idMatch) child.id = idMatch[1];

        const classMatch = rawAttrs.match(/class=["']([^"']+)["']/);
        if (classMatch) child.className = classMatch[1];

        const attrRegex = /([a-zA-Z0-9-_:]+)(?:=["']([^"']*)["'])?/g;
        let aMatch;
        while ((aMatch = attrRegex.exec(rawAttrs)) !== null) {
          const key = aMatch[1];
          const val = aMatch[2] !== undefined ? aMatch[2] : '';
          if (key !== 'id' && key !== 'class') {
            child.setAttribute(key, val);
          }
        }

        const valMatch = rawAttrs.match(/value=["']([^"']*)["']/);
        if (valMatch) child.value = valMatch[1];

        if (rawAttrs.includes('checked')) {
          child.checked = true;
        }

        const srcMatch = rawAttrs.match(/src=["']([^"']*)["']/);
        if (srcMatch) child.src = srcMatch[1];

        if (content) {
          child._textContent = content.replace(/<[^>]+>/g, '').trim();
          child.innerHTML = content;
        }

        this.appendChild(child);
      }
    }

    get textContent() {
      if (this.children.length > 0) {
        return this.children.map(c => c.textContent).join(' ').trim();
      }
      return this._textContent || this.value || '';
    }

    set textContent(val) {
      this.children = [];
      this._textContent = String(val);
    }

    querySelector(selector) {
      const results = this.querySelectorAll(selector);
      return results.length > 0 ? results[0] : null;
    }

    querySelectorAll(selector) {
      const results = [];

      const matchElement = (el) => {
        if (!el || !el.tagName) return false;

        if (selector === '*') return true;

        if (selector.startsWith('#')) {
          const id = selector.slice(1);
          return el.id === id;
        }

        if (selector.startsWith('.')) {
          const cls = selector.slice(1);
          return el.classList.contains(cls);
        }

        if (selector.startsWith('[') && selector.endsWith(']')) {
          const attrContent = selector.slice(1, -1);
          if (attrContent.includes('=')) {
            const [key, rawVal] = attrContent.split('=');
            const cleanVal = rawVal ? rawVal.replace(/["']/g, '') : '';
            return el.getAttribute(key.trim()) === cleanVal;
          } else {
            return el.hasAttribute(attrContent);
          }
        }

        if (selector.toLowerCase() === el.tagName.toLowerCase()) {
          return true;
        }

        return false;
      };

      const traverse = (node) => {
        for (const child of node.children) {
          if (matchElement(child)) {
            results.push(child);
          }
          traverse(child);
        }
      };

      traverse(this);
      return results;
    }
  }

  const documentMock = {
    body: new Element('body'),
    documentElement: new Element('html'),
    createElement: (tag) => new Element(tag),
    getElementById: (id) => {
      if (documentMock.body.id === id) return documentMock.body;
      return documentMock.body.querySelector(`#${id}`);
    },
    querySelector: (sel) => {
      if (sel === 'body') return documentMock.body;
      if (sel === 'html') return documentMock.documentElement;
      return documentMock.body.querySelector(sel);
    },
    querySelectorAll: (sel) => {
      return documentMock.body.querySelectorAll(sel);
    },
    addEventListener: (event, callback) => {
      documentMock.body.addEventListener(event, callback);
    }
  };

  docMockRef = documentMock;

  const windowMock = {
    addEventListener: (event, callback) => {
      if (!listeners.has('window')) {
        listeners.set('window', new Map());
      }
      const winListeners = listeners.get('window');
      if (!winListeners.has(event)) {
        winListeners.set(event, []);
      }
      winListeners.get(event).push(callback);
    },
    dispatchEvent: (evt) => {
      const eventType = typeof evt === 'string' ? evt : evt.type;
      if (listeners.has('window')) {
        const winListeners = listeners.get('window');
        if (winListeners.has(eventType)) {
          winListeners.get(eventType).forEach(cb => cb(evt));
        }
      }
    },
    scrollTo: () => {},
    location: { href: '' }
  };

  const localStorageMock = {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  globalThis.document = documentMock;
  globalThis.window = windowMock;
  globalThis.localStorage = localStorageMock;
  globalThis.requestAnimationFrame = (cb) => cb();

  // Construct standard DOM structure for create-recipe.html
  const container = documentMock.createElement('div');
  container.innerHTML = `
    <div id="draft-status-indicator"></div>
    <div id="autosave-timestamp"></div>

    <button type="button" class="wizard-step-btn active" data-step="1">
      <div class="step-badge">1</div>
    </button>
    <button type="button" class="wizard-step-btn" data-step="2">
      <div class="step-badge">2</div>
    </button>
    <button type="button" class="wizard-step-btn" data-step="3">
      <div class="step-badge">3</div>
    </button>
    <button type="button" class="wizard-step-btn" data-step="4">
      <div class="step-badge">4</div>
    </button>

    <div id="form-validation-summary" class="hidden">
      <ul id="validation-errors-list"></ul>
    </div>

    <form id="create-recipe-form">
      <!-- Step 1 Panel -->
      <section id="step-1-panel" class="wizard-panel" data-panel="1">
        <input type="text" id="recipe-title-ar" value="ستيك واغيو فاخر">
        <input type="text" id="recipe-title-en" value="Luxury Wagyu Steak">
        <textarea id="recipe-desc-ar">وصفة ستيك لحم الواغيو الفاخر مع غليز التمر</textarea>
        <textarea id="recipe-desc-en">Luxury Wagyu Steak with Date Glaze</textarea>
        <select id="recipe-cuisine">
          <option value="Saudi" selected>سعودي معاصر</option>
        </select>
        <select id="recipe-category">
          <option value="Main Course" selected>أطباق رئيسية</option>
        </select>
        <select id="recipe-difficulty">
          <option value="Medium" selected>متوسط</option>
        </select>
        <button type="button" id="dec-servings-btn">-</button>
        <input type="number" id="recipe-servings" value="4">
        <button type="button" id="inc-servings-btn">+</button>
        <input type="number" id="recipe-prep-time" value="25">
        <input type="number" id="recipe-cook-time" value="35">
        <input type="number" id="recipe-calories" value="520">
        <div id="recipe-tags-container">
          <input type="checkbox" value="Halal" checked>
          <input type="checkbox" value="FineDining" checked>
        </div>
      </section>

      <!-- Step 2 Panel -->
      <section id="step-2-panel" class="wizard-panel hidden" data-panel="2">
        <div id="cover-dropzone"></div>
        <input type="file" id="cover-image-file-input">
        <button type="button" id="browse-cover-btn"></button>
        <input type="url" id="cover-image-url-input" value="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80">
        <button type="button" id="apply-cover-url-btn"></button>
        <div id="cover-preview-card" class="hidden">
          <img id="cover-preview-img" src="">
          <span id="cover-filename-label"></span>
          <button type="button" id="remove-cover-btn"></button>
        </div>
        <button type="button" id="add-gallery-photo-btn"></button>
        <div id="gallery-grid"></div>
        <input type="url" id="recipe-video-url" value="">
        <input type="text" id="recipe-plating-notes" value="">
      </section>

      <!-- Step 3 Panel -->
      <section id="step-3-panel" class="wizard-panel hidden" data-panel="3">
        <button type="button" id="load-sample-ingredients-btn"></button>
        <div id="ingredients-list"></div>
        <button type="button" id="add-ingredient-btn"></button>
      </section>

      <!-- Step 4 Panel -->
      <section id="step-4-panel" class="wizard-panel hidden" data-panel="4">
        <button type="button" id="load-sample-steps-btn"></button>
        <div id="instructions-list"></div>
        <button type="button" id="add-step-btn"></button>
      </section>
    </form>

    <button type="button" id="save-draft-btn"></button>
    <button type="button" id="prev-step-btn" class="hidden"></button>
    <button type="button" id="next-step-btn"></button>
    <button type="button" id="publish-recipe-btn" class="hidden"></button>
    <span id="step-indicator-text"></span>

    <button type="button" id="load-sample-recipe-btn"></button>
    <button type="button" id="clear-recipe-form-btn"></button>
  `;

  documentMock.body.appendChild(container);
  return { documentMock, windowMock, localStorageMock };
}

test('CreateRecipeStudio - Wizard Step Navigation & State Controls', () => {
  setupDOM();
  CreateRecipeStudio.init();

  assert.equal(CreateRecipeStudio.currentStep, 1, 'Initial wizard step should be 1');
  
  const step1Panel = document.getElementById('step-1-panel');
  const step2Panel = document.getElementById('step-2-panel');
  assert.equal(step1Panel.classList.contains('hidden'), false, 'Step 1 panel should be visible');
  assert.equal(step2Panel.classList.contains('hidden'), true, 'Step 2 panel should be hidden');

  // Go to step 2
  CreateRecipeStudio.goToStep(2);
  assert.equal(CreateRecipeStudio.currentStep, 2);
  assert.equal(step1Panel.classList.contains('hidden'), true);
  assert.equal(step2Panel.classList.contains('hidden'), false);

  const prevBtn = document.getElementById('prev-step-btn');
  assert.equal(prevBtn.classList.contains('hidden'), false, 'Previous button should be visible on step 2');

  // Advance to step 4
  CreateRecipeStudio.goToStep(4);
  assert.equal(CreateRecipeStudio.currentStep, 4);

  const nextBtn = document.getElementById('next-step-btn');
  const publishBtn = document.getElementById('publish-recipe-btn');
  assert.equal(nextBtn.classList.contains('hidden'), true, 'Next button should be hidden on final step');
  assert.equal(publishBtn.classList.contains('hidden'), false, 'Publish button should be visible on final step');

  // Previous step navigation
  CreateRecipeStudio.prevStep();
  assert.equal(CreateRecipeStudio.currentStep, 3);
});

test('CreateRecipeStudio - Dynamic Ingredients List Builder (Add, Remove, Extract, Set)', () => {
  setupDOM();
  CreateRecipeStudio.init();

  const list = document.getElementById('ingredients-list');
  assert.ok(list, 'Ingredients list container must exist');

  // Test setIngredients
  CreateRecipeStudio.setIngredients([
    { name_ar: 'لحم واغيو A5', name_en: 'A5 Wagyu', baseAmount: 500, unit_en: 'g', unit_ar: 'جرام', section: 'Main', notes_ar: 'معتق' },
    { name_ar: 'ملح بحري مدخن', name_en: 'Smoked Sea Salt', baseAmount: 10, unit_en: 'g', unit_ar: 'جرام', section: 'Seasoning' }
  ]);

  let rows = list.querySelectorAll('.ingredient-row');
  assert.equal(rows.length, 2, 'Should have 2 ingredient rows');

  // Test adding an ingredient
  const newRow = CreateRecipeStudio.addIngredientRow({
    name_ar: 'دبس تمر خلاص',
    name_en: 'Date Molasses',
    baseAmount: 60,
    unit_en: 'ml',
    unit_ar: 'مل',
    section: 'Sauce'
  });

  rows = list.querySelectorAll('.ingredient-row');
  assert.equal(rows.length, 3, 'Should have 3 ingredient rows after adding');

  // Test getIngredients extraction
  const extracted = CreateRecipeStudio.getIngredients();
  assert.equal(extracted.length, 3);
  assert.equal(extracted[0].name_ar, 'لحم واغيو A5');
  assert.equal(extracted[0].baseAmount, 500);
  assert.equal(extracted[2].name_ar, 'دبس تمر خلاص');

  // Test removing an ingredient
  CreateRecipeStudio.removeIngredientRow(newRow);
  rows = list.querySelectorAll('.ingredient-row');
  assert.equal(rows.length, 2, 'Should have 2 rows after deletion');
});

test('CreateRecipeStudio - Dynamic Instruction Steps Builder (Add, Remove, Move, Reindex)', () => {
  setupDOM();
  CreateRecipeStudio.init();

  const list = document.getElementById('instructions-list');
  assert.ok(list, 'Instructions list container must exist');

  // Test setInstructions
  CreateRecipeStudio.setInstructions([
    { step_number: 1, title_ar: 'التحضير والتتبيل', instruction_ar: 'تتبيل اللحم وتركه بدرجة حرارة الغرفة', timer_minutes: 30 },
    { step_number: 2, title_ar: 'التحمير العالي', instruction_ar: 'طهي اللحم على مقلاة حديد زهر ساخنة', timer_minutes: 6 }
  ]);

  let cards = list.querySelectorAll('.instruction-step-card');
  assert.equal(cards.length, 2, 'Should have 2 step cards');

  // Test adding a step
  const newCard = CreateRecipeStudio.addInstructionStep({
    title_ar: 'الراحة والسكب',
    instruction_ar: 'إراحة اللحم لمدة 10 دقائق ثم تقطيعه',
    timer_minutes: 10
  });

  cards = list.querySelectorAll('.instruction-step-card');
  assert.equal(cards.length, 3, 'Should have 3 step cards after adding');

  // Test move step up
  CreateRecipeStudio.moveStepUp(newCard);
  cards = list.querySelectorAll('.instruction-step-card');
  assert.equal(cards[1], newCard, 'Card should have moved to second position');

  // Test getInstructions
  const extractedSteps = CreateRecipeStudio.getInstructions();
  assert.equal(extractedSteps.length, 3);
  assert.equal(extractedSteps[0].step_number, 1);
  assert.equal(extractedSteps[1].title_ar, 'الراحة والسكب');

  // Test removing a step
  CreateRecipeStudio.removeInstructionStep(newCard);
  cards = list.querySelectorAll('.instruction-step-card');
  assert.equal(cards.length, 2, 'Should have 2 step cards after removal');
});

test('CreateRecipeStudio - Media & Cover Photo Management', () => {
  setupDOM();
  CreateRecipeStudio.reset();
  CreateRecipeStudio.init();

  const coverUrl = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80';
  CreateRecipeStudio.handleCoverUpload(coverUrl);

  assert.equal(CreateRecipeStudio.coverImage, coverUrl);
  const previewImg = document.getElementById('cover-preview-img');
  const previewCard = document.getElementById('cover-preview-card');
  assert.equal(previewImg.src, coverUrl);
  assert.equal(previewCard.classList.contains('hidden'), false);

  // Test Gallery Photos
  const galleryUrl = 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80';
  CreateRecipeStudio.addGalleryImage(galleryUrl);
  assert.equal(CreateRecipeStudio.galleryImages.length, 1);
  assert.equal(CreateRecipeStudio.galleryImages[0], galleryUrl);

  CreateRecipeStudio.removeGalleryImage(0);
  assert.equal(CreateRecipeStudio.galleryImages.length, 0);

  // Test Remove Cover Image
  CreateRecipeStudio.removeCoverImage();
  assert.equal(CreateRecipeStudio.coverImage, '');
  assert.equal(previewCard.classList.contains('hidden'), true);
});

test('CreateRecipeStudio - Form Validation & Error Highlighting', () => {
  setupDOM();
  CreateRecipeStudio.reset();
  CreateRecipeStudio.init();

  // Test Step 1 Validation with empty fields
  const titleAr = document.getElementById('recipe-title-ar');
  const titleEn = document.getElementById('recipe-title-en');
  const origAr = titleAr.value;
  const origEn = titleEn.value;

  titleAr.value = '';
  titleEn.value = '';
  
  let val1 = CreateRecipeStudio.validateStep(1);
  assert.equal(val1.valid, false, 'Step 1 should be invalid without titles');
  assert.ok(val1.errors.length > 0);

  // Restore titles
  titleAr.value = origAr;
  titleEn.value = origEn;
  val1 = CreateRecipeStudio.validateStep(1);
  assert.equal(val1.valid, true, 'Step 1 should be valid now');

  // Test Step 2 Validation without cover
  CreateRecipeStudio.coverImage = '';
  const urlInput = document.getElementById('cover-image-url-input');
  urlInput.value = '';
  let val2 = CreateRecipeStudio.validateStep(2);
  assert.equal(val2.valid, false, 'Step 2 should be invalid without cover image');

  // Test Step 3 Validation without ingredients
  CreateRecipeStudio.setIngredients([]);
  let val3 = CreateRecipeStudio.validateStep(3);
  assert.equal(val3.valid, false, 'Step 3 should be invalid without ingredients');

  // Test Step 4 Validation without instructions
  CreateRecipeStudio.setInstructions([]);
  let val4 = CreateRecipeStudio.validateStep(4);
  assert.equal(val4.valid, false, 'Step 4 should be invalid without instructions');
});

test('CreateRecipeStudio - Draft State in Current Session', () => {
  setupDOM();
  CreateRecipeStudio.reset();
  CreateRecipeStudio.init();

  CreateRecipeStudio.handleCoverUpload('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80');
  CreateRecipeStudio.setIngredients([
    { name_ar: 'لحم واغيو', baseAmount: 400, unit_en: 'g', section: 'Main' }
  ]);
  CreateRecipeStudio.setInstructions([
    { step_number: 1, title_ar: 'الطهي', instruction_ar: 'طهي اللحم' }
  ]);

  // Save Draft
  const saved = CreateRecipeStudio.saveDraft(true);
  assert.equal(saved, true, 'Draft should save successfully');

  assert.ok(CreateRecipeStudio.currentDraft, 'Draft must exist in memory');
  assert.equal(CreateRecipeStudio.currentDraft.title_ar, 'ستيك واغيو فاخر');
  assert.equal(CreateRecipeStudio.currentDraft.ingredients.length, 1);
  assert.equal(CreateRecipeStudio.currentDraft.steps.length, 1);

  // Clear Form and reload from draft
  const savedDraft = JSON.parse(JSON.stringify(CreateRecipeStudio.currentDraft));
  CreateRecipeStudio.clearDraft();
  assert.equal(CreateRecipeStudio.currentDraft, null, 'Draft should be cleared');

  // Restore by saving again and loading
  CreateRecipeStudio.currentDraft = savedDraft;
  const loaded = CreateRecipeStudio.loadDraft();
  assert.equal(loaded, true, 'Draft should load successfully');
  assert.equal(CreateRecipeStudio.getIngredients().length, 1);
});

test('CreateRecipeStudio - Recipe Publishing Pipeline & Integrity', () => {
  setupDOM();
  CreateRecipeStudio.reset();
  CreateRecipeStudio.init();

  // Load sample recipe to ensure full validity
  CreateRecipeStudio.loadSampleData();

  const newRecipe = CreateRecipeStudio.publishRecipe();
  assert.ok(newRecipe, 'Published recipe must be created');
  assert.ok(newRecipe.id.startsWith('recipe-custom-'), 'Recipe ID should have custom prefix');
  assert.equal(newRecipe.author_id, 'chef-1');
  assert.equal(newRecipe.rating, 5.0);
  assert.ok(newRecipe.ingredients.length >= 3);
  assert.ok(newRecipe.steps.length >= 3);

  // Verify stored in custom recipes list
  assert.ok(Array.isArray(CreateRecipeStudio.customRecipes));
  assert.equal(CreateRecipeStudio.customRecipes[0].id, newRecipe.id);
});

test('CreateRecipeStudio - Language Switcher Event Reactivity', () => {
  setupDOM();
  CreateRecipeStudio.init();

  I18n.currentLang = 'en';
  window.dispatchEvent(new Event('meyar:lang-changed'));

  const stepIndicator = document.getElementById('step-indicator-text');
  assert.ok(stepIndicator.textContent.includes('Step 1 of 4'));

  I18n.currentLang = 'ar';
  window.dispatchEvent(new Event('meyar:lang-changed'));
  assert.ok(stepIndicator.textContent.includes('المرحلة 1 من 4'));
});

test('CreateRecipe HTML - Strict Design System, Anti-FOUC, and Layout Integrity', () => {
  const htmlPath = path.join(process.cwd(), 'create-recipe.html');
  assert.ok(fs.existsSync(htmlPath), 'create-recipe.html file must exist');

  const content = fs.readFileSync(htmlPath, 'utf-8');

  // 1. Anti-FOUC script
  assert.ok(content.includes('localStorage.getItem(\'meyar_theme\')'), 'Must contain early theme Anti-FOUC script');
  assert.ok(content.includes('localStorage.getItem(\'meyar_lang\')'), 'Must contain early language Anti-FOUC script');

  // 2. 100% Solid Surfaces Constraint (no backdrop-blur / no glassmorphism)
  assert.equal(content.includes('backdrop-blur'), false, 'Strictly zero backdrop-blur allowed');
  assert.equal(content.includes('bg-opacity-'), false, 'Strictly zero semi-transparent background hacks');
  assert.equal(content.includes('glass'), false, 'Strictly zero glassmorphism allowed');

  // 3. Strict CSS Logical Properties
  assert.ok(content.includes('start-'), 'Must use CSS logical start-* properties');
  assert.ok(content.includes('end-'), 'Must use CSS logical end-* properties');
  assert.ok(content.includes('text-start'), 'Must use CSS logical text-start');
  assert.ok(content.includes('ps-') || content.includes('pe-') || content.includes('ms-') || content.includes('me-'), 'Must use CSS logical padding/margin properties');

  // 4. Stepper and Form Structure
  assert.ok(content.includes('id="wizard-stepper-container"'), 'Must contain wizard stepper container');
  assert.ok(content.includes('id="ingredients-list"'), 'Must contain ingredients list container');
  assert.ok(content.includes('id="instructions-list"'), 'Must contain instructions list container');
  assert.ok(content.includes('id="sticky-actions-bar"'), 'Must contain sticky bottom action bar');
  assert.ok(content.includes('id="search-modal"'), 'Must contain global search modal');
});
