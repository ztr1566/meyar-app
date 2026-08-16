/**
 * Meyar (معيار) B2B Supplies Marketplace Page Controller
 * Handles commercial product catalog rendering, multi-facet filtering (categories, MOQ,
 * stock status, certifications, price), live search, specifications inspection modal,
 * and Request for Quotation (RFQ) integration.
 */

import { SUPPLY_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Modal } from '../core/modal.js';
import { Toast } from '../core/toast.js';
import { normalizeSearchQuery } from '../modules/search.js';
import { RFQManager } from '../modules/rfq.js';

export class SuppliesPage {
  static currentCategory = 'all';
  static searchQuery = '';
  static selectedMOQ = 'all'; // all | 1 | 2 | 5 | 10+
  static stockFilter = 'all'; // all | in_stock
  static selectedCertifications = new Set();
  static minPrice = null;
  static maxPrice = null;
  static sortBy = 'popular'; // popular | price_asc | price_desc | moq_asc | rating
  static isInitialized = false;

  static savedSupplyIds = new Set();

  /**
   * Reset in-memory supplies state (for test isolation)
   */
  static reset() {
    this.savedSupplyIds = new Set();
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.selectedMOQ = 'all';
    this.stockFilter = 'all';
    this.selectedCertifications = new Set();
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'popular';
    this.isInitialized = false;
  }

  /**
   * Get bookmarked supply IDs from in-memory set
   * @returns {string[]}
   */
  static getSavedSupplyIds() {
    return Array.from(this.savedSupplyIds);
  }

  /**
   * Toggle save/bookmark status for a supply item
   * @param {string} supplyId 
   * @returns {boolean}
   */
  static toggleSaveSupply(supplyId) {
    if (!supplyId) return false;
    const isSaved = this.savedSupplyIds.has(supplyId);
    const isAr = I18n.getLang() === 'ar';

    if (isSaved) {
      this.savedSupplyIds.delete(supplyId);
      Toast.info(isAr ? 'تمت إزالة المنتج من التوريدات المحفوظة' : 'Removed from saved supplies');
    } else {
      this.savedSupplyIds.add(supplyId);
      Toast.success(isAr ? 'تم حفظ المنتج في قائمتك التجارية' : 'Saved to your supplies list');
    }

    this.updateSaveButtonStates();
    return !isSaved;
  }

  /**
   * Update visual bookmark state on all rendered supply cards
   */
  static updateSaveButtonStates() {
    const saved = new Set(this.getSavedSupplyIds());
    document.querySelectorAll('[data-action="toggle-save-supply"]').forEach(btn => {
      const id = btn.getAttribute('data-supply-id');
      const isSaved = saved.has(id);
      const icon = btn.querySelector('svg');
      if (icon) {
        if (isSaved) {
          btn.classList.add('text-brand-gold', 'bg-surface-2');
          btn.classList.remove('text-text-muted', 'bg-surface-1');
          icon.setAttribute('fill', 'currentColor');
        } else {
          btn.classList.remove('text-brand-gold', 'bg-surface-2');
          btn.classList.add('text-text-muted', 'bg-surface-1');
          icon.setAttribute('fill', 'none');
        }
      }
    });
  }

  /**
   * Filter supplies based on active category, search, MOQ, stock, certifications, and price
   * @returns {Array<Object>}
   */
  static filterSupplies() {
    const items = SUPPLY_FIXTURES || [];
    const normQuery = normalizeSearchQuery(this.searchQuery);

    return items.filter(item => {
      // 1. Category filter
      if (this.currentCategory !== 'all' && item.category !== this.currentCategory) {
        return false;
      }

      // 2. MOQ filter
      if (this.selectedMOQ !== 'all') {
        const itemMoq = Number(item.moq) || 1;
        if (this.selectedMOQ === '1' && itemMoq !== 1) return false;
        if (this.selectedMOQ === '2' && itemMoq > 2) return false;
        if (this.selectedMOQ === '5' && itemMoq > 5) return false;
        if (this.selectedMOQ === '10+' && itemMoq < 5) return false;
      }

      // 3. Stock availability filter
      if (this.stockFilter === 'in_stock' && (!item.in_stock || item.stock_count <= 0)) {
        return false;
      }

      // 4. Certifications filter
      if (this.selectedCertifications.size > 0) {
        const itemCerts = (item.certifications || []).map(c => c.toLowerCase());
        let matchesAnyCert = false;
        for (const cert of this.selectedCertifications) {
          const lowerCert = cert.toLowerCase();
          if (itemCerts.some(c => c.includes(lowerCert))) {
            matchesAnyCert = true;
            break;
          }
        }
        if (!matchesAnyCert) return false;
      }

      // 5. Price range filter
      if (this.minPrice !== null && !isNaN(this.minPrice) && item.price < this.minPrice) {
        return false;
      }
      if (this.maxPrice !== null && !isNaN(this.maxPrice) && item.price > this.maxPrice) {
        return false;
      }

      // 6. Keyword Search Filter
      if (normQuery) {
        const targetTexts = [
          item.name_ar,
          item.name_en,
          item.description_ar,
          item.description_en,
          item.category_ar,
          item.category_en,
          item.supplier?.name_ar,
          item.supplier?.name_en,
          item.supplier?.location_ar,
          item.supplier?.location_en,
          ...(item.certifications || []),
          ...(item.specs ? item.specs.map(s => `${s.label_ar} ${s.label_en} ${s.value_ar} ${s.value_en}`) : [])
        ].filter(Boolean);

        const matches = targetTexts.some(text => normalizeSearchQuery(text).includes(normQuery));
        if (!matches) return false;
      }

      return true;
    });
  }

