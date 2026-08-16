import test from 'node:test';
import assert from 'node:assert/strict';
import { I18n } from '../js/core/i18n.js';
import { Toast } from '../js/core/toast.js';
import { AuthPage } from '../js/pages/auth.js';

// Setup Mock DOM environment for testing Auth page
function setupDOM(initialUrl = 'http://localhost/auth.html') {
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
      this.value = '';
      this.checked = false;
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

      if (!stopped && docMockRef) {
        docMockRef.dispatchEvent(evt);
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

    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];
      if (html.includes('<button')) {
        const btn = new Element('button');
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-label', 'Close');
        this.appendChild(btn);
      }
      if (html.includes('<h4')) {
        const h4 = new Element('h4');
        this.appendChild(h4);
      }
      if (html.includes('<p')) {
        const p = new Element('p');
        this.appendChild(p);
      }
    }

    get innerHTML() {
      return this._innerHTML;
    }

    set textContent(val) {
      this._textContent = String(val);
    }

    get textContent() {
      return this._textContent !== undefined ? this._textContent : '';
    }
  }

  const documentElement = new Element('html');
  documentElement.setAttribute('lang', 'ar');
  documentElement.setAttribute('dir', 'rtl');

  const body = new Element('body');
  documentElement.appendChild(body);

  const doc = {
    documentElement,
    body,
    readyState: 'complete',
    createElement(tagName) {
      return new Element(tagName);
    },
    getElementById(id) {
      const find = (node) => {
        if (node.id === id) return node;
        for (const child of node.children) {
          const found = find(child);
          if (found) return found;
        }
        return null;
      };
      return find(documentElement);
    },
    querySelector(selector) {
      return documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      return documentElement.querySelectorAll(selector);
    },
    addEventListener(event, callback) {
      if (!listeners.has(this)) {
        listeners.set(this, new Map());
      }
      const docMap = listeners.get(this);
      if (!docMap.has(event)) {
        docMap.set(event, []);
      }
      docMap.get(event).push(callback);
    },
    dispatchEvent(evt) {
      evt.target = evt.target || this;
      evt.currentTarget = this;
      const docMap = listeners.get(this);
      const handlers = (docMap && docMap.get(evt.type)) || [];
      for (const h of handlers) {
        h(evt);
      }
      return true;
    }
  };

  docMockRef = doc;

  const storageMock = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  const parsedUrl = new URL(initialUrl);

  const windowListeners = new Map();
  const win = {
    location: {
      href: parsedUrl.href,
      search: parsedUrl.search,
      pathname: parsedUrl.pathname
    },
    history: {
      replaceState: (state, title, url) => {
        win.location.href = url;
        const newParsed = new URL(url, 'http://localhost');
        win.location.search = newParsed.search;
      }
    },
    localStorage: storageMock,
    addEventListener(event, callback) {
      if (!windowListeners.has(event)) {
        windowListeners.set(event, []);
      }
      windowListeners.get(event).push(callback);
    },
    dispatchEvent(evt) {
      const handlers = windowListeners.get(evt.type) || [];
      for (const h of handlers) {
        h(evt);
      }
      return true;
    },
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
  };

  globalThis.document = doc;
  globalThis.window = win;
  globalThis.localStorage = storageMock;
  globalThis.requestAnimationFrame = (cb) => { cb(); };
  Toast.container = null;
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, eventInitDict = {}) {
      this.type = type;
      this.detail = eventInitDict.detail || null;
      this.bubbles = !!eventInitDict.bubbles;
      this.cancelable = !!eventInitDict.cancelable;
    }
  };

  return { doc, win, storage, storageMock, Element };
}

