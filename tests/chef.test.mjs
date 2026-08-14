import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { ChefPage } from '../js/pages/chef.js';

// Setup Mock DOM environment for testing Chef Profile & Portfolio page
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
      this.href = '';
      this.type = '';
      this.selected = false;
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

    select() {}
  }

  const elementsById = new Map();

  function registerElement(id, tagName = 'div') {
    const el = new Element(tagName);
    el.id = id;
    elementsById.set(id, el);
    return el;
  }

  // Pre-create required Chef page element IDs
  const requiredIds = [
    'chef-breadcrumb-name',
    'chef-hero-section',
    'chef-cover-container',
    'chef-cover-image',
    'chef-cover-specialty',
    'chef-cover-specialty-text',
    'chef-avatar',
    'chef-verified-badge',
    'chef-name',
    'chef-role-badge',
    'chef-handle',
    'chef-title',
    'btn-follow-chef',
    'btn-message-chef',
    'btn-hire-chef',
    'btn-share-chef',
    'chef-bio-text',
    'chef-philosophy-snippet',
    'chef-awards-ribbon',
    'chef-stats-grid',
    'stat-followers-count',
    'stat-followers-label',
    'stat-following-count',
    'stat-following-label',
    'stat-recipes-count',
    'stat-recipes-label',
    'stat-experience-count',
    'stat-experience-label',
    'stat-rating-value',
    'stat-reviews-count',
    'chef-tabs-nav',
    'tab-btn-recipes',
    'badge-recipes-count',
    'tab-btn-portfolio',
    'badge-portfolio-count',
    'tab-btn-saved',
    'badge-saved-count',
    'tab-btn-courses',
    'badge-courses-count',
    'tab-btn-activity',
    'badge-activity-count',
    'tab-btn-about',
    'chef-panels-container',
    'panel-recipes',
    'chef-recipes-search-input',
    'chef-recipes-counter-text',
    'chef-recipes-grid',
    'chef-recipes-empty',
    'panel-portfolio',
    'chef-portfolio-grid',
    'chef-portfolio-empty',
    'panel-saved',
    'chef-saved-grid',
    'chef-saved-empty',
    'panel-courses',
    'chef-courses-grid',
    'chef-courses-empty',
    'panel-activity',
    'chef-activity-stream',
    'chef-activity-empty',
    'panel-about',
    'about-chef-heading',
    'about-bio-full',
    'about-philosophy-full',
    'about-restaurants-list',
    'about-awards-list',
    'about-equipment-list',
    'hire-modal',
    'hire-chef-form',
    'hire-chef-avatar',
    'hire-chef-name',
    'hire-input-name',
    'hire-input-email',
    'hire-input-service',
    'hire-input-date',
    'hire-input-budget',
    'hire-input-message',
    'btn-submit-hire',
    'share-modal',
    'chef-share-url-input',
    'btn-copy-chef-url',
    'search-modal',
    'global-search-input',
    'global-search-results',
    'mobile-drawer'
  ];

  requiredIds.forEach(id => registerElement(id));

  // Set up follow button sub-elements
  const followBtn = elementsById.get('btn-follow-chef');
  const followLabel = new Element('span');
  followLabel.className = 'follow-label';
  const followIcon = new Element('svg');
  followIcon.className = 'follow-icon';
  followBtn.appendChild(followIcon);
  followBtn.appendChild(followLabel);

  // Set tab attributes
  const tabs = [
    { id: 'tab-btn-recipes', tab: 'recipes' },
    { id: 'tab-btn-portfolio', tab: 'portfolio' },
    { id: 'tab-btn-saved', tab: 'saved' },
    { id: 'tab-btn-courses', tab: 'courses' },
    { id: 'tab-btn-activity', tab: 'activity' },
    { id: 'tab-btn-about', tab: 'about' }
  ];

  tabs.forEach(({ id, tab }) => {
    const el = elementsById.get(id);
    if (el) el.setAttribute('data-tab', tab);
  });

  const documentMock = {
    title: '',
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: (selector) => {
      if (selector.startsWith('#')) return elementsById.get(selector.slice(1)) || null;
      for (const el of elementsById.values()) {
        if (el.matches(selector)) return el;
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
      hash: '',
      href: 'https://meyar.sa/chef.html?id=chef-1',
      origin: 'https://meyar.sa'
    },
    history: {
      replaceState: (state, title, url) => {
        windowMock.location.href = url;
        const u = new URL(url);
        windowMock.location.search = u.search;
        windowMock.location.hash = u.hash;
      }
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
    }
  };

  const localStorageMock = {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  globalThis.document = documentMock;
  globalThis.window = windowMock;
  globalThis.localStorage = localStorageMock;
  globalThis.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };

  ChefPage.isInitialized = false;

  return { elementsById, listeners, storage, windowMock };
}

