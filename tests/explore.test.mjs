import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { ExplorePage } from '../js/pages/explore.js';

// Setup Mock DOM environment for testing Explore page
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
      return true;
    }

    focus() {
      this.focused = true;
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

    get innerHTML() {
      return this._innerHTML;
    }

    set innerHTML(htmlStr) {
      this._innerHTML = htmlStr;
      this.children = [];
      if (typeof htmlStr === 'string') {
        if (htmlStr.includes('<button')) {
          const btn = new Element('button');
          btn.setAttribute('type', 'button');
          btn.setAttribute('aria-label', 'Close');
          this.appendChild(btn);
        }
        if (htmlStr.includes('<h4')) {
          const h4 = new Element('h4');
          this.appendChild(h4);
        }
        if (htmlStr.includes('<p')) {
          const p = new Element('p');
          this.appendChild(p);
        }
      }
    }

    get textContent() {
      return this._textContent || '';
    }

    set textContent(val) {
      this._textContent = val;
    }
  }

  class DocumentMock extends Element {
    constructor() {
      super('document');
      this.documentElement = new Element('html');
      this.body = new Element('body');
      this.documentElement.appendChild(this.body);
      this.appendChild(this.documentElement);
    }

    getElementById(id) {
      let found = null;
      const traverse = (node) => {
        if (node.id === id) {
          found = node;
          return;
        }
        for (const child of node.children) {
          if (!found) traverse(child);
        }
      };
      traverse(this);
      return found;
    }

    createElement(tagName) {
      return new Element(tagName);
    }
  }

  const doc = new DocumentMock();
  docMockRef = doc;

  const windowMock = {
    location: {
      origin: 'https://meyar.sa',
      href: 'https://meyar.sa/explore.html'
    },
    addEventListener: (event, cb) => doc.addEventListener(event, cb),
    removeEventListener: () => {},
    dispatchEvent: (evt) => doc.dispatchEvent(evt)
  };

  const localStorageMock = {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  globalThis.document = doc;
  globalThis.window = windowMock;
  globalThis.localStorage = localStorageMock;
  globalThis.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };
  ExplorePage.reset();

  return { doc, localStorage: localStorageMock };
}

test('ExplorePage - Bookmark / Save Recipe Toggle and Session State', () => {
  const { localStorage } = setupDOM();
  I18n.init();

  assert.deepStrictEqual(ExplorePage.getSavedRecipeIds(), []);

  // Save recipe-1
  const state1 = ExplorePage.toggleSave('recipe-1');
  assert.strictEqual(state1, true);
  assert.deepStrictEqual(ExplorePage.getSavedRecipeIds(), ['recipe-1']);
  assert.strictEqual(localStorage.getItem('meyar_saved_recipes'), null);

  // Save recipe-2
  const state2 = ExplorePage.toggleSave('recipe-2');
  assert.strictEqual(state2, true);
  assert.deepStrictEqual(ExplorePage.getSavedRecipeIds(), ['recipe-1', 'recipe-2']);

  // Unsave recipe-1
  const state3 = ExplorePage.toggleSave('recipe-1');
  assert.strictEqual(state3, false);
  assert.deepStrictEqual(ExplorePage.getSavedRecipeIds(), ['recipe-2']);
});

test('ExplorePage - Like Recipe Toggle and Session State', () => {
  const { localStorage } = setupDOM();
  I18n.init();

  assert.deepStrictEqual(ExplorePage.getLikedRecipeIds(), []);

  // Like recipe-3
  const state1 = ExplorePage.toggleLike('recipe-3');
  assert.strictEqual(state1, true);
  assert.deepStrictEqual(ExplorePage.getLikedRecipeIds(), ['recipe-3']);
  assert.strictEqual(localStorage.getItem('meyar_liked_recipes'), null);

  // Unlike recipe-3
  const state2 = ExplorePage.toggleLike('recipe-3');
  assert.strictEqual(state2, false);
  assert.deepStrictEqual(ExplorePage.getLikedRecipeIds(), []);
});

