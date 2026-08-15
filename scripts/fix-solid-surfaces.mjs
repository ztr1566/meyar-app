import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const filesToProcess = [
  'index.html',
  'auth.html',
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
  'js/pages/feed.js',
  'js/pages/explore.js',
  'js/pages/recipe-page.js',
  'js/pages/create-recipe.js',
  'js/pages/chef.js',
  'js/pages/dashboard.js',
  'js/pages/supplies.js',
  'js/pages/courses.js',
  'js/pages/chat.js',
  'js/pages/notifications.js',
  'js/pages/settings.js',
  'js/pages/auth.js',
  'js/modules/search.js',
  'js/modules/rfq.js',
  'js/modules/chat-module.js',
  'js/modules/scaler.js',
  'js/core/toast.js',
  'js/core/modal.js',
  'js/data/mock-data.js'
];

const regexReplacements = [
  // Backgrounds with opacity
  { from: /bg-(black|white|canvas|surface-1|surface-2|brand-gold|brand-emerald|red-500|amber-500|blue-500|purple-500|emerald-500)\/[0-9]+/g, to: (match, color) => {
    if (color === 'black' || color === 'canvas') return 'bg-canvas';
    if (color === 'white' || color === 'surface-1') return 'bg-surface-1';
    if (color === 'brand-gold' || color === 'brand-emerald' || color === 'red-500' || color === 'amber-500' || color === 'blue-500' || color === 'purple-500' || color === 'emerald-500') return 'bg-surface-2';
    return 'bg-surface-2';
  }},
  
  // Borders with opacity
  { from: /border-(brand-gold|brand-emerald|red-500|amber-500|blue-500|purple-500|emerald-500|border-subtle)\/[0-9]+/g, to: (match, color) => {
    if (color === 'border-subtle') return 'border-border-subtle';
    return `border-${color}`;
  }},

  // Hover backgrounds with opacity
  { from: /hover:bg-(red-500|brand-gold|brand-emerald|surface-2|surface-1)\/[0-9]+/g, to: 'hover:bg-surface-2' },
  
  // Hover borders with opacity
  { from: /hover:border-(brand-gold|brand-emerald|border-subtle)\/[0-9]+/g, to: (match, color) => `hover:border-${color}` },

  // Text with opacity
  { from: /text-white\/[0-9]+/g, to: 'text-text-muted' },
  { from: /text-black\/[0-9]+/g, to: 'text-text-muted' }
];

let totalChanges = 0;

for (const relPath of filesToProcess) {
  const filePath = path.join(rootDir, relPath);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const { from, to } of regexReplacements) {
    content = content.replace(from, to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated solid tokens in ${relPath}`);
    totalChanges++;
  }
}

console.log(`Total files updated for 100% solid surfaces: ${totalChanges}`);