test('ChefPage - Load Chef Profile by ID, URL Query, and Fallback', () => {
  setupDOM();

  // Test 1: Load Chef 1 directly
  const chef1 = ChefPage.loadChef('chef-1');
  assert.equal(chef1.id, 'chef-1');
  assert.equal(ChefPage.currentChefId, 'chef-1');
  assert.equal(chef1.name_en, 'Chef Faisal Al-Hashemi');

  // Test 2: Load Chef 2 directly
  const chef2 = ChefPage.loadChef('chef-2');
  assert.equal(chef2.id, 'chef-2');
  assert.equal(ChefPage.currentChefId, 'chef-2');
  assert.equal(chef2.name_en, 'Chef Elena Rostova');

  // Test 3: Fallback on unknown id
  const fallbackChef = ChefPage.loadChef('unknown-chef-999');
  assert.equal(fallbackChef.id, 'chef-1');
});

test('ChefPage - Profile Header DOM Rendering & Metrics', () => {
  const { elementsById } = setupDOM();
  I18n.setLang('ar');

  ChefPage.loadChef('chef-1');
  ChefPage.renderProfileHeader();

  const nameEl = elementsById.get('chef-name');
  assert.equal(nameEl.textContent, 'الشيف فيصل الهاشمي');

  const titleEl = elementsById.get('chef-title');
  assert.equal(titleEl.textContent, 'المدير التنفيذي للطهي ومستشار فنون الطهي المعاصر');

  const handleEl = elementsById.get('chef-handle');
  assert.equal(handleEl.textContent, '@chef_faisal');

  const followersCount = elementsById.get('stat-followers-count');
  assert.equal(followersCount.textContent, '42.8k');

  const followingCount = elementsById.get('stat-following-count');
  assert.equal(followingCount.textContent, '310');

  const experienceCount = elementsById.get('stat-experience-count');
  assert.equal(experienceCount.textContent, '16');

  const ratingValue = elementsById.get('stat-rating-value');
  assert.equal(ratingValue.textContent, '4.95');

  const ribbonEl = elementsById.get('chef-awards-ribbon');
  assert.ok(ribbonEl.innerHTML.includes('البوكوز دور'));
  assert.ok(ribbonEl.innerHTML.includes('2024'));

  // Switch to English and verify header updates
  I18n.setLang('en');
  ChefPage.renderProfileHeader();
  assert.equal(nameEl.textContent, 'Chef Faisal Al-Hashemi');
  assert.equal(titleEl.textContent, 'Executive Culinary Director & Gastronomy Consultant');
  assert.ok(ribbonEl.innerHTML.includes("Bocuse d'Or"));
});

test('ChefPage - 6 Functional Tabs Switching & Deep Linking', () => {
  const { elementsById, windowMock } = setupDOM();
  ChefPage.loadChef('chef-1');
  ChefPage.init();

  const tabs = ['recipes', 'portfolio', 'saved', 'courses', 'activity', 'about'];

  tabs.forEach(tabName => {
    ChefPage.setActiveTab(tabName, true);
    assert.equal(ChefPage.activeTab, tabName);

    // Active button has aria-selected=true
    const activeBtn = elementsById.get(`tab-btn-${tabName}`);
    assert.equal(activeBtn.getAttribute('aria-selected'), 'true');
    assert.ok(activeBtn.className.includes('text-brand-gold'));

    // Active panel is not hidden
    const activePanel = elementsById.get(`panel-${tabName}`);
    assert.equal(activePanel.classList.contains('hidden'), false);

    // All other panels are hidden
    tabs.filter(t => t !== tabName).forEach(otherTab => {
      const otherBtn = elementsById.get(`tab-btn-${otherTab}`);
      const otherPanel = elementsById.get(`panel-${otherTab}`);
      assert.equal(otherBtn.getAttribute('aria-selected'), 'false');
      assert.equal(otherPanel.classList.contains('hidden'), true);
    });

    // Verify URL was updated
    assert.ok(windowMock.location.href.includes(`tab=${tabName}`));
  });

  // Test invalid tab name defaults to recipes
  ChefPage.setActiveTab('invalid-tab-name');
  assert.equal(ChefPage.activeTab, 'recipes');
});