// Build standard Auth DOM structure
function buildAuthDOMStructure(doc) {
  // Title and subtitle
  const title = doc.createElement('h1');
  title.id = 'auth-title';
  title.setAttribute('data-i18n', 'auth.welcome_back');
  title.textContent = 'مرحباً بعودتك إلى معيار';
  doc.body.appendChild(title);

  const subtitle = doc.createElement('p');
  subtitle.id = 'auth-subtitle';
  subtitle.setAttribute('data-i18n', 'auth.subtitle_login');
  subtitle.textContent = 'أدخل بيانات اعتمادك للوصول إلى مساحتك المطبخية وإدارة أعمالك';
  doc.body.appendChild(subtitle);

  // Tab buttons
  const tabLogin = doc.createElement('button');
  tabLogin.id = 'tab-login-btn';
  tabLogin.setAttribute('data-auth-tab', 'login');
  tabLogin.setAttribute('aria-selected', 'true');
  tabLogin.className = 'bg-surface-1 text-text-main shadow-sm border-border-subtle font-bold';
  doc.body.appendChild(tabLogin);

  const tabRegister = doc.createElement('button');
  tabRegister.id = 'tab-register-btn';
  tabRegister.setAttribute('data-auth-tab', 'register');
  tabRegister.setAttribute('aria-selected', 'false');
  tabRegister.className = 'text-text-muted font-medium border-transparent';
  doc.body.appendChild(tabRegister);

  // Switch links
  const switchToRegister = doc.createElement('button');
  switchToRegister.setAttribute('data-action', 'switch-to-register');
  doc.body.appendChild(switchToRegister);

  const switchToLogin = doc.createElement('button');
  switchToLogin.setAttribute('data-action', 'switch-to-login');
  doc.body.appendChild(switchToLogin);

  // LOGIN FORM
  const loginForm = doc.createElement('form');
  loginForm.id = 'login-form';
  loginForm.setAttribute('data-auth-form', 'login');

  const loginEmail = doc.createElement('input');
  loginEmail.id = 'login-email';
  loginEmail.value = 'faisal@meyar.sa';
  loginForm.appendChild(loginEmail);

  const loginPwdWrap = doc.createElement('div');
  loginPwdWrap.className = 'password-wrapper';
  const loginPwd = doc.createElement('input');
  loginPwd.id = 'login-password';
  loginPwd.setAttribute('type', 'password');
  loginPwd.value = 'Secret123!';
  const loginPwdToggle = doc.createElement('button');
  loginPwdToggle.setAttribute('data-action', 'toggle-password');
  loginPwdToggle.setAttribute('data-target', 'login-password');
  const eye1 = doc.createElement('span');
  eye1.className = 'icon-eye';
  const eyeOff1 = doc.createElement('span');
  eyeOff1.className = 'icon-eye-off hidden';
  loginPwdToggle.appendChild(eye1);
  loginPwdToggle.appendChild(eyeOff1);
  loginPwdWrap.appendChild(loginPwd);
  loginPwdWrap.appendChild(loginPwdToggle);
  loginForm.appendChild(loginPwdWrap);

  const loginRemember = doc.createElement('input');
  loginRemember.id = 'login-remember';
  loginRemember.checked = true;
  loginForm.appendChild(loginRemember);

  doc.body.appendChild(loginForm);

  // REGISTER FORM
  const registerForm = doc.createElement('form');
  registerForm.id = 'register-form';
  registerForm.setAttribute('data-auth-form', 'register');
  registerForm.classList.add('hidden');

  // Role selector cards
  const roleChef = doc.createElement('div');
  roleChef.setAttribute('data-role', 'chef');
  roleChef.setAttribute('aria-checked', 'true');
  roleChef.className = 'border-brand-gold bg-surface-1 ring-2 ring-brand-gold';
  const checkChef = doc.createElement('div');
  checkChef.className = 'role-check-indicator';
  roleChef.appendChild(checkChef);
  registerForm.appendChild(roleChef);

  const roleEnthusiast = doc.createElement('div');
  roleEnthusiast.setAttribute('data-role', 'enthusiast');
  roleEnthusiast.setAttribute('aria-checked', 'false');
  roleEnthusiast.className = 'border-border-subtle bg-surface-2';
  const checkEnthusiast = doc.createElement('div');
  checkEnthusiast.className = 'role-check-indicator hidden';
  roleEnthusiast.appendChild(checkEnthusiast);
  registerForm.appendChild(roleEnthusiast);

  const roleSupplier = doc.createElement('div');
  roleSupplier.setAttribute('data-role', 'supplier');
  roleSupplier.setAttribute('aria-checked', 'false');
  roleSupplier.className = 'border-border-subtle bg-surface-2';
  const checkSupplier = doc.createElement('div');
  checkSupplier.className = 'role-check-indicator hidden';
  roleSupplier.appendChild(checkSupplier);
  registerForm.appendChild(roleSupplier);

  const hiddenRole = doc.createElement('input');
  hiddenRole.id = 'register-role';
  hiddenRole.value = 'chef';
  registerForm.appendChild(hiddenRole);

  const regName = doc.createElement('input');
  regName.id = 'register-fullname';
  regName.value = 'الشيف فيصل الهاشمي';
  registerForm.appendChild(regName);

  const regEmail = doc.createElement('input');
  regEmail.id = 'register-email';
  regEmail.value = 'newchef@meyar.sa';
  registerForm.appendChild(regEmail);

  const bizGroup = doc.createElement('div');
  bizGroup.id = 'business-name-group';
  const regBiz = doc.createElement('input');
  regBiz.id = 'register-business';
  regBiz.value = 'استوديو نجد للطهي';
  bizGroup.appendChild(regBiz);
  registerForm.appendChild(bizGroup);

  const regPwdWrap = doc.createElement('div');
  regPwdWrap.className = 'password-wrapper';
  const regPwd = doc.createElement('input');
  regPwd.id = 'register-password';
  regPwd.setAttribute('type', 'password');
  regPwd.value = 'Password123!';
  const regPwdToggle = doc.createElement('button');
  regPwdToggle.setAttribute('data-action', 'toggle-password');
  regPwdToggle.setAttribute('data-target', 'register-password');
  const eye2 = doc.createElement('span');
  eye2.className = 'icon-eye';
  const eyeOff2 = doc.createElement('span');
  eyeOff2.className = 'icon-eye-off hidden';
  regPwdToggle.appendChild(eye2);
  regPwdToggle.appendChild(eyeOff2);
  regPwdWrap.appendChild(regPwd);
  regPwdWrap.appendChild(regPwdToggle);
  registerForm.appendChild(regPwdWrap);

  const regConfirmWrap = doc.createElement('div');
  regConfirmWrap.className = 'password-wrapper';
  const regConfirm = doc.createElement('input');
  regConfirm.id = 'register-confirm-password';
  regConfirm.setAttribute('type', 'password');
  regConfirm.value = 'Password123!';
  const regConfirmToggle = doc.createElement('button');
  regConfirmToggle.setAttribute('data-action', 'toggle-password');
  regConfirmToggle.setAttribute('data-target', 'register-confirm-password');
  const eye3 = doc.createElement('span');
  eye3.className = 'icon-eye';
  const eyeOff3 = doc.createElement('span');
  eyeOff3.className = 'icon-eye-off hidden';
  regConfirmToggle.appendChild(eye3);
  regConfirmToggle.appendChild(eyeOff3);
  regConfirmWrap.appendChild(regConfirm);
  regConfirmWrap.appendChild(regConfirmToggle);
  registerForm.appendChild(regConfirmWrap);

  const regTerms = doc.createElement('input');
  regTerms.id = 'register-terms';
  regTerms.checked = true;
  registerForm.appendChild(regTerms);

  doc.body.appendChild(registerForm);

  // Social buttons
  const googleBtn = doc.createElement('button');
  googleBtn.setAttribute('data-social', 'google');
  doc.body.appendChild(googleBtn);

  const appleBtn = doc.createElement('button');
  appleBtn.setAttribute('data-social', 'apple');
  doc.body.appendChild(appleBtn);
}

