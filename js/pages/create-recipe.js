/**
 * Meyar (معيار) Recipe Creator Studio Controller
 * Comprehensive 4-step wizard interface for crafting gourmet recipes with
 * dynamic ingredient list builder, step-by-step cooking method builder,
 * drag-and-drop media upload simulation, transient draft state, and publishing pipeline.
 */

import { RECIPE_FIXTURES, USER_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Toast } from '../core/toast.js';

export class CreateRecipeStudio {
  static UNITS = [
    { value: 'g', label_ar: 'جرام (g)', label_en: 'g (grams)' },
    { value: 'kg', label_ar: 'كغ (kg)', label_en: 'kg (kilograms)' },
    { value: 'ml', label_ar: 'مل (ml)', label_en: 'ml (milliliters)' },
    { value: 'l', label_ar: 'لتر (L)', label_en: 'L (liters)' },
    { value: 'tbsp', label_ar: 'ملعقة كبيرة (tbsp)', label_en: 'tbsp (tablespoon)' },
    { value: 'tsp', label_ar: 'ملعقة صغيرة (tsp)', label_en: 'tsp (teaspoon)' },
    { value: 'cup', label_ar: 'كوب (cup)', label_en: 'cup (cups)' },
    { value: 'pcs', label_ar: 'حبة (pcs)', label_en: 'pcs (pieces)' },
    { value: 'pinch', label_ar: 'رشة (pinch)', label_en: 'pinch' },
    { value: 'slice', label_ar: 'شريحة (slice)', label_en: 'slice' },
    { value: 'clove', label_ar: 'فص (clove)', label_en: 'clove' },
    { value: 'handful', label_ar: 'حفنة (handful)', label_en: 'handful' }
  ];

  static SECTIONS = [
    { value: 'Main', label_ar: 'المكون الرئيسي (Main)', label_en: 'Main Ingredient' },
    { value: 'Marinade', label_ar: 'التتبيلة والنقع (Marinade & Rub)', label_en: 'Marinade & Rub' },
    { value: 'Sauce', label_ar: 'الصلصة والغليز (Sauce & Glaze)', label_en: 'Sauce & Glaze' },
    { value: 'Garnish', label_ar: 'التزيين واللمسة النهائية (Garnish)', label_en: 'Garnish & Finish' },
    { value: 'Seasoning', label_ar: 'البهارات والتوابل (Seasoning)', label_en: 'Seasoning' }
  ];

  static currentStep = 1;
  static totalSteps = 4;
  static coverImage = '';
  static galleryImages = [];
  static autoSaveTimer = null;
  static isInitialized = false;

