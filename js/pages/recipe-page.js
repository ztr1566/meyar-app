/**
 * Meyar (معيار) Recipe Detail & Interactive Cooking Page Controller
 * Handles dynamic serving scaling, interactive step checklist with timers,
 * progress tracking, bookmarks, likes, chef follow, and bilingual live synchronization.
 */

import { CHEF_FIXTURES, RECIPE_FIXTURES, USER_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Toast } from '../core/toast.js';
import { escapeHtml, isCurrentUserId } from '../core/utils.js';
import { RecipeScaler } from '../modules/scaler.js';

export class RecipePage {
  static currentRecipe = null;
  static scalerInstance = null;
  static completedSteps = new Set();
  static activeTimers = new Map(); // stepNumber -> { intervalId, remainingSeconds, totalSeconds, isRunning }
  static isInitialized = false;
  static lastDocument = null;

  static savedRecipeIds = new Set();
  static likedRecipeIds = new Set();
  static followingChefIds = new Set();
  static completedStepsMap = new Map(); // recipeId -> Set<number>
  static commentsByRecipeId = new Map();

  /**
   * Reset in-memory recipe page state (for test isolation)
   */
  static reset() {
    this.savedRecipeIds = new Set();
    this.likedRecipeIds = new Set();
    this.followingChefIds = new Set();
    this.completedStepsMap = new Map();
    this.commentsByRecipeId = new Map();
    this.completedSteps = new Set();
    this.currentRecipe = null;
    this.scalerInstance = null;
    this.activeTimers = new Map();
    this.isInitialized = false;
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
   * Get list of completed step numbers for a recipe from in-memory map
   * @param {string} recipeId 
   * @returns {number[]}
   */
  static getCompletedSteps(recipeId) {
    if (!recipeId) return [];
    const set = this.completedStepsMap.get(recipeId);
    return set ? Array.from(set) : [];
  }

  /**
   * Save completed step numbers to in-memory map
   * @param {string} recipeId 
   * @param {number[]} steps 
   */
  static saveCompletedSteps(recipeId, steps) {
    if (!recipeId) return;
    this.completedStepsMap.set(recipeId, new Set(steps || []));
  }

  /**
   * Load recipe by ID or query param, falling back to default recipe
   * @param {string} [recipeId] 
   * @returns {Object}
   */
  static loadRecipe(recipeId) {
    if (!recipeId && typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      recipeId = params.get('id');
    }

    let recipe = null;
    if (recipeId && Array.isArray(RECIPE_FIXTURES)) {
      recipe = RECIPE_FIXTURES.find(r => r.id === recipeId);
    }

    if (!recipe && Array.isArray(RECIPE_FIXTURES) && RECIPE_FIXTURES.length > 0) {
      recipe = RECIPE_FIXTURES[0];
    }

    return recipe;
  }

  static getComments() {
    const recipeId = this.currentRecipe?.id;
    if (!recipeId) return [];
    if (!this.commentsByRecipeId.has(recipeId)) {
      this.commentsByRecipeId.set(recipeId, Array.isArray(this.currentRecipe.comments) ? [...this.currentRecipe.comments] : []);
    }
    return this.commentsByRecipeId.get(recipeId);
  }

  static renderCommentCards(comments) {
    const lang = I18n.getLang();
    return comments.map(comment => {
      const author = lang === 'ar'
        ? (comment.author_name_ar || comment.author_ar || comment.author || 'عضو معيار')
        : (comment.author_name_en || comment.author_en || comment.author || 'Meyar member');
      const timestamp = comment.created_at || comment.timestamp || (lang === 'ar' ? 'الآن' : 'Just now');
      const avatar = comment.author_avatar || USER_FIXTURES.avatar;
      return `
        <article class="comment-card flex items-start gap-3 p-4 rounded-2xl bg-surface-2 border border-border-subtle">
          <img src="${escapeHtml(avatar)}" alt="${escapeHtml(author)}" class="w-9 h-9 rounded-xl object-cover border border-border-subtle shrink-0">
          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs sm:text-sm font-bold text-text-main truncate">${escapeHtml(author)}</span>
              <time class="text-[10px] text-text-muted shrink-0">${escapeHtml(timestamp)}</time>
            </div>
            <p class="text-xs sm:text-sm text-text-muted leading-relaxed break-words [overflow-wrap:anywhere]">${escapeHtml(comment.content || '')}</p>
            <button type="button" data-action="reply-comment" data-comment-form-target="recipe-comment-form" class="text-[11px] font-semibold text-brand-gold hover:text-brand-gold-hover focus:outline-none focus:ring-2 focus:ring-brand-gold rounded">
              <span data-i18n="reply">${I18n.t('reply')}</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  static renderComments() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const list = document.getElementById('recipe-comments-list');
    if (!list) return;

    const comments = this.getComments();
    list.innerHTML = comments.length
      ? this.renderCommentCards(comments)
      : `<p class="text-xs text-text-muted text-center py-4" data-i18n="no_comments_yet">${I18n.t('no_comments_yet')}</p>`;

    const countEl = document.getElementById('recipe-comments-count');
    if (countEl) countEl.textContent = comments.length.toLocaleString();

    const avatarEl = document.getElementById('recipe-comment-author-avatar');
    if (avatarEl) {
      avatarEl.src = USER_FIXTURES.avatar;
      avatarEl.alt = I18n.getLang() === 'ar' ? USER_FIXTURES.name_ar : USER_FIXTURES.name_en;
    }
    const authorEl = document.getElementById('recipe-comment-author');
    if (authorEl) authorEl.textContent = I18n.getLang() === 'ar' ? USER_FIXTURES.name_ar : USER_FIXTURES.name_en;
  }

  static submitComment() {
    if (!this.currentRecipe || typeof document === 'undefined') return;
    const input = document.getElementById('recipe-comment-input');
    const content = input?.value.trim();
    const lang = I18n.getLang();
    if (!input || !content) {
      Toast.error(lang === 'ar' ? 'يرجى كتابة تعليق' : 'Please write a comment');
      input?.focus();
      return;
    }

    this.getComments().push({
      id: `comment-${Date.now()}`,
      author_id: USER_FIXTURES.id,
      author_name_ar: USER_FIXTURES.name_ar,
      author_name_en: USER_FIXTURES.name_en,
      author_avatar: USER_FIXTURES.avatar,
      created_at: lang === 'ar' ? 'الآن' : 'Just now',
      content
    });
    input.value = '';
    this.renderComments();
  }

  /**
   * Toggle save / bookmark status of a recipe
   * @param {string} recipeId 
   * @returns {boolean}
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

    this.updateActionStates();
    return !isSaved;
  }

  /**
   * Toggle liked status of a recipe
   * @param {string} recipeId 
   * @returns {boolean}
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
      Toast.success(lang === 'ar' ? 'أعجبك هذا الطبق الفاخر!' : 'Liked this gourmet dish!');
    }

    this.updateActionStates();
    return !isLiked;
  }

  /**
   * Toggle following a chef
   * @param {string} chefId 
   * @returns {boolean}
   */
  static toggleFollowChef(chefId) {
    if (!chefId || isCurrentUserId(chefId, USER_FIXTURES)) return false;
    const isFollowing = this.followingChefIds.has(chefId);
    const lang = I18n.getLang();

    if (isFollowing) {
      this.followingChefIds.delete(chefId);
      Toast.info(lang === 'ar' ? 'تم إلغاء متابعة الشيف' : 'Unfollowed chef');
    } else {
      this.followingChefIds.add(chefId);
      Toast.success(lang === 'ar' ? 'أصبحت تتابع هذا الشيف!' : 'Now following chef!');
    }

    this.updateActionStates();
    return !isFollowing;
  }

  /**
   * Toggle completion state for a single recipe step
   * @param {number} stepNumber 
   */
  static toggleStep(stepNumber) {
    if (!this.currentRecipe) return;
    const num = Number(stepNumber);
    if (isNaN(num)) return;

    if (this.completedSteps.has(num)) {
      this.completedSteps.delete(num);
    } else {
      this.completedSteps.add(num);
    }

    this.saveCompletedSteps(this.currentRecipe.id, Array.from(this.completedSteps));
    this.updateStepUI(num);
    this.updateProgressUI();

    const totalSteps = Array.isArray(this.currentRecipe.steps) ? this.currentRecipe.steps.length : 0;
    if (totalSteps > 0 && this.completedSteps.size === totalSteps) {
      Toast.success(I18n.t('recipe.step_completed_all'));
    }
  }

  /**
   * Reset all step progress for the current recipe
   */
  static resetSteps() {
    if (!this.currentRecipe) return;
    this.completedSteps.clear();
    this.saveCompletedSteps(this.currentRecipe.id, []);

    // Clear and reset any active timers
    this.activeTimers.forEach((timerData, stepNum) => {
      if (timerData.intervalId) clearInterval(timerData.intervalId);
      timerData.isRunning = false;
      timerData.remainingSeconds = timerData.totalSeconds;
    });

    this.renderSteps();
    this.updateProgressUI();

    const lang = I18n.getLang();
    Toast.info(lang === 'ar' ? 'تمت إعادة ضبط خطوات الطهي' : 'Cooking steps progress reset');
  }

  /**
   * Format seconds to MM:SS display string
   * @param {number} seconds 
   * @returns {string}
   */
  static formatTimerSeconds(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Toggle start/pause for a step timer
   * @param {number} stepNumber 
   * @param {number} totalMinutes 
   */
  static toggleStepTimer(stepNumber, totalMinutes) {
    const num = Number(stepNumber);
    let timer = this.activeTimers.get(num);

    if (!timer) {
      const totalSec = Math.max(1, (Number(totalMinutes) || 1) * 60);
      timer = {
        intervalId: null,
        totalSeconds: totalSec,
        remainingSeconds: totalSec,
        isRunning: false
      };
      this.activeTimers.set(num, timer);
    }

    if (timer.isRunning) {
      // Pause
      if (timer.intervalId) clearInterval(timer.intervalId);
      timer.intervalId = null;
      timer.isRunning = false;
      this.updateTimerDisplay(num);
    } else {
      // Start or Resume
      if (timer.remainingSeconds <= 0) {
        timer.remainingSeconds = timer.totalSeconds;
      }
      timer.isRunning = true;
      timer.intervalId = setInterval(() => {
        timer.remainingSeconds -= 1;
        this.updateTimerDisplay(num);

        if (timer.remainingSeconds <= 0) {
          clearInterval(timer.intervalId);
          timer.intervalId = null;
          timer.isRunning = false;
          this.updateTimerDisplay(num);
          Toast.success(I18n.t('recipe.timer_done'));
        }
      }, 1000);

      this.updateTimerDisplay(num);
    }
  }

  /**
   * Reset a step timer back to initial duration
   * @param {number} stepNumber 
   * @param {number} totalMinutes 
   */
  static resetStepTimer(stepNumber, totalMinutes) {
    const num = Number(stepNumber);
    const totalSec = Math.max(1, (Number(totalMinutes) || 1) * 60);
    let timer = this.activeTimers.get(num);

    if (timer && timer.intervalId) {
      clearInterval(timer.intervalId);
    }

    this.activeTimers.set(num, {
      intervalId: null,
      totalSeconds: totalSec,
      remainingSeconds: totalSec,
      isRunning: false
    });

    this.updateTimerDisplay(num);
  }

  /**
   * Update visual display of a timer
   * @param {number} stepNumber 
   */
  static updateTimerDisplay(stepNumber) {
    if (typeof document === 'undefined') return;
    const num = Number(stepNumber);
    const timer = this.activeTimers.get(num);
    if (!timer) return;

    const display = document.getElementById(`timer-display-${num}`);
    const toggleBtn = document.getElementById(`timer-btn-toggle-${num}`);
    const toggleText = toggleBtn ? toggleBtn.querySelector('.timer-btn-text') : null;
    const container = document.getElementById(`step-timer-box-${num}`);

    if (display) {
      display.textContent = this.formatTimerSeconds(timer.remainingSeconds);
    }

    if (toggleBtn && toggleText) {
      const lang = I18n.getLang();
      if (timer.isRunning) {
        toggleText.textContent = I18n.t('recipe.timer_pause');
        toggleBtn.classList.add('bg-brand-gold', 'text-white');
        toggleBtn.classList.remove('bg-surface-1');
      } else {
        toggleText.textContent = timer.remainingSeconds < timer.totalSeconds && timer.remainingSeconds > 0
          ? (lang === 'ar' ? 'استئناف' : 'Resume')
          : I18n.t('recipe.timer_start');
        toggleBtn.classList.remove('bg-brand-gold', 'text-white');
        toggleBtn.classList.add('bg-surface-1');
      }
    }

    if (container) {
      if (timer.isRunning) {
        container.classList.add('border-brand-gold', 'bg-surface-2');
      } else {
        container.classList.remove('border-brand-gold', 'bg-surface-2');
      }
    }
  }

  /**
   * Copy scaled ingredients text list to user clipboard
   */
  static async copyIngredients() {
    if (!this.scalerInstance) return;
    const scaled = this.scalerInstance.getScaledIngredients();
    const lang = I18n.getLang();
    const title = lang === 'ar' ? this.currentRecipe.title_ar : this.currentRecipe.title_en;
    const servings = this.scalerInstance.currentServings;

    const lines = [
      `${title} (${servings} ${I18n.t('recipe.servings')}):`,
      '----------------------------------------'
    ];

    scaled.forEach(item => {
      const noteStr = item.notes ? ` (${item.notes})` : '';
      const unitStr = item.unit ? ` ${item.unit}` : '';
      lines.push(`• ${item.name}: ${item.formattedAmount}${unitStr}${noteStr}`);
    });

    const text = lines.join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      Toast.success(I18n.t('recipe.ingredients_copied'));
    } catch (e) {
      console.warn('Clipboard write failed, showing toast', e);
      Toast.success(I18n.t('recipe.ingredients_copied'));
    }
  }

  /**
   * Copy recipe share link to clipboard
   */
  static async copyShareLink() {
    if (typeof window === 'undefined') return;
    const shareUrl = window.location.href;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      Toast.success(I18n.t('recipe.link_copied'));
    } catch (e) {
      console.warn('Clipboard write failed', e);
      Toast.success(I18n.t('recipe.link_copied'));
    }
  }

  /**
   * Print current recipe page
   */
  static printRecipe() {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }

  /**
   * Render recipe header metadata, badges, and quick stats
   */
  static renderMetadata() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const r = this.currentRecipe;
    const lang = I18n.getLang();

    // Document Title
    const pageTitle = lang === 'ar' ? `${r.title_ar} - معيار | Meyar` : `${r.title_en} - Meyar`;
    document.title = pageTitle;

    // Breadcrumb
    const breadcrumb = document.getElementById('recipe-breadcrumb-title');
    if (breadcrumb) breadcrumb.textContent = lang === 'ar' ? r.title_ar : r.title_en;

    // Main Title & Description
    const titleEl = document.getElementById('recipe-title');
    if (titleEl) titleEl.textContent = lang === 'ar' ? r.title_ar : r.title_en;

    const descEl = document.getElementById('recipe-description');
    if (descEl) descEl.textContent = lang === 'ar' ? r.description_ar : r.description_en;

    // Badges
    const cuisineEl = document.getElementById('recipe-badge-cuisine');
    if (cuisineEl) cuisineEl.textContent = lang === 'ar' ? (r.cuisine_ar || r.cuisine) : (r.cuisine_en || r.cuisine);

    const categoryEl = document.getElementById('recipe-badge-category');
    if (categoryEl) categoryEl.textContent = lang === 'ar' ? (r.category_ar || r.category) : (r.category_en || r.category);

    const diffEl = document.getElementById('recipe-badge-difficulty');
    if (diffEl) diffEl.textContent = lang === 'ar' ? (r.difficulty_ar || r.difficulty) : (r.difficulty_en || r.difficulty);

    const ratingEl = document.getElementById('recipe-rating');
    if (ratingEl) ratingEl.textContent = Number(r.rating || 4.9).toFixed(2);

    const reviewsEl = document.getElementById('recipe-reviews-count');
    if (reviewsEl) reviewsEl.textContent = (r.reviews_count || 100).toString();

    // Stats
    const prepEl = document.getElementById('recipe-prep-time');
    if (prepEl) prepEl.textContent = (r.prep_time || 30).toString();

    const cookEl = document.getElementById('recipe-cook-time');
    if (cookEl) cookEl.textContent = (r.cook_time || 45).toString();

    const totalEl = document.getElementById('recipe-total-time');
    if (totalEl) totalEl.textContent = (r.total_time || (r.prep_time || 30) + (r.cook_time || 45)).toString();

    const caloriesEl = document.getElementById('recipe-calories');
    if (caloriesEl) caloriesEl.textContent = (r.calories || 600).toString();
  }

  /**
   * Render hero media card and thumbnail gallery
   */
  static renderGallery() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const r = this.currentRecipe;

    const heroImg = document.getElementById('recipe-hero-image');
    if (heroImg && r.image) {
      heroImg.src = r.image;
      heroImg.alt = r.title_en || r.title || 'Recipe cover';
    }

    const thumbnailsContainer = document.getElementById('recipe-gallery-thumbnails');
    if (thumbnailsContainer) {
      const images = [r.image, ...(Array.isArray(r.gallery) ? r.gallery : [])].filter(Boolean);
      // Deduplicate images
      const uniqueImages = Array.from(new Set(images));

      if (uniqueImages.length <= 1) {
        thumbnailsContainer.classList.add('hidden');
      } else {
        thumbnailsContainer.classList.remove('hidden');
        let thumbHtml = '';
        uniqueImages.forEach((imgUrl, idx) => {
          const isActive = idx === 0;
          thumbHtml += `
            <button type="button" class="w-16 h-16 rounded-xl overflow-hidden border-2 ${isActive ? 'border-brand-gold' : 'border-border-subtle opacity-70 hover:opacity-100'} shrink-0 transition-all focus:outline-none" data-gallery-thumb="${imgUrl}">
              <img src="${imgUrl}" alt="Gallery preview ${idx + 1}" class="w-full h-full object-cover">
            </button>
          `;
        });
        thumbnailsContainer.innerHTML = thumbHtml;

        thumbnailsContainer.querySelectorAll('[data-gallery-thumb]').forEach(btn => {
          btn.addEventListener('click', () => {
            const targetUrl = btn.getAttribute('data-gallery-thumb');
            if (heroImg && targetUrl) {
              heroImg.src = targetUrl;
            }
            thumbnailsContainer.querySelectorAll('[data-gallery-thumb]').forEach(b => {
              b.classList.remove('border-brand-gold');
              b.classList.add('border-border-subtle', 'opacity-70');
            });
            btn.classList.add('border-brand-gold');
            btn.classList.remove('border-border-subtle', 'opacity-70');
          });
        });
      }
    }
  }

  /**
   * Render chef author spotlight card
   */
  static renderChefCard() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const r = this.currentRecipe;
    const lang = I18n.getLang();

    // Look up detailed chef record if available
    const chef = Array.isArray(CHEF_FIXTURES) ? CHEF_FIXTURES.find(c => c.id === r.author_id) : null;

    const avatarEl = document.getElementById('recipe-chef-avatar');
    if (avatarEl) {
      avatarEl.src = r.author_avatar || (chef ? chef.avatar : 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80');
      avatarEl.alt = lang === 'ar' ? (r.author_name_ar || 'الشيف') : (r.author_name_en || 'Chef');
    }

    const nameEl = document.getElementById('recipe-chef-name');
    if (nameEl) {
      nameEl.textContent = lang === 'ar' ? (r.author_name_ar || (chef ? chef.name_ar : '')) : (r.author_name_en || (chef ? chef.name_en : ''));
    }

    const handleEl = document.getElementById('recipe-chef-handle');
    if (handleEl && chef) {
      handleEl.textContent = chef.handle || '@chef';
    }

    const titleEl = document.getElementById('recipe-chef-title');
    if (titleEl) {
      if (chef) {
        titleEl.textContent = lang === 'ar' ? (chef.title_ar || chef.title) : (chef.title_en || chef.title);
      } else {
        titleEl.textContent = lang === 'ar' ? 'شيف محترف معتمد' : 'Certified Executive Chef';
      }
    }

    const linkEl = document.getElementById('recipe-chef-link');
    if (linkEl && r.author_id) {
      linkEl.href = `chef.html?id=${r.author_id}`;
    }

    const followBtn = document.getElementById('btn-follow-chef');
    if (followBtn && r.author_id) {
      followBtn.setAttribute('data-chef-id', r.author_id);
      if (isCurrentUserId(r.author_id, USER_FIXTURES)) {
        followBtn.classList.add('hidden');
      } else {
        followBtn.classList.remove('hidden');
      }
    }
  }

  /**
   * Render culinary pairings (beverage and side dish)
   */
  static renderPairings() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const r = this.currentRecipe;
    const lang = I18n.getLang();
    const p = r.pairings || {};

    const drinkEl = document.getElementById('pairing-drink');
    if (drinkEl) {
      drinkEl.textContent = lang === 'ar' ? (p.drink_ar || 'مشروب منعش مبرد') : (p.drink_en || 'Refreshing chilled beverage');
    }

    const sideEl = document.getElementById('pairing-side');
    if (sideEl) {
      sideEl.textContent = lang === 'ar' ? (p.side_ar || 'مقبلات موسمية') : (p.side_en || 'Seasonal artisanal side');
    }

    const notesEl = document.getElementById('pairing-notes');
    if (notesEl) {
      notesEl.textContent = lang === 'ar' ? (p.notes_ar || 'تناغم رائع بين النكهات والتوابل.') : (p.notes_en || 'Harmonious balance of complementary terroir and flavors.');
    }
  }

  /**
   * Render nutritional breakdown facts
   */
  static renderNutritionFacts() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const n = this.currentRecipe.nutrition || {};

    const calEl = document.getElementById('nutr-calories');
    if (calEl) calEl.textContent = (n.calories || this.currentRecipe.calories || 600).toString();

    const protEl = document.getElementById('nutr-protein');
    if (protEl) protEl.textContent = (n.protein || '45g').toString();

    const carbEl = document.getElementById('nutr-carbs');
    if (carbEl) carbEl.textContent = (n.carbs || '20g').toString();

    const fatEl = document.getElementById('nutr-fats');
    if (fatEl) fatEl.textContent = (n.fats || '35g').toString();

    const fibEl = document.getElementById('nutr-fiber');
    if (fibEl) fibEl.textContent = (n.fiber || '3g').toString();

    const sodEl = document.getElementById('nutr-sodium');
    if (sodEl) sodEl.textContent = (n.sodium || '500mg').toString();
  }

  /**
   * Render chef mastery notes
   */
  static renderChefNotes() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const r = this.currentRecipe;
    const lang = I18n.getLang();
    const container = document.getElementById('recipe-chef-notes-body');
    if (!container) return;

    // Collect tips from steps if dedicated notes not present
    const tips = [];
    if (Array.isArray(r.steps)) {
      r.steps.forEach(s => {
        const tip = lang === 'ar' ? s.tip_ar : s.tip_en;
        if (tip) tips.push(tip);
      });
    }

    if (tips.length > 0) {
      container.innerHTML = tips.map(t => `<p class="flex items-start gap-2"><span class="text-brand-gold font-bold shrink-0">•</span><span>${t}</span></p>`).join('');
    } else {
      const defaultNote = lang === 'ar'
        ? 'احرص دائماً على استخدام مكونات طازجة عالية الجودة وضبط درجات الحرارة بدقة للحصول على قوام ونكهة مثالية.'
        : 'Always ensure high-quality fresh ingredients and precise temperature management for ideal taste and texture.';
      container.innerHTML = `<p>${defaultNote}</p>`;
    }
  }

  /**
   * Render interactive cooking mode steps list
   */
  static renderSteps() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const r = this.currentRecipe;
    const lang = I18n.getLang();
    const container = document.getElementById('recipe-steps-container');
    if (!container) return;

    const steps = Array.isArray(r.steps) ? r.steps : [];
    if (steps.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-text-muted text-sm">${lang === 'ar' ? 'لا توجد خطوات مسجلة' : 'No steps recorded'}</div>`;
      return;
    }

    let html = '';
    steps.forEach(step => {
      const stepNum = step.step_number;
      const isDone = this.completedSteps.has(stepNum);
      const title = lang === 'ar' ? (step.title_ar || `الخطوة ${stepNum}`) : (step.title_en || `Step ${stepNum}`);
      const instruction = lang === 'ar' ? (step.instruction_ar || '') : (step.instruction_en || '');
      const tip = lang === 'ar' ? (step.tip_ar || '') : (step.tip_en || '');
      const timerMins = step.timer_minutes || 0;

      // Timer state
      const timer = this.activeTimers.get(stepNum);
      const remainingSecs = timer ? timer.remainingSeconds : timerMins * 60;
      const isRunning = timer ? timer.isRunning : false;
      const timerFormatted = this.formatTimerSeconds(remainingSecs);

      html += `
        <div id="step-card-${stepNum}" class="p-4 sm:p-5 rounded-2xl border ${isDone ? 'border-border-subtle bg-surface-2' : 'border-border-subtle bg-surface-2'} transition-all space-y-3.5" data-step-card="${stepNum}">
          <!-- Step Header -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${isDone ? 'bg-brand-emerald text-white' : 'bg-surface-1 border border-border-subtle text-brand-gold'} flex items-center justify-center font-bold text-xs sm:text-sm font-mono shrink-0 transition-colors">
                ${isDone ? '✓' : stepNum.toString().padStart(2, '0')}
              </span>
              <h3 class="font-bold text-sm sm:text-base text-text-main ${isDone ? 'line-through text-text-muted' : ''}">${title}</h3>
            </div>

            <!-- Step Completion Toggle Button -->
            <button type="button" data-action="toggle-step-done" data-step-index="${stepNum}"
                    class="px-3 py-1.5 rounded-xl border ${isDone ? 'bg-brand-emerald text-white border-brand-emerald' : 'bg-surface-1 text-text-muted hover:text-text-main border-border-subtle'} text-xs font-semibold flex items-center gap-1.5 transition-colors focus:outline-none"
                    aria-label="Toggle step ${stepNum} completion">
              <span>${isDone ? (lang === 'ar' ? 'مكتملة ✓' : 'Done ✓') : (lang === 'ar' ? 'إتمام' : 'Mark Done')}</span>
            </button>
          </div>

          <!-- Step Instruction -->
          <p class="text-xs sm:text-sm text-text-muted leading-relaxed ${isDone ? 'opacity-70' : ''}">
            ${instruction}
          </p>

          <!-- Step Interactive Timer (if duration exists) -->
          ${timerMins > 0 ? `
            <div id="step-timer-box-${stepNum}" class="p-3 rounded-xl bg-surface-1 border ${isRunning ? 'border-brand-gold bg-surface-2' : 'border-border-subtle'} flex flex-wrap items-center justify-between gap-3 transition-colors">
              <div class="flex items-center gap-2.5">
                <svg class="w-4 h-4 text-brand-gold shrink-0 ${isRunning ? 'animate-spin' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span class="text-xs font-semibold text-text-muted">${lang === 'ar' ? 'مؤقت الخطوة:' : 'Step Timer:'}</span>
                <span id="timer-display-${stepNum}" class="font-mono font-black text-sm sm:text-base text-brand-gold">${timerFormatted}</span>
              </div>

              <div class="flex items-center gap-1.5">
                <button type="button" id="timer-btn-toggle-${stepNum}" data-timer-action="toggle" data-step-index="${stepNum}" data-timer-minutes="${timerMins}"
                        class="px-3 py-1 text-xs font-bold rounded-lg border border-border-subtle ${isRunning ? 'bg-brand-gold text-white' : 'bg-surface-1 hover:bg-surface-2 text-text-main'} transition-colors focus:outline-none">
                  <span class="timer-btn-text">${isRunning ? I18n.t('recipe.timer_pause') : I18n.t('recipe.timer_start')}</span>
                </button>
                <button type="button" data-timer-action="reset" data-step-index="${stepNum}" data-timer-minutes="${timerMins}"
                        class="p-1 rounded-lg text-text-muted hover:text-brand-gold bg-surface-1 border border-border-subtle transition-colors focus:outline-none" title="${I18n.t('recipe.timer_reset')}">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Chef Pro Secret Tip Box -->
          ${tip ? `
            <div class="p-3 rounded-xl bg-surface-2 border border-brand-gold flex items-start gap-2.5 text-xs text-text-muted leading-relaxed">
              <svg class="w-4 h-4 text-brand-gold shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <div>
                <span class="font-bold text-brand-gold block mb-0.5">${I18n.t('recipe.chef_tip')}</span>
                <span>${tip}</span>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Update UI for a single step after completion toggle
   * @param {number} stepNumber 
   */
  static updateStepUI(stepNumber) {
    if (typeof document === 'undefined') return;
    const card = document.getElementById(`step-card-${stepNumber}`);
    if (!card) {
      this.renderSteps();
      return;
    }

    const isDone = this.completedSteps.has(stepNumber);
    const lang = I18n.getLang();

    if (isDone) {
      card.classList.add('border-border-subtle', 'bg-surface-2');
      card.classList.remove('border-border-subtle', 'bg-surface-2');
    } else {
      card.classList.remove('border-border-subtle', 'bg-surface-2');
      card.classList.add('border-border-subtle', 'bg-surface-2');
    }

    const btn = card.querySelector('[data-action="toggle-step-done"]');
    if (btn) {
      if (isDone) {
        btn.classList.add('bg-brand-emerald', 'text-white', 'border-brand-emerald');
        btn.classList.remove('bg-surface-1', 'text-text-muted', 'border-border-subtle');
        btn.innerHTML = `<span>${lang === 'ar' ? 'مكتملة ✓' : 'Done ✓'}</span>`;
      } else {
        btn.classList.remove('bg-brand-emerald', 'text-white', 'border-brand-emerald');
        btn.classList.add('bg-surface-1', 'text-text-muted', 'border-border-subtle');
        btn.innerHTML = `<span>${lang === 'ar' ? 'إتمام' : 'Mark Done'}</span>`;
      }
    }
  }

  /**
   * Update cooking progress bar and percentage display
   */
  static updateProgressUI() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const totalSteps = Array.isArray(this.currentRecipe.steps) ? this.currentRecipe.steps.length : 0;
    const completedCount = this.completedSteps.size;
    const percent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

    const bar = document.getElementById('cooking-progress-bar');
    if (bar) {
      bar.style.width = `${percent}%`;
    }

    const progressContainer = document.querySelector('[role="progressbar"]');
    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', percent.toString());
    }

    const textEl = document.getElementById('cooking-progress-text');
    if (textEl) {
      textEl.textContent = I18n.t('recipe.steps_progress', {
        completed: completedCount,
        total: totalSteps,
        percent: percent
      });
    }
  }

  /**
   * Render related gourmet recipes cards
   */
  static renderRelatedRecipes() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const container = document.getElementById('related-recipes-container');
    if (!container) return;

    const allRecipes = Array.isArray(RECIPE_FIXTURES) ? RECIPE_FIXTURES : [];
    // Exclude current recipe and pick 3 related
    const related = allRecipes.filter(r => r.id !== this.currentRecipe.id).slice(0, 3);
    const lang = I18n.getLang();
    const savedIds = new Set(this.getSavedRecipeIds());

    let html = '';
    related.forEach(r => {
      const isSaved = savedIds.has(r.id);
      const title = lang === 'ar' ? r.title_ar : r.title_en;
      const cuisine = lang === 'ar' ? (r.cuisine_ar || r.cuisine) : (r.cuisine_en || r.cuisine);
      const chefName = lang === 'ar' ? r.author_name_ar : r.author_name_en;

      html += `
        <article class="group rounded-3xl bg-surface-1 border border-border-subtle overflow-hidden shadow-sm hover:shadow-md hover:border-border-subtle transition-all flex flex-col justify-between">
          <div class="relative aspect-16/10 overflow-hidden bg-surface-2">
            <img src="${r.image}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            <span class="absolute top-3 start-3 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-surface-1 text-brand-gold border border-border-subtle uppercase">${cuisine}</span>
            <button type="button" data-action="save-recipe" data-recipe-id="${r.id}"
                    class="absolute top-3 end-3 p-2 rounded-xl bg-surface-1 text-text-muted hover:text-brand-gold border border-border-subtle transition-colors focus:outline-none"
                    aria-label="Bookmark ${title}">
              <svg class="w-4 h-4 ${isSaved ? 'text-brand-gold fill-current' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            </button>
          </div>

          <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 text-start">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-xs text-text-muted">
                <span>${chefName}</span>
                <span>•</span>
                <span>${r.cook_time || 30} ${lang === 'ar' ? 'دقيقة' : 'mins'}</span>
              </div>
              <h3 class="font-bold text-sm sm:text-base text-text-main line-clamp-2 group-hover:text-brand-gold transition-colors">
                <a href="recipe.html?id=${r.id}">${title}</a>
              </h3>
            </div>

            <div class="pt-3 border-t border-border-subtle flex items-center justify-between">
              <div class="flex items-center gap-1 text-xs font-bold text-text-main">
                <svg class="w-3.5 h-3.5 text-brand-gold fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${r.rating || 4.9}</span>
              </div>
              <a href="recipe.html?id=${r.id}" class="text-xs font-bold text-brand-gold hover:text-brand-gold-hover flex items-center gap-1">
                <span>${lang === 'ar' ? 'عرض الوصفة' : 'View Recipe'}</span>
                <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </a>
            </div>
          </div>
        </article>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Update all action buttons (Save, Like, Follow) active states
   */
  static updateActionStates() {
    if (typeof document === 'undefined' || !this.currentRecipe) return;
    const r = this.currentRecipe;
    const savedIds = new Set(this.getSavedRecipeIds());
    const likedIds = new Set(this.getLikedRecipeIds());
    const followingIds = new Set(this.getFollowingChefIds());

    // Save button
    const isSaved = savedIds.has(r.id);
    const saveBtn = document.getElementById('btn-save-recipe');
    if (saveBtn) {
      const icon = saveBtn.querySelector('.bookmark-icon');
      const label = saveBtn.querySelector('.save-label');
      if (isSaved) {
        saveBtn.classList.add('text-brand-gold', 'bg-surface-2');
        saveBtn.classList.remove('text-text-muted', 'bg-surface-1');
        if (icon) icon.classList.add('fill-current');
        if (label) label.textContent = I18n.getLang() === 'ar' ? 'محفوظة' : 'Saved';
      } else {
        saveBtn.classList.remove('text-brand-gold', 'bg-surface-2');
        saveBtn.classList.add('text-text-muted', 'bg-surface-1');
        if (icon) icon.classList.remove('fill-current');
        if (label) label.textContent = I18n.t('btn.save');
      }
    }

    // Like button
    const isLiked = likedIds.has(r.id);
    const likeBtn = document.getElementById('btn-like-recipe');
    const likesCountEl = document.getElementById('recipe-likes-count');
    if (likeBtn) {
      const icon = likeBtn.querySelector('.heart-icon');
      const baseLikes = Number(r.likes_count) || 1400;
      if (isLiked) {
        likeBtn.classList.add('text-red-500', 'bg-surface-2');
        likeBtn.classList.remove('text-text-muted', 'bg-surface-1');
        if (icon) icon.classList.add('fill-current');
        if (likesCountEl) likesCountEl.textContent = (baseLikes + 1).toString();
      } else {
        likeBtn.classList.remove('text-red-500', 'bg-surface-2');
        likeBtn.classList.add('text-text-muted', 'bg-surface-1');
        if (icon) icon.classList.remove('fill-current');
        if (likesCountEl) likesCountEl.textContent = baseLikes.toString();
      }
    }

    // Follow button
    const isFollowing = followingIds.has(r.author_id);
    const followBtn = document.getElementById('btn-follow-chef');
    if (followBtn) {
      const isSelf = isCurrentUserId(r.author_id, USER_FIXTURES);
      if (isSelf) {
        followBtn.classList.add('hidden');
        this.followingChefIds.delete(r.author_id);
        return;
      }
      followBtn.classList.remove('hidden');
      const btnText = followBtn.querySelector('.btn-text');
      const lang = I18n.getLang();
      if (isFollowing) {
        followBtn.classList.add('bg-brand-gold', 'text-white');
        followBtn.classList.remove('bg-surface-2', 'text-text-main');
        if (btnText) btnText.textContent = lang === 'ar' ? 'تتابعه ✓' : 'Following ✓';
      } else {
        followBtn.classList.remove('bg-brand-gold', 'text-white');
        followBtn.classList.add('bg-surface-2', 'text-text-main');
        if (btnText) btnText.textContent = I18n.t('chef.follow');
      }
    }
  }

  /**
   * Bind all DOM event listeners
   */
  static bindEvents() {
    if (typeof document === 'undefined') return;

    // Delegated click handler on document
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target) return;

      // Comments section toggle
      const commentsToggle = target.closest('[data-action="toggle-recipe-comments"]');
      if (commentsToggle) {
        e.preventDefault();
        const panel = document.getElementById(commentsToggle.getAttribute('data-comments-target'));
        if (panel) {
          const isHidden = panel.classList.toggle('hidden');
          commentsToggle.setAttribute('aria-expanded', String(!isHidden));
        }
        return;
      }

      // Focus the recipe comment form from an existing comment
      const replyBtn = target.closest('[data-action="reply-comment"]');
      if (replyBtn) {
        e.preventDefault();
        const form = document.getElementById(replyBtn.getAttribute('data-comment-form-target'));
        form?.querySelector('textarea')?.focus();
        return;
      }

      // Add a local recipe comment
      const submitCommentBtn = target.closest('[data-action="submit-recipe-comment"]');
      if (submitCommentBtn) {
        e.preventDefault();
        this.submitComment();
        return;
      }

      // 1. Scaler Stepper Actions
      const decBtn = target.closest('[data-action="decrement-servings"]');
      if (decBtn && this.scalerInstance) {
        e.preventDefault();
        this.scalerInstance.decrement();
        return;
      }

      const incBtn = target.closest('[data-action="increment-servings"]');
      if (incBtn && this.scalerInstance) {
        e.preventDefault();
        this.scalerInstance.increment();
        return;
      }

      const resetScalerBtn = target.closest('[data-action="reset-servings"]');
      if (resetScalerBtn && this.scalerInstance) {
        e.preventDefault();
        this.scalerInstance.reset();
        return;
      }

      // 2. Step Completion Toggle
      const stepDoneBtn = target.closest('[data-action="toggle-step-done"]');
      if (stepDoneBtn) {
        e.preventDefault();
        const stepNum = stepDoneBtn.getAttribute('data-step-index');
        this.toggleStep(stepNum);
        return;
      }

      // 3. Reset Cooking Progress
      const resetCookingBtn = target.closest('[data-action="reset-cooking-progress"]');
      if (resetCookingBtn) {
        e.preventDefault();
        this.resetSteps();
        return;
      }

      // 4. Timer Start/Pause Toggle
      const timerToggleBtn = target.closest('[data-timer-action="toggle"]');
      if (timerToggleBtn) {
        e.preventDefault();
        const stepIndex = timerToggleBtn.getAttribute('data-step-index');
        const mins = timerToggleBtn.getAttribute('data-timer-minutes');
        this.toggleStepTimer(stepIndex, mins);
        return;
      }

      // 5. Timer Reset
      const timerResetBtn = target.closest('[data-timer-action="reset"]');
      if (timerResetBtn) {
        e.preventDefault();
        const stepIndex = timerResetBtn.getAttribute('data-step-index');
        const mins = timerResetBtn.getAttribute('data-timer-minutes');
        this.resetStepTimer(stepIndex, mins);
        return;
      }

      // 6. Bookmark / Save Recipe
      const saveBtn = target.closest('[data-action="save-recipe"]');
      if (saveBtn) {
        e.preventDefault();
        const recipeId = saveBtn.getAttribute('data-recipe-id') || (this.currentRecipe ? this.currentRecipe.id : null);
        this.toggleSave(recipeId);
        return;
      }

      // 7. Like Recipe
      const likeBtn = target.closest('[data-action="like-recipe"]');
      if (likeBtn) {
        e.preventDefault();
        const recipeId = likeBtn.getAttribute('data-recipe-id') || (this.currentRecipe ? this.currentRecipe.id : null);
        this.toggleLike(recipeId);
        return;
      }

      // 8. Follow Chef
      const followBtn = target.closest('[data-action="follow-chef"]');
      if (followBtn) {
        e.preventDefault();
        const chefId = followBtn.getAttribute('data-chef-id') || (this.currentRecipe ? this.currentRecipe.author_id : null);
        this.toggleFollowChef(chefId);
        return;
      }

      // 9. Copy Ingredients
      const copyIngBtn = target.closest('[data-action="copy-ingredients"]');
      if (copyIngBtn) {
        e.preventDefault();
        this.copyIngredients();
        return;
      }

      // 10. Share Recipe Modal Trigger
      const shareBtn = target.closest('[data-action="share-recipe"]');
      if (shareBtn) {
        e.preventDefault();
        const modal = document.getElementById('share-recipe-modal');
        if (modal) {
          modal.classList.remove('hidden');
          const input = document.getElementById('share-url-input');
          if (input && typeof window !== 'undefined') input.value = window.location.href;
        }
        return;
      }

      // 11. Copy Share URL Button
      const copyShareBtn = target.closest('[data-action="copy-share-url"]');
      if (copyShareBtn) {
        e.preventDefault();
        this.copyShareLink();
        return;
      }

      // 12. Modal Close
      const modalClose = target.closest('[data-modal-close]');
      if (modalClose) {
        const modalId = modalClose.getAttribute('data-modal-close');
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
        return;
      }

      // 13. Print Recipe
      const printBtn = target.closest('[data-action="print-recipe"]');
      if (printBtn) {
        e.preventDefault();
        this.printRecipe();
        return;
      }
    });

    // React to language change broadcast from i18n module
    window.addEventListener('meyar:lang-changed', () => {
      this.renderMetadata();
      this.renderChefCard();
      this.renderPairings();
      this.renderChefNotes();
      this.renderSteps();
      this.renderComments();
      this.renderRelatedRecipes();
      if (this.scalerInstance) {
        this.scalerInstance.render();
      }
      this.updateActionStates();
      this.updateProgressUI();
    });
  }

  /**
   * Main initializer for Recipe Page
   */
  static init(recipeId = null) {
    if (typeof document !== 'undefined' && this.lastDocument !== document) {
      this.isInitialized = false;
      this.lastDocument = document;
    }
    if (this.isInitialized) return;

    this.currentRecipe = this.loadRecipe(recipeId);
    if (!this.currentRecipe) return;

    // Load saved steps
    const savedSteps = this.getCompletedSteps(this.currentRecipe.id);
    this.completedSteps = new Set(savedSteps);

    // Initialize Recipe Scaler instance
    this.scalerInstance = new RecipeScaler({
      containerId: 'recipe-ingredients-list',
      baseServings: this.currentRecipe.base_servings || 4,
      ingredients: this.currentRecipe.ingredients || [],
      onChange: () => {
        // Can trigger live update if needed
      }
    });

    this.renderMetadata();
    this.renderGallery();
    this.renderChefCard();
    this.renderPairings();
    this.renderNutritionFacts();
    this.renderChefNotes();
    this.scalerInstance.render();
    this.renderSteps();
    this.renderComments();
    this.renderRelatedRecipes();
    this.updateActionStates();
    this.updateProgressUI();

    this.bindEvents();
    this.isInitialized = true;
  }
}
