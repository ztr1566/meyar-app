import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { Modal } from '../js/core/modal.js';
import { CoursesPage } from '../js/pages/courses.js';

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
        curr = curr.parentElement;
      }

      const docHandlers = (listeners.get(docMockRef) && listeners.get(docMockRef).get(evt.type)) || [];
      for (const h of docHandlers) {
        if (stopped) break;
        h(evt);
      }

      return true;
    }

    focus() {
      this.focused = true;
    }

    click() {
      this.clicked = true;
      this.dispatchEvent({ type: 'click' });
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
      const s = selector.trim();
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
          const [rawKey, rawVal] = inner.split('=');
          const val = rawVal.replace(/['"]/g, '').trim();
          return this.getAttribute(rawKey.trim()) === val;
        }
        return this.hasAttribute(inner.trim());
      }
      return this.tagName.toLowerCase() === s.toLowerCase();
    }

    querySelector(selector) {
      const results = this.querySelectorAll(selector);
      return results.length > 0 ? results[0] : null;
    }

    querySelectorAll(selector) {
      const matched = [];
      const parts = selector.split(',').map(p => p.trim()).filter(Boolean);

      function traverse(node) {
        for (const child of node.children) {
          let isMatch = false;
          for (const part of parts) {
            if (child.matches(part)) {
              isMatch = true;
              break;
            }
          }
          if (isMatch) matched.push(child);
          traverse(child);
        }
      }

      traverse(this);
      return matched;
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

    set innerHTML(htmlStr) {
      this._innerHTML = htmlStr;
      this.children = [];
      parseHTML(htmlStr, this);
    }

    get innerHTML() {
      return this._innerHTML;
    }
  }

  function parseHTML(html, parent) {
    const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9\-]+)([^>]*)\/>|<(img|input|hr|br)([^>]*)>/gi;
    let match;

    const tokens = [];
    const openTagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
    
    const div = new Element('div');
    div.setAttribute('data-parsed-content', 'true');
    div._textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Quick regex scanner for critical attributes and elements
    const elemRegex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
    let elMatch;
    while ((elMatch = elemRegex.exec(html)) !== null) {
      const tagName = elMatch[1];
      const attrsStr = elMatch[2];
      
      const child = new Element(tagName);
      
      const attrRegex = /([a-zA-Z0-9\-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
        const key = attrMatch[1];
        const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
        if (key === 'id') child.id = val;
        else if (key === 'class') child.className = val;
        else if (key === 'name') child.name = val;
        else if (key === 'value') child.value = val;
        else if (key === 'src') child.src = val;
        else if (key === 'alt') child.alt = val;
        else child.setAttribute(key, val);
      }
      parent.appendChild(child);
    }
  }

  const documentMock = {
    readyState: 'complete',
    documentElement: new Element('html'),
    body: new Element('body'),
    createElement(tagName) {
      return new Element(tagName);
    },
    getElementById(id) {
      function find(node) {
        if (node.id === id) return node;
        for (const child of node.children) {
          const res = find(child);
          if (res) return res;
        }
        return null;
      }
      return find(documentMock.body) || find(documentMock.documentElement);
    },
    querySelector(selector) {
      if (selector === 'body') return documentMock.body;
      if (selector === 'html') return documentMock.documentElement;
      return documentMock.documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      return documentMock.documentElement.querySelectorAll(selector);
    },
    addEventListener(event, callback) {
      if (!listeners.has(documentMock)) {
        listeners.set(documentMock, new Map());
      }
      const elMap = listeners.get(documentMock);
      if (!elMap.has(event)) {
        elMap.set(event, []);
      }
      elMap.get(event).push(callback);
    },
    removeEventListener(event, callback) {
      const elMap = listeners.get(documentMock);
      if (elMap && elMap.has(event)) {
        const list = elMap.get(event);
        const idx = list.indexOf(callback);
        if (idx !== -1) list.splice(idx, 1);
      }
    },
    dispatchEvent(evt) {
      const elMap = listeners.get(documentMock);
      const handlers = (elMap && elMap.get(evt.type)) || [];
      for (const h of handlers) {
        h(evt);
      }
      return true;
    }
  };

  docMockRef = documentMock;

  const windowMock = {
    location: {
      origin: 'https://meyar.sa',
      pathname: '/courses.html',
      search: ''
    },
    navigator: {
      clipboard: {
        writeText: async () => true
      }
    },
    matchMedia: () => ({ matches: false }),
    addEventListener(event, callback) {
      documentMock.addEventListener(event, callback);
    },
    removeEventListener(event, callback) {
      documentMock.removeEventListener(event, callback);
    },
    dispatchEvent(evt) {
      return documentMock.dispatchEvent(evt);
    },
    CustomEvent: class CustomEvent {
      constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail || {};
      }
    }
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

  class FormDataMock {
    constructor(form) {
      this.data = new Map();
      if (form) {
        for (const child of form.querySelectorAll('input, textarea, select')) {
          if (child.name) {
            this.data.set(child.name, child.value || '');
          }
        }
      }
    }
    get(name) {
      return this.data.get(name) || null;
    }
    set(name, value) {
      this.data.set(name, String(value));
    }
  }

  globalThis.document = documentMock;
  globalThis.window = windowMock;
  globalThis.localStorage = localStorageMock;
  globalThis.CustomEvent = windowMock.CustomEvent;
  globalThis.FormData = FormDataMock;
  globalThis.requestAnimationFrame = (cb) => cb();

  return { documentMock, windowMock, localStorageMock };
}

