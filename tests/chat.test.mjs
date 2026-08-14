import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { Modal } from '../js/core/modal.js';
import { RFQManager } from '../js/modules/rfq.js';
import { ChatModule } from '../js/modules/chat-module.js';
import { ChatPage } from '../js/pages/chat.js';

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
      this.href = '';
      this.checked = false;
      this.elements = {};
      this.focused = false;
      this.clicked = false;
      this.files = [];
      this.scrollTop = 0;
      this.scrollHeight = 1000;
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

    insertAdjacentHTML(position, html) {
      const temp = new Element('div');
      temp.innerHTML = html;
      if (position === 'afterbegin') {
        for (let i = temp.children.length - 1; i >= 0; i--) {
          const ch = temp.children[i];
          ch.parentElement = this;
          this.children.unshift(ch);
        }
      } else {
        for (const ch of temp.children) {
          this.appendChild(ch);
        }
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
        else if (key === 'href') child.href = val;
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
    }
  };

  docMockRef = documentMock;

  const windowMock = {
    document: documentMock,
    innerWidth: 1200,
    location: {
      search: ''
    },
    matchMedia: () => ({ matches: true }),
    addEventListener(event, callback) {
      if (!listeners.has(windowMock)) {
        listeners.set(windowMock, new Map());
      }
      const elMap = listeners.get(windowMock);
      if (!elMap.has(event)) {
        elMap.set(event, []);
      }
      elMap.get(event).push(callback);
    },
    removeEventListener(event, callback) {
      const elMap = listeners.get(windowMock);
      if (elMap && elMap.has(event)) {
        const list = elMap.get(event);
        const idx = list.indexOf(callback);
        if (idx !== -1) list.splice(idx, 1);
      }
    },
    dispatchEvent(evt) {
      const elMap = listeners.get(windowMock);
      if (elMap && elMap.has(evt.type)) {
        const list = elMap.get(evt.type);
        for (const cb of list) {
          cb(evt);
        }
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

  globalThis.document = documentMock;
  globalThis.window = windowMock;
  globalThis.localStorage = localStorageMock;
  globalThis.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, params = {}) {
      this.type = type;
      this.detail = params.detail || null;
    }
  };

  return { documentMock, windowMock, localStorageMock, storage };
}

// Build standard Chat DOM fixture
function buildChatDOM(doc) {
  doc.body.innerHTML = '';
  const root = doc.createElement('div');
  root.innerHTML = `
    <div id="toast-container"></div>
    <aside id="chat-sidebar">
      <span id="unread-total-badge" class="hidden"></span>
      <input type="text" id="chat-search-input" />
      <div id="chat-tabs-container">
        <button type="button" data-chat-tab="all" class="bg-brand-gold text-white"></button>
        <button type="button" data-chat-tab="chef" class="bg-surface-2 text-text-muted"></button>
        <button type="button" data-chat-tab="supplier" class="bg-surface-2 text-text-muted"></button>
      </div>
      <div id="conversations-list"></div>
      <div id="conversations-empty" class="hidden"></div>
    </aside>

    <section id="chat-main-pane">
      <header id="chat-thread-header">
        <button type="button" id="chat-back-btn"></button>
        <img id="header-partner-avatar" src="" />
        <span id="header-partner-status-dot"></span>
        <h2 id="header-partner-name"></h2>
        <svg id="header-partner-verified"></svg>
        <span id="header-partner-role"></span>
        <span id="header-partner-status-text"></span>
        <a id="header-partner-profile-link" href="#"><span>عرض الملف</span></a>
        <button type="button" id="header-contact-btn"></button>
      </header>

      <div id="messages-stream">
        <div id="messages-container"></div>
        <div id="typing-indicator" class="hidden"></div>
      </div>

      <div id="quick-replies-bar">
        <button type="button" data-quick-reply="quick_1">هل يتوفر شحن فوري ومجاني للرياض؟</button>
        <button type="button" data-quick-reply="quick_2">يسعدنا اعتماد العرض والبدء في إجراءات التوريد.</button>
      </div>

      <div id="attachment-preview" class="hidden">
        <span id="attachment-filename"></span>
        <button type="button" id="remove-attachment-btn"></button>
      </div>

      <form id="chat-composer-form">
        <input type="file" id="chat-file-input" />
        <button type="button" id="chat-attach-btn"></button>
        <input type="text" id="chat-message-input" />
        <button type="submit" id="chat-send-btn"></button>
      </form>
    </section>

    <div id="empty-chat-state" class="hidden"></div>

    <div id="counter-offer-modal" class="hidden">
      <form id="counter-offer-form">
        <img id="counter-item-img" src="" />
        <h4 id="counter-item-name"></h4>
        <span id="counter-item-qty"></span>
        <span id="counter-current-price"></span>
        <input type="number" id="counter-unit-price-input" value="12000" />
        <span id="counter-calculated-total">24,000 ر.س</span>
        <textarea id="counter-notes-input"></textarea>
        <button type="submit" id="submit-counter-offer-btn"></button>
      </form>
    </div>
  `;
  doc.body.appendChild(root);
}

