/**
 * Meyar (معيار) Discovery Feed Controller
 * Handles dynamic feed stream rendering, interactive stories carousel,
 * real-time post composer, filter pills, like/bookmark session state,
 * chef follow states, link sharing, and instant solid toast notifications.
 */

import { RECIPE_FIXTURES, TREND_FIXTURES, USER_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Toast } from '../core/toast.js';
import { Modal } from '../core/modal.js';
import { isCurrentUserId } from '../core/utils.js';

export class FeedPage {
  static currentFilter = 'all';
  static userPosts = [];
  static isInitialized = false;
  static deletedRecipeIds = new Set();
  static hiddenRecipeIds = new Set();
  static recipeEdits = new Map();

  static savedRecipeIds = new Set();
  static likedRecipeIds = new Set();
  static followingChefIds = new Set();

  static pendingDeletePostId = null;
  static pendingDeleteIsUserPost = false;
  static pendingEditPostId = null;
  static pendingEditIsUserPost = false;

  /**
   * Reset in-memory feed state (for test isolation)
   */
  static reset() {
    this.savedRecipeIds = new Set();
    this.likedRecipeIds = new Set();
    this.followingChefIds = new Set();
    this.currentFilter = 'all';
    this.userPosts = [];
    this.deletedRecipeIds = new Set();
    this.hiddenRecipeIds = new Set();
    this.recipeEdits = new Map();
    this.pendingDeletePostId = null;
    this.pendingDeleteIsUserPost = false;
    this.pendingEditPostId = null;
    this.pendingEditIsUserPost = false;
    this.isInitialized = false;
  }

  static escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const text = String(str);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get list of saved recipe IDs from in-memory set
   * @returns {string[]}
   */
  static getSavedRecipeIds() {
    return Array.from(this.savedRecipeIds);
  }

  /**
   * Get list of liked recipe IDs from in-memory set
   * @returns {string[]}
   */
  static getLikedRecipeIds() {
    return Array.from(this.likedRecipeIds);
  }

  /**
   * Get list of followed chef IDs from in-memory set
   * @returns {string[]}
   */
  static getFollowingChefIds() {
    return Array.from(this.followingChefIds);
  }

  /**
   * Toggle saved status of a recipe
   * @param {string} recipeId 
   * @returns {boolean} New saved state (true if saved, false if unsaved)
   */
  static toggleSave(recipeId) {
    if (!recipeId) return false;
    const isSaved = this.savedRecipeIds.has(recipeId);

    if (isSaved) {
      this.savedRecipeIds.delete(recipeId);
      Toast.info(I18n.t('toast.unsaved_success'));
    } else {
      this.savedRecipeIds.add(recipeId);
      Toast.success(I18n.t('toast.saved_success'));
    }

    this.updateCardActionStates(recipeId);
    return !isSaved;
  }

  /**
   * Toggle liked status of a recipe
   * @param {string} recipeId 
   * @returns {boolean} New liked state
   */
  static toggleLike(recipeId) {
    if (!recipeId) return false;
    const isLiked = this.likedRecipeIds.has(recipeId);
    const lang = I18n.getLang();

    if (isLiked) {
      this.likedRecipeIds.delete(recipeId);
      Toast.info(lang === 'ar' ? 'تم إلغاء الإعجاب بالوصفة' : 'Recipe unliked');
    } else {
      this.likedRecipeIds.add(recipeId);
      Toast.success(lang === 'ar' ? 'أعجبك هذا الطبق الفاخر!' : 'Liked this gourmet masterpiece!');
    }

    this.updateCardActionStates(recipeId);
    return !isLiked;
  }

  /**
   * Toggle following status of a chef
   * @param {string} chefId 
   * @returns {boolean} New following state
   */
  static toggleFollow(chefId) {
    if (!chefId || isCurrentUserId(chefId, USER_FIXTURES)) return false;
    const isFollowing = this.followingChefIds.has(chefId);

    if (isFollowing) {
      this.followingChefIds.delete(chefId);
      Toast.info(I18n.t('toast.unfollowed_success'));
    } else {
      this.followingChefIds.add(chefId);
      Toast.success(I18n.t('toast.followed_success'));
    }

    this.updateFollowButtonStates(chefId);
    return !isFollowing;
  }