test('ExplorePage - Follow Chef Toggle and Session State', () => {
  const { localStorage } = setupDOM();
  I18n.init();

  assert.deepStrictEqual(ExplorePage.getFollowingChefIds(), []);

  // The active user is chef-1 and cannot follow their own profile.
  const selfState = ExplorePage.toggleFollow('chef-1');
  assert.strictEqual(selfState, false);
  assert.deepStrictEqual(ExplorePage.getFollowingChefIds(), []);

  // Follow chef-2
  const state1 = ExplorePage.toggleFollow('chef-2');
  assert.strictEqual(state1, true);
  assert.deepStrictEqual(ExplorePage.getFollowingChefIds(), ['chef-2']);
  assert.strictEqual(localStorage.getItem('meyar_following_chefs'), null);

  // Unfollow chef-2
  const state2 = ExplorePage.toggleFollow('chef-2');
  assert.strictEqual(state2, false);
  assert.deepStrictEqual(ExplorePage.getFollowingChefIds(), []);
});

test('ExplorePage - Workshop / Course Enrollment Toggle and Session State', () => {
  const { localStorage } = setupDOM();
  I18n.init();

  assert.deepStrictEqual(ExplorePage.getEnrolledCourseIds(), []);

  // The active user teaches course-1 and cannot enroll in it.
  const selfState = ExplorePage.toggleEnroll('course-1');
  assert.strictEqual(selfState, false);
  assert.deepStrictEqual(ExplorePage.getEnrolledCourseIds(), []);

  // Enroll course-2
  const state1 = ExplorePage.toggleEnroll('course-2');
  assert.strictEqual(state1, true);
  assert.deepStrictEqual(ExplorePage.getEnrolledCourseIds(), ['course-2']);
  assert.strictEqual(localStorage.getItem('meyar_enrolled_courses'), null);

  // Cancel enrollment
  const state2 = ExplorePage.toggleEnroll('course-2');
  assert.strictEqual(state2, false);
  assert.deepStrictEqual(ExplorePage.getEnrolledCourseIds(), []);
});

test('ExplorePage - B2B RFQ Quotation Request & Link Sharing', () => {
  setupDOM();
  I18n.init();

  const rfqResult = ExplorePage.requestRFQ('supply-1');
  assert.strictEqual(rfqResult, true);

  // Link sharing
  assert.doesNotThrow(() => {
    ExplorePage.shareItem('recipe', 'recipe-1', 'Wagyu Ribeye');
    ExplorePage.shareItem('chef', 'chef-1', 'Chef Faisal');
    ExplorePage.shareItem('supply', 'supply-1', 'Spiral Dough Mixer');
    ExplorePage.shareItem('course', 'course-1', 'Modern Fermentation');
  });
});

test('ExplorePage - Category Filtering Logic', () => {
  setupDOM();
  I18n.init();

  // All Category (8 recipes + 6 chefs + 8 supplies + 4 courses = 26 items)
  const allItems = ExplorePage.filterItems('all', '', 'popular');
  assert.strictEqual(allItems.length, 26, 'Category "all" should return exactly 26 items');

  // Recipes Category
  const recipes = ExplorePage.filterItems('recipes', '', 'popular');
  assert.strictEqual(recipes.length, 8, 'Category "recipes" should return 8 recipes');
  assert.ok(recipes.every(r => r.type === 'recipe'));

  // Chefs Category
  const chefs = ExplorePage.filterItems('chefs', '', 'popular');
  assert.strictEqual(chefs.length, 6, 'Category "chefs" should return 6 chefs');
  assert.ok(chefs.every(c => c.type === 'chef'));

  // Supplies Category
  const supplies = ExplorePage.filterItems('supplies', '', 'popular');
  assert.strictEqual(supplies.length, 8, 'Category "supplies" should return 8 commercial supplies');
  assert.ok(supplies.every(s => s.type === 'supply'));

  // Courses Category
  const courses = ExplorePage.filterItems('courses', '', 'popular');
  assert.strictEqual(courses.length, 4, 'Category "courses" should return 4 masterclasses');
  assert.ok(courses.every(crs => crs.type === 'course'));

  // Seasonal Category (sub-filter for seasonal/terroir items)
  const seasonal = ExplorePage.filterItems('seasonal', '', 'popular');
  assert.ok(seasonal.length > 0 && seasonal.length < 26, 'Category "seasonal" should return a curated subset');
});

