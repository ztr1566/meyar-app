import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { FeedPage } from '../js/pages/feed.js';

// Setup Mock DOM environment for testing Feed page
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

    scrollBy() {}

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
      href: 'https://meyar.sa/index.html'
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

  // Reset Toast container
  Toast.container = null;

  return { doc, storage, windowMock, localStorageMock, Element };
}

test('FeedPage - Bookmark / Save Recipe Toggle and Persistence', () => {
  const { storage } = setupDOM();
  FeedPage.isInitialized = false;

  // Initial state should be empty
  assert.deepEqual(FeedPage.getSavedRecipeIds(), []);

  // 1. Save recipe-1
  const isSaved1 = FeedPage.toggleSave('recipe-1');
  assert.equal(isSaved1, true, 'recipe-1 should now be saved');
  assert.deepEqual(FeedPage.getSavedRecipeIds(), ['recipe-1']);
  assert.equal(JSON.parse(storage.get('meyar_saved_recipes'))[0], 'recipe-1');

  // 2. Save recipe-2
  const isSaved2 = FeedPage.toggleSave('recipe-2');
  assert.equal(isSaved2, true, 'recipe-2 should now be saved');
  assert.deepEqual(FeedPage.getSavedRecipeIds().sort(), ['recipe-1', 'recipe-2'].sort());

  // 3. Unsave recipe-1
  const isSavedAgain = FeedPage.toggleSave('recipe-1');
  assert.equal(isSavedAgain, false, 'recipe-1 should now be unsaved');
  assert.deepEqual(FeedPage.getSavedRecipeIds(), ['recipe-2']);
});

test('FeedPage - Like Recipe Toggle and Persistence', () => {
  const { storage } = setupDOM();
  FeedPage.isInitialized = false;

  // Initial state should be empty
  assert.deepEqual(FeedPage.getLikedRecipeIds(), []);

  // 1. Like recipe-1
  const isLiked1 = FeedPage.toggleLike('recipe-1');
  assert.equal(isLiked1, true, 'recipe-1 should be liked');
  assert.deepEqual(FeedPage.getLikedRecipeIds(), ['recipe-1']);

  // 2. Unlike recipe-1
  const isLikedAgain = FeedPage.toggleLike('recipe-1');
  assert.equal(isLikedAgain, false, 'recipe-1 should be unliked');
  assert.deepEqual(FeedPage.getLikedRecipeIds(), []);
});

test('FeedPage - Follow Chef Toggle and Persistence', () => {
  const { storage } = setupDOM();
  FeedPage.isInitialized = false;

  // Initial state should be empty
  assert.deepEqual(FeedPage.getFollowingChefIds(), []);

  // 1. Follow chef-1
  const isFollowing1 = FeedPage.toggleFollow('chef-1');
  assert.equal(isFollowing1, true, 'chef-1 should now be followed');
  assert.deepEqual(FeedPage.getFollowingChefIds(), ['chef-1']);

  // 2. Follow chef-2
  const isFollowing2 = FeedPage.toggleFollow('chef-2');
  assert.equal(isFollowing2, true, 'chef-2 should now be followed');
  assert.deepEqual(FeedPage.getFollowingChefIds().sort(), ['chef-1', 'chef-2'].sort());

  // 3. Unfollow chef-1
  const isFollowingAgain = FeedPage.toggleFollow('chef-1');
  assert.equal(isFollowingAgain, false, 'chef-1 should now be unfollowed');
  assert.deepEqual(FeedPage.getFollowingChefIds(), ['chef-2']);
});

test('FeedPage - Stories Carousel Rendering & Bilingual Names', () => {
  const { doc, Element } = setupDOM();
  I18n.setLang('ar');

  const storiesTrack = new Element('div');
  storiesTrack.id = 'stories-track';
  doc.body.appendChild(storiesTrack);

  FeedPage.renderStories(storiesTrack);
  assert.ok(storiesTrack.innerHTML.length > 50, 'Stories track should be populated');
  assert.ok(storiesTrack.innerHTML.includes('قصتك'), 'Should contain Arabic user story label');
  assert.ok(storiesTrack.innerHTML.includes('فيصل الهاشمي'), 'Should render Arabic chef names');

  // Switch to English
  I18n.setLang('en');
  FeedPage.renderStories(storiesTrack);
  assert.ok(storiesTrack.innerHTML.includes('Your Story'), 'Should contain English user story label');
  assert.ok(storiesTrack.innerHTML.includes('Faisal Al-Hashemi'), 'Should render English chef names');
});

