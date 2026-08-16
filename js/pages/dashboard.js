/**
 * Meyar (معيار) Creator & Supplier Analytics and Operations Dashboard
 * Controller for KPI analytics, interactive SVG performance charts,
 * tabbed operational tables (Recipes, Supplies, RFQs, Enrollments),
 * status workflows, item actions, quotation modals, and bilingual re-rendering.
 */

import {
  DASHBOARD_ENROLLMENT_FIXTURES,
  DASHBOARD_PERIOD_FIXTURES,
  DASHBOARD_RFQ_FIXTURES,
  RECIPE_FIXTURES,
  STAT_FIXTURES,
  SUPPLY_FIXTURES,
  USER_FIXTURES
} from '../data/fixtures/index.js';
import { I18n } from '../core/i18n.js';
import { Toast } from '../core/toast.js';
import { Modal } from '../core/modal.js';
import { normalizeSearchQuery } from '../modules/search.js';

export class DashboardPage {
  static currentPeriod = '30d'; // '7d' | '30d' | '6m' | '1y'
  static activeTab = 'recipes'; // 'recipes' | 'supplies' | 'rfqs' | 'enrollments'
  static searchQuery = '';
  static statusFilter = 'all';
  static currentPage = 1;
  static pageSize = 10;
  static isInitialized = false;

  static recipesStore = null;
  static suppliesStore = null;
  static rfqsStore = null;
  static enrollmentsStore = null;

  /**
   * Reset in-memory dashboard stores (for test isolation)
   */
  static reset() {
    this.recipesStore = null;
    this.suppliesStore = null;
    this.rfqsStore = null;
    this.enrollmentsStore = null;
    this.currentPeriod = '30d';
    this.activeTab = 'recipes';
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.isInitialized = false;
  }

  /**
   * Period multipliers and dataset configurations
   */
  static PERIOD_CONFIGS = DASHBOARD_PERIOD_FIXTURES;

  /**
   * Initialize initial datasets for Dashboard items
   */
  static getRecipes() {
    if (this.recipesStore) {
      return this.recipesStore;
    }

    const defaults = (RECIPE_FIXTURES || []).map((r, idx) => ({
      id: r.id,
      title_ar: r.title_ar,
      title_en: r.title_en,
      image: r.image,
      category_ar: r.category_ar || 'أطباق رئيسية',
      category_en: r.category_en || 'Main Course',
      difficulty: r.difficulty || 'medium',
      views: 1200 + (idx * 340),
      likes: 180 + (idx * 45),
      status: idx === 1 || idx === 4 ? 'draft' : 'published',
      updated_at: '2026-08-12'
    }));

    this.recipesStore = defaults;
    return defaults;
  }

  static saveRecipes(recipes) {
    this.recipesStore = recipes;
  }

  static getSupplies() {
    if (this.suppliesStore) {
      return this.suppliesStore;
    }

    const defaults = (SUPPLY_FIXTURES || []).map((s, idx) => ({
      id: s.id,
      name_ar: s.name_ar,
      name_en: s.name_en,
      category: s.category || 'heavy_equipment',
      category_ar: s.category_ar || 'معدات المطابخ',
      category_en: s.category_en || 'Kitchen Equipment',
      price: s.price || 12000,
      price_formatted: s.price_formatted || `${s.price} ر.س`,
      moq: s.moq || 1,
      in_stock: s.in_stock !== false,
      stock_count: s.stock_count || (idx === 2 ? 2 : 12),
      stock_status: idx === 2 ? 'low_stock' : (s.in_stock === false ? 'out_of_stock' : 'in_stock'),
      status: idx === 3 ? 'paused' : 'active',
      inquiries: 14 + (idx * 3),
      image: s.image,
      lead_time_ar: s.lead_time_ar || '3-5 أيام عمل',
      lead_time_en: s.lead_time_en || '3-5 Business Days',
      updated_at: '2026-08-10'
    }));

    this.suppliesStore = defaults;
    return defaults;
  }

  static saveSupplies(supplies) {
    this.suppliesStore = supplies;
  }

  static getRFQs() {
    if (this.rfqsStore) {
      return this.rfqsStore;
    }

    const defaults = JSON.parse(JSON.stringify(DASHBOARD_RFQ_FIXTURES || []));

    this.rfqsStore = defaults;
    return defaults;
  }

  static saveRFQs(rfqs) {
    this.rfqsStore = rfqs;
  }

  static getEnrollments() {
    if (this.enrollmentsStore) {
      return this.enrollmentsStore;
    }

    const defaults = JSON.parse(JSON.stringify(DASHBOARD_ENROLLMENT_FIXTURES || []));

    this.enrollmentsStore = defaults;
    return defaults;
  }

  static saveEnrollments(enrollments) {
    this.enrollmentsStore = enrollments;
  }

  /**
   * Main Initialize Method
   */
  static init() {
    if (typeof document !== 'undefined' && this.lastDocument !== document) {
      this.isInitialized = false;
      this.lastDocument = document;
    }
    if (this.isInitialized) return;
    if (typeof document === 'undefined') return;

    this.bindEvents();
    this.renderAll();
    this.isInitialized = true;
  }

