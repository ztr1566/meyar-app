import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { translations } from '../js/data/translations.js';

const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');

test('Landing page exposes a responsive public navigation', () => {
  assert.match(indexHtml, /<header[^>]+id="public-header"/);
  assert.match(indexHtml, /<nav[^>]+aria-label="Public navigation"/);
  assert.match(indexHtml, /<details[^>]+id="public-mobile-menu"/);
  assert.match(indexHtml, /<summary[^>]+data-i18n="landing\.menu"/);
  assert.match(indexHtml, /<div id="public-mobile-panel" class="fixed start-4 end-4 top-\[5\.25rem\]/);
  assert.match(indexHtml, /href="index\.html"[^>]+aria-current="page"/);

  for (const href of ['feeds.html', 'explore.html', 'courses.html', 'supplies.html']) {
    assert.match(indexHtml, new RegExp(`href="${href}"`), `public nav must link to ${href}`);
  }
});

test('Landing page contains a complete conversion journey', () => {
  for (const id of ['landing-hero', 'landing-paths', 'landing-toolkit', 'landing-preview', 'landing-cta']) {
    assert.match(indexHtml, new RegExp(`id="${id}"`), `${id} section must exist`);
  }

  assert.match(indexHtml, /<img[^>]+id="landing-hero-image"/);
  assert.match(indexHtml, /id="landing-preview-grid"/);
  assert.match(indexHtml, /photo-1590794056226-79ef3a8147e1/);
  assert.doesNotMatch(indexHtml, /photo-1594385208974/);
  assert.doesNotMatch(indexHtml, /Meyar \/ 01/);
});

test('Landing page translation keys exist in both languages', () => {
  const requiredKeys = [
    'landing.menu',
    'landing.nav_feed',
    'landing.hero_kicker',
    'landing.hero_title',
    'landing.hero_description',
    'landing.hero_primary',
    'landing.hero_secondary',
    'landing.hero_stat_chefs',
    'landing.hero_stat_recipes',
    'landing.hero_stat_workshops',
    'landing.paths_title',
    'landing.paths_description',
    'landing.toolkit_title',
    'landing.toolkit_description',
    'landing.preview_title',
    'landing.preview_description',
    'landing.preview_feed',
    'landing.preview_courses',
    'landing.preview_supplies',
    'landing.cta_title',
    'landing.cta_description',
    'landing.cta_button'
  ];

  for (const key of requiredKeys) {
    assert.equal(typeof translations.ar[key], 'string', `Arabic translation missing: ${key}`);
    assert.equal(typeof translations.en[key], 'string', `English translation missing: ${key}`);
  }
});