test('CoursesPage - Initial Catalog & Card Rendering', () => {
  const { documentMock } = setupDOM();
  I18n.init();

  const grid = documentMock.createElement('div');
  grid.id = 'courses-grid-container';
  documentMock.body.appendChild(grid);

  const countLabel = documentMock.createElement('span');
  countLabel.id = 'courses-count-label';
  documentMock.body.appendChild(countLabel);

  CoursesPage.currentCategory = 'all';
  CoursesPage.currentLevel = 'all';
  CoursesPage.searchQuery = '';
  CoursesPage.render();

  const cards = grid.querySelectorAll('[data-course-card]');
  assert.equal(cards.length, 4, 'Should render all 4 masterclasses from mock data');
  assert.ok(grid.innerHTML.includes('التخمير') || grid.innerHTML.includes('Modern Fermentation'), 'Should include Course 1');
  assert.ok(grid.innerHTML.includes('المخبوزات') || grid.innerHTML.includes('Haute Viennoiserie'), 'Should include Course 2');
  assert.ok(grid.innerHTML.includes('الطهي المباشر') || grid.innerHTML.includes('Live Fire'), 'Should include Course 3');
  assert.ok(grid.innerHTML.includes('الكايسيكي') || grid.innerHTML.includes('Kaiseki Philosophy'), 'Should include Course 4');
  assert.equal(CoursesPage.renderCourseCard(MOCK_DATA.courses[0], true).includes('data-action="open-enroll"'), false, 'Own course must not render an enrollment action');
  assert.equal(CoursesPage.renderCourseCard(MOCK_DATA.courses[1], true).includes('data-action="open-enroll"'), true, 'Other instructors must retain enrollment');
});

test('CoursesPage - Bookmark / Save Masterclass Toggle and Session State', () => {
  const { documentMock } = setupDOM();
  CoursesPage.reset();
  I18n.init();

  const grid = documentMock.createElement('div');
  grid.id = 'courses-grid-container';
  documentMock.body.appendChild(grid);

  CoursesPage.render();

  assert.equal(CoursesPage.getSavedCourseIds().length, 0);

  // Toggle save on course-1
  const isSavedFirst = CoursesPage.toggleSaveCourse('course-1');
  assert.equal(isSavedFirst, true);
  assert.deepEqual(CoursesPage.getSavedCourseIds(), ['course-1']);

  // Toggle save on course-2
  CoursesPage.toggleSaveCourse('course-2');
  assert.deepEqual(CoursesPage.getSavedCourseIds(), ['course-1', 'course-2']);

  // Toggle remove on course-1
  const isSavedSecond = CoursesPage.toggleSaveCourse('course-1');
  assert.equal(isSavedSecond, false);
  assert.deepEqual(CoursesPage.getSavedCourseIds(), ['course-2']);
});

