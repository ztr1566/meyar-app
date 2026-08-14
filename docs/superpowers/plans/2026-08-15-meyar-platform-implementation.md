# Meyar (معيار) Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Architect and build the complete, production-ready static web platform for **"Meyar (معيار)"** from scratch featuring 12 interconnected HTML pages, Tailwind CSS v4 styling with 100% solid surfaces, dynamic bilingual engine (AR/EN), dynamic serving scaler, B2B RFQ system, and interactive modules.

**Architecture:** Modular Vanilla ES Modules (`js/core/`, `js/data/`, `js/modules/`, `js/pages/`) alongside Semantic HTML5 templates styled with Tailwind CSS v4 configured via `@theme` with solid color tokens, CSS logical properties, and inline anti-FOUC handlers.

**Tech Stack:** HTML5, Tailwind CSS v4 (`@tailwindcss/cli`), Vanilla JavaScript (ES6+ modules), Lucide inline SVG icons.

**Spec:** `docs/superpowers/specs/2026-08-15-meyar-platform-design.md`

## Global Constraints

- **100% Solid Surfaces:** Strictly zero glassmorphism, zero `backdrop-blur`, and zero semi-transparent background hacks.
- **Strict CSS Logical Properties:** Exclusively use `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `border-s`, `border-e`. No physical `left` or `right` utility classes.
- **Bilingual Engine:** Arabic (`dir="rtl"`, Cairo font) and English (`dir="ltr"`, Inter font) dynamic switching without full page reloads.
- **Anti-FOUC:** Synchronous `<script>` in `<head>` checking `localStorage.getItem('meyar_theme')` and `localStorage.getItem('meyar_lang')`.
- **Zero Runtime UI Frameworks:** Pure Vanilla JS ES modules only.

---

### Task 1: Project Setup & Tailwind CSS v4 Toolchain

**Files:**

- Create: `package.json`
- Create: `css/input.css`
- Produce: `css/output.css`

**Interfaces:**

- Produces: Compiled stylesheet `css/output.css` containing solid color tokens (`bg-canvas`, `bg-surface-1`, `bg-surface-2`, `border-border-subtle`, `text-text-main`, `text-text-muted`, `text-brand-gold`, `bg-brand-gold`, `bg-brand-emerald`, `font-arabic`, `font-english`).

- [ ] **Step 1: Create `package.json` with build scripts and dependencies**

```json
{
  "name": "meyar-frontend",
  "version": "1.0.0",
  "private": true,
  "description": "Meyar (معيار) Culinary Social Network & B2B Supplies Marketplace",
  "scripts": {
    "build:css": "tailwindcss -i ./css/input.css -o ./css/output.css --minify",
    "dev:css": "tailwindcss -i ./css/input.css -o ./css/output.css --watch"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create `css/input.css` with Tailwind v4 `@theme` and solid color variables**

```css
@import "tailwindcss";

@layer base {
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap');
}

@theme {
  --font-arabic: 'Cairo', system-ui, -apple-system, sans-serif;
  --font-english: 'Inter', system-ui, -apple-system, sans-serif;

  --color-canvas: var(--color-canvas-val);
  --color-surface-1: var(--color-surface-1-val);
  --color-surface-2: var(--color-surface-2-val);
  --color-border-subtle: var(--color-border-subtle-val);
  --color-text-main: var(--color-text-main-val);
  --color-text-muted: var(--color-text-muted-val);
  --color-brand-gold: var(--color-brand-gold-val);
  --color-brand-gold-hover: var(--color-brand-gold-hover-val);
  --color-brand-emerald: var(--color-brand-emerald-val);
  --color-brand-emerald-hover: var(--color-brand-emerald-hover-val);
}

:root {
  /* Light Mode (Crisp Editorial Luxury) */
  --color-canvas-val: #F8F9F8;
  --color-surface-1-val: #FFFFFF;
  --color-surface-2-val: #EFF2F0;
  --color-border-subtle-val: #E2E8E4;
  --color-text-main-val: #111814;
  --color-text-muted-val: #5A6B61;
  --color-brand-gold-val: #A68238;
  --color-brand-gold-hover-val: #B89242;
  --color-brand-emerald-val: #047857;
  --color-brand-emerald-hover-val: #065F46;
}

html.dark {
  /* Dark Mode (Forest Obsidian Luxury) */
  --color-canvas-val: #080C0A;
  --color-surface-1-val: #101713;
  --color-surface-2-val: #17221C;
  --color-border-subtle-val: #223129;
  --color-text-main-val: #F2F5F3;
  --color-text-muted-val: #8E9E94;
  --color-brand-gold-val: #C5A059;
  --color-brand-gold-hover-val: #D4AF37;
  --color-brand-emerald-val: #10B981;
  --color-brand-emerald-hover-val: #059669;
}

html[dir="rtl"] {
  font-family: var(--font-arabic);
}

html[dir="ltr"] {
  font-family: var(--font-english);
}

/* Custom hairline border utility */
.border-hairline {
  border-width: 1px;
}

/* Solid custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--color-surface-1-val);
}
::-webkit-scrollbar-thumb {
  background: var(--color-border-subtle-val);
  border-radius: 3px;
}
```

- [ ] **Step 3: Install dependencies and compile `css/output.css`**

Run: `npm install && npx @tailwindcss/cli -i ./css/input.css -o ./css/output.css`
Expected: `css/output.css` generated successfully.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json css/input.css css/output.css
git commit -m "chore: initialize Tailwind v4 build system with solid color tokens"
```

---

### Task 2: Core Infrastructure (Theme Manager, Anti-FOUC, Toasts & Modals)

**Files:**

- Create: `js/core/theme.js`
- Create: `js/core/toast.js`
- Create: `js/core/modal.js`

**Interfaces:**

- Produces:
  - `ThemeManager`: `{ getTheme(), setTheme(theme), toggleTheme(), init() }`
  - `Toast`: `{ show({ title, message, type, duration }), success(msg), error(msg), info(msg) }`
  - `Modal`: `{ open(modalId), close(modalId), init() }`

- [ ] **Step 1: Write `js/core/theme.js` with Anti-FOUC synchronization**

```javascript
export class ThemeManager {
  static THEME_KEY = 'meyar_theme';

  static getTheme() {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  static setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(this.THEME_KEY, theme);
    window.dispatchEvent(new CustomEvent('meyar:theme-changed', { detail: { theme } }));
    this.updateToggleButtons(theme);
  }

  static toggleTheme() {
    const current = this.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  static updateToggleButtons(theme) {
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }

  static init() {
    const theme = this.getTheme();
    this.setTheme(theme);

    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle-theme"]');
      if (toggleBtn) {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
```

- [ ] **Step 2: Write `js/core/toast.js` with solid toast styling**

```javascript
export class Toast {
  static container = null;

  static initContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'meyar-toast-container';
      this.container.className = 'fixed bottom-6 end-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none';
      document.body.appendChild(this.container);
    }
  }

  static show({ title = '', message = '', type = 'info', duration = 3500 } = {}) {
    this.initContainer();

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-start gap-3 p-4 bg-surface-2 border border-border-subtle shadow-xl rounded-lg text-start transition-all duration-300 transform translate-y-2 opacity-0';
    
    let iconSvg = '';
    let accentClass = 'text-brand-gold';
    if (type === 'success') {
      accentClass = 'text-brand-emerald';
      iconSvg = `<svg class="w-5 h-5 ${accentClass} shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
    } else if (type === 'error') {
      accentClass = 'text-red-500';
      iconSvg = `<svg class="w-5 h-5 ${accentClass} shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg class="w-5 h-5 ${accentClass} shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="flex-1">
        ${title ? `<h4 class="text-sm font-semibold text-text-main mb-0.5">${title}</h4>` : ''}
        <p class="text-xs text-text-muted leading-relaxed">${message}</p>
      </div>
      <button type="button" class="text-text-muted hover:text-text-main p-1 ms-2 shrink-0 rounded transition-colors" aria-label="Close">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }

  static dismiss(toast) {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }

  static success(message, title = '') {
    this.show({ title, message, type: 'success' });
  }

  static error(message, title = '') {
    this.show({ title, message, type: 'error' });
  }

  static info(message, title = '') {
    this.show({ title, message, type: 'info' });
  }
}
```

- [ ] **Step 3: Write `js/core/modal.js` with focus trap and keyboard control**

```javascript
export class Modal {
  static activeModal = null;

  static open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    this.activeModal = modal;

    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();

    window.dispatchEvent(new CustomEvent('meyar:modal-opened', { detail: { modalId } }));
  }

  static close(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    this.activeModal = null;

    window.dispatchEvent(new CustomEvent('meyar:modal-closed', { detail: { modalId: modal.id } }));
  }

  static init() {
    document.addEventListener('click', (e) => {
      const openTrigger = e.target.closest('[data-modal-target]');
      if (openTrigger) {
        e.preventDefault();
        const targetId = openTrigger.getAttribute('data-modal-target');
        this.open(targetId);
        return;
      }

      const closeTrigger = e.target.closest('[data-modal-close]');
      if (closeTrigger) {
        e.preventDefault();
        const modal = closeTrigger.closest('[role="dialog"]') || this.activeModal;
        if (modal) this.close(modal);
        return;
      }

      if (e.target.hasAttribute('data-modal-backdrop')) {
        const modal = e.target.closest('[role="dialog"]');
        if (modal) this.close(modal);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });
  }
}
```

- [ ] **Step 4: Commit core infrastructure**

```bash
git add js/core/theme.js js/core/toast.js js/core/modal.js
git commit -m "feat(core): implement ThemeManager, Toast, and Modal systems"
```

---

### Task 3: Bilingual Engine & Complete Translation Dictionary

**Files:**

- Create: `js/data/translations.js`
- Create: `js/core/i18n.js`

**Interfaces:**

- Produces:
  - `translations`: Comprehensive `{ ar: {...}, en: {...} }` dictionary.
  - `I18n`: `{ getLang(), setLang(lang), t(key), translatePage(), init() }`

- [ ] **Step 1: Write `js/data/translations.js` with 150+ UI keys**

Create rich bilingual translations covering:

- Navigation: `nav.feed`, `nav.explore`, `nav.recipes`, `nav.supplies`, `nav.courses`, `nav.dashboard`, `nav.chat`, `nav.notifications`, `nav.settings`, `nav.create_recipe`, `nav.auth_login`, `nav.auth_register`.
- Roles: `role.chef`, `role.enthusiast`, `role.supplier`, `role.chef_desc`, `role.enthusiast_desc`, `role.supplier_desc`.
- Actions: `btn.save`, `btn.saved`, `btn.like`, `btn.share`, `btn.follow`, `btn.following`, `btn.rfq_request`, `btn.enroll`, `btn.publish`, `btn.draft`, `btn.send_message`.
- Recipe & Scaler: `recipe.servings`, `recipe.prep_time`, `recipe.cook_time`, `recipe.difficulty`, `recipe.ingredients`, `recipe.instructions`, `recipe.notes`, `recipe.pairings`, `units.g`, `units.ml`, `units.tbsp`, `units.tsp`, `units.cup`, `units.pcs`.
- Marketplace & RFQ: `supplies.moq`, `supplies.in_stock`, `supplies.request_quote`, `rfq.title`, `rfq.quantity`, `rfq.destination`, `rfq.notes`, `rfq.submit`.
- Search & Modals: `search.placeholder`, `search.no_results`, `toast.saved_success`, `toast.rfq_success`.

- [ ] **Step 2: Write `js/core/i18n.js`**

```javascript
import { translations } from '../data/translations.js';

export class I18n {
  static LANG_KEY = 'meyar_lang';

  static getLang() {
    return localStorage.getItem(this.LANG_KEY) || 'ar';
  }

  static setLang(lang) {
    const validLang = lang === 'en' ? 'en' : 'ar';
    localStorage.setItem(this.LANG_KEY, validLang);
    document.documentElement.setAttribute('lang', validLang);
    document.documentElement.setAttribute('dir', validLang === 'ar' ? 'rtl' : 'ltr');
    this.translatePage();
    window.dispatchEvent(new CustomEvent('meyar:lang-changed', { detail: { lang: validLang } }));
    this.updateLanguageButtons(validLang);
  }

  static toggleLang() {
    const current = this.getLang();
    const next = current === 'ar' ? 'en' : 'ar';
    this.setLang(next);
    return next;
  }

  static t(key, params = {}) {
    const lang = this.getLang();
    const dict = translations[lang] || translations.ar;
    let text = dict[key] || translations.en[key] || key;
    
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
    return text;
  }

  static translatePage() {
    const lang = this.getLang();
    const dict = translations[lang] || translations.ar;

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // Titles & Tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) {
        el.setAttribute('title', dict[key]);
      }
    });
  }

  static updateLanguageButtons(lang) {
    document.querySelectorAll('[data-action="toggle-lang"]').forEach(btn => {
      const label = btn.querySelector('.lang-label');
      if (label) {
        label.textContent = lang === 'ar' ? 'English' : 'العربية';
      }
    });
  }

  static init() {
    const lang = this.getLang();
    this.setLang(lang);

    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle-lang"]');
      if (toggleBtn) {
        e.preventDefault();
        this.toggleLang();
      }
    });
  }
}
```

- [ ] **Step 3: Commit i18n subsystem**

```bash
git add js/data/translations.js js/core/i18n.js
git commit -m "feat(i18n): implement bilingual engine and translation dictionaries"
```

---

### Task 4: Rich Culinary Mock Dataset

**Files:**

- Create: `js/data/mock-data.js`

**Interfaces:**

- Produces:
  - `MOCK_DATA`: `{ chefs, recipes, supplies, courses, chats, notifications, stats }`

- [ ] **Step 1: Write `js/data/mock-data.js`**

Include:

- 6 detailed Chef profiles with bilingual bios, awards (Michelin / Bocuse d'Or), verified status, followers.
- 8 gourmet Recipes with structured ingredient objects (amount, unit, name_ar, name_en, notes), step-by-step instructions with timers, wine pairings, nutrition.
- 8 B2B Marketplace Supply listings (commercial spiral mixers, 50L extra virgin olive oil drums, Damascus knives, vacuum sealers, truffle oils) with MOQ, specs, certifications.
- 4 Masterclasses with syllabus modules, dates, prices, seat limits.
- Initial chat threads with RFQ negotiation status cards.
- Grouped notifications (likes, orders, comments).

- [ ] **Step 2: Commit mock dataset**

```bash
git add js/data/mock-data.js
git commit -m "feat(data): populate structured bilingual culinary and B2B mock dataset"
```

---

### Task 5: Global Header, App Shell & `Ctrl + K` Instant Search

**Files:**

- Create: `js/modules/search.js`
- Create: `js/app.js`

**Interfaces:**

- Produces:
  - `SearchModule`: `{ open(), close(), query(searchTerm), init() }`
  - Global `initApp()` in `js/app.js`

- [ ] **Step 1: Write `js/modules/search.js`**

```javascript
import { MOCK_DATA } from '../data/mock-data.js';
import { I18n } from '../core/i18n.js';
import { Modal } from '../core/modal.js';

