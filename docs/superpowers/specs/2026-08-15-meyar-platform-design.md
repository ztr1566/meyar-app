# Meyar (معيار) Platform - Architecture & Design Specification

**Date:** 2026-08-15  
**Status:** Approved  
**Author:** Principal UI/UX Architect & Staff Frontend Systems Engineer  

---

## 1. Overview & Vision

**Meyar (معيار)** is a high-end culinary social network and B2B supplies marketplace. It connects three primary user archetypes:

1. **Professional Chefs (Creators):** Publish structured recipes, showcase fine dining portfolios, conduct masterclasses, and collaborate.
2. **Cooking Enthusiasts (Consumers):** Discover trending culinary creations, scale recipe ingredients dynamically, and enroll in workshops.
3. **Culinary Suppliers (B2B Vendors):** List commercial equipment, bulk specialty ingredients, and negotiate bulk Orders through a built-in Request for Quotation (RFQ) system.

---

## 2. Technical Stack & Architectural Principles

- **Core Technologies:** Semantic HTML5, Tailwind CSS v4 (`@theme` directive in CSS), modular Vanilla JavaScript (ES modules).
- **Runtime:** Zero external UI frameworks (No React, Next.js, or runtime libraries).
- **100% Solid Surfaces:** Strictly no glassmorphism, zero `backdrop-blur`, and zero semi-transparent background hacks. Visual depth is created entirely via solid surface elevation layers, 1px crisp hairline borders, and subtle elevation shadows.
- **Bilingual Engine (AR / EN):** Instant client-side switching between Arabic (`dir="rtl"`, Cairo font) and English (`dir="ltr"`, Inter font) without page reload.
- **Strict CSS Logical Properties:** Exclusively use `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `border-s`, `border-e`. Never use hardcoded `left` or `right` utilities to guarantee 100% bidirectional parity.
- **Theme System:** High-contrast Dark mode (default) and Light mode, fortified with an inline synchronous anti-FOUC script in `<head>` on all pages.
- **Icons:** Pure inline Lucide-style SVG vector icons (`aria-hidden="true"`).

---

## 3. Solid Color Tokens & Typography

### Dark Mode (Luxury Forest Obsidian - Default)

- **Canvas / Background:** `#080C0A` (Deep Matte Forest Obsidian)
- **Surface 1 (Topbars, Sidebars, Base Cards):** `#101713` (Solid Dark Slate Olive)
- **Surface 2 (Inputs, Inner Blocks, Modals, Hover States):** `#17221C` (Solid Elevated Slate)
- **Borders & Dividers:** `#223129` (Crisp Solid Hairline Border)
- **Text:** Primary `#F2F5F3` | Muted `#8E9E94`
- **Brand Accents:** Champagne Bronze Gold (`#C5A059`, Hover: `#D4AF37`) & Herbal Emerald (`#10B981`, Hover: `#059669`)

### Light Mode (Crisp Editorial Luxury)

- **Canvas / Background:** `#F8F9F8` (Warm Alabaster Canvas)
- **Surface 1 (Base Cards, Sidebars, Topbar):** `#FFFFFF` (Pure Solid White)
- **Surface 2 (Inputs, Badges, Secondary Containers):** `#EFF2F0` (Soft Sage Alabaster)
- **Borders & Dividers:** `#E2E8E4` (Crisp Neutral Border)
- **Text:** Primary `#111814` | Muted `#5A6B61`
- **Brand Accents:** Refined Bronze Gold (`#A68238`, Hover: `#B89242`) & Deep Herbal Green (`#047857`, Hover: `#065F46`)

### Typography

- **Arabic (`[dir="rtl"]`):** `'Cairo', system-ui, -apple-system, sans-serif`
- **English (`[dir="ltr"]`):** `'Inter', system-ui, -apple-system, sans-serif`

---

## 4. Directory & File Structure