test('ExplorePage - Real-Time Search Query Filtering (Arabic & English)', () => {
  setupDOM();
  I18n.init();

  // 1. Search in Arabic
  const arSearch = ExplorePage.filterItems('all', 'واغيو', 'popular');
  assert.ok(arSearch.length >= 1, 'Should find Wagyu recipe in Arabic query');
  assert.strictEqual(arSearch[0].item.id, 'recipe-1');

  // 2. Search chef by name in Arabic
  const chefSearchAr = ExplorePage.filterItems('all', 'فيصل', 'popular');
  assert.ok(chefSearchAr.some(e => e.type === 'chef' && e.item.id === 'chef-1'));

  // 3. Search supply by English query
  const supplySearchEn = ExplorePage.filterItems('all', 'Damascus', 'popular');
  assert.ok(supplySearchEn.some(e => e.type === 'supply' && e.item.id === 'supply-3'));

  // 4. Search course by English query
  const courseSearchEn = ExplorePage.filterItems('all', 'Fermentation', 'popular');
  assert.ok(courseSearchEn.some(e => e.type === 'course' && e.item.id === 'course-1'));

  // 5. Search with diacritics / letter variants (تخمير vs تَخْمِير)
  const tashkeelSearch = ExplorePage.filterItems('all', 'تَخْمِير', 'popular');
  assert.ok(tashkeelSearch.length >= 1, 'Search query should normalize Arabic diacritics');
});

test('ExplorePage - Sorting Logic', () => {
  setupDOM();
  I18n.init();

  // 1. Sort by rating
  const ratingSorted = ExplorePage.filterItems('all', '', 'rating');
  for (let i = 0; i < ratingSorted.length - 1; i++) {
    const curRating = Number(ratingSorted[i].item.rating || 0);
    const nextRating = Number(ratingSorted[i + 1].item.rating || 0);
    assert.ok(curRating >= nextRating, `Rating sort violation at index ${i}: ${curRating} < ${nextRating}`);
  }

  // 2. Sort by newest (ID order)
  const newestSorted = ExplorePage.filterItems('all', '', 'newest');
  assert.ok(newestSorted.length === 26);

  // 3. Sort by popularity
  const popularSorted = ExplorePage.filterItems('all', '', 'popular');
  assert.ok(popularSorted.length === 26);
  assert.ok(ExplorePage.getPopularityScore(popularSorted[0]) >= ExplorePage.getPopularityScore(popularSorted[popularSorted.length - 1]));
});

