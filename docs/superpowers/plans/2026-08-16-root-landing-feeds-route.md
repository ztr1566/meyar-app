# Root Landing and Feeds Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` serve a public Meyar landing page and make `/feeds` serve the existing public feed without changing feed state, API behavior, or query parameters.

**Architecture:** Keep the static multi-page application. Rename the current feed document to `feeds.html`, serve it through a Fastify `/feeds` alias, and create a new standalone `index.html` landing page. Keep feed links as `.html` targets in static markup so direct `file://` usage continues to work.

**Tech Stack:** Static HTML, Tailwind CSS v4, browser ES modules bundled with esbuild, Fastify static serving, Node.js native test runner.

**Spec:** `docs/superpowers/specs/2026-08-16-routing-page-architecture-design.md`

## Global Constraints

- Preserve the existing static multi-page architecture; do not add a client-side router.
- Keep `/feeds` public for this change; do not add auth guards or session persistence.
- Preserve existing feed state, API queries, recipe query strings, and page controllers.
- Keep `.html` static links for the repository's existing `file://` workflow; expose `/feeds` through the server.
- Use existing Meyar typography, color tokens, i18n, theme handling, and build scripts.
- Do not add a TypeScript layer or route-constants abstraction where none exists.
- Run `npm run test` and `npm run build` before claiming completion.

---

## File Map

- Rename `index.html` to `feeds.html`: existing feed document and app shell.
- Create `index.html`: public landing page with public navigation and marketing content.
- Modify `server/plugins/static.js`: serve `feeds.html` at `GET /feeds`.
- Modify `js/main.js`: recognize feed paths and stop treating root as a feed fallback.
- Modify `js/app.js`: map `feeds` and `feeds.html` to the feed active-nav key.
- Modify `scripts/update-all-navbars.mjs`: generate app links to `feeds.html` and process `feeds.html` instead of `index.html`.
- Modify app HTML files through the navbar script: move shared feed links to `feeds.html`.
- Modify `js/pages/auth.js` and `js/pages/chef.js`: update hardcoded feed targets.
- Modify `js/data/translations.js`: add landing copy in Arabic and English.
- Modify `tests/e2e.test.mjs`, `tests/dom-render.test.mjs`, `tests/server.test.mjs`, and create `tests/main.test.mjs`: lock the page split and route behavior.
- Regenerate `js/bundle.js` and `css/output.css` with the existing build commands.

### Task 1: Split the Feed Document and Add Landing Coverage

**Files:**
- Rename: `index.html` -> `feeds.html`
- Create: `index.html`
- Modify: `tests/e2e.test.mjs`
- Modify: `tests/dom-render.test.mjs`

**Interfaces:**
- Produces `feeds.html` containing `feed-posts-container`, `stories-track`, and the canonical search modal.
- Produces `index.html` without feed DOM markers and with a public CTA to `feeds.html`.
- Produces test page lists that distinguish app pages from the public landing page.

- [ ] **Step 1: Update the page lists before changing the files**

In `tests/e2e.test.mjs`, replace the single `ALL_12_PAGES` definition with these lists and update existing loops to use `ALL_PAGES`:

```js
const APP_PAGES = [
  'feeds.html',
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

const PUBLIC_PAGES = ['index.html'];
const ALL_PAGES = [...APP_PAGES, ...PUBLIC_PAGES];
const SEARCH_PAGES = APP_PAGES.filter(page => page !== 'auth.html');
```

Change the canonical search-modal read from `index.html` to `feeds.html`, and keep the search-modal comparison limited to `SEARCH_PAGES` so the public landing page is not required to contain an app search palette.

- [ ] **Step 2: Update DOM-render test targets**

In `tests/dom-render.test.mjs`, read `feeds.html` for feed assertions and add a landing assertion that reads `index.html` and verifies it does not contain `feed-posts-container` or `stories-track`.

- [ ] **Step 3: Run the focused tests and confirm the expected red state**

Run:

```bash
node --test tests/e2e.test.mjs tests/dom-render.test.mjs
```

Expected: failure because `feeds.html` does not yet exist and `index.html` still contains the feed.

- [ ] **Step 4: Move the current feed file**

Run:

```bash
git mv index.html feeds.html
```

- [ ] **Step 5: Create the public landing document**

