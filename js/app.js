/**
 * Meyar (معيار) Global Application Shell & Bootstrapper
 * Initializes Theme Engine, Bilingual i18n System, Modal Manager,
 * Toast Notifications, Command Palette Instant Search, Mobile Drawers, and Dropdown Menus.
 */

import { ThemeManager } from './core/theme.js';
import { I18n } from './core/i18n.js';
import { Modal } from './core/modal.js';
import { Toast } from './core/toast.js';
import { SearchModule } from './modules/search.js';

/**
 * Initialize all core platform systems and global UI event delegation
 */
export function initApp() {
  if (typeof document === 'undefined') return;

  // 1. Initialize core infrastructure modules
  ThemeManager.init();
  I18n.init();
  Modal.init();
  SearchModule.init();

  // 2. Mobile navigation drawer toggle & close handlers
  document.querySelectorAll('[data-action="toggle-mobile-menu"], [data-action="toggle-mobile-nav"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target') || 'mobile-drawer';
      const drawer = document.getElementById(targetId) || document.querySelector('[data-mobile-drawer]');
      if (drawer) {
        drawer.classList.toggle('hidden');
      }
    });
  });

  document.querySelectorAll('[data-action="close-mobile-menu"], [data-action="close-mobile-nav"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target') || 'mobile-drawer';
      const drawer = document.getElementById(targetId) || document.querySelector('[data-mobile-drawer]');
      if (drawer) {
        drawer.classList.add('hidden');
      }
    });
  });

  // 3. User profile & interactive dropdown menus
  document.querySelectorAll('[data-dropdown-trigger]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = trigger.getAttribute('data-dropdown-trigger');
      const targetMenu = document.getElementById(targetId) || trigger.parentElement?.querySelector('[data-dropdown]');

      // Close other dropdowns first
      document.querySelectorAll('[data-dropdown]').forEach(dd => {
        if (dd !== targetMenu) {
          dd.classList.add('hidden');
        }
      });

      if (targetMenu) {
        targetMenu.classList.toggle('hidden');
      }
    });
  });

  // 4. Global click listener to close all floating dropdown menus on click outside
  document.addEventListener('click', (e) => {
    const isInsideDropdown = e.target && e.target.closest && (e.target.closest('[data-dropdown]') || e.target.closest('[data-dropdown-trigger]'));
    if (!isInsideDropdown) {
      document.querySelectorAll('[data-dropdown]').forEach(dd => {
        dd.classList.add('hidden');
      });
    }
  });

  // 5. Global Escape key handling for dropdowns and mobile drawers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close open dropdowns
      document.querySelectorAll('[data-dropdown]').forEach(dd => {
        dd.classList.add('hidden');
      });

      // Close open mobile drawer
      const mobileDrawer = document.getElementById('mobile-drawer') || document.querySelector('[data-mobile-drawer]');
      if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
        mobileDrawer.classList.add('hidden');
      }
    }
  });
}

// Auto-bootstrap when running in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

export {
  ThemeManager,
  I18n,
  Modal,
  Toast,
  SearchModule
};