test('ExplorePage - Bilingual Multi-Category Card Rendering', () => {
  setupDOM();
  I18n.init();

  // 1. Recipe Card in AR and EN
  const recipe = MOCK_DATA.recipes[0];
  const recipeHtmlAr = ExplorePage.renderRecipeCard(recipe, 'ar');
  assert.ok(recipeHtmlAr.includes(recipe.title_ar), 'AR recipe card must contain Arabic title');
  assert.ok(recipeHtmlAr.includes(recipe.author_name_ar), 'AR recipe card must contain Arabic author name');
  assert.ok(recipeHtmlAr.includes(`chef.html?id=${recipe.author_id}`), 'Recipe card must link to the author profile');

  const recipeHtmlEn = ExplorePage.renderRecipeCard(recipe, 'en');
  assert.ok(recipeHtmlEn.includes(recipe.title_en), 'EN recipe card must contain English title');
  assert.ok(recipeHtmlEn.includes(recipe.author_name_en), 'EN recipe card must contain English author name');

  // 2. Chef Card in AR and EN
  const chef = MOCK_DATA.chefs[0];
  const chefHtmlAr = ExplorePage.renderChefCard(chef, 'ar');
  assert.ok(chefHtmlAr.includes(chef.name_ar), 'AR chef card must contain Arabic name');
  assert.ok(chefHtmlAr.includes(chef.specialty_ar), 'AR chef card must contain Arabic specialty');
  assert.equal(chefHtmlAr.includes('data-action="toggle-follow"'), false, 'Self-follow button must not render');

  const chefHtmlEn = ExplorePage.renderChefCard(chef, 'en');
  assert.ok(chefHtmlEn.includes(chef.name_en), 'EN chef card must contain English name');
  assert.ok(chefHtmlEn.includes(chef.specialty_en), 'EN chef card must contain English specialty');

  // 3. Supply Card in AR and EN
  const supply = MOCK_DATA.supplies[0];
  const supplyHtmlAr = ExplorePage.renderSupplyCard(supply, 'ar');
  assert.ok(supplyHtmlAr.includes(supply.name_ar), 'AR supply card must contain Arabic name');
  assert.ok(supplyHtmlAr.includes(supply.price_formatted), 'AR supply card must contain formatted price');
  assert.equal(supplyHtmlAr.includes('undefined'), false, 'Supply card must not render missing fixture fields');

  const supplyHtmlEn = ExplorePage.renderSupplyCard(supply, 'en');
  assert.ok(supplyHtmlEn.includes(supply.name_en), 'EN supply card must contain English name');
  assert.ok(supplyHtmlEn.includes(supply.price_formatted), 'EN supply card must contain formatted price');

  // 4. Course Card in AR and EN
  const course = MOCK_DATA.courses[0];
  const courseHtmlAr = ExplorePage.renderCourseCard(course, 'ar');
  assert.ok(courseHtmlAr.includes(course.title_ar), 'AR course card must contain Arabic title');
  assert.ok(courseHtmlAr.includes(course.instructor_name_ar), 'AR course card must contain Arabic instructor');
  assert.ok(courseHtmlAr.includes(course.image), 'Course card must use the fixture image field');
  assert.equal(courseHtmlAr.includes('undefined'), false, 'Course card must not render missing fixture fields');

  const courseHtmlEn = ExplorePage.renderCourseCard(course, 'en');
  assert.ok(courseHtmlEn.includes(course.title_en), 'EN course card must contain English title');
  assert.ok(courseHtmlEn.includes(course.instructor_name_en), 'EN course card must contain English instructor');
});

test('ExplorePage - Empty State Rendering on unmatched query', () => {
  const { doc } = setupDOM();
  I18n.init();

  const container = doc.createElement('div');
  container.id = 'explore-grid';
  doc.body.appendChild(container);

  ExplorePage.renderGrid(container, [], 'ar');
  assert.ok(container.innerHTML.includes('explore-empty-state'), 'Must render empty state container');
  assert.ok(container.innerHTML.includes('reset-explore-filters'), 'Must include reset filters button');
});

test('ExplorePage - Hero Spotlight & Trending Sidebar Rendering', () => {
  const { doc } = setupDOM();
  I18n.init();

  const spotlightContainer = doc.createElement('div');
  spotlightContainer.id = 'explore-spotlight';
  doc.body.appendChild(spotlightContainer);

  const topicsContainer = doc.createElement('div');
  topicsContainer.id = 'explore-trending-topics';
  doc.body.appendChild(topicsContainer);

  const storiesContainer = doc.createElement('div');
  storiesContainer.id = 'explore-chef-stories';
  doc.body.appendChild(storiesContainer);

  const workshopsContainer = doc.createElement('div');
  workshopsContainer.id = 'explore-upcoming-workshops';
  doc.body.appendChild(workshopsContainer);

  ExplorePage.renderSpotlight(spotlightContainer, 'ar');
  assert.ok(spotlightContainer.innerHTML.includes('NewNajdiCuisine'));
  assert.ok(spotlightContainer.innerHTML.includes('الهاشمي'));

  ExplorePage.renderTrendingSidebar(topicsContainer, storiesContainer, workshopsContainer, 'ar');
  assert.ok(topicsContainer.innerHTML.includes('#NewNajdiCuisine'));
  assert.ok(storiesContainer.innerHTML.includes('chef.html?id=chef-1'));
  assert.ok(workshopsContainer.innerHTML.includes('courses.html'));
});

