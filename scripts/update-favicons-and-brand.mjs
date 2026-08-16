import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

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

const faviconTags = `  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="apple-touch-icon" href="favicon.svg">`;

const mobileDrawerLogo = `<div class="w-9 h-9 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center p-1 shadow-sm shrink-0">
          <svg class="w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="drawer-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFF3D1"/>
                <stop offset="25%" stop-color="#F5C04E"/>
                <stop offset="65%" stop-color="#C5A059"/>
                <stop offset="100%" stop-color="#8C5E16"/>
              </linearGradient>
            </defs>
            <g transform="translate(-1, 0) scale(0.75)">
              <path d="M 21 44 C 14 36, 10 30, 10 22 C 10 13, 18 8, 27 8 C 31 8, 36 10, 39 13 C 44 6, 55 4, 63 8 C 70 11, 74 17, 74 22 C 74 27, 71 32, 69 31 C 67 30, 69 26, 68 22 C 66 15, 58 12, 50 14 C 44 16, 40 21, 36 22 C 32 23, 28 17, 24 17 C 19 17, 15 21, 16 26 C 17 32, 21 38, 26 43 Z" fill="url(#drawer-gold)"/>
              <path d="M 24 29 C 24 29, 29 35, 37 39 C 32 41, 26 37, 25 33 Z" fill="url(#drawer-gold)"/>
              <path d="M 25 45 C 31 45, 39 44, 43 43 C 41 45, 33 46, 25 46 Z" fill="url(#drawer-gold)"/>
              <path d="M 20 50 C 20 48, 52 48, 55 50 C 58 52, 57 56, 53 56 C 44 56, 23 56, 21 56 C 19 56, 20 52, 20 50 Z" fill="url(#drawer-gold)"/>
            </g>
          </svg>
        </div>`;

for (const page of ALL_12_PAGES) {
  const filePath = path.join(rootDir, page);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add favicon links to <head> if not present
  if (!content.includes('rel="icon"')) {
    content = content.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, `$1\n${faviconTags}`);
  }

  // 2. Replace generic mobile drawer logo
  const oldDrawerLogoRegex = /<div class="w-9 h-9 rounded-xl bg-brand-gold flex items-center justify-center text-white font-bold">[\s\S]*?<\/div>/;
  if (oldDrawerLogoRegex.test(content)) {
    content = content.replace(oldDrawerLogoRegex, mobileDrawerLogo);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated favicon and mobile drawer in ${page}`);
}