Create `index.html` with the existing anti-FOUC script, compiled stylesheet, and bundle, then use this structure:

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="apple-touch-icon" href="favicon.svg">
  <title>معيار | منصة الطهي الاحترافية</title>
  <meta name="description" content="معيار تجمع اكتشاف الوصفات والطهاة والتوريدات والتعليم في مساحة واحدة لمحترفي الطهي.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="معيار | منصة الطهي الاحترافية">
  <meta property="og:description" content="اكتشف وابتكر ونمِّ عالمك الطهوي مع معيار.">
  <meta property="og:url" content="/">
  <!-- Keep the same synchronous theme and language preference script used by the app pages. -->
  <link rel="stylesheet" href="./css/output.css">
</head>
<body class="bg-canvas text-text-main min-h-screen antialiased selection:bg-brand-gold selection:text-white">
  <header class="border-b border-border-subtle bg-surface-1">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      <a href="index.html" class="font-extrabold text-lg tracking-tight">معيار <span class="text-brand-gold">Meyar</span></a>
      <nav class="flex items-center gap-2 sm:gap-4" aria-label="Public navigation">
        <a href="feeds.html" data-i18n="nav.feed" class="text-sm font-semibold text-text-muted hover:text-text-main">الخلاصة</a>
        <a href="auth.html?tab=login" data-i18n="nav.auth_login" class="text-sm font-semibold text-text-muted hover:text-text-main">تسجيل الدخول</a>
        <a href="auth.html?tab=register" data-i18n="auth.tab_register" class="px-3 py-2 rounded-xl bg-brand-gold text-white text-sm font-bold">إنشاء حساب</a>
      </nav>
    </div>
  </header>
  <main>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
      <div>
        <p data-i18n="landing.eyebrow" class="text-sm font-bold text-brand-gold mb-4">مساحتك المهنية في عالم الطهي</p>
        <h1 data-i18n="landing.title" class="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">اكتشف، ابتكر، ونمِّ عالمك الطهوي</h1>
        <p data-i18n="landing.description" class="mt-6 max-w-2xl text-base sm:text-lg leading-8 text-text-muted">منصة واحدة تجمع الإلهام والمعرفة والفرص المهنية لمحترفي الطهي.</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a href="feeds.html" data-i18n="landing.feed_cta" class="px-5 py-3 rounded-xl bg-brand-gold text-white font-bold shadow-sm hover:bg-brand-gold-hover">استكشف الخلاصة</a>
          <a href="auth.html?tab=register" data-i18n="landing.register_cta" class="px-5 py-3 rounded-xl border border-border-subtle bg-surface-1 text-text-main font-bold hover:bg-surface-2">ابدأ الآن</a>
        </div>
      </div>
      <div class="rounded-3xl border border-border-subtle bg-surface-1 p-6 sm:p-8 shadow-xl">
        <div class="aspect-[4/3] rounded-2xl bg-surface-2 border border-border-subtle p-5 flex flex-col justify-between">
          <span class="text-xs font-bold text-brand-gold">Meyar / 01</span>
          <div>
            <p data-i18n="landing.card_label" class="text-sm text-text-muted">من الفكرة إلى الطبق</p>
            <p data-i18n="landing.card_title" class="mt-2 text-2xl font-extrabold">معايير أعلى لكل تجربة طهو</p>
          </div>
        </div>
      </div>
    </section>
    <section class="border-y border-border-subtle bg-surface-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-3 gap-5">
        <article class="p-5 rounded-2xl border border-border-subtle bg-surface-2">
          <h2 data-i18n="landing.discovery_title" class="font-extrabold text-lg">اكتشاف ملهم</h2>
          <p data-i18n="landing.discovery_text" class="mt-2 text-sm leading-7 text-text-muted">وصفات وأفكار من مجتمع طهو يتطور باستمرار.</p>
        </article>
        <article class="p-5 rounded-2xl border border-border-subtle bg-surface-2">
          <h2 data-i18n="landing.learning_title" class="font-extrabold text-lg">تعلم عملي</h2>
          <p data-i18n="landing.learning_text" class="mt-2 text-sm leading-7 text-text-muted">دورات وورش تساعدك على تحويل الشغف إلى مهارة.</p>
        </article>
        <article class="p-5 rounded-2xl border border-border-subtle bg-surface-2">
          <h2 data-i18n="landing.opportunity_title" class="font-extrabold text-lg">فرص أفضل</h2>
          <p data-i18n="landing.opportunity_text" class="mt-2 text-sm leading-7 text-text-muted">أدوات ومجتمع يدعمان نمو أعمال الطهي.</p>
        </article>
      </div>
    </section>
  </main>
  <footer class="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 text-sm text-text-muted flex flex-wrap justify-between gap-3">
    <span>معيار / Meyar</span>
    <a href="feeds.html" data-i18n="landing.footer_cta" class="font-semibold hover:text-text-main">ابدأ باستكشاف معيار</a>
  </footer>
  <script src="./js/bundle.js"></script>
