/**
 * Meyar (معيار) Request for Quotation (RFQ) Manager
 * Manages B2B Commercial RFQ submissions, live price estimation, MOQ validation,
 * transient session state, drawer/modal lifecycle, and chat integration.
 */

import { RFQ_FIXTURES, SUPPLY_FIXTURES, USER_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Modal } from '../core/modal.js';
import { Toast } from '../core/toast.js';

export class RFQManager {
  static activeItem = null;
  static currentQuantity = 1;
  static isInitialized = false;
  static rfqsStore = null;

  /**
   * Reset in-memory RFQ store (for tests and session reset)
   */
  static reset() {
    this.rfqsStore = null;
    this.activeItem = null;
    this.currentQuantity = 1;
  }

  /**
   * Clone the temporary RFQ fixtures for the current page session
   */
  static getInitialRFQs() {
    return JSON.parse(JSON.stringify(RFQ_FIXTURES || []));
  }

  /**
   * Retrieve all saved RFQs from in-memory store
   * @returns {Array<Object>}
   */
  static getRFQs() {
    if (!this.rfqsStore) {
      this.rfqsStore = this.getInitialRFQs();
    }
    return this.rfqsStore;
  }

  /**
   * Get a single RFQ by ID
   * @param {string} rfqId 
   * @returns {Object|null}
   */
  static getRFQById(rfqId) {
    if (!rfqId) return null;
    const rfqs = this.getRFQs();
    return rfqs.find(r => r.rfq_id === rfqId || r.id === rfqId) || null;
  }

  /**
   * Calculate subtotal, VAT (15%), and total for given unit price and quantity
   * @param {number} unitPrice 
   * @param {number} quantity 
   * @returns {Object}
   */
  static calculateEstimate(unitPrice, quantity) {
    const price = Math.max(0, Number(unitPrice) || 0);
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const subtotal = price * qty;
    const vat = Math.round(subtotal * 0.15);
    const total = subtotal + vat;

    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'ar';
    const currencySuffix = lang === 'ar' ? 'ر.س' : 'SAR';

    return {
      unitPrice: price,
      quantity: qty,
      subtotal,
      vat,
      total,
      formattedUnitPrice: `${price.toLocaleString()} ${currencySuffix}`,
      formattedSubtotal: `${subtotal.toLocaleString()} ${currencySuffix}`,
      formattedVat: `${vat.toLocaleString()} ${currencySuffix}`,
      formattedTotal: `${total.toLocaleString()} ${currencySuffix}`
    };
  }

