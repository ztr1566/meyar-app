import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { NotificationsPage } from '../js/pages/notifications.js';

// Setup Mock DOM environment
function setupDOM() {
  const listeners = new Map();
  const storage = new Map();

  class ClassList {
    constructor() {
      this._classes = new Set();
    }
    add(...cls) {
      cls.forEach(c => {
        if (c) c.split(/\s+/).filter(Boolean).forEach(item => this._classes.add(item));
      });
    }
    remove(...cls) {
      cls.forEach(c => {
        if (c) c.split(/\s+/).filter(Boolean).forEach(item => this._classes.delete(item));
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
      this.value = '';
      this.src = '';
      this.alt = '';
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

    set innerHTML(val) {
      this._innerHTML = String(val);
      this.children = [];
      this._parseAndBuildChildren(val);
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set textContent(val) {
      this.children = [];
      this._innerHTML = '';
      this._textContent = String(val);
    }

    get textContent() {
      if (this.children.length > 0) {
        return this.children.map(c => c.textContent).join('');
      }
      return this._textContent;
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

    remove() {
      if (this.parentElement) {
        this.parentElement.removeChild(this);
      }
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
      const handlers = (elMap && elMap.get(evt.type)) || [];
      for (const h of handlers) {
        h(evt);
      }

      // Propagate / bubble up to parentElement and document
      if (this.parentElement) {
        this.parentElement.dispatchEvent(evt);
      } else if (docMockRef && this !== docMockRef) {
        docMockRef.dispatchEvent(evt);
      }

      return true;
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
      return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
      const matched = [];
      function recurse(node) {
        for (const child of node.children) {
          if (child.matches(selector)) {
            matched.push(child);
          }
          recurse(child);
        }
      }
      recurse(this);
      return matched;
    }

    _parseAndBuildChildren(html) {
      if (!html || typeof html !== 'string') return;
      const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9\-]+)([^>]*)\/>/g;
      let match;
      while ((match = tagRegex.exec(html)) !== null) {
        const tagName = match[1] || match[4];
        const rawAttrs = match[2] || match[5] || '';
        const inner = match[3] || '';

        const child = new Element(tagName);
        const attrRegex = /([a-zA-Z0-9\-]+)(?:=["']([^"']*)["'])?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
          const attrName = attrMatch[1];
          const attrVal = attrMatch[2] !== undefined ? attrMatch[2] : '';
          if (attrName === 'id') {
            child.id = attrVal;
          } else if (attrName === 'class') {
            child.className = attrVal;
          } else {
            child.setAttribute(attrName, attrVal);
          }
        }

        if (inner && !/<[a-zA-Z0-9\-]+/.test(inner)) {
          child.textContent = inner.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        } else if (inner) {
          child._parseAndBuildChildren(inner);
        }

        child.parentElement = this;
        this.children.push(child);
      }
    }
  }

  const documentElement = new Element('html');
  const body = new Element('body');
  documentElement.appendChild(body);

  const documentMock = {
    documentElement,
    body,
    createElement(tag) {
      return new Element(tag);
    },
    getElementById(id) {
      function recurse(node) {
        if (node.id === id) return node;
        for (const child of node.children) {
          const res = recurse(child);
          if (res) return res;
        }
        return null;
      }
      return recurse(documentElement);
    },
    querySelector(selector) {
      return documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      return documentElement.querySelectorAll(selector);
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
    dispatchEvent(evt) {
      evt.target = evt.target || documentMock;
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
    listeners: new Map(),
    location: {
      search: '',
      hash: '',
      href: 'http://localhost/notifications.html'
    },
    history: {
      replaceState() {}
    },
    matchMedia: () => ({ matches: true, addEventListener: () => {} }),
    addEventListener(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    },
    dispatchEvent(evt) {
      const handlers = this.listeners.get(evt.type) || [];
      for (const h of handlers) {
        h(evt);
      }
      return true;
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

  class CustomEventMock {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail || {};
    }
  }

  globalThis.document = documentMock;
  globalThis.window = windowMock;
  globalThis.localStorage = localStorageMock;
  globalThis.CustomEvent = CustomEventMock;
  globalThis.HTMLElement = Element;
  globalThis.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };

  // Setup Basic DOM structure for notifications page
  const headerUnreadBadge = new Element('span');
  headerUnreadBadge.id = 'notifications-unread-count';
  headerUnreadBadge.className = 'hidden';
  body.appendChild(headerUnreadBadge);

  const topbarNotifDot = new Element('span');
  topbarNotifDot.setAttribute('data-notif-indicator', '');
  topbarNotifDot.className = 'hidden';
  body.appendChild(topbarNotifDot);

  const markAllBtn = new Element('button');
  markAllBtn.setAttribute('data-action', 'mark-all-read');
  body.appendChild(markAllBtn);

  const clearAllBtn = new Element('button');
  clearAllBtn.setAttribute('data-action', 'clear-all-notifications');
  body.appendChild(clearAllBtn);

  const filterContainer = new Element('div');
  filterContainer.id = 'notifications-filter-pills';
  ['all', 'rfqs', 'likes', 'courses'].forEach(cat => {
    const pill = new Element('button');
    pill.setAttribute('data-filter-notif', cat);
    pill.setAttribute('aria-selected', cat === 'all' ? 'true' : 'false');
    const countSpan = new Element('span');
    countSpan.className = 'filter-count';
    countSpan.textContent = '0';
    pill.appendChild(countSpan);
    filterContainer.appendChild(pill);
  });
  body.appendChild(filterContainer);

  const feedContainer = new Element('div');
  feedContainer.id = 'notifications-feed-container';
  body.appendChild(feedContainer);

  return { documentMock, windowMock, localStorageMock, feedContainer, headerUnreadBadge, filterContainer };
}

test('NotificationsPage - Data Loading, Session State & Defaults', async (t) => {
  setupDOM();
  localStorage.clear();

  await t.test('Loads initial notifications from fixtures into session state', () => {
    NotificationsPage.reset();
    const notifs = NotificationsPage.getNotifications();
    assert.ok(Array.isArray(notifs));
    assert.strictEqual(notifs.length, MOCK_DATA.notifications.length);
    assert.ok(NotificationsPage.notificationsStore !== null);
  });

  await t.test('Calculates initial unread notifications count correctly', () => {
    const unread = NotificationsPage.getUnreadCount();
    const expectedUnread = MOCK_DATA.notifications.filter(n => !n.read).length;
    assert.strictEqual(unread, expectedUnread);
    assert.ok(unread > 0, 'Should have unread items in mock data');
  });
});

test('NotificationsPage - Mark All as Read & Individual Toggle Actions', async (t) => {
  setupDOM();
  localStorage.clear();

  await t.test('markAllAsRead marks all notifications as read and updates badges', () => {
    NotificationsPage.init();
    assert.ok(NotificationsPage.getUnreadCount() > 0);

    NotificationsPage.markAllAsRead();

    assert.strictEqual(NotificationsPage.getUnreadCount(), 0);
    const updated = NotificationsPage.getNotifications();
    for (const item of updated) {
      assert.strictEqual(item.read, true);
    }

    const headerBadge = document.getElementById('notifications-unread-count');
    assert.ok(headerBadge.classList.contains('hidden'));
  });

  await t.test('toggleRead toggles read state of a single notification', () => {
    const notifs = NotificationsPage.getNotifications();
    const firstId = notifs[0].id;
    assert.strictEqual(notifs[0].read, true); // previously marked as read

    NotificationsPage.toggleRead(firstId);
    let current = NotificationsPage.getNotifications().find(n => n.id === firstId);
    assert.strictEqual(current.read, false);
    assert.strictEqual(NotificationsPage.getUnreadCount(), 1);

    NotificationsPage.toggleRead(firstId);
    current = NotificationsPage.getNotifications().find(n => n.id === firstId);
    assert.strictEqual(current.read, true);
    assert.strictEqual(NotificationsPage.getUnreadCount(), 0);
  });

  await t.test('markAsRead sets read=true when clicking a link without toggling', () => {
    const notifs = NotificationsPage.getNotifications();
    const secondId = notifs[1].id;
    NotificationsPage.toggleRead(secondId); // Make it unread
    assert.strictEqual(NotificationsPage.getNotifications().find(n => n.id === secondId).read, false);

    NotificationsPage.markAsRead(secondId);
    assert.strictEqual(NotificationsPage.getNotifications().find(n => n.id === secondId).read, true);
  });
});

test('NotificationsPage - Delete and Clear All Actions', async (t) => {
  setupDOM();
  localStorage.clear();

  await t.test('deleteNotification removes the targeted item from session state and updates feed', () => {
    NotificationsPage.init();
    const initialList = NotificationsPage.getNotifications();
    const targetId = initialList[0].id;
    const initialLength = initialList.length;

    NotificationsPage.deleteNotification(targetId);

    const updatedList = NotificationsPage.getNotifications();
    assert.strictEqual(updatedList.length, initialLength - 1);
    assert.strictEqual(updatedList.find(n => n.id === targetId), undefined);
  });

  await t.test('clearAll removes all items and renders empty state container', () => {
    NotificationsPage.clearAll();
    const updatedList = NotificationsPage.getNotifications();
    assert.strictEqual(updatedList.length, 0);
    assert.strictEqual(NotificationsPage.getUnreadCount(), 0);

    const feedContainer = document.getElementById('notifications-feed-container');
    assert.ok(feedContainer.innerHTML.includes('notifications.no_notifications') || feedContainer.innerHTML.includes('لا توجد إشعارات'));
  });
});

test('NotificationsPage - Category Filtering Logic', async (t) => {
  setupDOM();
  localStorage.clear();

  await t.test('setFilter updates active filter and filters rendered items', () => {
    NotificationsPage.init();
    assert.strictEqual(NotificationsPage.currentFilter, 'all');

    // Filter by RFQs
    NotificationsPage.setFilter('rfqs');
    assert.strictEqual(NotificationsPage.currentFilter, 'rfqs');

    const feedContainer = document.getElementById('notifications-feed-container');
    assert.ok(feedContainer.children.length > 0);

    // Filter by Likes
    NotificationsPage.setFilter('likes');
    assert.strictEqual(NotificationsPage.currentFilter, 'likes');

    // Filter by Courses
    NotificationsPage.setFilter('courses');
    assert.strictEqual(NotificationsPage.currentFilter, 'courses');

    // Reset to all
    NotificationsPage.setFilter('all');
    assert.strictEqual(NotificationsPage.currentFilter, 'all');
  });
});

test('NotificationsPage - Grouping into Today, Yesterday, and Earlier', async (t) => {
  const sampleItems = [
    { id: '1', time_en: '15 mins ago', time_ar: 'منذ 15 دقيقة', read: false },
    { id: '2', time_en: '2 hours ago', time_ar: 'منذ ساعتين', read: false },
    { id: '3', time_en: '1 day ago', time_ar: 'منذ يوم', read: true },
    { id: '4', time_en: '3 days ago', time_ar: 'منذ 3 أيام', read: true }
  ];

  const grouped = NotificationsPage.groupNotifications(sampleItems);
  assert.strictEqual(grouped.today.length, 2);
  assert.strictEqual(grouped.yesterday.length, 1);
  assert.strictEqual(grouped.earlier.length, 1);
  assert.strictEqual(grouped.today[0].id, '1');
  assert.strictEqual(grouped.yesterday[0].id, '3');
  assert.strictEqual(grouped.earlier[0].id, '4');
});

test('NotificationsPage - Strict HTML & Solid Surfaces Design Validation', async (t) => {
  const filePath = path.resolve(process.cwd(), 'notifications.html');
  assert.ok(fs.existsSync(filePath), 'notifications.html must exist on filesystem');

  const content = fs.readFileSync(filePath, 'utf8');

  await t.test('Includes Anti-FOUC inline synchronous script in <head>', () => {
    assert.ok(content.includes('localStorage.getItem(\'meyar_theme\')'), 'Anti-FOUC script must check theme');
    assert.ok(content.includes('localStorage.getItem(\'meyar_lang\')'), 'Anti-FOUC script must check language');
  });

  await t.test('Enforces 100% Solid Surfaces: strictly zero glassmorphism / zero backdrop-blur', () => {
    assert.ok(!content.includes('backdrop-' + 'blur-md'), 'No backdrop-blur-md allowed');
    assert.ok(!content.includes('backdrop-' + 'blur-lg'), 'No backdrop-blur-lg allowed');
    assert.ok(!content.includes('backdrop-' + 'filter'), 'No backdrop-filter allowed');
    assert.ok(!content.includes('bg-opacity-'), 'No semi-transparent background hacks');
  });

  await t.test('Strict CSS Logical Properties in markup', () => {
    assert.ok(content.includes('start-') || content.includes('ps-') || content.includes('pe-') || content.includes('text-start'), 'Must use CSS logical properties');
    assert.ok(!content.includes('left-0') && !content.includes('right-0'), 'Must not use non-logical left-0 / right-0 in primary layout');
  });

  await t.test('Inline Lucide-style SVGs included', () => {
    assert.ok(content.includes('<svg'), 'Must include inline SVG icons');
    assert.ok(content.includes('viewBox="0 0 24 24"'), 'Standard 24x24 viewBox used');
  });

  await t.test('Includes proper scripts and controllers', () => {
    assert.ok(content.includes('js/bundle.js') || content.includes('js/app.js'), 'Must load app or bundle script');
  });
});