test('ChefPage - Follow / Unfollow Chef Persistence & UI Feedback', () => {
  const { elementsById, storage } = setupDOM();
  ChefPage.loadChef('chef-1');
  ChefPage.init();

  const followBtn = elementsById.get('btn-follow-chef');

  // Initial state: not following
  assert.equal(ChefPage.getFollowingChefIds().includes('chef-1'), false);

  // Click Follow
  const isNowFollowing = ChefPage.toggleFollow('chef-1');
  assert.equal(isNowFollowing, true);
  assert.equal(ChefPage.getFollowingChefIds().includes('chef-1'), true);
  assert.ok(storage.get(ChefPage.STORAGE_FOLLOWING).includes('chef-1'));

  // Follow Button UI updated
  const label = followBtn.querySelector('.follow-label');
  assert.equal(label.textContent, I18n.t('btn.following'));

  // Click Unfollow
  const isNowUnfollowing = ChefPage.toggleFollow('chef-1');
  assert.equal(isNowUnfollowing, false);
  assert.equal(ChefPage.getFollowingChefIds().includes('chef-1'), false);
  assert.equal(label.textContent, I18n.t('btn.follow'));
});

test('ChefPage - Recipe Save & Like Toggles', () => {
  const { storage } = setupDOM();
  ChefPage.loadChef('chef-1');
  ChefPage.init();

  // Test Bookmark Save Toggle
  assert.equal(ChefPage.getSavedRecipeIds().includes('recipe-1'), false);
  const isSaved = ChefPage.toggleSave('recipe-1');
  assert.equal(isSaved, true);
  assert.equal(ChefPage.getSavedRecipeIds().includes('recipe-1'), true);
  assert.ok(storage.get(ChefPage.STORAGE_SAVED).includes('recipe-1'));

  const isUnsaved = ChefPage.toggleSave('recipe-1');
  assert.equal(isUnsaved, false);
  assert.equal(ChefPage.getSavedRecipeIds().includes('recipe-1'), false);

  // Test Like Toggle
  assert.equal(ChefPage.getLikedRecipeIds().includes('recipe-1'), false);
  const isLiked = ChefPage.toggleLike('recipe-1');
  assert.equal(isLiked, true);
  assert.equal(ChefPage.getLikedRecipeIds().includes('recipe-1'), true);
  assert.ok(storage.get(ChefPage.STORAGE_LIKED).includes('recipe-1'));

  const isUnliked = ChefPage.toggleLike('recipe-1');
  assert.equal(isUnliked, false);
  assert.equal(ChefPage.getLikedRecipeIds().includes('recipe-1'), false);
});

test('ChefPage - Masterclass Course Enrollment', () => {
  const { storage } = setupDOM();
  ChefPage.loadChef('chef-1');
  ChefPage.init();

  // Test Enroll in course-1
  assert.equal(ChefPage.getEnrolledCourseIds().includes('course-1'), false);
  const isEnrolled = ChefPage.enrollCourse('course-1');
  assert.equal(isEnrolled, true);
  assert.equal(ChefPage.getEnrolledCourseIds().includes('course-1'), true);
  assert.ok(storage.get(ChefPage.STORAGE_ENROLLED).includes('course-1'));

  // Test Un-enroll
  const isUnenrolled = ChefPage.enrollCourse('course-1');
  assert.equal(isUnenrolled, false);
  assert.equal(ChefPage.getEnrolledCourseIds().includes('course-1'), false);
});

test('ChefPage - Recipes Panel Search & Filtering', () => {
  const { elementsById } = setupDOM();
  I18n.setLang('ar');
  ChefPage.loadChef('chef-1');
  ChefPage.init();

  const grid = elementsById.get('chef-recipes-grid');
  const emptyState = elementsById.get('chef-recipes-empty');

  // Initial recipes render
  assert.ok(grid.children.length > 0);
  assert.equal(emptyState.classList.contains('hidden'), true);

  // Filter with matching keyword
  ChefPage.recipeFilterQuery = 'واغيو';
  ChefPage.renderRecipesPanel();
  assert.ok(grid.children.length > 0);
  assert.equal(emptyState.classList.contains('hidden'), true);

  // Filter with non-matching query
  ChefPage.recipeFilterQuery = 'شوربة خضار عشوائية غير موجودة';
  ChefPage.renderRecipesPanel();
  assert.equal(grid.children.length, 0);
  assert.equal(emptyState.classList.contains('hidden'), false);

  // Clear filter
  ChefPage.recipeFilterQuery = '';
  ChefPage.renderRecipesPanel();
  assert.ok(grid.children.length > 0);
  assert.equal(emptyState.classList.contains('hidden'), true);
});

test('ChefPage - Portfolio Signature Dishes Rendering', () => {
  const { elementsById } = setupDOM();
  I18n.setLang('ar');
  ChefPage.loadChef('chef-1');
  ChefPage.renderPortfolioPanel();

  const grid = elementsById.get('chef-portfolio-grid');
  assert.ok(grid.children.length >= 2);

  // Verify dish 1 has recipe link
  const dish1Html = grid.children[0].innerHTML;
  assert.ok(dish1Html.includes('recipe.html?id=recipe-1'));
  assert.ok(dish1Html.includes('ستيك واغيو بريب آي'));

  // Verify dish 2 is exclusive (no recipe link)
  const dish2Html = grid.children[1].innerHTML;
  assert.ok(dish2Html.includes('طبق حصري للمطعم'));
});