test('FeedPage - Trends & Highlights Sidebar Rendering', () => {
  const { doc, Element } = setupDOM();
  I18n.setLang('ar');

  const topicsCont = new Element('div');
  topicsCont.id = 'trending-topics-container';
  doc.body.appendChild(topicsCont);

  const suppliersCont = new Element('div');
  suppliersCont.id = 'top-suppliers-container';
  doc.body.appendChild(suppliersCont);

  const workshopsCont = new Element('div');
  workshopsCont.id = 'upcoming-workshops-container';
  doc.body.appendChild(workshopsCont);

  FeedPage.renderTrendingTopics(topicsCont);
  FeedPage.renderTopSuppliers(suppliersCont);
  FeedPage.renderUpcomingWorkshops(workshopsCont);

  // Assert topics
  assert.ok(topicsCont.innerHTML.includes('#NewNajdiCuisine'));
  assert.ok(topicsCont.innerHTML.includes('المطبخ النجدي المعاصر'));

  // Assert suppliers
  assert.ok(suppliersCont.innerHTML.includes('شركة الفنار للمعدات'));
  assert.ok(suppliersCont.innerHTML.includes('طلب تسعير'));

  // Assert workshops
  assert.ok(workshopsCont.innerHTML.includes('أسرار التخمير والإنضاج الجاف'));
  assert.ok(workshopsCont.innerHTML.includes('التسجيل الآن'));
});

test('FeedPage - Main Feed Stream Dynamic Recipe Cards Rendering', () => {
  const { doc, Element } = setupDOM();
  I18n.setLang('ar');

  const feedCont = new Element('div');
  feedCont.id = 'feed-posts-container';
  doc.body.appendChild(feedCont);

  FeedPage.currentFilter = 'all';
  FeedPage.renderFeedPosts(feedCont);

  assert.ok(feedCont.innerHTML.includes('ستيك واغيو'), 'Should render Wagyu ribeye recipe');
  assert.ok(feedCont.innerHTML.includes('الشيف فيصل الهاشمي'), 'Should render author');
  assert.ok(feedCont.innerHTML.includes('data-action="like"'), 'Should render like action button');
  assert.ok(feedCont.innerHTML.includes('data-action="save"'), 'Should render save action button');
  assert.ok(feedCont.innerHTML.includes('data-action="share"'), 'Should render share action button');

  // Test filter switching
  FeedPage.currentFilter = 'trending';
  FeedPage.renderFeedPosts(feedCont);
  assert.ok(feedCont.innerHTML.includes('data-action="like"'));
});

test('FeedPage - Post Composer Creation and Prepending', () => {
  const { doc, Element } = setupDOM();
  I18n.setLang('ar');
  FeedPage.isInitialized = false;
  FeedPage.userPosts = [];

  const composerInput = new Element('textarea');
  composerInput.id = 'feed-composer-input';
  doc.body.appendChild(composerInput);

  const composerBtn = new Element('button');
  composerBtn.id = 'feed-composer-btn';
  doc.body.appendChild(composerBtn);

  const feedCont = new Element('div');
  feedCont.id = 'feed-posts-container';
  doc.body.appendChild(feedCont);

  FeedPage.bindEvents();

  // 1. Try empty submission
  composerInput.value = '   ';
  composerBtn.click();
  assert.equal(FeedPage.userPosts.length, 0, 'Empty post should not be added');

  // 2. Submit valid post
  composerInput.value = 'تجربة جديدة في التخمير البارد لخبز الساور دو الفاخر.';
  composerBtn.click();
  assert.equal(FeedPage.userPosts.length, 1, 'New post should be added');
  assert.ok(feedCont.innerHTML.includes('تجربة جديدة في التخمير البارد'), 'Post should appear in feed');
  assert.equal(composerInput.value, '', 'Input should be cleared');
});

test('FeedPage - Filter Bar Interaction and State Management', () => {
  const { doc, Element } = setupDOM();
  I18n.setLang('ar');
  FeedPage.isInitialized = false;

  const filterBar = new Element('div');
  filterBar.id = 'feed-filter-bar';

  const btnAll = new Element('button');
  btnAll.setAttribute('data-filter', 'all');
  filterBar.appendChild(btnAll);

  const btnTrending = new Element('button');
  btnTrending.setAttribute('data-filter', 'trending');
  filterBar.appendChild(btnTrending);

  const btnChefs = new Element('button');
  btnChefs.setAttribute('data-filter', 'chefs');
  filterBar.appendChild(btnChefs);

  doc.body.appendChild(filterBar);

  const feedCont = new Element('div');
  feedCont.id = 'feed-posts-container';
  doc.body.appendChild(feedCont);

  FeedPage.bindEvents();

  btnTrending.click();
  assert.equal(FeedPage.currentFilter, 'trending');

  btnChefs.click();
  assert.equal(FeedPage.currentFilter, 'chefs');
});

test('FeedPage - Language Change Event Re-renders Page', () => {
  const { doc, Element, windowMock } = setupDOM();
  FeedPage.isInitialized = false;

  const storiesTrack = new Element('div');
  storiesTrack.id = 'stories-track';
  doc.body.appendChild(storiesTrack);

  const feedCont = new Element('div');
  feedCont.id = 'feed-posts-container';
  doc.body.appendChild(feedCont);

  I18n.setLang('ar');
  FeedPage.init();

  assert.ok(storiesTrack.innerHTML.includes('قصتك'));

  // Switch language to en
  I18n.setLang('en');
  windowMock.dispatchEvent({ type: 'meyar:lang-changed', detail: { lang: 'en' } });

  assert.ok(storiesTrack.innerHTML.includes('Your Story'));
});