test('ExplorePage - Full DOM Initializer, Filter Button Switching & meyar:lang-changed event', () => {
  const { doc } = setupDOM();
  I18n.init();

  // Create page DOM structure
  const gridContainer = doc.createElement('div');
  gridContainer.id = 'explore-grid';
  doc.body.appendChild(gridContainer);

  const spotlightContainer = doc.createElement('div');
  spotlightContainer.id = 'explore-spotlight';
  doc.body.appendChild(spotlightContainer);

  const topicsContainer = doc.createElement('div');
  topicsContainer.id = 'explore-trending-topics';
  doc.body.appendChild(topicsContainer);

  const storiesContainer = doc.createElement('div');
  storiesContainer.id = 'explore-chef-stories';
  doc.body.appendChild(storiesContainer);

  const workshopsContainer = doc.createElement('div');
  workshopsContainer.id = 'explore-upcoming-workshops';
  doc.body.appendChild(workshopsContainer);

  const searchInput = doc.createElement('input');
  searchInput.id = 'explore-search-input';
  doc.body.appendChild(searchInput);

  const searchClear = doc.createElement('button');
  searchClear.id = 'explore-search-clear';
  doc.body.appendChild(searchClear);

  const sortSelect = doc.createElement('select');
  sortSelect.id = 'explore-sort-select';
  doc.body.appendChild(sortSelect);

  const countEl = doc.createElement('span');
  countEl.id = 'explore-results-count';
  doc.body.appendChild(countEl);

  const filterAll = doc.createElement('button');
  filterAll.setAttribute('data-category', 'all');
  doc.body.appendChild(filterAll);

  const filterChefs = doc.createElement('button');
  filterChefs.setAttribute('data-category', 'chefs');
  doc.body.appendChild(filterChefs);

  // Initialize ExplorePage
  ExplorePage.isInitialized = false;
  ExplorePage.init();

  // Check initial state
  assert.strictEqual(ExplorePage.currentCategory, 'all');
  assert.ok(gridContainer.innerHTML.length > 0);

  // Switch category to 'chefs'
  ExplorePage.setCategory('chefs');
  assert.strictEqual(ExplorePage.currentCategory, 'chefs');
  assert.ok(gridContainer.innerHTML.includes('data-card-type="chef"'));
  assert.ok(!gridContainer.innerHTML.includes('data-card-type="supply"'));

  // Switch search query
  ExplorePage.setSearchQuery('Elena');
  assert.strictEqual(ExplorePage.searchQuery, 'Elena');
  assert.ok(gridContainer.innerHTML.includes('elena_pastry') || gridContainer.innerHTML.includes('إيلينا'));

  // Reset
  ExplorePage.setCategory('all');
  ExplorePage.setSearchQuery('');
  assert.strictEqual(ExplorePage.currentCategory, 'all');
  assert.strictEqual(ExplorePage.searchQuery, '');

  // Dispatch language changed event
  const langEvt = {
    type: 'meyar:lang-changed',
    detail: { lang: 'en' },
    preventDefault() {},
    stopPropagation() {}
  };
  window.dispatchEvent(langEvt);
  assert.ok(spotlightContainer.innerHTML.length > 0);
});

test('ExplorePage - Strict Design & HTML Validation', () => {
  const htmlPath = path.resolve('/home/ztr/local-projects/meyar-frontend/explore.html');
  assert.ok(fs.existsSync(htmlPath), 'explore.html must exist on filesystem');

  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1. Zero Glassmorphism / Zero backdrop-blur check
  assert.strictEqual(html.includes('backdrop-blur'), false, 'explore.html must have zero backdrop-blur');
  assert.strictEqual(html.includes('bg-opacity-'), false, 'explore.html must not use bg-opacity- utility');

  // 2. Anti-FOUC inline script in <head>
  assert.ok(html.includes('meyar_theme'), 'Anti-FOUC script must check meyar_theme');
  assert.ok(html.includes('meyar_lang'), 'Anti-FOUC script must check meyar_lang');

  // 3. Inline Lucide-style SVGs
  assert.ok(html.includes('<svg'), 'explore.html must use inline SVGs');
  assert.strictEqual(html.includes('font-awesome'), false, 'explore.html must not use font-awesome');

  // 4. CSS Logical Properties
  assert.ok(html.includes('start-') || html.includes('ps-') || html.includes('ms-'), 'Must use CSS logical start properties');
  assert.ok(html.includes('end-') || html.includes('pe-') || html.includes('me-'), 'Must use CSS logical end properties');

  // 5. Script Modules
  assert.ok(html.includes('js/bundle.js') || html.includes('js/app.js'), 'Must load bundle or app module');
});