test('CoursesPage - Category Filtering Logic', () => {
  setupDOM();
  I18n.init();

  CoursesPage.searchQuery = '';
  CoursesPage.currentLevel = 'all';

  // 1. Fermentation Category
  CoursesPage.currentCategory = 'fermentation';
  const fermentation = CoursesPage.filterCourses();
  assert.equal(fermentation.length, 1);
  assert.equal(fermentation[0].id, 'course-1');

  // 2. Pastry Category
  CoursesPage.currentCategory = 'pastry';
  const pastry = CoursesPage.filterCourses();
  assert.equal(pastry.length, 1);
  assert.equal(pastry[0].id, 'course-2');

  // 3. Smoke Category
  CoursesPage.currentCategory = 'smoke';
  const smoke = CoursesPage.filterCourses();
  assert.equal(smoke.length, 1);
  assert.equal(smoke[0].id, 'course-3');

  // 4. Seafood Category
  CoursesPage.currentCategory = 'seafood';
  const seafood = CoursesPage.filterCourses();
  assert.equal(seafood.length, 1);
  assert.equal(seafood[0].id, 'course-4');

  // 5. All Category
  CoursesPage.currentCategory = 'all';
  const all = CoursesPage.filterCourses();
  assert.equal(all.length, 4);
});

test('CoursesPage - Skill Level Filtering Logic', () => {
  setupDOM();
  I18n.init();

  CoursesPage.currentCategory = 'all';
  CoursesPage.searchQuery = '';

  // 1. Masterclass Level (course-1, course-4)
  CoursesPage.currentLevel = 'masterclass';
  const masterclasses = CoursesPage.filterCourses();
  assert.equal(masterclasses.length, 2);
  assert.ok(masterclasses.every(c => c.level === 'masterclass'));

  // 2. Intermediate Level (course-2, course-3)
  CoursesPage.currentLevel = 'intermediate';
  const intermediate = CoursesPage.filterCourses();
  assert.equal(intermediate.length, 2);
  assert.ok(intermediate.every(c => c.level === 'intermediate'));

  // 3. Beginner Level (0 items in current mock dataset)
  CoursesPage.currentLevel = 'beginner';
  const beginner = CoursesPage.filterCourses();
  assert.equal(beginner.length, 0);
});

test('CoursesPage - Keyword Search Filtering (Arabic & English Normalization)', () => {
  setupDOM();
  I18n.init();

  CoursesPage.currentCategory = 'all';
  CoursesPage.currentLevel = 'all';

  // 1. Arabic specific query: 'الإنضاج الجاف'
  CoursesPage.searchQuery = 'الإنضاج الجاف';
  const arSearch = CoursesPage.filterCourses();
  assert.equal(arSearch.length, 1);
  assert.equal(arSearch[0].id, 'course-1');

  // 2. English query: 'croissant' / 'Viennoiserie'
  CoursesPage.searchQuery = 'croissant';
  const enSearch = CoursesPage.filterCourses();
  assert.equal(enSearch.length, 1);
  assert.equal(enSearch[0].id, 'course-2');

  // 3. Instructor query: 'فيصل' / 'Faisal'
  CoursesPage.searchQuery = 'فيصل';
  const chefSearch = CoursesPage.filterCourses();
  assert.equal(chefSearch.length, 1);
  assert.equal(chefSearch[0].instructor_id, 'chef-1');

  // 4. Syllabus deep query: 'Ikejime' / 'إيكي جيمي'
  CoursesPage.searchQuery = 'Ikejime';
  const syllabusSearch = CoursesPage.filterCourses();
  assert.equal(syllabusSearch.length, 1);
  assert.equal(syllabusSearch[0].id, 'course-4');

  // 5. Multi-match search: 'تخمير' (matches Course 1 and Course 2 syllabus)
  CoursesPage.searchQuery = 'تخمير';
  const multiSearch = CoursesPage.filterCourses();
  assert.equal(multiSearch.length, 2);

  // 6. Unmatched query: 'nonexistent-query-xyz'
  CoursesPage.searchQuery = 'nonexistent-query-xyz';
  const emptySearch = CoursesPage.filterCourses();
  assert.equal(emptySearch.length, 0);
});

