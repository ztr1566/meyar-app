import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { translations } from '../js/data/translations.js';
import { MOCK_DATA } from '../js/data/mock-data.js';
import { RecipeScaler } from '../js/modules/scaler.js';
import { RFQManager } from '../js/modules/rfq.js';
import { normalizeSearchQuery, SearchModule } from '../js/modules/search.js';
import { ChatModule } from '../js/modules/chat-module.js';

const ALL_12_PAGES = [
  'index.html',
  'explore.html',
  'recipe.html',
  'create-recipe.html',
  'chef.html',
  'dashboard.html',
  'supplies.html',
  'courses.html',
  'chat.html',
  'notifications.html',
  'settings.html',
  'auth.html'
];

const SEARCH_PAGES = ALL_12_PAGES.filter(page => page !== 'auth.html');

function extractSearchModal(content, page) {
  const start = content.indexOf('<!-- ================= SEARCH MODAL PALETTE ================= -->');
  const end = content.indexOf('<!-- ================= MOBILE NAVIGATION DRAWER', start);
  assert.ok(start >= 0 && end >= 0, `${page} must contain the canonical search modal`);
  return content.slice(start, end);
}

test('E2E Suite: All 12 HTML Pages Exist and are Valid', (t) => {
  for (const page of ALL_12_PAGES) {
    const filePath = path.resolve(process.cwd(), page);
    assert.ok(fs.existsSync(filePath), `Page file ${page} must exist in project root`);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.length > 500, `Page file ${page} must have substantial content (got ${content.length} bytes)`);
    assert.ok(content.includes('<!DOCTYPE html>'), `${page} must declare <!DOCTYPE html>`);
    assert.ok(content.includes('<html'), `${page} must contain <html> tag`);
    assert.ok(content.includes('</html>'), `${page} must contain closing </html> tag`);
    assert.ok(content.includes('<head>'), `${page} must contain <head>`);
    assert.ok(content.includes('</head>'), `${page} must contain closing </head>`);
    assert.ok(content.includes('<body'), `${page} must contain <body>`);
    assert.ok(content.includes('</body>'), `${page} must contain closing </body>`);
  }
});

test('E2E Suite: Synchronous Anti-FOUC Script in <head> across all 12 pages', (t) => {
  for (const page of ALL_12_PAGES) {
    const filePath = path.resolve(process.cwd(), page);
    const content = fs.readFileSync(filePath, 'utf-8');
    const headSection = content.substring(content.indexOf('<head>'), content.indexOf('</head>'));

    assert.ok(headSection.includes('<script>'), `${page} must have an inline <script> in <head>`);
    assert.ok(
      headSection.includes('localStorage.getItem(\'meyar_theme\')') ||
      headSection.includes('localStorage.getItem("meyar_theme")'),
      `${page} Anti-FOUC script must check meyar_theme preference`
    );
    assert.ok(
      headSection.includes('localStorage.getItem(\'meyar_lang\')') ||
      headSection.includes('localStorage.getItem("meyar_lang")'),
      `${page} Anti-FOUC script must check meyar_lang preference`
    );
    assert.ok(
      headSection.includes('document.documentElement.classList.add(\'dark\')') ||
      headSection.includes('document.documentElement.classList.add("dark")'),
      `${page} Anti-FOUC script must apply dark class directly`
    );
    assert.ok(
      headSection.includes('document.documentElement.setAttribute(\'dir\'') ||
      headSection.includes('document.documentElement.setAttribute("dir"'),
      `${page} Anti-FOUC script must set dir attribute`
    );
  }
});