// ------------------- TEST SUITES -------------------

test('AuthPage - Email Validation Helper', () => {
  assert.strictEqual(AuthPage.isValidEmail('faisal@meyar.sa'), true);
  assert.strictEqual(AuthPage.isValidEmail('chef.elena@domain.co.uk'), true);
  assert.strictEqual(AuthPage.isValidEmail('vendor+testing@sub.domain.org'), true);

  assert.strictEqual(AuthPage.isValidEmail(''), false);
  assert.strictEqual(AuthPage.isValidEmail('notanemail'), false);
  assert.strictEqual(AuthPage.isValidEmail('user@'), false);
  assert.strictEqual(AuthPage.isValidEmail('@domain.com'), false);
  assert.strictEqual(AuthPage.isValidEmail('user@domain'), false);
  assert.strictEqual(AuthPage.isValidEmail(null), false);
  assert.strictEqual(AuthPage.isValidEmail(12345), false);
});

test('AuthPage - Tab Switching (Login to Register and back)', () => {
  const { doc } = setupDOM();
  buildAuthDOMStructure(doc);

  // 1. Initial State
  assert.strictEqual(AuthPage.activeTab, 'login');

  // 2. Switch to Register
  let tabEventFired = null;
  window.addEventListener('meyar:auth-tab-changed', (e) => {
    tabEventFired = e.detail.tab;
  });

  const returnedTab = AuthPage.switchTab('register');
  assert.strictEqual(returnedTab, 'register');
  assert.strictEqual(AuthPage.activeTab, 'register');
  assert.strictEqual(tabEventFired, 'register');

  const tabLogin = doc.getElementById('tab-login-btn');
  const tabRegister = doc.getElementById('tab-register-btn');
  assert.strictEqual(tabLogin.getAttribute('aria-selected'), 'false');
  assert.strictEqual(tabRegister.getAttribute('aria-selected'), 'true');
  assert.strictEqual(tabRegister.classList.contains('bg-surface-1'), true);

  const loginForm = doc.getElementById('login-form');
  const registerForm = doc.getElementById('register-form');
  assert.strictEqual(loginForm.classList.contains('hidden'), true);
  assert.strictEqual(registerForm.classList.contains('hidden'), false);

  const title = doc.getElementById('auth-title');
  const subtitle = doc.getElementById('auth-subtitle');
  assert.strictEqual(title.getAttribute('data-i18n'), 'auth.create_account');
  assert.strictEqual(subtitle.getAttribute('data-i18n'), 'auth.subtitle_register');

  // 3. Switch back to Login
  AuthPage.switchTab('login');
  assert.strictEqual(AuthPage.activeTab, 'login');
  assert.strictEqual(tabLogin.getAttribute('aria-selected'), 'true');
  assert.strictEqual(tabRegister.getAttribute('aria-selected'), 'false');
  assert.strictEqual(loginForm.classList.contains('hidden'), false);
  assert.strictEqual(registerForm.classList.contains('hidden'), true);
  assert.strictEqual(title.getAttribute('data-i18n'), 'auth.welcome_back');
});

