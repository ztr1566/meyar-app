/**
 * Meyar (معيار) Direct Chat & RFQ Negotiation Page Controller
 * Handles conversation listing, tab filtering, real-time search, message sending,
 * simulated live automated replies, interactive embedded RFQ quotation cards,
 * counter-offer modals, and mobile responsive switching.
 */

import { MOCK_DATA } from '../data/mock-data.js';
import { I18n } from '../core/i18n.js';
import { Modal } from '../core/modal.js';
import { Toast } from '../core/toast.js';
import { ChatModule } from '../modules/chat-module.js';
import { RFQManager } from '../modules/rfq.js';

export class ChatPage {
  static activeChatId = null;
  static currentCategory = 'all'; // all | chef | supplier
  static searchQuery = '';
  static selectedAttachment = null;
  static activeCounterData = null;
  static isInitialized = false;

  /**
   * Initialize Chat Page, parse query params, render views, and attach event listeners
   */
  static init() {
    if (typeof document === 'undefined') return;

    this.parseURLParams();
    this.renderConversationList();
    this.renderActiveThread();
    this.attachEventListeners();
    this.isInitialized = true;
  }

  /**
   * Parse URL parameters to auto-select or initiate conversations
   */
  static parseURLParams() {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const chatId = params.get('id');
    const chefId = params.get('chef');
    const supplierId = params.get('supplier');
    const rfqId = params.get('rfq');

    // 1. Direct Chat ID
    if (chatId) {
      const chat = ChatModule.getChatById(chatId);
      if (chat) {
        this.activeChatId = chat.id;
        return;
      }
    }

    // 2. Direct RFQ ID
    if (rfqId) {
      const existing = ChatModule.getChatByRFQId(rfqId);
      if (existing) {
        this.activeChatId = existing.id;
        return;
      }

      // Try looking up RFQ details from RFQManager or mock
      const rfq = (typeof RFQManager !== 'undefined' ? RFQManager.getRFQById(rfqId) : null) || null;
      if (rfq) {
        const supplier = MOCK_DATA.suppliers?.find(s => s.id === rfq.supplier_id || s.id === rfq.partner_id) || {
          id: rfq.supplier_id || 'supplier-1',
          name_ar: rfq.supplier_name_ar || 'شركة المورد التجاري',
          name_en: rfq.supplier_name_en || 'Commercial Supplier Co.',
          avatar: rfq.supplier_avatar || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80',
          role: 'supplier',
          verified: true,
          online: true
        };

        const newChat = ChatModule.createOrGetChat({
          partner: supplier,
          rfq_card: rfq,
          initialMessage: {
            text_ar: `مرحباً، أود متابعة طلب عرض السعر رقم #${rfq.rfq_id} بخصوص ${rfq.item_name_ar || 'الصنف'}.`,
            text_en: `Hello, I would like to follow up on RFQ #${rfq.rfq_id} for ${rfq.item_name_en || 'the item'}.`
          },
          category: 'supplier'
        });
        this.activeChatId = newChat.id;
        return;
      }
    }

    // 3. Direct Chef ID
    if (chefId) {
      const existing = ChatModule.getChatByPartnerId(chefId);
      if (existing) {
        this.activeChatId = existing.id;
        return;
      }

      const chef = MOCK_DATA.chefs?.find(c => c.id === chefId);
      if (chef) {
        const newChat = ChatModule.createOrGetChat({
          partner: {
            id: chef.id,
            name_ar: chef.name_ar,
            name_en: chef.name_en,
            avatar: chef.avatar,
            role: 'chef',
            verified: chef.verified ?? true,
            online: true
          },
          category: 'chef'
        });
        this.activeChatId = newChat.id;
        return;
      }
    }

    // 4. Direct Supplier ID
    if (supplierId) {
      const existing = ChatModule.getChatByPartnerId(supplierId);
      if (existing) {
        this.activeChatId = existing.id;
        return;
      }

      const supplier = MOCK_DATA.suppliers?.find(s => s.id === supplierId);
      if (supplier) {
        const newChat = ChatModule.createOrGetChat({
          partner: {
            id: supplier.id,
            name_ar: supplier.name_ar,
            name_en: supplier.name_en,
            avatar: supplier.avatar,
            role: 'supplier',
            verified: supplier.verified ?? true,
            online: true
          },
          category: 'supplier'
        });
        this.activeChatId = newChat.id;
        return;
      }
    }

    // 5. Default to first conversation
    const allChats = ChatModule.getChats();
    if (allChats.length > 0) {
      this.activeChatId = allChats[0].id;
    }
  }

