/**
 * Meyar (معيار) Dynamic Serving Scaler Module
 * High-precision ingredient scaling engine with fraction formatting (¼, ⅓, ½, ⅔, ¾),
 * bilingual unit rendering (Arabic & English), and dynamic UI synchronization.
 */

import { I18n } from '../core/i18n.js';

export class RecipeScaler {
  /**
   * @param {Object} options
   * @param {string} [options.containerId] - DOM element ID where ingredients are rendered
   * @param {number} [options.baseServings] - Base recipe serving count (default: 4)
   * @param {Array} [options.ingredients] - Initial ingredient collection
   * @param {Function} [options.onChange] - Callback fired when servings change: (servings, scaledList) => void
   */
  constructor({ containerId = 'recipe-ingredients-list', baseServings = 4, ingredients = [], onChange = null } = {}) {
    this.containerId = containerId;
    this.container = typeof document !== 'undefined' && containerId ? document.getElementById(containerId) : null;
    this.baseServings = Math.max(1, Number(baseServings) || 4);
    this.currentServings = this.baseServings;
    this.ingredients = Array.isArray(ingredients) ? JSON.parse(JSON.stringify(ingredients)) : [];
    this.onChange = onChange;
    this.minServings = 1;
    this.maxServings = 48;
  }

  /**
   * Initialize or reset scaler with new dataset
   * @param {number} baseServings 
   * @param {Array} ingredients 
   */
  init(baseServings, ingredients) {
    if (baseServings !== undefined && baseServings !== null) {
      this.baseServings = Math.max(1, Number(baseServings) || 4);
      this.currentServings = this.baseServings;
    }
    if (ingredients !== undefined && ingredients !== null) {
      this.ingredients = Array.isArray(ingredients) ? JSON.parse(JSON.stringify(ingredients)) : [];
    }
    if (typeof document !== 'undefined' && this.containerId && !this.container) {
      this.container = document.getElementById(this.containerId);
    }
    return this.render();
  }

  /**
   * Set target servings count
   * @param {number} targetServings 
   */
  setServings(targetServings) {
    const parsed = Number(targetServings);
    if (isNaN(parsed)) return;
    const clamped = Math.max(this.minServings, Math.min(this.maxServings, Math.round(parsed)));
    if (clamped === this.currentServings) return;

    this.currentServings = clamped;
    const scaled = this.getScaledIngredients();
    this.render();
    if (typeof this.onChange === 'function') {
      this.onChange(this.currentServings, scaled);
    }
  }

  /**
   * Alias for setServings
   * @param {number} targetServings 
   */
  scale(targetServings) {
    this.setServings(targetServings);
  }

  /**
   * Increment servings count by 1
   */
  increment() {
    if (this.currentServings < this.maxServings) {
      this.setServings(this.currentServings + 1);
    }
  }

  /**
   * Decrement servings count by 1
   */
  decrement() {
    if (this.currentServings > this.minServings) {
      this.setServings(this.currentServings - 1);
    }
  }

  /**
   * Reset back to recipe base servings
   */
  reset() {
    this.setServings(this.baseServings);
  }

  /**
   * Format numerical quantities with beautiful Unicode culinary fractions
   * @param {number} val 
   * @returns {string}
   */
  formatQuantity(val) {
    if (val === null || val === undefined || isNaN(val)) return '';
    if (val <= 0) return '0';

    // Exact whole integer check
    if (Math.abs(val - Math.round(val)) < 0.0001) {
      return Math.round(val).toString();
    }

    const fractions = [
      { dec: 0.25,  frac: '¼', tol: 0.035 },
      { dec: 0.333, frac: '⅓', tol: 0.035 },
      { dec: 0.5,   frac: '½', tol: 0.035 },
      { dec: 0.667, frac: '⅔', tol: 0.035 },
      { dec: 0.75,  frac: '¾', tol: 0.035 },
      { dec: 0.125, frac: '⅛', tol: 0.018 },
      { dec: 0.375, frac: '⅜', tol: 0.018 },
      { dec: 0.625, frac: '⅝', tol: 0.018 },
      { dec: 0.875, frac: '⅞', tol: 0.018 }
    ];

    const whole = Math.floor(val);
    const decimal = val - whole;

    // Check if decimal matches any culinary fraction within tailored tolerance
    let bestMatch = null;
    let minDiff = 1.0;

    for (const f of fractions) {
      const diff = Math.abs(decimal - f.dec);
      if (diff <= f.tol && diff < minDiff) {
        minDiff = diff;
        bestMatch = f.frac;
      }
    }

    if (bestMatch) {
      return whole > 0 ? `${whole} ${bestMatch}` : bestMatch;
    }

    // Check if decimal is close to 1.0
    if (decimal >= 0.96) {
      return (whole + 1).toString();
    }

    // If whole > 0 and decimal is tiny, round down
    if (decimal <= 0.04 && whole > 0) {
      return whole.toString();
    }

    // Format with 1 decimal place, stripping trailing zeros
    return Number(val.toFixed(1)).toString();
  }

