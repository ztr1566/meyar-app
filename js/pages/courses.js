/**
 * Meyar (معيار) Culinary Masterclasses & Workshops Page Controller
 * Handles culinary academy catalog rendering, multi-facet filtering (categories, skill levels,
 * availability, keyword search), curriculum breakdown modal, interactive 1-click enrollment,
 * schedule selection, transient session state,
 * and dynamic bilingual updates.
 */

import { COURSE_FIXTURES, USER_FIXTURES } from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Modal } from '../core/modal.js';
import { Toast } from '../core/toast.js';
import { isCurrentUserId } from '../core/utils.js';
import { normalizeSearchQuery } from '../modules/search.js';

export class CoursesPage {
  static currentCategory = 'all'; // all | fermentation | pastry | smoke | seafood
  static currentLevel = 'all'; // all | masterclass | intermediate | beginner
  static searchQuery = '';
  static sortBy = 'popular'; // popular | price_asc | price_desc | seats_asc | date_asc
  static filterAvailableOnly = false;
  static isInitialized = false;

  static enrolledCourseIds = new Set();
  static savedCourseIds = new Set();

  /**
   * Reset in-memory courses state (for test isolation)
   */
  static reset() {
    this.enrolledCourseIds = new Set();
    this.savedCourseIds = new Set();
    this.currentCategory = 'all';
    this.currentLevel = 'all';
    this.searchQuery = '';
    this.sortBy = 'popular';
    this.filterAvailableOnly = false;
    this.isInitialized = false;
  }

  /**
   * Get enrolled course IDs from in-memory set
   * @returns {string[]}
   */
  static getEnrolledCourseIds() {
    return Array.from(this.enrolledCourseIds);
  }

  /**
   * Check if a course is currently enrolled by the active user
   * @param {string} courseId 
   * @returns {boolean}
   */
  static isEnrolled(courseId) {
    if (!courseId) return false;
    return this.enrolledCourseIds.has(courseId);
  }

  /**
   * Get saved/bookmarked course IDs from in-memory set
   * @returns {string[]}
   */
  static getSavedCourseIds() {
    return Array.from(this.savedCourseIds);
  }

  /**
   * Toggle bookmark/save status for a course
   * @param {string} courseId 
   * @returns {boolean}
   */
  static toggleSaveCourse(courseId) {
    if (!courseId) return false;
    const isSaved = this.savedCourseIds.has(courseId);
    const isAr = I18n.getLang() === 'ar';

    if (isSaved) {
      this.savedCourseIds.delete(courseId);
      Toast.info(isAr ? 'تمت إزالة الورشة من الدورات المحفوظة' : 'Masterclass removed from saved list');
    } else {
      this.savedCourseIds.add(courseId);
      Toast.success(isAr ? 'تم حفظ ورشة العمل في قائمتك' : 'Masterclass saved to your list');
    }

    this.updateSaveButtonStates();
    return !isSaved;
  }