test('CoursesPage - Sorting Algorithms', () => {
  setupDOM();
  I18n.init();

  CoursesPage.currentCategory = 'all';
  CoursesPage.currentLevel = 'all';
  CoursesPage.searchQuery = '';

  // 1. Price Ascending (1950, 2600, 3200, 3800)
  CoursesPage.sortBy = 'price_asc';
  const priceAsc = CoursesPage.filterCourses();
  assert.equal(priceAsc[0].id, 'course-3'); // 1950
  assert.equal(priceAsc[priceAsc.length - 1].id, 'course-4'); // 3800

  // 2. Price Descending (3800, 3200, 2600, 1950)
  CoursesPage.sortBy = 'price_desc';
  const priceDesc = CoursesPage.filterCourses();
  assert.equal(priceDesc[0].id, 'course-4'); // 3800
  assert.equal(priceDesc[priceDesc.length - 1].id, 'course-3'); // 1950

  // 3. Seats Left Ascending (2 seats, 3 seats, 5 seats, 8 seats)
  CoursesPage.sortBy = 'seats_asc';
  const seatsAsc = CoursesPage.filterCourses();
  assert.equal(seatsAsc[0].id, 'course-4'); // 2 seats left
  assert.equal(seatsAsc[1].id, 'course-1'); // 3 seats left

  // 4. Start Date Ascending
  CoursesPage.sortBy = 'date_asc';
  const dateAsc = CoursesPage.filterCourses();
  assert.equal(dateAsc[0].id, 'course-1'); // 2026-09-10
  assert.equal(dateAsc[dateAsc.length - 1].id, 'course-4'); // 2026-10-02
});

test('CoursesPage - Curriculum Modal Inspection & Syllabus Modules', () => {
  const { documentMock } = setupDOM();
  I18n.init();

  const modal = documentMock.createElement('div');
  modal.id = 'course-curriculum-modal';
  const body = documentMock.createElement('div');
  body.setAttribute('data-modal-body', 'true');
  modal.appendChild(body);
  documentMock.body.appendChild(modal);

  CoursesPage.renderCurriculumModal('course-1');

  assert.ok(body.innerHTML.includes('Modern Fermentation') || body.innerHTML.includes('التخمير'));
  assert.ok(body.innerHTML.includes('الشيف فيصل الهاشمي') || body.innerHTML.includes('Faisal'));
  assert.ok(body.innerHTML.includes('3,200'));
});

test('CoursesPage - 1-Click Enrollment Modal & Form Flow & Session State', () => {
  const { documentMock } = setupDOM();
  CoursesPage.reset();
  I18n.init();

  const modal = documentMock.createElement('div');
  modal.id = 'course-enroll-modal';
  const body = documentMock.createElement('div');
  body.setAttribute('data-modal-body', 'true');
  modal.appendChild(body);
  documentMock.body.appendChild(modal);

  assert.equal(CoursesPage.isEnrolled('course-1'), false);

  CoursesPage.renderEnrollModal('course-2');
  assert.ok(body.innerHTML.includes('course-enroll-form'));
  assert.ok(body.innerHTML.includes('2,600'));

  // The active user teaches course-1 and cannot enroll in it.
  const selfEnrollment = CoursesPage.enrollInCourse('course-1', {
    student_name: 'الشيف فيصل الهاشمي',
    student_email: 'faisal@meyar.sa'
  });
  assert.equal(selfEnrollment, false);
  assert.equal(CoursesPage.isEnrolled('course-1'), false);

  // Enroll in courses taught by other chefs.
  const enrolledSuccess = CoursesPage.enrollInCourse('course-2', { student_name: 'Faisal' });
  assert.equal(enrolledSuccess, true);
  assert.equal(CoursesPage.isEnrolled('course-2'), true);
  CoursesPage.enrollInCourse('course-4', { student_name: 'Faisal' });
  assert.equal(CoursesPage.isEnrolled('course-4'), true);
  assert.deepEqual(CoursesPage.getEnrolledCourseIds(), ['course-2', 'course-4']);
});