  /**
   * Navigate to a specific wizard step
   * @param {number} stepNumber 
   */
  static goToStep(stepNumber) {
    const targetStep = Math.max(1, Math.min(this.totalSteps, Number(stepNumber) || 1));
    this.currentStep = targetStep;

    // Update panel visibility
    document.querySelectorAll('.wizard-panel').forEach(panel => {
      const panelStep = Number(panel.getAttribute('data-panel'));
      if (panelStep === targetStep) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    // Update Stepper Navigation Buttons
    document.querySelectorAll('.wizard-step-btn').forEach(btn => {
      const btnStep = Number(btn.getAttribute('data-step'));
      const badge = btn.querySelector('.step-badge');
      
      btn.classList.remove('active', 'completed', 'border-brand-gold', 'bg-surface-2', 'border-brand-emerald');
      if (badge) {
        badge.classList.remove('bg-brand-gold', 'bg-brand-emerald', 'text-white');
      }

      if (btnStep === targetStep) {
        btn.classList.add('active', 'border-brand-gold', 'bg-surface-2');
        if (badge) badge.classList.add('bg-brand-gold', 'text-white');
      } else if (btnStep < targetStep) {
        btn.classList.add('completed', 'border-border-subtle', 'bg-surface-1');
        if (badge) badge.classList.add('bg-brand-emerald', 'text-white');
      } else {
        btn.classList.add('border-border-subtle', 'bg-surface-1');
      }
    });

    // Update Sticky Bottom Navigation Bar Controls
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    const publishBtn = document.getElementById('publish-recipe-btn');
    const stepText = document.getElementById('step-indicator-text');

    if (prevBtn) {
      if (targetStep > 1) {
        prevBtn.classList.remove('hidden');
      } else {
        prevBtn.classList.add('hidden');
      }
    }

    if (nextBtn && publishBtn) {
      if (targetStep < this.totalSteps) {
        nextBtn.classList.remove('hidden');
        publishBtn.classList.add('hidden');
      } else {
        nextBtn.classList.add('hidden');
        publishBtn.classList.remove('hidden');
      }
    }

    if (stepText) {
      const isAr = (I18n?.currentLang || 'ar') === 'ar';
      stepText.textContent = isAr 
        ? `المرحلة ${targetStep} من ${this.totalSteps}`
        : `Step ${targetStep} of ${this.totalSteps}`;
    }

    // Scroll to top of wizard smoothly
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Advance to the next wizard step with validation
   * @returns {boolean}
   */
  static nextStep() {
    const validation = this.validateStep(this.currentStep);
    if (!validation.valid) {
      this.showValidationSummary(validation.errors);
      Toast.error(validation.errors[0] || 'يرجى إكمال الحقول الإلزامية');
      return false;
    }

    this.hideValidationSummary();
    this.saveDraft(false);
    this.goToStep(this.currentStep + 1);
    return true;
  }

  /**
   * Move back to the previous wizard step
   * @returns {boolean}
   */
  static prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
      return true;
    }
    return false;
  }

  /**
   * Add a dynamic ingredient row to the ingredients list
   * @param {Object} data 
   * @returns {HTMLElement}
   */
  static addIngredientRow(data = {}) {
    const listContainer = document.getElementById('ingredients-list');
    if (!listContainer) return null;

    const rowId = data.id || `ing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const isAr = (I18n?.currentLang || 'ar') === 'ar';

    const unitOptionsHtml = this.UNITS.map(u => {
      const isSelected = (data.unit_en === u.value || data.unit_ar === u.label_ar || data.unit === u.value);
      return `<option value="${u.value}" ${isSelected ? 'selected' : ''}>${isAr ? u.label_ar : u.label_en}</option>`;
    }).join('');

    const sectionOptionsHtml = this.SECTIONS.map(s => {
      const isSelected = (data.section === s.value || data.section === s.label_ar);
      return `<option value="${s.value}" ${isSelected ? 'selected' : ''}>${isAr ? s.label_ar : s.label_en}</option>`;
    }).join('');

    const row = document.createElement('div');
    row.className = 'ingredient-row bg-surface-2 border border-border-subtle rounded-xl p-3 sm:p-4 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-center transition-all';
    row.setAttribute('data-ingredient-id', rowId);

    row.innerHTML = `
      <!-- Ingredient Names (AR & EN) -->
      <div class="md:col-span-4 space-y-1.5 text-start">
        <label class="block text-[11px] font-bold text-text-muted md:hidden" data-i18n="recipe.ingredient_name">اسم المكون</label>
        <div class="space-y-1">
          <input type="text" class="ingredient-name-ar w-full px-3 py-1.5 text-xs bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold"
                 placeholder="اسم المكون (عربي) *" value="${this.escapeHtml(data.name_ar || '')}" required>
          <input type="text" class="ingredient-name-en w-full px-3 py-1.5 text-xs bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold"
                 placeholder="English Name (Optional)" value="${this.escapeHtml(data.name_en || '')}" dir="ltr">
        </div>
      </div>

      <!-- Quantity -->
      <div class="md:col-span-2 space-y-1 text-start">
        <label class="block text-[11px] font-bold text-text-muted md:hidden" data-i18n="recipe.ingredient_qty">الكمية</label>
        <input type="number" step="any" min="0.01" class="ingredient-qty w-full px-3 py-1.5 text-xs font-bold text-center bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold"
               placeholder="100" value="${data.baseAmount !== undefined ? data.baseAmount : (data.amount || 100)}" required>
      </div>

      <!-- Unit Selector -->
      <div class="md:col-span-2 space-y-1 text-start">
        <label class="block text-[11px] font-bold text-text-muted md:hidden" data-i18n="recipe.ingredient_unit">الوحدة</label>
        <select class="ingredient-unit w-full px-2 py-1.5 text-xs bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold">
          ${unitOptionsHtml}
        </select>
      </div>

      <!-- Section & Notes -->
      <div class="md:col-span-3 space-y-1 text-start">
        <label class="block text-[11px] font-bold text-text-muted md:hidden" data-i18n="recipe.ingredient_notes">القسم والملاحظات</label>
        <select class="ingredient-section w-full px-2 py-1 text-[11px] bg-surface-1 border border-border-subtle rounded-lg text-text-main mb-1 focus:outline-none focus:ring-1 focus:ring-brand-gold">
          ${sectionOptionsHtml}
        </select>
        <input type="text" class="ingredient-notes-ar w-full px-2.5 py-1 text-[11px] bg-surface-1 border border-border-subtle rounded-lg text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-gold"
               placeholder="ملاحظات التحضير (اختياري)" value="${this.escapeHtml(data.notes_ar || data.notes || '')}">
      </div>

      <!-- Remove Row Button -->
      <div class="md:col-span-1 flex items-center justify-end md:justify-center pt-2 md:pt-0">
        <button type="button" class="remove-ingredient-btn p-1.5 text-text-muted hover:text-red-500 bg-surface-1 hover:bg-surface-2 border border-border-subtle rounded-lg transition-colors"
                title="حذف هذا المكون" aria-label="Delete Ingredient">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    `;

    // Attach row remove event
    const removeBtn = row.querySelector('.remove-ingredient-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.removeIngredientRow(row);
      });
    }

    // Attach auto-save trigger on input change
    row.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', () => this.scheduleAutoSave());
    });

    listContainer.appendChild(row);
    return row;
  }

  /**
   * Remove an ingredient row from DOM
   * @param {HTMLElement} rowElement 
   */
  static removeIngredientRow(rowElement) {
    if (!rowElement) return;
    const listContainer = document.getElementById('ingredients-list');
    if (listContainer && rowElement.parentElement === listContainer) {
      listContainer.removeChild(rowElement);
      this.saveDraft(false);
    }
  }

  /**
   * Extract all current ingredients from the DOM
   * @returns {Array<Object>}
   */
  static getIngredients() {
    const listContainer = document.getElementById('ingredients-list');
    if (!listContainer) return [];

    const rows = listContainer.querySelectorAll('.ingredient-row');
    const items = [];

    rows.forEach((row, idx) => {
      const nameAr = row.querySelector('.ingredient-name-ar')?.value?.trim() || '';
      const nameEn = row.querySelector('.ingredient-name-en')?.value?.trim() || nameAr;
      const qtyStr = row.querySelector('.ingredient-qty')?.value;
      const baseAmount = Number(qtyStr) || 0;
      const unitVal = row.querySelector('.ingredient-unit')?.value || 'g';
      const sectionVal = row.querySelector('.ingredient-section')?.value || 'Main';
      const notesAr = row.querySelector('.ingredient-notes-ar')?.value?.trim() || '';
      
      const unitObj = this.UNITS.find(u => u.value === unitVal) || this.UNITS[0];

      if (nameAr || nameEn) {
        items.push({
          id: row.getAttribute('data-ingredient-id') || `ing-${idx + 1}`,
          name_ar: nameAr,
          name_en: nameEn,
          baseAmount,
          unit_ar: unitObj.label_ar.split(' ')[0],
          unit_en: unitObj.value,
          section: sectionVal,
          notes_ar: notesAr,
          notes_en: notesAr
        });
      }
    });

    return items;
  }

  /**
   * Populate ingredients list from array
   * @param {Array<Object>} ingredientsArray 
   */
  static setIngredients(ingredientsArray = []) {
    const listContainer = document.getElementById('ingredients-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    if (Array.isArray(ingredientsArray) && ingredientsArray.length > 0) {
      ingredientsArray.forEach(item => this.addIngredientRow(item));
    } else {
      // Default 1 initial row
      this.addIngredientRow();
    }
  }

  /**
   * Add a dynamic instruction step card
   * @param {Object} data 
   * @returns {HTMLElement}
   */
  static addInstructionStep(data = {}) {
    const listContainer = document.getElementById('instructions-list');
    if (!listContainer) return null;

    const currentCount = listContainer.querySelectorAll('.instruction-step-card').length;
    const stepNumber = data.step_number || (currentCount + 1);
    const cardId = `step-card-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const card = document.createElement('div');
    card.className = 'instruction-step-card bg-surface-2 border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 transition-all text-start';
    card.setAttribute('data-step-card-id', cardId);

    card.innerHTML = `
      <!-- Step Header Bar -->
      <div class="flex items-center justify-between border-b border-border-subtle pb-3">
        <div class="flex items-center gap-2.5">
          <span class="step-card-num-badge w-7 h-7 rounded-lg bg-brand-gold text-white font-extrabold text-xs flex items-center justify-center">
            ${stepNumber}
          </span>
          <span class="step-card-heading text-xs sm:text-sm font-bold text-text-main">
            الخطوة ${stepNumber}
          </span>
        </div>

        <!-- Step Actions (Move Up, Move Down, Delete) -->
        <div class="flex items-center gap-1.5">
          <button type="button" class="move-step-up-btn p-1.5 text-text-muted hover:text-text-main bg-surface-1 border border-border-subtle rounded-lg transition-colors" title="تحريك لأعلى">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button type="button" class="move-step-down-btn p-1.5 text-text-muted hover:text-text-main bg-surface-1 border border-border-subtle rounded-lg transition-colors" title="تحريك لأسفل">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button type="button" class="remove-step-btn p-1.5 text-text-muted hover:text-red-500 bg-surface-1 hover:bg-surface-2 border border-border-subtle rounded-lg transition-colors" title="حذف الخطوة">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <!-- Step Titles (AR & EN) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-text-muted">عنوان المرحلة بالعربية</label>
          <input type="text" class="step-title-ar w-full px-3 py-1.5 text-xs bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold"
                 placeholder="مثال: تحضير لحم الواغيو والتتبيل الأولي" value="${this.escapeHtml(data.title_ar || '')}">
        </div>
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-text-muted">Step Title (English)</label>
          <input type="text" class="step-title-en w-full px-3 py-1.5 text-xs bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold"
                 placeholder="e.g. Wagyu Tempering & Initial Seasoning" value="${this.escapeHtml(data.title_en || '')}" dir="ltr">
        </div>
      </div>

      <!-- Step Detailed Instructions (AR & EN) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-text-muted" data-i18n="recipe.instruction_desc">شرح تفاصيل هذه الخطوة *</label>
          <textarea class="step-instruction-ar w-full px-3 py-2 text-xs bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold resize-y"
                    rows="2" placeholder="اشرح تفاصيل ودرجة الحرارة والحركات التقنية المطلوبة..." required>${this.escapeHtml(data.instruction_ar || '')}</textarea>
        </div>
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-text-muted">Step Instructions (English)</label>
          <textarea class="step-instruction-en w-full px-3 py-2 text-xs bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold resize-y"
                    rows="2" placeholder="Explain the technical execution, heat control, and duration..." dir="ltr">${this.escapeHtml(data.instruction_en || '')}</textarea>
        </div>
      </div>

      <!-- Timer, Pro Tip & Step Photo -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
        
        <!-- Timer in minutes -->
        <div class="sm:col-span-3 space-y-1">
          <label class="block text-[11px] font-bold text-text-muted">
            المؤقت <span class="text-[10px] text-text-muted font-normal">(دقيقة)</span>
          </label>
          <div class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <input type="number" min="0" max="600" class="step-timer-minutes w-full px-2.5 py-1.5 text-xs font-bold text-center bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold"
                   placeholder="10" value="${data.timer_minutes !== undefined ? data.timer_minutes : 10}">
          </div>
        </div>

        <!-- Chef's Pro Tip -->
        <div class="sm:col-span-9 space-y-1">
          <label class="block text-[11px] font-bold text-text-muted" data-i18n="recipe.instruction_tip">نصيحة الشيف السرية (اختياري)</label>
          <div class="flex items-center gap-1.5">
            <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            <input type="text" class="step-tip-ar w-full px-2.5 py-1.5 text-xs bg-surface-1 border border-border-subtle rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-brand-gold"
                   placeholder="مثال: لا تضع اللحم بارداً أبداً في المقلاة لتفادي انخفاض حرارة سطح التحمير" value="${this.escapeHtml(data.tip_ar || data.tip || '')}">
          </div>
        </div>

      </div>
    `;

    // Event handlers for actions
    const moveUpBtn = card.querySelector('.move-step-up-btn');
    const moveDownBtn = card.querySelector('.move-step-down-btn');
    const removeBtn = card.querySelector('.remove-step-btn');

    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', () => this.moveStepUp(card));
    }
    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', () => this.moveStepDown(card));
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', () => this.removeInstructionStep(card));
    }

