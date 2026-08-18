/**
 * Meyar (معيار) Explore & Trends Page Controller
 * Provides dynamic multi-category filtering, real-time bilingual search,
 * sorting, trend spotlights, interactive bookmark/like/follow/enroll states,
 * and seamless Arabic/English language synchronization.
 */

import { COURSE_FIXTURES, CHEF_FIXTURES, RECIPE_FIXTURES, SUPPLY_FIXTURES, TREND_FIXTURES, USER_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Toast } from '../core/toast.js';
import { isCurrentUserId } from '../core/utils.js';
import { normalizeSearchQuery } from '../modules/search.js';

export class ExplorePage {
  static currentCategory = 'all';
  static searchQuery = '';
  static sortBy = 'popular';
  static isInitialized = false;
  static savedRecipeIds = new Set();
  static likedRecipeIds = new Set();
  static followingChefIds = new Set();
  static enrolledCourseIds = new Set();

  static reset() {
    this.savedRecipeIds = new Set();
    this.likedRecipeIds = new Set();
    this.followingChefIds = new Set();
    this.enrolledCourseIds = new Set();
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.sortBy = 'popular';
    this.isInitialized = false;
  }

  /**
   * Get list of saved recipe IDs from the current page session
   * @returns {string[]}
   */
  static getSavedRecipeIds() {
    return Array.from(this.savedRecipeIds);
  }

  /**
   * Get list of liked recipe IDs from the current page session
   * @returns {string[]}
   */
  static getLikedRecipeIds() {
    return Array.from(this.likedRecipeIds);
  }

  /**
   * Get list of followed chef IDs from the current page session
   * @returns {string[]}
   */
  static getFollowingChefIds() {
    return Array.from(this.followingChefIds);
  }

  /**
   * Get list of enrolled course IDs from the current page session
   * @returns {string[]}
   */
  static getEnrolledCourseIds() {
    return Array.from(this.enrolledCourseIds);
  }

  /**
   * Toggle save/bookmark status of a recipe
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

    this.updateCardActionStates();
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

    this.updateCardActionStates();
    return !isLiked;
  }

  /**
   * Toggle follow status of a chef
   * @param {string} chefId 
   * @returns {boolean}
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

    this.updateCardActionStates();
    return !isFollowing;
  }

  /**
   * Toggle course enrollment status
   * @param {string} courseId 
   * @returns {boolean}
   */
  static toggleEnroll(courseId) {
    if (!courseId) return false;
    const course = COURSE_FIXTURES.find(item => item.id === courseId);
    if (isCurrentUserId(course?.instructor_id, USER_FIXTURES)) return false;
    const isEnrolled = this.enrolledCourseIds.has(courseId);
    const lang = I18n.getLang();

    if (isEnrolled) {
      this.enrolledCourseIds.delete(courseId);
      Toast.info(lang === 'ar' ? 'تم إلغاء التسجيل في الدورة' : 'Cancelled workshop enrollment');
    } else {
      this.enrolledCourseIds.add(courseId);
      Toast.success(I18n.t('toast.course_enrolled'));
    }

    this.updateCardActionStates();
    return !isEnrolled;
  }

  /**
   * Trigger B2B RFQ Quotation Request
   * @param {string} supplyId 
   * @returns {boolean}
   */
  static requestRFQ(supplyId) {
    const item = SUPPLY_FIXTURES.find(s => s.id === supplyId);
    const lang = I18n.getLang();
    const name = item ? (lang === 'ar' ? item.title_ar : item.title_en) : '';
    Toast.success(lang === 'ar' ? `تم إرسال طلب عرض سعر لـ (${name}) بنجاح!` : `RFQ request sent for (${name})!`);
    return true;
  }