export class SearchModule {
  static init() {
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('search-results-container');

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      this.renderResults(query, resultsContainer);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        Modal.open('search-modal');
        setTimeout(() => searchInput.focus(), 50);
      }
    });
  }

  static renderResults(query, container) {
    if (!query) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-text-muted" data-i18n="search.type_prompt">${I18n.t('search.type_prompt')}</div>`;
      return;
    }

    const lang = I18n.getLang();
    const matchingRecipes = MOCK_DATA.recipes.filter(r => 
      (r.title_ar && r.title_ar.toLowerCase().includes(query)) ||
      (r.title_en && r.title_en.toLowerCase().includes(query)) ||
      (r.cuisine && r.cuisine.toLowerCase().includes(query))
    );

    const matchingChefs = MOCK_DATA.chefs.filter(c =>
      (c.name_ar && c.name_ar.toLowerCase().includes(query)) ||
      (c.name_en && c.name_en.toLowerCase().includes(query)) ||
      (c.specialty && c.specialty.toLowerCase().includes(query))
    );

    const matchingSupplies = MOCK_DATA.supplies.filter(s =>
      (s.name_ar && s.name_ar.toLowerCase().includes(query)) ||
      (s.name_en && s.name_en.toLowerCase().includes(query)) ||
      (s.category && s.category.toLowerCase().includes(query))
    );

    if (matchingRecipes.length === 0 && matchingChefs.length === 0 && matchingSupplies.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-text-muted" data-i18n="search.no_results">${I18n.t('search.no_results')}</div>`;
      return;
    }

    let html = '';
    if (matchingRecipes.length > 0) {
      html += `<div class="p-2 text-xs font-semibold text-brand-gold uppercase tracking-wider">${I18n.t('nav.recipes')}</div>`;
      matchingRecipes.slice(0, 3).forEach(r => {
        const title = lang === 'ar' ? r.title_ar : r.title_en;
        html += `
          <a href="recipe.html?id=${r.id}" class="flex items-center gap-3 p-2.5 rounded-md hover:bg-surface-1 transition-colors group">
            <img src="${r.image}" class="w-10 h-10 rounded object-cover border border-border-subtle" alt="${title}"/>
            <div class="flex-1 min-w-0">
              <h5 class="text-sm font-medium text-text-main group-hover:text-brand-gold truncate">${title}</h5>
              <span class="text-xs text-text-muted">${r.prep_time} min • ${r.difficulty}</span>
            </div>
          </a>
        `;
      });
    }

    if (matchingChefs.length > 0) {
      html += `<div class="p-2 mt-2 text-xs font-semibold text-brand-gold uppercase tracking-wider">${I18n.t('search.chefs')}</div>`;
      matchingChefs.slice(0, 3).forEach(c => {
        const name = lang === 'ar' ? c.name_ar : c.name_en;
        html += `
          <a href="chef.html?id=${c.id}" class="flex items-center gap-3 p-2.5 rounded-md hover:bg-surface-1 transition-colors group">
            <img src="${c.avatar}" class="w-10 h-10 rounded-full object-cover border border-border-subtle" alt="${name}"/>
            <div class="flex-1 min-w-0">
              <h5 class="text-sm font-medium text-text-main group-hover:text-brand-gold truncate">${name}</h5>
              <span class="text-xs text-text-muted">${c.title} • ${c.followers} ${I18n.t('chef.followers')}</span>
            </div>
          </a>
        `;
      });
    }

    if (matchingSupplies.length > 0) {
      html += `<div class="p-2 mt-2 text-xs font-semibold text-brand-gold uppercase tracking-wider">${I18n.t('nav.supplies')}</div>`;
      matchingSupplies.slice(0, 3).forEach(s => {
        const name = lang === 'ar' ? s.name_ar : s.name_en;
        html += `
          <a href="supplies.html?id=${s.id}" class="flex items-center gap-3 p-2.5 rounded-md hover:bg-surface-1 transition-colors group">
            <img src="${s.image}" class="w-10 h-10 rounded object-cover border border-border-subtle" alt="${name}"/>
            <div class="flex-1 min-w-0">
              <h5 class="text-sm font-medium text-text-main group-hover:text-brand-gold truncate">${name}</h5>
              <span class="text-xs text-text-muted">${s.price_formatted} • MOQ: ${s.moq}</span>
            </div>
          </a>
        `;
      });
    }

    container.innerHTML = html;
  }
}
```

- [ ] **Step 2: Write `js/app.js` initializing all global components**

```javascript
import { ThemeManager } from './core/theme.js';
import { I18n } from './core/i18n.js';
import { Modal } from './core/modal.js';
import { Toast } from './core/toast.js';
import { SearchModule } from './modules/search.js';

