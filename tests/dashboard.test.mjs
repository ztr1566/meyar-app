import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { Modal } from '../js/core/modal.js';
import { DashboardPage } from '../js/pages/dashboard.js';

// Setup Mock DOM environment for testing Creator & Supplier Dashboard
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
      this.disabled = false;
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

    get textContent() {
      if (this.children.length === 0) {
        return this._textContent;
      }
      return this.children.map(c => c.textContent).join('');
    }

    set textContent(val) {
      this._textContent = String(val);
      this.children = [];
    }

    get innerHTML() {
      return this._innerHTML || this.textContent;
    }

    set innerHTML(html) {
      this._innerHTML = String(html);
      this.children = [];
      if (docMockRef) {
        const parsed = docMockRef._parseHTMLFragment(html);
        parsed.forEach(child => this.appendChild(child));
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

    reset() {
      this.querySelectorAll('input, select, textarea').forEach(inp => {
        inp.value = '';
      });
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
      const traverse = (node) => {
        for (const child of node.children) {
          if (child.matches && child.matches(selector)) {
            results.push(child);
          }
          traverse(child);
        }
      };
      traverse(this);
      return results;
    }

    getBoundingClientRect() {
      return { top: 0, left: 0, width: 700, height: 260, right: 700, bottom: 260 };
    }
  }

  const doc = {
    documentElement: new Element('html'),
    body: new Element('body'),
    readyState: 'complete',
    _elements: new Map(),

    createElement(tag) {
      return new Element(tag);
    },

    getElementById(id) {
      const traverse = (node) => {
        if (node.id === id) return node;
        for (const child of node.children) {
          const found = traverse(child);
          if (found) return found;
        }
        return null;
      };
      return traverse(this.documentElement);
    },

    querySelector(sel) {
      return this.documentElement.querySelector(sel);
    },

    querySelectorAll(sel) {
      return this.documentElement.querySelectorAll(sel);
    },

    addEventListener(event, callback) {
      this.documentElement.addEventListener(event, callback);
    },

    _parseHTMLFragment(html) {
      const nodes = [];
      const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9]+)([^>]*)\/>/g;
      let match;
      while ((match = tagRegex.exec(html)) !== null) {
        const tagName = match[1] || match[4];
        const rawAttrs = match[2] || match[5] || '';
        const innerContent = match[3] || '';

        const el = new Element(tagName);
        const attrRegex = /([a-zA-Z0-9_-]+)(?:="([^"]*)")?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
          const key = attrMatch[1];
          const val = attrMatch[2] !== undefined ? attrMatch[2] : '';
          if (key === 'id') el.id = val;
          else if (key === 'class') el.className = val;
          else el.setAttribute(key, val);
        }

        if (innerContent.trim()) {
          if (innerContent.includes('<')) {
            el.innerHTML = innerContent;
          } else {
            el.textContent = innerContent;
          }
        }
        nodes.push(el);
      }
      return nodes;
    }
  };

  docMockRef = doc;
  doc.documentElement.appendChild(doc.body);

  const win = {
    document: doc,
    localStorage: {
      getItem(k) { return storage.has(k) ? storage.get(k) : null; },
      setItem(k, v) { storage.set(k, String(v)); },
      removeItem(k) { storage.delete(k); },
      clear() { storage.clear(); }
    },
    addEventListener(event, callback) {
      doc.addEventListener(event, callback);
    },
    dispatchEvent(evt) {
      return doc.documentElement.dispatchEvent(evt);
    },
    matchMedia() {
      return { matches: true };
    }
  };

  globalThis.window = win;
  globalThis.document = doc;
  globalThis.localStorage = win.localStorage;
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  if (!globalThis.CustomEvent) {
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, params = {}) {
        this.type = type;
        this.detail = params.detail || null;
      }
    };
  }

  return { doc, win, storage };
}