```text
meyar-frontend/
├── index.html               # Main Discovery Feed (3-column layout)
├── explore.html             # Explore & Trends (Search, Categories & Dynamic Grid)
├── recipe.html              # Recipe Detail & Live Serving Scaler Widget
├── create-recipe.html       # Recipe Creation Studio (Multi-step Builder)
├── chef.html                # Chef Profile & Portfolio (6 Functional Tabs)
├── dashboard.html           # Creator & Supplier Analytics & Item Management
├── supplies.html            # B2B Culinary Marketplace & RFQ Drawer/Modal
├── courses.html             # Culinary Courses & Workshops Grid + Enrollment Modal
├── chat.html                # Direct Chat & RFQ Inquiries Negotiation
├── notifications.html       # Grouped Notifications Center & Filters
├── settings.html            # Account & Platform Settings
├── auth.html                # Unified Login / Register with 3-Role Selector
├── css/
│   ├── input.css            # Tailwind v4 theme definitions, solid tokens, font imports
│   └── output.css           # Compiled production stylesheet
├── js/
│   ├── app.js               # Global application bootstrapper (Theme, i18n, Modals, Search)
│   ├── core/
│   │   ├── theme.js         # Theme switcher & anti-FOUC listener
│   │   ├── i18n.js          # Bilingual translation engine & DOM attribute updater
│   │   ├── toast.js         # Solid floating toast notification system
│   │   └── modal.js         # Accessible modal & drawer controller (ESC key, focus trap)
│   ├── data/
│   │   ├── translations.js  # Bilingual dictionary for AR and EN
│   │   └── mock-data.js     # Rich culinary dataset (recipes, chefs, supplies, RFQs, courses)
│   ├── modules/
│   │   ├── scaler.js        # Dynamic recipe serving scaler & unit recalculation
│   │   ├── rfq.js           # B2B quotation builder, modal drawer & submission handler
│   │   ├── search.js        # Global Ctrl+K instant search overlay
│   │   └── chat-module.js   # Live direct messaging & RFQ negotiation preview
│   └── pages/               # Page controllers for individual views
│       ├── feed.js
│       ├── explore.js
│       ├── recipe-page.js
│       ├── create-recipe.js
│       ├── chef.js
│       ├── dashboard.js
│       ├── supplies.js
│       ├── courses.js
│       ├── chat.js
│       ├── notifications.js
│       ├── settings.js
│       └── auth.js
└── package.json             # Build toolchain (`@tailwindcss/cli`)
```

---

## 5. Page Specifications & Features

### 1. Authentication (`auth.html`)

- Unified card with Login & Register tabs.
- Registration role selector: **Chef (Creator)**, **Enthusiast (Home Cook)**, **Supplier (B2B Vendor)**.
- Form validation indicators, password reveal/hide toggle, social login buttons.

### 2. Main Discovery Feed (`index.html`)

- 3-column responsive layout:
  - **Left Column:** User profile snapshot, quick navigation links, Creator Hub mini-stats.
  - **Center Column:** Story reels of featured chefs, "Create Post" interactive box, rich recipe cards with prep times, like/save counters, and share modal triggers.
  - **Right Column:** Trending culinary topics, top-rated B2B suppliers, upcoming live masterclasses.

### 3. Explore & Trends (`explore.html`)

- Topic filter chips: Trending Recipes, Top Chefs, Seasonal Ingredients, Commercial Gear, Video Reels.
- Dynamic masonry-style grid with interactive cards, category badges, and quick-save triggers.

### 4. Recipe Detail & Dynamic Scaler (`recipe.html`)

- Hero header with high-resolution food presentation, difficulty tag, prep/cook/total times, calories, and author follow card.
- **Dynamic Serving Scaler Widget:**
  - Servings modifier (`+` / `-`) between 1 and 24 servings.
  - Real-time recalculation of ingredient quantities and fractional measures in both Arabic and English.
- Step-by-step interactive cooking instructions with completion checkboxes.
- Chef's notes, pairing recommendations, and nutritional breakdown.