test('E2E Suite: Shared Search Modal Markup across all app pages', () => {
  const canonical = extractSearchModal(fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8'), 'index.html');

  for (const page of SEARCH_PAGES) {
    const content = fs.readFileSync(path.resolve(process.cwd(), page), 'utf-8');
    assert.equal(extractSearchModal(content, page), canonical, `${page} search modal must match the feed search modal`);
  }
});

test('E2E Suite: 100% Solid Surfaces - Zero Glassmorphism across all pages and JS/CSS sources', (t) => {
  for (const page of ALL_12_PAGES) {
    const filePath = path.resolve(process.cwd(), page);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(!content.includes('backdrop-' + 'blur'), `${page} must not contain any backdrop-blur classes`);
    assert.ok(!content.includes('backdrop-' + 'filter'), `${page} must not contain any backdrop-filter styles`);
  }

  const inputCssPath = path.resolve(process.cwd(), 'css/input.css');
  if (fs.existsSync(inputCssPath)) {
    const inputCss = fs.readFileSync(inputCssPath, 'utf-8');
    assert.ok(!inputCss.includes('backdrop-' + 'blur'), 'css/input.css must not define backdrop-blur');
    assert.ok(!inputCss.includes('backdrop-' + 'filter'), 'css/input.css must not define backdrop-filter');
  }

  // Verify all js files also enforce solid surfaces
  const jsDir = path.resolve(process.cwd(), 'js');
  function scanJs(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        scanJs(p);
      } else if (p.endsWith('.js')) {
        const c = fs.readFileSync(p, 'utf-8');
        assert.ok(!c.includes('backdrop-' + 'blur'), `${f} must not contain backdrop-blur`);
        assert.ok(!c.includes('backdrop-' + 'filter'), `${f} must not contain backdrop-filter`);
      }
    }
  }
  scanJs(jsDir);
});

test('E2E Suite: Strict CSS Logical Properties Parity across all 12 pages', (t) => {
  const forbiddenPatterns = [
    /\b(mr|ml|pr|pl)-[0-9]/g,
    /\b(text-left|text-right)\b/g,
    /\b(border-l|border-r)\b/g,
    /\b(border-l-|border-r-)[0-9]/g,
    /\b(left|right)-[0-9]/g
  ];

  for (const page of ALL_12_PAGES) {
    const filePath = path.resolve(process.cwd(), page);
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pat of forbiddenPatterns) {
      const matches = [...content.matchAll(pat)];
      assert.equal(
        matches.length,
        0,
        `${page} contains forbidden physical directional properties: ${matches.map(m => m[0]).join(', ')}`
      );
    }
  }
});

