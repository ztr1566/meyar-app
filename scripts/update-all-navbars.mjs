import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

const pages = [
  { file: 'index.html', activeNav: 'feed' },
  { file: 'explore.html', activeNav: 'explore' },
  { file: 'recipe.html', activeNav: 'recipes' },
  { file: 'create-recipe.html', activeNav: 'create_recipe' },
  { file: 'chef.html', activeNav: 'chef' },
  { file: 'dashboard.html', activeNav: 'dashboard' },
  { file: 'supplies.html', activeNav: 'supplies' },
  { file: 'courses.html', activeNav: 'courses' },
  { file: 'chat.html', activeNav: 'chat' },
  { file: 'notifications.html', activeNav: 'notifications' },
  { file: 'settings.html', activeNav: 'settings' },
  { file: 'auth.html', activeNav: 'auth' }
];

function generateHeader(activeNav) {
  const getNavClass = (navKey) => {
    if (activeNav === navKey) {
      return 'px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-bold whitespace-nowrap bg-surface-2 text-brand-gold border border-border-subtle shadow-sm transition-colors';
    }
    return 'px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap text-text-muted hover:text-text-main hover:bg-surface-2 transition-colors';
  };

  return `  <!-- ================= GLOBAL TOPBAR ================= -->
  <header class="sticky top-0 w-full border-b border-border-subtle bg-surface-1 z-30 shrink-0">
    <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 lg:gap-3">
      
      <!-- Start Section: Brand + Search Trigger -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <!-- Brand Identity -->
        <a href="index.html" class="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus:ring-2 focus:ring-brand-gold rounded-xl p-1 shrink-0" aria-label="Meyar Home">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-gold flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span class="font-extrabold text-base sm:text-lg tracking-tight text-text-main flex items-center gap-1.5 whitespace-nowrap">
            معيار <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-2 text-brand-gold border border-border-subtle uppercase">Meyar</span>
          </span>
        </a>

        <!-- Search Bar Button Trigger -->
        <button type="button" data-action="open-search" data-modal-target="search-modal"
                class="hidden md:flex items-center justify-between w-36 lg:w-44 xl:w-56 px-2.5 py-1.5 text-xs bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold shrink-0"
                aria-label="Search">
          <span class="flex items-center gap-2 min-w-0 truncate">
            <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <span class="truncate" data-i18n="search.placeholder">ابحث في معيار...</span>
          </span>
          <kbd class="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-surface-1 border border-border-subtle rounded text-text-muted shrink-0">Ctrl K</kbd>
        </button>
      </div>

      <!-- Center Section: Desktop Navigation Links (Clean, Compact, Single-Row) -->
      <nav class="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0" aria-label="Main Navigation">
        <a href="index.html" class="${getNavClass('feed')}" data-nav="feed" data-i18n="nav.feed">الرئيسية</a>
        <a href="explore.html" class="${getNavClass('explore')}" data-nav="explore" data-i18n="nav.explore">استكشف</a>
        <a href="supplies.html" class="${getNavClass('supplies')}" data-nav="supplies" data-i18n="nav.supplies">التوريدات</a>
        <a href="courses.html" class="${getNavClass('courses')}" data-nav="courses" data-i18n="nav.courses">الدورات</a>
        <a href="dashboard.html" class="${getNavClass('dashboard')}" data-nav="dashboard" data-i18n="nav.dashboard">لوحة التحكم</a>
      </nav>

      <!-- End Section: Quick Actions & Profile -->
      <div class="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
        
        <!-- Mobile Search Button -->
        <button type="button" data-action="open-search" data-modal-target="search-modal"
                class="md:hidden p-2 text-text-muted hover:text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                aria-label="Open Search">
          <svg class="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
        </button>

        <!-- Create Recipe Quick CTA Button -->
        <a href="create-recipe.html" class="hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-brand-gold hover:bg-brand-gold-hover text-white rounded-lg shadow-sm whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span data-i18n="nav.create_recipe">ابتكار وصفة</span>
        </a>

        <!-- Direct Chat Messages Link -->
        <a href="chat.html" class="p-2 text-text-muted hover:text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold relative shrink-0" aria-label="Messages">
          <svg class="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="absolute top-1 end-1 w-2 h-2 rounded-full bg-brand-gold"></span>
        </a>

        <!-- Notifications Link -->
        <a href="notifications.html" class="p-2 text-text-muted hover:text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold relative shrink-0" aria-label="Notifications">
          <svg class="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          <span class="absolute top-1 end-1 w-2 h-2 rounded-full bg-brand-emerald"></span>
        </a>

        <!-- Language Switcher Button -->
        <button type="button" data-action="toggle-lang" class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold shrink-0" aria-label="Toggle language">
          <svg class="w-3.5 h-3.5 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
          </svg>
          <span class="lang-label">English</span>
        </button>

        <!-- Theme Toggle Button -->
        <button type="button" data-action="toggle-theme" class="p-2 text-text-muted hover:text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold shrink-0" aria-label="Toggle theme">
          <svg class="w-4 h-4 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        </button>

        <!-- User Profile Dropdown Menu Trigger -->
        <div class="relative shrink-0">
          <button type="button" data-dropdown-trigger="user-dropdown-menu"
                  class="flex items-center gap-1.5 p-1 rounded-xl hover:bg-surface-2 border border-transparent hover:border-border-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  aria-label="User profile options" aria-haspopup="true">
            <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80"
                 alt="Chef Faisal Al-Hashemi"
                 class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-border-subtle shrink-0">
            <svg class="w-3 h-3 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          <!-- Floating Solid Dropdown Menu -->
          <div id="user-dropdown-menu" data-dropdown class="hidden absolute end-0 mt-2 w-52 bg-surface-1 border border-border-subtle rounded-xl shadow-xl p-1.5 z-50 space-y-1">
            <div class="px-3 py-2 border-b border-border-subtle mb-1 text-start">
              <p class="text-xs font-bold text-text-main">الشيف فيصل الهاشمي</p>
              <p class="text-[11px] text-text-muted truncate">faisal@meyar.sa</p>
            </div>
            <a href="chef.html?id=chef-1" class="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-main hover:bg-surface-2 rounded-lg transition-colors">
              <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span data-i18n="nav.profile">الملف الشخصي</span>
            </a>
            <a href="dashboard.html" class="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-main hover:bg-surface-2 rounded-lg transition-colors">
              <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              <span data-i18n="nav.dashboard">لوحة التحكم</span>
            </a>
            <a href="settings.html" class="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-main hover:bg-surface-2 rounded-lg transition-colors">
              <svg class="w-4 h-4 text-brand-gold shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span data-i18n="nav.settings">الإعدادات</span>
            </a>
            <div class="border-t border-border-subtle pt-1 mt-1">
              <a href="auth.html" class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-surface-2 rounded-lg transition-colors">
                <svg class="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span data-i18n="nav.logout">تسجيل الخروج</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Mobile Drawer Toggle Button -->
        <button type="button" data-action="toggle-mobile-menu"
                class="lg:hidden p-2 text-text-muted hover:text-text-main bg-surface-2 hover:bg-surface-1 border border-border-subtle rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                aria-label="Open mobile menu">
          <svg class="w-5 h-5 text-text-main" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>

      </div>
    </div>
  </header>`;
}

for (const { file, activeNav } of pages) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace header block
  const headerRegex = /<!-- ================= GLOBAL TOPBAR ================= -->[\s\S]*?<\/header>/;
  if (headerRegex.test(content)) {
    content = content.replace(headerRegex, generateHeader(activeNav));
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated header in ${file}`);
  } else {
    // Check if simple <header> exists
    const simpleHeaderRegex = /<header[\s\S]*?<\/header>/;
    if (simpleHeaderRegex.test(content)) {
      content = content.replace(simpleHeaderRegex, generateHeader(activeNav));
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated simple header in ${file}`);
    }
  }
}