### 5. Create & Publish Recipe (`create-recipe.html`)

- 4-Step Recipe Studio:
  1. *Basic Details:* Title, category, cuisine, cook time, base servings, difficulty.
  2. *Media:* Drag-and-drop cover and gallery image uploader mockup.
  3. *Dynamic Ingredients:* Add, remove, and reorder ingredient rows (quantity, unit selector, name, notes).
  4. *Instructions:* Add step-by-step instructions with optional timers and chef tips.
- Draft saving and Instant Publishing with toast feedback.

### 6. Chef Profile & Portfolio (`chef.html`)

- Verified chef header with avatar, cover, awards ribbon, follower count, and "Hire Chef / Contact" button.
- 6 Functional Tabs:
  1. *Recipes:* Grid of published recipes.
  2. *Portfolio:* High-end signature dishes linked directly to structured recipes.
  3. *Saved:* Curated recipe bookmarks.
  4. *Courses:* Workshops led by this chef.
  5. *Activity:* Recent comments and community updates.
  6. *About:* Culinary philosophy, Michelin/award history, and restaurant affiliations.

### 7. Creator & Supplier Dashboard (`dashboard.html`)

- KPI metrics overview: Profile views, Monthly impressions, RFQ inquiries, Gross revenue.
- Clean SVG/Canvas analytics charts.
- Tabbed management tables for Published Recipes, Marketplace Listings, and Pending RFQs with status badges and action menus.

### 8. B2B Culinary Marketplace (`supplies.html`)

- Commercial catalog: Heavy equipment, bulk specialty ingredients, chef knives, eco-packaging.
- Facet filters: Category, MOQ range, Verification status, Stock availability.
- **Request for Quotation (RFQ) Modal/Drawer:**
  - Dynamic item prefill.
  - Quantity selector, delivery address, target completion date, and notes.
  - Real-time quotation submission with instant feedback and sync to Chat/Dashboard.

### 9. Culinary Courses & Workshops (`courses.html`)

- Masterclass catalog with skill level badges (Beginner, Intermediate, Masterclass), seat counter, and instructor details.
- Interactive course detail modal with curriculum breakdown and 1-click enrollment.

### 10. Direct Chat & RFQ Inquiries (`chat.html`)

- Two-column split layout: Conversation list with tabs (All, Chefs, Suppliers) and active message thread.
- Rich RFQ negotiation cards embedded in chat stream with approve/counter options.
- Dynamic message sending simulation with auto-reply demonstration.

### 11. Notifications Center (`notifications.html`)

- Grouped notification feed: Likes & Saves, Comments, RFQ Inquiries, Course Updates.
- Mark All as Read button and category filters.

### 12. Account Settings (`settings.html`)

- Comprehensive configuration panels: Profile Information, Security & Password, Language & Region, Theme & Appearance, Notification Toggles, and Commercial B2B Profile.

---

## 6. Shared Global Components

- **Global Header (Topbar):** Brand logo with champagne gold accent, global search trigger (`Ctrl + K`), Theme toggle (Dark/Light), Language switcher (AR/EN), RFQ Inquiry drawer trigger, Notifications badge, and Profile dropdown.
- **Mobile Navigation Bar:** Bottom bar optimized for mobile viewports.
- **Solid Toast System (`js/core/toast.js`):** Lightweight, accessible floating toasts.
- **Global Search Overlay (`js/modules/search.js`):** `Ctrl + K` instant search indexing recipes, chefs, supplies, and courses.

---

## 7. Data Flow & Local State

- `localStorage.getItem('meyar_theme')`: Synced theme state (`dark` | `light`).
- `localStorage.getItem('meyar_lang')`: Synced language state (`ar` | `en`).
- `localStorage.getItem('meyar_saved_recipes')`: Array of saved recipe IDs.
- `localStorage.getItem('meyar_rfqs')`: Array of submitted quote requests.
- `localStorage.getItem('meyar_user_session')`: Current mock logged-in user profile.