test('E2E Suite: Internal Link Integrity - Zero Broken Links across all 12 pages', (t) => {
  for (const page of ALL_12_PAGES) {
    const filePath = path.resolve(process.cwd(), page);
    const content = fs.readFileSync(filePath, 'utf-8');
    const hrefMatches = [...content.matchAll(/href=[\"']([^\"']+)[\"']/g)];

    for (const match of hrefMatches) {
      const rawHref = match[1];
      if (
        rawHref.startsWith('#') ||
        rawHref.startsWith('http://') ||
        rawHref.startsWith('https://') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('javascript:')
      ) {
        continue;
      }

      const cleanHref = rawHref.split('?')[0].split('#')[0];
      if (!cleanHref) continue;

      const targetPath = path.resolve(process.cwd(), cleanHref);
      assert.ok(
        fs.existsSync(targetPath),
        `Broken link in ${page}: href="${rawHref}" -> "${cleanHref}" does not exist`
      );
    }
  }
});

test('E2E Suite: Bilingual Translation Dictionary - 100% Coverage of HTML data-i18n keys', (t) => {
  const allKeys = new Set();

  for (const page of ALL_12_PAGES) {
    const filePath = path.resolve(process.cwd(), page);
    const content = fs.readFileSync(filePath, 'utf-8');
    const keyMatches = [...content.matchAll(/data-i18n(?:-placeholder|-aria-label)?=[\"']([^\"']+)[\"']/g)];

    for (const match of keyMatches) {
      const key = match[1];
      allKeys.add(key);

      assert.ok(
        translations.ar[key] !== undefined,
        `Page ${page} uses key "${key}" which is missing in Arabic translation dictionary`
      );
      assert.ok(
        translations.en[key] !== undefined,
        `Page ${page} uses key "${key}" which is missing in English translation dictionary`
      );
    }
  }

  assert.ok(allKeys.size >= 30, `Must have exhaustive translation keys coverage (checked ${allKeys.size} distinct keys)`);
});

test('E2E Suite: Compiled Production Tailwind CSS Verification', (t) => {
  const cssPath = path.resolve(process.cwd(), 'css/output.css');
  assert.ok(fs.existsSync(cssPath), 'css/output.css must be built');
  const css = fs.readFileSync(cssPath, 'utf-8');
  assert.ok(css.length > 5000, `css/output.css must be compiled production bundle (got ${css.length} bytes)`);

  // Verify custom theme variables
  assert.ok(css.includes('--color-canvas'), 'CSS must include --color-canvas definition');
  assert.ok(css.includes('--color-surface-1'), 'CSS must include --color-surface-1 definition');
  assert.ok(css.includes('--color-brand-gold'), 'CSS must include --color-brand-gold definition');
  assert.ok(css.includes('--color-brand-emerald'), 'CSS must include --color-brand-emerald definition');
});

test('E2E Suite: Mock Data Structure & Entity Interoperability', (t) => {
  assert.ok(Array.isArray(MOCK_DATA.chefs) && MOCK_DATA.chefs.length >= 3, 'Must have at least 3 chefs in mock data');
  assert.ok(Array.isArray(MOCK_DATA.recipes) && MOCK_DATA.recipes.length >= 4, 'Must have at least 4 recipes in mock data');
  assert.ok(Array.isArray(MOCK_DATA.supplies) && MOCK_DATA.supplies.length >= 4, 'Must have at least 4 supplies in mock data');
  assert.ok(Array.isArray(MOCK_DATA.courses) && MOCK_DATA.courses.length >= 3, 'Must have at least 3 courses in mock data');
  assert.ok(MOCK_DATA.user && MOCK_DATA.user.id, 'Must have default logged in user in mock data');

  // Verify cross-entity references
  for (const recipe of MOCK_DATA.recipes) {
    const authorExists = MOCK_DATA.chefs.some(c => c.id === recipe.author_id);
    assert.ok(authorExists, `Recipe ${recipe.id} author ${recipe.author_id} must exist in chefs list`);
  }
});

test('E2E Suite: Scaler & Financial Calculation Precision', (t) => {
  // Scaler test
  const scaler = new RecipeScaler({
    baseServings: 4,
    ingredients: [
      { name_ar: 'لحم واغيو A5', name_en: 'A5 Wagyu Beef', amount: 200, unit_ar: 'جرام', unit_en: 'g' },
      { name_ar: 'زبدة مدخنة', name_en: 'Smoked Butter', amount: 50, unit_ar: 'جرام', unit_en: 'g' }
    ]
  });
  scaler.setServings(8);
  const scaled = scaler.getScaledIngredients();
  assert.equal(scaled[0].scaledAmount, 400);
  assert.equal(scaled[1].scaledAmount, 100);

  // RFQ Estimate test
  const est = RFQManager.calculateEstimate(1500, 10);
  assert.equal(est.subtotal, 15000);
  assert.equal(est.vat, 2250);
  assert.equal(est.total, 17250);
});

test('E2E Suite: Search Normalization & Diacritic Insensitivity', (t) => {
  const normAr1 = normalizeSearchQuery('شَيْف فَيْصَل');
  const normAr2 = normalizeSearchQuery('شيف فيصل');
  assert.equal(normAr1, normAr2, 'Arabic search normalization must strip diacritics');

  const normAlef1 = normalizeSearchQuery('أندلسي');
  const normAlef2 = normalizeSearchQuery('اندلسي');
  assert.equal(normAlef1, normAlef2, 'Arabic search normalization must normalize alef variants');
});