  /**
   * Validate RFQ form fields
   * @param {Object} formData 
   * @param {Object} supplyItem 
   * @returns {{ isValid: boolean, errors: Object }}
   */
  static validateRFQ(formData = {}, supplyItem = null) {
    const errors = {};
    const item = supplyItem || this.activeItem;
    const minMoq = item?.moq || 1;
    const qty = parseInt(formData.quantity, 10);

    if (isNaN(qty) || qty < minMoq) {
      errors.quantity = I18n.t('rfq.moq_error', { moq: minMoq });
    }

    if (!formData.destination || !formData.destination.trim()) {
      errors.destination = I18n.t('rfq.required_field');
    }

    if (!formData.target_date || !formData.target_date.trim()) {
      errors.target_date = I18n.t('rfq.required_field');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Add a new RFQ to the current page session and broadcast event
   * @param {Object} rfqData 
   * @returns {Object}
   */
  static saveRFQ(rfqData) {
    const item = rfqData.supplyItem || (rfqData.item_id ? SUPPLY_FIXTURES?.find(s => s.id === rfqData.item_id) : null) || this.activeItem;
    const qty = Math.max(item?.moq || 1, parseInt(rfqData.quantity, 10) || item?.moq || 1);
    const unitPrice = Number(item?.price || rfqData.unit_price || 0);
    const estimate = this.calculateEstimate(unitPrice, qty);

    const rfqId = rfqData.rfq_id || `rfq-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRFQ = {
      rfq_id: rfqId,
      item_id: item?.id || rfqData.item_id || 'unknown-supply',
      item_name_ar: item?.name_ar || rfqData.item_name_ar || '',
      item_name_en: item?.name_en || rfqData.item_name_en || '',
      item_image: item?.image || rfqData.item_image || '',
      supplier_id: item?.supplier?.id || rfqData.supplier_id || 'supplier-1',
      supplier_name_ar: item?.supplier?.name_ar || rfqData.supplier_name_ar || '',
      supplier_name_en: item?.supplier?.name_en || rfqData.supplier_name_en || '',
      supplier_avatar: item?.supplier?.avatar || rfqData.supplier_avatar || '',
      supplier_verified: item?.supplier?.verified ?? true,
      quantity: qty,
      unit_ar: item?.unit_ar || rfqData.unit_ar || 'وحدة',
      unit_en: item?.unit_en || rfqData.unit_en || 'Unit',
      unit_price: unitPrice,
      target_price: estimate.subtotal,
      total_price: estimate.subtotal,
      currency: 'SAR',
      status: rfqData.status || 'pending', // pending | quoted | accepted | rejected
      destination_ar: rfqData.destination || rfqData.destination_ar || '',
      destination_en: rfqData.destination || rfqData.destination_en || '',
      destination: rfqData.destination || '',
      target_date: rfqData.target_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      company_name: rfqData.company_name || USER_FIXTURES?.business_profile?.company_name_ar || '',
      buyer_contact: rfqData.buyer_contact || `${USER_FIXTURES?.name_ar || ''} (${USER_FIXTURES?.email || ''})`,
      notes: rfqData.notes || '',
      created_at: new Date().toISOString()
    };

    const rfqs = this.getRFQs();
    const updated = [newRFQ, ...rfqs.filter(r => r.rfq_id !== newRFQ.rfq_id)];
    this.rfqsStore = updated;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meyar:rfq-submitted', { detail: { rfq: newRFQ } }));
    }

    return newRFQ;
  }

  /**
   * Update status of an existing RFQ
   * @param {string} rfqId 
   * @param {'pending'|'quoted'|'accepted'|'rejected'} status 
   * @returns {boolean}
   */
  static updateRFQStatus(rfqId, status) {
    if (!rfqId || !status) return false;
    const rfqs = this.getRFQs();
    const index = rfqs.findIndex(r => r.rfq_id === rfqId || r.id === rfqId);
    if (index === -1) return false;

    rfqs[index].status = status;
    rfqs[index].updated_at = new Date().toISOString();
    this.rfqsStore = rfqs;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meyar:rfq-status-updated', { detail: { rfqId, status } }));
    }

    return true;
  }

  /**
   * Open RFQ Drawer / Modal preloaded with supply item data
   * @param {string|Object} supplyIdOrItem 
   * @param {number} [defaultQty] 
   */
  static openDrawer(supplyIdOrItem, defaultQty = null) {
    let item = supplyIdOrItem;
    if (typeof supplyIdOrItem === 'string') {
      item = SUPPLY_FIXTURES?.find(s => s.id === supplyIdOrItem) || null;
    }

    if (!item) {
      console.warn('RFQManager.openDrawer: Supply item not found', supplyIdOrItem);
      return;
    }

    this.activeItem = item;
    const moq = Math.max(1, item.moq || 1);
    this.currentQuantity = defaultQty !== null && !isNaN(defaultQty) ? Math.max(moq, parseInt(defaultQty, 10)) : moq;

    const lang = typeof I18n !== 'undefined' ? I18n.getLang() : 'ar';
    const isAr = lang === 'ar';

    // Populate drawer elements in the DOM
    const drawer = document.getElementById('rfq-drawer') || document.getElementById('rfq-modal');
    if (drawer) {
      // 1. Populate item preview
      const previewImg = drawer.querySelector('[data-rfq-item-img]');
      if (previewImg) {
        previewImg.src = item.image || '';
        previewImg.alt = isAr ? item.name_ar : item.name_en;
      }

      const previewTitle = drawer.querySelector('[data-rfq-item-title]');
      if (previewTitle) {
        previewTitle.textContent = isAr ? item.name_ar : item.name_en;
      }

      const previewSupplier = drawer.querySelector('[data-rfq-supplier-name]');
      if (previewSupplier) {
        previewSupplier.textContent = isAr ? item.supplier?.name_ar : item.supplier?.name_en;
      }

      const previewMoq = drawer.querySelector('[data-rfq-item-moq]');
      if (previewMoq) {
        const unit = isAr ? item.unit_ar : item.unit_en;
        previewMoq.textContent = I18n.t('supplies.moq_badge', { count: moq, unit });
      }

      const previewUnitPrice = drawer.querySelector('[data-rfq-item-price]');
      if (previewUnitPrice) {
        previewUnitPrice.textContent = `${item.price?.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'} / ${isAr ? item.unit_ar : item.unit_en}`;
      }

      // 2. Set form fields
      const idInput = drawer.querySelector('#rfq-item-id') || drawer.querySelector('[name="item_id"]');
      if (idInput) idInput.value = item.id;

      const qtyInput = drawer.querySelector('#rfq-quantity') || drawer.querySelector('[name="quantity"]');
      if (qtyInput) {
        qtyInput.value = this.currentQuantity;
        qtyInput.min = moq;
      }

      const moqHelper = drawer.querySelector('[data-rfq-moq-helper]');
      if (moqHelper) {
        const unit = isAr ? item.unit_ar : item.unit_en;
        moqHelper.textContent = `${isAr ? 'الحد الأدنى للطلب:' : 'Minimum order quantity:'} ${moq} ${unit}`;
      }

      // Default target date: 14 days ahead
      const dateInput = drawer.querySelector('#rfq-target-date') || drawer.querySelector('[name="target_date"]');
      if (dateInput && !dateInput.value) {
        const defaultDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        dateInput.value = defaultDate;
        dateInput.min = new Date().toISOString().split('T')[0];
      }

      // Clear previous error messages
      drawer.querySelectorAll('.rfq-error-msg').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
      });
      drawer.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));

      // 3. Update live calculation
      this.updateLiveEstimate();

      // 4. Open Modal / Drawer
      Modal.open(drawer.id);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meyar:rfq-drawer-opened', { detail: { item: this.activeItem } }));
    }
  }

  /**
   * Close the active RFQ drawer / modal
   */
  static closeDrawer() {
    const drawer = document.getElementById('rfq-drawer') || document.getElementById('rfq-modal');
    if (drawer) {
      Modal.close(drawer.id);
    }
    this.activeItem = null;
  }

  /**
   * Update live financial estimate breakdown in the drawer
   */
  static updateLiveEstimate() {
    const drawer = document.getElementById('rfq-drawer') || document.getElementById('rfq-modal');
    if (!drawer || !this.activeItem) return;

    const qtyInput = drawer.querySelector('#rfq-quantity') || drawer.querySelector('[name="quantity"]');
    const rawQty = qtyInput ? parseInt(qtyInput.value, 10) : this.currentQuantity;
    const moq = this.activeItem.moq || 1;
    const qty = isNaN(rawQty) || rawQty < moq ? moq : rawQty;
    this.currentQuantity = qty;

    const estimate = this.calculateEstimate(this.activeItem.price, qty);

    const elUnit = drawer.querySelector('[data-rfq-est-unit]');
    if (elUnit) elUnit.textContent = estimate.formattedUnitPrice;

    const elQty = drawer.querySelector('[data-rfq-est-qty]');
    if (elQty) elQty.textContent = `${estimate.quantity}`;

    const elSubtotal = drawer.querySelector('[data-rfq-est-subtotal]');
    if (elSubtotal) elSubtotal.textContent = estimate.formattedSubtotal;

    const elVat = drawer.querySelector('[data-rfq-est-vat]');
    if (elVat) elVat.textContent = estimate.formattedVat;

    const elTotal = drawer.querySelector('[data-rfq-est-total]');
    if (elTotal) elTotal.textContent = estimate.formattedTotal;
  }

  /**
   * Handle stepper button quantity increment/decrement
   * @param {number} delta 
   */
  static changeQuantity(delta) {
    const moq = this.activeItem?.moq || 1;
    const drawer = document.getElementById('rfq-drawer') || document.getElementById('rfq-modal');
    const qtyInput = drawer?.querySelector('#rfq-quantity') || drawer?.querySelector('[name="quantity"]');
    const current = qtyInput ? parseInt(qtyInput.value, 10) || moq : this.currentQuantity;
    
    const newQty = Math.max(moq, current + delta);
    if (qtyInput) {
      qtyInput.value = newQty;
    }
    this.currentQuantity = newQty;
    this.updateLiveEstimate();
  }

  /**
   * Submit direct RFQ form
   * @param {HTMLFormElement|Object} formOrData 
   * @returns {Object|false}
   */
  static submitRFQ(formOrData) {
    let formData = {};
    let formElement = null;

    const isFormElement = formOrData && (
      (typeof HTMLFormElement !== 'undefined' && formOrData instanceof HTMLFormElement) ||
      (typeof Element !== 'undefined' && formOrData instanceof Element) ||
      (formOrData.elements !== undefined)
    );

    if (isFormElement) {
      formElement = formOrData;
      const elements = formElement.elements;
      formData = {
        item_id: elements['item_id']?.value || this.activeItem?.id,
        quantity: elements['quantity']?.value || this.currentQuantity,
        destination: elements['destination']?.value || '',
        target_date: elements['target_date']?.value || '',
        company_name: elements['company_name']?.value || '',
        buyer_contact: elements['buyer_contact']?.value || '',
        notes: elements['notes']?.value || ''
      };
    } else {
      formData = formOrData || {};
    }

    const item = (formData.item_id ? SUPPLY_FIXTURES?.find(s => s.id === formData.item_id) : null) || this.activeItem;
    if (!item) {
      Toast.error(I18n.getLang() === 'ar' ? 'يرجى تحديد الصنف المطلوب' : 'Please select a supply item');
      return false;
    }

    // Validation
    const validation = this.validateRFQ(formData, item);
    if (!validation.isValid) {
      if (formElement) {
        Object.entries(validation.errors).forEach(([field, msg]) => {
          const input = formElement.querySelector(`[name="${field}"]`) || formElement.querySelector(`#rfq-${field}`);
          if (input) input.classList.add('border-red-500');
          const errorContainer = formElement.querySelector(`[data-error-for="${field}"]`);
          if (errorContainer) {
            errorContainer.textContent = msg;
            errorContainer.classList.remove('hidden');
          }
        });
      }
      Toast.error(Object.values(validation.errors)[0] || 'Validation error');
      return false;
    }

    // Save RFQ
    const saved = this.saveRFQ({
      ...formData,
      supplyItem: item
    });

    // Notify User
    Toast.success(I18n.t('toast.rfq_success'));

    // Close Drawer & Reset
    this.closeDrawer();
    if (formElement) {
      formElement.reset();
    }

    return saved;
  }

  /**
   * Render RFQ History into a target container
   * @param {HTMLElement} container 
   */
  static renderHistory(container) {
    if (!container) return;
    const rfqs = this.getRFQs();
    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    if (rfqs.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-text-muted">
          <svg class="w-12 h-12 mx-auto mb-3 text-border-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <p class="text-sm font-semibold text-text-main" data-i18n="supplies.rfq_history_empty">${I18n.t('supplies.rfq_history_empty')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = rfqs.map(rfq => {
      const statusBg = {
        pending: 'bg-surface-2 text-amber-500 border-amber-500',
        quoted: 'bg-surface-2 text-brand-gold border-brand-gold',
        accepted: 'bg-surface-2 text-brand-emerald border-brand-emerald',
        rejected: 'bg-surface-2 text-red-500 border-red-500'
      }[rfq.status] || 'bg-surface-2 text-text-muted border-border-subtle';

      const statusLabel = {
        pending: I18n.t('rfq.status_pending'),
        quoted: I18n.t('rfq.status_quoted'),
        accepted: I18n.t('rfq.status_accepted'),
        rejected: I18n.t('rfq.status_rejected')
      }[rfq.status] || rfq.status;

      const itemName = isAr ? (rfq.item_name_ar || rfq.item_name_en) : (rfq.item_name_en || rfq.item_name_ar);
      const supplierName = isAr ? (rfq.supplier_name_ar || rfq.partner_name_ar || rfq.supplier_name_en) : (rfq.supplier_name_en || rfq.partner_name_en || rfq.supplier_name_ar);
      const unit = isAr ? rfq.unit_ar : rfq.unit_en;
      const currency = isAr ? 'ر.س' : 'SAR';

      return `
        <div class="p-4 bg-surface-2 border border-border-subtle rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            ${rfq.item_image ? `<img src="${rfq.item_image}" alt="${itemName}" class="w-12 h-12 rounded-lg object-cover border border-border-subtle shrink-0">` : ''}
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-xs font-mono font-bold text-brand-gold">#${rfq.rfq_id}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBg}">${statusLabel}</span>
              </div>
              <h4 class="text-sm font-bold text-text-main truncate">${itemName}</h4>
              <p class="text-xs text-text-muted mt-0.5 truncate">${supplierName} • ${rfq.quantity} ${unit || ''}</p>
            </div>
          </div>
          <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 border-border-subtle pt-2 sm:pt-0">
            <div class="text-start sm:text-end">
              <span class="text-[10px] text-text-muted block">${I18n.t('rfq.total_price')}</span>
              <span class="text-sm font-extrabold text-text-main">${rfq.total_price?.toLocaleString() || rfq.target_price?.toLocaleString()} ${currency}</span>
            </div>
            <a href="chat.html" class="px-3 py-1.5 text-xs font-semibold bg-surface-1 hover:bg-surface-3 border border-border-subtle rounded-lg text-brand-gold transition-colors shrink-0">
              ${isAr ? 'متابعة في المحادثة' : 'View in Chat'}
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Initialize event delegation for RFQ buttons and drawer actions
   */
  static init() {
    if (typeof document !== 'undefined' && this.lastDocument !== document) {
      this.isInitialized = false;
      this.lastDocument = document;
    }
    if (this.isInitialized || typeof document === 'undefined') return;
    this.isInitialized = true;

    // 1. Delegated click handling
    document.addEventListener('click', (e) => {
      // Open RFQ Drawer
      const rfqBtn = e.target.closest('[data-action="open-rfq"]');
      if (rfqBtn) {
        e.preventDefault();
        const supplyId = rfqBtn.getAttribute('data-supply-id') || rfqBtn.getAttribute('data-item-id');
        const qty = rfqBtn.getAttribute('data-default-qty');
        this.openDrawer(supplyId, qty);
        return;
      }

      // Close RFQ Drawer
      const closeBtn = e.target.closest('[data-action="close-rfq-drawer"], [data-action="close-rfq-modal"]');
      if (closeBtn) {
        e.preventDefault();
        this.closeDrawer();
        return;
      }

      // Quantity stepper
      const qtyPlus = e.target.closest('[data-action="rfq-qty-plus"]');
      if (qtyPlus) {
        e.preventDefault();
        this.changeQuantity(1);
        return;
      }

      const qtyMinus = e.target.closest('[data-action="rfq-qty-minus"]');
      if (qtyMinus) {
        e.preventDefault();
        this.changeQuantity(-1);
        return;
      }

      // Open RFQ History Modal
      const historyBtn = e.target.closest('[data-action="open-rfq-history"]');
      if (historyBtn) {
        e.preventDefault();
        const historyContainer = document.getElementById('rfq-history-list');
        if (historyContainer) {
          this.renderHistory(historyContainer);
        }
        Modal.open('rfq-history-modal');
        return;
      }
    });

    // 2. Form submission
    document.addEventListener('submit', (e) => {
      if (e.target && (e.target.id === 'rfq-form' || e.target.hasAttribute('data-rfq-form'))) {
        e.preventDefault();
        this.submitRFQ(e.target);
      }
    });

    // 3. Live quantity input change
    document.addEventListener('input', (e) => {
      if (e.target && (e.target.id === 'rfq-quantity' || e.target.name === 'quantity')) {
        // Clear red error highlight on input
        e.target.classList.remove('border-red-500');
        const errorContainer = e.target.closest('form')?.querySelector('[data-error-for="quantity"]');
        if (errorContainer) errorContainer.classList.add('hidden');

        this.updateLiveEstimate();
      }

      if (e.target && (e.target.id === 'rfq-destination' || e.target.name === 'destination')) {
        e.target.classList.remove('border-red-500');
        const errorContainer = e.target.closest('form')?.querySelector('[data-error-for="destination"]');
        if (errorContainer) errorContainer.classList.add('hidden');
      }

      if (e.target && (e.target.id === 'rfq-target-date' || e.target.name === 'target_date')) {
        e.target.classList.remove('border-red-500');
        const errorContainer = e.target.closest('form')?.querySelector('[data-error-for="target_date"]');
        if (errorContainer) errorContainer.classList.add('hidden');
      }
    });

    // 4. Update language reactivity
    window.addEventListener('meyar:lang-changed', () => {
      if (this.activeItem) {
        this.openDrawer(this.activeItem, this.currentQuantity);
      }
      const historyContainer = document.getElementById('rfq-history-list');
      if (historyContainer && !historyContainer.closest('.hidden')) {
        this.renderHistory(historyContainer);
      }
    });
  }
}