  /**
   * Share an explore item via clipboard
   * @param {string} type 
   * @param {string} id 
   * @param {string} [title] 
   */
  static shareItem(type, id, title = '') {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meyar.sa';
    let url = `${origin}/${type}.html?id=${id}`;
    if (type === 'recipe') url = `${origin}/recipe.html?id=${id}`;
    if (type === 'chef') url = `${origin}/chef.html?id=${id}`;
    if (type === 'supply') url = `${origin}/supplies.html?id=${id}`;
    if (type === 'course') url = `${origin}/courses.html?id=${id}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => Toast.success(I18n.t('toast.copied_success')))
        .catch(() => Toast.info(url));
    } else {
      Toast.success(I18n.t('toast.copied_success'));
    }
  }

  /**
   * Filter and sort platform items according to category, search query, and sort criteria
   * @param {string} [category] 
   * @param {string} [query] 
   * @param {string} [sortBy] 
   * @returns {Array<{type: 'recipe'|'chef'|'supply'|'course', item: any}>}
   */
  static filterItems(category = this.currentCategory, query = this.searchQuery, sortBy = this.sortBy) {
    let pool = [];

    const normQuery = normalizeSearchQuery(query);

    // 1. Gather by Category
    const includeRecipes = category === 'all' || category === 'recipes' || category === 'trending' || category === 'seasonal';
    const includeChefs = category === 'all' || category === 'chefs';
    const includeSupplies = category === 'all' || category === 'supplies' || category === 'gear' || category === 'seasonal';
    const includeCourses = category === 'all' || category === 'courses' || category === 'workshops';

    if (includeRecipes) {
      RECIPE_FIXTURES.forEach(r => {
        if (category === 'seasonal') {
          const isSeasonal = (r.tags && r.tags.some(t => /seasonal|truffle|saffron|date|sea/i.test(t))) ||
            /تمر|زعفران|كمأة|بحري|سمك/i.test(r.title_ar + r.description_ar);
          if (!isSeasonal) return;
        }
        pool.push({ type: 'recipe', item: r });
      });
    }

    if (includeChefs) {
      CHEF_FIXTURES.forEach(c => {
        pool.push({ type: 'chef', item: c });
      });
    }

    if (includeSupplies) {
      SUPPLY_FIXTURES.forEach(s => {
        if (category === 'seasonal') {
          const isSeasonal = /oil|truffle|saffron/i.test(s.title_en + s.category_en) ||
            /زيت|زعفران|كمأة/i.test(s.title_ar + s.category_ar);
          if (!isSeasonal) return;
        }
        pool.push({ type: 'supply', item: s });
      });
    }

    if (includeCourses) {
      COURSE_FIXTURES.forEach(crs => {
        pool.push({ type: 'course', item: crs });
      });
    }

    // 2. Filter by search query if present
    if (normQuery.length > 0) {
      pool = pool.filter(entry => {
        const { type, item } = entry;
        if (type === 'recipe') {
          const searchCorpus = [
            item.title_ar,
            item.title_en,
            item.description_ar,
            item.description_en,
            item.cuisine_ar,
            item.cuisine_en,
            item.category_ar,
            item.category_en,
            item.chef_name_ar,
            item.chef_name_en,
            ...(item.tags || [])
          ].filter(Boolean).join(' ');
          return normalizeSearchQuery(searchCorpus).includes(normQuery);
        }

        if (type === 'chef') {
          const searchCorpus = [
            item.name_ar,
            item.name_en,
            item.handle,
            item.title_ar,
            item.title_en,
            item.specialty_ar,
            item.specialty_en,
            item.bio_ar,
            item.bio_en
          ].filter(Boolean).join(' ');
          return normalizeSearchQuery(searchCorpus).includes(normQuery);
        }

        if (type === 'supply') {
          const searchCorpus = [
            item.title_ar,
            item.title_en,
            item.category_ar,
            item.category_en,
            item.supplier_name_ar,
            item.supplier_name_en,
            item.description_ar,
            item.description_en
          ].filter(Boolean).join(' ');
          return normalizeSearchQuery(searchCorpus).includes(normQuery);
        }

        if (type === 'course') {
          const searchCorpus = [
            item.title_ar,
            item.title_en,
            item.level_ar,
            item.level_en,
            item.instructor_name_ar,
            item.instructor_name_en,
            item.description_ar,
            item.description_en
          ].filter(Boolean).join(' ');
          return normalizeSearchQuery(searchCorpus).includes(normQuery);
        }

        return false;
      });
    }

    // 3. Sort items
    pool.sort((a, b) => {
      if (sortBy === 'rating') {
        const rA = Number(a.item.rating || 0);
        const rB = Number(b.item.rating || 0);
        return rB - rA;
      }

      if (sortBy === 'newest') {
        const idA = String(a.item.id || '');
        const idB = String(b.item.id || '');
        return idB.localeCompare(idA);
      }

      // Default: 'popular'
      const popScoreA = this.getPopularityScore(a);
      const popScoreB = this.getPopularityScore(b);
      return popScoreB - popScoreA;
    });

    return pool;
  }

  /**
   * Helper to calculate a popularity score for uniform sorting
   */
  static getPopularityScore(entry) {
    const { type, item } = entry;
    if (type === 'recipe') {
      return (Number(item.likes_count || 0) * 2) + Number(item.saves_count || 0) + (Number(item.reviews_count || 0) * 5);
    }
    if (type === 'chef') {
      return Number(item.followers || 0) / 10;
    }
    if (type === 'supply') {
      return (Number(item.rating || 4.5) * 500);
    }
    if (type === 'course') {
      return (Number(item.enrolled_count || 0) * 150);
    }
    return 0;
  }

  /**
   * Render Recipe Card HTML
   */
  static renderRecipeCard(recipe, lang) {
    const title = lang === 'ar' ? recipe.title_ar : recipe.title_en;
    const cuisine = lang === 'ar' ? recipe.cuisine_ar : recipe.cuisine_en;
    const desc = lang === 'ar' ? recipe.description_ar : recipe.description_en;
    const chefName = lang === 'ar' ? recipe.author_name_ar : recipe.author_name_en;
    const chefId = recipe.author_id || '';
    const chefAvatar = recipe.author_avatar || '';
    const difficultyKey = recipe.difficulty === 'Easy' ? 'recipe.diff_easy' : (recipe.difficulty === 'Medium' ? 'recipe.diff_medium' : 'recipe.diff_hard');
    const diffLabel = I18n.t(difficultyKey);

    const isLiked = this.getLikedRecipeIds().includes(recipe.id);
    const isSaved = this.getSavedRecipeIds().includes(recipe.id);

    return `
      <article data-card-type="recipe" data-id="${recipe.id}" class="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden shadow-sm hover:border-brand-gold transition-all duration-200 flex flex-col justify-between group">
        <div>
          <!-- Image Banner -->
          <div class="relative aspect-video w-full overflow-hidden bg-surface-2">
            <img src="${recipe.image}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            <div class="absolute top-3 start-3 flex items-center gap-1.5">
              <span class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-surface-1 text-brand-gold border border-border-subtle shadow-sm">
                ${cuisine}
              </span>
              <span class="px-2 py-1 text-[11px] font-semibold rounded-lg bg-surface-1 text-text-muted border border-border-subtle shadow-sm">
                ${diffLabel}
              </span>
            </div>
            <div class="absolute bottom-3 end-3 px-2 py-0.5 rounded-md bg-surface-1 text-[11px] font-medium text-text-main border border-border-subtle shadow-sm flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${recipe.prep_time}</span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4 sm:p-5 space-y-3 text-start">
            <div class="flex items-center gap-2.5">
              <a href="chef.html?id=${chefId}" class="relative shrink-0 group/chef focus:outline-none">
                <img src="${chefAvatar}" alt="${chefName}" class="w-7 h-7 rounded-lg object-cover border border-border-subtle">
              </a>
              <a href="chef.html?id=${chefId}" class="text-xs font-semibold text-text-muted hover:text-brand-gold transition-colors truncate">
                ${chefName}
              </a>
            </div>

            <a href="recipe.html?id=${recipe.id}" class="block focus:outline-none">
              <h3 class="font-bold text-base text-text-main group-hover:text-brand-gold transition-colors line-clamp-1">
                ${title}
              </h3>
              <p class="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                ${desc}
              </p>
            </a>

            <!-- Tags -->
            ${recipe.tags && recipe.tags.length > 0 ? `
              <div class="flex flex-wrap gap-1.5 pt-1">
                ${recipe.tags.slice(0, 3).map(tag => `
                  <button type="button" data-action="filter-tag" data-tag="${tag}" class="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-2 text-text-muted hover:text-brand-gold transition-colors">
                    #${tag}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-border-subtle bg-surface-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1 text-xs font-bold text-brand-gold">
            <svg class="w-3.5 h-3.5 fill-brand-gold text-brand-gold" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>${recipe.rating}</span>
            <span class="text-[11px] text-text-muted font-normal">(${recipe.reviews_count})</span>
          </div>

          <div class="flex items-center gap-1.5">
            <button type="button" data-action="toggle-like" data-recipe-id="${recipe.id}"
                    class="p-2 rounded-xl border border-border-subtle transition-colors ${isLiked ? 'bg-surface-2 text-red-500 border-red-500' : 'bg-surface-1 text-text-muted hover:text-red-500'}"
                    aria-label="Like recipe">
              <svg class="w-4 h-4 ${isLiked ? 'fill-current' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
            <button type="button" data-action="toggle-save" data-recipe-id="${recipe.id}"
                    class="p-2 rounded-xl border border-border-subtle transition-colors ${isSaved ? 'bg-surface-2 text-brand-gold border-border-subtle' : 'bg-surface-1 text-text-muted hover:text-brand-gold'}"
                    aria-label="Save recipe">
              <svg class="w-4 h-4 ${isSaved ? 'fill-current' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render Chef Card HTML
   */
  static renderChefCard(chef, lang) {
    const name = lang === 'ar' ? chef.name_ar : chef.name_en;
    const title = lang === 'ar' ? chef.title_ar : chef.title_en;
    const specialty = lang === 'ar' ? chef.specialty_ar : chef.specialty_en;
    const bio = lang === 'ar' ? chef.bio_ar : chef.bio_en;
    const isSelf = isCurrentUserId(chef.id, USER_FIXTURES);
    const isFollowing = this.getFollowingChefIds().includes(chef.id);

    return `
      <article data-card-type="chef" data-id="${chef.id}" class="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden shadow-sm hover:border-brand-gold transition-all duration-200 flex flex-col justify-between group text-start">
        <div>
          <!-- Header Cover with Avatar -->
          <div class="relative h-28 w-full overflow-hidden bg-surface-2">
            <img src="${chef.cover}" alt="${name}" class="w-full h-full object-cover">
            <span class="absolute top-2.5 start-2.5 px-2 py-0.5 text-[10px] font-bold rounded bg-surface-1 text-brand-gold border border-border-subtle shadow-sm" data-i18n="role.chef">
              ${I18n.t('role.chef')}
            </span>
          </div>

          <!-- Avatar & Identity -->
          <div class="px-5 -mt-8 relative space-y-2.5">
            <div class="flex items-end justify-between">
              <div class="relative">
                <img src="${chef.avatar}" alt="${name}" class="w-16 h-16 rounded-2xl object-cover border-2 border-surface-1 shadow-md bg-surface-1">
                ${chef.verified ? `
                  <span class="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-brand-gold text-white flex items-center justify-center border-2 border-surface-1 shadow-sm" title="Verified Chef">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                ` : ''}
              </div>

              <!-- Rating Badge -->
              <div class="flex items-center gap-1 text-xs font-bold text-brand-gold px-2.5 py-1 rounded-xl bg-surface-2 border border-border-subtle">
                <svg class="w-3.5 h-3.5 fill-brand-gold text-brand-gold" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>${chef.rating}</span>
              </div>
            </div>

            <div>
              <a href="chef.html?id=${chef.id}" class="font-extrabold text-base text-text-main hover:text-brand-gold transition-colors block">
                ${name}
              </a>
              <span class="text-xs text-brand-gold font-medium block">${chef.handle}</span>
              <p class="text-[11px] text-text-muted mt-0.5 line-clamp-1">${title}</p>
            </div>

            <!-- Specialty Badge -->
            <div class="pt-1">
              <span class="inline-block px-2.5 py-1 rounded-lg bg-surface-2 border border-border-subtle text-[11px] font-medium text-text-main line-clamp-1">
                ${specialty}
              </span>
            </div>

            <!-- Bio -->
            <p class="text-xs text-text-muted line-clamp-2 leading-relaxed">
              ${bio}
            </p>

            <!-- Stats Matrix -->
            <div class="grid grid-cols-3 gap-2 pt-2 text-center">
              <div class="p-1.5 rounded-xl bg-surface-2 border border-border-subtle">
                <span class="block font-extrabold text-xs text-text-main">${chef.recipes_count}</span>
                <span class="block text-[9px] text-text-muted" data-i18n="nav.recipes">${I18n.t('nav.recipes')}</span>
              </div>
              <div class="p-1.5 rounded-xl bg-surface-2 border border-border-subtle">
                <span class="block font-extrabold text-xs text-text-main">${chef.followers_formatted}</span>
                <span class="block text-[9px] text-text-muted" data-i18n="chef.followers">${I18n.t('chef.followers')}</span>
              </div>
              <div class="p-1.5 rounded-xl bg-surface-2 border border-border-subtle">
                <span class="block font-extrabold text-xs text-text-main">${chef.experience_years}y</span>
                <span class="block text-[9px] text-text-muted">${lang === 'ar' ? 'خبرة' : 'Exp'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-5 py-3.5 mt-4 border-t border-border-subtle bg-surface-2 flex items-center justify-between gap-2">
          ${isSelf ? '' : `
            <button type="button" data-action="toggle-follow" data-chef-id="${chef.id}"
                    class="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${isFollowing ? 'bg-surface-2 text-text-main border-border-subtle' : 'bg-brand-gold hover:bg-brand-gold-hover text-white border-transparent shadow-sm'}">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
              <span>${isFollowing ? I18n.t('btn.following') : I18n.t('btn.follow')}</span>
            </button>
          `}
          <a href="chef.html?id=${chef.id}" class="py-2 px-3 text-xs font-semibold text-text-main hover:text-brand-gold bg-surface-1 border border-border-subtle rounded-xl transition-colors shrink-0">
            ${I18n.t('common.view')}
          </a>
        </div>
      </article>
    `;
  }

  /**
   * Render Supply / Commercial Equipment Card HTML
   */
  static renderSupplyCard(supply, lang) {
    const title = lang === 'ar' ? supply.name_ar : supply.name_en;
    const category = lang === 'ar' ? supply.category_ar : supply.category_en;
    const supplierName = lang === 'ar' ? supply.supplier?.name_ar : supply.supplier?.name_en;
    const priceRange = supply.price_formatted || `${supply.price || 0} ${I18n.t('common.currency')}`;
    const moq = `${supply.moq || 0} ${lang === 'ar' ? (supply.unit_ar || 'وحدة') : (supply.unit_en || 'Units')}`;
    const leadTime = lang === 'ar' ? supply.lead_time_ar : supply.lead_time_en;
    const rating = supply.supplier?.rating ?? '';

    return `
      <article data-card-type="supply" data-id="${supply.id}" class="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden shadow-sm hover:border-brand-gold transition-all duration-200 flex flex-col justify-between group text-start">
        <div>
          <!-- Image Banner -->
          <div class="relative aspect-video w-full overflow-hidden bg-surface-2">
            <img src="${supply.image}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            <div class="absolute top-3 start-3 flex items-center gap-1.5">
              <span class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-surface-1 text-brand-gold border border-border-subtle shadow-sm">
                ${category}
              </span>
            </div>
            <div class="absolute top-3 end-3">
              <span class="px-2 py-0.5 text-[10px] font-semibold rounded-md ${supply.in_stock ? 'bg-surface-2 text-emerald-600 border border-emerald-500' : 'bg-surface-2 text-red-600 border border-red-500'} bg-surface-1">
                ${supply.in_stock ? I18n.t('supplies.in_stock') : I18n.t('supplies.out_of_stock')}
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4 sm:p-5 space-y-3">
            <div class="flex items-center justify-between text-xs text-text-muted">
              <span class="font-medium truncate text-brand-gold">${supplierName}</span>
              <span class="text-[11px] px-2 py-0.5 rounded bg-surface-2 border border-border-subtle shrink-0">${moq}</span>
            </div>

            <a href="supplies.html?id=${supply.id}" class="block focus:outline-none">
              <h3 class="font-bold text-base text-text-main group-hover:text-brand-gold transition-colors line-clamp-1">
                ${title}
              </h3>
              <p class="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                ${lang === 'ar' ? supply.description_ar : supply.description_en}
              </p>
            </a>

            <!-- Pricing & Lead Time -->
            <div class="p-2.5 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-between text-xs">
              <div>
                <span class="text-[10px] text-text-muted block" data-i18n="supplies.price_range">${I18n.t('supplies.price_range')}</span>
                <span class="font-extrabold text-sm text-text-main">${priceRange}</span>
              </div>
              <div class="text-end">
                <span class="text-[10px] text-text-muted block" data-i18n="supplies.lead_time">${I18n.t('supplies.lead_time')}</span>
                <span class="font-semibold text-text-main">${leadTime}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-border-subtle bg-surface-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1 text-xs font-bold text-brand-gold">
            <svg class="w-3.5 h-3.5 fill-brand-gold text-brand-gold" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>${rating}</span>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" data-action="request-rfq" data-supply-id="${supply.id}"
                    class="px-3 py-1.5 text-xs font-semibold bg-brand-emerald hover:bg-brand-emerald-hover text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span data-i18n="supplies.request_quote">${I18n.t('supplies.request_quote')}</span>
            </button>
            <a href="supplies.html?id=${supply.id}" class="p-2 rounded-xl bg-surface-1 border border-border-subtle text-text-muted hover:text-brand-gold transition-colors" title="View details">
              <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render Masterclass / Workshop Card HTML
   */
  static renderCourseCard(course, lang) {
    const title = lang === 'ar' ? course.title_ar : course.title_en;
    const level = lang === 'ar' ? course.level_ar : course.level_en;
    const instructor = lang === 'ar' ? course.instructor_name_ar : course.instructor_name_en;
    const date = course.start_date || '';
    const duration = lang === 'ar' ? course.duration_ar : course.duration_en;
    const description = lang === 'ar' ? (course.description_ar || course.subtitle_ar) : (course.description_en || course.subtitle_en);
    const price = course.price_formatted || `${course.price || 0} ${I18n.t('common.currency')}`;
    const image = course.image || '';
    const availableSeats = course.seats_left ?? 0;
    const totalSeats = course.total_seats ?? 0;
    const rating = course.rating ?? '';
    const isSelf = isCurrentUserId(course.instructor_id, USER_FIXTURES);
    const isEnrolled = this.getEnrolledCourseIds().includes(course.id);

    return `
      <article data-card-type="course" data-id="${course.id}" class="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden shadow-sm hover:border-brand-gold transition-all duration-200 flex flex-col justify-between group text-start">
        <div>
          <!-- Image Banner -->
          <div class="relative aspect-video w-full overflow-hidden bg-surface-2">
            <img src="${image}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            <div class="absolute top-3 start-3 flex items-center gap-1.5">
              <span class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-surface-1 text-brand-gold border border-border-subtle shadow-sm">
                ${level}
              </span>
              <span class="px-2 py-1 text-[11px] font-semibold rounded-lg bg-surface-1 text-text-muted border border-border-subtle shadow-sm">
                ${duration}
              </span>
            </div>
            <div class="absolute bottom-3 end-3 px-2 py-0.5 rounded-md bg-surface-1 text-[11px] font-bold text-brand-gold border border-border-subtle shadow-sm">
              ${price}
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 sm:p-5 space-y-3">
            <div class="flex items-center gap-2.5">
              <img src="${course.instructor_avatar}" alt="${instructor}" class="w-7 h-7 rounded-lg object-cover border border-border-subtle">
              <div class="min-w-0 flex-1">
                <span class="text-xs font-semibold text-text-muted truncate block">${instructor}</span>
              </div>
              <span class="text-[11px] text-text-muted shrink-0">${date}</span>
            </div>

            <a href="courses.html?id=${course.id}" class="block focus:outline-none">
              <h3 class="font-bold text-base text-text-main group-hover:text-brand-gold transition-colors line-clamp-1">
                ${title}
              </h3>
              <p class="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                ${description}
              </p>
            </a>

            <!-- Capacity Info -->
            <div class="flex items-center justify-between text-[11px] text-text-muted pt-1">
              <span>${lang === 'ar' ? 'المقاعد المتاحة' : 'Available Seats'}: <strong class="text-text-main">${availableSeats}/${totalSeats}</strong></span>
              <span class="text-brand-gold font-semibold">${course.enrolled_count} ${lang === 'ar' ? 'مسجل' : 'enrolled'}</span>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-border-subtle bg-surface-2 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1 text-xs font-bold text-brand-gold">
            <svg class="w-3.5 h-3.5 fill-brand-gold text-brand-gold" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>${rating}</span>
          </div>

          <div class="flex items-center gap-2">
            ${isSelf ? '' : `
              <button type="button" data-action="enroll-course" data-course-id="${course.id}"
                      class="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors ${isEnrolled ? 'bg-surface-2 text-text-main border border-border-subtle' : 'bg-brand-gold hover:bg-brand-gold-hover text-white shadow-sm'}">
                <span>${isEnrolled ? I18n.t('btn.enrolled') : I18n.t('btn.enroll')}</span>
              </button>
            `}
            <a href="courses.html?id=${course.id}" class="p-2 rounded-xl bg-surface-1 border border-border-subtle text-text-muted hover:text-brand-gold transition-colors">
              <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render single card according to type
   */
  static renderCard(entry, lang = I18n.getLang()) {
    if (entry.type === 'recipe') return this.renderRecipeCard(entry.item, lang);
    if (entry.type === 'chef') return this.renderChefCard(entry.item, lang);
    if (entry.type === 'supply') return this.renderSupplyCard(entry.item, lang);
    if (entry.type === 'course') return this.renderCourseCard(entry.item, lang);
    return '';
  }

  /**
   * Render the main multi-category grid
   * @param {HTMLElement} container 
   * @param {Array} items 
   * @param {string} lang 
   */
  static renderGrid(container, items, lang = I18n.getLang()) {
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div id="explore-empty-state" class="col-span-full py-16 px-6 text-center bg-surface-1 border border-border-subtle rounded-3xl space-y-4 max-w-xl mx-auto my-6">
          <div class="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto text-brand-gold border border-border-subtle">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" x2="16.65" y1="21" y2="16.65"/>
              <line x1="8" x2="14" y1="11" y2="11"/>
            </svg>
          </div>
          <div>
            <h3 class="font-extrabold text-lg text-text-main" data-i18n="explore.empty_title">
              ${I18n.t('explore.empty_title')}
            </h3>
            <p class="text-xs text-text-muted mt-1 max-w-sm mx-auto leading-relaxed" data-i18n="explore.empty_desc">
              ${I18n.t('explore.empty_desc')}
            </p>
          </div>
          <button type="button" data-action="reset-explore-filters"
                  class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-brand-gold hover:bg-brand-gold-hover text-white rounded-xl shadow-sm transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <span data-i18n="explore.reset_filters">${I18n.t('explore.reset_filters')}</span>
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(entry => this.renderCard(entry, lang)).join('');
  }

  /**
   * Render Hero Trend Spotlight Banner
   */
  static renderSpotlight(container, lang = I18n.getLang()) {
    if (!container) return;

    container.innerHTML = `
      <div class="relative bg-surface-1 border border-border-subtle rounded-3xl p-6 sm:p-8 overflow-hidden shadow-sm flex flex-col lg:flex-row items-center gap-6 sm:gap-8 text-start group">
        <!-- Visual Media Showcase (Solid container) -->
        <div class="w-full lg:w-1/2 aspect-video sm:aspect-4/3 rounded-2xl overflow-hidden relative border border-border-subtle bg-surface-2 shrink-0">
          <img src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"
               alt="Culinary Trend Spotlight"
               class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500">
          <div class="absolute top-4 start-4 flex items-center gap-2">
            <span class="px-3 py-1 rounded-xl bg-surface-1 text-brand-gold font-bold text-xs border border-border-subtle shadow-md" data-i18n="explore.spotlight_badge">
              ${I18n.t('explore.spotlight_badge')}
            </span>
          </div>
          <div class="absolute bottom-4 start-4 end-4 p-3 rounded-xl bg-surface-1 border border-border-subtle shadow-md flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80"
                   alt="Chef Faisal" class="w-8 h-8 rounded-lg object-cover border border-border-subtle">
              <div>
                <span class="text-xs font-bold text-text-main block">الشيف فيصل الهاشمي</span>
                <span class="text-[10px] text-brand-gold font-medium">Executive Culinary Director</span>
              </div>
            </div>
            <a href="chef.html?id=chef-1" class="px-2.5 py-1 text-[11px] font-semibold bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-lg text-text-main transition-colors">
              ${I18n.t('common.view')}
            </a>
          </div>
        </div>

        <!-- Spotlight Content & Actions -->
        <div class="flex-1 space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg bg-surface-2 text-brand-gold border border-border-subtle text-xs font-semibold">#NewNajdiCuisine</span>
            <span class="px-2.5 py-1 rounded-lg bg-surface-2 text-text-muted border border-border-subtle text-xs font-medium">#DryAgingArt</span>
          </div>

          <h2 class="font-extrabold text-2xl sm:text-3xl text-text-main leading-snug" data-i18n="explore.spotlight_title">
            ${I18n.t('explore.spotlight_title')}
          </h2>

          <p class="text-xs sm:text-sm text-text-muted leading-relaxed" data-i18n="explore.spotlight_desc">
            ${I18n.t('explore.spotlight_desc')}
          </p>

          <!-- Key Metrics -->
          <div class="grid grid-cols-3 gap-3 py-2 border-y border-border-subtle text-center">
            <div class="p-2 rounded-xl bg-surface-2 border border-border-subtle">
              <span class="block font-extrabold text-base text-text-main">24+</span>
              <span class="block text-[10px] text-text-muted mt-0.5">${lang === 'ar' ? 'وصفة معاصرة' : 'New Recipes'}</span>
            </div>
            <div class="p-2 rounded-xl bg-surface-2 border border-border-subtle">
              <span class="block font-extrabold text-base text-text-main">8</span>
              <span class="block text-[10px] text-text-muted mt-0.5">${lang === 'ar' ? 'كبار الطهاة' : 'Master Chefs'}</span>
            </div>
            <div class="p-2 rounded-xl bg-surface-2 border border-border-subtle">
              <span class="block font-extrabold text-base text-brand-gold">1.4k</span>
              <span class="block text-[10px] text-text-muted mt-0.5">${lang === 'ar' ? 'مشاركة مجتمعية' : 'Discussions'}</span>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <button type="button" data-category="recipes"
                    class="px-5 py-2.5 text-xs sm:text-sm font-bold bg-brand-gold hover:bg-brand-gold-hover text-white rounded-xl shadow-sm transition-colors flex items-center gap-2">
              <span data-i18n="explore.spotlight_cta">${I18n.t('explore.spotlight_cta')}</span>
              <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <a href="recipe.html?id=recipe-1" class="px-4 py-2.5 text-xs sm:text-sm font-semibold bg-surface-2 hover:bg-surface-1 border border-border-subtle text-text-main rounded-xl transition-colors">
              ${lang === 'ar' ? 'عرض طبق الأسبوع المميز' : 'Featured Dish of the Week'}
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Sidebar Trending Topics and Highlights
   */
  static renderTrendingSidebar(topicsContainer, storiesContainer, workshopsContainer, lang = I18n.getLang()) {
    // 1. Trending Hashtags
    if (topicsContainer && TREND_FIXTURES && TREND_FIXTURES.topics) {
      topicsContainer.innerHTML = TREND_FIXTURES.topics.map(topic => {
        const title = lang === 'ar' ? topic.title_ar : topic.title_en;
        return `
          <button type="button" data-action="filter-tag" data-tag="${topic.tag.replace('#', '')}"
                  class="w-full p-3 rounded-xl bg-surface-2 hover:bg-surface-1 border border-border-subtle transition-colors flex items-center justify-between text-start group">
            <div class="min-w-0 pe-2">
              <span class="font-bold text-xs text-text-main group-hover:text-brand-gold transition-colors block truncate">${topic.tag}</span>
              <span class="text-[10px] text-text-muted block truncate">${title}</span>
            </div>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-1 text-text-muted border border-border-subtle shrink-0">
              ${topic.posts_count}
            </span>
          </button>
        `;
      }).join('');
    }

    // 2. Featured Chef Stories / Highlights
    if (storiesContainer && TREND_FIXTURES && TREND_FIXTURES.stories) {
      storiesContainer.innerHTML = TREND_FIXTURES.stories.map(story => {
        const name = lang === 'ar' ? story.chef_name_ar : story.chef_name_en;
        return `
          <a href="chef.html?id=${story.chef_id}" class="flex flex-col items-center gap-1.5 group shrink-0 focus:outline-none" aria-label="${name}">
            <div class="relative w-14 h-14 rounded-2xl p-0.5 border-2 ${story.unviewed ? 'border-brand-gold' : 'border-border-subtle'} bg-surface-1 group-hover:scale-105 transition-transform">
              <img src="${story.avatar}" alt="${name}" class="w-full h-full rounded-xl object-cover">
            </div>
            <span class="text-[11px] font-semibold text-text-main group-hover:text-brand-gold transition-colors max-w-[64px] truncate text-center block">
              ${name}
            </span>
          </a>
        `;
      }).join('');
    }

    // 3. Upcoming Workshops
    if (workshopsContainer && COURSE_FIXTURES) {
      workshopsContainer.innerHTML = COURSE_FIXTURES.slice(0, 2).map(crs => {
        const title = lang === 'ar' ? crs.title_ar : crs.title_en;
        const date = crs.start_date || '';
        return `
          <div class="p-3 rounded-xl bg-surface-2 border border-border-subtle space-y-2 text-start">
            <div class="flex items-center justify-between text-[11px] text-text-muted">
              <span class="text-brand-gold font-semibold">${crs.price_formatted || `${crs.price || 0} ${I18n.t('common.currency')}`}</span>
              <span>${date}</span>
            </div>
            <a href="courses.html?id=${crs.id}" class="font-bold text-xs text-text-main hover:text-brand-gold transition-colors block line-clamp-1">
              ${title}
            </a>
            <div class="flex items-center justify-between pt-1">
              <span class="text-[10px] text-text-muted">${crs.level_ar}</span>
              <a href="courses.html?id=${crs.id}" class="text-[10px] font-semibold text-brand-gold hover:underline">
                ${lang === 'ar' ? 'التفاصيل' : 'Details'} →
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /**
   * Update active button classes in filter bar
   */
  static updateFilterButtons(activeCategory = this.currentCategory) {
    document.querySelectorAll('[data-category]').forEach(btn => {
      const cat = btn.getAttribute('data-category');
      if (cat === activeCategory) {
        btn.classList.remove('bg-surface-2', 'text-text-muted', 'hover:text-text-main', 'hover:bg-surface-1');
        btn.classList.add('bg-brand-gold', 'text-white', 'shadow-sm');
      } else {
        btn.classList.remove('bg-brand-gold', 'text-white', 'shadow-sm');
        btn.classList.add('bg-surface-2', 'text-text-muted', 'hover:text-text-main', 'hover:bg-surface-1');
      }
    });
  }

  /**
   * Update results count element
   */
  static updateResultsCount(count, lang = I18n.getLang()) {
    const el = document.getElementById('explore-results-count');
    if (el) {
      el.textContent = I18n.t('explore.results_count', { count });
    }
  }

  /**
   * Synchronize active card action button styles (like, save, follow, enroll)
   */
  static updateCardActionStates() {
    const savedIds = new Set(this.getSavedRecipeIds());
    const likedIds = new Set(this.getLikedRecipeIds());
    const followingIds = new Set(this.getFollowingChefIds());
    const enrolledIds = new Set(this.getEnrolledCourseIds());

    // Recipe Saves
    document.querySelectorAll('[data-action="toggle-save"]').forEach(btn => {
      const id = btn.getAttribute('data-recipe-id');
      const isSaved = savedIds.has(id);
      const svg = btn.querySelector('svg');
      if (isSaved) {
        btn.classList.add('bg-surface-2', 'text-brand-gold', 'border-border-subtle');
        btn.classList.remove('bg-surface-1', 'text-text-muted');
        if (svg) svg.classList.add('fill-current');
      } else {
        btn.classList.remove('bg-surface-2', 'text-brand-gold', 'border-border-subtle');
        btn.classList.add('bg-surface-1', 'text-text-muted');
        if (svg) svg.classList.remove('fill-current');
      }
    });

    // Recipe Likes
    document.querySelectorAll('[data-action="toggle-like"]').forEach(btn => {
      const id = btn.getAttribute('data-recipe-id');
      const isLiked = likedIds.has(id);
      const svg = btn.querySelector('svg');
      if (isLiked) {
        btn.classList.add('bg-surface-2', 'text-red-500', 'border-red-500');
        btn.classList.remove('bg-surface-1', 'text-text-muted');
        if (svg) svg.classList.add('fill-current');
      } else {
        btn.classList.remove('bg-surface-2', 'text-red-500', 'border-red-500');
        btn.classList.add('bg-surface-1', 'text-text-muted');
        if (svg) svg.classList.remove('fill-current');
      }
    });

    // Chef Follows
    document.querySelectorAll('[data-action="toggle-follow"]').forEach(btn => {
      const id = btn.getAttribute('data-chef-id');
      const isFollowing = followingIds.has(id);
      const span = btn.querySelector('span');
      if (isFollowing) {
        btn.classList.add('bg-surface-2', 'text-text-main', 'border-border-subtle');
        btn.classList.remove('bg-brand-gold', 'hover:bg-brand-gold-hover', 'text-white', 'border-transparent', 'shadow-sm');
        if (span) span.textContent = I18n.t('btn.following');
      } else {
        btn.classList.remove('bg-surface-2', 'text-text-main', 'border-border-subtle');
        btn.classList.add('bg-brand-gold', 'hover:bg-brand-gold-hover', 'text-white', 'border-transparent', 'shadow-sm');
        if (span) span.textContent = I18n.t('btn.follow');
      }
    });

    // Course Enrolls
    document.querySelectorAll('[data-action="enroll-course"]').forEach(btn => {
      const id = btn.getAttribute('data-course-id');
      const isEnrolled = enrolledIds.has(id);
      const span = btn.querySelector('span');
      if (isEnrolled) {
        btn.classList.add('bg-surface-2', 'text-text-main', 'border', 'border-border-subtle');
        btn.classList.remove('bg-brand-gold', 'hover:bg-brand-gold-hover', 'text-white', 'shadow-sm');
        if (span) span.textContent = I18n.t('btn.enrolled');
      } else {
        btn.classList.remove('bg-surface-2', 'text-text-main', 'border', 'border-border-subtle');
        btn.classList.add('bg-brand-gold', 'hover:bg-brand-gold-hover', 'text-white', 'shadow-sm');
        if (span) span.textContent = I18n.t('btn.enroll');
      }
    });
  }

  /**
   * Set category and refresh view
   * @param {string} category 
   */
  static setCategory(category) {
    this.currentCategory = category;
    this.updateFilterButtons(category);
    this.refresh();
  }

  /**
   * Set search query and refresh view
   * @param {string} query 
   */
  static setSearchQuery(query) {
    this.searchQuery = query || '';
    const searchInput = document.getElementById('explore-search-input');
    if (searchInput && searchInput.value !== query) {
      searchInput.value = query;
    }
    const clearBtn = document.getElementById('explore-search-clear');
    if (clearBtn) {
      if (this.searchQuery.length > 0) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
    }
    this.refresh();
  }

  /**
   * Set sort option and refresh view
   * @param {string} sortBy 
   */
  static setSortBy(sortBy) {
    this.sortBy = sortBy || 'popular';
    const select = document.getElementById('explore-sort-select');
    if (select && select.value !== sortBy) {
      select.value = sortBy;
    }
    this.refresh();
  }

  /**
   * Re-filter and render the grid
   */
  static refresh() {
    const gridContainer = document.getElementById('explore-grid');
    const items = this.filterItems(this.currentCategory, this.searchQuery, this.sortBy);
    const lang = I18n.getLang();

    this.renderGrid(gridContainer, items, lang);
    this.updateResultsCount(items.length, lang);
    this.updateCardActionStates();
  }

  /**
   * Full Page Initializer
   */
  static init() {
    if (this.isInitialized) return;
    if (typeof document === 'undefined') return;

    const gridContainer = document.getElementById('explore-grid');
    const spotlightContainer = document.getElementById('explore-spotlight');
    const topicsContainer = document.getElementById('explore-trending-topics');
    const storiesContainer = document.getElementById('explore-chef-stories');
    const workshopsContainer = document.getElementById('explore-upcoming-workshops');
    const searchInput = document.getElementById('explore-search-input');
    const searchClear = document.getElementById('explore-search-clear');
    const sortSelect = document.getElementById('explore-sort-select');

    // 1. Initial Render
    const lang = I18n.getLang();
    this.renderSpotlight(spotlightContainer, lang);
    this.renderTrendingSidebar(topicsContainer, storiesContainer, workshopsContainer, lang);
    this.refresh();

    this.isInitialized = true;

    // 2. Category Filter Buttons
    document.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = btn.getAttribute('data-category');
        this.setCategory(cat);
      });
    });

    // 3. Search Input Binding with Clear button
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        this.setSearchQuery(val);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', (e) => {
        e.preventDefault();
        this.setSearchQuery('');
        if (searchInput) searchInput.focus();
      });
    }

    // 4. Sort Select
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.setSortBy(e.target.value);
      });
    }

    // 5. Global Action Event Delegation for Cards
    document.addEventListener('click', (e) => {
      // Like Toggle
      const likeBtn = e.target.closest('[data-action="toggle-like"]');
      if (likeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = likeBtn.getAttribute('data-recipe-id');
        this.toggleLike(id);
        return;
      }

      // Save Toggle
      const saveBtn = e.target.closest('[data-action="toggle-save"]');
      if (saveBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = saveBtn.getAttribute('data-recipe-id');
        this.toggleSave(id);
        return;
      }

      // Follow Toggle
      const followBtn = e.target.closest('[data-action="toggle-follow"]');
      if (followBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = followBtn.getAttribute('data-chef-id');
        this.toggleFollow(id);
        return;
      }

      // Course Enroll
      const enrollBtn = e.target.closest('[data-action="enroll-course"]');
      if (enrollBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = enrollBtn.getAttribute('data-course-id');
        this.toggleEnroll(id);
        return;
      }

      // RFQ Quote Request
      const rfqBtn = e.target.closest('[data-action="request-rfq"]');
      if (rfqBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = rfqBtn.getAttribute('data-supply-id');
        this.requestRFQ(id);
        return;
      }

      // Reset Filters
      const resetBtn = e.target.closest('[data-action="reset-explore-filters"]');
      if (resetBtn) {
        e.preventDefault();
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.sortBy = 'popular';
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'popular';
        this.updateFilterButtons('all');
        this.refresh();
        return;
      }

      // Filter by tag
      const tagBtn = e.target.closest('[data-action="filter-tag"]');
      if (tagBtn) {
        e.preventDefault();
        const tag = tagBtn.getAttribute('data-tag');
        this.setSearchQuery(tag);
        return;
      }
    });

    // 6. Language Switcher Synchronizer
    if (typeof window !== 'undefined') {
      window.addEventListener('meyar:lang-changed', (e) => {
        const newLang = e.detail?.lang || I18n.getLang();
        this.renderSpotlight(spotlightContainer, newLang);
        this.renderTrendingSidebar(topicsContainer, storiesContainer, workshopsContainer, newLang);
        this.refresh();
      });
    }
  }
}