  /**
   * Share recipe link to clipboard
   * @param {string} recipeId 
   * @param {string} [title]
   */
  static shareRecipe(recipeId, title = '') {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/recipe.html?id=${recipeId}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        Toast.success(I18n.t('toast.copied_success'));
      }).catch(() => {
        this.fallbackCopyText(url);
      });
    } else {
      this.fallbackCopyText(url);
    }
  }

  /**
   * Fallback copy text mechanism
   * @param {string} text 
   */
  static fallbackCopyText(text) {
    if (typeof document === 'undefined') return;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      Toast.success(I18n.t('toast.copied_success'));
    } catch {
      Toast.info(text);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Update visual states for like and save buttons of a specific recipe card
   * @param {string} recipeId 
   */
  static updateCardActionStates(recipeId) {
    if (typeof document === 'undefined') return;

    const liked = new Set(this.getLikedRecipeIds());
    const saved = new Set(this.getSavedRecipeIds());
    const isLiked = liked.has(recipeId);
    const isSaved = saved.has(recipeId);

    // Update Like buttons
    document.querySelectorAll(`[data-action="like"][data-recipe-id="${recipeId}"]`).forEach(btn => {
      const countEl = btn.querySelector('.action-count');
      const baseLikes = parseInt(btn.getAttribute('data-base-likes') || '0', 10);
      const newCount = baseLikes + (isLiked ? 1 : 0);
      if (countEl) countEl.textContent = newCount.toLocaleString();

      if (isLiked) {
        btn.classList.add('text-red-500', 'bg-surface-2', 'border-red-500');
        btn.classList.remove('text-text-muted', 'bg-surface-2');
        const icon = btn.querySelector('svg');
        if (icon) icon.setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('text-red-500', 'bg-surface-2', 'border-red-500');
        btn.classList.add('text-text-muted', 'bg-surface-2');
        const icon = btn.querySelector('svg');
        if (icon) icon.setAttribute('fill', 'none');
      }
    });

    // Update Save buttons
    document.querySelectorAll(`[data-action="save"][data-recipe-id="${recipeId}"]`).forEach(btn => {
      const countEl = btn.querySelector('.action-count');
      const baseSaves = parseInt(btn.getAttribute('data-base-saves') || '0', 10);
      const newCount = baseSaves + (isSaved ? 1 : 0);
      if (countEl) countEl.textContent = newCount.toLocaleString();

      const labelEl = btn.querySelector('.action-label');
      if (labelEl) {
        labelEl.textContent = isSaved ? I18n.t('btn.saved') : I18n.t('btn.save');
      }

      if (isSaved) {
        btn.classList.add('text-brand-gold', 'bg-surface-2', 'border-border-subtle');
        btn.classList.remove('text-text-muted', 'bg-surface-2');
        const icon = btn.querySelector('svg');
        if (icon) icon.setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('text-brand-gold', 'bg-surface-2', 'border-border-subtle');
        btn.classList.add('text-text-muted', 'bg-surface-2');
        const icon = btn.querySelector('svg');
        if (icon) icon.setAttribute('fill', 'none');
      }
    });
  }

  /**
   * Update follow buttons for a chef
   * @param {string} chefId 
   */
  static updateFollowButtonStates(chefId) {
    if (typeof document === 'undefined') return;

    const following = new Set(this.getFollowingChefIds());
    const isFollowing = following.has(chefId);

    document.querySelectorAll(`[data-action="follow"][data-chef-id="${chefId}"]`).forEach(btn => {
      if (isFollowing) {
        btn.textContent = I18n.t('btn.following');
        btn.classList.add('bg-surface-2', 'text-text-muted', 'border-border-subtle');
        btn.classList.remove('bg-brand-gold', 'text-white', 'border-transparent');
      } else {
        btn.textContent = I18n.t('btn.follow');
        btn.classList.add('bg-brand-gold', 'text-white', 'border-transparent');
        btn.classList.remove('bg-surface-2', 'text-text-muted', 'border-border-subtle');
      }
    });
  }

  /**
   * Render Stories Carousel Items
   * @param {HTMLElement} [container] 
   */
  static renderStories(container = typeof document !== 'undefined' ? document.getElementById('stories-track') : null) {
    if (!container) return;

    const lang = I18n.getLang();
    const stories = TREND_FIXTURES?.stories || [];
    const activeUser = USER_FIXTURES;

    let html = `
      <!-- User's Story Add Button -->
      <div class="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer group" data-action="add-story">
        <div class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 border-2 border-dashed border-brand-gold flex items-center justify-center bg-surface-2 group-hover:scale-105 transition-transform">
          <img src="${activeUser?.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80'}"
               alt="${lang === 'ar' ? activeUser?.name_ar : activeUser?.name_en}"
               class="w-full h-full rounded-full object-cover">
          <span class="absolute bottom-0 end-0 w-4.5 h-4.5 rounded-full bg-brand-gold text-white flex items-center justify-center text-xs font-bold border-2 border-surface-1 shadow-sm">
            +
          </span>
        </div>
        <span class="text-[11px] font-medium text-text-main max-w-[70px] truncate">
          ${lang === 'ar' ? 'قصتك' : 'Your Story'}
        </span>
      </div>
    `;

    stories.forEach(story => {
      const chefName = lang === 'ar' ? story.chef_name_ar : story.chef_name_en;
      const ringClass = story.unviewed 
        ? 'border-2 border-brand-gold ring-2 ring-brand-gold/30' 
        : 'border border-border-subtle';

      html += `
        <div class="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer group" data-action="view-story" data-story-id="${story.id}" data-chef-id="${story.chef_id}">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 ${ringClass} bg-surface-2 group-hover:scale-105 transition-transform">
            <img src="${story.avatar}"
                 alt="${chefName}"
                 class="w-full h-full rounded-full object-cover">
          </div>
          <span class="text-[11px] font-medium text-text-muted group-hover:text-text-main max-w-[72px] truncate transition-colors">
            ${chefName}
          </span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render Trending Topics in right sidebar
   * @param {HTMLElement} [container] 
   */
  static renderTrendingTopics(container = typeof document !== 'undefined' ? document.getElementById('trending-topics-container') : null) {
    if (!container) return;

    const lang = I18n.getLang();
    const topics = TREND_FIXTURES?.topics || [];

    const html = topics.map(item => {
      const title = lang === 'ar' ? item.title_ar : item.title_en;
      return `
        <div class="p-2.5 rounded-xl bg-surface-2 hover:bg-surface-1 border border-border-subtle cursor-pointer transition-colors group" data-action="filter-topic" data-topic="${item.tag}">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-brand-gold group-hover:underline dir-ltr text-start">${item.tag}</span>
            <span class="text-[10px] text-text-muted">${item.posts_count} ${lang === 'ar' ? 'مشاركة' : 'posts'}</span>
          </div>
          <p class="text-[11px] text-text-muted group-hover:text-text-main mt-0.5 line-clamp-1 transition-colors">
            ${title}
          </p>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render Top Suppliers in right sidebar
   * @param {HTMLElement} [container] 
   */
  static renderTopSuppliers(container = typeof document !== 'undefined' ? document.getElementById('top-suppliers-container') : null) {
    if (!container) return;

    const lang = I18n.getLang();
    const suppliers = TREND_FIXTURES?.top_suppliers || [];

    const html = suppliers.map(sup => {
      const name = lang === 'ar' ? sup.name_ar : sup.name_en;
      const category = lang === 'ar' ? sup.category_ar : sup.category_en;
      return `
        <div class="flex items-center justify-between p-2 rounded-xl bg-surface-2 border border-border-subtle">
          <div class="flex items-center gap-2.5 min-w-0">
            <img src="${sup.avatar}" alt="${name}" class="w-9 h-9 rounded-lg object-cover border border-border-subtle shrink-0">
            <div class="min-w-0">
              <a href="supplies.html" class="text-xs font-bold text-text-main hover:text-brand-gold block truncate">
                ${name}
              </a>
              <span class="text-[10px] text-text-muted block truncate">${category}</span>
            </div>
          </div>
          <a href="supplies.html" class="px-2.5 py-1 text-[11px] font-semibold text-brand-gold hover:text-white hover:bg-brand-gold bg-surface-1 border border-border-subtle rounded-lg transition-colors shrink-0">
            ${I18n.t('btn.rfq_request')}
          </a>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render Upcoming Workshops in right sidebar
   * @param {HTMLElement} [container] 
   */
  static renderUpcomingWorkshops(container = typeof document !== 'undefined' ? document.getElementById('upcoming-workshops-container') : null) {
    if (!container) return;

    const lang = I18n.getLang();
    const workshops = TREND_FIXTURES?.upcoming_workshops || [];

    const html = workshops.map(ws => {
      const title = lang === 'ar' ? ws.title_ar : ws.title_en;
      const instructor = lang === 'ar' ? ws.instructor_ar : ws.instructor_en;
      const date = lang === 'ar' ? ws.date_ar : ws.date_en;

      return `
        <div class="p-3 rounded-xl bg-surface-2 border border-border-subtle space-y-2 text-start">
          <div class="flex items-center justify-between gap-1">
            <span class="text-[10px] font-bold text-brand-emerald bg-surface-1 px-2 py-0.5 rounded border border-border-subtle">
              ${ws.seats_left} ${lang === 'ar' ? 'مقاعد متبقية' : 'seats left'}
            </span>
            <span class="text-[10px] text-text-muted">${date}</span>
          </div>
          <a href="courses.html" class="block text-xs font-bold text-text-main hover:text-brand-gold line-clamp-1">
            ${title}
          </a>
          <div class="flex items-center justify-between text-[11px] pt-1 border-t border-border-subtle">
            <span class="text-text-muted truncate">${instructor}</span>
            <a href="courses.html" class="font-semibold text-brand-gold hover:underline shrink-0">
              ${I18n.t('btn.enroll')}
            </a>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }



  /**
   * Render Main Stream Feed Posts
   * @param {HTMLElement} [container] 
   */
  static renderFeedPosts(container = typeof document !== 'undefined' ? document.getElementById('feed-posts-container') : null) {
    if (!container) return;

    const lang = I18n.getLang();
    const savedSet = new Set(this.getSavedRecipeIds());
    const likedSet = new Set(this.getLikedRecipeIds());
    const followingSet = new Set(this.getFollowingChefIds());
    const activeUser = USER_FIXTURES || { id: '' };

    // Gather and filter recipes
    let recipes = [...(RECIPE_FIXTURES || [])]
      .filter(r => !this.deletedRecipeIds.has(r.id) && !this.hiddenRecipeIds.has(r.id))
      .map(r => ({ ...r, ...(this.recipeEdits.get(r.id) || {}) }));

    if (this.currentFilter === 'trending') {
      recipes.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (this.currentFilter === 'chefs') {
      recipes = recipes.filter(r => r.author_id === 'chef-1' || r.author_id === 'chef-2' || r.author_id === 'chef-3');
    } else if (this.currentFilter === 'supplies') {
      // Show B2B equipment-oriented preview items
      recipes = recipes.filter(r => r.tags?.some(t => ['Wagyu', 'FineDining', 'Fermentation'].includes(t)));
    } else if (this.currentFilter === 'courses') {
      // Show masterclass-associated recipes
      recipes = recipes.filter(r => r.difficulty === 'Hard' || r.difficulty === 'Medium');
    }

    // Combine with locally submitted user posts
    let html = '';

    // Render user submitted posts first
    this.userPosts.forEach(post => {
      const isSaved = savedSet.has(post.id);
      const isLiked = likedSet.has(post.id);

      const totalLikes = (post.likes_count || 0) + (isLiked ? 1 : 0);
      const totalSaves = (post.saves_count || 0) + (isSaved ? 1 : 0);

      const likeClass = isLiked
        ? 'text-red-500 bg-surface-2 border-red-500'
        : 'text-text-muted bg-surface-2 hover:bg-surface-1 border-border-subtle';
      const likeFill = isLiked ? 'currentColor' : 'none';

      const saveClass = isSaved
        ? 'text-brand-gold bg-surface-2 border-border-subtle'
        : 'text-text-muted bg-surface-2 hover:bg-surface-1 border-border-subtle';
      const saveFill = isSaved ? 'currentColor' : 'none';

      const isOwner = post.author_id === activeUser.id;

      html += `
        <article class="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden p-5 shadow-sm space-y-4 text-start relative min-w-0" data-card-post-id="${post.id}">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-3 min-w-0">
              <img src="${this.escapeHtml(post.avatar)}" alt="${this.escapeHtml(post.author)}" class="w-10 h-10 rounded-xl object-cover border border-border-subtle shrink-0">
              <div class="min-w-0">
                <h4 class="text-xs sm:text-sm font-bold text-text-main truncate">${this.escapeHtml(post.author)}</h4>
                <p class="text-[11px] text-text-muted truncate">${this.escapeHtml(post.timeAgo)} • <span class="text-brand-gold font-semibold">${this.escapeHtml(post.handle)}</span></p>
              </div>
            </div>
            <div class="flex items-center gap-2 relative shrink-0">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-2 text-brand-gold border border-border-subtle shrink-0">
                ${lang === 'ar' ? 'منشور جديد' : 'New Post'}
              </span>

              <!-- 3-dots option button -->
              <button type="button" data-action="toggle-dropdown" class="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold" aria-label="Options">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div class="absolute end-0 top-full mt-1 w-40 bg-surface-1 border border-border-subtle rounded-xl shadow-lg py-1 z-10 hidden dropdown-menu" data-dropdown>
                ${isOwner ? `
                  <button type="button" data-action="edit-post" data-post-id="${post.id}" class="w-full text-start px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-2 transition-colors flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span>${I18n.t('btn.edit')}</span>
                  </button>
                  <button type="button" data-action="delete-post" data-post-id="${post.id}" class="w-full text-start px-3 py-2 text-xs font-semibold text-red-600 hover:bg-surface-2 transition-colors flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span>${I18n.t('btn.delete')}</span>
                  </button>
                ` : `
                  <button type="button" data-action="report-post" data-post-id="${post.id}" class="w-full text-start px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-2 transition-colors flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>
                    <span>${I18n.t('btn.report')}</span>
                  </button>
                  <button type="button" data-action="hide-post" data-post-id="${post.id}" class="w-full text-start px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-2 transition-colors flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                    <span>${I18n.t('btn.hide')}</span>
                  </button>
                `}
              </div>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-text-main leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">${this.escapeHtml(post.content)}</p>

          <!-- Interactive Actions Bar -->
          <div class="pb-1 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <!-- Like Button -->
              <button type="button" data-action="like" data-recipe-id="${post.id}" data-base-likes="${post.likes_count || 0}"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${likeClass} focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      aria-label="Like recipe">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="${likeFill}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span class="action-count">${totalLikes.toLocaleString()}</span>
              </button>

              <!-- Save / Bookmark Button -->
              <button type="button" data-action="save" data-recipe-id="${post.id}" data-base-saves="${post.saves_count || 0}"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${saveClass} focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      aria-label="Save recipe">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="${saveFill}" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                <span class="action-label hidden sm:inline">${isSaved ? I18n.t('btn.saved') : I18n.t('btn.save')}</span>
                <span class="action-count">${totalSaves.toLocaleString()}</span>
              </button>

              <!-- Share Button -->
              <button type="button" data-action="share" data-recipe-id="${post.id}"
                      class="p-2 text-text-muted hover:text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      aria-label="Share recipe">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
            </div>
          </div>
        </article>
      `;
    });

    // Render gourmet recipe feed items
    recipes.forEach(recipe => {
      const isSaved = savedSet.has(recipe.id);
      const isLiked = likedSet.has(recipe.id);
      const isOwner = recipe.author_id === activeUser.id;
      const isFollowing = followingSet.has(recipe.author_id);

      const title = lang === 'ar' ? (recipe.title_ar || recipe.title) : (recipe.title_en || recipe.title);
      const description = lang === 'ar' ? recipe.description_ar : recipe.description_en;
      const authorName = lang === 'ar' ? recipe.author_name_ar : recipe.author_name_en;
      const cuisine = lang === 'ar' ? recipe.cuisine_ar : recipe.cuisine_en;
      const difficulty = lang === 'ar' ? recipe.difficulty_ar : recipe.difficulty_en;

      const totalLikes = (recipe.likes_count || 0) + (isLiked ? 1 : 0);
      const totalSaves = (recipe.saves_count || 0) + (isSaved ? 1 : 0);

      const likeClass = isLiked 
        ? 'text-red-500 bg-surface-2 border-red-500' 
        : 'text-text-muted bg-surface-2 hover:bg-surface-1 border-border-subtle';
      const likeFill = isLiked ? 'currentColor' : 'none';

      const saveClass = isSaved 
        ? 'text-brand-gold bg-surface-2 border-border-subtle' 
        : 'text-text-muted bg-surface-2 hover:bg-surface-1 border-border-subtle';
      const saveFill = isSaved ? 'currentColor' : 'none';

      const followText = isFollowing ? I18n.t('btn.following') : I18n.t('btn.follow');
      const followClass = isFollowing
        ? 'bg-surface-2 text-text-muted border-border-subtle'
        : 'bg-brand-gold hover:bg-brand-gold-hover text-white border-transparent';

      const followButton = isOwner ? '' : `
        <button type="button" data-action="follow" data-chef-id="${recipe.author_id}"
                class="px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold ${followClass}">
          ${followText}
        </button>
      `;

      // Ingredients chips
      const ingredientsPreview = (recipe.ingredients || []).slice(0, 3).map(ing => {
        const name = lang === 'ar' ? ing.name_ar : ing.name_en;
        return `<span class="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-lg bg-surface-2 border border-border-subtle text-text-muted">${name}</span>`;
      }).join(' ');

      html += `
        <article class="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden shadow-sm space-y-4 text-start transition-all hover:border-border-subtle relative min-w-0" data-card-recipe-id="${recipe.id}">
          
          <!-- Post Author Header -->
          <div class="px-4 sm:px-5 pt-4 sm:pt-5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <a href="chef.html?id=${recipe.author_id}" class="shrink-0 group">
                <img src="${recipe.author_avatar}" alt="${authorName}" class="w-11 h-11 rounded-xl object-cover border border-border-subtle group-hover:ring-2 group-hover:ring-brand-gold transition-all">
              </a>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <a href="chef.html?id=${recipe.author_id}" class="font-bold text-xs sm:text-sm text-text-main hover:text-brand-gold truncate transition-colors">
                    ${authorName}
                  </a>
                  <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <p class="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                  <span>${cuisine || 'Gourmet'}</span>
                  <span>•</span>
                  <span>${recipe.created_at || '2026-08-01'}</span>
                </p>
              </div>
            </div>

            <!-- Follow Button & 3-dots -->
            <div class="flex items-center gap-2 relative">
              ${followButton}

              <!-- 3-dots option button -->
              <button type="button" data-action="toggle-dropdown" class="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold" aria-label="Options">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div class="absolute end-0 top-full mt-1 w-40 bg-surface-1 border border-border-subtle rounded-xl shadow-lg py-1 z-10 hidden dropdown-menu" data-dropdown>
                ${isOwner ? `
                  <button type="button" data-action="edit-post" data-post-id="${recipe.id}" class="w-full text-start px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-2 transition-colors flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span>${I18n.t('btn.edit')}</span>
                  </button>
                  <button type="button" data-action="delete-post" data-post-id="${recipe.id}" class="w-full text-start px-3 py-2 text-xs font-semibold text-red-600 hover:bg-surface-2 transition-colors flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span>${I18n.t('btn.delete')}</span>
                  </button>
                ` : `
                  <button type="button" data-action="report-post" data-post-id="${recipe.id}" class="w-full text-start px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-2 transition-colors flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>
                    <span>${I18n.t('btn.report')}</span>
                  </button>
                  <button type="button" data-action="hide-post" data-post-id="${recipe.id}" class="w-full text-start px-3 py-2 text-xs font-semibold text-text-main hover:bg-surface-2 transition-colors flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                    <span>${I18n.t('btn.hide')}</span>
                  </button>
                `}
              </div>
            </div>
          </div>

          <!-- Recipe Body: Title & Teaser -->
          <div class="px-4 sm:px-5 space-y-2">
            <h3 class="text-sm sm:text-base font-extrabold text-text-main leading-snug break-words">
              <a href="recipe.html?id=${recipe.id}" class="hover:text-brand-gold transition-colors">
                ${title}
              </a>
            </h3>
            <p class="text-xs text-text-muted leading-relaxed line-clamp-2 break-words [overflow-wrap:anywhere]">
              ${this.escapeHtml(description) /* Escape description to prevent XSS */}
            </p>
          </div>

          <!-- Recipe Media Card with Meta Badges -->
          <div class="relative group mx-4 sm:mx-5 rounded-xl overflow-hidden border border-border-subtle bg-surface-2">
            <a href="recipe.html?id=${recipe.id}" class="block aspect-video overflow-hidden">
              <img src="${recipe.image}" alt="${title}" class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300">
            </a>
            
            <!-- Quick Meta Overlay Badges -->
            <div class="absolute top-3 start-3 flex flex-wrap gap-1.5">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-surface-1 text-text-main border border-border-subtle shadow-sm">
                ${difficulty}
              </span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-surface-1 text-brand-gold border border-border-subtle shadow-sm flex items-center gap-1">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ${recipe.rating || 4.9}
              </span>
            </div>

            <div class="absolute bottom-3 end-3 flex items-center gap-1.5">
              <span class="px-2 py-0.5 text-[10px] font-medium rounded bg-surface-1 text-text-main border border-border-subtle shadow-sm flex items-center gap-1">
                <svg class="w-3 h-3 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${recipe.total_time || 45} ${lang === 'ar' ? 'دقيقة' : 'min'}
              </span>
              <span class="px-2 py-0.5 text-[10px] font-medium rounded bg-surface-1 text-text-main border border-border-subtle shadow-sm">
                ${recipe.base_servings || 4} ${lang === 'ar' ? 'حصص' : 'servings'}
              </span>
            </div>
          </div>

          <!-- Key Ingredients Chips -->
          <div class="px-4 sm:px-5 flex flex-wrap items-center gap-1.5">
            <span class="text-[10px] font-semibold text-text-muted">${lang === 'ar' ? 'أبرز المكونات:' : 'Key Ingredients:'}</span>
            ${ingredientsPreview}
          </div>

          <!-- Interactive Actions Bar -->
          <div class="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
            
            <div class="flex items-center gap-1.5 sm:gap-2">
              <!-- Like Button -->
              <button type="button" data-action="like" data-recipe-id="${recipe.id}" data-base-likes="${recipe.likes_count || 0}"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${likeClass} focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      aria-label="Like recipe">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="${likeFill}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span class="action-count">${totalLikes.toLocaleString()}</span>
              </button>

              <!-- Save / Bookmark Button -->
              <button type="button" data-action="save" data-recipe-id="${recipe.id}" data-base-saves="${recipe.saves_count || 0}"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${saveClass} focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      aria-label="Save recipe">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="${saveFill}" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                <span class="action-label hidden sm:inline">${isSaved ? I18n.t('btn.saved') : I18n.t('btn.save')}</span>
                <span class="action-count">${totalSaves.toLocaleString()}</span>
              </button>

              <!-- Share Button -->
              <button type="button" data-action="share" data-recipe-id="${recipe.id}"
                      class="p-2 text-text-muted hover:text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      aria-label="Share recipe">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
            </div>

            <!-- View Full Recipe & Scaler CTA -->
            <a href="recipe.html?id=${recipe.id}"
               class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-brand-gold bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold">
              <span>${lang === 'ar' ? 'عرض الوصفة والمقادير' : 'View Recipe & Scaler'}</span>
              <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </a>

          </div>

        </article>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Bind all event listeners for the Feed page
   */
  static bindEvents() {
    if (typeof document === 'undefined') return;

    // 1. Stories Reel Navigation Buttons
    const prevBtn = document.getElementById('stories-prev-btn');
    const nextBtn = document.getElementById('stories-next-btn');
    const storiesTrack = document.getElementById('stories-track');

    if (prevBtn && storiesTrack) {
      prevBtn.addEventListener('click', () => {
        const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
        storiesTrack.scrollBy({ left: isRtl ? 200 : -200, behavior: 'smooth' });
      });
    }

    if (nextBtn && storiesTrack) {
      nextBtn.addEventListener('click', () => {
        const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
        storiesTrack.scrollBy({ left: isRtl ? -200 : 200, behavior: 'smooth' });
      });
    }

    // 2. Post Composer Share Trigger
    const composerBtn = document.getElementById('feed-composer-btn');
    const composerInput = document.getElementById('feed-composer-input');

    if (composerBtn && composerInput) {
      composerBtn.addEventListener('click', () => {
        const content = composerInput.value.trim();
        const lang = I18n.getLang();

        if (!content) {
          Toast.error(lang === 'ar' ? 'يرجى كتابة فكرة أو وصفة للمشاركة' : 'Please enter your culinary post content');
          composerInput.focus();
          return;
        }

        const activeUser = USER_FIXTURES;
        const newPost = {
          id: `post-${Date.now()}`,
          author_id: activeUser.id,
          author: lang === 'ar' ? activeUser.name_ar : activeUser.name_en,
          handle: activeUser.handle,
          avatar: activeUser.avatar,
          content: content,
          timeAgo: lang === 'ar' ? 'الآن' : 'Just now',
          created_at: new Date().toISOString(),
          likes_count: 0,
          saves_count: 0
        };

        this.userPosts.unshift(newPost);
        composerInput.value = '';
        this.renderFeedPosts();
        Toast.success(I18n.t('toast.recipe_published'));
      });
    }

    // 3. Feed Filter Bar Pills
    const filterBar = document.getElementById('feed-filter-bar');
    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;

        const filter = btn.getAttribute('data-filter') || 'all';
        this.currentFilter = filter;

        // Update button states
        filterBar.querySelectorAll('button[data-filter]').forEach(b => {
          b.classList.remove('bg-surface-1', 'text-brand-gold', 'active-filter', 'font-bold');
          b.classList.add('bg-surface-2', 'text-text-muted', 'font-medium');
        });
        btn.classList.remove('bg-surface-2', 'text-text-muted', 'font-medium');
        btn.classList.add('bg-surface-1', 'text-brand-gold', 'active-filter', 'font-bold');

        this.renderFeedPosts();
      });
    }

    // 4. Global Action Event Delegation (Like, Save, Follow, Share, Story View, Topic Filter)
    document.addEventListener('click', (e) => {
      // Like
      const likeBtn = e.target.closest('[data-action="like"]');
      if (likeBtn) {
        e.preventDefault();
        const recipeId = likeBtn.getAttribute('data-recipe-id');
        this.toggleLike(recipeId);
        return;
      }

      // Save
      const saveBtn = e.target.closest('[data-action="save"]');
      if (saveBtn) {
        e.preventDefault();
        const recipeId = saveBtn.getAttribute('data-recipe-id');
        this.toggleSave(recipeId);
        return;
      }

      // Follow
      const followBtn = e.target.closest('[data-action="follow"]');
      if (followBtn) {
        e.preventDefault();
        const chefId = followBtn.getAttribute('data-chef-id');
        this.toggleFollow(chefId);
        return;
      }

      // Share
      const shareBtn = e.target.closest('[data-action="share"]');
      if (shareBtn) {
        e.preventDefault();
        const recipeId = shareBtn.getAttribute('data-recipe-id');
        this.shareRecipe(recipeId);
        return;
      }

      // Story View Click
      const storyItem = e.target.closest('[data-action="view-story"]');
      if (storyItem) {
        e.preventDefault();
        const chefId = storyItem.getAttribute('data-chef-id');
        if (chefId) {
          window.location.href = `chef.html?id=${chefId}`;
        }
        return;
      }

      // Trending Topic Filter Click
      const topicItem = e.target.closest('[data-action="filter-topic"]');
      if (topicItem) {
        e.preventDefault();
        const topicTag = topicItem.getAttribute('data-topic');
        Toast.info(`${I18n.getLang() === 'ar' ? 'تصفية حسب الوسم:' : 'Filtering by tag:'} ${topicTag}`);
        this.currentFilter = 'trending';
        
        // Sync filter bar if present
        if (filterBar) {
          const trendBtn = filterBar.querySelector('[data-filter="trending"]');
          if (trendBtn) trendBtn.click();
        }
        return;
      }

      // Toggle dropdown
      const toggleBtn = e.target.closest('[data-action="toggle-dropdown"]');
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = toggleBtn.parentElement.querySelector('.dropdown-menu');
        if (dropdown) {
          // Close all other dropdowns
          document.querySelectorAll('.dropdown-menu').forEach(dd => {
            if (dd !== dropdown) {
              dd.classList.add('hidden');
            }
          });
          dropdown.classList.toggle('hidden');
        }
        return;
      }

      // Close dropdowns if clicking outside
      if (!e.target.closest('.dropdown-menu') && !e.target.closest('[data-action="toggle-dropdown"]')) {
        document.querySelectorAll('.dropdown-menu').forEach(dd => {
          dd.classList.add('hidden');
        });
      }

      // Delete post
      const deleteBtn = e.target.closest('[data-action="delete-post"]');
      if (deleteBtn) {
        e.preventDefault();
        const postId = deleteBtn.getAttribute('data-post-id');
        this.pendingDeletePostId = postId;
        this.pendingDeleteIsUserPost = this.userPosts.some(p => p.id === postId);

        // Close the open 3-dots dropdown menu
        document.querySelectorAll('.dropdown-menu').forEach(dd => {
          dd.classList.add('hidden');
        });

        const modalEl = document.getElementById('modal-feed-delete-confirm');
        if (modalEl) {
          Modal.open('modal-feed-delete-confirm');
        } else {
          // ponytail: fallback for tests where the modal is not pre-created
          if (this.pendingDeleteIsUserPost) {
            this.userPosts = this.userPosts.filter(p => p.id !== postId);
          } else {
            this.deletedRecipeIds.add(postId);
          }
          Toast.success(I18n.t('toast.post_deleted'));
          this.renderFeedPosts();
          this.pendingDeletePostId = null;
          this.pendingDeleteIsUserPost = false;
        }
        return;
      }

      // Edit post
      const editBtn = e.target.closest('[data-action="edit-post"]');
      if (editBtn) {
        e.preventDefault();
        const postId = editBtn.getAttribute('data-post-id');
        this.pendingEditPostId = postId;

        // Close the open 3-dots dropdown menu
        document.querySelectorAll('.dropdown-menu').forEach(dd => {
          dd.classList.add('hidden');
        });

        const textarea = document.getElementById('feed-edit-textarea');
        const label = document.getElementById('feed-edit-modal-label');
        const title = document.getElementById('feed-edit-modal-title');

        const userPost = this.userPosts.find(p => p.id === postId);
        if (userPost) {
          this.pendingEditIsUserPost = true;
          if (textarea) textarea.value = userPost.content;
          if (label) {
            label.textContent = I18n.t('feed.edit_post_prompt');
            label.setAttribute('data-i18n', 'feed.edit_post_prompt');
          }
          if (title) {
            title.textContent = I18n.t('feed.edit_post_title');
            title.setAttribute('data-i18n', 'feed.edit_post_title');
          }
        } else {
          const recipe = RECIPE_FIXTURES?.find(r => r.id === postId);
          if (recipe) {
            this.pendingEditIsUserPost = false;
            const lang = I18n.getLang();
            const edits = this.recipeEdits.get(postId) || {};
            const currentDesc = lang === 'ar'
              ? (edits.description_ar || recipe.description_ar)
              : (edits.description_en || recipe.description_en);
            if (textarea) textarea.value = currentDesc;
            if (label) {
              label.textContent = I18n.t('feed.edit_recipe_prompt');
              label.setAttribute('data-i18n', 'feed.edit_recipe_prompt');
            }
            if (title) {
              title.textContent = I18n.t('feed.edit_recipe_title');
              title.setAttribute('data-i18n', 'feed.edit_recipe_title');
            }
          }
        }
        Modal.open('modal-feed-edit');
        return;
      }

      // Hide post
      const hideBtn = e.target.closest('[data-action="hide-post"]');
      if (hideBtn) {
        e.preventDefault();
        const postId = hideBtn.getAttribute('data-post-id');
        const isUserPost = this.userPosts.some(p => p.id === postId);
        if (isUserPost) {
          this.userPosts = this.userPosts.filter(p => p.id !== postId);
        } else {
          this.hiddenRecipeIds.add(postId);
        }
        Toast.success(I18n.t('toast.post_hidden'));
        this.renderFeedPosts();
        return;
      }

      // Report post
      const reportBtn = e.target.closest('[data-action="report-post"]');
      if (reportBtn) {
        e.preventDefault();
        Toast.success(I18n.t('toast.post_reported'));
        const dropdown = reportBtn.closest('.dropdown-menu');
        if (dropdown) {
          dropdown.classList.add('hidden');
        }
        return;
      }
    });

    // Bind handlers for the action buttons inside the custom modals
    const confirmDeleteBtn = document.getElementById('feed-confirm-delete-btn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        const postId = this.pendingDeletePostId;
        if (postId) {
          if (this.pendingDeleteIsUserPost) {
            this.userPosts = this.userPosts.filter(p => p.id !== postId);
          } else {
            this.deletedRecipeIds.add(postId);
          }
          Toast.success(I18n.t('toast.post_deleted'));
          this.renderFeedPosts();
        }
        Modal.close('modal-feed-delete-confirm');
        this.pendingDeletePostId = null;
        this.pendingDeleteIsUserPost = false;
      });
    }

    const saveEditBtn = document.getElementById('feed-save-edit-btn');
    if (saveEditBtn) {
      saveEditBtn.addEventListener('click', () => {
        const postId = this.pendingEditPostId;
        const textarea = document.getElementById('feed-edit-textarea');
        if (postId && textarea) {
          const newContent = textarea.value.trim();
          if (this.pendingEditIsUserPost) {
            const userPost = this.userPosts.find(p => p.id === postId);
            if (userPost) {
              userPost.content = newContent;
              Toast.success(I18n.t('toast.post_updated'));
              this.renderFeedPosts();
            }
          } else {
            const recipe = RECIPE_FIXTURES?.find(r => r.id === postId);
            if (recipe) {
              const lang = I18n.getLang();
              const edits = this.recipeEdits.get(postId) || {};
              this.recipeEdits.set(postId, {
                ...edits,
                [lang === 'ar' ? 'description_ar' : 'description_en']: newContent
              });
              Toast.success(I18n.t('toast.recipe_updated'));
              this.renderFeedPosts();
            }
          }
        }
        Modal.close('modal-feed-edit');
        this.pendingEditPostId = null;
        this.pendingEditIsUserPost = false;
      });
    }

    // 5. Re-render on language change event
    if (typeof window !== 'undefined') {
      window.addEventListener('meyar:lang-changed', () => {
        this.renderAll();
      });
    }
  }

  /**
   * Render all components on page
   */
  static renderAll() {
    this.renderStories();
    this.renderTrendingTopics();
    this.renderTopSuppliers();
    this.renderUpcomingWorkshops();
    this.renderFeedPosts();
  }

  /**
   * Initialize Feed Page
   */
  static init() {
    if (this.isInitialized) return;
    if (typeof document === 'undefined') return;
    this.deletedRecipeIds = new Set();
    this.hiddenRecipeIds = new Set();
    this.renderAll();
    this.bindEvents();
    this.isInitialized = true;
  }
}