  /**
   * Enroll in a masterclass/workshop
   * @param {string} courseId 
   * @param {Object} studentDetails 
   * @returns {boolean}
   */
  static enrollInCourse(courseId, studentDetails = {}) {
    if (!courseId) return false;
    const course = (COURSE_FIXTURES || []).find(c => c.id === courseId);
    if (!course) {
      Toast.error(I18n.getLang() === 'ar' ? 'عذراً، لم يتم العثور على بيانات الورشة' : 'Masterclass not found');
      return false;
    }
    if (isCurrentUserId(course.instructor_id, USER_FIXTURES)) return false;

    if (this.enrolledCourseIds.has(courseId)) {
      Toast.info(I18n.t('courses.already_enrolled') || 'أنت مسجل بالفعل في هذه الدورة');
      return true;
    }

    this.enrolledCourseIds.add(courseId);

    const isAr = I18n.getLang() === 'ar';
    Toast.success(
      isAr ? `تم تأكيد تسجيلك في: ${course.title_ar}` : `Enrolled successfully in: ${course.title_en}`,
      isAr ? 'تهانينا!' : 'Congratulations!'
    );

    // Broadcast global event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meyar:course-enrolled', {
        detail: {
          courseId,
          courseTitle: isAr ? course.title_ar : course.title_en,
          studentDetails
        }
      }));
    }

    this.render();
    return true;
  }

  /**
   * Cancel masterclass enrollment
   * @param {string} courseId 
   * @returns {boolean}
   */
  static cancelEnrollment(courseId) {
    if (!courseId) return false;
    if (!this.enrolledCourseIds.has(courseId)) return false;

    this.enrolledCourseIds.delete(courseId);

    const isAr = I18n.getLang() === 'ar';
    Toast.info(isAr ? 'تم إلغاء التسجيل في الدورة' : 'Workshop enrollment cancelled');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meyar:course-cancelled', { detail: { courseId } }));
    }

    this.render();
    return true;
  }

  /**
   * Update visual bookmark states on all rendered buttons
   */
  static updateSaveButtonStates() {
    const saved = new Set(this.getSavedCourseIds());
    document.querySelectorAll('[data-action="toggle-save-course"]').forEach(btn => {
      const id = btn.getAttribute('data-course-id');
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
   * Filter and sort masterclasses based on current state
   * @returns {Array<Object>}
   */
  static filterCourses() {
    const courses = COURSE_FIXTURES || [];
    const normQuery = normalizeSearchQuery(this.searchQuery);

    return courses.filter(item => {
      // 1. Category Filter
      if (this.currentCategory !== 'all') {
        const cat = this.currentCategory.toLowerCase();
        let matchesCat = false;
        if (cat === 'fermentation' && (item.id === 'course-1' || item.title.toLowerCase().includes('fermentation') || item.title_ar.includes('تخمير'))) {
          matchesCat = true;
        } else if (cat === 'pastry' && (item.id === 'course-2' || item.title.toLowerCase().includes('viennoiserie') || item.title.toLowerCase().includes('dough') || item.title_ar.includes('مخبوزات') || item.title_ar.includes('توريق'))) {
          matchesCat = true;
        } else if (cat === 'smoke' && (item.id === 'course-3' || item.title.toLowerCase().includes('smoke') || item.title.toLowerCase().includes('fire') || item.title_ar.includes('حطب') || item.title_ar.includes('تدخين') || item.title_ar.includes('شواء'))) {
          matchesCat = true;
        } else if (cat === 'seafood' && (item.id === 'course-4' || item.title.toLowerCase().includes('kaiseki') || item.title.toLowerCase().includes('seafood') || item.title_ar.includes('كايسيكي') || item.title_ar.includes('بحرية') || item.title_ar.includes('أسماك'))) {
          matchesCat = true;
        }
        if (!matchesCat) return false;
      }

      // 2. Skill Level Filter
      if (this.currentLevel !== 'all') {
        const level = (item.level || '').toLowerCase();
        if (level !== this.currentLevel.toLowerCase()) {
          return false;
        }
      }

      // 3. Availability Filter (Seats Remaining)
      if (this.filterAvailableOnly) {
        if ((item.seats_left || 0) <= 0) return false;
      }

      // 4. Keyword Search Query Filter
      if (normQuery) {
        const syllabusSearchText = (item.syllabus || []).flatMap(m => [
          m.title_ar,
          m.title_en,
          ...(m.lessons || []).flatMap(l => [l.title_ar, l.title_en])
        ]).join(' ');

        const searchFields = [
          item.title,
          item.title_ar,
          item.title_en,
          item.subtitle_ar,
          item.subtitle_en,
          item.instructor_name_ar,
          item.instructor_name_en,
          item.instructor_title_ar,
          item.instructor_title_en,
          item.level,
          item.level_ar,
          item.level_en,
          item.schedule_ar,
          item.schedule_en,
          syllabusSearchText
        ].filter(Boolean).join(' ');

        const normTarget = normalizeSearchQuery(searchFields);
        const queryTerms = normQuery.split(/\s+/).filter(Boolean);
        const matchesAll = queryTerms.every(term => normTarget.includes(term));
        if (!matchesAll) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (this.sortBy === 'price_asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (this.sortBy === 'price_desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (this.sortBy === 'seats_asc') {
        return (a.seats_left || 0) - (b.seats_left || 0);
      }
      if (this.sortBy === 'date_asc') {
        const dateA = new Date(a.start_date || '2099-01-01').getTime();
        const dateB = new Date(b.start_date || '2099-01-01').getTime();
        return dateA - dateB;
      }
      // 'popular' default: enrolled_count desc, then default order
      return (b.enrolled_count || 0) - (a.enrolled_count || 0);
    });
  }

  /**
   * Render single masterclass card HTML
   * @param {Object} course 
   * @param {boolean} isAr 
   * @returns {string}
   */
  static renderCourseCard(course, isAr) {
    const isEnrolled = this.isEnrolled(course.id);
    const isSaved = this.getSavedCourseIds().includes(course.id);
    const title = isAr ? course.title_ar : course.title_en;
    const subtitle = isAr ? course.subtitle_ar : course.subtitle_en;
    const instructorName = isAr ? course.instructor_name_ar : course.instructor_name_en;
    const instructorTitle = isAr ? course.instructor_title_ar : course.instructor_title_en;
    const levelLabel = isAr ? course.level_ar : course.level_en;
    const durationLabel = isAr ? course.duration_ar : course.duration_en;
    const scheduleLabel = isAr ? course.schedule_ar : course.schedule_en;

    const totalLessons = (course.syllabus || []).reduce((acc, m) => acc + ((m.lessons || []).length), 0);
    const totalModules = (course.syllabus || []).length;

    // Urgency styling for low seats
    const isUrgent = (course.seats_left || 0) <= 3;
    const seatsBadgeClass = isUrgent
      ? 'bg-surface-2 text-red-500 border-red-500'
      : 'bg-surface-2 text-text-muted border-border-subtle';

    const seatsText = isUrgent
      ? (isAr ? `باقي ${course.seats_left} مقاعد فقط!` : `Only ${course.seats_left} seats left!`)
      : (isAr ? `${course.seats_left} مقاعد متاحة` : `${course.seats_left} seats left`);

    const enrollBtnText = isEnrolled
      ? (isAr ? 'أنت مسجل بالفوج ✓' : 'Enrolled in Cohort ✓')
      : (isAr ? 'التسجيل الفوري' : 'Enroll Now');

    const enrollBtnClass = isEnrolled
      ? 'bg-brand-emerald text-white hover:bg-brand-emerald-hover'
      : 'bg-brand-gold text-white hover:bg-brand-gold-hover';
    const enrollControl = isCurrentUserId(course.instructor_id, USER_FIXTURES) ? '' : `
      <button type="button"
              data-action="open-enroll"
              data-course-id="${course.id}"
              class="px-3 py-2 text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold flex items-center justify-center gap-1.5 ${enrollBtnClass}">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
        <span>${enrollBtnText}</span>
      </button>
    `;

    return `
      <article class="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-border-subtle shadow-sm"
               data-course-card="${course.id}"
               data-category="${course.level}">
        
        <!-- Top Media Cover & Badges -->
        <div class="relative w-full h-48 sm:h-52 bg-surface-2 shrink-0 overflow-hidden">
          <img src="${course.image}" 
               alt="${title}"
               loading="lazy"
               class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
          
          <!-- Top Overlay Badges -->
          <div class="absolute top-3 start-3 end-3 flex items-center justify-between gap-2 pointer-events-none">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-surface-1 border border-border-subtle rounded-lg text-brand-gold uppercase tracking-wider shadow-sm">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              ${levelLabel}
            </span>

            <div class="flex items-center gap-1.5 pointer-events-auto">
              <span class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg border shadow-sm ${seatsBadgeClass}">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ${seatsText}
              </span>
              
              <button type="button" 
                      data-action="toggle-save-course" 
                      data-course-id="${course.id}"
                      class="p-1.5 rounded-lg border border-border-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold ${isSaved ? 'text-brand-gold bg-surface-2' : 'text-text-muted bg-surface-1 hover:text-text-main'}"
                      aria-label="${isSaved ? 'Unsave' : 'Save'}">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </button>
            </div>
          </div>

          <!-- Certificate Included Strip -->
          ${course.includes_certificate ? `
            <div class="absolute bottom-2 start-3 end-3 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-surface-1 border border-border-subtle rounded-lg text-text-main">
              <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span class="truncate">${isAr ? 'شهادة معتمدة مشمولة من أكاديمية معيار' : 'Accredited Certificate Included'}</span>
            </div>
          ` : ''}
        </div>

        <!-- Course Card Body -->
        <div class="p-5 flex-1 flex flex-col justify-between gap-4 text-start">
          
          <div class="space-y-3">
            <!-- Instructor Info Row -->
            <a href="chef.html?id=${course.instructor_id}" 
               class="flex items-center gap-2.5 group focus:outline-none rounded-lg">
              <img src="${course.instructor_avatar}" 
                   alt="${instructorName}"
                   class="w-8 h-8 rounded-full object-cover border border-border-subtle shrink-0 group-hover:ring-2 group-hover:ring-brand-gold transition-all">
              <div class="min-w-0">
                <div class="text-xs font-bold text-text-main group-hover:text-brand-gold transition-colors truncate">
                  ${instructorName}
                </div>
                <div class="text-[10px] text-text-muted truncate">
                  ${instructorTitle}
                </div>
              </div>
            </a>

            <!-- Course Title & Subtitle -->
            <div>
              <h3 class="text-base font-extrabold text-text-main leading-snug hover:text-brand-gold transition-colors line-clamp-2">
                ${title}
              </h3>
              <p class="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                ${subtitle}
              </p>
            </div>

            <!-- Course Key Metadata Matrix -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-[11px]">
              <div class="flex items-center gap-1.5 text-text-muted">
                <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span class="truncate">${durationLabel}</span>
              </div>
              
              <div class="flex items-center gap-1.5 text-text-muted">
                <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                <span class="truncate">${totalModules} ${isAr ? 'وحدات' : 'Modules'} • ${totalLessons} ${isAr ? 'دروس' : 'Lessons'}</span>
              </div>

              <div class="flex items-center gap-1.5 text-text-muted col-span-2">
                <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                <span class="truncate">${scheduleLabel}</span>
              </div>
            </div>
          </div>

          <!-- Pricing & Action Buttons Section -->
          <div class="pt-4 border-t border-border-subtle space-y-3">
            <div class="flex items-baseline justify-between">
              <div>
                <span class="text-xs text-text-muted block">${isAr ? 'رسوم الاستثمار المهني' : 'Tuition Fee'}</span>
                <span class="text-xl font-extrabold text-brand-gold tracking-tight">${course.price_formatted || (course.price + ' SAR')}</span>
              </div>
              <div class="text-end">
                <span class="text-[10px] font-semibold text-text-muted uppercase px-2 py-0.5 bg-surface-2 rounded border border-border-subtle">
                  ${isAr ? 'فوج محدود' : 'Small Cohort'}
                </span>
              </div>
            </div>

            <!-- Action Controls Grid -->
            <div class="grid grid-cols-2 gap-2">
              <button type="button" 
                      data-action="view-curriculum" 
                      data-course-id="${course.id}"
                      class="px-3 py-2 text-xs font-bold text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold flex items-center justify-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span>${isAr ? 'المنهج والمحاور' : 'Syllabus'}</span>
              </button>

              ${enrollControl}
            </div>
          </div>

        </div>

      </article>
    `;
  }

  /**
   * Render dynamic empty state when no courses match query/filter
   * @param {boolean} isAr 
   * @returns {string}
   */
  static renderEmptyState(isAr) {
    return `
      <div class="col-span-full py-16 px-4 text-center bg-surface-1 border border-border-subtle rounded-2xl space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-surface-2 text-brand-gold flex items-center justify-center mx-auto border border-border-subtle">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
        <div class="space-y-1">
          <h3 class="text-base font-bold text-text-main">
            ${isAr ? 'لم نعثر على دورات تطابق معايير البحث' : 'No matching masterclasses found'}
          </h3>
          <p class="text-xs text-text-muted max-w-md mx-auto">
            ${isAr ? 'جرّب تعديل كلمات البحث أو اختيار تصنيف ومستوى آخر لاستكشاف ورش العمل المتاحة.' : 'Try adjusting your search query or selecting a different category or skill level.'}
          </p>
        </div>
        <button type="button" 
                data-action="reset-filters" 
                class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-brand-gold hover:bg-brand-gold-hover text-white rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          <span>${isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
        </button>
      </div>
    `;
  }

  /**
   * Render Course Curriculum & Syllabus Modal Content
   * @param {string} courseId 
   */
  static renderCurriculumModal(courseId) {
    const modal = document.getElementById('course-curriculum-modal');
    if (!modal) return;

    const course = (COURSE_FIXTURES || []).find(c => c.id === courseId);
    if (!course) return;

    const isAr = I18n.getLang() === 'ar';
    const title = isAr ? course.title_ar : course.title_en;
    const subtitle = isAr ? course.subtitle_ar : course.subtitle_en;
    const instructorName = isAr ? course.instructor_name_ar : course.instructor_name_en;
    const instructorTitle = isAr ? course.instructor_title_ar : course.instructor_title_en;
    const levelLabel = isAr ? course.level_ar : course.level_en;
    const durationLabel = isAr ? course.duration_ar : course.duration_en;
    const scheduleLabel = isAr ? course.schedule_ar : course.schedule_en;
    const isEnrolled = this.isEnrolled(course.id);
    const enrollControl = isCurrentUserId(course.instructor_id, USER_FIXTURES) ? '' : `
      <button type="button"
              data-action="open-enroll"
              data-course-id="${course.id}"
              class="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold text-white ${isEnrolled ? 'bg-brand-emerald hover:bg-brand-emerald-hover' : 'bg-brand-gold hover:bg-brand-gold-hover'} rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
        <span>${isEnrolled ? (isAr ? 'أنت مسجل بالفوج' : 'Enrolled') : (isAr ? 'التسجيل في الورشة' : 'Enroll in Workshop')}</span>
      </button>
    `;

    const syllabusHtml = (course.syllabus || []).map((mod) => {
      const modTitle = isAr ? mod.title_ar : mod.title_en;
      const modDuration = isAr ? mod.duration_ar : mod.duration_en;
      const lessons = mod.lessons || [];

      const lessonsHtml = lessons.map((les, lIdx) => {
        const lesTitle = isAr ? les.title_ar : les.title_en;
        const lesDuration = isAr ? les.duration_ar : les.duration_en;
        return `
          <div class="flex items-start justify-between gap-3 p-3 bg-surface-1 border border-border-subtle rounded-xl text-start">
            <div class="flex items-start gap-2.5 min-w-0">
              <span class="w-5 h-5 rounded-full bg-surface-2 text-brand-gold text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-border-subtle">
                ${lIdx + 1}
              </span>
              <span class="text-xs font-medium text-text-main leading-relaxed">${lesTitle}</span>
            </div>
            <span class="text-[10px] font-semibold text-text-muted bg-surface-2 px-2 py-0.5 rounded shrink-0 border border-border-subtle">
              ${lesDuration}
            </span>
          </div>
        `;
      }).join('');

      return `
        <div class="border border-border-subtle rounded-xl p-4 bg-surface-2 space-y-3 text-start">
          <div class="flex items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-brand-gold text-white uppercase tracking-wider">
                ${isAr ? `الوحدة ${mod.module_number}` : `Module ${mod.module_number}`}
              </span>
              <h4 class="text-xs sm:text-sm font-bold text-text-main">${modTitle}</h4>
            </div>
            <span class="text-xs font-semibold text-brand-gold shrink-0">${modDuration}</span>
          </div>
          
          <div class="space-y-2">
            ${lessonsHtml}
          </div>
        </div>
      `;
    }).join('');

    const modalBody = modal.querySelector('[data-modal-body]');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="space-y-6 text-start">
          
          <!-- Masterclass Header Details -->
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-surface-2 text-brand-gold border border-border-subtle">
                ${levelLabel}
              </span>
              <span class="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-surface-2 text-text-muted border border-border-subtle">
                ${durationLabel}
              </span>
              <span class="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-surface-2 text-text-muted border border-border-subtle">
                ${course.seats_left} ${isAr ? 'مقاعد شاغرة' : 'seats left'}
              </span>
            </div>
            <h2 class="text-lg sm:text-xl font-extrabold text-text-main">${title}</h2>
            <p class="text-xs sm:text-sm text-text-muted leading-relaxed">${subtitle}</p>
          </div>

          <!-- Instructor Profile Card -->
          <div class="flex items-center justify-between p-3.5 bg-surface-2 border border-border-subtle rounded-xl">
            <div class="flex items-center gap-3 min-w-0">
              <img src="${course.instructor_avatar}" 
                   alt="${instructorName}" 
                   class="w-11 h-11 rounded-xl object-cover border border-border-subtle shrink-0">
              <div class="min-w-0">
                <div class="text-xs font-bold text-text-main truncate">${instructorName}</div>
                <div class="text-[11px] text-text-muted truncate">${instructorTitle}</div>
              </div>
            </div>
            <a href="chef.html?id=${course.instructor_id}" 
               class="px-3 py-1.5 text-xs font-semibold text-brand-gold bg-surface-1 border border-border-subtle rounded-lg hover:bg-surface-2 transition-colors shrink-0">
              ${isAr ? 'ملف الشيف' : 'Chef Profile'}
            </a>
          </div>

          <!-- Schedule & Live Details Box -->
          <div class="p-3.5 bg-surface-2 border border-border-subtle rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <div>
                <span class="text-text-muted block text-[10px]">${isAr ? 'تاريخ الانطلاق' : 'Cohort Start Date'}</span>
                <span class="font-bold text-text-main">${course.start_date}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div>
                <span class="text-text-muted block text-[10px]">${isAr ? 'المواعيد الأسبوعية' : 'Live Schedule'}</span>
                <span class="font-bold text-text-main">${scheduleLabel}</span>
              </div>
            </div>
          </div>

          <!-- Syllabus Modules Section -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-text-main flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                <span>${isAr ? 'المنهج التدريبي والمحاور التطبيقية' : 'Curriculum & Hands-on Modules'}</span>
              </h3>
              <span class="text-[11px] text-text-muted">${(course.syllabus || []).length} ${isAr ? 'وحدات معتمدة' : 'Accredited Modules'}</span>
            </div>

            <div class="space-y-3">
              ${syllabusHtml}
            </div>
          </div>

          <!-- Bottom Price & Enrollment Bar -->
          <div class="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span class="text-[10px] text-text-muted block">${isAr ? 'الرسوم الإجمالية (شامل الضريبة والاعتماد)' : 'Total Tuition (VAT & Certificate Included)'}</span>
              <span class="text-2xl font-extrabold text-brand-gold">${course.price_formatted || (course.price + ' SAR')}</span>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button type="button" data-modal-close class="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-text-muted bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl transition-colors">
                ${isAr ? 'إغلاق' : 'Close'}
              </button>

              ${enrollControl}
            </div>
          </div>

        </div>
      `;
    }

    Modal.open('course-curriculum-modal');
  }

  /**
   * Render 1-Click Masterclass Enrollment Modal Content
   * @param {string} courseId 
   */
  static renderEnrollModal(courseId) {
    const modal = document.getElementById('course-enroll-modal');
    if (!modal) return;

    const course = (COURSE_FIXTURES || []).find(c => c.id === courseId);
    if (!course) return;
    if (isCurrentUserId(course.instructor_id, USER_FIXTURES)) return;

    const isAr = I18n.getLang() === 'ar';
    const title = isAr ? course.title_ar : course.title_en;
    const instructorName = isAr ? course.instructor_name_ar : course.instructor_name_en;
    const scheduleLabel = isAr ? course.schedule_ar : course.schedule_en;
    const isEnrolled = this.isEnrolled(course.id);

    // Default logged in user data
    const user = USER_FIXTURES || {};
    const defaultName = isAr ? (user.name_ar || 'الشيف فيصل الهاشمي') : (user.name_en || 'Chef Faisal Al-Hashemi');
    const defaultEmail = user.email || 'faisal@meyar.sa';
    const defaultRole = isAr ? (user.title_ar || 'شيف تنفيذي ومستشار طهي') : (user.title_en || 'Executive Chef & Culinary Consultant');

    const vatAmount = Math.round((course.price || 0) * 0.15);
    const baseTuition = (course.price || 0) - vatAmount;

    const modalBody = modal.querySelector('[data-modal-body]');
    if (modalBody) {
      modalBody.innerHTML = `
        <form id="course-enroll-form" data-course-id="${course.id}" class="space-y-5 text-start">
          
          <!-- Masterclass Summary Card -->
          <div class="flex items-center gap-3.5 p-3.5 bg-surface-2 border border-border-subtle rounded-xl">
            <img src="${course.image}" 
                 alt="${title}" 
                 class="w-14 h-14 rounded-xl object-cover border border-border-subtle shrink-0">
            <div class="min-w-0 flex-1">
              <span class="text-[10px] font-bold text-brand-gold uppercase tracking-wider block">
                ${isAr ? course.level_ar : course.level_en}
              </span>
              <h3 class="text-xs sm:text-sm font-bold text-text-main truncate">${title}</h3>
              <div class="text-[11px] text-text-muted mt-0.5 truncate">${isAr ? 'المدرب:' : 'Instructor:'} ${instructorName}</div>
            </div>
            <div class="text-end shrink-0 ps-2">
              <span class="text-xs sm:text-sm font-extrabold text-brand-gold">${course.price_formatted || (course.price + ' SAR')}</span>
            </div>
          </div>

          <!-- Schedule & Cohort Selector -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-text-main">
              ${isAr ? 'اختر موعد الفوج التدريبي' : 'Select Cohort & Schedule'}
            </label>
            
            <div class="space-y-2">
              <!-- Primary Cohort Option -->
              <label class="flex items-center justify-between p-3 bg-surface-1 border-2 border-brand-gold rounded-xl cursor-pointer">
                <div class="flex items-center gap-2.5">
                  <input type="radio" name="enroll_cohort" value="cohort-1" checked class="text-brand-gold focus:ring-brand-gold">
                  <div>
                    <span class="text-xs font-bold text-text-main block">${isAr ? 'الفوج الأساسي المباشر' : 'Live Interactive Cohort'} (${course.start_date})</span>
                    <span class="text-[11px] text-text-muted">${scheduleLabel}</span>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-brand-emerald px-2 py-0.5 bg-surface-2 rounded-md border border-brand-emerald">
                  ${course.seats_left} ${isAr ? 'مقاعد شاغرة' : 'seats left'}
                </span>
              </label>

              <!-- Secondary Alternate Weekend Cohort -->
              <label class="flex items-center justify-between p-3 bg-surface-1 border border-border-subtle rounded-xl cursor-pointer hover:border-border-subtle">
                <div class="flex items-center gap-2.5">
                  <input type="radio" name="enroll_cohort" value="cohort-2" class="text-brand-gold focus:ring-brand-gold">
                  <div>
                    <span class="text-xs font-bold text-text-main block">${isAr ? 'الفوج المكثف للمحترفين' : 'Weekend Intensive Track'} (2026-10-15)</span>
                    <span class="text-[11px] text-text-muted">${isAr ? 'كل سبت (10:00 ص - 2:00 م بتوقيت الرياض)' : 'Every Saturday (10:00 AM - 2:00 PM AST)'}</span>
                  </div>
                </div>
                <span class="text-[10px] font-medium text-text-muted px-2 py-0.5 bg-surface-2 rounded-md border border-border-subtle">
                  ${isAr ? 'متاح للحجز' : 'Open'}
                </span>
              </label>
            </div>
          </div>

          <!-- Student & Attendee Credentials -->
          <div class="space-y-3 pt-2 border-t border-border-subtle">
            <h4 class="text-xs font-bold text-text-main">${isAr ? 'بيانات المتدرب / الشيف' : 'Student & Attendee Details'}</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="enroll-student-name" class="block text-[11px] font-medium text-text-muted mb-1">
                  ${isAr ? 'الاسم الكامل (لإصدار الشهادة)' : 'Full Name (For Certificate)'} <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       id="enroll-student-name" 
                       name="student_name" 
                       required 
                       value="${defaultName}"
                       class="w-full px-3 py-2 text-xs bg-surface-1 border border-border-subtle rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-brand-gold">
              </div>

              <div>
                <label for="enroll-student-email" class="block text-[11px] font-medium text-text-muted mb-1">
                  ${isAr ? 'البريد الإلكتروني المهني' : 'Professional Email'} <span class="text-red-500">*</span>
                </label>
                <input type="email" 
                       id="enroll-student-email" 
                       name="student_email" 
                       required 
                       value="${defaultEmail}"
                       class="w-full px-3 py-2 text-xs bg-surface-1 border border-border-subtle rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-brand-gold">
              </div>
            </div>

            <div>
              <label for="enroll-student-role" class="block text-[11px] font-medium text-text-muted mb-1">
                ${isAr ? 'المسمى الوظيفي / مجال الخبرة في المطبخ' : 'Culinary Role & Experience'}
              </label>
              <input type="text" 
                     id="enroll-student-role" 
                     name="student_role" 
                     value="${defaultRole}"
                     placeholder="${isAr ? 'مثال: شيف تنفيذي، مالك مطعم، خباز محترف...' : 'e.g. Executive Chef, Restaurant Owner, Pastry Chef...'}"
                     class="w-full px-3 py-2 text-xs bg-surface-1 border border-border-subtle rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-brand-gold">
            </div>

            <div>
              <label for="enroll-special-notes" class="block text-[11px] font-medium text-text-muted mb-1">
                ${isAr ? 'ملاحظات إضافية أو أهداف تطويرية خاصة' : 'Special Goals or Kitchen Notes'}
              </label>
              <textarea id="enroll-special-notes" 
                        name="special_notes" 
                        rows="2"
                        placeholder="${isAr ? 'أي متطلبات خاصة أو أجهزة تود التركيز عليها خلال الورشة...' : 'Any equipment or techniques you wish to focus on...'}"
                        class="w-full px-3 py-2 text-xs bg-surface-1 border border-border-subtle rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"></textarea>
            </div>
          </div>

          <!-- Tuition Summary Breakdown -->
          <div class="p-3.5 bg-surface-2 border border-border-subtle rounded-xl space-y-2 text-xs">
            <div class="flex items-center justify-between text-text-muted">
              <span>${isAr ? 'رسوم الدورة التدريبية' : 'Tuition Base'}</span>
              <span>${baseTuition.toLocaleString()} SAR</span>
            </div>
            <div class="flex items-center justify-between text-text-muted">
              <span>${isAr ? 'شهادة الاعتماد المهني والمواد' : 'Accreditation & Lab Materials'}</span>
              <span class="text-brand-emerald font-semibold">${isAr ? 'مشمولة (مجاناً)' : 'Included (Free)'}</span>
            </div>
            <div class="flex items-center justify-between text-text-muted">
              <span>${isAr ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}</span>
              <span>${vatAmount.toLocaleString()} SAR</span>
            </div>
            <div class="border-t border-border-subtle pt-2 flex items-center justify-between font-extrabold text-sm text-text-main">
              <span>${isAr ? 'المجموع النهائي' : 'Total Amount'}</span>
              <span class="text-brand-gold text-base">${course.price_formatted || (course.price + ' SAR')}</span>
            </div>
          </div>

          <!-- Modal Form Submission Actions -->
          <div class="pt-3 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
            ${isEnrolled ? `
              <button type="button" 
                      data-action="cancel-enroll" 
                      data-course-id="${course.id}"
                      class="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-red-500 bg-surface-2 hover:bg-surface-2 border border-red-500 rounded-xl transition-colors">
                ${isAr ? 'إلغاء التسجيل في هذه الدورة' : 'Cancel My Enrollment'}
              </button>
            ` : '<div></div>'}

            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button type="button" data-modal-close class="px-4 py-2.5 text-xs font-semibold text-text-muted bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl transition-colors">
                ${isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button type="submit" 
                      data-action="submit-enroll"
                      class="px-6 py-2.5 text-xs font-extrabold text-white bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${isEnrolled ? (isAr ? 'تحديث بيانات التسجيل' : 'Update Registration') : (isAr ? 'تأكيد التسجيل الفوري' : 'Confirm Instant Enrollment')}</span>
              </button>
            </div>
          </div>

        </form>
      `;
    }

    Modal.open('course-enroll-modal');
  }

  /**
   * Main render function: filters courses and updates grid and counter
   */
  static render() {
    const gridContainer = document.getElementById('courses-grid-container');
    const countLabel = document.getElementById('courses-count-label');
    const isAr = I18n.getLang() === 'ar';

    const filtered = this.filterCourses();

    if (countLabel) {
      const count = filtered.length;
      countLabel.textContent = isAr 
        ? `عرض ${count} ورشة عمل معتمدة` 
        : `Showing ${count} accredited masterclasses`;
    }

    if (!gridContainer) return;

    if (filtered.length === 0) {
      gridContainer.innerHTML = this.renderEmptyState(isAr);
    } else {
      gridContainer.innerHTML = filtered.map(c => this.renderCourseCard(c, isAr)).join('');
    }

    this.updateSaveButtonStates();
  }

  /**
   * Share course link helper
   * @param {string} courseId 
   */
  static shareCourse(courseId) {
    if (!courseId) return;
    const isAr = I18n.getLang() === 'ar';
    const url = `${window.location.origin}${window.location.pathname}?id=${courseId}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        Toast.success(isAr ? 'تم نسخ رابط ورشة العمل بنجاح' : 'Masterclass link copied to clipboard');
      }).catch(() => {
        Toast.info(url);
      });
    } else {
      Toast.info(url);
    }
  }

  /**
   * Initialize all event handlers and query string parameters
   */
  static init() {
    if (this.isInitialized) return;
    if (typeof document === 'undefined') return;

    this.isInitialized = true;

    // 1. Category Filter Pill Click Listeners
    document.querySelectorAll('[data-course-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = btn.getAttribute('data-course-filter') || 'all';
        this.currentCategory = cat;

        document.querySelectorAll('[data-course-filter]').forEach(b => {
          b.classList.remove('bg-brand-gold', 'text-white', 'border-brand-gold');
          b.classList.add('bg-surface-1', 'text-text-muted', 'border-border-subtle');
        });

        btn.classList.remove('bg-surface-1', 'text-text-muted', 'border-border-subtle');
        btn.classList.add('bg-brand-gold', 'text-white', 'border-brand-gold');

        this.render();
      });
    });

    // 2. Skill Level Filter Select / Buttons
    const levelSelect = document.getElementById('courses-level-select');
    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        this.currentLevel = e.target.value;
        this.render();
      });
    }

    // 3. Sort Select Listener
    const sortSelect = document.getElementById('courses-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    // 4. Keyword Search Input Listener
    const searchInput = document.getElementById('courses-search-input');
    const searchClear = document.getElementById('courses-search-clear');

    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        this.searchQuery = val;

        if (searchClear) {
          if (val.trim()) {
            searchClear.classList.remove('hidden');
          } else {
            searchClear.classList.add('hidden');
          }
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.render();
        }, 150);
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        searchClear.classList.add('hidden');
        this.render();
        searchInput.focus();
      });
    }

    // 5. Global Action Delegations
    document.addEventListener('click', (e) => {
      // View Curriculum
      const curriculumBtn = e.target.closest('[data-action="view-curriculum"]');
      if (curriculumBtn) {
        e.preventDefault();
        const courseId = curriculumBtn.getAttribute('data-course-id');
        this.renderCurriculumModal(courseId);
        return;
      }

      // Open Enroll Modal
      const enrollBtn = e.target.closest('[data-action="open-enroll"]');
      if (enrollBtn) {
        e.preventDefault();
        const courseId = enrollBtn.getAttribute('data-course-id');
        this.renderEnrollModal(courseId);
        return;
      }

      // Toggle Bookmark/Save
      const saveBtn = e.target.closest('[data-action="toggle-save-course"]');
      if (saveBtn) {
        e.preventDefault();
        const courseId = saveBtn.getAttribute('data-course-id');
        this.toggleSaveCourse(courseId);
        return;
      }

      // Share Masterclass
      const shareBtn = e.target.closest('[data-action="share-course"]');
      if (shareBtn) {
        e.preventDefault();
        const courseId = shareBtn.getAttribute('data-course-id');
        this.shareCourse(courseId);
        return;
      }

      // Cancel Enrollment
      const cancelBtn = e.target.closest('[data-action="cancel-enroll"]');
      if (cancelBtn) {
        e.preventDefault();
        const courseId = cancelBtn.getAttribute('data-course-id');
        this.cancelEnrollment(courseId);
        Modal.close('course-enroll-modal');
        return;
      }

      // Reset Filters
      const resetBtn = e.target.closest('[data-action="reset-filters"]');
      if (resetBtn) {
        e.preventDefault();
        this.currentCategory = 'all';
        this.currentLevel = 'all';
        this.searchQuery = '';
        this.sortBy = 'popular';
        this.filterAvailableOnly = false;

        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.classList.add('hidden');
        if (levelSelect) levelSelect.value = 'all';
        if (sortSelect) sortSelect.value = 'popular';

        document.querySelectorAll('[data-course-filter]').forEach(b => {
          const isAll = (b.getAttribute('data-course-filter') || '') === 'all';
          if (isAll) {
            b.classList.remove('bg-surface-1', 'text-text-muted', 'border-border-subtle');
            b.classList.add('bg-brand-gold', 'text-white', 'border-brand-gold');
          } else {
            b.classList.remove('bg-brand-gold', 'text-white', 'border-brand-gold');
            b.classList.add('bg-surface-1', 'text-text-muted', 'border-border-subtle');
          }
        });

        this.render();
        return;
      }
    });

    // 6. Form Submission for Enrollment
    document.addEventListener('submit', (e) => {
      const enrollForm = e.target.closest('#course-enroll-form');
      if (enrollForm) {
        e.preventDefault();
        const courseId = enrollForm.getAttribute('data-course-id');
        const formData = new FormData(enrollForm);
        const details = {
          student_name: formData.get('student_name'),
          student_email: formData.get('student_email'),
          student_role: formData.get('student_role'),
          special_notes: formData.get('special_notes'),
          cohort: formData.get('enroll_cohort')
        };

        this.enrollInCourse(courseId, details);
        Modal.close('course-enroll-modal');
      }
    });

    // 7. Dynamic Re-rendering on Language Changes
    window.addEventListener('meyar:lang-changed', () => {
      this.render();
      // If modal is open, refresh it
      if (Modal.activeModal && Modal.activeModal.id === 'course-curriculum-modal') {
        const enrollBtn = Modal.activeModal.querySelector('[data-course-id]');
        if (enrollBtn) {
          const cId = enrollBtn.getAttribute('data-course-id');
          this.renderCurriculumModal(cId);
        }
      }
    });

    // 8. Parse URL Parameters on initial load
    if (typeof window !== 'undefined' && window.location) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const queryId = urlParams.get('id');
        const enrollId = urlParams.get('enroll');
        const cat = urlParams.get('category');

        if (cat) {
          this.currentCategory = cat;
          const targetPill = document.querySelector(`[data-course-filter="${cat}"]`);
          if (targetPill) {
            document.querySelectorAll('[data-course-filter]').forEach(b => {
              b.classList.remove('bg-brand-gold', 'text-white', 'border-brand-gold');
              b.classList.add('bg-surface-1', 'text-text-muted', 'border-border-subtle');
            });
            targetPill.classList.remove('bg-surface-1', 'text-text-muted', 'border-border-subtle');
            targetPill.classList.add('bg-brand-gold', 'text-white', 'border-brand-gold');
          }
        }

        this.render();

        if (enrollId) {
          setTimeout(() => this.renderEnrollModal(enrollId), 100);
        } else if (queryId) {
          setTimeout(() => this.renderCurriculumModal(queryId), 100);
        }
      } catch (e) {
        this.render();
      }
    } else {
      this.render();
    }
  }
}

export function initCoursesPage() {
  CoursesPage.init();
}