test('Creator & Supplier Dashboard (dashboard.html & js/pages/dashboard.js) Test Suite', async (t) => {

  await t.test('1. HTML Structural & SEO Validation', () => {
    const htmlPath = path.join(process.cwd(), 'dashboard.html');
    assert.ok(fs.existsSync(htmlPath), 'dashboard.html must exist in workspace root');

    const content = fs.readFileSync(htmlPath, 'utf8');

    // Anti-FOUC script & HTML language
    assert.match(content, /<html lang="ar" dir="rtl" class="dark">/, 'Must have dark mode Arabic root by default');
    assert.match(content, /localStorage\.getItem\('meyar_theme'\)/, 'Must contain Anti-FOUC theme detector script');

    // Title and Core Sections
    assert.match(content, /data-i18n="dashboard\.title"/, 'Must contain i18n title key');
    assert.match(content, /id="kpi-views-value"/, 'Must have Views KPI value element');
    assert.match(content, /id="kpi-impressions-value"/, 'Must have Impressions KPI value element');
    assert.match(content, /id="kpi-rfqs-value"/, 'Must have RFQs KPI value element');
    assert.match(content, /id="kpi-revenue-value"/, 'Must have Revenue KPI value element');

    // Interactive Charts
    assert.match(content, /id="dashboard-traffic-chart"/, 'Must have traffic SVG chart container');
    assert.match(content, /id="dashboard-revenue-chart"/, 'Must have revenue SVG chart container');
    assert.match(content, /id="traffic-chart-tooltip"/, 'Must have traffic chart tooltip');
    assert.match(content, /id="revenue-chart-tooltip"/, 'Must have revenue chart tooltip');

    // Management Tabs & Tables
    assert.match(content, /data-tab="recipes"/, 'Must have recipes tab button');
    assert.match(content, /data-tab="supplies"/, 'Must have supplies tab button');
    assert.match(content, /data-tab="rfqs"/, 'Must have rfqs tab button');
    assert.match(content, /data-tab="enrollments"/, 'Must have enrollments tab button');
    assert.match(content, /id="dashboard-table-search"/, 'Must have table search input');
    assert.match(content, /id="dashboard-status-filter"/, 'Must have status filter dropdown');
    assert.match(content, /id="dashboard-table-container"/, 'Must have table container');

    // Modals & Action Elements
    assert.match(content, /id="modal-add-supply"/, 'Must have Add Supply product modal');
    assert.match(content, /id="modal-rfq-response"/, 'Must have RFQ response quotation modal');
    assert.match(content, /id="modal-delete-confirm"/, 'Must have delete confirmation modal');
    assert.match(content, /id="toast-container"/, 'Must have toast notifications container');

    // CSS Logical Properties check: ensure no raw non-logical directions
    assert.doesNotMatch(content, /\bml-\d/, 'Strict zero ml-* classes allowed, must use ms-*');
    assert.doesNotMatch(content, /\bmr-\d/, 'Strict zero mr-* classes allowed, must use me-*');
    assert.doesNotMatch(content, /\bpl-\d/, 'Strict zero pl-* classes allowed, must use ps-*');
    assert.doesNotMatch(content, /\bpr-\d/, 'Strict zero pr-* classes allowed, must use pe-*');

    // Zero glassmorphism check
    assert.doesNotMatch(content, /backdrop-blur/, 'Strictly zero backdrop-blur allowed');
  });

  await t.test('2. Controller Initialization & Default Dataset Seeding', () => {
    const { doc, win, storage } = setupDOM();
    I18n.init();

    const recipes = DashboardPage.getRecipes();
    assert.ok(Array.isArray(recipes), 'Recipes should return an array');
    assert.ok(recipes.length > 0, 'Should have seeded recipes from mock data');

    const supplies = DashboardPage.getSupplies();
    assert.ok(Array.isArray(supplies), 'Supplies should return an array');
    assert.ok(supplies.length > 0, 'Should have seeded supplies from mock data');

    const rfqs = DashboardPage.getRFQs();
    assert.ok(Array.isArray(rfqs), 'RFQs should return an array');
    assert.strictEqual(rfqs.length, 5, 'Should seed 5 rich initial RFQs');

    const enrollments = DashboardPage.getEnrollments();
    assert.ok(Array.isArray(enrollments), 'Enrollments should return an array');
    assert.strictEqual(enrollments.length, 4, 'Should seed 4 initial student enrollments');
  });

  await t.test('3. Period Metrics Filtering & Dynamic Calculation', () => {
    const { doc, win } = setupDOM();
    I18n.init();

    // Create mock KPI elements in document
    const kpiViews = doc.createElement('div');
    kpiViews.id = 'kpi-views-value';
    doc.body.appendChild(kpiViews);

    const kpiViewsGrowth = doc.createElement('div');
    kpiViewsGrowth.id = 'kpi-views-growth';
    doc.body.appendChild(kpiViewsGrowth);

    const kpiImp = doc.createElement('div');
    kpiImp.id = 'kpi-impressions-value';
    doc.body.appendChild(kpiImp);

    const kpiImpGrowth = doc.createElement('div');
    kpiImpGrowth.id = 'kpi-impressions-growth';
    doc.body.appendChild(kpiImpGrowth);

    const kpiRfqs = doc.createElement('div');
    kpiRfqs.id = 'kpi-rfqs-value';
    doc.body.appendChild(kpiRfqs);

    const kpiRfqsGrowth = doc.createElement('div');
    kpiRfqsGrowth.id = 'kpi-rfqs-growth';
    doc.body.appendChild(kpiRfqsGrowth);

    const kpiRev = doc.createElement('div');
    kpiRev.id = 'kpi-revenue-value';
    doc.body.appendChild(kpiRev);

    const kpiRevGrowth = doc.createElement('div');
    kpiRevGrowth.id = 'kpi-revenue-growth';
    doc.body.appendChild(kpiRevGrowth);

    // Test 30D period
    DashboardPage.setPeriod('30d');
    assert.strictEqual(DashboardPage.currentPeriod, '30d');
    assert.strictEqual(kpiViews.textContent, '48,250');
    assert.strictEqual(kpiImp.textContent, '142,800');
    assert.strictEqual(kpiRfqs.textContent, '38');
    assert.ok(kpiRev.textContent.includes('194,500'));

    // Test 7D period
    DashboardPage.setPeriod('7d');
    assert.strictEqual(DashboardPage.currentPeriod, '7d');
    assert.strictEqual(kpiViews.textContent, '11,098');
    assert.strictEqual(kpiImp.textContent, '32,844');

    // Test 6M period
    DashboardPage.setPeriod('6m');
    assert.strictEqual(DashboardPage.currentPeriod, '6m');
    assert.strictEqual(kpiViews.textContent, '270,200');

    // Test 1Y period
    DashboardPage.setPeriod('1y');
    assert.strictEqual(DashboardPage.currentPeriod, '1y');
    assert.strictEqual(kpiViews.textContent, '540,400');
  });

  await t.test('4. Interactive SVG Analytics Charts Generation', () => {
    const { doc } = setupDOM();
    I18n.init();

    const trafficContainer = doc.createElement('div');
    trafficContainer.id = 'dashboard-traffic-chart';
    doc.body.appendChild(trafficContainer);

    const revContainer = doc.createElement('div');
    revContainer.id = 'dashboard-revenue-chart';
    doc.body.appendChild(revContainer);

    // Render Traffic Chart
    DashboardPage.renderTrafficChart();
    assert.ok(trafficContainer.innerHTML.includes('<svg'), 'Traffic chart must contain SVG element');
    assert.ok(trafficContainer.innerHTML.includes('<path'), 'Traffic chart must contain line paths for views and impressions');
    assert.ok(trafficContainer.innerHTML.includes('<circle'), 'Traffic chart must contain interactive data dots');

    // Render Revenue Bar Chart
    DashboardPage.renderRevenueChart();
    assert.ok(revContainer.innerHTML.includes('<svg'), 'Revenue chart must contain SVG element');
    assert.ok(revContainer.innerHTML.includes('<rect'), 'Revenue chart must contain solid bar rects');
  });

  await t.test('5. Tab Switching & Dynamic Status Filter Population', () => {
    const { doc } = setupDOM();
    I18n.init();

    const statusSelect = doc.createElement('select');
    statusSelect.id = 'dashboard-status-filter';
    doc.body.appendChild(statusSelect);

    const tableContainer = doc.createElement('div');
    tableContainer.id = 'dashboard-table-container';
    doc.body.appendChild(tableContainer);

    // 1. Switch to Recipes tab
    DashboardPage.setActiveTab('recipes');
    assert.strictEqual(DashboardPage.activeTab, 'recipes');
    assert.ok(statusSelect.innerHTML.includes('published'), 'Recipes status filter should have published option');
    assert.ok(statusSelect.innerHTML.includes('draft'), 'Recipes status filter should have draft option');

    // 2. Switch to Supplies tab
    DashboardPage.setActiveTab('supplies');
    assert.strictEqual(DashboardPage.activeTab, 'supplies');
    assert.ok(statusSelect.innerHTML.includes('active'), 'Supplies filter should have active option');
    assert.ok(statusSelect.innerHTML.includes('in_stock'), 'Supplies filter should have in_stock option');
    assert.ok(statusSelect.innerHTML.includes('low_stock'), 'Supplies filter should have low_stock option');

    // 3. Switch to RFQs tab
    DashboardPage.setActiveTab('rfqs');
    assert.strictEqual(DashboardPage.activeTab, 'rfqs');
    assert.ok(statusSelect.innerHTML.includes('pending'), 'RFQs filter should have pending option');
    assert.ok(statusSelect.innerHTML.includes('quoted'), 'RFQs filter should have quoted option');
    assert.ok(statusSelect.innerHTML.includes('accepted'), 'RFQs filter should have accepted option');

    // 4. Switch to Enrollments tab
    DashboardPage.setActiveTab('enrollments');
    assert.strictEqual(DashboardPage.activeTab, 'enrollments');
    assert.ok(statusSelect.innerHTML.includes('paid'), 'Enrollments filter should have paid option');
  });

  await t.test('6. Management Tables Search & Filtering Operations', () => {
    const { doc } = setupDOM();
    I18n.init();

    // Recipes Search
    DashboardPage.activeTab = 'recipes';
    DashboardPage.searchQuery = 'واغيو';
    DashboardPage.statusFilter = 'all';
    let filtered = DashboardPage.getFilteredData();
    assert.ok(filtered.length > 0, 'Should find recipe matching Wagyu query');
    assert.ok(filtered.every(r => r.title_ar.includes('واغيو') || r.title_en.toLowerCase().includes('wagyu')));

    // Recipes Status Filter
    DashboardPage.searchQuery = '';
    DashboardPage.statusFilter = 'draft';
    filtered = DashboardPage.getFilteredData();
    assert.ok(filtered.every(r => r.status === 'draft'), 'All filtered recipes must have status draft');

    // Supplies Search
    DashboardPage.activeTab = 'supplies';
    DashboardPage.searchQuery = 'عجانة';
    DashboardPage.statusFilter = 'all';
    filtered = DashboardPage.getFilteredData();
    assert.ok(filtered.length > 0, 'Should find mixer in supplies');

    // RFQs Status Filter
    DashboardPage.activeTab = 'rfqs';
    DashboardPage.searchQuery = '';
    DashboardPage.statusFilter = 'pending';
    filtered = DashboardPage.getFilteredData();
    assert.ok(filtered.every(r => r.status === 'pending'), 'All filtered RFQs must have status pending');
  });

  await t.test('7. Interactive Actions: Toggle Status, Duplicate & Delete Items', () => {
    const { doc } = setupDOM();
    I18n.init();

    // 1. Toggle Recipe Status
    const recipesBefore = DashboardPage.getRecipes();
    const targetRecipe = recipesBefore[0];
    const initialStatus = targetRecipe.status;

    DashboardPage.handleToggleStatus('recipes', targetRecipe.id);
    const recipesAfterToggle = DashboardPage.getRecipes();
    const toggled = recipesAfterToggle.find(r => r.id === targetRecipe.id);
    assert.notStrictEqual(toggled.status, initialStatus, 'Recipe status must toggle between published and draft');

    // 2. Duplicate Recipe
    const countBeforeDup = recipesAfterToggle.length;
    DashboardPage.handleDuplicateItem('recipes', targetRecipe.id);
    const recipesAfterDup = DashboardPage.getRecipes();
    assert.strictEqual(recipesAfterDup.length, countBeforeDup + 1, 'Duplicating recipe must increase count by 1');
    assert.ok(recipesAfterDup[0].title_ar.includes('نسخة') || recipesAfterDup[0].title_en.includes('Copy'));

    // 3. Delete Recipe
    const delTarget = recipesAfterDup[0];
    const delIdInput = doc.createElement('input');
    delIdInput.id = 'delete-target-id';
    delIdInput.value = delTarget.id;
    doc.body.appendChild(delIdInput);

    const delTypeInput = doc.createElement('input');
    delTypeInput.id = 'delete-target-type';
    delTypeInput.value = 'recipes';
    doc.body.appendChild(delTypeInput);

    DashboardPage.handleConfirmDelete();
    const recipesAfterDel = DashboardPage.getRecipes();
    assert.strictEqual(recipesAfterDel.length, countBeforeDup, 'Item should be removed after deletion');
    assert.strictEqual(recipesAfterDel.find(r => r.id === delTarget.id), undefined);
  });

  await t.test('8. RFQ Quotation & Commercial Response Workflow', () => {
    const { doc } = setupDOM();
    I18n.init();

    const rfqs = DashboardPage.getRFQs();
    const pendingRfq = rfqs.find(r => r.status === 'pending');
    assert.ok(pendingRfq, 'Must have at least one pending RFQ');

    const targetIdInput = doc.createElement('input');
    targetIdInput.id = 'rfq-response-target-id';
    targetIdInput.value = pendingRfq.id;
    doc.body.appendChild(targetIdInput);

    const unitPriceInput = doc.createElement('input');
    unitPriceInput.id = 'rfq-input-unit-price';
    unitPriceInput.value = '14200';
    doc.body.appendChild(unitPriceInput);

    const leadTimeInput = doc.createElement('input');
    leadTimeInput.id = 'rfq-input-leadtime';
    leadTimeInput.value = '3 أيام عمل';
    doc.body.appendChild(leadTimeInput);

    const form = doc.createElement('form');
    DashboardPage.handleRfqResponseSubmit(form);

    const updatedRfqs = DashboardPage.getRFQs();
    const updated = updatedRfqs.find(r => r.id === pendingRfq.id);
    assert.strictEqual(updated.status, 'quoted', 'RFQ status should become quoted');
    assert.strictEqual(updated.quoted_price, 14200 * pendingRfq.quantity);
    assert.strictEqual(updated.lead_time, '3 أيام عمل');
  });

  await t.test('9. Add B2B Supply Product Submission', () => {
    const { doc } = setupDOM();
    I18n.init();

    const nameAr = doc.createElement('input');
    nameAr.id = 'supply-input-name-ar';
    nameAr.value = 'فرن بيتزا حجري تجاري';
    doc.body.appendChild(nameAr);

    const nameEn = doc.createElement('input');
    nameEn.id = 'supply-input-name-en';
    nameEn.value = 'Commercial Stone Pizza Oven';
    doc.body.appendChild(nameEn);

    const cat = doc.createElement('select');
    cat.id = 'supply-input-category';
    cat.value = 'heavy_equipment';
    doc.body.appendChild(cat);

    const price = doc.createElement('input');
    price.id = 'supply-input-price';
    price.value = '28500';
    doc.body.appendChild(price);

    const moq = doc.createElement('input');
    moq.id = 'supply-input-moq';
    moq.value = '1';
    doc.body.appendChild(moq);

    const stock = doc.createElement('input');
    stock.id = 'supply-input-stock';
    stock.value = '4';
    doc.body.appendChild(stock);

    const leadTime = doc.createElement('input');
    leadTime.id = 'supply-input-leadtime';
    leadTime.value = '5 أيام عمل';
    doc.body.appendChild(leadTime);

    const image = doc.createElement('input');
    image.id = 'supply-input-image';
    image.value = 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1';
    doc.body.appendChild(image);

    const countBefore = DashboardPage.getSupplies().length;
    const form = doc.createElement('form');
    DashboardPage.handleAddSupplySubmit(form);

    const suppliesAfter = DashboardPage.getSupplies();
    assert.strictEqual(suppliesAfter.length, countBefore + 1, 'Supplies count must increase by 1');
    assert.strictEqual(suppliesAfter[0].name_ar, 'فرن بيتزا حجري تجاري');
    assert.strictEqual(suppliesAfter[0].price, 28500);
    assert.strictEqual(suppliesAfter[0].status, 'active');
  });

  await t.test('10. Bilingual Synchronization & Translation Integrations', () => {
    const { doc, win } = setupDOM();
    I18n.init();

    // Arabic verification
    I18n.setLang('ar');
    assert.strictEqual(I18n.t('dashboard.title'), 'لوحة تحكم الأداء وإدارة الأعمال');
    assert.strictEqual(I18n.t('dashboard.kpi_views'), 'مشاهدات الملف والوصفات');
    assert.strictEqual(I18n.t('dashboard.kpi_revenue'), 'حجم المعاملات التقديري');
    assert.strictEqual(I18n.t('dashboard.tab_recipes'), 'إدارة الوصفات');
    assert.strictEqual(I18n.t('dashboard.tab_supplies'), 'كتالوج التوريدات');
    assert.strictEqual(I18n.t('dashboard.tab_rfqs'), 'عروض وطلبات الأسعار');
    assert.strictEqual(I18n.t('dashboard.tab_enrollments'), 'تسجيلات الورش والطلاب');

    // English verification
    I18n.setLang('en');
    assert.strictEqual(I18n.t('dashboard.title'), 'Performance & Business Dashboard');
    assert.strictEqual(I18n.t('dashboard.kpi_views'), 'Profile & Recipe Views');
    assert.strictEqual(I18n.t('dashboard.kpi_revenue'), 'Est. Commercial Volume');
    assert.strictEqual(I18n.t('dashboard.tab_recipes'), 'My Recipes');
    assert.strictEqual(I18n.t('dashboard.tab_supplies'), 'Supplies Catalog');
    assert.strictEqual(I18n.t('dashboard.tab_rfqs'), 'Quotations & RFQs');
    assert.strictEqual(I18n.t('dashboard.tab_enrollments'), 'Workshop Enrollments');
  });

});
