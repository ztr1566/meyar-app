# Agent Guide

This document outlines key build, test, and architecture details for agents working on this codebase.

## Build Commands

- **Build CSS**: `npm run build:css` (`tailwindcss -i ./css/input.css -o ./css/output.css --minify`)
- **Dev CSS (watch)**: `npm run dev:css`
- **Build JS**: `npm run build:js` (`esbuild js/main.js --bundle --outfile=js/bundle.js --format=iife --target=es2020`)
- **Build all**: `npm run build`

## Test Command

- **Run tests**: `npm run test` (runs native Node.js test runner: `node --test tests/*.test.mjs`)

## Repository Quirks & Scripts

- `node scripts/update-all-navbars.mjs` - Updates the global topbar/navbar across all HTML pages. Always run this after editing `update-all-navbars.mjs` or the header template within it.
- `node scripts/fix-solid-surfaces.mjs` - Rewrites tailwind classes from opacity/translucent variants to solid surfaces for proper light/dark mode compatibility.
- `node scripts/update-bundle-scripts.mjs` - Replaces page script tags with the bundled `js/bundle.js`.

## Tailwind v4 Setup

- Tailwind v4 configuration is in `css/input.css` under the `@theme` directive, utilizing CSS custom property mappings.
- HTML files and JS files are scanned using `@source` rules inside `css/input.css`.

## App Entrypoint & Bundling

- All modules, core functions, data models, and page-specific JS page controllers are imported and initialized from `js/main.js`.
- `js/main.js` bundles into `js/bundle.js` which is loaded directly by the static HTML files (enabling running under `file:///` protocols).

## Bilingual / Translation Setup

- Standard localization logic is in `js/core/i18n.js` with dictionary data in `js/data/translations.js`.
- Arabic is RTL (uses Cairo font), English is LTR (uses Inter font).

## Test Environment

- Because of no browser runtime in tests, a mock DOM environment (`setupDOM()`) is initialized per test file to mock `window`, `document`, `localStorage`, classLists, etc.

## Page Initialization & Bootstrapping

- **No Auto-Bootstrapping in Page Controllers**: Page files under `js/pages/` must never contain auto-bootstrap blocks (e.g., `document.addEventListener('DOMContentLoaded', ...)`) at the bottom. Initialization is delegated to `js/main.js` via `autoInitPage()`.
- **Idempotency Guard**: Every page controller's `init()` must start with an early exit guard: `if (this.isInitialized) return;` (or checks the DOM-reset variant `if (typeof document !== 'undefined' && this.lastDocument !== document) { this.isInitialized = false; this.lastDocument = document; }`) and set `this.isInitialized = true;` at the end to prevent double-binding click handlers or rendering cycles.
- **Test Isolation & Sequential Initializations**: In unit tests (e.g., `tests/chat.test.mjs`), if calling `PageClass.init()` multiple times sequentially with different mock parameters, manually reset the guard: `PageClass.isInitialized = false;` before calling `init()`.