test('AuthPage - 3-Role Selection & State Management', () => {
  const { doc } = setupDOM();
  buildAuthDOMStructure(doc);

  let roleEventFired = null;
  window.addEventListener('meyar:auth-role-changed', (e) => {
    roleEventFired = e.detail.role;
  });

  // 1. Select Enthusiast Role
  const res1 = AuthPage.selectRole('enthusiast');
  assert.strictEqual(res1, 'enthusiast');
  assert.strictEqual(AuthPage.selectedRole, 'enthusiast');
  assert.strictEqual(roleEventFired, 'enthusiast');

  const cardChef = doc.querySelector('[data-role="chef"]');
  const cardEnthusiast = doc.querySelector('[data-role="enthusiast"]');
  const cardSupplier = doc.querySelector('[data-role="supplier"]');

  assert.strictEqual(cardEnthusiast.getAttribute('aria-checked'), 'true');
  assert.strictEqual(cardEnthusiast.classList.contains('border-brand-gold'), true);
  assert.strictEqual(cardEnthusiast.classList.contains('ring-2'), true);

  assert.strictEqual(cardChef.getAttribute('aria-checked'), 'false');
  assert.strictEqual(cardSupplier.getAttribute('aria-checked'), 'false');

  const roleInput = doc.getElementById('register-role');
  assert.strictEqual(roleInput.value, 'enthusiast');

  const bizGroup = doc.getElementById('business-name-group');
  assert.strictEqual(bizGroup.classList.contains('hidden'), true);

  // 2. Select Supplier Role
  AuthPage.selectRole('supplier');
  assert.strictEqual(AuthPage.selectedRole, 'supplier');
  assert.strictEqual(cardSupplier.getAttribute('aria-checked'), 'true');
  assert.strictEqual(bizGroup.classList.contains('hidden'), false);
  assert.strictEqual(roleInput.value, 'supplier');

  // 3. Invalid role fallback
  AuthPage.selectRole('unknown_role');
  assert.strictEqual(AuthPage.selectedRole, 'chef');
  assert.strictEqual(cardChef.getAttribute('aria-checked'), 'true');
});