test('ChefPage - Saved Collections & Masterclasses Rendering', () => {
  const { elementsById } = setupDOM();
  I18n.setLang('ar');
  ChefPage.loadChef('chef-1');
  ChefPage.renderSavedPanel();
  ChefPage.renderCoursesPanel();

  const savedGrid = elementsById.get('chef-saved-grid');
  assert.ok(savedGrid.children.length >= 3);

  const coursesGrid = elementsById.get('chef-courses-grid');
  assert.ok(coursesGrid.children.length >= 1);
  assert.ok(coursesGrid.children[0].innerHTML.includes('أسرار التخمير والإنضاج الجاف'));
});

test('ChefPage - Activity Stream & About Background Panels', () => {
  const { elementsById } = setupDOM();
  I18n.setLang('ar');
  ChefPage.loadChef('chef-1');
  ChefPage.renderActivityPanel();
  ChefPage.renderAboutPanel();

  const activityStream = elementsById.get('chef-activity-stream');
  assert.ok(activityStream.children.length >= 4);

  const restList = elementsById.get('about-restaurants-list');
  assert.ok(restList.innerHTML.includes('مطعم مرخ الفاخر'));

  const awardsList = elementsById.get('about-awards-list');
  assert.ok(awardsList.innerHTML.includes('البوكوز دور'));

  const equipList = elementsById.get('about-equipment-list');
  assert.ok(equipList.children.length >= 3);
});

test('ChefPage - Language Change Reactivity (meyar:lang-changed)', () => {
  const { elementsById, windowMock } = setupDOM();
  ChefPage.loadChef('chef-1');
  ChefPage.init();

  ChefPage.setActiveTab('courses');

  // Trigger language change to English
  I18n.setLang('en');
  windowMock.dispatchEvent({ type: 'meyar:lang-changed' });

  // Verify active tab is preserved
  assert.equal(ChefPage.activeTab, 'courses');

  // Verify profile header was re-rendered in English
  const nameEl = elementsById.get('chef-name');
  assert.equal(nameEl.textContent, 'Chef Faisal Al-Hashemi');

  // Verify courses panel was re-rendered in English
  const coursesGrid = elementsById.get('chef-courses-grid');
  assert.ok(coursesGrid.children[0].innerHTML.includes('Modern Fermentation & Dry Aging Masterclass'));
});

test('ChefPage - Strict Design & HTML Validation', () => {
  const htmlPath = path.join(process.cwd(), 'chef.html');
  assert.ok(fs.existsSync(htmlPath), 'chef.html must exist');

  const content = fs.readFileSync(htmlPath, 'utf8');

  // 1. Anti-FOUC script present in <head>
  assert.ok(content.includes('Anti-FOUC Early Theme & Language Execution'), 'Must include anti-FOUC script');
  assert.ok(content.includes('localStorage.getItem(\'meyar_theme\')'), 'Anti-FOUC must check theme');
  assert.ok(content.includes('localStorage.getItem(\'meyar_lang\')'), 'Anti-FOUC must check language');

  // 2. 100% Solid Surfaces: strictly zero glassmorphism / zero backdrop-blur
  assert.equal(content.includes('backdrop-blur'), false, 'Strictly zero backdrop-blur allowed');
  assert.equal(content.includes('backdrop-filter'), false, 'Strictly zero backdrop-filter allowed');

  // 3. Strict CSS Logical Properties: verify presence of start/end/ms/me/ps/pe
  assert.ok(content.includes('start-'), 'Must use logical start-* positioning');
  assert.ok(content.includes('end-'), 'Must use logical end-* positioning');
  assert.ok(content.includes('ps-') || content.includes('pe-'), 'Must use logical padding ps-*/pe-*');
  assert.ok(content.includes('text-start'), 'Must use text-start');
  assert.ok(content.includes('border-s') || content.includes('border-e'), 'Must use border-s/border-e');

  // 4. Check that all 6 tabs exist in DOM
  assert.ok(content.includes('data-tab="recipes"'), 'Must have recipes tab');
  assert.ok(content.includes('data-tab="portfolio"'), 'Must have portfolio tab');
  assert.ok(content.includes('data-tab="saved"'), 'Must have saved tab');
  assert.ok(content.includes('data-tab="courses"'), 'Must have courses tab');
  assert.ok(content.includes('data-tab="activity"'), 'Must have activity tab');
  assert.ok(content.includes('data-tab="about"'), 'Must have about tab');

  // 5. Check modals exist
  assert.ok(content.includes('id="hire-modal"'), 'Must include hire chef modal');
  assert.ok(content.includes('id="share-modal"'), 'Must include share chef modal');
  assert.ok(content.includes('id="search-modal"'), 'Must include search modal');
});
