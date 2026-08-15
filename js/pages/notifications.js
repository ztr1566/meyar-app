/**
 * Meyar (معيار) Notifications Center Controller
 * Handles grouped notification feeds (Today, Yesterday, Earlier),
 * category filtering pills, mark all as read, item actions, link navigation,
 * unread badges, and persistent localStorage state.
 */

import { MOCK_DATA } from '../data/mock-data.js';
import { I18n } from '../core/i18n.js';
import { Toast } from '../core/toast.js';

export class NotificationsPage {
  static STORAGE_KEY = 'meyar_notifications';
  static currentFilter = 'all'; // all | likes | rfqs | courses
  static isInitialized = false;

  /**
   * Get all notifications from localStorage or fallback to MOCK_DATA
   * @returns {Array<object>}
   */
  static getNotifications() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored notifications, using mock defaults', e);
    }

    // Default to mock dataset and clone
    const defaults = JSON.parse(JSON.stringify(MOCK_DATA.notifications || []));
    this.saveNotifications(defaults, false);
    return defaults;
  }

  /**
   * Save notifications array to localStorage and update UI
   * @param {Array<object>} notifications 
   * @param {boolean} [shouldRender=true] 
   */
  static saveNotifications(notifications, shouldRender = true) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications to localStorage', e);
    }

    const unreadCount = this.getUnreadCount(notifications);

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('meyar:notifications-updated', {
            detail: { count: unreadCount, items: notifications }
          })
        );
      } catch (e) {}
    }

    this.updateUnreadBadges(unreadCount);

    if (shouldRender) {
      this.render();
    }
  }

  /**
   * Calculate total unread notifications count
   * @param {Array<object>} [items]
   * @returns {number}
   */
  static getUnreadCount(items = null) {
    const list = items || this.getNotifications();
    return list.filter(n => !n.read).length;
  }

  /**
   * Mark all notifications as read
   */
  static markAllAsRead() {
    const items = this.getNotifications();
    let hasUnread = false;

    items.forEach(item => {
      if (!item.read) {
        item.read = true;
        hasUnread = true;
      }
    });

    if (hasUnread) {
      this.saveNotifications(items, true);
      Toast.success(I18n.t('notifications.all_read'));
    } else {
      Toast.info(I18n.t('notifications.all_read'));
      this.render();
    }
  }

  /**
   * Toggle read/unread state of a single notification
   * @param {string} id 
   */
  static toggleRead(id) {
    if (!id) return;
    const items = this.getNotifications();
    const item = items.find(n => n.id === id);
    if (!item) return;

    item.read = !item.read;
    this.saveNotifications(items, true);

    const msg = item.read 
      ? I18n.t('notifications.mark_read') 
      : I18n.t('notifications.mark_unread');
    Toast.info(msg);
  }

  /**
   * Mark a single notification as read without toggling (e.g. on click navigation)
   * @param {string} id 
   */
  static markAsRead(id) {
    if (!id) return;
    const items = this.getNotifications();
    const item = items.find(n => n.id === id);
    if (!item || item.read) return;

    item.read = true;
    this.saveNotifications(items, true);
  }

  /**
   * Delete a notification from the list
   * @param {string} id 
   */
  static deleteNotification(id) {
    if (!id) return;
    let items = this.getNotifications();
    const initialLen = items.length;
    items = items.filter(n => n.id !== id);

    if (items.length !== initialLen) {
      this.saveNotifications(items, true);
      Toast.info(I18n.t('notifications.delete'));
    }
  }

  /**
   * Clear all notifications completely
   */
  static clearAll() {
    this.saveNotifications([], true);
    Toast.info(I18n.t('notifications.clear_all'));
  }

  /**
   * Set active filter category
   * @param {string} category - 'all' | 'likes' | 'rfqs' | 'courses'
   */
  static setFilter(category) {
    this.currentFilter = category || 'all';
    this.updateFilterButtons();
    this.render();
  }

  /**
   * Group notifications into relative time buckets (Today, Yesterday, Earlier)
   * @param {Array<object>} items 
   * @returns {{ today: Array<object>, yesterday: Array<object>, earlier: Array<object> }}
   */
  static groupNotifications(items) {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const TWO_DAYS = 2 * ONE_DAY;

    items.forEach(item => {
      let isToday = false;
      let isYesterday = false;

      // 1. Check timestamp if valid ISO date
      if (item.timestamp) {
        const itemDate = new Date(item.timestamp).getTime();
        if (!isNaN(itemDate)) {
          const diff = now - itemDate;
          if (diff < ONE_DAY) {
            isToday = true;
          } else if (diff < TWO_DAYS) {
            isYesterday = true;
          }
        }
      }

      // 2. Textual heuristic fallback for mock strings
      if (!isToday && !isYesterday) {
        const timeEn = (item.time_en || '').toLowerCase();
        const timeAr = (item.time_ar || '').toLowerCase();

        if (timeEn.includes('min') || timeEn.includes('hour') || timeAr.includes('دقيقة') || timeAr.includes('ساعة') || timeAr.includes('ساعات')) {
          isToday = true;
        } else if (timeEn.includes('1 day') || timeAr.includes('منذ يوم') || timeAr === 'أمس') {
          isYesterday = true;
        }
      }

      if (isToday) {
        today.push(item);
      } else if (isYesterday) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    return { today, yesterday, earlier };
  }

  /**
   * Update visual unread badge indicators in header and navigation
   * @param {number} [count] 
   */
  static updateUnreadBadges(count = null) {
    if (typeof document === 'undefined') return;
    const unreadCount = count !== null ? count : this.getUnreadCount();

    // 1. Page Header badge
    const headerBadge = document.getElementById('notifications-unread-count');
    if (headerBadge) {
      if (unreadCount > 0) {
        headerBadge.textContent = I18n.t('notifications.unread_count', { count: unreadCount });
        headerBadge.classList.remove('hidden');
      } else {
        headerBadge.textContent = '';
        headerBadge.classList.add('hidden');
      }
    }

    // 2. Global topbar notification indicator dot
    document.querySelectorAll('[data-notif-indicator]').forEach(dot => {
      if (unreadCount > 0) {
        dot.classList.remove('hidden');
      } else {
        dot.classList.add('hidden');
      }
    });
  }

  /**
   * Update filter button styling and counts
   */
  static updateFilterButtons() {
    if (typeof document === 'undefined') return;

    const allItems = this.getNotifications();
    const counts = {
      all: allItems.length,
      likes: allItems.filter(n => n.category === 'likes').length,
      rfqs: allItems.filter(n => n.category === 'rfqs').length,
      courses: allItems.filter(n => n.category === 'courses').length
    };

    document.querySelectorAll('[data-filter-notif]').forEach(btn => {
      const cat = btn.getAttribute('data-filter-notif');
      const isSelected = cat === this.currentFilter;

      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      if (isSelected) {
        btn.className = 'px-4 py-2 rounded-xl bg-brand-gold text-white font-bold text-xs shadow-sm transition-colors shrink-0 flex items-center gap-2';
      } else {
        btn.className = 'px-4 py-2 rounded-xl bg-surface-2 text-text-muted hover:text-text-main hover:bg-surface-1 border border-border-subtle font-medium text-xs transition-colors shrink-0 flex items-center gap-2';
      }

      // Update count badge inside pill if present
      const countSpan = btn.querySelector('.filter-count');
      if (countSpan && counts[cat] !== undefined) {
        countSpan.textContent = counts[cat];
      }
    });
  }

  /**
   * Render single notification card HTML
   * @param {object} notif 
   * @param {string} lang 
   * @returns {string} HTML string
   */
  static renderCard(notif, lang) {
    const isAr = lang === 'ar';
    const title = isAr ? (notif.title_ar || notif.title_en) : (notif.title_en || notif.title_ar);
    const message = isAr ? (notif.message_ar || notif.message_en) : (notif.message_en || notif.message_ar);
    const time = isAr ? (notif.time_ar || notif.time_en) : (notif.time_en || notif.time_ar);
    const isUnread = !notif.read;

    // Type-specific badge and icon configuration
    let typeIcon = '';
    let categoryBadgeText = '';
    let categoryBadgeClass = 'bg-surface-2 text-text-muted border-border-subtle';

    if (notif.type === 'rfq' || notif.category === 'rfqs') {
      categoryBadgeText = isAr ? 'طلب تسعير B2B' : 'B2B RFQ';
      categoryBadgeClass = 'bg-surface-2 text-brand-gold border-border-subtle';
      typeIcon = `
        <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      `;
    } else if (notif.type === 'course' || notif.category === 'courses') {
      categoryBadgeText = isAr ? 'دورة تدريبية' : 'Masterclass';
      categoryBadgeClass = 'bg-surface-2 text-brand-emerald border-border-subtle';
      typeIcon = `
        <svg class="w-4 h-4 text-brand-emerald shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      `;
    } else if (notif.type === 'like' || notif.category === 'likes') {
      categoryBadgeText = isAr ? 'تفاعل وإعجاب' : 'Like & Save';
      categoryBadgeClass = 'bg-surface-2 text-red-500 border-red-500';
      typeIcon = `
        <svg class="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      `;
    } else if (notif.type === 'comment') {
      categoryBadgeText = isAr ? 'تعليق' : 'Comment';
      categoryBadgeClass = 'bg-surface-2 text-blue-500 border-blue-500';
      typeIcon = `
        <svg class="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      `;
    } else {
      categoryBadgeText = isAr ? 'متابعة' : 'Follow';
      categoryBadgeClass = 'bg-surface-2 text-purple-500 border-purple-500';
      typeIcon = `
        <svg class="w-4 h-4 text-purple-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
      `;
    }

    const unreadIndicator = isUnread
      ? `<span class="w-2.5 h-2.5 rounded-full bg-brand-gold shrink-0 ring-4 ring-brand-gold/20" title="${I18n.t('notifications.unread')}"></span>`
      : '';

    const avatarUrl = notif.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80';

    return `
      <article class="notification-card group relative bg-surface-1 hover:bg-surface-2 border ${isUnread ? 'border-brand-gold bg-surface-1 shadow-sm' : 'border-border-subtle'} rounded-2xl p-4 sm:p-5 transition-all duration-200" data-id="${notif.id}" data-read="${notif.read}">
        <div class="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4">
          
          <!-- Avatar & Type Icon Container -->
          <div class="relative shrink-0">
            <img src="${avatarUrl}" alt="${title}" class="w-12 h-12 rounded-xl object-cover border border-border-subtle bg-surface-2 shrink-0">
            <div class="absolute -bottom-1 -end-1 p-1 rounded-lg bg-surface-1 border border-border-subtle shadow-sm flex items-center justify-center">
              ${typeIcon}
            </div>
          </div>

          <!-- Notification Details -->
          <div class="flex-1 min-w-0 text-start space-y-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                ${unreadIndicator}
                <h3 class="text-xs sm:text-sm font-bold text-text-main line-clamp-1 group-hover:text-brand-gold transition-colors">
                  ${title}
                </h3>
              </div>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryBadgeClass}">
                ${categoryBadgeText}
              </span>
            </div>

            <p class="text-xs sm:text-sm text-text-muted leading-relaxed line-clamp-2">
              ${message}
            </p>

            <div class="flex items-center gap-3 pt-1 text-[11px] text-text-muted font-medium">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${time}
              </span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center sm:flex-col justify-end gap-1.5 shrink-0 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
            
            <!-- Open Target Link Action -->
            <a href="${notif.target_url || '#'}" data-action="view-notification" data-id="${notif.id}"
               class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-2 hover:bg-brand-gold hover:text-white border border-border-subtle rounded-xl text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
               title="${I18n.t('notifications.view')}">
              <span>${I18n.t('notifications.view')}</span>
              <svg class="w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>

            <div class="flex items-center gap-1">
              <!-- Mark Read / Unread Button -->
              <button type="button" data-action="toggle-read" data-id="${notif.id}"
                      class="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-2 border border-border-subtle rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      title="${isUnread ? I18n.t('notifications.mark_read') : I18n.t('notifications.mark_unread')}"
                      aria-label="${isUnread ? I18n.t('notifications.mark_read') : I18n.t('notifications.mark_unread')}">
                <svg class="w-3.5 h-3.5 ${isUnread ? 'text-brand-gold' : 'text-text-muted'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </button>

              <!-- Delete Notification Button -->
              <button type="button" data-action="delete-notification" data-id="${notif.id}"
                      class="p-1.5 text-text-muted hover:text-red-500 hover:bg-surface-2 border border-border-subtle rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      title="${I18n.t('notifications.delete')}"
                      aria-label="${I18n.t('notifications.delete')}">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>

          </div>

        </div>
      </article>
    `;
  }

  /**
   * Render grouped notification feed
   */
  static render() {
    if (typeof document === 'undefined') return;

    const container = document.getElementById('notifications-feed-container');
    if (!container) return;

    const allItems = this.getNotifications();
    const lang = I18n.getLang();

    // Filter items
    let filteredItems = allItems;
    if (this.currentFilter !== 'all') {
      filteredItems = allItems.filter(n => n.category === this.currentFilter);
    }

    this.updateFilterButtons();
    this.updateUnreadBadges();

    // Empty state
    if (filteredItems.length === 0) {
      container.innerHTML = `
        <div class="bg-surface-1 border border-border-subtle rounded-2xl p-10 sm:p-12 text-center space-y-4 shadow-sm">
          <div class="w-16 h-16 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center text-text-muted mx-auto">
            <svg class="w-8 h-8 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </div>
          <div class="space-y-1.5 max-w-md mx-auto">
            <h3 class="text-base sm:text-lg font-bold text-text-main">
              ${I18n.t('notifications.no_notifications')}
            </h3>
            <p class="text-xs sm:text-sm text-text-muted leading-relaxed">
              ${I18n.t('notifications.empty_desc')}
            </p>
          </div>
          <div class="pt-2 flex items-center justify-center gap-3">
            <a href="explore.html" class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
              <span>${I18n.t('nav.explore')}</span>
            </a>
          </div>
        </div>
      `;
      return;
    }

    const { today, yesterday, earlier } = this.groupNotifications(filteredItems);

    let html = '';

    // Group 1: Today
    if (today.length > 0) {
      html += `
        <section class="space-y-3" aria-label="${I18n.t('notifications.today')}">
          <div class="flex items-center gap-2 pb-1 text-start">
            <span class="w-2 h-2 rounded-full bg-brand-emerald"></span>
            <h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
              ${I18n.t('notifications.today')} (${today.length})
            </h2>
          </div>
          <div class="space-y-3">
            ${today.map(n => this.renderCard(n, lang)).join('')}
          </div>
        </section>
      `;
    }

    // Group 2: Yesterday
    if (yesterday.length > 0) {
      html += `
        <section class="space-y-3" aria-label="${I18n.t('notifications.yesterday')}">
          <div class="flex items-center gap-2 pb-1 text-start">
            <span class="w-2 h-2 rounded-full bg-brand-gold"></span>
            <h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
              ${I18n.t('notifications.yesterday')} (${yesterday.length})
            </h2>
          </div>
          <div class="space-y-3">
            ${yesterday.map(n => this.renderCard(n, lang)).join('')}
          </div>
        </section>
      `;
    }

    // Group 3: Earlier
    if (earlier.length > 0) {
      html += `
        <section class="space-y-3" aria-label="${I18n.t('notifications.earlier')}">
          <div class="flex items-center gap-2 pb-1 text-start">
            <span class="w-2 h-2 rounded-full bg-text-muted"></span>
            <h2 class="text-xs font-bold uppercase tracking-wider text-text-muted">
              ${I18n.t('notifications.earlier')} (${earlier.length})
            </h2>
          </div>
          <div class="space-y-3">
            ${earlier.map(n => this.renderCard(n, lang)).join('')}
          </div>
        </section>
      `;
    }

    container.innerHTML = html;
  }

  /**
   * Parse query parameters (e.g. ?filter=rfqs)
   */
  static parseURLParams() {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const filterParam = params.get('filter') || params.get('category');
      if (filterParam && ['all', 'likes', 'rfqs', 'courses'].includes(filterParam)) {
        this.currentFilter = filterParam;
      }
    } catch (e) {}
  }

  /**
   * Attach all event listeners and delegations
   */
  static attachEventListeners() {
    if (typeof document === 'undefined') return;

    // 1. Mark All as Read button
    document.querySelectorAll('[data-action="mark-all-read"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.markAllAsRead();
      });
    });

    // 2. Clear All notifications button
    document.querySelectorAll('[data-action="clear-all-notifications"], [data-action="clear-notifications"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearAll();
      });
    });

    // 3. Filter category buttons delegation
    const filterContainer = document.getElementById('notifications-filter-pills');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filter-notif]');
        if (btn) {
          e.preventDefault();
          const cat = btn.getAttribute('data-filter-notif');
          this.setFilter(cat);
        }
      });
    }

    // 4. Feed container item action delegation (toggle read, delete, view)
    const feedContainer = document.getElementById('notifications-feed-container');
    if (feedContainer) {
      feedContainer.addEventListener('click', (e) => {
        // Toggle read
        const toggleReadBtn = e.target.closest('[data-action="toggle-read"]');
        if (toggleReadBtn) {
          e.preventDefault();
          e.stopPropagation();
          const notifId = toggleReadBtn.getAttribute('data-id');
          this.toggleRead(notifId);
          return;
        }

        // Delete
        const deleteBtn = e.target.closest('[data-action="delete-notification"]');
        if (deleteBtn) {
          e.preventDefault();
          e.stopPropagation();
          const notifId = deleteBtn.getAttribute('data-id');
          this.deleteNotification(notifId);
          return;
        }

        // View link click
        const viewLink = e.target.closest('[data-action="view-notification"]');
        if (viewLink) {
          const notifId = viewLink.getAttribute('data-id');
          this.markAsRead(notifId);
          // Let standard navigation proceed
          return;
        }
      });
    }

    // 5. Re-render on language change
    if (typeof window !== 'undefined') {
      window.addEventListener('meyar:lang-changed', () => {
        this.render();
      });
    }
  }

  /**
   * Initialize notifications page
   */
  static init() {
    if (typeof document === 'undefined') return;

    this.parseURLParams();
    this.render();
    this.attachEventListeners();
    this.isInitialized = true;
  }
}

// Auto-bootstrap when running in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationsPage.init());
  } else {
    NotificationsPage.init();
  }
}