    card.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('change', () => this.scheduleAutoSave());
    });

    listContainer.appendChild(card);
    this.reindexSteps();
    return card;
  }

  /**
   * Remove an instruction step from DOM
   * @param {HTMLElement} cardElement 
   */
  static removeInstructionStep(cardElement) {
    if (!cardElement) return;
    const listContainer = document.getElementById('instructions-list');
    if (listContainer && cardElement.parentElement === listContainer) {
      listContainer.removeChild(cardElement);
      this.reindexSteps();
      this.saveDraft(false);
    }
  }

  /**
   * Swap step position with preceding sibling
   * @param {HTMLElement} cardElement 
   */
  static moveStepUp(cardElement) {
    if (!cardElement) return;
    const prev = cardElement.previousElementSibling;
    if (prev && prev.classList.contains('instruction-step-card')) {
      cardElement.parentElement.insertBefore(cardElement, prev);
      this.reindexSteps();
      this.saveDraft(false);
    }
  }

  /**
   * Swap step position with following sibling
   * @param {HTMLElement} cardElement 
   */
  static moveStepDown(cardElement) {
    if (!cardElement) return;
    const next = cardElement.nextElementSibling;
    if (next && next.classList.contains('instruction-step-card')) {
      cardElement.parentElement.insertBefore(next, cardElement);
      this.reindexSteps();
      this.saveDraft(false);
    }
  }

  /**
   * Re-index and update step numbers in instruction cards
   */
  static reindexSteps() {
    const listContainer = document.getElementById('instructions-list');
    if (!listContainer) return;

    const cards = listContainer.querySelectorAll('.instruction-step-card');
    const isAr = (I18n?.currentLang || 'ar') === 'ar';

    cards.forEach((card, idx) => {
      const stepNum = idx + 1;
      const badge = card.querySelector('.step-card-num-badge');
      const heading = card.querySelector('.step-card-heading');

      if (badge) badge.textContent = String(stepNum);
      if (heading) heading.textContent = isAr ? `الخطوة ${stepNum}` : `Step ${stepNum}`;
    });
  }

  /**
   * Extract all instruction steps from the DOM
   * @returns {Array<Object>}
   */
  static getInstructions() {
    const listContainer = document.getElementById('instructions-list');
    if (!listContainer) return [];

    const cards = listContainer.querySelectorAll('.instruction-step-card');
    const steps = [];

    cards.forEach((card, idx) => {
      const titleAr = card.querySelector('.step-title-ar')?.value?.trim() || '';
      const titleEn = card.querySelector('.step-title-en')?.value?.trim() || titleAr;
      const instructionAr = card.querySelector('.step-instruction-ar')?.value?.trim() || '';
      const instructionEn = card.querySelector('.step-instruction-en')?.value?.trim() || instructionAr;
      const timerVal = Number(card.querySelector('.step-timer-minutes')?.value) || 0;
      const tipAr = card.querySelector('.step-tip-ar')?.value?.trim() || '';

      if (titleAr || instructionAr || titleEn || instructionEn) {
        steps.push({
          step_number: idx + 1,
          title_ar: titleAr,
          title_en: titleEn,
          instruction_ar: instructionAr,
          instruction_en: instructionEn,
          timer_minutes: timerVal,
          tip_ar: tipAr,
          tip_en: tipAr
        });
      }
    });

    return steps;
  }

  /**
   * Populate instruction steps from array
   * @param {Array<Object>} stepsArray 
   */
  static setInstructions(stepsArray = []) {
    const listContainer = document.getElementById('instructions-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    if (Array.isArray(stepsArray) && stepsArray.length > 0) {
      stepsArray.forEach((step, idx) => {
        this.addInstructionStep({ ...step, step_number: idx + 1 });
      });
    } else {
      this.addInstructionStep();
    }
  }

  /**
   * Handle cover image upload or direct URL setting
   * @param {string|File} source 
   */
  static handleCoverUpload(source) {
    if (!source) return;

    if (typeof source === 'string') {
      this.coverImage = source;
      this.renderCoverPreview(source, 'cover-image.jpg');
    } else if (source instanceof File) {
      this.coverImage = URL.createObjectURL(source);
      this.renderCoverPreview(this.coverImage, source.name);
    }
    this.scheduleAutoSave();
  }

  /**
   * Render cover image preview card
   * @param {string} url 
   * @param {string} filename 
   */
  static renderCoverPreview(url, filename = 'cover.jpg') {
    const previewCard = document.getElementById('cover-preview-card');
    const previewImg = document.getElementById('cover-preview-img');
    const filenameLabel = document.getElementById('cover-filename-label');
    const urlInput = document.getElementById('cover-image-url-input');

    if (previewCard && previewImg) {
      previewImg.src = url;
      if (filenameLabel) filenameLabel.textContent = filename;
      if (urlInput) urlInput.value = url;
      previewCard.classList.remove('hidden');
    }
  }

  /**
   * Remove cover image
   */
  static removeCoverImage() {
    this.coverImage = '';
    const previewCard = document.getElementById('cover-preview-card');
    const previewImg = document.getElementById('cover-preview-img');
    const urlInput = document.getElementById('cover-image-url-input');
    const fileInput = document.getElementById('cover-image-file-input');

    if (previewCard) previewCard.classList.add('hidden');
    if (previewImg) previewImg.src = '';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';

    this.scheduleAutoSave();
  }

  /**
   * Add image URL to gallery
   * @param {string} url 
   */
  static addGalleryImage(url) {
    if (!url) return;
    this.galleryImages.push(url);
    this.renderGalleryGrid();
    this.scheduleAutoSave();
  }

  /**
   * Remove gallery image by index
   * @param {number} index 
   */
  static removeGalleryImage(index) {
    if (index >= 0 && index < this.galleryImages.length) {
      this.galleryImages.splice(index, 1);
      this.renderGalleryGrid();
      this.scheduleAutoSave();
    }
  }

  /**
   * Render gallery thumbnails in grid
   */
  static renderGalleryGrid() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    if (this.galleryImages.length === 0) {
      galleryGrid.innerHTML = `
        <div class="col-span-full py-4 text-center text-xs text-text-muted bg-surface-2 rounded-xl border border-dashed border-border-subtle">
          لا توجد لقطات إضافية في المعرض حالياً
        </div>
      `;
      return;
    }

    galleryGrid.innerHTML = this.galleryImages.map((imgUrl, idx) => `
      <div class="relative group rounded-xl overflow-hidden bg-surface-2 border border-border-subtle aspect-video">
        <img src="${this.escapeHtml(imgUrl)}" alt="Gallery ${idx + 1}" class="w-full h-full object-cover">
        <button type="button" data-gallery-index="${idx}" class="remove-gallery-item-btn absolute top-1.5 end-1.5 p-1 bg-surface-1 hover:bg-red-500 hover:text-white text-text-muted rounded-md transition-colors shadow-md">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
        </button>
      </div>
    `).join('');

    galleryGrid.querySelectorAll('.remove-gallery-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-gallery-index'));
        this.removeGalleryImage(idx);
      });
    });
  }

  /**
   * Collect all form values into a structured Recipe object
   * @returns {Object}
   */
  static getFormData() {
    const titleAr = document.getElementById('recipe-title-ar')?.value?.trim() || '';
    const titleEn = document.getElementById('recipe-title-en')?.value?.trim() || titleAr;
    const descAr = document.getElementById('recipe-desc-ar')?.value?.trim() || '';
    const descEn = document.getElementById('recipe-desc-en')?.value?.trim() || descAr;
    const cuisine = document.getElementById('recipe-cuisine')?.value || 'Saudi';
    const category = document.getElementById('recipe-category')?.value || 'Main Course';
    const difficulty = document.getElementById('recipe-difficulty')?.value || 'Medium';

    const servings = Number(document.getElementById('recipe-servings')?.value) || 4;
    const prepTime = Number(document.getElementById('recipe-prep-time')?.value) || 20;
    const cookTime = Number(document.getElementById('recipe-cook-time')?.value) || 30;
    const calories = Number(document.getElementById('recipe-calories')?.value) || 500;

    const videoUrl = document.getElementById('recipe-video-url')?.value?.trim() || '';
    const platingNotes = document.getElementById('recipe-plating-notes')?.value?.trim() || '';

    // Selected Tags
    const tags = [];
    document.querySelectorAll('#recipe-tags-container input[type="checkbox"]:checked').forEach(cb => {
      tags.push(cb.value);
    });

    const ingredients = this.getIngredients();
    const steps = this.getInstructions();

    return {
      title_ar: titleAr,
      title_en: titleEn,
      title: titleEn || titleAr,
      description_ar: descAr,
      description_en: descEn,
      cuisine,
      cuisine_ar: this.localizeCuisine(cuisine, 'ar'),
      cuisine_en: this.localizeCuisine(cuisine, 'en'),
      category,
      category_ar: this.localizeCategory(category, 'ar'),
      category_en: category,
      difficulty,
      difficulty_ar: this.localizeDifficulty(difficulty, 'ar'),
      difficulty_en: difficulty,
      base_servings: servings,
      prep_time: prepTime,
      cook_time: cookTime,
      total_time: prepTime + cookTime,
      calories,
      tags,
      image: this.coverImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
      gallery: this.galleryImages.length > 0 ? [...this.galleryImages] : [this.coverImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'],
      video_url: videoUrl,
      plating_notes: platingNotes,
      ingredients,
      steps,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Validate a specific step's form fields
   * @param {number} stepNumber 
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validateStep(stepNumber) {
    const errors = [];

    if (stepNumber === 1) {
      const titleAr = document.getElementById('recipe-title-ar')?.value?.trim();
      const titleEn = document.getElementById('recipe-title-en')?.value?.trim();
      const descAr = document.getElementById('recipe-desc-ar')?.value?.trim();
      const descEn = document.getElementById('recipe-desc-en')?.value?.trim();
      const servings = Number(document.getElementById('recipe-servings')?.value);

      if (!titleAr && !titleEn) {
        errors.push('يرجى إدخال اسم الوصفة (بالعربية أو الإنجليزية)');
      }
      if (!descAr && !descEn) {
        errors.push('يرجى كتابة وصف أو قصة الطبق');
      }
      if (!servings || servings < 1) {
        errors.push('يرجى تحديد عدد الحصص الأساسية (1 على الأقل)');
      }
    } else if (stepNumber === 2) {
      const coverUrl = this.coverImage || document.getElementById('cover-image-url-input')?.value?.trim();
      if (!coverUrl) {
        errors.push('يرجى رفع صورة الغلاف للطبق أو إدخال رابط الصورة');
      }
    } else if (stepNumber === 3) {
      const ingredients = this.getIngredients();
      if (ingredients.length === 0) {
        errors.push('يرجى إضافة مكون واحد على الأقل للوصفة');
      } else {
        const hasValid = ingredients.some(i => (i.name_ar || i.name_en) && i.baseAmount > 0);
        if (!hasValid) {
          errors.push('يرجى التأكد من كتابة اسم المكون وتحديد الكمية بشكل صحيح');
        }
      }
    } else if (stepNumber === 4) {
      const steps = this.getInstructions();
      if (steps.length === 0) {
        errors.push('يرجى إضافة خطوة تحضير واحدة على الأقل');
      } else {
        const hasValid = steps.some(s => s.instruction_ar || s.instruction_en || s.title_ar || s.title_en);
        if (!hasValid) {
          errors.push('يرجى كتابة تفاصيل وشرح خطوة الطهي');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate all wizard steps
   * @returns {{ valid: boolean, errors: string[], firstInvalidStep: number }}
   */
  static validateAll() {
    let allErrors = [];
    let firstInvalidStep = 1;

    for (let s = 1; s <= this.totalSteps; s++) {
      const res = this.validateStep(s);
      if (!res.valid) {
        if (allErrors.length === 0) {
          firstInvalidStep = s;
        }
        allErrors = allErrors.concat(res.errors);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      firstInvalidStep
    };
  }

  /**
   * Display validation errors in the summary box
   * @param {string[]} errors 
   */
  static showValidationSummary(errors = []) {
    const summaryBox = document.getElementById('form-validation-summary');
    const list = document.getElementById('validation-errors-list');
    if (!summaryBox || !list) return;

    list.innerHTML = errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('');
    summaryBox.classList.remove('hidden');
  }

  /**
   * Hide validation summary box
   */
  static hideValidationSummary() {
    const summaryBox = document.getElementById('form-validation-summary');
    if (summaryBox) summaryBox.classList.add('hidden');
  }

  static currentDraft = null;
  static customRecipes = [];

  /**
   * Reset in-memory studio state (for test isolation)
   */
  static reset() {
    this.currentDraft = null;
    this.customRecipes = [];
    this.coverImage = '';
    this.galleryImages = [];
    this.currentStep = 1;
    this.isInitialized = false;
  }

  /**
   * Save current recipe data to the current page session
   * @param {boolean} manual 
   * @returns {boolean}
   */
  static saveDraft(manual = true) {
    try {
      const formData = this.getFormData();
      this.currentDraft = formData;

      const timeStr = new Date().toLocaleTimeString((I18n?.currentLang || 'ar') === 'ar' ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const timestampLabel = document.getElementById('autosave-timestamp');
      const draftStatus = document.getElementById('draft-status-indicator');

      if (timestampLabel) {
        timestampLabel.textContent = `تم الحفظ: ${timeStr}`;
      }
      if (draftStatus) {
        draftStatus.textContent = 'تم حفظ المسودة محلياً';
      }

      if (manual) {
        Toast.success(I18n?.t('recipe.draft_success') || 'تم حفظ مسودة الوصفة بنجاح!');
      }
      return true;
    } catch (e) {
      console.error('Failed to save draft', e);
      return false;
    }
  }

  /**
   * Load the current session draft and populate inputs
   * @returns {boolean}
   */
  static loadDraft() {
    try {
      if (!this.currentDraft) return false;

      this.populateForm(this.currentDraft);

      const draftStatus = document.getElementById('draft-status-indicator');
      if (draftStatus) {
        draftStatus.textContent = 'تم استعادة المسودة السابقة بنجاح';
      }

      return true;
    } catch (e) {
      console.error('Failed to load draft', e);
      return false;
    }
  }

  /**
   * Populate all form fields from a recipe data object
   * @param {Object} data 
   */
  static populateForm(data = {}) {
    if (!data) return;

    // Step 1
    const titleAr = document.getElementById('recipe-title-ar');
    const titleEn = document.getElementById('recipe-title-en');
    const descAr = document.getElementById('recipe-desc-ar');
    const descEn = document.getElementById('recipe-desc-en');
    const cuisine = document.getElementById('recipe-cuisine');
    const category = document.getElementById('recipe-category');
    const difficulty = document.getElementById('recipe-difficulty');
    const servings = document.getElementById('recipe-servings');
    const prepTime = document.getElementById('recipe-prep-time');
    const cookTime = document.getElementById('recipe-cook-time');
    const calories = document.getElementById('recipe-calories');

    if (titleAr) titleAr.value = data.title_ar || '';
    if (titleEn) titleEn.value = data.title_en || '';
    if (descAr) descAr.value = data.description_ar || '';
    if (descEn) descEn.value = data.description_en || '';
    if (cuisine && data.cuisine) cuisine.value = data.cuisine;
    if (category && data.category) category.value = data.category;
    if (difficulty && data.difficulty) difficulty.value = data.difficulty;
    if (servings && data.base_servings) servings.value = data.base_servings;
    if (prepTime && data.prep_time) prepTime.value = data.prep_time;
    if (cookTime && data.cook_time) cookTime.value = data.cook_time;
    if (calories && data.calories) calories.value = data.calories;

    // Tags
    if (Array.isArray(data.tags)) {
      document.querySelectorAll('#recipe-tags-container input[type="checkbox"]').forEach(cb => {
        cb.checked = data.tags.includes(cb.value);
      });
    }

    // Step 2: Media
    if (data.image) {
      this.handleCoverUpload(data.image);
    }
    if (Array.isArray(data.gallery)) {
      this.galleryImages = [...data.gallery];
      this.renderGalleryGrid();
    }
    const videoUrl = document.getElementById('recipe-video-url');
    const platingNotes = document.getElementById('recipe-plating-notes');
    if (videoUrl) videoUrl.value = data.video_url || '';
    if (platingNotes) platingNotes.value = data.plating_notes || '';

    // Step 3: Ingredients
    this.setIngredients(data.ingredients || []);

    // Step 4: Steps
    this.setInstructions(data.steps || []);
  }

  /**
   * Reset form and clear the current session draft
   */
  static clearDraft() {
    this.currentDraft = null;

    const form = document.getElementById('create-recipe-form');
    if (form) form.reset();

    this.coverImage = '';
    this.galleryImages = [];
    this.removeCoverImage();
    this.renderGalleryGrid();

    this.setIngredients([]);
    this.setInstructions([]);
    this.goToStep(1);
    this.hideValidationSummary();

    const draftStatus = document.getElementById('draft-status-indicator');
    if (draftStatus) draftStatus.textContent = 'مسودة جديدة فارغة';

    Toast.info('تمت إعادة تعيين النموذج بنجاح');
  }

  /**
   * Schedule auto-save with debounce
   */
  static scheduleAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveDraft(false);
    }, 800);
  }

  /**
   * Publish Recipe to Platform and Store
   * @returns {Object|null}
   */
  static publishRecipe() {
    const validation = this.validateAll();
    if (!validation.valid) {
      this.showValidationSummary(validation.errors);
      this.goToStep(validation.firstInvalidStep);
      Toast.error('يرجى تصحيح الأخطاء قبل نشر الوصفة');
      return null;
    }

    const formData = this.getFormData();
    const recipeId = `recipe-custom-${Date.now()}`;

    const newRecipe = {
      ...formData,
      id: recipeId,
      created_at: new Date().toISOString().split('T')[0],
      author_id: USER_FIXTURES.id,
      author_name_ar: USER_FIXTURES.name_ar,
      author_name_en: USER_FIXTURES.name_en,
      author_avatar: USER_FIXTURES.avatar,
      rating: 5.0,
      reviews_count: 0,
      likes_count: 0,
      saves_count: 0
    };

    // Add to in-memory custom recipes list and clear draft
    this.customRecipes.unshift(newRecipe);
    this.currentDraft = null;

    Toast.success(I18n?.t('recipe.published_success') || 'تم نشر الوصفة بنجاح في مجتمع معيار!');

    // Simulated redirect
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = `recipe.html?id=${recipeId}`;
      }
    }, 1500);

    return newRecipe;
  }

  /**
   * Load rich gourmet sample data into the form
   */
  static loadSampleData() {
    const sample = JSON.parse(JSON.stringify(RECIPE_FIXTURES[0] || {}));
    sample.ingredients = (sample.ingredients || []).map((ingredient, index) => ({
      ...ingredient,
      section: index === 0 ? 'Main' : 'Sauce'
    }));

    this.populateForm(sample);
    Toast.success('تم تحميل نموذج الوصفة الفاخرة بنجاح!');
  }

  /**
   * Initialize all studio event bindings, buttons, and state
   */
  static init() {
    if (typeof document !== 'undefined' && this.lastDocument !== document) {
      this.isInitialized = false;
      this.lastDocument = document;
    }
    if (this.isInitialized) return;
    if (typeof document === 'undefined') return;

    // 1. Wizard Stepper Buttons
    document.querySelectorAll('.wizard-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = Number(btn.getAttribute('data-step'));
        if (step < this.currentStep) {
          this.goToStep(step);
        } else if (step > this.currentStep) {
          // If jumping ahead, validate current step first
          if (this.nextStep() && step > this.currentStep) {
            this.goToStep(step);
          }
        }
      });
    });

    // 2. Next, Prev, Save Draft & Publish Controls
    const nextBtn = document.getElementById('next-step-btn');
    const prevBtn = document.getElementById('prev-step-btn');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const publishBtn = document.getElementById('publish-recipe-btn');

    if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', () => this.saveDraft(true));
    if (publishBtn) publishBtn.addEventListener('click', () => this.publishRecipe());

    // 3. Servings Increment / Decrement
    const incServings = document.getElementById('inc-servings-btn');
    const decServings = document.getElementById('dec-servings-btn');
    const servingsInput = document.getElementById('recipe-servings');

    if (incServings && servingsInput) {
      incServings.addEventListener('click', () => {
        servingsInput.value = String(Math.min(100, (Number(servingsInput.value) || 4) + 1));
        this.scheduleAutoSave();
      });
    }

    if (decServings && servingsInput) {
      decServings.addEventListener('click', () => {
        servingsInput.value = String(Math.max(1, (Number(servingsInput.value) || 4) - 1));
        this.scheduleAutoSave();
      });
    }

    // 4. Dynamic Ingredients Buttons
    const addIngBtn = document.getElementById('add-ingredient-btn');
    const loadSampleIngBtn = document.getElementById('load-sample-ingredients-btn');

    if (addIngBtn) addIngBtn.addEventListener('click', () => this.addIngredientRow());
    if (loadSampleIngBtn) {
      loadSampleIngBtn.addEventListener('click', () => {
        this.setIngredients((RECIPE_FIXTURES[0]?.ingredients || []).map((ingredient, index) => ({
          ...ingredient,
          section: index === 0 ? 'Main' : 'Sauce'
        })));
        Toast.success('تمت إضافة المكونات التجريبية بنجاح');
      });
    }

    // 5. Dynamic Steps Buttons
    const addStepBtn = document.getElementById('add-step-btn');
    const loadSampleStepsBtn = document.getElementById('load-sample-steps-btn');

    if (addStepBtn) addStepBtn.addEventListener('click', () => this.addInstructionStep());
    if (loadSampleStepsBtn) {
      loadSampleStepsBtn.addEventListener('click', () => {
        this.setInstructions(JSON.parse(JSON.stringify(RECIPE_FIXTURES[0]?.steps || [])));
        Toast.success('تمت إضافة خطوات التحضير التجريبية بنجاح');
      });
    }

    // 6. Media / Cover Upload Bindings
    const dropzone = document.getElementById('cover-dropzone');
    const fileInput = document.getElementById('cover-image-file-input');
    const browseBtn = document.getElementById('browse-cover-btn');
    const applyUrlBtn = document.getElementById('apply-cover-url-btn');
    const urlInput = document.getElementById('cover-image-url-input');
    const removeCoverBtn = document.getElementById('remove-cover-btn');

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleCoverUpload(e.target.files[0]);
        }
      });
    }

    if (dropzone) {
      dropzone.addEventListener('click', () => {
        if (fileInput) fileInput.click();
      });
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-brand-gold', 'bg-surface-1');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-brand-gold', 'bg-surface-1');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-brand-gold', 'bg-surface-1');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleCoverUpload(e.dataTransfer.files[0]);
        }
      });
    }

    if (applyUrlBtn && urlInput) {
      applyUrlBtn.addEventListener('click', () => {
        const val = urlInput.value.trim();
        if (val) {
          this.handleCoverUpload(val);
        }
      });
    }

    if (removeCoverBtn) {
      removeCoverBtn.addEventListener('click', () => this.removeCoverImage());
    }

    // Gallery Adder
    const addGalleryBtn = document.getElementById('add-gallery-photo-btn');
    if (addGalleryBtn) {
      addGalleryBtn.addEventListener('click', () => {
        const promptUrl = prompt ? prompt('أدخل رابط صورة المعرض (Image URL):', 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80') : null;
        if (promptUrl) {
          this.addGalleryImage(promptUrl);
        }
      });
    }

    // 7. Header Top Actions
    const loadSampleRecipeBtn = document.getElementById('load-sample-recipe-btn');
    const clearFormBtn = document.getElementById('clear-recipe-form-btn');

    if (loadSampleRecipeBtn) loadSampleRecipeBtn.addEventListener('click', () => this.loadSampleData());
    if (clearFormBtn) clearFormBtn.addEventListener('click', () => this.clearDraft());

    // 8. Auto-save on all text inputs
    document.querySelectorAll('#create-recipe-form input, #create-recipe-form textarea, #create-recipe-form select').forEach(el => {
      el.addEventListener('input', () => this.scheduleAutoSave());
      el.addEventListener('change', () => this.scheduleAutoSave());
    });

    // 9. Language changed event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('meyar:lang-changed', () => {
        this.goToStep(this.currentStep);
        this.reindexSteps();
      });
    }

    // 10. Load draft or initial state
    const hasDraft = this.loadDraft();
    if (!hasDraft) {
      this.setIngredients([]);
      this.setInstructions([]);
    }

    this.goToStep(1);
    this.isInitialized = true;
  }

  /**
   * Localize cuisine string
   */
  static localizeCuisine(cuisine, lang) {
    const map = {
      'Saudi': { ar: 'سعودي معاصر', en: 'Contemporary Saudi' },
      'Khaleeji': { ar: 'خليجي تراثي', en: 'Khaleeji Heritage' },
      'Levantine': { ar: 'شامي وبلاد الشام', en: 'Levantine' },
      'Italian': { ar: 'إيطالي فاخر', en: 'Italian Fine Dining' },
      'French': { ar: 'فرنسي كلاسيكي', en: 'French Haute Cuisine' },
      'Japanese': { ar: 'ياباني كايسيكي', en: 'Japanese Kaiseki' },
      'Mediterranean': { ar: 'متوسطي معاصر', en: 'Modern Mediterranean' },
      'Fusion': { ar: 'طهي جزيئي ودمج مبتكر', en: 'Progressive Fusion' }
    };
    return map[cuisine]?.[lang] || cuisine;
  }

  /**
   * Localize category string
   */
  static localizeCategory(category, lang) {
    const map = {
      'Main Course': { ar: 'أطباق رئيسية', en: 'Main Course' },
      'Appetizers': { ar: 'مقبلات ومشهيات', en: 'Appetizers' },
      'Desserts': { ar: 'حلويات ومعجنات', en: 'Desserts & Pastry' },
      'Seafood': { ar: 'مأكولات بحرية', en: 'Seafood' },
      'Soups & Stews': { ar: 'شوربات ويخنات', en: 'Soups & Stews' },
      'Beverages': { ar: 'مشروبات وموكتيلات', en: 'Beverages' }
    };
    return map[category]?.[lang] || category;
  }

  /**
   * Localize difficulty string
   */
  static localizeDifficulty(diff, lang) {
    const map = {
      'Easy': { ar: 'سهل', en: 'Easy' },
      'Medium': { ar: 'متوسط', en: 'Medium' },
      'Hard': { ar: 'متقدم', en: 'Hard' }
    };
    return map[diff]?.[lang] || diff;
  }

  /**
   * Escape HTML utility
   */
  static escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