export function initApp() {
  ThemeManager.init();
  I18n.init();
  Modal.init();
  SearchModule.init();

  // Mobile navigation drawer / dropdown toggles
  document.querySelectorAll('[data-action="toggle-mobile-menu"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const menu = document.getElementById('mobile-drawer');
      if (menu) menu.classList.toggle('hidden');
    });
  });

  // User profile dropdown toggle
  document.querySelectorAll('[data-dropdown-trigger]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = trigger.getAttribute('data-dropdown-trigger');
      const dropdown = document.getElementById(targetId);
      if (dropdown) dropdown.classList.toggle('hidden');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('[data-dropdown]').forEach(dd => dd.classList.add('hidden'));
  });
}

document.addEventListener('DOMContentLoaded', initApp);
```

- [ ] **Step 3: Commit app shell**

```bash
git add js/modules/search.js js/app.js
git commit -m "feat(shell): implement global navigation, search module and app bootstrapper"
```

---

### Task 6: Authentication Page (`auth.html` & `js/pages/auth.js`)

**Files:**

- Create: `auth.html`
- Create: `js/pages/auth.js`

**Interfaces:**

- Produces: Clean interactive authentication interface supporting tab switching (Login / Register), 3-role selector (Chef, Enthusiast, Supplier), password reveal toggles, validation states, and session persistence to `localStorage`.

- [ ] **Step 1: Build `auth.html` with solid surfaces and anti-FOUC script**
- [ ] **Step 2: Build `js/pages/auth.js` with role selection logic and authentication simulation**
- [ ] **Step 3: Test and verify tab switching, role card selection, and form submission**
- [ ] **Step 4: Commit**

```bash
git add auth.html js/pages/auth.js
git commit -m "feat(pages): build complete authentication page with role selector"
```

---

### Task 7: Main Discovery Feed (`index.html` & `js/pages/feed.js`)

**Files:**

- Create: `index.html`
- Create: `js/pages/feed.js`

**Interfaces:**

- Produces: 3-column responsive feed with Story reels, interactive "Share Post" composer, rich recipe cards with like/save/share actions, Creator Hub side rail, and trending culinary highlights.

- [ ] **Step 1: Build `index.html` with semantic 3-column layout and solid cards**
- [ ] **Step 2: Build `js/pages/feed.js` rendering dynamic feed posts from `MOCK_DATA`**
- [ ] **Step 3: Implement interactive like and save buttons with instant solid Toast feedback**
- [ ] **Step 4: Commit**

```bash
git add index.html js/pages/feed.js
git commit -m "feat(pages): build main discovery feed with 3-column layout and interactive cards"
```

---

### Task 8: Explore & Trends Page (`explore.html` & `js/pages/explore.js`)

**Files:**

- Create: `explore.html`
- Create: `js/pages/explore.js`

**Interfaces:**

- Produces: Explore view with instant category chips (Trending Recipes, Top Chefs, Seasonal Ingredients, Equipment), search bar filter, and dynamic grid cards with hover actions.

- [ ] **Step 1: Build `explore.html` with hero filter bar and responsive grid**
- [ ] **Step 2: Build `js/pages/explore.js` with category filtering and chef spotlights**
- [ ] **Step 3: Verify dynamic filtering across Arabic and English views**
- [ ] **Step 4: Commit**

```bash
git add explore.html js/pages/explore.js
git commit -m "feat(pages): build explore and trends page with dynamic filters"
```

---

### Task 9: Recipe Detail & Dynamic Serving Scaler (`recipe.html`, `js/modules/scaler.js`, `js/pages/recipe-page.js`)

**Files:**

- Create: `recipe.html`
- Create: `js/modules/scaler.js`
- Create: `js/pages/recipe-page.js`

**Interfaces:**

- Produces:
  - `RecipeScaler`: `{ init(baseServings, ingredients), scale(targetServings), render() }`
  - Interactive recipe page with dynamic multiplier widget, cooking mode checklist with step completion, chef notes, pairings, and nutritional breakdown.

- [ ] **Step 1: Implement `js/modules/scaler.js` for real-time recalculation of quantities and units**

```javascript
import { I18n } from '../core/i18n.js';

