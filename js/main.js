/**
 * Meyar (معيار) Standalone Master Entry Point
 * Bundles global app shell and all page controllers into a single standalone bundle
 * ensuring 100% full functionality both on HTTP servers and directly via file:/// protocols.
 */

import { initApp, ThemeManager, I18n, Modal, Toast, SearchModule } from './app.js';
import { FeedPage } from './pages/feed.js';
import { ExplorePage } from './pages/explore.js';
import { RecipePage } from './pages/recipe-page.js';
import { CreateRecipeStudio } from './pages/create-recipe.js';
import { ChefPage } from './pages/chef.js';
import { DashboardPage } from './pages/dashboard.js';
import { SuppliesPage } from './pages/supplies.js';
import { CoursesPage } from './pages/courses.js';
import { ChatPage } from './pages/chat.js';
import { NotificationsPage } from './pages/notifications.js';
import { SettingsPage } from './pages/settings.js';
import { AuthPage } from './pages/auth.js';
import { RecipeScaler } from './modules/scaler.js';
import { RFQManager } from './modules/rfq.js';
import { MOCK_DATA } from './data/mock-data.js';
import { translations } from './data/translations.js';
import { escapeHtml, formatQuantity } from './core/utils.js';

// Expose on global window object for universal console and component access
if (typeof window !== 'undefined') {
  window.Meyar = {
    initApp,
    ThemeManager,
    I18n,
    Modal,
    Toast,
    SearchModule,
    FeedPage,
    ExplorePage,
    RecipePage,
    CreateRecipeStudio,
    ChefPage,
    DashboardPage,
    SuppliesPage,
    CoursesPage,
    ChatPage,
    NotificationsPage,
    SettingsPage,
    AuthPage,
    RecipeScaler,
    RFQManager,
    MOCK_DATA,
    translations,
    escapeHtml,
    formatQuantity
  };
}

export function autoInitPage() {
  if (typeof document === 'undefined') return;

  // 1. Initialize global shell (Theme, i18n, Search, Modals, Dropdowns, Drawers)
  initApp();

  const currentPath = (typeof window !== 'undefined' && window.location.pathname)
    ? window.location.pathname.split('/').pop().toLowerCase()
    : '';

  // 2. Feed Page (index.html or root or #feed-posts-container)
  if (document.getElementById('feed-posts-container') || document.getElementById('stories-track') || currentPath === 'index.html' || currentPath === '') {
    FeedPage.init();
  }

  // 3. Explore Page (explore.html or #explore-results-grid)
  if (document.getElementById('explore-results-grid') || document.getElementById('explore-search-input') || currentPath === 'explore.html') {
    ExplorePage.init();
  }

  // 4. Recipe Page (recipe.html or #recipe-scaler-container)
  if (document.getElementById('recipe-scaler-container') || document.getElementById('cooking-mode-steps') || currentPath === 'recipe.html') {
    RecipePage.init();
  }

  // 5. Create Recipe Studio (create-recipe.html or #recipe-creator-form)
  if (document.getElementById('recipe-creator-form') || document.getElementById('ingredients-builder-list') || currentPath === 'create-recipe.html') {
    CreateRecipeStudio.init();
  }

  // 6. Chef Profile (chef.html or #chef-cover-img)
  if (document.getElementById('chef-cover-img') || document.getElementById('chef-display-name') || currentPath === 'chef.html') {
    ChefPage.init();
  }

  // 7. Dashboard (dashboard.html or #table-published-recipes)
  if (document.getElementById('table-published-recipes') || document.getElementById('chart-analytics-traffic') || currentPath === 'dashboard.html') {
    DashboardPage.init();
  }

  // 8. B2B Supplies (supplies.html or #supplies-grid)
  if (document.getElementById('supplies-grid') || document.getElementById('rfq-drawer') || currentPath === 'supplies.html') {
    SuppliesPage.init();
  }

  // 9. Courses (courses.html or #courses-grid)
  if (document.getElementById('courses-grid') || document.getElementById('enrollment-modal') || currentPath === 'courses.html') {
    CoursesPage.init();
  }

  // 10. Chat (chat.html or #messages-stream)
  if (document.getElementById('messages-stream') || document.getElementById('conversations-list') || currentPath === 'chat.html') {
    ChatPage.init();
  }

  // 11. Notifications (notifications.html or #notifications-list)
  if (document.getElementById('notifications-list') || document.getElementById('notifications-summary-badge') || currentPath === 'notifications.html') {
    NotificationsPage.init();
  }

  // 12. Settings (settings.html or #settings-form)
  if (document.getElementById('settings-form') || document.getElementById('settings-profile-tab') || currentPath === 'settings.html') {
    SettingsPage.init();
  }

  // 13. Auth (auth.html or #login-form)
  if (document.getElementById('login-form') || document.getElementById('register-form') || currentPath === 'auth.html') {
    AuthPage.init();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitPage);
  } else {
    autoInitPage();
  }
}