test('AuthPage - Password Visibility Toggling', () => {
  const { doc } = setupDOM();
  buildAuthDOMStructure(doc);

  const toggleBtn = doc.querySelector('[data-target="login-password"]');
  const pwdInput = doc.getElementById('login-password');
  const eyeIcon = toggleBtn.querySelector('.icon-eye');
  const eyeOffIcon = toggleBtn.querySelector('.icon-eye-off');

  assert.strictEqual(pwdInput.getAttribute('type'), 'password');

  // First toggle -> reveals text
  const type1 = AuthPage.togglePasswordVisibility(toggleBtn);
  assert.strictEqual(type1, 'text');
  assert.strictEqual(pwdInput.getAttribute('type'), 'text');
  assert.strictEqual(toggleBtn.getAttribute('aria-pressed'), 'true');
  assert.strictEqual(eyeIcon.classList.contains('hidden'), true);
  assert.strictEqual(eyeOffIcon.classList.contains('hidden'), false);

  // Second toggle -> hides back to password
  const type2 = AuthPage.togglePasswordVisibility(toggleBtn);
  assert.strictEqual(type2, 'password');
  assert.strictEqual(pwdInput.getAttribute('type'), 'password');
  assert.strictEqual(toggleBtn.getAttribute('aria-pressed'), 'false');
  assert.strictEqual(eyeIcon.classList.contains('hidden'), false);
  assert.strictEqual(eyeOffIcon.classList.contains('hidden'), true);
});

test('AuthPage - Form Submission: Login Validation and Session State', () => {
  const { doc, storage } = setupDOM();
  buildAuthDOMStructure(doc);

  const emailInput = doc.getElementById('login-email');
  const pwdInput = doc.getElementById('login-password');

  // 1. Missing fields
  emailInput.value = '';
  const fail1 = AuthPage.handleLogin();
  assert.strictEqual(fail1.success, false);
  assert.strictEqual(fail1.error, 'missing_fields');

  // 2. Invalid email format
  emailInput.value = 'invalid-email-format';
  const fail2 = AuthPage.handleLogin();
  assert.strictEqual(fail2.success, false);
  assert.strictEqual(fail2.error, 'invalid_email');

  // 3. Valid Login
  emailInput.value = 'faisal@meyar.sa';
  pwdInput.value = 'ValidPass123';
  const successLogin = AuthPage.handleLogin();
  assert.strictEqual(successLogin.success, true);
  assert.strictEqual(successLogin.user.email, 'faisal@meyar.sa');

  // Verify in-memory session
  const currentUser = AuthPage.getCurrentUser();
  assert.strictEqual(currentUser.email, 'faisal@meyar.sa');
  assert.strictEqual(currentUser.role, 'chef');
});

test('AuthPage - Form Submission: Register Validation and Session State', () => {
  const { doc } = setupDOM();
  buildAuthDOMStructure(doc);

  AuthPage.selectRole('supplier');

  const nameInput = doc.getElementById('register-fullname');
  const emailInput = doc.getElementById('register-email');
  const pwdInput = doc.getElementById('register-password');
  const confirmInput = doc.getElementById('register-confirm-password');
  const termsInput = doc.getElementById('register-terms');

  // 1. Missing fields
  nameInput.value = '';
  const fail1 = AuthPage.handleRegister();
  assert.strictEqual(fail1.success, false);
  assert.strictEqual(fail1.error, 'missing_fields');

  // 2. Invalid Email
  nameInput.value = 'مورد الأغذية الفاخرة';
  emailInput.value = 'invalid-email';
  const fail2 = AuthPage.handleRegister();
  assert.strictEqual(fail2.success, false);
  assert.strictEqual(fail2.error, 'invalid_email');

  // 3. Password too short (< 6)
  emailInput.value = 'supplier@meyar.sa';
  pwdInput.value = '123';
  confirmInput.value = '123';
  const fail3 = AuthPage.handleRegister();
  assert.strictEqual(fail3.success, false);
  assert.strictEqual(fail3.error, 'password_too_short');

  // 4. Password mismatch
  pwdInput.value = 'Secret123!';
  confirmInput.value = 'Mismatch123!';
  const fail4 = AuthPage.handleRegister();
  assert.strictEqual(fail4.success, false);
  assert.strictEqual(fail4.error, 'password_mismatch');

  // 5. Terms not accepted
  confirmInput.value = 'Secret123!';
  termsInput.checked = false;
  const fail5 = AuthPage.handleRegister();
  assert.strictEqual(fail5.success, false);
  assert.strictEqual(fail5.error, 'terms_not_accepted');

  // 6. Valid Registration
  termsInput.checked = true;
  const successReg = AuthPage.handleRegister();
  assert.strictEqual(successReg.success, true);
  assert.strictEqual(successReg.user.name_ar, 'مورد الأغذية الفاخرة');
  assert.strictEqual(successReg.user.email, 'supplier@meyar.sa');
  assert.strictEqual(successReg.user.role, 'supplier');
  assert.strictEqual(successReg.user.verified, true);
  assert.strictEqual(successReg.user.business_profile.company_name_ar, 'استوديو نجد للطهي');

  const registeredUser = AuthPage.getCurrentUser();
  assert.strictEqual(registeredUser.role, 'supplier');
});