export class RecipeScaler {
  constructor({ containerId, baseServings, ingredients, onChange }) {
    this.container = document.getElementById(containerId);
    this.baseServings = baseServings || 4;
    this.currentServings = this.baseServings;
    this.ingredients = ingredients || [];
    this.onChange = onChange;
  }

  increment() {
    if (this.currentServings < 24) {
      this.currentServings += 1;
      this.render();
      if (this.onChange) this.onChange(this.currentServings);
    }
  }

  decrement() {
    if (this.currentServings > 1) {
      this.currentServings -= 1;
      this.render();
      if (this.onChange) this.onChange(this.currentServings);
    }
  }

  render() {
    if (!this.container) return;
    const factor = this.currentServings / this.baseServings;
    const lang = I18n.getLang();

    let html = '';
    this.ingredients.forEach(item => {
      const rawQty = item.baseAmount * factor;
      const formattedQty = this.formatQuantity(rawQty);
      const unit = lang === 'ar' ? (item.unit_ar || '') : (item.unit_en || '');
      const name = lang === 'ar' ? item.name_ar : item.name_en;
      const notes = lang === 'ar' ? (item.notes_ar || '') : (item.notes_en || '');

      html += `
        <li class="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-b-0 text-sm">
          <div class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full bg-brand-gold"></span>
            <span class="text-text-main font-medium">${name}</span>
            ${notes ? `<span class="text-xs text-text-muted">(${notes})</span>` : ''}
          </div>
          <div class="text-end font-semibold text-brand-gold">
            <span>${formattedQty}</span>
            ${unit ? `<span class="ms-1 text-xs text-text-muted">${unit}</span>` : ''}
          </div>
        </li>
      `;
    });

    this.container.innerHTML = html;

    const displayCount = document.getElementById('scaler-serving-count');
    if (displayCount) displayCount.textContent = this.currentServings;
  }