  /**
   * Render conversations list in sidebar
   */
  static renderConversationList() {
    const listEl = document.getElementById('conversations-list');
    const emptyEl = document.getElementById('conversations-empty');
    const totalBadgeEl = document.getElementById('unread-total-badge');
    if (!listEl) return;

    const chats = ChatModule.filterChats(this.currentCategory, this.searchQuery);
    const isAr = I18n.getLang() === 'ar';

    // Calculate total unread count across all chats
    const allChats = ChatModule.getChats();
    const totalUnread = allChats.reduce((acc, c) => acc + (c.unread_count || 0), 0);
    if (totalBadgeEl) {
      if (totalUnread > 0) {
        totalBadgeEl.textContent = `${totalUnread}`;
        totalBadgeEl.classList.remove('hidden');
      } else {
        totalBadgeEl.classList.add('hidden');
      }
    }

    if (chats.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    listEl.innerHTML = chats.map(chat => {
      const isActive = chat.id === this.activeChatId;
      const partnerName = isAr ? (chat.partner?.name_ar || chat.partner?.name_en) : (chat.partner?.name_en || chat.partner?.name_ar);
      const lastMessage = isAr ? (chat.last_message_ar || chat.last_message_en) : (chat.last_message_en || chat.last_message_ar);
      const roleLabel = chat.partner?.role === 'supplier' 
        ? (isAr ? 'مورد' : 'Supplier') 
        : (isAr ? 'شيف' : 'Chef');
      const unreadCount = chat.unread_count || 0;
      const hasRFQ = Boolean(chat.rfq_card);

      const activeClasses = isActive 
        ? 'bg-surface-2 border-s-4 border-s-brand-gold text-text-main shadow-xs' 
        : 'bg-surface-1 hover:bg-surface-2/60 text-text-muted hover:text-text-main border-s-4 border-s-transparent';

      return `
        <div data-chat-id="${chat.id}"
             role="button"
             tabindex="0"
             class="group p-3 rounded-xl cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${activeClasses}">
          
          <!-- Avatar & Online Indicator -->
          <div class="relative shrink-0 mt-0.5">
            <img src="${chat.partner?.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80'}" 
                 alt="${partnerName}" 
                 class="w-11 h-11 rounded-xl object-cover border border-border-subtle">
            <span class="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-surface-1 ${chat.partner?.online ? 'bg-brand-emerald' : 'bg-gray-400'}"></span>
          </div>

          <!-- Content Details -->
          <div class="flex-1 min-w-0 text-start">
            <div class="flex items-center justify-between gap-1 mb-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-xs font-bold text-text-main truncate group-hover:text-brand-gold transition-colors">
                  ${partnerName}
                </span>
                ${chat.partner?.verified ? `
                  <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ` : ''}
              </div>
              <span class="text-[10px] text-text-muted shrink-0">
                ${chat.last_message_time || ''}
              </span>
            </div>

            <!-- Message Snippet & RFQ Badge -->
            <p class="text-[11px] line-clamp-1 text-text-muted mb-1.5 leading-snug">
              ${lastMessage || ''}
            </p>

            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-surface-2 text-text-muted border border-border-subtle uppercase">
                  ${roleLabel}
                </span>
                ${hasRFQ ? `
                  <span class="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                    <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>RFQ</span>
                  </span>
                ` : ''}
              </div>

              ${unreadCount > 0 ? `
                <span class="w-4 h-4 rounded-full bg-brand-gold text-white text-[9px] font-bold flex items-center justify-center shadow-xs shrink-0">
                  ${unreadCount}
                </span>
              ` : ''}
            </div>
          </div>

        </div>
      `;
    }).join('');
  }

  /**
   * Render the active chat thread (Header, Messages Stream, RFQ Cards, Input state)
   */
  static renderActiveThread() {
    const mainPane = document.getElementById('chat-main-pane');
    const emptyState = document.getElementById('empty-chat-state');
    if (!mainPane) return;

    if (!this.activeChatId) {
      mainPane.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    const chat = ChatModule.getChatById(this.activeChatId);
    if (!chat) {
      mainPane.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    mainPane.classList.remove('hidden');

    const isAr = I18n.getLang() === 'ar';
    const partnerName = isAr ? (chat.partner?.name_ar || chat.partner?.name_en) : (chat.partner?.name_en || chat.partner?.name_ar);

    // 1. Update Thread Header
    const avatarEl = document.getElementById('header-partner-avatar');
    const statusDotEl = document.getElementById('header-partner-status-dot');
    const nameEl = document.getElementById('header-partner-name');
    const verifiedEl = document.getElementById('header-partner-verified');
    const roleEl = document.getElementById('header-partner-role');
    const statusTextEl = document.getElementById('header-partner-status-text');
    const profileLinkEl = document.getElementById('header-partner-profile-link');

    if (avatarEl) {
      avatarEl.src = chat.partner?.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80';
      avatarEl.alt = partnerName;
    }

    if (statusDotEl) {
      statusDotEl.className = `absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-surface-1 ${chat.partner?.online ? 'bg-brand-emerald' : 'bg-gray-400'}`;
    }

    if (nameEl) nameEl.textContent = partnerName;
    if (verifiedEl) {
      if (chat.partner?.verified) verifiedEl.classList.remove('hidden');
      else verifiedEl.classList.add('hidden');
    }

    if (roleEl) {
      const isSupplier = chat.partner?.role === 'supplier';
      roleEl.textContent = isSupplier ? (isAr ? 'مورد تجاري B2B' : 'Supplier B2B') : (isAr ? 'شيف محترف' : 'Certified Chef');
    }

    if (statusTextEl) {
      statusTextEl.textContent = chat.partner?.online ? (isAr ? 'متصل الآن' : 'Online') : (isAr ? 'غير متصل' : 'Offline');
    }

    if (profileLinkEl) {
      const isSupplier = chat.partner?.role === 'supplier';
      profileLinkEl.href = isSupplier ? `supplies.html` : `chef.html?id=${chat.partner?.id}`;
      const span = profileLinkEl.querySelector('span');
      if (span) {
        span.textContent = isSupplier ? (isAr ? 'عرض الملف التجاري' : 'View Supplier Profile') : (isAr ? 'عرض صفحة الشيف' : 'View Chef Profile');
      }
    }

    // 2. Render Messages Stream
    this.renderMessagesStream(chat);
  }

  /**
   * Escape HTML utility
   * @param {string} str 
   * @returns {string}
   */
  static escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Render message stream bubbles and embedded RFQ negotiation cards
   * @param {Object} chat 
   */
  static renderMessagesStream(chat) {
    const container = document.getElementById('messages-container');
    if (!container) return;

    const isAr = I18n.getLang() === 'ar';
    const messages = chat.messages || [];

    let hasRenderedRFQCard = false;

    container.innerHTML = messages.map(msg => {
      const isMe = msg.sender === 'me';
      const text = isAr ? (msg.text_ar || msg.text_en || '') : (msg.text_en || msg.text_ar || '');

      let rfqCardHTML = '';
      if ((msg.has_rfq || (!hasRenderedRFQCard && chat.rfq_card)) && chat.rfq_card) {
        hasRenderedRFQCard = true;
        rfqCardHTML = this.renderRFQCardHTML(chat.id, chat.rfq_card);
      }

      const attachmentHTML = msg.attachment ? `
        <div class="mt-2 p-2 rounded-xl bg-surface-1 border border-border-subtle flex items-center gap-2 text-xs">
          <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          <span class="font-medium text-text-main truncate">${this.escapeHtml(msg.attachment.name || 'document.pdf')}</span>
        </div>
      ` : '';

      if (isMe) {
        return `
          <div class="flex flex-col items-end gap-1.5">
            ${rfqCardHTML}
            <div class="bg-brand-emerald text-white rounded-2xl rounded-ee-none p-3.5 max-w-[85%] sm:max-w-[75%] shadow-sm text-start space-y-1">
              <p class="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">${this.escapeHtml(text)}</p>
              ${attachmentHTML}
              <div class="flex items-center justify-end gap-1 text-[10px] text-white/80 pt-0.5">
                <span>${msg.timestamp || 'Just now'}</span>
                <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="flex flex-col items-start gap-1.5">
            ${rfqCardHTML}
            <div class="bg-surface-2 text-text-main border border-border-subtle rounded-2xl rounded-es-none p-3.5 max-w-[85%] sm:max-w-[75%] shadow-sm text-start space-y-1">
              <p class="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">${this.escapeHtml(text)}</p>
              ${attachmentHTML}
              <div class="flex items-center justify-start gap-1 text-[10px] text-text-muted pt-0.5">
                <span>${msg.timestamp || 'Just now'}</span>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    // If chat has RFQ card but no message flagged it, prepend card
    if (chat.rfq_card && !hasRenderedRFQCard) {
      container.insertAdjacentHTML('afterbegin', this.renderRFQCardHTML(chat.id, chat.rfq_card));
    }

    this.scrollToBottom();
  }

  /**
   * Render HTML for the interactive RFQ Quotation Card inside the chat stream
   * @param {string} chatId 
   * @param {Object} rfq 
   * @returns {string}
   */
  static renderRFQCardHTML(chatId, rfq) {
    if (!rfq) return '';
    const isAr = I18n.getLang() === 'ar';

    const itemName = isAr ? (rfq.item_name_ar || rfq.item_name_en) : (rfq.item_name_en || rfq.item_name_ar);
    const unitLabel = isAr ? (rfq.unit_ar || 'وحدة') : (rfq.unit_en || 'Units');
    const destination = isAr ? (rfq.destination_ar || rfq.destination || 'الرياض') : (rfq.destination_en || rfq.destination || 'Riyadh');
    const status = rfq.status || 'quoted';

    // Status Badge Configuration
    let statusBadge = '';
    let actionControls = '';

    if (status === 'accepted') {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-emerald text-white shadow-xs">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${isAr ? 'تم قبول وتأكيد العرض' : 'Quote Accepted & Confirmed'}</span>
        </span>
      `;
      actionControls = `
        <div class="p-2.5 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-start flex items-center gap-2">
          <svg class="w-4 h-4 text-brand-emerald shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span class="text-xs font-bold text-brand-emerald">
            ${isAr ? 'تم اعتماد هذا العرض والبدء في التجهيز اللوجستي' : 'Quote accepted and sent for fulfillment'}
          </span>
        </div>
      `;
    } else if (status === 'rejected') {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500 text-white shadow-xs">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          <span>${isAr ? 'عرض مرفوض' : 'Quote Declined'}</span>
        </span>
      `;
    } else if (status === 'countered') {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-gold text-white shadow-xs">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>${isAr ? 'تم تقديم عرض مقابل' : 'Counter-Offer Submitted'}</span>
        </span>
      `;
      actionControls = `
        <div class="flex items-center gap-2 pt-1">
          <button type="button" 
                  data-action="approve-quote" 
                  data-chat-id="${chatId}" 
                  data-rfq-id="${rfq.rfq_id}"
                  class="flex-1 py-2 px-3 text-xs font-bold bg-brand-emerald hover:bg-brand-emerald-hover text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${isAr ? 'قبول العرض الحالي' : 'Accept Current Quote'}</span>
          </button>
        </div>
      `;
    } else {
      // quoted or pending
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-gold text-white shadow-xs">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>${isAr ? 'عرض سعر رسمي جاهز' : 'Official Quotation Ready'}</span>
        </span>
      `;
      actionControls = `
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <button type="button" 
                  data-action="approve-quote" 
                  data-chat-id="${chatId}" 
                  data-rfq-id="${rfq.rfq_id}"
                  class="flex-1 py-2 px-3 text-xs font-bold bg-brand-emerald hover:bg-brand-emerald-hover text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-emerald">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span data-i18n="rfq.accept_quote">${isAr ? 'قبول وتأكيد العرض' : 'Accept & Confirm Quote'}</span>
          </button>

          <button type="button" 
                  data-action="open-counter-offer" 
                  data-chat-id="${chatId}" 
                  data-rfq-id="${rfq.rfq_id}"
                  class="flex-1 py-2 px-3 text-xs font-bold bg-surface-1 hover:bg-surface-2 text-brand-gold border border-brand-gold/40 rounded-xl transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-gold">
            <svg class="w-3.5 h-3.5 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span data-i18n="rfq.counter_offer">${isAr ? 'تقديم عرض مالي مقابل' : 'Submit Counter Offer'}</span>
          </button>
        </div>
      `;
    }

    const unitPrice = Number(rfq.unit_price || 0);
    const totalPrice = Number(rfq.total_price || (unitPrice * (rfq.quantity || 1)));

    return `
      <div class="w-full max-w-lg my-3 bg-surface-1 border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-md text-start space-y-3.5 self-center">
        
        <!-- Card Top: Badge & RFQ Number -->
        <div class="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="truncate">
              <h3 class="text-xs font-extrabold text-text-main uppercase tracking-wider" data-i18n="rfq.title">
                ${isAr ? 'بطاقة تسعير تجارية' : 'Commercial RFQ Card'}
              </h3>
              <span class="text-[10px] font-mono text-text-muted">#${rfq.rfq_id}</span>
            </div>
          </div>

          ${statusBadge}
        </div>

        <!-- Item Info Preview -->
        <div class="flex items-center gap-3 bg-surface-2 p-3 rounded-xl border border-border-subtle">
          <img src="${rfq.item_image || 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=150&q=80'}" 
               alt="${itemName}" 
               class="w-12 h-12 rounded-lg object-cover border border-border-subtle shrink-0">
          <div class="flex-1 min-w-0">
            <h4 class="text-xs sm:text-sm font-bold text-text-main truncate">${itemName}</h4>
            <a href="supplies.html?id=${rfq.item_id || ''}" class="text-[10px] text-brand-gold hover:underline inline-flex items-center gap-1 mt-0.5">
              <span>${isAr ? 'عرض تفاصيل ومواصفات المنتج' : 'View Product Specifications'}</span>
              <svg class="w-3 h-3 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
        </div>

        <!-- Specification Data Grid (2x2) -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 rounded-xl bg-surface-2 border border-border-subtle">
            <span class="text-[10px] text-text-muted block mb-0.5" data-i18n="rfq.quantity">الكمية المطلوبة:</span>
            <span class="font-bold text-text-main">${rfq.quantity} ${unitLabel}</span>
          </div>

          <div class="p-2.5 rounded-xl bg-surface-2 border border-border-subtle">
            <span class="text-[10px] text-text-muted block mb-0.5" data-i18n="rfq.unit_price">سعر الوحدة:</span>
            <span class="font-bold text-text-main">${unitPrice.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}</span>
          </div>

          <div class="p-2.5 rounded-xl bg-surface-2 border border-border-subtle">
            <span class="text-[10px] text-text-muted block mb-0.5" data-i18n="rfq.destination">وجهة التوصيل:</span>
            <span class="font-bold text-text-main truncate block">${destination}</span>
          </div>

          <div class="p-2.5 rounded-xl bg-surface-2 border border-border-subtle">
            <span class="text-[10px] text-text-muted block mb-0.5" data-i18n="rfq.target_date">تاريخ التوريد:</span>
            <span class="font-bold text-text-main">${rfq.target_date || '2026-09-01'}</span>
          </div>
        </div>

        <!-- Total Quote Price Highlight -->
        <div class="p-3 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-between">
          <span class="text-xs font-bold text-text-muted" data-i18n="rfq.total_price">الإجمالي التقديري للتوريد:</span>
          <span class="text-base font-extrabold text-brand-gold">${totalPrice.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}</span>
        </div>

        ${rfq.counter_notes ? `
          <div class="p-2.5 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-xs text-text-main">
            <span class="font-bold text-brand-gold block mb-0.5">${isAr ? 'ملاحظات العرض المقابل:' : 'Counter-Offer Notes:'}</span>
            <p class="text-[11px] text-text-muted leading-relaxed">${rfq.counter_notes}</p>
          </div>
        ` : ''}

        <!-- Actions -->
        ${actionControls}

      </div>
    `;
  }

  /**
   * Scroll messages stream to the bottom smoothly
   */
  static scrollToBottom() {
    const stream = document.getElementById('messages-stream');
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  }

  /**
   * Select a conversation by ID, update active state, and mark as read
   * @param {string} chatId 
   */
  static selectChat(chatId) {
    if (!chatId) return;
    this.activeChatId = chatId;
    ChatModule.markAsRead(chatId);

    this.renderConversationList();
    this.renderActiveThread();

    // Mobile layout switch: show chat pane and hide sidebar
    const sidebar = document.getElementById('chat-sidebar');
    const mainPane = document.getElementById('chat-main-pane');
    if (window.innerWidth < 1024) {
      if (sidebar) sidebar.classList.add('hidden');
      if (mainPane) mainPane.classList.remove('hidden');
    }
  }

  /**
   * Attach all DOM event listeners
   */
  static attachEventListeners() {
    // 1. Conversation Item Click Delegation
    const listEl = document.getElementById('conversations-list');
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const item = e.target.closest('[data-chat-id]');
        if (item) {
          const chatId = item.getAttribute('data-chat-id');
          this.selectChat(chatId);
        }
      });
    }

    // 2. Mobile Back Button
    const backBtn = document.getElementById('chat-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('chat-sidebar');
        const mainPane = document.getElementById('chat-main-pane');
        if (sidebar) sidebar.classList.remove('hidden');
        if (mainPane) mainPane.classList.add('hidden');
      });
    }

    // 3. Category Tabs Switching
    document.querySelectorAll('[data-chat-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-chat-tab');
        this.currentCategory = cat;

        document.querySelectorAll('[data-chat-tab]').forEach(t => {
          if (t === tab) {
            t.classList.add('bg-brand-gold', 'text-white', 'shadow-sm');
            t.classList.remove('bg-surface-2', 'text-text-muted');
            t.setAttribute('aria-selected', 'true');
          } else {
            t.classList.remove('bg-brand-gold', 'text-white', 'shadow-sm');
            t.classList.add('bg-surface-2', 'text-text-muted');
            t.setAttribute('aria-selected', 'false');
          }
        });

        this.renderConversationList();
      });
    });

    // 4. Conversation Search Input
    const searchInput = document.getElementById('chat-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderConversationList();
      });
    }

    // 5. Message Composer Form Submission
    const form = document.getElementById('chat-composer-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSendMessage();
      });
    }

    // 6. Quick Replies Bar Clicks
    const quickRepliesBar = document.getElementById('quick-replies-bar');
    if (quickRepliesBar) {
      quickRepliesBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-quick-reply]');
        if (btn) {
          const text = btn.textContent.trim();
          const input = document.getElementById('chat-message-input');
          if (input) {
            input.value = text;
            input.focus();
          }
        }
      });
    }

    // 7. File Attachment Simulation
    const attachBtn = document.getElementById('chat-attach-btn');
    const fileInput = document.getElementById('chat-file-input');
    const removeAttachBtn = document.getElementById('remove-attachment-btn');

    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          this.setAttachment({ name: file.name, size: file.size });
        }
      });
    }

    if (removeAttachBtn) {
      removeAttachBtn.addEventListener('click', () => {
        this.setAttachment(null);
      });
    }

    // 8. Stream Action Delegations (Approve Quote / Open Counter Modal)
    const streamContainer = document.getElementById('messages-stream');
    if (streamContainer) {
      streamContainer.addEventListener('click', (e) => {
        const approveBtn = e.target.closest('[data-action="approve-quote"]');
        if (approveBtn) {
          const chatId = approveBtn.getAttribute('data-chat-id');
          const rfqId = approveBtn.getAttribute('data-rfq-id');
          this.handleApproveQuote(chatId, rfqId);
          return;
        }

        const counterBtn = e.target.closest('[data-action="open-counter-offer"]');
        if (counterBtn) {
          const chatId = counterBtn.getAttribute('data-chat-id');
          const rfqId = counterBtn.getAttribute('data-rfq-id');
          this.handleOpenCounterModal(chatId, rfqId);
          return;
        }
      });
    }

    // 9. Counter-Offer Form Submission & Live Calculation
    const counterForm = document.getElementById('counter-offer-form');
    const counterPriceInput = document.getElementById('counter-unit-price-input');
    if (counterPriceInput) {
      counterPriceInput.addEventListener('input', () => {
        this.updateCounterTotalPreview();
      });
    }

    if (counterForm) {
      counterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmitCounterOffer();
      });
    }

    // 10. Language Switch Event Listener
    if (typeof window !== 'undefined') {
      window.addEventListener('meyar:lang-changed', () => {
        this.renderConversationList();
        this.renderActiveThread();
      });

      window.addEventListener('meyar:chats-updated', () => {
        this.renderConversationList();
      });
    }
  }

  /**
   * Handle sending user message from composer
   */
  static handleSendMessage() {
    if (!this.activeChatId) return;

    const input = document.getElementById('chat-message-input');
    const text = input ? input.value.trim() : '';
    const attachment = this.selectedAttachment;

    if (!text && !attachment) return;

    // Send outgoing message
    ChatModule.sendMessage(this.activeChatId, {
      text,
      sender: 'me',
      attachment
    });

    if (input) input.value = '';
    this.setAttachment(null);

    // Update views
    this.renderConversationList();
    this.renderActiveThread();

    // Show simulated typing indicator & reply
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) {
      typingEl.classList.remove('hidden');
      this.scrollToBottom();
    }

    ChatModule.simulatePartnerReply(this.activeChatId, text, 1000).then(() => {
      if (typingEl) typingEl.classList.add('hidden');
      this.renderConversationList();
      this.renderActiveThread();
    });
  }

  /**
   * Set attachment state and update preview DOM
   * @param {Object|null} file 
   */
  static setAttachment(file) {
    this.selectedAttachment = file;
    const previewEl = document.getElementById('attachment-preview');
    const filenameEl = document.getElementById('attachment-filename');

    if (file) {
      if (filenameEl) filenameEl.textContent = file.name;
      if (previewEl) previewEl.classList.remove('hidden');
    } else {
      if (previewEl) previewEl.classList.add('hidden');
      const fileInput = document.getElementById('chat-file-input');
      if (fileInput) fileInput.value = '';
    }
  }

  /**
   * Handle official approval and confirmation of RFQ quotation
   * @param {string} chatId 
   * @param {string} rfqId 
   */
  static handleApproveQuote(chatId, rfqId) {
    const isAr = I18n.getLang() === 'ar';
    const success = ChatModule.updateRFQStatus(chatId, rfqId, 'accepted');
    if (!success) return;

    // Append outgoing confirmation message
    const confirmMsgAr = 'تم قبول وتأكيد عرض السعر رسمياً، يرجى التكرم ببدء التجهيز اللوجستي للشحن.';
    const confirmMsgEn = 'We have officially approved and confirmed the quotation. Please proceed with shipment fulfillment.';

    ChatModule.sendMessage(chatId, {
      text_ar: confirmMsgAr,
      text_en: confirmMsgEn,
      sender: 'me'
    });

    Toast.success(I18n.t('chat.quote_approved_toast'));

    this.renderConversationList();
    this.renderActiveThread();

    // Trigger partner live acknowledgment
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) {
      typingEl.classList.remove('hidden');
      this.scrollToBottom();
    }

    ChatModule.simulatePartnerReply(chatId, 'قبول العرض', 1000).then(() => {
      if (typingEl) typingEl.classList.add('hidden');
      this.renderConversationList();
      this.renderActiveThread();
    });
  }

  /**
   * Open modal for entering counter-offer pricing and negotiation terms
   * @param {string} chatId 
   * @param {string} rfqId 
   */
  static handleOpenCounterModal(chatId, rfqId) {
    const chat = ChatModule.getChatById(chatId);
    if (!chat || !chat.rfq_card) return;

    const rfq = chat.rfq_card;
    this.activeCounterData = { chatId, rfq };

    const isAr = I18n.getLang() === 'ar';
    const itemName = isAr ? (rfq.item_name_ar || rfq.item_name_en) : (rfq.item_name_en || rfq.item_name_ar);

    const imgEl = document.getElementById('counter-item-img');
    const nameEl = document.getElementById('counter-item-name');
    const qtyEl = document.getElementById('counter-item-qty');
    const currentPriceEl = document.getElementById('counter-current-price');
    const priceInput = document.getElementById('counter-unit-price-input');
    const notesInput = document.getElementById('counter-notes-input');

    if (imgEl) imgEl.src = rfq.item_image || 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=150&q=80';
    if (nameEl) nameEl.textContent = itemName;
    if (qtyEl) qtyEl.textContent = `${rfq.quantity || 1} ${isAr ? (rfq.unit_ar || 'وحدة') : (rfq.unit_en || 'Units')}`;
    if (currentPriceEl) currentPriceEl.textContent = `${Number(rfq.unit_price || 0).toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`;

    // Propose 10% discount as starter
    const suggestedPrice = Math.round(Number(rfq.unit_price || 1000) * 0.9);
    if (priceInput) priceInput.value = suggestedPrice;
    if (notesInput) notesInput.value = '';

    this.updateCounterTotalPreview();
    Modal.open('counter-offer-modal');
  }

  /**
   * Update calculated live total inside counter modal
   */
  static updateCounterTotalPreview() {
    const rfq = this.activeCounterData?.rfq;
    const priceInput = document.getElementById('counter-unit-price-input');
    const totalPreview = document.getElementById('counter-calculated-total');
    if (!rfq || !priceInput || !totalPreview) return;

    const qty = Number(rfq.quantity) || 1;
    const unitPrice = Math.max(0, Number(priceInput.value) || 0);
    const total = qty * unitPrice;
    const isAr = I18n.getLang() === 'ar';

    totalPreview.textContent = `${total.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`;
  }

  /**
   * Handle submitting counter-offer form
   */
  static handleSubmitCounterOffer() {
    if (!this.activeCounterData) return;
    const { chatId, rfq } = this.activeCounterData;

    const priceInput = document.getElementById('counter-unit-price-input');
    const notesInput = document.getElementById('counter-notes-input');

    const proposedUnitPrice = Math.max(1, Number(priceInput?.value) || Number(rfq.unit_price));
    const notes = notesInput ? notesInput.value.trim() : '';
    const quantity = Number(rfq.quantity) || 1;
    const total = proposedUnitPrice * quantity;

    // Update RFQ card
    ChatModule.updateRFQStatus(chatId, rfq.rfq_id, 'countered', {
      unit_price: proposedUnitPrice,
      total_price: total,
      notes: notes
    });

    const isAr = I18n.getLang() === 'ar';
    const counterMsgAr = `تقديم عرض مالي مقابل: ${proposedUnitPrice.toLocaleString()} ر.س للوحدة (الإجمالي التقديري: ${total.toLocaleString()} ر.س). ${notes ? `ملاحظات: ${notes}` : ''}`;
    const counterMsgEn = `Counter-offer submitted: ${proposedUnitPrice.toLocaleString()} SAR/unit (Total: ${total.toLocaleString()} SAR). ${notes ? `Notes: ${notes}` : ''}`;

    ChatModule.sendMessage(chatId, {
      text_ar: counterMsgAr,
      text_en: counterMsgEn,
      sender: 'me'
    });

    Modal.close('counter-offer-modal');
    Toast.success(I18n.t('chat.counter_sent_toast'));

    this.renderConversationList();
    this.renderActiveThread();

    // Trigger partner live acknowledgment
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) {
      typingEl.classList.remove('hidden');
      this.scrollToBottom();
    }

    ChatModule.simulatePartnerReply(chatId, 'عرض مقابل', 1000).then(() => {
      if (typingEl) typingEl.classList.add('hidden');
      this.renderConversationList();
      this.renderActiveThread();
    });
  }
}

// Auto-bootstrap when page loads
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChatPage.init());
  } else {
    ChatPage.init();
  }
}
