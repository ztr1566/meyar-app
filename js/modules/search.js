/**
 * Meyar (معيار) Global Search Engine & Command Palette Module
 * Real-time fuzzy and keyword search across recipes, chefs, supplies, and courses.
 * Full bilingual support (Arabic & English), keyboard navigation (Ctrl+K / Cmd+K / Esc / Arrows).
 */

import { CHEF_FIXTURES, COURSE_FIXTURES, RECIPE_FIXTURES, SUPPLY_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Modal } from '../core/modal.js';

/**
 * Normalize string for robust bilingual search (strips Arabic diacritics, unifies alef/ta marbuta/alef maksura)
 * @param {string} str 
 * @returns {string}
 */
export function normalizeSearchQuery(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip Arabic tashkeel / diacritics
    .replace(/[أإآٱ]/g, 'ا') // normalize alef variants
    .replace(/ة/g, 'ه') // normalize ta marbuta to ha
    .replace(/ى/g, 'ي') // normalize alef maksura to ya
    .trim();
}

export class SearchModule {
  static isInitialized = false;
  static activeIndex = -1;

  /**
   * Initialize Search Module events and keyboard shortcuts
   */
  static init() {
    if (typeof document === 'undefined') return;

    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('search-results-container');

    // Bind real-time input event if input element exists
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const queryStr = e.target.value;
        this.activeIndex = -1;
        this.renderResults(queryStr, resultsContainer);
      });

      // Handle arrow key and enter navigation within the search input
      searchInput.addEventListener('keydown', (e) => {
        this.handleKeyboardNavigation(e);
      });
    }

    // Global shortcut Ctrl+K / Cmd+K to open search palette
    if (!this.isInitialized) {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          this.open();
        }
      });

      // Click delegation for buttons requesting search modal
      document.addEventListener('click', (e) => {
        const trigger = e.target && e.target.closest ? e.target.closest('[data-action="open-search"]') : null;
        if (trigger) {
          e.preventDefault();
          this.open();
        }
      });

      // Listen for language change events to re-render active search results
      if (typeof window !== 'undefined') {
        window.addEventListener('meyar:lang-changed', () => {
          const currentInput = document.getElementById('global-search-input');
          const currentContainer = document.getElementById('search-results-container');
          if (currentContainer) {
            this.renderResults(currentInput ? currentInput.value : '', currentContainer);
          }
        });
      }

      this.isInitialized = true;
    }
  }

  /**
   * Open search modal, clear active index, and focus input field
   */
  static open() {
    if (typeof document === 'undefined') return;

    Modal.open('search-modal');
    this.activeIndex = -1;

    const searchInput = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('search-results-container');

    if (searchInput) {
      setTimeout(() => {
        searchInput.focus();
        if (typeof searchInput.select === 'function') {
          searchInput.select();
        }
      }, 50);

      if (resultsContainer) {
        this.renderResults(searchInput.value, resultsContainer);
      }
    } else if (resultsContainer) {
      this.renderResults('', resultsContainer);
    }
  }

  /**
   * Close search modal
   */
  static close() {
    if (typeof document === 'undefined') return;
    Modal.close('search-modal');
    this.activeIndex = -1;
  }

  /**
   * Query all domain entities in the temporary reference fixtures
   * @param {string} searchTerm 
   * @returns {{ recipes: Array, chefs: Array, supplies: Array, courses: Array, total: number }}
   */
  static query(searchTerm) {
    const rawQuery = (searchTerm || '').trim();
    if (!rawQuery) {
      return { recipes: [], chefs: [], supplies: [], courses: [], total: 0 };
    }

    const normQuery = normalizeSearchQuery(rawQuery);
    const rawLower = rawQuery.toLowerCase();

    // Helper matcher checking both raw lowercase and normalized Arabic
    const matchesText = (val) => {
      if (!val) return false;
      const str = String(val);
      if (str.toLowerCase().includes(rawLower)) return true;
      return normalizeSearchQuery(str).includes(normQuery);
    };

    const matchesList = (arr) => {
      if (!Array.isArray(arr)) return false;
      return arr.some(item => matchesText(item));
    };

    // 1. Recipes matching
    const recipes = (RECIPE_FIXTURES || []).filter(r =>
      matchesText(r.title_ar) ||
      matchesText(r.title_en) ||
      matchesText(r.title) ||
      matchesText(r.cuisine) ||
      matchesText(r.cuisine_ar) ||
      matchesText(r.cuisine_en) ||
      matchesText(r.category_ar) ||
      matchesText(r.category_en) ||
      matchesText(r.category) ||
      matchesText(r.author_name_ar) ||
      matchesText(r.author_name_en) ||
      matchesText(r.description_ar) ||
      matchesText(r.description_en) ||
      matchesList(r.tags) ||
      (Array.isArray(r.ingredients) && r.ingredients.some(ing => matchesText(ing.name_ar) || matchesText(ing.name_en)))
    );

    // 2. Chefs matching
    const chefs = (CHEF_FIXTURES || []).filter(c =>
      matchesText(c.name_ar) ||
      matchesText(c.name_en) ||
      matchesText(c.name) ||
      matchesText(c.handle) ||
      matchesText(c.title_ar) ||
      matchesText(c.title_en) ||
      matchesText(c.title) ||
      matchesText(c.specialty) ||
      matchesText(c.specialty_ar) ||
      matchesText(c.specialty_en) ||
      matchesText(c.bio_ar) ||
      matchesText(c.bio_en)
    );

    // 3. B2B Supplies matching
    const supplies = (SUPPLY_FIXTURES || []).filter(s =>
      matchesText(s.name_ar) ||
      matchesText(s.name_en) ||
      matchesText(s.name) ||
      matchesText(s.category) ||
      matchesText(s.category_ar) ||
      matchesText(s.category_en) ||
      matchesText(s.supplier?.name_ar) ||
      matchesText(s.supplier?.name_en) ||
      matchesText(s.supplier_name_ar) ||
      matchesText(s.supplier_name_en) ||
      matchesText(s.description_ar) ||
      matchesText(s.description_en) ||
      matchesList(s.tags) ||
      (Array.isArray(s.specs) && s.specs.some(sp => matchesText(sp.value_ar) || matchesText(sp.value_en) || matchesText(sp.label_ar) || matchesText(sp.label_en)))
    );

    // 4. Courses / Masterclasses matching
    const courses = (COURSE_FIXTURES || []).filter(co =>
      matchesText(co.title_ar) ||
      matchesText(co.title_en) ||
      matchesText(co.title) ||
      matchesText(co.subtitle_ar) ||
      matchesText(co.subtitle_en) ||
      matchesText(co.instructor_name_ar) ||
      matchesText(co.instructor_name_en) ||
      matchesText(co.level_ar) ||
      matchesText(co.level_en) ||
      matchesText(co.level)
    );

    const total = recipes.length + chefs.length + supplies.length + courses.length;

    return {
      recipes,
      chefs,
      supplies,
      courses,
      total
    };
  }

  /**
   * Render structured results into target container
   * @param {string} rawQuery 
   * @param {HTMLElement} [container] 
   */
  static renderResults(rawQuery, container = typeof document !== 'undefined' ? document.getElementById('search-results-container') : null) {
    if (!container) return;

    const trimmed = (rawQuery || '').trim();
    if (!trimmed) {
      container.innerHTML = `
        <div class="p-8 text-center text-xs text-text-muted" data-i18n="search.type_prompt">
          ${I18n.t('search.type_prompt')}
        </div>
      `;
      return;
    }

    const results = this.query(trimmed);
    const lang = I18n.getLang();

    if (results.total === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-xs text-text-muted" data-i18n="search.no_results">
          ${I18n.t('search.no_results')}
        </div>
      `;
      return;
    }

    let html = '<div class="space-y-4 p-2">';

    // --- Section 1: Recipes ---
    if (results.recipes.length > 0) {
      html += `
        <div>
          <div class="px-3 py-1.5 text-xs font-semibold text-brand-gold uppercase tracking-wider">
            ${I18n.t('nav.recipes')} (${results.recipes.length})
          </div>
          <div class="space-y-1 mt-1">
      `;
      results.recipes.slice(0, 3).forEach(r => {
        const title = lang === 'ar' ? (r.title_ar || r.title_en) : (r.title_en || r.title_ar);
        const difficulty = lang === 'ar' ? (r.difficulty_ar || r.difficulty) : (r.difficulty_en || r.difficulty);
        const cuisine = lang === 'ar' ? (r.cuisine_ar || r.cuisine) : (r.cuisine_en || r.cuisine);
        
        html += `
          <a href="recipe.html?id=${r.id}" class="search-result-item flex items-center gap-3 p-2.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border-subtle transition-colors group">
            <img src="${r.image}" class="w-11 h-11 rounded-md object-cover border border-border-subtle shrink-0" alt="${title}" loading="lazy"/>
            <div class="flex-1 min-w-0">
              <h5 class="text-sm font-semibold text-text-main group-hover:text-brand-gold truncate">${title}</h5>
              <div class="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <span>${r.prep_time} ${lang === 'ar' ? 'دقيقة' : 'min'}</span>
                <span>•</span>
                <span>${difficulty}</span>
                <span>•</span>
                <span class="truncate">${cuisine}</span>
              </div>
            </div>
          </a>
        `;
      });
      html += `</div></div>`;
    }

    // --- Section 2: Chefs ---
    if (results.chefs.length > 0) {
      html += `
        <div>
          <div class="px-3 py-1.5 text-xs font-semibold text-brand-gold uppercase tracking-wider">
            ${I18n.t('search.chefs')} (${results.chefs.length})
          </div>
          <div class="space-y-1 mt-1">
      `;
      results.chefs.slice(0, 3).forEach(c => {
        const name = lang === 'ar' ? (c.name_ar || c.name_en) : (c.name_en || c.name_ar);
        const specialty = lang === 'ar' ? (c.specialty_ar || c.specialty) : (c.specialty_en || c.specialty);
        const followers = c.followers_formatted || `${c.followers || 0}`;

        html += `
          <a href="chef.html?id=${c.id}" class="search-result-item flex items-center gap-3 p-2.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border-subtle transition-colors group">
            <img src="${c.avatar}" class="w-11 h-11 rounded-full object-cover border border-border-subtle shrink-0" alt="${name}" loading="lazy"/>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <h5 class="text-sm font-semibold text-text-main group-hover:text-brand-gold truncate">${name}</h5>
                ${c.verified ? '<span class="text-brand-gold text-xs shrink-0" title="Verified">✓</span>' : ''}
              </div>
              <div class="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <span class="truncate">${specialty}</span>
                <span>•</span>
                <span class="shrink-0">${followers} ${I18n.t('chef.followers')}</span>
              </div>
            </div>
          </a>
        `;
      });
      html += `</div></div>`;
    }

    // --- Section 3: B2B Commercial Supplies ---
    if (results.supplies.length > 0) {
      html += `
        <div>
          <div class="px-3 py-1.5 text-xs font-semibold text-brand-gold uppercase tracking-wider">
            ${I18n.t('nav.supplies')} (${results.supplies.length})
          </div>
          <div class="space-y-1 mt-1">
      `;
      results.supplies.slice(0, 3).forEach(s => {
        const name = lang === 'ar' ? (s.name_ar || s.name_en || s.name) : (s.name_en || s.name_ar || s.name);
        const supplier = lang === 'ar' ? (s.supplier?.name_ar || s.supplier_name_ar || s.supplier?.name_en || s.supplier_name_en || '') : (s.supplier?.name_en || s.supplier_name_en || s.supplier?.name_ar || s.supplier_name_ar || '');

        html += `
          <a href="supplies.html?id=${s.id}" class="search-result-item flex items-center gap-3 p-2.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border-subtle transition-colors group">
            <img src="${s.image}" class="w-11 h-11 rounded-md object-cover border border-border-subtle shrink-0" alt="${name}" loading="lazy"/>
            <div class="flex-1 min-w-0">
              <h5 class="text-sm font-semibold text-text-main group-hover:text-brand-gold truncate">${name}</h5>
              <div class="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <span class="font-medium text-brand-emerald">${s.price_formatted}</span>
                <span>•</span>
                <span>MOQ: ${s.moq}</span>
                <span>•</span>
                <span class="truncate">${supplier}</span>
              </div>
            </div>
          </a>
        `;
      });
      html += `</div></div>`;
    }

    // --- Section 4: Masterclasses & Courses ---
    if (results.courses.length > 0) {
      html += `
        <div>
          <div class="px-3 py-1.5 text-xs font-semibold text-brand-gold uppercase tracking-wider">
            ${I18n.t('nav.courses')} (${results.courses.length})
          </div>
          <div class="space-y-1 mt-1">
      `;
      results.courses.slice(0, 3).forEach(co => {
        const title = lang === 'ar' ? (co.title_ar || co.title_en) : (co.title_en || co.title_ar);
        const instructor = lang === 'ar' ? (co.instructor_name_ar || co.instructor_name_en) : (co.instructor_name_en || co.instructor_name_ar);

        html += `
          <a href="courses.html?id=${co.id}" class="search-result-item flex items-center gap-3 p-2.5 rounded-lg bg-surface-1 hover:bg-surface-2 border border-border-subtle transition-colors group">
            <img src="${co.image}" class="w-11 h-11 rounded-md object-cover border border-border-subtle shrink-0" alt="${title}" loading="lazy"/>
            <div class="flex-1 min-w-0">
              <h5 class="text-sm font-semibold text-text-main group-hover:text-brand-gold truncate">${title}</h5>
              <div class="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <span class="font-medium text-brand-emerald">${co.price_formatted}</span>
                <span>•</span>
                <span class="truncate">${instructor}</span>
              </div>
            </div>
          </a>
        `;
      });
      html += `</div></div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Handle keyboard arrows (Down, Up) and Enter key navigation inside search results
   * @param {KeyboardEvent} e 
   */
  static handleKeyboardNavigation(e) {
    if (typeof document === 'undefined') return;

    const items = Array.from(document.querySelectorAll('.search-result-item'));
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % items.length;
      this.updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
      this.updateActiveItem(items);
    } else if (e.key === 'Enter' && this.activeIndex >= 0 && this.activeIndex < items.length) {
      e.preventDefault();
      items[this.activeIndex].click();
    }
  }

  /**
   * Highlight active keyboard item in the list
   * @param {Array<HTMLElement>} items 
   */
  static updateActiveItem(items) {
    items.forEach((item, idx) => {
      if (idx === this.activeIndex) {
        item.classList.add('bg-surface-2', 'ring-1', 'ring-brand-gold');
        if (typeof item.scrollIntoView === 'function') {
          item.scrollIntoView({ block: 'nearest' });
        }
      } else {
        item.classList.remove('bg-surface-2', 'ring-1', 'ring-brand-gold');
      }
    });
  }
}