// ---------------------- TEST SUITE ----------------------

test('ChatModule - Initial Seeding, Storage Persistence, and Lookup', () => {
  setupDOM();
  localStorage.clear();

  const initialChats = ChatModule.getInitialChats();
  assert.ok(Array.isArray(initialChats) && initialChats.length >= 3, 'Initial chats should be populated');

  // getChats seeds localStorage
  const chats = ChatModule.getChats();
  assert.strictEqual(chats.length, initialChats.length);
  assert.ok(localStorage.getItem(ChatModule.STORAGE_KEY), 'Chats must be saved to localStorage');

  // Lookup by ID
  const chat1 = ChatModule.getChatById('chat-1');
  assert.ok(chat1, 'chat-1 must exist');
  assert.strictEqual(chat1.partner?.role, 'supplier');
  assert.ok(chat1.rfq_card, 'chat-1 has RFQ card');

  // Lookup by partner ID
  const supplierChat = ChatModule.getChatByPartnerId('supplier-1');
  assert.strictEqual(supplierChat?.id, 'chat-1');

  const chefChat = ChatModule.getChatByPartnerId('chef-2');
  assert.strictEqual(chefChat?.id, 'chat-2');

  // Lookup by RFQ ID
  const rfqChat = ChatModule.getChatByRFQId('rfq-9801');
  assert.strictEqual(rfqChat?.id, 'chat-1');
});

test('ChatModule - Conversation Creation and Idempotency', () => {
  setupDOM();
  localStorage.clear();

  // Existing partner returns existing chat
  const existing = ChatModule.createOrGetChat({
    partner: { id: 'supplier-1', name_ar: 'شركة الفنار', role: 'supplier' }
  });
  assert.strictEqual(existing.id, 'chat-1');

  // New partner creates and prepends chat
  const newPartner = {
    id: 'chef-custom-99',
    name_ar: 'شيف سلطان النعيمي',
    name_en: 'Chef Sultan Al-Nuaimi',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c',
    role: 'chef',
    verified: true,
    online: true
  };

  const created = ChatModule.createOrGetChat({
    partner: newPartner,
    initialMessage: {
      text_ar: 'أهلاً شيف سلطان، يسعدني التواصل معك.',
      text_en: 'Hello Chef Sultan, glad to connect.'
    }
  });

  assert.ok(created.id.startsWith('chat-'));
  assert.strictEqual(created.partner.id, 'chef-custom-99');
  assert.strictEqual(created.messages.length, 1);

  const freshChats = ChatModule.getChats();
  assert.strictEqual(freshChats[0].id, created.id, 'New chat must be prepended to storage');
});

test('ChatModule - Message Sending, Read Receipts, and Event Dispatch', () => {
  setupDOM();
  localStorage.clear();

  let sentEventFired = false;
  let receivedDetail = null;

  window.addEventListener('meyar:message-sent', (e) => {
    sentEventFired = true;
    receivedDetail = e.detail;
  });

  const msg = ChatModule.sendMessage('chat-1', {
    text: 'هل السعر يشمل الضريبة المضافة والتوصيل؟',
    sender: 'me'
  });

  assert.ok(msg, 'Message should be returned');
  assert.strictEqual(msg.sender, 'me');
  assert.strictEqual(msg.text_ar, 'هل السعر يشمل الضريبة المضافة والتوصيل؟');
  assert.ok(sentEventFired, 'meyar:message-sent event must be broadcasted');
  assert.strictEqual(receivedDetail.chatId, 'chat-1');

  const updatedChat1 = ChatModule.getChatById('chat-1');
  assert.strictEqual(updatedChat1.last_message_ar, 'هل السعر يشمل الضريبة المضافة والتوصيل؟');

  // Partner message increments unread count
  ChatModule.sendMessage('chat-2', {
    text_ar: 'نعم بالتأكيد يا شيف!',
    text_en: 'Yes absolutely Chef!',
    sender: 'partner'
  });
  const updatedChat2 = ChatModule.getChatById('chat-2');
  assert.strictEqual(updatedChat2.unread_count, 1);

  // markAsRead resets unread count
  ChatModule.markAsRead('chat-2');
  assert.strictEqual(ChatModule.getChatById('chat-2').unread_count, 0);
});