</body>
</html>
```

Keep the anti-FOUC script from the old page verbatim in the marked location rather than replacing it with asynchronous theme logic.

- [ ] **Step 6: Run the focused page tests**

Run:

```bash
node --test tests/e2e.test.mjs tests/dom-render.test.mjs
```

Expected: page existence, feed-marker, landing-marker, and search-modal checks pass; translation checks remain red until Task 5 adds the new landing keys.

### Task 2: Make Client Initialization Route-Aware

**Files:**
- Modify: `js/main.js:56-69`
- Modify: `js/app.js:96-117`
- Create: `tests/main.test.mjs`

**Interfaces:**
- Produces exported `isFeedPath(pathname = '')` in `js/main.js`.
- `isFeedPath('/feeds')`, `isFeedPath('/feeds/')`, and `isFeedPath('/feeds.html')` return `true`; root and `index.html` return `false`.

- [ ] **Step 1: Add failing path-selection tests**

Create `tests/main.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { isFeedPath } from '../js/main.js';

test('isFeedPath recognizes the server and direct-file feed URLs', () => {
  assert.equal(isFeedPath('/feeds'), true);
  assert.equal(isFeedPath('/feeds/'), true);
  assert.equal(isFeedPath('/feeds.html'), true);
  assert.equal(isFeedPath('/'), false);
  assert.equal(isFeedPath('/index.html'), false);
});
```

- [ ] **Step 2: Run the new test and confirm it fails**

Run `node --test tests/main.test.mjs`.

Expected: FAIL because `isFeedPath` is not exported yet.

- [ ] **Step 3: Implement the minimal path helper and use it in bootstrap**

Add this export before `autoInitPage()` in `js/main.js`:

```js
export function isFeedPath(pathname = '') {
  const currentPath = pathname.split('/').filter(Boolean).pop()?.toLowerCase() || '';
  return currentPath === 'feeds' || currentPath === 'feeds.html';
}
```

Change the feed condition to retain DOM-marker detection and replace the old `currentPath === 'index.html' || currentPath === ''` fallback with `isFeedPath(currentPath)`. This keeps bootstrap safe in test environments that provide a document without a window.

Change `js/app.js` `pathToNav` to remove the `''` and `index.html` feed mappings and add:

```js
'feeds': 'feed',
'feeds.html': 'feed',
```

- [ ] **Step 4: Run the path and existing feed tests**

Run:

```bash
node --test tests/main.test.mjs tests/feed.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the route-aware bootstrap**

```bash
git add js/main.js js/app.js tests/main.test.mjs
git commit -m "feat: recognize feeds route in app bootstrap"
```

### Task 3: Serve `/feeds` from Fastify

**Files:**
- Modify: `server/plugins/static.js:41-53`
- Modify: `tests/server.test.mjs:41-57`

**Interfaces:**
- Produces HTTP `GET /feeds` with the same HTML document served by `feeds.html`.
- Keeps the existing root handler serving `index.html`.

- [ ] **Step 1: Extend the server test with route-specific assertions**

In the existing `frontend entrypoint and built assets are served` test, inject `GET /feeds` and assert:

```js
const feeds = await app.inject({ method: 'GET', url: '/feeds?filter=trending' });

assert.equal(feeds.statusCode, 200);
assert.match(feeds.headers['content-type'], /^text\/html/);
assert.match(feeds.body, /id="feed-posts-container"/);
assert.match(feeds.body, /<title[^>]*>.*خلاصة الاستكشاف/i);
```

Also assert the root body contains the landing page marker `landing.title` and does not contain `feed-posts-container`.

- [ ] **Step 2: Run the server test and confirm `/feeds` is red**

Run `node --test tests/server.test.mjs`.

Expected: FAIL because `/feeds` is not registered and `/` still serves the moved feed file until the route handler is updated.