test('CoursesPage - Enrollment Cancellation & Event Dispatch', () => {
  const { windowMock } = setupDOM();
  CoursesPage.reset();
  I18n.init();

  CoursesPage.enrollInCourse('course-2');
  assert.equal(CoursesPage.isEnrolled('course-2'), true);

  let cancelledEventFired = false;
  windowMock.addEventListener('meyar:course-cancelled', (e) => {
    if (e.detail?.courseId === 'course-2') {
      cancelledEventFired = true;
    }
  });

  const cancelled = CoursesPage.cancelEnrollment('course-2');
  assert.equal(cancelled, true);
  assert.equal(CoursesPage.isEnrolled('course-2'), false);
  assert.equal(cancelledEventFired, true);
});

test('CoursesPage - Language Reactivity & Bilingual Re-rendering', () => {
  const { documentMock } = setupDOM();
  I18n.init();

  const grid = documentMock.createElement('div');
  grid.id = 'courses-grid-container';
  documentMock.body.appendChild(grid);

  // 1. Render in Arabic
  I18n.setLang('ar');
  CoursesPage.currentCategory = 'all';
  CoursesPage.render();
  assert.ok(grid.innerHTML.includes('أسرار التخمير') || grid.innerHTML.includes('التخمير'));

  // 2. Render in English
  I18n.setLang('en');
  CoursesPage.render();
  assert.ok(grid.innerHTML.includes('Modern Fermentation'));
});

test('CoursesPage - Strict HTML & 100% Solid Surfaces Design Validation', () => {
  const htmlPath = path.resolve(process.cwd(), 'courses.html');
  assert.ok(fs.existsSync(htmlPath), 'courses.html must exist');

  const html = fs.readFileSync(htmlPath, 'utf8');

  // Anti-FOUC script check
  assert.ok(html.includes('meyar_theme'), 'Must contain Anti-FOUC theme execution script');
  assert.ok(html.includes('meyar_lang'), 'Must contain Anti-FOUC language execution script');

  // Solid surfaces check: zero backdrop-blur, zero glassmorphism
  assert.ok(!html.includes('backdrop-blur'), 'Forbidden glassmorphism: backdrop-blur found');
  assert.ok(!html.includes('backdrop-filter'), 'Forbidden glassmorphism: backdrop-filter found');

  // CSS Logical Properties check
  const forbiddenClasses = [
    /\bml-\d+/,
    /\bmr-\d+/,
    /\bpl-\d+/,
    /\bpr-\d+/,
    /\btext-left\b/,
    /\btext-right\b/,
    /\bborder-l\b/,
    /\bborder-r\b/
  ];

  for (const regex of forbiddenClasses) {
    assert.ok(!regex.test(html), `Found non-logical CSS class matching ${regex} in courses.html`);
  }

  // Check required modals and elements
  assert.ok(html.includes('id="course-curriculum-modal"'), 'Must contain curriculum modal');
  assert.ok(html.includes('id="course-enroll-modal"'), 'Must contain 1-click enroll modal');
  assert.ok(html.includes('id="courses-grid-container"'), 'Must contain courses grid container');
  assert.ok(html.includes('id="courses-search-input"'), 'Must contain search input');
  assert.ok(html.includes('id="courses-level-select"'), 'Must contain level select');
  assert.ok(html.includes('id="courses-sort-select"'), 'Must contain sort select');
});