  formatQuantity(val) {
    if (val === Math.round(val)) return val.toString();
    const fractions = { 0.25: '¼', 0.33: '⅓', 0.5: '½', 0.66: '⅔', 0.75: '¾' };
    const whole = Math.floor(val);
    const decimal = Math.round((val - whole) * 100) / 100;

    for (const [dec, frac] of Object.entries(fractions)) {
      if (Math.abs(decimal - parseFloat(dec)) < 0.05) {
        return whole > 0 ? `${whole} ${frac}` : frac;
      }
    }
    return val.toFixed(1);
  }
}
```

- [ ] **Step 2: Build `recipe.html` and `js/pages/recipe-page.js` with interactive step checklist and dynamic scaler**
- [ ] **Step 3: Verify scaling calculations and step checklist across both languages**
- [ ] **Step 4: Commit**

```bash
git add recipe.html js/modules/scaler.js js/pages/recipe-page.js
git commit -m "feat(pages): build recipe detail page with dynamic live serving scaler widget"
```

---

### Task 10: Create & Publish Recipe Studio (`create-recipe.html` & `js/pages/create-recipe.js`)

**Files:**

- Create: `create-recipe.html`
- Create: `js/pages/create-recipe.js`

**Interfaces:**

- Produces: 4-step accordion / wizard recipe builder with dynamic ingredient addition/removal, media drag-and-drop simulation, step reordering, draft saving, and publishing.

- [ ] **Step 1: Build `create-recipe.html` with clean multi-step form panels**
- [ ] **Step 2: Build `js/pages/create-recipe.js` with dynamic row manipulation and form validation**
- [ ] **Step 3: Test adding ingredients, removing rows, saving draft, and publishing**
- [ ] **Step 4: Commit**

```bash
git add create-recipe.html js/pages/create-recipe.js
git commit -m "feat(pages): build recipe creation studio with dynamic ingredient list builder"
```

---

### Task 11: Chef Profile & Portfolio (`chef.html` & `js/pages/chef.js`)

**Files:**

- Create: `chef.html`
- Create: `js/pages/chef.js`

**Interfaces:**

- Produces: Chef profile header with verification badge, awards, follower stats, bio, and 6 active functional tabs (Recipes, Portfolio / Signature Dishes, Saved, Courses, Activity, About).

- [ ] **Step 1: Build `chef.html` with cover header, stat badges, and tab bar**
- [ ] **Step 2: Build `js/pages/chef.js` rendering tab panels and connecting portfolio dishes to structured recipes**
- [ ] **Step 3: Verify all 6 tabs switch cleanly with active styling**
- [ ] **Step 4: Commit**

```bash
git add chef.html js/pages/chef.js
git commit -m "feat(pages): build chef profile and portfolio with 6 functional tabs"
```

---

### Task 12: Creator & Supplier Dashboard (`dashboard.html` & `js/pages/dashboard.js`)

**Files:**

- Create: `dashboard.html`
- Create: `js/pages/dashboard.js`

**Interfaces:**

- Produces: KPI analytics cards, SVG performance charts, and tabbed management tables (Published Recipes, B2B Listings, Pending RFQ Quotes) with status badges and action menus.

- [ ] **Step 1: Build `dashboard.html` with metrics grid, chart canvas/SVG, and management tables**
- [ ] **Step 2: Build `js/pages/dashboard.js` rendering interactive SVG trend charts and item management actions**
- [ ] **Step 3: Test table tab filters (Recipes, Supplies, RFQs) and item action triggers**
- [ ] **Step 4: Commit**

```bash
git add dashboard.html js/pages/dashboard.js
git commit -m "feat(pages): build creator and supplier analytics dashboard with SVG charts"
```

---

### Task 13: B2B Marketplace & RFQ Drawer (`supplies.html`, `js/modules/rfq.js`, `js/pages/supplies.js`)

**Files:**

- Create: `supplies.html`
- Create: `js/modules/rfq.js`
- Create: `js/pages/supplies.js`

**Interfaces:**

- Produces: Commercial culinary supplies catalog, category & MOQ filters, stock availability badges, and a sliding RFQ Drawer/Modal for quote submission that persists to state.

- [ ] **Step 1: Implement `js/modules/rfq.js` for handling Request for Quotation submissions and sync**
- [ ] **Step 2: Build `supplies.html` and `js/pages/supplies.js` with category filtering and RFQ drawer trigger**
- [ ] **Step 3: Test RFQ submission flow, form validation, and toast notification**
- [ ] **Step 4: Commit**

```bash
git add supplies.html js/modules/rfq.js js/pages/supplies.js
git commit -m "feat(pages): build B2B marketplace and Request for Quotation (RFQ) drawer system"
```

---

### Task 14: Culinary Courses & Workshops (`courses.html` & `js/pages/courses.js`)

**Files:**

- Create: `courses.html`
- Create: `js/pages/courses.js`

**Interfaces:**

- Produces: Masterclasses catalog with instructor badges, skill levels, duration, and interactive 1-click enrollment modal with curriculum preview.

- [ ] **Step 1: Build `courses.html` with masterclasses grid and modal template**
- [ ] **Step 2: Build `js/pages/courses.js` with enrollment handler and schedule picker**
- [ ] **Step 3: Test course enrollment modal and toast feedback**
- [ ] **Step 4: Commit**

```bash
git add courses.html js/pages/courses.js
git commit -m "feat(pages): build culinary courses catalog and enrollment system"
```

---

### Task 15: Direct Chat & RFQ Negotiation (`chat.html`, `js/modules/chat-module.js`, `js/pages/chat.js`)

**Files:**

- Create: `chat.html`
- Create: `js/modules/chat-module.js`
- Create: `js/pages/chat.js`

**Interfaces:**

- Produces: Two-column split messaging interface with contact search, category tabs (All, Chefs, Suppliers), interactive message bubbles, embedded RFQ quote preview cards, and simulated live chat responses.

- [ ] **Step 1: Implement `js/modules/chat-module.js` managing conversation switching and message sending**
- [ ] **Step 2: Build `chat.html` and `js/pages/chat.js` with RFQ negotiation card actions (Approve / Counter Quote)**
- [ ] **Step 3: Test message sending and conversation switching**
- [ ] **Step 4: Commit**

```bash
git add chat.html js/modules/chat-module.js js/pages/chat.js
git commit -m "feat(pages): build direct messaging and RFQ negotiation chat interface"
```

---

### Task 16: Notifications Center & Settings (`notifications.html`, `settings.html`, `js/pages/notifications.js`, `js/pages/settings.js`)

**Files:**

- Create: `notifications.html`
- Create: `settings.html`
- Create: `js/pages/notifications.js`
- Create: `js/pages/settings.js`

**Interfaces:**

- Produces:
  - Categorized Notifications feed with filter pills and "Mark All as Read".
  - Comprehensive Settings page (Profile, Security, Language, Theme, Notifications, B2B Commercial Details) with live syncing to `localStorage`.

- [ ] **Step 1: Build `notifications.html` and `js/pages/notifications.js`**
- [ ] **Step 2: Build `settings.html` and `js/pages/settings.js` with multi-section tabs and live settings sync**
- [ ] **Step 3: Test live theme and language changes from settings panel**
- [ ] **Step 4: Commit**

```bash
git add notifications.html settings.html js/pages/notifications.js js/pages/settings.js
git commit -m "feat(pages): build notifications center and multi-section account settings"
```

---

### Task 17: Comprehensive End-to-End Verification & Bidirectional Polish

**Files:**

- Verify all 12 HTML pages and JavaScript modules
- Final build of `css/output.css`

**Interfaces:**

- Verifies:
  - All 12 pages navigate seamlessly without broken links.
  - Zero console errors across all pages.
  - Dark mode and Light mode toggles work instantly with zero FOUC.
  - Arabic (`dir="rtl"`) and English (`dir="ltr"`) switch cleanly without layout breakage.
  - Dynamic serving scaler calculations are mathematically accurate.
  - RFQ submissions and toasts trigger reliably.

- [ ] **Step 1: Run complete Tailwind compilation build to ensure all utility classes are generated**

Run: `npm run build:css`
Expected: Production `css/output.css` compiled cleanly.

- [ ] **Step 2: Launch local static server and execute browser tests across all 12 pages**

Run browser verification tests on:

- `http://localhost:3000/index.html`
- `http://localhost:3000/auth.html`
- `http://localhost:3000/explore.html`
- `http://localhost:3000/recipe.html`
- `http://localhost:3000/create-recipe.html`
- `http://localhost:3000/chef.html`
- `http://localhost:3000/dashboard.html`
- `http://localhost:3000/supplies.html`
- `http://localhost:3000/courses.html`
- `http://localhost:3000/chat.html`
- `http://localhost:3000/notifications.html`
- `http://localhost:3000/settings.html`

- [ ] **Step 3: Commit final release verification**

```bash
git add .
git commit -m "chore(release): complete Meyar web platform with full 12-page suite and bidirectional parity"
```