  /**
   * Compute scaled ingredient objects with formatted amounts and localized names
   * @returns {Array}
   */
  getScaledIngredients() {
    const factor = this.currentServings / (this.baseServings || 1);
    const lang = I18n.getLang();

    return this.ingredients.map(item => {
      const baseAmt = typeof item.baseAmount === 'number' ? item.baseAmount : (typeof item.amount === 'number' ? item.amount : 0);
      const rawQty = baseAmt * factor;
      const formattedQty = this.formatQuantity(rawQty);

      const name = lang === 'ar' ? (item.name_ar || item.name || '') : (item.name_en || item.name || item.name_ar || '');
      const unit = lang === 'ar' ? (item.unit_ar || item.unit || '') : (item.unit_en || item.unit || item.unit_ar || '');
      const notes = lang === 'ar' ? (item.notes_ar || item.notes || '') : (item.notes_en || item.notes || item.notes_ar || '');

      return {
        ...item,
        scaledAmount: rawQty,
        formattedAmount: formattedQty,
        name,
        unit,
        notes,
        factor
      };
    });
  }

  /**
   * Render scaled ingredients list to the DOM container
   * @returns {string} HTML string
   */
  render() {
    if (typeof document !== 'undefined' && this.containerId && !this.container) {
      this.container = document.getElementById(this.containerId);
    }

    const scaledItems = this.getScaledIngredients();
    const factor = this.currentServings / (this.baseServings || 1);
    const isScaled = this.currentServings !== this.baseServings;

    let html = '';
    if (scaledItems.length === 0) {
      const emptyMsg = I18n.getLang() === 'ar' ? 'لا توجد مكونات مسجلة لهذه الوصفة' : 'No ingredients listed for this recipe';
      html = `<li class="py-6 text-center text-text-muted text-sm">${emptyMsg}</li>`;
    } else {
      scaledItems.forEach((item, index) => {
        html += `
          <li class="group flex items-center justify-between gap-3 py-3 px-3.5 rounded-xl hover:bg-surface-2 transition-colors border-b border-border-subtle last:border-b-0 text-sm" data-ingredient-row data-ingredient-id="${item.id || index}">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <label class="flex items-start gap-3 cursor-pointer select-none min-w-0">
                <input type="checkbox" class="w-4 h-4 rounded border-border-subtle bg-surface-1 text-brand-gold focus:ring-brand-gold shrink-0 cursor-pointer transition-colors mt-0.5" data-ingredient-checkbox aria-label="${item.name}">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 hidden sm:block mt-2"></span>
                <span class="text-text-main font-semibold group-has-[:checked]:line-through group-has-[:checked]:text-text-muted transition-colors">${item.name}</span>
              </label>
              ${item.notes ? `<span class="text-xs text-text-muted hidden md:inline shrink-0 font-normal">(${item.notes})</span>` : ''}
            </div>
            <div class="text-end font-bold text-brand-gold shrink-0 flex items-center gap-1 ps-2 group-has-[:checked]:opacity-60 transition-opacity">
              <span class="text-sm sm:text-base">${item.formattedAmount}</span>
              ${item.unit ? `<span class="text-xs text-text-muted font-medium">${item.unit}</span>` : ''}
            </div>
          </li>
        `;
      });
    }

    if (this.container) {
      this.container.innerHTML = html;
    }

    // Update serving counters and indicators across the DOM
    if (typeof document !== 'undefined') {
      const displayCounters = document.querySelectorAll('#scaler-serving-count, [data-scaler-serving-count]');
      displayCounters.forEach(el => {
        el.textContent = this.currentServings.toString();
      });

      const baseDisplayCounters = document.querySelectorAll('#scaler-base-count, [data-scaler-base-count]');
      baseDisplayCounters.forEach(el => {
        el.textContent = this.baseServings.toString();
      });

      // Update factor badges if present
      const factorBadges = document.querySelectorAll('[data-scaler-factor]');
      factorBadges.forEach(el => {
        if (isScaled) {
          el.textContent = `${factor.toFixed(factor % 1 === 0 ? 0 : 2)}x`;
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      });

      // Update decrement & increment button disabled states
      const minusBtns = document.querySelectorAll('#scaler-btn-minus, [data-action="decrement-servings"]');
      minusBtns.forEach(btn => {
        if (this.currentServings <= this.minServings) {
          btn.setAttribute('disabled', 'true');
          btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          btn.removeAttribute('disabled');
          btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      });

      const plusBtns = document.querySelectorAll('#scaler-btn-plus, [data-action="increment-servings"]');
      plusBtns.forEach(btn => {
        if (this.currentServings >= this.maxServings) {
          btn.setAttribute('disabled', 'true');
          btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          btn.removeAttribute('disabled');
          btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      });
    }

    return html;
  }
}