  /**
   * Bind event listeners for periods, tabs, filters, search, and modals
   */
  static bindEvents() {
    // 1. Period Selector Buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const period = btn.getAttribute('data-period');
        if (period && this.PERIOD_CONFIGS[period]) {
          this.setPeriod(period);
        }
      });
    });

    // 2. Tab Switcher Buttons
    document.querySelectorAll('.dashboard-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          this.setActiveTab(tab);
        }
      });
    });

    // 3. Search Input
    const searchInput = document.getElementById('dashboard-table-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.renderTable();
      });
    }

    // 4. Status Filter Select
    const statusSelect = document.getElementById('dashboard-status-filter');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.currentPage = 1;
        this.renderTable();
      });
    }

    // 5. Pagination Buttons
    const prevBtn = document.getElementById('btn-table-prev');
    const nextBtn = document.getElementById('btn-table-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTable();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = this.getTotalPages();
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderTable();
        }
      });
    }

    // 6. Add Supply Modal Open/Submit
    const openAddSupplyBtn = document.getElementById('btn-open-add-supply');
    if (openAddSupplyBtn) {
      openAddSupplyBtn.addEventListener('click', () => {
        Modal.open('modal-add-supply');
      });
    }

    const formAddSupply = document.getElementById('form-add-supply');
    if (formAddSupply) {
      formAddSupply.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddSupplySubmit(formAddSupply);
      });
    }

    // 7. RFQ Response Modal Form Submit
    const formRfqResponse = document.getElementById('form-rfq-response');
    if (formRfqResponse) {
      formRfqResponse.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRfqResponseSubmit(formRfqResponse);
      });
    }

    // 8. Delete Confirm Button
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', () => {
        this.handleConfirmDelete();
      });
    }

    // 9. Export Report Button
    const btnExportReport = document.getElementById('btn-export-report');
    if (btnExportReport) {
      btnExportReport.addEventListener('click', () => {
        this.handleExportReport();
      });
    }

    // 10. Re-render on language / theme change
    window.addEventListener('meyar:lang-changed', () => {
      this.renderAll();
    });
    window.addEventListener('meyar:theme-changed', () => {
      this.renderCharts();
    });
  }

  /**
   * Set metrics period (7d, 30d, 6m, 1y)
   */
  static setPeriod(period) {
    this.currentPeriod = period;

    // Update active button styles
    document.querySelectorAll('.period-btn').forEach(btn => {
      const p = btn.getAttribute('data-period');
      if (p === period) {
        btn.classList.add('bg-brand-gold', 'text-white', 'shadow-sm', 'font-bold');
        btn.classList.remove('text-text-muted', 'font-semibold');
      } else {
        btn.classList.remove('bg-brand-gold', 'text-white', 'shadow-sm', 'font-bold');
        btn.classList.add('text-text-muted', 'font-semibold');
      }
    });

    this.renderKPIs();
    this.renderCharts();
  }

  /**
   * Set Active Tab and update table
   */
  static setActiveTab(tab) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.statusFilter = 'all';

    // Update tab button styles
    document.querySelectorAll('.dashboard-tab-btn').forEach(btn => {
      const t = btn.getAttribute('data-tab');
      const isSelected = t === tab;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');

      const counter = btn.querySelector('.tab-counter');
      if (isSelected) {
        btn.classList.add('bg-brand-gold', 'text-white', 'shadow-md', 'font-bold');
        btn.classList.remove('text-text-muted', 'hover:bg-surface-2', 'font-semibold');
        if (counter) {
          counter.classList.add('bg-surface-2', 'text-white');
          counter.classList.remove('bg-surface-2', 'text-text-muted');
        }
      } else {
        btn.classList.remove('bg-brand-gold', 'text-white', 'shadow-md', 'font-bold');
        btn.classList.add('text-text-muted', 'hover:bg-surface-2', 'font-semibold');
        if (counter) {
          counter.classList.remove('bg-surface-2', 'text-white');
          counter.classList.add('bg-surface-2', 'text-text-muted');
        }
      }
    });

    // Dynamically populate status dropdown for current tab
    this.updateStatusDropdown();
    this.renderTable();
  }

  /**
   * Dynamically update the status dropdown options based on active tab
   */
  static updateStatusDropdown() {
    const statusSelect = document.getElementById('dashboard-status-filter');
    if (!statusSelect) return;

    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    let options = [];
    if (this.activeTab === 'recipes') {
      options = [
        { value: 'all', label: isAr ? 'كافة الحالات' : 'All Statuses' },
        { value: 'published', label: isAr ? 'منشورة' : 'Published' },
        { value: 'draft', label: isAr ? 'مسودة' : 'Draft' }
      ];
    } else if (this.activeTab === 'supplies') {
      options = [
        { value: 'all', label: isAr ? 'كافة الحالات' : 'All Statuses' },
        { value: 'active', label: isAr ? 'نشط' : 'Active' },
        { value: 'paused', label: isAr ? 'متوقف' : 'Paused' },
        { value: 'in_stock', label: isAr ? 'متوفر بالمخزن' : 'In Stock' },
        { value: 'low_stock', label: isAr ? 'مخزون منخفض' : 'Low Stock' },
        { value: 'out_of_stock', label: isAr ? 'نفد المخزون' : 'Out of Stock' }
      ];
    } else if (this.activeTab === 'rfqs') {
      options = [
        { value: 'all', label: isAr ? 'كافة الحالات' : 'All Statuses' },
        { value: 'pending', label: isAr ? 'قيد المراجعة' : 'Pending' },
        { value: 'quoted', label: isAr ? 'تم التسعير' : 'Quoted' },
        { value: 'accepted', label: isAr ? 'مقبول' : 'Accepted' },
        { value: 'rejected', label: isAr ? 'مرفوض' : 'Rejected' }
      ];
    } else if (this.activeTab === 'enrollments') {
      options = [
        { value: 'all', label: isAr ? 'كافة الحالات' : 'All Statuses' },
        { value: 'paid', label: isAr ? 'مدفوع ومؤكد' : 'Paid & Confirmed' },
        { value: 'confirmed', label: isAr ? 'مؤكد' : 'Confirmed' }
      ];
    }

    statusSelect.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
    statusSelect.value = 'all';
  }

  /**
   * Render All Dashboard Sections
   */
  static renderAll() {
    this.renderKPIs();
    this.renderCharts();
    this.updateTabCounters();
    this.updateStatusDropdown();
    this.renderTable();
  }

  /**
   * Render KPI summary metrics cards
   */
  static renderKPIs() {
    const config = this.PERIOD_CONFIGS[this.currentPeriod] || this.PERIOD_CONFIGS['30d'];
    const baseStats = STAT_FIXTURES?.kpis || {};

    const views = Math.round(baseStats.views * config.multiplier);
    const impressions = Math.round(baseStats.impressions * config.multiplier);
    const rfqs = Math.round(baseStats.rfqs * config.multiplier);
    const revenue = Math.round(baseStats.revenue * config.multiplier);

    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    const kpiViewsVal = document.getElementById('kpi-views-value');
    const kpiViewsGrowth = document.getElementById('kpi-views-growth');
    const kpiImpVal = document.getElementById('kpi-impressions-value');
    const kpiImpGrowth = document.getElementById('kpi-impressions-growth');
    const kpiRfqsVal = document.getElementById('kpi-rfqs-value');
    const kpiRfqsGrowth = document.getElementById('kpi-rfqs-growth');
    const kpiRevVal = document.getElementById('kpi-revenue-value');
    const kpiRevGrowth = document.getElementById('kpi-revenue-growth');

    if (kpiViewsVal) kpiViewsVal.textContent = views.toLocaleString('en-US');
    if (kpiViewsGrowth) kpiViewsGrowth.innerHTML = `<svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg> ${config.viewsGrowth}`;

    if (kpiImpVal) kpiImpVal.textContent = impressions.toLocaleString('en-US');
    if (kpiImpGrowth) kpiImpGrowth.innerHTML = `<svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg> ${config.impressionsGrowth}`;

    if (kpiRfqsVal) kpiRfqsVal.textContent = rfqs.toLocaleString('en-US');
    if (kpiRfqsGrowth) kpiRfqsGrowth.innerHTML = `<svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg> ${config.rfqsGrowth}`;

    if (kpiRevVal) kpiRevVal.textContent = `${revenue.toLocaleString('en-US')} ${isAr ? 'ر.س' : 'SAR'}`;
    if (kpiRevGrowth) kpiRevGrowth.innerHTML = `<svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg> ${config.revenueGrowth}`;
  }

  /**
   * Update counters for tabs and quick stats bar
   */
  static updateTabCounters() {
    const recipes = this.getRecipes();
    const supplies = this.getSupplies();
    const rfqs = this.getRFQs();
    const enrollments = this.getEnrollments();

    const pendingRfqs = rfqs.filter(r => r.status === 'pending').length;

    // Badges on tabs
    const bRecipes = document.getElementById('badge-count-recipes');
    const bSupplies = document.getElementById('badge-count-supplies');
    const bRfqs = document.getElementById('badge-count-rfqs');
    const bEnrollments = document.getElementById('badge-count-enrollments');

    if (bRecipes) bRecipes.textContent = recipes.length;
    if (bSupplies) bSupplies.textContent = supplies.length;
    if (bRfqs) bRfqs.textContent = rfqs.length;
    if (bEnrollments) bEnrollments.textContent = enrollments.length;

    // Quick Stats Bar
    const qRecipes = document.getElementById('quick-recipes-count');
    const qSupplies = document.getElementById('quick-supplies-count');
    const qRfqs = document.getElementById('quick-rfqs-count');
    const qEnrollments = document.getElementById('quick-enrollments-count');

    if (qRecipes) qRecipes.textContent = recipes.length;
    if (qSupplies) qSupplies.textContent = supplies.length;
    if (qRfqs) qRfqs.textContent = pendingRfqs;
    if (qEnrollments) qEnrollments.textContent = enrollments.length;
  }

  /**
   * Render Interactive SVG Analytics Charts
   */
  static renderCharts() {
    this.renderTrafficChart();
    this.renderRevenueChart();
  }

  /**
   * Generate and mount Traffic & Impressions Interactive SVG Line Chart
   */
  static renderTrafficChart() {
    const container = document.getElementById('dashboard-traffic-chart');
    if (!container) return;

    const config = this.PERIOD_CONFIGS[this.currentPeriod] || this.PERIOD_CONFIGS['30d'];
    const points = config.trafficPoints || [];
    const isDark = document.documentElement.classList.contains('dark');
    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    const width = 700;
    const height = 240;
    const paddingStart = 60;
    const paddingEnd = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartW = width - paddingStart - paddingEnd;
    const chartH = height - paddingTop - paddingBottom;

    // Find max value
    const maxVal = Math.max(...points.map(p => Math.max(p.views, p.impressions)), 1000);
    const maxScale = Math.ceil(maxVal * 1.15);

    // Calculate grid lines (4 horizontal lines)
    const gridLines = [0, 0.33, 0.66, 1.0].map(ratio => {
      const val = Math.round(maxScale * (1 - ratio));
      const y = paddingTop + ratio * chartH;
      return { val, y };
    });

    // Compute coordinate points
    const stepX = points.length > 1 ? chartW / (points.length - 1) : chartW / 2;
    const coords = points.map((p, i) => {
      const x = paddingStart + i * stepX;
      const yViews = paddingTop + chartH - (p.views / maxScale) * chartH;
      const yImp = paddingTop + chartH - (p.impressions / maxScale) * chartH;
      const label = isAr ? p.label_ar : p.label_en;
      return { x, yViews, yImp, label, views: p.views, impressions: p.impressions };
    });

    const viewsPath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.yViews}`).join(' ');
    const impPath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.yImp}`).join(' ');

    const gridColor = isDark ? '#223129' : '#E2E8E4';
    const textColor = isDark ? '#8E9E94' : '#5A6B61';
    const goldColor = isDark ? '#C5A059' : '#A68238';
    const emeraldColor = isDark ? '#10B981' : '#047857';

    let svgHtml = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" preserveAspectRatio="none">
        <!-- Horizontal Grid Lines & Y-Axis Labels -->
        ${gridLines.map(g => `
          <line x1="${paddingStart}" y1="${g.y}" x2="${width - paddingEnd}" y2="${g.y}" stroke="${gridColor}" stroke-width="1" stroke-dasharray="3,3" />
          <text x="${paddingStart - 10}" y="${g.y + 4}" font-size="10" fill="${textColor}" text-anchor="end" font-family="monospace">${g.val >= 1000 ? (g.val / 1000).toFixed(0) + 'k' : g.val}</text>
        `).join('')}

        <!-- Impressions Line (Emerald) -->
        <path d="${impPath}" fill="none" stroke="${emeraldColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Views Line (Gold) -->
        <path d="${viewsPath}" fill="none" stroke="${goldColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        <!-- X-Axis Labels & Data Points -->
        ${coords.map((c, idx) => `
          <text x="${c.x}" y="${height - 10}" font-size="11" fill="${textColor}" text-anchor="middle" font-weight="600">${c.label}</text>
          
          <!-- Data Dots -->
          <circle cx="${c.x}" cy="${c.yImp}" r="4.5" fill="${emeraldColor}" stroke="${isDark ? '#101713' : '#FFFFFF'}" stroke-width="2" class="chart-point transition-transform" />
          <circle cx="${c.x}" cy="${c.yViews}" r="4.5" fill="${goldColor}" stroke="${isDark ? '#101713' : '#FFFFFF'}" stroke-width="2" class="chart-point transition-transform" />

          <!-- Interactive Hover Column trigger -->
          <rect x="${c.x - stepX / 2}" y="${paddingTop}" width="${stepX}" height="${chartH}" fill="transparent" 
                data-idx="${idx}" data-month="${c.label}" data-views="${c.views}" data-imp="${c.impressions}" class="traffic-hover-col cursor-pointer" />
        `).join('')}
      </svg>
    `;

    container.innerHTML = svgHtml;

    // Attach Hover Tooltip listeners
    const tooltip = document.getElementById('traffic-chart-tooltip');
    const tMonth = document.getElementById('traffic-tooltip-month');
    const tViews = document.getElementById('traffic-tooltip-views');
    const tImp = document.getElementById('traffic-tooltip-impressions');

    container.querySelectorAll('.traffic-hover-col').forEach(col => {
      col.addEventListener('mouseenter', (e) => {
        if (!tooltip) return;
        const month = col.getAttribute('data-month');
        const v = parseInt(col.getAttribute('data-views') || '0', 10);
        const imp = parseInt(col.getAttribute('data-imp') || '0', 10);

        if (tMonth) tMonth.textContent = month;
        if (tViews) tViews.textContent = v.toLocaleString(isAr ? 'ar-SA' : 'en-US');
        if (tImp) tImp.textContent = imp.toLocaleString(isAr ? 'ar-SA' : 'en-US');

        tooltip.classList.remove('hidden');
      });

      col.addEventListener('mousemove', (e) => {
        if (!tooltip) return;
        const wrapper = document.getElementById('traffic-chart-wrapper');
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        tooltip.style.left = `${Math.min(Math.max(mouseX - 60, 10), rect.width - 150)}px`;
        tooltip.style.top = `${Math.max(mouseY - 70, 10)}px`;
      });

      col.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.classList.add('hidden');
      });
    });
  }

  /**
   * Generate and mount Commercial Revenue & RFQ Bar Chart
   */
  static renderRevenueChart() {
    const container = document.getElementById('dashboard-revenue-chart');
    if (!container) return;

    const config = this.PERIOD_CONFIGS[this.currentPeriod] || this.PERIOD_CONFIGS['30d'];
    const points = config.revenuePoints || [];
    const isDark = document.documentElement.classList.contains('dark');
    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    const width = 700;
    const height = 240;
    const paddingStart = 60;
    const paddingEnd = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartW = width - paddingStart - paddingEnd;
    const chartH = height - paddingTop - paddingBottom;

    const maxRev = Math.max(...points.map(p => p.revenue), 10000);
    const maxScale = Math.ceil(maxRev * 1.15);

    const gridLines = [0, 0.33, 0.66, 1.0].map(ratio => {
      const val = Math.round(maxScale * (1 - ratio));
      const y = paddingTop + ratio * chartH;
      return { val, y };
    });

    const stepX = chartW / points.length;
    const barWidth = Math.min(stepX * 0.45, 36);

    const gridColor = isDark ? '#223129' : '#E2E8E4';
    const textColor = isDark ? '#8E9E94' : '#5A6B61';
    const goldColor = isDark ? '#C5A059' : '#A68238';
    const emeraldColor = isDark ? '#10B981' : '#047857';

    let svgHtml = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" preserveAspectRatio="none">
        <!-- Horizontal Grid Lines & Y-Axis Labels -->
        ${gridLines.map(g => `
          <line x1="${paddingStart}" y1="${g.y}" x2="${width - paddingEnd}" y2="${g.y}" stroke="${gridColor}" stroke-width="1" stroke-dasharray="3,3" />
          <text x="${paddingStart - 10}" y="${g.y + 4}" font-size="10" fill="${textColor}" text-anchor="end" font-family="monospace">${g.val >= 1000 ? (g.val / 1000).toFixed(0) + 'k' : g.val}</text>
        `).join('')}

        <!-- Revenue Bars (Gold) & RFQ Indicator (Emerald) -->
        ${points.map((p, idx) => {
          const centerX = paddingStart + idx * stepX + stepX / 2;
          const barH = (p.revenue / maxScale) * chartH;
          const barY = paddingTop + chartH - barH;
          const label = isAr ? p.label_ar : p.label_en;

          return `
            <!-- Revenue Bar -->
            <rect x="${centerX - barWidth / 2}" y="${barY}" width="${barWidth}" height="${barH}" rx="4" fill="${goldColor}" class="transition-all hover:opacity-85" />
            
            <!-- RFQ Count Badge Circle above bar -->
            <circle cx="${centerX}" cy="${Math.max(barY - 10, paddingTop + 8)}" r="3" fill="${emeraldColor}" />

            <!-- X-Axis Label -->
            <text x="${centerX}" y="${height - 10}" font-size="11" fill="${textColor}" text-anchor="middle" font-weight="600">${label}</text>

            <!-- Interactive Hover Column -->
            <rect x="${centerX - stepX / 2}" y="${paddingTop}" width="${stepX}" height="${chartH}" fill="transparent"
                  data-idx="${idx}" data-month="${label}" data-rev="${p.revenue}" data-rfqs="${p.rfqs}" class="rev-hover-col cursor-pointer" />
          `;
        }).join('')}
      </svg>
    `;

    container.innerHTML = svgHtml;

    // Attach Hover Tooltip listeners
    const tooltip = document.getElementById('revenue-chart-tooltip');
    const tMonth = document.getElementById('revenue-tooltip-month');
    const tRev = document.getElementById('revenue-tooltip-rev');
    const tRfqs = document.getElementById('revenue-tooltip-rfqs');

    container.querySelectorAll('.rev-hover-col').forEach(col => {
      col.addEventListener('mouseenter', () => {
        if (!tooltip) return;
        const month = col.getAttribute('data-month');
        const rev = parseInt(col.getAttribute('data-rev') || '0', 10);
        const rfqs = parseInt(col.getAttribute('data-rfqs') || '0', 10);

        if (tMonth) tMonth.textContent = month;
        if (tRev) tRev.textContent = `${rev.toLocaleString(isAr ? 'ar-SA' : 'en-US')} ${isAr ? 'ر.س' : 'SAR'}`;
        if (tRfqs) tRfqs.textContent = rfqs.toLocaleString(isAr ? 'ar-SA' : 'en-US');

        tooltip.classList.remove('hidden');
      });

      col.addEventListener('mousemove', (e) => {
        if (!tooltip) return;
        const wrapper = document.getElementById('revenue-chart-wrapper');
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        tooltip.style.left = `${Math.min(Math.max(mouseX - 60, 10), rect.width - 150)}px`;
        tooltip.style.top = `${Math.max(mouseY - 70, 10)}px`;
      });

      col.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.classList.add('hidden');
      });
    });
  }

  /**
   * Filter and Get paginated items for active tab
   */
  static getFilteredData() {
    let items = [];
    if (this.activeTab === 'recipes') {
      items = this.getRecipes();
    } else if (this.activeTab === 'supplies') {
      items = this.getSupplies();
    } else if (this.activeTab === 'rfqs') {
      items = this.getRFQs();
    } else if (this.activeTab === 'enrollments') {
      items = this.getEnrollments();
    }

    const q = normalizeSearchQuery(this.searchQuery);
    const filter = this.statusFilter;

    return items.filter(item => {
      // 1. Search Query filter
      if (q) {
        let text = '';
        if (this.activeTab === 'recipes') {
          text = `${item.title_ar || ''} ${item.title_en || ''} ${item.category_ar || ''} ${item.category_en || ''}`;
        } else if (this.activeTab === 'supplies') {
          text = `${item.name_ar || ''} ${item.name_en || ''} ${item.category_ar || ''} ${item.category_en || ''}`;
        } else if (this.activeTab === 'rfqs') {
          text = `${item.id || ''} ${item.client_name_ar || ''} ${item.client_name_en || ''} ${item.item_name_ar || ''} ${item.buyer_name || ''}`;
        } else if (this.activeTab === 'enrollments') {
          text = `${item.id || ''} ${item.student_name_ar || ''} ${item.student_name_en || ''} ${item.student_email || ''} ${item.course_title_ar || ''}`;
        }
        if (!normalizeSearchQuery(text).includes(q)) {
          return false;
        }
      }

      // 2. Status Filter
      if (filter !== 'all') {
        if (this.activeTab === 'recipes') {
          if (item.status !== filter) return false;
        } else if (this.activeTab === 'supplies') {
          if (filter === 'active' || filter === 'paused') {
            if (item.status !== filter) return false;
          } else {
            if (item.stock_status !== filter) return false;
          }
        } else if (this.activeTab === 'rfqs') {
          if (item.status !== filter) return false;
        } else if (this.activeTab === 'enrollments') {
          if (item.payment_status !== filter) return false;
        }
      }

      return true;
    });
  }

  static getTotalPages() {
    const totalItems = this.getFilteredData().length;
    return Math.max(1, Math.ceil(totalItems / this.pageSize));
  }

  /**
   * Render Management Table Content
   */
  static renderTable() {
    const container = document.getElementById('dashboard-table-container');
    if (!container) return;

    const filtered = this.getFilteredData();
    const totalItems = filtered.length;
    const totalPages = this.getTotalPages();

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + this.pageSize);

    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    // Summary count bar & pagination
    const summary = document.getElementById('dashboard-items-summary');
    if (summary) {
      if (totalItems === 0) {
        summary.textContent = isAr ? 'لا توجد عناصر' : 'No items';
      } else {
        const from = startIndex + 1;
        const to = Math.min(startIndex + pageItems.length, totalItems);
        summary.textContent = isAr
          ? `عرض ${from}-${to} من إجمالي ${totalItems} عنصر`
          : `Showing ${from}-${to} of ${totalItems} items`;
      }
    }

    const pageIndicator = document.getElementById('table-page-indicator');
    if (pageIndicator) {
      pageIndicator.textContent = `${this.currentPage} / ${totalPages}`;
    }

    const prevBtn = document.getElementById('btn-table-prev');
    const nextBtn = document.getElementById('btn-table-next');
    if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;

    // Empty state
    if (pageItems.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center space-y-3 bg-surface-1 rounded-2xl">
          <div class="w-14 h-14 rounded-3xl bg-surface-2 border border-border-subtle flex items-center justify-center mx-auto text-text-muted">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <h3 class="text-base font-bold text-text-main" data-i18n="dashboard.empty_title">${isAr ? 'لا توجد بيانات مطابقة' : 'No matching items found'}</h3>
          <p class="text-xs text-text-muted max-w-sm mx-auto" data-i18n="dashboard.empty_desc">${isAr ? 'جرب تعديل كلمات البحث أو تصفية الحالات' : 'Try adjusting your search query or status filter'}</p>
        </div>
      `;
      return;
    }

    if (this.activeTab === 'recipes') {
      this.renderRecipesTable(container, pageItems, isAr);
    } else if (this.activeTab === 'supplies') {
      this.renderSuppliesTable(container, pageItems, isAr);
    } else if (this.activeTab === 'rfqs') {
      this.renderRFQsTable(container, pageItems, isAr);
    } else if (this.activeTab === 'enrollments') {
      this.renderEnrollmentsTable(container, pageItems, isAr);
    }

    this.bindTableActionEvents();
  }

  /**
   * Render Recipes Management Table
   */
  static renderRecipesTable(container, items, isAr) {
    container.innerHTML = `
      <table class="w-full text-start text-xs border-collapse min-w-[700px]">
        <thead>
          <tr class="border-b border-border-subtle bg-surface-2 text-text-muted font-bold">
            <th class="py-3.5 px-4 text-start">${isAr ? 'الوصفة والطبق' : 'Recipe & Dish'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'التصنيف' : 'Category'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'التفاعل' : 'Engagement'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'الحالة' : 'Status'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'تاريخ التحديث' : 'Last Updated'}</th>
            <th class="py-3.5 px-4 text-end">${isAr ? 'الإجراءات' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          ${items.map(r => `
            <tr class="hover:bg-surface-2 transition-colors">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <img src="${r.image}" alt="${isAr ? r.title_ar : r.title_en}" class="w-10 h-10 rounded-xl object-cover border border-border-subtle bg-surface-2 shrink-0">
                  <div class="text-start">
                    <a href="recipe.html?id=${r.id}" class="font-bold text-text-main hover:text-brand-gold line-clamp-1 transition-colors">
                      ${isAr ? r.title_ar : r.title_en}
                    </a>
                    <span class="text-[10px] text-text-muted font-mono">${r.id}</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-start">
                <span class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-2 border border-border-subtle text-text-main">
                  ${isAr ? r.category_ar : r.category_en}
                </span>
              </td>
              <td class="py-3 px-4 text-start font-mono">
                <div class="flex items-center gap-3 text-text-muted">
                  <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> ${r.views.toLocaleString()}</span>
                  <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> ${r.likes.toLocaleString()}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-start">
                ${r.status === 'published'
                  ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-brand-emerald border border-border-subtle"><span class="w-1.5 h-1.5 rounded-full bg-brand-emerald"></span> ${isAr ? 'منشورة' : 'Published'}</span>`
                  : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-amber-500 border border-amber-500"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> ${isAr ? 'مسودة' : 'Draft'}</span>`
                }
              </td>
              <td class="py-3 px-4 text-start font-mono text-text-muted text-[11px]">
                ${r.updated_at}
              </td>
              <td class="py-3 px-4 text-end">
                <div class="flex items-center justify-end gap-1.5">
                  <a href="create-recipe.html?id=${r.id}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border-subtle text-text-muted hover:text-text-main transition-colors" title="${isAr ? 'تعديل' : 'Edit'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </a>
                  <button type="button" data-action="toggle-status" data-type="recipes" data-id="${r.id}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border-subtle text-text-muted hover:text-text-main transition-colors" title="${isAr ? 'تبديل النشر/مسودة' : 'Toggle Status'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                  </button>
                  <button type="button" data-action="duplicate-item" data-type="recipes" data-id="${r.id}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border-subtle text-text-muted hover:text-text-main transition-colors" title="${isAr ? 'نسخ مكرر' : 'Duplicate'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <button type="button" data-action="delete-item" data-type="recipes" data-id="${r.id}" data-name="${isAr ? r.title_ar : r.title_en}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 border border-border-subtle text-text-muted hover:text-red-500 transition-colors" title="${isAr ? 'حذف' : 'Delete'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Render B2B Supplies Management Table
   */
  static renderSuppliesTable(container, items, isAr) {
    container.innerHTML = `
      <table class="w-full text-start text-xs border-collapse min-w-[700px]">
        <thead>
          <tr class="border-b border-border-subtle bg-surface-2 text-text-muted font-bold">
            <th class="py-3.5 px-4 text-start">${isAr ? 'المنتج والمعدّة' : 'Product & Equipment'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'السعر و MOQ' : 'Price & MOQ'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'المخزون' : 'Stock'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'الاستفسارات' : 'Inquiries'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'الحالة' : 'Status'}</th>
            <th class="py-3.5 px-4 text-end">${isAr ? 'الإجراءات' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          ${items.map(s => `
            <tr class="hover:bg-surface-2 transition-colors">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <img src="${s.image}" alt="${isAr ? s.name_ar : s.name_en}" class="w-10 h-10 rounded-xl object-cover border border-border-subtle bg-surface-2 shrink-0">
                  <div class="text-start">
                    <p class="font-bold text-text-main line-clamp-1">${isAr ? s.name_ar : s.name_en}</p>
                    <span class="text-[10px] text-brand-gold font-semibold">${isAr ? s.category_ar : s.category_en}</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-start font-mono">
                <div class="font-bold text-text-main">${s.price.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}</div>
                <div class="text-[10px] text-text-muted">MOQ: ${s.moq} ${isAr ? 'وحدة' : 'units'}</div>
              </td>
              <td class="py-3 px-4 text-start">
                ${s.stock_status === 'low_stock'
                  ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-amber-500 border border-amber-500">${isAr ? `مخزون منخفض (${s.stock_count})` : `Low Stock (${s.stock_count})`}</span>`
                  : s.stock_status === 'out_of_stock'
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-red-500 border border-red-500">${isAr ? 'نفد المخزون' : 'Out of Stock'}</span>`
                    : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-brand-emerald border border-border-subtle">${isAr ? `متوفر (${s.stock_count})` : `In Stock (${s.stock_count})`}</span>`
                }
              </td>
              <td class="py-3 px-4 text-start font-mono font-bold text-text-main">
                ${s.inquiries} ${isAr ? 'طلب' : 'inquiries'}
              </td>
              <td class="py-3 px-4 text-start">
                ${s.status === 'active'
                  ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-brand-emerald border border-border-subtle"><span class="w-1.5 h-1.5 rounded-full bg-brand-emerald"></span> ${isAr ? 'نشط' : 'Active'}</span>`
                  : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-text-muted border border-border-subtle"><span class="w-1.5 h-1.5 rounded-full bg-text-muted"></span> ${isAr ? 'متوقف' : 'Paused'}</span>`
                }
              </td>
              <td class="py-3 px-4 text-end">
                <div class="flex items-center justify-end gap-1.5">
                  <button type="button" data-action="toggle-status" data-type="supplies" data-id="${s.id}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border-subtle text-text-muted hover:text-text-main transition-colors" title="${isAr ? 'تبديل النشاط/إيقاف' : 'Toggle Active'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                  </button>
                  <button type="button" data-action="duplicate-item" data-type="supplies" data-id="${s.id}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border-subtle text-text-muted hover:text-text-main transition-colors" title="${isAr ? 'نسخ مكرر' : 'Duplicate'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <button type="button" data-action="delete-item" data-type="supplies" data-id="${s.id}" data-name="${isAr ? s.name_ar : s.name_en}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 border border-border-subtle text-text-muted hover:text-red-500 transition-colors" title="${isAr ? 'حذف' : 'Delete'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Render RFQs Quotations Management Table
   */
  static renderRFQsTable(container, items, isAr) {
    container.innerHTML = `
      <table class="w-full text-start text-xs border-collapse min-w-[700px]">
        <thead>
          <tr class="border-b border-border-subtle bg-surface-2 text-text-muted font-bold">
            <th class="py-3.5 px-4 text-start">${isAr ? 'رقم الطلب والعميل' : 'RFQ ID & Client'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'الصنف المطلوب' : 'Item Requested'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'الكمية والمدينة' : 'Qty & Destination'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'عرض السعر' : 'Quotation'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'الحالة' : 'Status'}</th>
            <th class="py-3.5 px-4 text-end">${isAr ? 'الإجراءات' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          ${items.map(rfq => `
            <tr class="hover:bg-surface-2 transition-colors">
              <td class="py-3 px-4 text-start">
                <div class="font-bold text-text-main">${isAr ? rfq.client_name_ar : rfq.client_name_en}</div>
                <div class="text-[10px] text-text-muted font-mono"><span class="text-brand-gold font-bold">${rfq.id}</span> • ${rfq.buyer_name}</div>
              </td>
              <td class="py-3 px-4 text-start font-medium text-text-main">
                ${isAr ? rfq.item_name_ar : rfq.item_name_en}
              </td>
              <td class="py-3 px-4 text-start">
                <div class="font-bold text-text-main font-mono">${rfq.quantity} ${isAr ? 'وحدة' : 'units'}</div>
                <div class="text-[10px] text-text-muted">${isAr ? rfq.destination_ar : rfq.destination_en}</div>
              </td>
              <td class="py-3 px-4 text-start font-mono">
                ${rfq.quoted_price
                  ? `<span class="font-bold text-brand-emerald">${rfq.quoted_price.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}</span>`
                  : `<span class="text-text-muted italic">${isAr ? 'بانتظار التسعير' : 'Awaiting Quote'}</span>`
                }
              </td>
              <td class="py-3 px-4 text-start">
                ${rfq.status === 'pending'
                  ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-amber-500 border border-amber-500">${isAr ? 'قيد المراجعة' : 'Pending Review'}</span>`
                  : rfq.status === 'quoted'
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-blue-500 border border-blue-500">${isAr ? 'تم تقديم العرض' : 'Quotation Sent'}</span>`
                    : rfq.status === 'accepted'
                      ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-brand-emerald border border-border-subtle">${isAr ? 'مقبول ومؤكد' : 'Accepted'}</span>`
                      : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-2 text-red-500 border border-red-500">${isAr ? 'مرفوض' : 'Declined'}</span>`
                }
              </td>
              <td class="py-3 px-4 text-end">
                <div class="flex items-center justify-end gap-1.5">
                  <button type="button" data-action="respond-rfq" data-id="${rfq.id}" class="px-2.5 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-white text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>${isAr ? 'تسعير' : 'Quote'}</span>
                  </button>
                  <button type="button" data-action="delete-item" data-type="rfqs" data-id="${rfq.id}" data-name="${rfq.id}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 border border-border-subtle text-text-muted hover:text-red-500 transition-colors" title="${isAr ? 'حذف' : 'Delete'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Render Student Enrollments Management Table
   */
  static renderEnrollmentsTable(container, items, isAr) {
    container.innerHTML = `
      <table class="w-full text-start text-xs border-collapse min-w-[700px]">
        <thead>
          <tr class="border-b border-border-subtle bg-surface-2 text-text-muted font-bold">
            <th class="py-3.5 px-4 text-start">${isAr ? 'الطالب المسجل' : 'Student'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'الورشة والدورة' : 'Workshop Course'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'الرسوم والحالة' : 'Fee & Payment'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'نسبة الإنجاز' : 'Progress'}</th>
            <th class="py-3.5 px-4 text-start">${isAr ? 'تاريخ التسجيل' : 'Date Enrolled'}</th>
            <th class="py-3.5 px-4 text-end">${isAr ? 'الإجراءات' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          ${items.map(enr => `
            <tr class="hover:bg-surface-2 transition-colors">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <img src="${enr.student_avatar}" alt="${isAr ? enr.student_name_ar : enr.student_name_en}" class="w-10 h-10 rounded-full object-cover border border-border-subtle bg-surface-2 shrink-0">
                  <div class="text-start">
                    <p class="font-bold text-text-main">${isAr ? enr.student_name_ar : enr.student_name_en}</p>
                    <p class="text-[10px] text-text-muted font-mono">${enr.student_email}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-start">
                <div class="font-bold text-text-main line-clamp-1">${isAr ? enr.course_title_ar : enr.course_title_en}</div>
                <div class="text-[10px] text-brand-gold font-mono">${enr.id}</div>
              </td>
              <td class="py-3 px-4 text-start font-mono">
                <div class="font-bold text-brand-emerald">${enr.amount_formatted}</div>
                <span class="inline-flex items-center gap-1 text-[10px] text-brand-emerald font-semibold">${isAr ? 'مدفوع ومؤكد' : 'Paid & Confirmed'}</span>
              </td>
              <td class="py-3 px-4 text-start">
                <div class="w-24 bg-surface-2 rounded-full h-2 overflow-hidden border border-border-subtle">
                  <div class="bg-brand-gold h-full rounded-full" style="width: ${enr.progress}%"></div>
                </div>
                <span class="text-[10px] font-mono text-text-muted mt-1 block">${enr.progress}% ${isAr ? 'مكتمل' : 'completed'}</span>
              </td>
              <td class="py-3 px-4 text-start font-mono text-text-muted text-[11px]">
                ${enr.booking_date}
              </td>
              <td class="py-3 px-4 text-end">
                <div class="flex items-center justify-end gap-1.5">
                  <a href="chat.html" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-1 border border-border-subtle text-text-muted hover:text-text-main transition-colors" title="${isAr ? 'مراسلة' : 'Message'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                  </a>
                  <button type="button" data-action="delete-item" data-type="enrollments" data-id="${enr.id}" data-name="${isAr ? enr.student_name_ar : enr.student_name_en}" class="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 border border-border-subtle text-text-muted hover:text-red-500 transition-colors" title="${isAr ? 'إلغاء التسجيل' : 'Cancel Registration'}">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Bind event triggers inside dynamic table rows
   */
  static bindTableActionEvents() {
    // 1. Toggle Item Status
    document.querySelectorAll('[data-action="toggle-status"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-type');
        const id = btn.getAttribute('data-id');
        if (type && id) {
          this.handleToggleStatus(type, id);
        }
      });
    });

    // 2. Duplicate Item
    document.querySelectorAll('[data-action="duplicate-item"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-type');
        const id = btn.getAttribute('data-id');
        if (type && id) {
          this.handleDuplicateItem(type, id);
        }
      });
    });

    // 3. Delete Item Trigger (Opens modal)
    document.querySelectorAll('[data-action="delete-item"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-type');
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        if (type && id) {
          this.openDeleteModal(type, id, name);
        }
      });
    });

    // 4. Respond RFQ Trigger (Opens modal)
    document.querySelectorAll('[data-action="respond-rfq"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          this.openRfqResponseModal(id);
        }
      });
    });
  }

  /**
   * Toggle item status (Published <-> Draft for recipes, Active <-> Paused for supplies)
   */
  static handleToggleStatus(type, id) {
    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    if (type === 'recipes') {
      const recipes = this.getRecipes();
      const item = recipes.find(r => r.id === id);
      if (item) {
        item.status = item.status === 'published' ? 'draft' : 'published';
        this.saveRecipes(recipes);
        Toast.success(isAr ? `تم تعديل حالة الوصفة إلى: ${item.status === 'published' ? 'منشورة' : 'مسودة'}` : `Recipe status changed to: ${item.status}`);
        this.renderTable();
      }
    } else if (type === 'supplies') {
      const supplies = this.getSupplies();
      const item = supplies.find(s => s.id === id);
      if (item) {
        item.status = item.status === 'active' ? 'paused' : 'active';
        this.saveSupplies(supplies);
        Toast.success(isAr ? `تم تعديل حالة المنتج إلى: ${item.status === 'active' ? 'نشط' : 'متوقف'}` : `Product status changed to: ${item.status}`);
        this.renderTable();
      }
    }
  }

  /**
   * Duplicate an existing item
   */
  static handleDuplicateItem(type, id) {
    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    if (type === 'recipes') {
      const recipes = this.getRecipes();
      const item = recipes.find(r => r.id === id);
      if (item) {
        const cloned = {
          ...item,
          id: `recipe-dup-${Date.now()}`,
          title_ar: `${item.title_ar} (نسخة)`,
          title_en: `${item.title_en} (Copy)`,
          status: 'draft',
          views: 0,
          likes: 0
        };
        recipes.unshift(cloned);
        this.saveRecipes(recipes);
        Toast.success(isAr ? 'تم إنشاء نسخة مكررة من الوصفة بنجاح!' : 'Recipe duplicated successfully!');
        this.updateTabCounters();
        this.renderTable();
      }
    } else if (type === 'supplies') {
      const supplies = this.getSupplies();
      const item = supplies.find(s => s.id === id);
      if (item) {
        const cloned = {
          ...item,
          id: `supply-dup-${Date.now()}`,
          name_ar: `${item.name_ar} (نسخة)`,
          name_en: `${item.name_en} (Copy)`,
          status: 'active',
          inquiries: 0
        };
        supplies.unshift(cloned);
        this.saveSupplies(supplies);
        Toast.success(isAr ? 'تم نسخ منتج التوريد بنجاح إلى الكتالوج!' : 'Supply item duplicated successfully!');
        this.updateTabCounters();
        this.renderTable();
      }
    }
  }

  /**
   * Open Delete Confirmation Modal
   */
  static openDeleteModal(type, id, name) {
    const targetIdInput = document.getElementById('delete-target-id');
    const targetTypeInput = document.getElementById('delete-target-type');
    const itemNameEl = document.getElementById('modal-delete-item-name');

    if (targetIdInput) targetIdInput.value = id;
    if (targetTypeInput) targetTypeInput.value = type;
    if (itemNameEl) itemNameEl.textContent = name || id;

    Modal.open('modal-delete-confirm');
  }

  /**
   * Confirm Delete handler
   */
  static handleConfirmDelete() {
    const targetIdInput = document.getElementById('delete-target-id');
    const targetTypeInput = document.getElementById('delete-target-type');

    if (!targetIdInput || !targetTypeInput) return;
    const id = targetIdInput.value;
    const type = targetTypeInput.value;

    const lang = I18n.getLang();
    const isAr = lang === 'ar';

    if (type === 'recipes') {
      let recipes = this.getRecipes();
      recipes = recipes.filter(r => r.id !== id);
      this.saveRecipes(recipes);
    } else if (type === 'supplies') {
      let supplies = this.getSupplies();
      supplies = supplies.filter(s => s.id !== id);
      this.saveSupplies(supplies);
    } else if (type === 'rfqs') {
      let rfqs = this.getRFQs();
      rfqs = rfqs.filter(r => r.id !== id);
      this.saveRFQs(rfqs);
    } else if (type === 'enrollments') {
      let enrollments = this.getEnrollments();
      enrollments = enrollments.filter(e => e.id !== id);
      this.saveEnrollments(enrollments);
    }

    Modal.close('modal-delete-confirm');
    Toast.info(isAr ? 'تم حذف العنصر بنجاح من لوحة التحكم' : 'Item deleted successfully');
    this.updateTabCounters();
    this.renderTable();
  }

  /**
   * Open RFQ Response Modal
   */
  static openRfqResponseModal(rfqId) {
    const rfqs = this.getRFQs();
    const rfq = rfqs.find(r => r.id === rfqId);
    if (!rfq) return;

    const isAr = I18n.getLang() === 'ar';

    const subTitle = document.getElementById('modal-rfq-id-subtitle');
    const clientEl = document.getElementById('rfq-detail-client');
    const itemEl = document.getElementById('rfq-detail-item');
    const qtyEl = document.getElementById('rfq-detail-qty');
    const destEl = document.getElementById('rfq-detail-dest');
    const targetIdInput = document.getElementById('rfq-response-target-id');

    if (subTitle) subTitle.textContent = `${isAr ? 'طلب تسعير' : 'RFQ Inquiry'} #${rfq.id}`;
    if (clientEl) clientEl.textContent = isAr ? rfq.client_name_ar : rfq.client_name_en;
    if (itemEl) itemEl.textContent = isAr ? rfq.item_name_ar : rfq.item_name_en;
    if (qtyEl) qtyEl.textContent = `${rfq.quantity} ${isAr ? 'وحدات' : 'units'}`;
    if (destEl) destEl.textContent = isAr ? rfq.destination_ar : rfq.destination_en;
    if (targetIdInput) targetIdInput.value = rfq.id;

    const unitPriceInput = document.getElementById('rfq-input-unit-price');
    if (unitPriceInput) {
      unitPriceInput.value = rfq.quoted_price ? rfq.quoted_price / rfq.quantity : '';
    }

    Modal.open('modal-rfq-response');
  }

  /**
   * Handle RFQ Response Form Submission
   */
  static handleRfqResponseSubmit(form) {
    const targetIdInput = document.getElementById('rfq-response-target-id');
    const unitPriceInput = document.getElementById('rfq-input-unit-price');
    const leadTimeInput = document.getElementById('rfq-input-leadtime');

    if (!targetIdInput || !unitPriceInput) return;
    const rfqId = targetIdInput.value;
    const unitPrice = parseFloat(unitPriceInput.value) || 0;
    const leadTime = leadTimeInput ? leadTimeInput.value : '3-5 أيام';

    const rfqs = this.getRFQs();
    const rfq = rfqs.find(r => r.id === rfqId);
    if (rfq) {
      rfq.status = 'quoted';
      rfq.quoted_price = unitPrice * rfq.quantity;
      rfq.quoted_price_formatted = `${rfq.quoted_price.toLocaleString()} ر.س`;
      rfq.lead_time = leadTime;
      this.saveRFQs(rfqs);

      Modal.close('modal-rfq-response');
      const isAr = I18n.getLang() === 'ar';
      Toast.success(isAr ? `تم تقديم عرض السعر بنجاح للطلب #${rfqId}!` : `Quotation submitted successfully for #${rfqId}!`);
      this.updateTabCounters();
      this.renderTable();
    }
  }

  /**
   * Handle Add Supply Product Form Submission
   */
  static handleAddSupplySubmit(form) {
    const nameArInput = document.getElementById('supply-input-name-ar');
    const nameEnInput = document.getElementById('supply-input-name-en');
    const catInput = document.getElementById('supply-input-category');
    const priceInput = document.getElementById('supply-input-price');
    const moqInput = document.getElementById('supply-input-moq');
    const stockInput = document.getElementById('supply-input-stock');
    const leadTimeInput = document.getElementById('supply-input-leadtime');
    const imageInput = document.getElementById('supply-input-image');

    const nameAr = nameArInput ? nameArInput.value.trim() : '';
    const nameEn = nameEnInput ? nameEnInput.value.trim() : '';
    const category = catInput ? catInput.value : 'heavy_equipment';
    const price = parseFloat(priceInput ? priceInput.value : '0') || 1000;
    const moq = parseInt(moqInput ? moqInput.value : '1', 10) || 1;
    const stock = parseInt(stockInput ? stockInput.value : '10', 10) || 10;
    const leadTime = leadTimeInput ? leadTimeInput.value : '3-5 أيام عمل';
    const image = (imageInput && imageInput.value.trim()) || 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80';

    const supplies = this.getSupplies();
    const newSupply = {
      id: `supply-${Date.now()}`,
      name_ar: nameAr,
      name_en: nameEn,
      category: category,
      category_ar: category === 'heavy_equipment' ? 'معدات المطابخ الثقيلة' : (category === 'knives' ? 'سكاكين وأدوات' : 'مكونات تجارية'),
      category_en: category === 'heavy_equipment' ? 'Heavy Equipment' : (category === 'knives' ? 'Knives & Cutlery' : 'Commercial Ingredients'),
      price: price,
      price_formatted: `${price.toLocaleString()} ر.س`,
      moq: moq,
      in_stock: stock > 0,
      stock_count: stock,
      stock_status: stock === 0 ? 'out_of_stock' : (stock <= 3 ? 'low_stock' : 'in_stock'),
      status: 'active',
      inquiries: 0,
      image: image,
      lead_time_ar: leadTime,
      lead_time_en: leadTime,
      updated_at: new Date().toISOString().split('T')[0]
    };

    supplies.unshift(newSupply);
    this.saveSupplies(supplies);

    form.reset();
    Modal.close('modal-add-supply');

    const isAr = I18n.getLang() === 'ar';
    Toast.success(isAr ? 'تم إضافة منتج التوريد بنجاح إلى الكتالوج!' : 'Supply item added to catalog successfully!');
    this.updateTabCounters();
    this.renderTable();
  }

  /**
   * Export Performance & Financial Report
   */
  static handleExportReport() {
    const isAr = I18n.getLang() === 'ar';
    const recipes = this.getRecipes();
    const supplies = this.getSupplies();
    const rfqs = this.getRFQs();

    const reportData = {
      generated_at: new Date().toISOString(),
      platform: 'Meyar معيار Culinary Platform',
      user: USER_FIXTURES?.name_ar || '',
      period: this.currentPeriod,
      metrics: {
        recipes_count: recipes.length,
        supplies_count: supplies.length,
        rfqs_count: rfqs.length,
        total_revenue_est: '194,500 SAR'
      }
    };

    try {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meyar-performance-report-${this.currentPeriod}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {}

    Toast.success(isAr ? 'تم تصدير تقرير الأداء المالي والتشغيلي بنجاح!' : 'Performance report exported successfully!');
  }
}