- [ ] **Step 3: Register the feed alias**

Add this handler after the existing static registration in `server/plugins/static.js`:

```js
app.get('/feeds', (_request, reply) => reply.sendFile('feeds.html'));
```

Leave the existing root handler as:

```js
app.get('/', (_request, reply) => reply.sendFile('index.html'));
```

- [ ] **Step 4: Run the server test**

Run `node --test tests/server.test.mjs`.

Expected: PASS, including traversal protection and existing asset checks.

- [ ] **Step 5: Commit the server route**

```bash
git add server/plugins/static.js tests/server.test.mjs
git commit -m "feat: serve feed at feeds route"
```

### Task 4: Audit Shared Navigation and Authentication Targets

**Files:**
- Modify: `scripts/update-all-navbars.mjs:6-8,35,76,195-215`
- Modify: generated app HTML files in the repository root except `index.html` and `auth.html`
- Modify: `js/pages/auth.js:393,475,524`
- Modify: `js/pages/chef.js:893`

**Interfaces:**
- Every authenticated app shell points feed navigation to `feeds.html`.
- Public auth navigation continues to point home to `index.html`.
- Successful login, registration, and social auth redirect to `feeds.html`.

- [ ] **Step 1: Update the navbar generator source**

In `scripts/update-all-navbars.mjs`:

- Replace the `index.html` page entry with `{ file: 'feeds.html', activeNav: 'feed' }`.
- Change the generated logo link and desktop feed link from `index.html` to `feeds.html`.
- Before writing each generated app page, replace remaining exact static feed links with:

```js
content = content.replaceAll('href="index.html"', 'href="feeds.html"');
```

Run this replacement only inside the listed app pages, never on the public `index.html` or `auth.html`.

- [ ] **Step 2: Run the repository navbar generator**

Run:

```bash
node scripts/update-all-navbars.mjs
```

Expected: the app pages, including `feeds.html`, are rewritten with the generated header and all app feed links use `feeds.html`.

- [ ] **Step 3: Update non-template JavaScript targets**

Change all three successful-auth redirect assignments in `js/pages/auth.js` to:

```js
window.location.href = 'feeds.html';
```

Change the feed link rendered by `js/pages/chef.js` from `index.html` to `feeds.html` without touching its existing activity content or query strings.

- [ ] **Step 4: Verify the logo rule and link audit**

Run:

```bash
rg -n 'href="index\.html"|href="feeds\.html"' --glob '*.html' --glob '!index.html'
```

Expected: `auth.html` retains its public home link to `index.html`; app pages use `feeds.html`; no app navbar or breadcrumb points to the former feed root.

- [ ] **Step 5: Run navigation integrity tests**

Run `node --test tests/e2e.test.mjs tests/auth.test.mjs`.

Expected: PASS after Task 5 supplies landing translations; if run before Task 5, only the new landing-key coverage may be red.

- [ ] **Step 6: Commit the navigation audit**

```bash
git add scripts/update-all-navbars.mjs js/pages/auth.js js/pages/chef.js *.html
git commit -m "refactor: point app navigation to feeds page"
```

### Task 5: Finalize Landing/Feed SEO and Bilingual Copy

**Files:**
- Modify: `index.html`
- Modify: `feeds.html`
- Modify: `js/data/translations.js`
- Generated: `js/bundle.js`, `css/output.css`

**Interfaces:**
- Landing metadata describes the public Meyar product page.
- Feed metadata describes the discovery feed and canonical `/feeds` URL.
- All new `data-i18n` keys exist in both translation dictionaries.

- [ ] **Step 1: Add the exact landing translation keys**

Add these keys to both `translations.ar` and `translations.en`:

```js
// Arabic
'landing.eyebrow': 'مساحتك المهنية في عالم الطهي',
'landing.title': 'اكتشف، ابتكر، ونمِّ عالمك الطهوي',
'landing.description': 'منصة واحدة تجمع الإلهام والمعرفة والفرص المهنية لمحترفي الطهي.',
'landing.feed_cta': 'استكشف الخلاصة',
'landing.register_cta': 'ابدأ الآن',
'landing.card_label': 'من الفكرة إلى الطبق',
'landing.card_title': 'معايير أعلى لكل تجربة طهو',
'landing.discovery_title': 'اكتشاف ملهم',
'landing.discovery_text': 'وصفات وأفكار من مجتمع طهو يتطور باستمرار.',
'landing.learning_title': 'تعلم عملي',
'landing.learning_text': 'دورات وورش تساعدك على تحويل الشغف إلى مهارة.',
'landing.opportunity_title': 'فرص أفضل',
'landing.opportunity_text': 'أدوات ومجتمع يدعمان نمو أعمال الطهي.',
'landing.footer_cta': 'ابدأ باستكشاف معيار',

// English
'landing.eyebrow': 'Your professional space for culinary craft',
'landing.title': 'Discover, create, and grow your culinary world',
'landing.description': 'One platform for inspiration, knowledge, and professional opportunities in food.',
'landing.feed_cta': 'Explore the feed',
'landing.register_cta': 'Get started',
'landing.card_label': 'From idea to plate',
'landing.card_title': 'A higher standard for every culinary experience',
'landing.discovery_title': 'Find inspiration',
'landing.discovery_text': 'Recipes and ideas from a culinary community that keeps evolving.',
'landing.learning_title': 'Learn by doing',
'landing.learning_text': 'Courses and workshops that turn passion into skill.',
'landing.opportunity_title': 'Grow with opportunity',
'landing.opportunity_text': 'Tools and a community built around culinary business growth.',
'landing.footer_cta': 'Start exploring Meyar'
```

Place the Arabic entries in the Arabic dictionary and the English entries in the English dictionary; do not add the opposite-language block to either object.

- [ ] **Step 2: Verify landing copy uses the new keys**

In `index.html`, verify that the title, hero copy, CTA labels, card labels, feature headings/body text, and footer CTA use the `data-i18n` attributes shown in the landing structure from Task 1. Keep the Arabic fallback text in the HTML.

- [ ] **Step 3: Verify landing metadata and add feed metadata**

Keep the product-focused title, description, and OpenGraph tags already added to `index.html` in Task 1. In `feeds.html`, keep the existing feed title and add:

```html
<meta name="description" content="استكشف وصفات الطهاة وأفكار مجتمع معيار في خلاصة طهو متجددة.">
<meta property="og:type" content="website">
<meta property="og:title" content="خلاصة الاستكشاف - معيار | Meyar">
<meta property="og:description" content="استكشف وصفات وأفكار مجتمع معيار.">
<meta property="og:url" content="/feeds">
```

Keep the landing metadata in `index.html` focused on the public product rather than feed content.

- [ ] **Step 4: Run the translation and page-integrity tests**

Run:

```bash
node --test tests/e2e.test.mjs tests/dom-render.test.mjs
```

Expected: PASS, including bilingual-key coverage, page validity, solid surfaces, logical CSS checks, search-modal parity, and link integrity.

- [ ] **Step 5: Rebuild generated assets**

Run:

```bash
npm run build
```

Expected: `js/bundle.js` and `css/output.css` are regenerated without build errors and include the new translation keys/classes.

- [ ] **Step 6: Commit SEO, translations, and generated assets**

```bash
git add index.html feeds.html js/data/translations.js js/bundle.js css/output.css
git commit -m "feat: add public Meyar landing metadata and copy"
```

### Task 6: Run the Full Verification Gate

**Files:**
- Verify: all changed files from Tasks 1-5
- No new production files are expected in this task.

**Interfaces:**
- The final tree serves the landing page at `/`, the feed at `/feeds`, and the direct feed document at `feeds.html`.

- [ ] **Step 1: Run the full native test suite**

Run `npm run test`.

Expected: all tests pass with zero failures.

- [ ] **Step 2: Rebuild once from the final source state**

Run `npm run build`.

Expected: CSS and JS builds complete successfully.

- [ ] **Step 3: Check the complete diff for whitespace errors**

Run `git diff --check`.

Expected: no output and exit code 0.

- [ ] **Step 4: Verify the route/link contract**

Run:

```bash
rg -n 'feed-posts-container|landing\.title|href="index\.html"|href="feeds\.html"' --glob '*.html'
```

Confirm manually that:

- Only `feeds.html` contains the feed DOM marker.
- `index.html` contains the landing marker and public home logo.
- App pages target `feeds.html` for feed navigation.
- `auth.html` targets `index.html` for its public home/back control.

- [ ] **Step 5: Inspect the final worktree**

Run `git status --short` and review the diff for unrelated changes. Leave the approved design commit intact and do not revert unrelated user changes.