test('ChatModule - RFQ Card Negotiation Status & Price Updates', () => {
  setupDOM();
  localStorage.clear();

  let rfqStatusChangedFired = false;
  window.addEventListener('meyar:rfq-status-changed', () => {
    rfqStatusChangedFired = true;
  });

  // Approve quote
  const approved = ChatModule.updateRFQStatus('chat-1', 'rfq-9801', 'accepted');
  assert.strictEqual(approved, true);

  let chat = ChatModule.getChatById('chat-1');
  assert.strictEqual(chat.rfq_card.status, 'accepted');
  assert.ok(rfqStatusChangedFired);

  // Submit counter offer
  const countered = ChatModule.updateRFQStatus('chat-1', 'rfq-9801', 'countered', {
    unit_price: 12500,
    total_price: 25000,
    notes: 'طلب خصم للدفعة الأولى'
  });
  assert.strictEqual(countered, true);

  chat = ChatModule.getChatById('chat-1');
  assert.strictEqual(chat.rfq_card.status, 'countered');
  assert.strictEqual(chat.rfq_card.unit_price, 12500);
  assert.strictEqual(chat.rfq_card.total_price, 25000);
  assert.strictEqual(chat.rfq_card.counter_notes, 'طلب خصم للدفعة الأولى');
});

test('ChatModule - Filter & Search Normalization (Arabic & English)', () => {
  setupDOM();
  localStorage.clear();

  // Category filter
  const all = ChatModule.filterChats('all');
  assert.ok(all.length >= 3);

  const chefs = ChatModule.filterChats('chef');
  assert.ok(chefs.every(c => c.partner?.role === 'chef'));

  const suppliers = ChatModule.filterChats('supplier');
  assert.ok(suppliers.every(c => c.partner?.role === 'supplier'));

  // Search by partner name Arabic
  const searchAr = ChatModule.filterChats('all', 'الفنار');
  assert.strictEqual(searchAr.length, 1);
  assert.strictEqual(searchAr[0].id, 'chat-1');

  // Search by partner name English
  const searchEn = ChatModule.filterChats('all', 'Elena');
  assert.strictEqual(searchEn.length, 1);
  assert.strictEqual(searchEn[0].id, 'chat-2');

  // Search by RFQ product name
  const searchRFQ = ChatModule.filterChats('all', 'عجانة');
  assert.strictEqual(searchRFQ.length, 1);
  assert.strictEqual(searchRFQ[0].id, 'chat-1');
});

test('ChatModule - Simulated Contextual Partner Reply', async () => {
  setupDOM();
  localStorage.clear();

  // Supplier reply on price discount query
  const replySupplier = await ChatModule.simulatePartnerReply('chat-1', 'هل يمكن تقديم خصم إضافي؟', 0);
  assert.ok(replySupplier);
  assert.strictEqual(replySupplier.sender, 'partner');
  assert.ok(replySupplier.text_ar.includes('خصم') || replySupplier.text_ar.includes('جدول'));

  // Chef reply on masterclass / workshop query
  const replyChef = await ChatModule.simulatePartnerReply('chat-2', 'يسعدني التنسيق لورشة عمل مشتركة', 0);
  assert.ok(replyChef);
  assert.strictEqual(replyChef.sender, 'partner');
  assert.ok(replyChef.text_ar.includes('ورشة') || replyChef.text_ar.includes('التنسيق'));
});

test('ChatPage - URL Query Parameter Binding', () => {
  const { documentMock, windowMock } = setupDOM();
  buildChatDOM(documentMock);
  localStorage.clear();

  // 1. Direct Chat ID
  windowMock.location.search = '?id=chat-2';
  ChatPage.init();
  assert.strictEqual(ChatPage.activeChatId, 'chat-2');

  // 2. Direct Chef ID
  windowMock.location.search = '?chef=chef-2';
  ChatPage.init();
  assert.strictEqual(ChatPage.activeChatId, 'chat-2');

  // 3. Direct Supplier ID
  windowMock.location.search = '?supplier=supplier-1';
  ChatPage.init();
  assert.strictEqual(ChatPage.activeChatId, 'chat-1');

  // 4. Direct RFQ ID
  windowMock.location.search = '?rfq=rfq-9801';
  ChatPage.init();
  assert.strictEqual(ChatPage.activeChatId, 'chat-1');
});

test('ChatPage - Conversation List & Active Thread Rendering', () => {
  const { documentMock } = setupDOM();
  buildChatDOM(documentMock);
  localStorage.clear();

  ChatPage.init();
  ChatPage.selectChat('chat-1');

  const listEl = documentMock.getElementById('conversations-list');
  assert.ok(listEl.innerHTML.includes('data-chat-id="chat-1"'));
  assert.ok(listEl.innerHTML.includes('Al-Fannar') || listEl.innerHTML.includes('الفنار'));

  const headerName = documentMock.getElementById('header-partner-name');
  assert.ok(headerName.textContent.includes('الفنار') || headerName.textContent.includes('Al-Fannar'));

  const msgContainer = documentMock.getElementById('messages-container');
  assert.ok(msgContainer.innerHTML.includes('عجانة') || msgContainer.innerHTML.includes('Spiral Mixer') || msgContainer.innerHTML.includes('RFQ'));
});