  /**
   * Sort filtered supplies
   * @param {Array<Object>} items 
   * @returns {Array<Object>}
   */
  static sortSupplies(items) {
    const list = [...items];

    switch (this.sortBy) {
      case 'price_asc':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));

      case 'price_desc':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));

      case 'moq_asc':
        return list.sort((a, b) => (a.moq || 1) - (b.moq || 1));

      case 'rating':
        return list.sort((a, b) => (b.supplier?.rating || 0) - (a.supplier?.rating || 0));

      case 'popular':
      default:
        return list.sort((a, b) => {
          const scoreA = (a.supplier?.rating || 4.5) * (a.supplier?.reviews_count || 50);
          const scoreB = (b.supplier?.rating || 4.5) * (b.supplier?.reviews_count || 50);
          return scoreB - scoreA;
        });
    }
  }

  /**
   * Render supply card HTML string
   * @param {Object} item 
   * @param {boolean} isAr 
   * @returns {string}
   */
  static renderCard(item, isAr) {
    const title = isAr ? item.name_ar : item.name_en;
    const desc = isAr ? item.description_ar : item.description_en;
    const categoryName = isAr ? item.category_ar : item.category_en;
    const supplierName = isAr ? item.supplier?.name_ar : item.supplier?.name_en;
    const supplierLocation = isAr ? item.supplier?.location_ar : item.supplier?.location_en;
    const unit = isAr ? item.unit_ar : item.unit_en;
    const leadTime = isAr ? item.lead_time_ar : item.lead_time_en;
    const warranty = isAr ? item.warranty_ar : item.warranty_en;
    const currency = isAr ? 'ر.س' : 'SAR';

    const savedIds = new Set(this.getSavedSupplyIds());
    const isSaved = savedIds.has(item.id);

    const moqText = I18n.t('supplies.moq_badge', { count: item.moq, unit });

    const specsPreview = (item.specs || []).slice(0, 2).map(s => {
      const label = isAr ? s.label_ar : s.label_en;
      const val = isAr ? s.value_ar : s.value_en;
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-2 text-text-muted border border-border-subtle truncate">${label}: <strong class="text-text-main ms-1">${val}</strong></span>`;
    }).join('');

    const certBadges = (item.certifications || []).slice(0, 3).map(cert => `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-2 text-brand-emerald border border-brand-emerald">
        <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        ${cert}
      </span>
    `).join('');

    const stockBadge = item.in_stock
      ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-2 text-brand-emerald border border-border-subtle shadow-sm">
           <span class="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse"></span>
           ${I18n.t('supplies.in_stock')} (${item.stock_count} ${unit})
         </span>`
      : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-2 text-red-500 border border-red-500">
           <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
           ${I18n.t('supplies.out_of_stock')}
         </span>`;

    return `
      <article class="group bg-surface-1 border border-border-subtle hover:border-border-subtle rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-200" data-supply-id="${item.id}">
        
        <!-- Top Image & Badges Container -->
        <div class="relative w-full h-52 sm:h-56 bg-surface-2 overflow-hidden shrink-0">
          <img src="${item.image}" alt="${title}" loading="lazy"
               class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
          
          <!-- Category & Stock Floating Overlay Badges -->
          <div class="absolute top-3 start-3 flex flex-col gap-1.5 items-start z-10">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-1 text-text-main border border-border-subtle shadow-md">
              ${categoryName}
            </span>
            ${stockBadge}
          </div>

          <!-- Bookmark / Save Button -->
          <button type="button" data-action="toggle-save-supply" data-supply-id="${item.id}"
                  class="absolute top-3 end-3 p-2.5 rounded-xl ${isSaved ? 'text-brand-gold bg-surface-2' : 'text-text-muted bg-surface-1 hover:text-text-main'} border border-border-subtle shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  aria-label="Save supply item">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </button>
        </div>

        <!-- Main Card Body -->
        <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
          
          <!-- Supplier Info Row -->
          <div class="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <img src="${item.supplier?.avatar || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=100&q=80'}"
                   alt="${supplierName}" class="w-7 h-7 rounded-lg object-cover border border-border-subtle shrink-0">
              <div class="min-w-0">
                <div class="flex items-center gap-1">
                  <span class="text-xs font-bold text-text-main truncate">${supplierName}</span>
                  ${item.supplier?.verified ? `
                    <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 2.4 3.4-.3 1.3 3.1 3.1 1.3-.3 3.4L24 14.3l-2.4 2.4.3 3.4-3.1 1.3-1.3 3.1-3.4-.3L12 26.6l-2.4-2.4-3.4.3-1.3-3.1-3.1-1.3.3-3.4L0 14.3l2.4-2.4-.3-3.4 3.1-1.3 1.3-3.1 3.4.3L12 2z"/>
                    </svg>
                  ` : ''}
                </div>
                <span class="text-[10px] text-text-muted block truncate">${supplierLocation}</span>
              </div>
            </div>

            <!-- Supplier Rating Badge -->
            <div class="flex items-center gap-1 bg-surface-2 px-2 py-1 rounded-md border border-border-subtle shrink-0">
              <svg class="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span class="text-xs font-extrabold text-text-main">${item.supplier?.rating || '4.9'}</span>
            </div>
          </div>

          <!-- Product Details -->
          <div class="space-y-2">
            <h3 class="text-base sm:text-lg font-extrabold text-text-main line-clamp-2 leading-snug group-hover:text-brand-gold transition-colors">
              ${title}
            </h3>
            <p class="text-xs text-text-muted line-clamp-2 leading-relaxed">
              ${desc}
            </p>
          </div>

          <!-- Specs Preview Chips -->
          <div class="flex flex-wrap gap-1.5">
            ${specsPreview}
          </div>

          <!-- Certifications Badges -->
          <div class="flex flex-wrap gap-1">
            ${certBadges}
          </div>

          <!-- Pricing, MOQ & Commercial Terms Block -->
          <div class="p-3 bg-surface-2 border border-border-subtle rounded-xl space-y-2">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-xs text-text-muted font-medium" data-i18n="supplies.price_range">${I18n.t('supplies.price_range')}</span>
              <div class="text-end">
                <span class="text-lg sm:text-xl font-extrabold text-text-main">${item.price?.toLocaleString()}</span>
                <span class="text-xs font-bold text-brand-gold ms-1">${currency}</span>
                <span class="text-[11px] text-text-muted block">/ ${unit}</span>
              </div>
            </div>

            <div class="flex items-center justify-between gap-2 text-xs border-t border-border-subtle pt-2">
              <span class="inline-flex items-center gap-1 font-bold text-brand-gold">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ${moqText}
              </span>
              <span class="text-[11px] text-text-muted flex items-center gap-1 truncate">
                <svg class="w-3 h-3 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${leadTime}
              </span>
            </div>
          </div>

          <!-- Bottom Action Controls -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button type="button" data-action="open-specs" data-supply-id="${item.id}"
                    class="w-full py-2.5 px-3 text-xs font-bold text-text-main bg-surface-2 hover:bg-surface-3 border border-border-subtle rounded-xl transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-gold">
              <svg class="w-3.5 h-3.5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <span data-i18n="supplies.view_specs">${I18n.t('supplies.view_specs')}</span>
            </button>

            <button type="button" data-action="open-rfq" data-supply-id="${item.id}"
                    class="w-full py-2.5 px-3 text-xs font-bold text-white bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-gold">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              <span data-i18n="supplies.request_quote">${I18n.t('btn.rfq_request')}</span>
            </button>
          </div>

        </div>
      </article>
    `;
  }

  /**
   * Render the complete catalog into `#supplies-grid`
   */
  static renderCatalog() {
    const grid = document.getElementById('supplies-grid');
    const emptyState = document.getElementById('supplies-empty-state');
    const countContainer = document.getElementById('supplies-results-count');
    const isAr = I18n.getLang() === 'ar';

    const filtered = this.filterSupplies();
    const sorted = this.sortSupplies(filtered);

    // Update Results Counter
    if (countContainer) {
      countContainer.textContent = I18n.t('supplies.results_count', { count: sorted.length });
    }

    // Render active filter tags / chips
    this.renderActiveFilterChips();

    if (!grid) return;

    if (sorted.length === 0) {
      grid.innerHTML = '';
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
    } else {
      if (emptyState) {
        emptyState.classList.add('hidden');
      }
      grid.innerHTML = sorted.map(item => this.renderCard(item, isAr)).join('');
    }

    this.updateSaveButtonStates();
  }

  /**
   * Render dynamic active filter chips
   */
  static renderActiveFilterChips() {
    const container = document.getElementById('active-filter-chips');
    if (!container) return;

    const chips = [];
    const isAr = I18n.getLang() === 'ar';

    if (this.currentCategory !== 'all') {
    const catObj = SUPPLY_FIXTURES?.find(s => s.category === this.currentCategory);
      const catLabel = catObj ? (isAr ? catObj.category_ar : catObj.category_en) : this.currentCategory;
      chips.push({ type: 'category', label: catLabel });
    }

    if (this.selectedMOQ !== 'all') {
      chips.push({ type: 'moq', label: `MOQ: ${this.selectedMOQ}` });
    }

    if (this.stockFilter === 'in_stock') {
      chips.push({ type: 'stock', label: I18n.t('supplies.in_stock_only') });
    }

    this.selectedCertifications.forEach(cert => {
      chips.push({ type: 'cert', val: cert, label: cert });
    });

    if (this.searchQuery.trim()) {
      chips.push({ type: 'search', label: `"${this.searchQuery}"` });
    }

    if (chips.length === 0) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="flex items-center gap-2 flex-wrap py-2">
        <span class="text-xs text-text-muted font-medium">${isAr ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
        ${chips.map(c => `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-2 text-text-main border border-border-subtle">
            ${c.label}
            <button type="button" data-action="remove-filter-chip" data-filter-type="${c.type}" data-filter-val="${c.val || ''}" class="text-text-muted hover:text-red-500 transition-colors">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
        `).join('')}
        <button type="button" data-action="clear-filters" class="text-xs font-bold text-brand-gold hover:underline ms-2">
          ${I18n.t('supplies.clear_filters')}
        </button>
      </div>
    `;
  }

  /**
   * Open and populate the Technical Specifications Modal
   * @param {string} supplyId 
   */
  static openSpecsModal(supplyId) {
    const item = SUPPLY_FIXTURES?.find(s => s.id === supplyId);
    if (!item) return;

    const isAr = I18n.getLang() === 'ar';
    const modal = document.getElementById('specs-modal');
    if (!modal) return;

    // Title & Category
    const titleEl = modal.querySelector('#specs-modal-title');
    if (titleEl) titleEl.textContent = isAr ? item.name_ar : item.name_en;

    const catEl = modal.querySelector('#specs-modal-category');
    if (catEl) catEl.textContent = isAr ? item.category_ar : item.category_en;

    // Image & Gallery
    const imgEl = modal.querySelector('#specs-modal-image');
    if (imgEl) {
      imgEl.src = item.image || '';
      imgEl.alt = isAr ? item.name_ar : item.name_en;
    }

    // Description
    const descEl = modal.querySelector('#specs-modal-description');
    if (descEl) descEl.textContent = isAr ? item.description_ar : item.description_en;

    // Supplier Info
    const supplierNameEl = modal.querySelector('#specs-modal-supplier-name');
    if (supplierNameEl) supplierNameEl.textContent = isAr ? item.supplier?.name_ar : item.supplier?.name_en;

    const supplierLocEl = modal.querySelector('#specs-modal-supplier-location');
    if (supplierLocEl) supplierLocEl.textContent = isAr ? item.supplier?.location_ar : item.supplier?.location_en;

    const supplierRatingEl = modal.querySelector('#specs-modal-supplier-rating');
    if (supplierRatingEl) supplierRatingEl.textContent = `${item.supplier?.rating || '4.9'} (${item.supplier?.reviews_count || 100} ${isAr ? 'تقييم' : 'reviews'})`;

    const supplierRespEl = modal.querySelector('#specs-modal-supplier-response');
    if (supplierRespEl) supplierRespEl.textContent = `${item.supplier?.response_rate || '98%'} (${item.supplier?.response_time || '< 1 hour'})`;

    // Pricing & MOQ
    const priceEl = modal.querySelector('#specs-modal-price');
    if (priceEl) priceEl.textContent = `${item.price?.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'} / ${isAr ? item.unit_ar : item.unit_en}`;

    const moqEl = modal.querySelector('#specs-modal-moq');
    if (moqEl) moqEl.textContent = `${item.moq} ${isAr ? item.unit_ar : item.unit_en}`;

    // Lead Time & Warranty
    const leadTimeEl = modal.querySelector('#specs-modal-lead-time');
    if (leadTimeEl) leadTimeEl.textContent = isAr ? item.lead_time_ar : item.lead_time_en;

    const warrantyEl = modal.querySelector('#specs-modal-warranty');
    if (warrantyEl) warrantyEl.textContent = isAr ? item.warranty_ar : item.warranty_en;

    // Specs Table
    const specsTable = modal.querySelector('#specs-modal-table');
    if (specsTable) {
      specsTable.innerHTML = (item.specs || []).map(s => {
        const label = isAr ? s.label_ar : s.label_en;
        const val = isAr ? s.value_ar : s.value_en;
        return `
          <tr class="border-b border-border-subtle">
            <td class="py-2.5 px-4 text-xs font-bold text-text-muted bg-surface-2 w-1/3">${label}</td>
            <td class="py-2.5 px-4 text-xs font-semibold text-text-main">${val}</td>
          </tr>
        `;
      }).join('');
    }

    // Certifications list
    const certsContainer = modal.querySelector('#specs-modal-certs');
    if (certsContainer) {
      certsContainer.innerHTML = (item.certifications || []).map(c => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-surface-2 text-brand-emerald border border-brand-emerald">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          ${c}
        </span>
      `).join('');
    }

    // Modal RFQ Trigger CTA
    const rfqCta = modal.querySelector('[data-action="modal-open-rfq"]');
    if (rfqCta) {
      rfqCta.setAttribute('data-supply-id', item.id);
    }

    Modal.open('specs-modal');
  }

  /**
   * Reset all filters to default state
   */
  static clearFilters() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.selectedMOQ = 'all';
    this.stockFilter = 'all';
    this.selectedCertifications.clear();
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'popular';

    // Reset input elements in DOM
    const searchInput = document.getElementById('supplies-search-input');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.getElementById('supplies-sort-select');
    if (sortSelect) sortSelect.value = 'popular';

    // Reset category tabs visual state
    document.querySelectorAll('[data-category]').forEach(btn => {
      const cat = btn.getAttribute('data-category');
      if (cat === 'all') {
        btn.classList.add('bg-brand-gold', 'text-white', 'font-bold');
        btn.classList.remove('bg-surface-2', 'text-text-muted');
      } else {
        btn.classList.remove('bg-brand-gold', 'text-white', 'font-bold');
        btn.classList.add('bg-surface-2', 'text-text-muted');
      }
    });

    // Reset MOQ chips
    document.querySelectorAll('[data-filter-moq]').forEach(btn => {
      const val = btn.getAttribute('data-filter-moq');
      if (val === 'all') {
        btn.classList.add('bg-brand-gold', 'text-white');
        btn.classList.remove('bg-surface-2', 'text-text-muted');
      } else {
        btn.classList.remove('bg-brand-gold', 'text-white');
        btn.classList.add('bg-surface-2', 'text-text-muted');
      }
    });

    // Reset checkboxes
    document.querySelectorAll('[data-filter-cert]').forEach(cb => {
      if (cb instanceof HTMLInputElement) cb.checked = false;
    });

    document.querySelectorAll('[name="stock-filter"]').forEach(radio => {
      if (radio instanceof HTMLInputElement) radio.checked = (radio.value === 'all');
    });

    this.renderCatalog();
  }

  /**
   * Initialize all supplies page interactions and event bindings
   */
  static init() {
    if (this.isInitialized || typeof document === 'undefined') return;

    // 1. Initial catalog render
    this.renderCatalog();

    // 2. Search input filtering with instant reactivity
    const searchInput = document.getElementById('supplies-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderCatalog();
      });
    }

    const clearSearchBtn = document.getElementById('clear-supplies-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.searchQuery = '';
        this.renderCatalog();
      });
    }

    // 3. Category Navigation Tabs
    document.addEventListener('click', (e) => {
      const catBtn = e.target.closest('[data-category]');
      if (catBtn) {
        e.preventDefault();
        const cat = catBtn.getAttribute('data-category');
        this.currentCategory = cat;

        // Update Tab visual state
        document.querySelectorAll('[data-category]').forEach(btn => {
          if (btn.getAttribute('data-category') === cat) {
            btn.classList.add('bg-brand-gold', 'text-white', 'font-bold');
            btn.classList.remove('bg-surface-2', 'text-text-muted');
          } else {
            btn.classList.remove('bg-brand-gold', 'text-white', 'font-bold');
            btn.classList.add('bg-surface-2', 'text-text-muted');
          }
        });

        this.renderCatalog();
        return;
      }

      // MOQ Chip filter buttons
      const moqBtn = e.target.closest('[data-filter-moq]');
      if (moqBtn) {
        e.preventDefault();
        const val = moqBtn.getAttribute('data-filter-moq');
        this.selectedMOQ = val;

        document.querySelectorAll('[data-filter-moq]').forEach(btn => {
          if (btn.getAttribute('data-filter-moq') === val) {
            btn.classList.add('bg-brand-gold', 'text-white');
            btn.classList.remove('bg-surface-2', 'text-text-muted');
          } else {
            btn.classList.remove('bg-brand-gold', 'text-white');
            btn.classList.add('bg-surface-2', 'text-text-muted');
          }
        });

        this.renderCatalog();
        return;
      }

      // Specs Modal Trigger
      const specsBtn = e.target.closest('[data-action="open-specs"]');
      if (specsBtn) {
        e.preventDefault();
        const supplyId = specsBtn.getAttribute('data-supply-id');
        this.openSpecsModal(supplyId);
        return;
      }

      // Modal RFQ CTA Trigger
      const modalRfqBtn = e.target.closest('[data-action="modal-open-rfq"]');
      if (modalRfqBtn) {
        e.preventDefault();
        const supplyId = modalRfqBtn.getAttribute('data-supply-id');
        Modal.close('specs-modal');
        RFQManager.openDrawer(supplyId);
        return;
      }

      // Bookmark / Save Supply
      const saveBtn = e.target.closest('[data-action="toggle-save-supply"]');
      if (saveBtn) {
        e.preventDefault();
        const supplyId = saveBtn.getAttribute('data-supply-id');
        this.toggleSaveSupply(supplyId);
        return;
      }

      // Clear Filters
      const clearBtn = e.target.closest('[data-action="clear-filters"]');
      if (clearBtn) {
        e.preventDefault();
        this.clearFilters();
        return;
      }

      // Remove individual filter chip
      const removeChipBtn = e.target.closest('[data-action="remove-filter-chip"]');
      if (removeChipBtn) {
        e.preventDefault();
        const type = removeChipBtn.getAttribute('data-filter-type');
        const val = removeChipBtn.getAttribute('data-filter-val');

        if (type === 'category') this.currentCategory = 'all';
        if (type === 'moq') this.selectedMOQ = 'all';
        if (type === 'stock') this.stockFilter = 'all';
        if (type === 'cert' && val) this.selectedCertifications.delete(val);
        if (type === 'search') {
          this.searchQuery = '';
          if (searchInput) searchInput.value = '';
        }

        this.renderCatalog();
        return;
      }

      // Mobile Filters Drawer Toggle
      const mobileFilterToggle = e.target.closest('[data-action="toggle-supplies-filters"]');
      if (mobileFilterToggle) {
        e.preventDefault();
        const sidebar = document.getElementById('supplies-filter-sidebar');
        if (sidebar) sidebar.classList.toggle('hidden');
        return;
      }
    });

    // 4. Sort Dropdown Change
    const sortSelect = document.getElementById('supplies-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.renderCatalog();
      });
    }

    // 5. Stock status radio/checkbox changes
    document.addEventListener('change', (e) => {
      if (e.target && e.target.name === 'stock-filter') {
        this.stockFilter = e.target.value;
        this.renderCatalog();
      }

      if (e.target && e.target.hasAttribute('data-filter-cert')) {
        const cert = e.target.getAttribute('data-filter-cert');
        if (e.target.checked) {
          this.selectedCertifications.add(cert);
        } else {
          this.selectedCertifications.delete(cert);
        }
        this.renderCatalog();
      }
    });

    // 6. Language change synchronization
    window.addEventListener('meyar:lang-changed', () => {
      this.renderCatalog();
    });

    this.isInitialized = true;
  }
}
