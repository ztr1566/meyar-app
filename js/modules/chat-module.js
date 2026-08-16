/**
 * Meyar (معيار) Direct Chat & RFQ Negotiation Module
 * Manages chat threads, message sending, simulated automated partner replies,
 * interactive RFQ negotiation cards (approvals, counter-offers), search, and filtering.
 */

import { CHAT_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { RFQManager } from './rfq.js';
import { normalizeSearchQuery } from './search.js';

export class ChatModule {
  static chatsStore = null;

  /**
   * Reset the in-memory chat store (for test isolation and session resets)
   */
  static reset() {
    this.chatsStore = null;
  }

  /**
   * Clone the temporary chat fixtures for the current page session
   * @returns {Array<Object>}
   */
  static getInitialChats() {
    if (!CHAT_FIXTURES) return [];
    return JSON.parse(JSON.stringify(CHAT_FIXTURES));
  }

  /**
   * Retrieve all chats from in-memory store (or initialize from fixtures)
   * @returns {Array<Object>}
   */
  static getChats() {
    if (!this.chatsStore) {
      this.chatsStore = this.getInitialChats();
    }
    return this.chatsStore;
  }

  /**
   * Persist chats array to in-memory store and broadcast update event
   * @param {Array<Object>} chats 
   */
  static saveChats(chats) {
    this.chatsStore = chats;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meyar:chats-updated', { detail: { chats } }));
    }
  }

  /**
   * Get a single chat thread by ID
   * @param {string} chatId 
   * @returns {Object|null}
   */
  static getChatById(chatId) {
    if (!chatId) return null;
    const chats = this.getChats();
    return chats.find(c => c.id === chatId) || null;
  }

  /**
   * Get a chat thread by partner ID
   * @param {string} partnerId 
   * @returns {Object|null}
   */
  static getChatByPartnerId(partnerId) {
    if (!partnerId) return null;
    const chats = this.getChats();
    return chats.find(c => c.partner?.id === partnerId) || null;
  }

  /**
   * Get a chat thread containing a specific RFQ ID
   * @param {string} rfqId 
   * @returns {Object|null}
   */
  static getChatByRFQId(rfqId) {
    if (!rfqId) return null;
    const chats = this.getChats();
    return chats.find(c => c.rfq_card?.rfq_id === rfqId) || null;
  }

  /**
   * Find existing conversation or create a new one for a partner / RFQ
   * @param {Object} options 
   * @returns {Object}
   */
  static createOrGetChat({ partner, rfq_card = null, initialMessage = null, category = null }) {
    const chats = this.getChats();
    
    // Check if chat already exists for this partner or RFQ
    let existingChat = null;
    if (rfq_card?.rfq_id) {
      existingChat = chats.find(c => c.rfq_card?.rfq_id === rfq_card.rfq_id);
    }
    if (!existingChat && partner?.id) {
      existingChat = chats.find(c => c.partner?.id === partner.id);
    }

    if (existingChat) {
      // Update RFQ card if new one is provided
      if (rfq_card && !existingChat.rfq_card) {
        existingChat.rfq_card = rfq_card;
        this.saveChats(chats);
      }
      return existingChat;
    }

    // Build new chat thread
    const newChatId = `chat-${Date.now()}`;
    const role = partner?.role || category || 'chef';
    const initialTextAr = initialMessage?.text_ar || initialMessage?.text || (role === 'supplier' ? 'السلام عليكم، أود الاستفسار عن التوريدات وعروض الأسعار.' : 'مرحباً، يسعدني التواصل وتبادل الخبرات الطهوية.');
    const initialTextEn = initialMessage?.text_en || initialMessage?.text || (role === 'supplier' ? 'Greetings, I would like to inquire about supplies and quotations.' : 'Hello, glad to connect and exchange culinary techniques.');

    const newChat = {
      id: newChatId,
      partner: {
        id: partner?.id || `user-${Date.now()}`,
        name_ar: partner?.name_ar || 'مستخدم معيار',
        name_en: partner?.name_en || 'Meyar Member',
        avatar: partner?.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
        role: role,
        verified: partner?.verified ?? true,
        online: partner?.online ?? true
      },
      last_message_ar: initialTextAr,
      last_message_en: initialTextEn,
      last_message_time: 'Just now',
      unread_count: 0,
      category: role,
      rfq_card: rfq_card || null,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'me',
          text_ar: initialTextAr,
          text_en: initialTextEn,
          timestamp: 'Just now',
          has_rfq: Boolean(rfq_card)
        }
      ]
    };

    const updatedChats = [newChat, ...chats];
    this.saveChats(updatedChats);
    return newChat;
  }

  /**
   * Send a message in a specific chat thread
   * @param {string} chatId 
   * @param {Object} messageData 
   * @returns {Object|null}
   */
  static sendMessage(chatId, { text = '', text_ar = '', text_en = '', sender = 'me', has_rfq = false, attachment = null }) {
    if (!chatId) return null;
    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return null;

    const chat = chats[chatIndex];
    const now = new Date();
    const isAr = typeof I18n !== 'undefined' ? I18n.getLang() === 'ar' : true;
    
    // Format timestamp nicely
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalAr = text_ar || text || (isAr ? text : text);
    const finalEn = text_en || text || (!isAr ? text : text);

    const newMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: sender, // 'me' | 'partner' | 'system'
      text_ar: finalAr,
      text_en: finalEn,
      timestamp: timeStr,
      has_rfq: Boolean(has_rfq),
      attachment: attachment || null
    };

    if (!chat.messages) chat.messages = [];
    chat.messages.push(newMessage);

    chat.last_message_ar = finalAr;
    chat.last_message_en = finalEn;
    chat.last_message_time = timeStr;

    if (sender === 'partner') {
      chat.unread_count = (chat.unread_count || 0) + 1;
    }

    // Move active chat to the top of list
    chats.splice(chatIndex, 1);
    chats.unshift(chat);

    this.saveChats(chats);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meyar:message-sent', {
        detail: { chatId, message: newMessage }
      }));
    }

    return newMessage;
  }

  /**
   * Reset unread counter for a conversation
   * @param {string} chatId 
   */
  static markAsRead(chatId) {
    if (!chatId) return;
    const chats = this.getChats();
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.unread_count > 0) {
      chat.unread_count = 0;
      this.saveChats(chats);
    }
  }

  /**
   * Update RFQ status and prices within a chat card and sync with RFQManager
   * @param {string} chatId 
   * @param {string} rfqId 
   * @param {'pending'|'quoted'|'accepted'|'rejected'|'countered'} status 
   * @param {Object} extraData 
   * @returns {boolean}
   */
  static updateRFQStatus(chatId, rfqId, status, extraData = {}) {
    const chats = this.getChats();
    const chat = chats.find(c => c.id === chatId || c.rfq_card?.rfq_id === rfqId);
    if (!chat || !chat.rfq_card) return false;

    chat.rfq_card.status = status;
    if (extraData.target_price !== undefined) {
      chat.rfq_card.target_price = Number(extraData.target_price);
    }
    if (extraData.unit_price !== undefined) {
      chat.rfq_card.unit_price = Number(extraData.unit_price);
    }
    if (extraData.total_price !== undefined) {
      chat.rfq_card.total_price = Number(extraData.total_price);
    }
    if (extraData.notes) {
      chat.rfq_card.counter_notes = extraData.notes;
    }

    // Also sync with RFQManager if available
    try {
      if (typeof RFQManager !== 'undefined' && RFQManager.updateRFQStatus) {
        RFQManager.updateRFQStatus(rfqId || chat.rfq_card.rfq_id, status === 'countered' ? 'pending' : status);
      }
    } catch (e) {
      console.warn('Could not sync with RFQManager', e);
    }

    this.saveChats(chats);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meyar:rfq-status-changed', {
        detail: { chatId: chat.id, rfqId: chat.rfq_card.rfq_id, status, extraData }
      }));
    }

    return true;
  }

  /**
   * Filter chats list based on category and search keyword
   * @param {'all'|'chef'|'supplier'} category 
   * @param {string} query 
   * @returns {Array<Object>}
   */
  static filterChats(category = 'all', query = '') {
    let chats = this.getChats();

    // Category filter
    if (category && category !== 'all') {
      chats = chats.filter(c => {
        const cat = c.category || c.partner?.role;
        return cat === category;
      });
    }

    // Search query filter
    if (query && query.trim()) {
      const norm = normalizeSearchQuery(query);
      chats = chats.filter(c => {
        const nameAr = normalizeSearchQuery(c.partner?.name_ar || '');
        const nameEn = normalizeSearchQuery(c.partner?.name_en || '');
        const lastAr = normalizeSearchQuery(c.last_message_ar || '');
        const lastEn = normalizeSearchQuery(c.last_message_en || '');
        const itemAr = normalizeSearchQuery(c.rfq_card?.item_name_ar || '');
        const itemEn = normalizeSearchQuery(c.rfq_card?.item_name_en || '');

        const hasMsgMatch = c.messages?.some(m => 
          normalizeSearchQuery(m.text_ar || '').includes(norm) ||
          normalizeSearchQuery(m.text_en || '').includes(norm)
        );

        return nameAr.includes(norm) ||
               nameEn.includes(norm) ||
               lastAr.includes(norm) ||
               lastEn.includes(norm) ||
               itemAr.includes(norm) ||
               itemEn.includes(norm) ||
               hasMsgMatch;
      });
    }

    return chats;
  }

  /**
   * Generate an automated, contextual partner reply simulation
   * @param {string} chatId 
   * @param {string} userMessageText 
   * @param {number} delayMs 
   * @returns {Promise<Object>}
   */
  static simulatePartnerReply(chatId, userMessageText = '', delayMs = 1000) {
    return new Promise((resolve) => {
      const executeReply = () => {
        const chat = this.getChatById(chatId);
        if (!chat) {
          resolve(null);
          return;
        }

        const role = chat.partner?.role || chat.category || 'chef';
        const partnerName = chat.partner?.name_ar || 'الشريك';
        const norm = normalizeSearchQuery(userMessageText);

        let replyAr = '';
        let replyEn = '';

        const hasKeyword = (...words) => words.some(w => norm.includes(normalizeSearchQuery(w)));

        if (role === 'supplier') {
          if (hasKeyword('خصم', 'سعر', 'discount', 'price', 'عرض')) {
            replyAr = `أهلاً بك! قمنا بمراجعة جدول الكميات ويسعدنا تقديم خصم تجاري إضافي 8% عند اعتماد توريد ربع سنوي منتظم.`;
            replyEn = `Hello! We reviewed the volume schedule and are glad to offer an additional 8% trade discount for recurring quarterly deliveries.`;
          } else if (hasKeyword('شحن', 'توصيل', 'shipping', 'delivery')) {
            replyAr = `الشحن والتوصيل للمطابخ والمطاعم في الرياض مجاني ومشمول مع خدمات التركيب الفني وضمان لمدة عامين.`;
            replyEn = `Delivery across Riyadh commercial kitchens is complimentary, including installation and a 2-year warranty.`;
          } else if (hasKeyword('قبول', 'اعتماد', 'accept', 'confirm')) {
            replyAr = `شكراً لثقتكم! تم استلام تأكيدكم وجاري إصدار الفاتورة الرسمية وبدء تجهيز طلبية التوريد للشحن الفوري.`;
            replyEn = `Thank you for your trust! Your approval is confirmed, and our team is preparing the shipment dispatch immediately.`;
          } else {
            replyAr = `مرحباً بك، نشكر تواصلك معنا في شركة ${partnerName}. تم تسجيل استفسارك وسيقوم مسؤول المبيعات بالتواصل الفوري معك لتوفير كافة المواصفات.`;
            replyEn = `Greetings, thank you for contacting ${chat.partner?.name_en || 'our sales team'}. We noted your request and our logistics specialist will assist you promptly.`;
          }
        } else {
          // Chef replies
          if (hasKeyword('ورشة', 'دورة', 'تنسيق', 'masterclass', 'workshop', 'collaborate')) {
            replyAr = `أهلاً ومرحباً! فكرة ممتازة، يسعدني جداً التنسيق لورشة عمل طهوية مشتركة ندمج فيها تقنيات الطهي التراثي مع التقديم العصري.`;
            replyEn = `Greetings! Fantastic idea, I would be thrilled to coordinate a collaborative masterclass blending heritage flavors with modern techniques.`;
          } else if (hasKeyword('وصفة', 'طبق', 'recipe', 'dish')) {
            replyAr = `أشكرك على اهتمامك وتقييمك الرائع للوصفة! السر يكمن في دقة درجات الحرارة واختيار المكونات الطازجة بعناية.`;
            replyEn = `Thank you so much for the feedback! The true secret lies in thermal precision and sourcing pristine fresh ingredients.`;
          } else {
            replyAr = `أهلاً بك شيف! يسعدني دائماً تبادل الأفكار والتقنيات الطهوية مع أعضاء مجتمع معيار المتميزين.`;
            replyEn = `Hello Chef! Always delighted to connect and share culinary insights with the esteemed Meyar community.`;
          }
        }

        const msg = this.sendMessage(chatId, {
          text_ar: replyAr,
          text_en: replyEn,
          sender: 'partner'
        });

        resolve(msg);
      };

      if (delayMs > 0 && typeof setTimeout !== 'undefined') {
        setTimeout(executeReply, delayMs);
      } else {
        executeReply();
      }
    });
  }
}