test('ChatPage - RFQ Negotiation Card Actions (Approve Quote & Counter-Offer)', () => {
  const { documentMock } = setupDOM();
  buildChatDOM(documentMock);
  localStorage.clear();

  ChatPage.init();
  ChatPage.selectChat('chat-1');

  // 1. Open Counter Modal
  ChatPage.handleOpenCounterModal('chat-1', 'rfq-9801');
  assert.strictEqual(ChatPage.activeCounterData?.chatId, 'chat-1');
  const modalName = documentMock.getElementById('counter-item-name');
  assert.ok(modalName.textContent.length > 0);

  // 2. Submit Counter Offer
  const priceInput = documentMock.getElementById('counter-unit-price-input');
  priceInput.value = '12000';
  const notesInput = documentMock.getElementById('counter-notes-input');
  notesInput.value = 'طلب تخفيض السعر للدفعة الأولى';

  ChatPage.handleSubmitCounterOffer();

  let chat = ChatModule.getChatById('chat-1');
  assert.strictEqual(chat.rfq_card.status, 'countered');
  assert.strictEqual(chat.rfq_card.unit_price, 12000);

  // 3. Approve Quote
  ChatPage.handleApproveQuote('chat-1', 'rfq-9801');
  chat = ChatModule.getChatById('chat-1');
  assert.strictEqual(chat.rfq_card.status, 'accepted');
});

test('ChatPage - Message Sending from Composer & Quick Replies', () => {
  const { documentMock } = setupDOM();
  buildChatDOM(documentMock);
  localStorage.clear();

  ChatPage.init();
  ChatPage.selectChat('chat-1');

  const input = documentMock.getElementById('chat-message-input');
  input.value = 'هل يمكن جدولة موعد المعاينة الفنية؟';

  ChatPage.handleSendMessage();

  const chat = ChatModule.getChatById('chat-1');
  const lastMsg = chat.messages[chat.messages.length - 1];
  assert.strictEqual(lastMsg.text_ar, 'هل يمكن جدولة موعد المعاينة الفنية؟');
  assert.strictEqual(input.value, '', 'Input should be cleared after send');
});

test('ChatPage - Language Change Event Re-rendering', () => {
  const { documentMock } = setupDOM();
  buildChatDOM(documentMock);
  localStorage.clear();

  I18n.setLang('ar');
  ChatPage.init();
  ChatPage.selectChat('chat-1');

  // Switch to English
  I18n.setLang('en');
  window.dispatchEvent(new CustomEvent('meyar:lang-changed', { detail: { lang: 'en' } }));

  const headerName = documentMock.getElementById('header-partner-name');
  assert.ok(headerName.textContent.includes('Al-Fannar') || headerName.textContent.includes('Kitchens'));
});

test('Chat Page HTML - Solid Surfaces & Strict Design System Compliance', () => {
  const htmlPath = path.resolve(process.cwd(), 'chat.html');
  assert.ok(fs.existsSync(htmlPath), 'chat.html must exist on disk');

  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1. Anti-FOUC script
  assert.ok(html.includes('meyar_theme') && html.includes('meyar_lang'), 'Anti-FOUC script must be in <head>');

  // 2. Strict zero glassmorphism / zero backdrop-blur
  assert.ok(!html.includes('backdrop-blur'), 'Forbidden backdrop-blur must not be used');
  assert.ok(!html.includes('bg-opacity-'), 'Forbidden bg-opacity must not be used');

  // 3. Strict Solid Surfaces classes
  assert.ok(html.includes('bg-surface-1'), 'Must use solid bg-surface-1');
  assert.ok(html.includes('bg-surface-2'), 'Must use solid bg-surface-2');
  assert.ok(html.includes('border-border-subtle'), 'Must use border-border-subtle');

  // 4. Critical components exist
  assert.ok(html.includes('id="chat-sidebar"'), 'Sidebar container must exist');
  assert.ok(html.includes('id="chat-main-pane"'), 'Main chat pane must exist');
  assert.ok(html.includes('id="conversations-list"'), 'Conversations list container must exist');
  assert.ok(html.includes('id="messages-stream"'), 'Messages stream container must exist');
  assert.ok(html.includes('id="chat-composer-form"'), 'Composer form must exist');
  assert.ok(html.includes('id="counter-offer-modal"'), 'Counter offer modal must exist');
  assert.ok(html.includes('id="search-modal"'), 'Search palette modal must exist');

  // 5. CSS output stylesheet link
  assert.ok(html.includes('href="./css/output.css"'), 'Must link to compiled output.css');
});