test('AuthPage - Social OAuth Login Simulation (Google & Apple)', () => {
  const { doc } = setupDOM();
  buildAuthDOMStructure(doc);

  // Google Social Auth
  const googleUser = AuthPage.handleSocialAuth('google');
  assert.strictEqual(googleUser.authProvider, 'google');
  assert.strictEqual(AuthPage.getCurrentUser().authProvider, 'google');

  // Apple Social Auth
  const appleUser = AuthPage.handleSocialAuth('apple');
  assert.strictEqual(appleUser.authProvider, 'apple');
  assert.strictEqual(AuthPage.getCurrentUser().authProvider, 'apple');
});

test('AuthPage - Session Lifecycle (getCurrentUser, logout)', () => {
  setupDOM();

  const mockUser = { id: 'u1', name_ar: 'شيف', email: 'c@m.sa', role: 'chef' };
  AuthPage.currentUser = mockUser;

  const current = AuthPage.getCurrentUser();
  assert.strictEqual(current.id, 'u1');
  assert.strictEqual(current.email, 'c@m.sa');

  AuthPage.logout();
  assert.strictEqual(AuthPage.getCurrentUser(), null);
});

test('AuthPage - URL Query Parameter Bootstrap (?tab=register&role=supplier)', () => {
  const { doc } = setupDOM('http://localhost/auth.html?tab=register&role=supplier');
  buildAuthDOMStructure(doc);

  AuthPage.init();

  assert.strictEqual(AuthPage.activeTab, 'register');
  assert.strictEqual(AuthPage.selectedRole, 'supplier');

  const tabRegister = doc.getElementById('tab-register-btn');
  assert.strictEqual(tabRegister.getAttribute('aria-selected'), 'true');

  const roleSupplier = doc.querySelector('[data-role="supplier"]');
  assert.strictEqual(roleSupplier.getAttribute('aria-checked'), 'true');
});

test('AuthPage - Full Event Delegation and UI Interactions', () => {
  const { doc } = setupDOM();
  buildAuthDOMStructure(doc);

  AuthPage.init();

  // 1. Click register tab
  const tabRegister = doc.getElementById('tab-register-btn');
  tabRegister.click();
  assert.strictEqual(AuthPage.activeTab, 'register');

  // 2. Click role enthusiast
  const roleEnthusiast = doc.querySelector('[data-role="enthusiast"]');
  roleEnthusiast.click();
  assert.strictEqual(AuthPage.selectedRole, 'enthusiast');

  // 3. Click switch to login
  const switchToLogin = doc.querySelector('[data-action="switch-to-login"]');
  switchToLogin.click();
  assert.strictEqual(AuthPage.activeTab, 'login');

  // 4. Click switch to register
  const switchToRegister = doc.querySelector('[data-action="switch-to-register"]');
  switchToRegister.click();
  assert.strictEqual(AuthPage.activeTab, 'register');

  // 5. Click password toggle
  const pwdToggle = doc.querySelector('[data-target="login-password"]');
  const pwdInput = doc.getElementById('login-password');
  pwdToggle.click();
  assert.strictEqual(pwdInput.getAttribute('type'), 'text');

  // 6. Language changed event
  I18n.setLang('en');
  window.dispatchEvent(new CustomEvent('meyar:lang-changed', { detail: { lang: 'en' } }));
  const title = doc.getElementById('auth-title');
  assert.strictEqual(title.textContent, 'Create Your Meyar Account');
});
