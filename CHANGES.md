# Changes Document

## Session Summary: Admin Panel Phase 1 — Supabase Backend

- `supabase/migrations/` (run in order): **schema** (categories, products, product images, related products, media library, banners, enquiries + items + attachments, site settings, admin users, audit log), **security** (owner / editor / sales roles, row-level security on every table, `submit_enquiry` function for the public site, audit triggers, last-owner protection), **storage** (public `media` bucket, private `enquiry-attachments` bucket, upload rules).
- `supabase/make-me-owner.sql` — makes your login the Owner.
- `supabase/tests/security.test.mjs` — runs all migrations in an in-memory Postgres and checks 41 permission/safety rules (`npm run test:db`).
- `src/lib/supabase.js` — website connection (inactive until `.env.local` is filled; site still uses products.json).
- `scripts/check-supabase.mjs` — `npm run check:supabase` verifies a live project with the public key.
- `.env.example`, `docs/SUPABASE_SETUP.md` (step-by-step setup).
- New packages: `@supabase/supabase-js` (site), `@electric-sql/pglite` (dev, tests only).

## Session Summary: WhatsApp Buttons, Name Fixes, Admin Plan Decisions

- **WhatsApp (+91 73389 70698)**: product pages now have a WhatsApp button beside "Add to Enquiry" (replacing the "Data Sheet" button, which did nothing), the enquiry page has "Or send this list on WhatsApp", and a small floating WhatsApp button shows on every page. Messages are pre-filled with product, quantity, sizes and note. Styled in brand red/grey/white. Number lives in `src/utils/whatsapp.js`.
- **Product names**: "PTFE Immersion Heaters" → **Fluoropolymer Immersion Heaters (PTFE / PVDF)**; "Bayonet" and "Threaded" thermocouples merged into **Bayonet & Threaded Thermocouples** (37 products).
- **Hostinger**: `public/.htaccess` added so page refreshes work on Apache and images are cached.
- **Admin plan** (`docs/ADMIN_PANEL_PLAN.md`): decisions recorded — owner + roles, enquiries in panel + WhatsApp, Hostinger, no prices, subtle banners (top strip + hero slide, no popups), English only.

## Session Summary: One Product per Photo Type + Search Keywords

- **Split galleries**: products that bundled different items under one name (e.g. "Tubular Heaters" with 18 photos) are now separate products named for exactly what the photo shows — 38 products, max 4 photos each (all photos of the same item).
  - Tubular: Ring, Single-Ended Straight, Double-Ended Straight, Spiral Hot Plate, Flange Immersion (Kettle), Concentric Ring Oven, Screw Plug Immersion, Finned Air, Serpentine (Grid), U-Shaped, Cast-in Plate, PTFE Immersion.
  - Coil: Spring Coil, Compact Coil. Hot Runner: Sleeve Type Coil Heaters, Hot Runner Nozzle with Coil Heater. Manifold: Manifold Heaters, Manifold Plate with Pressed-in Heater.
  - Glass: + Quartz Infrared Heater Modules. Thermocouples: Head Type, MI with Braided Cable, Bayonet, Threaded, Washer & Nozzle. Controllers: 4-Zone and 6-Zone Hot Runner, Digital.
- **Duplicates**: 17 indusheaters.com images that are the same photo as one of the originals are no longer shown twice (the higher-resolution original is shown). No files deleted.
- **Keywords**: every product has a `keywords` list of everyday names and common misspellings (e.g. geyser element, immersion rod, IR lamp, temp sensor, thermocupal, catridge heater, PID controller).
- **Search** (`src/utils/productSearch.js`): catalogue search matches names, keywords, category, description and applications; ranks name/keyword matches first; ignores plural "s".
- **SEO**: site `<title>`, meta description and keywords in `index.html`; each product page sets its own title, description and keywords.
- **Old links**: an old product address whose product was split redirects to its category list.

## Session Summary: Catalogue Rebuilt From indusheaters.com

- **Source**: product names, categories, descriptions, features, applications and all 48 images taken from www.indusheaters.com (9 category pages + homepage slideshow). Images live in `public/images/products/` with the site's original filenames.
- **Categories** (`src/data/categories.js`): Tubular, Cartridge, Band, Coil, Hot Runner, Manifold, Glass Heaters, Thermocouples, Temperature Controllers. Home tiles use the homepage slideshow images.
- **Products** (`src/data/products.json`): 17 products, each with every photo the company site shows for it. Specs are taken from the site text (e.g. coil heaters 450°C, ceramic band up to 300°C, manifold sheath 6–8.5 mm).
- **Image fixes vs. the old site**: `glassheaters4.jpg` (a silica glass heater) moved from "Medium Wave" to "Silica Glass Heaters", which had no photo.
- **Original photos added too**: web-sized copies of the 32 photos in `public/images/` (tif converted to jpg) are in `public/images/originals/` and appended to the matching product galleries (78 images in total). The original files are unchanged. `DSC_0087.JPG` and `IMG_9441.JPG` became two new products under Tubular Heaters: **Cast-in Plate Heaters** and **PTFE Immersion Heaters** (19 products total; all 32 originals now shown).
- **Product page**: new thumbnail gallery shows all photos; Features / Applications boxes hide when a product has none.
- Category filtering by `category` slug, related products reading each product's own list, and alt-text fixes from the earlier audit are kept.

## Session Summary: 5 Tasks Implementation (Hero Line Spacing, Slideshow Source, Values Icons, Milestones Growth Graph, Heading Highlights)

### Task 1: Hero Headline Line Spacing
- Refactored `<h1>` headline in [Home.jsx](file:///c:/Users/shash/Desktop/indus/Indus-WH-/src/pages/Home.jsx) to use unitless `line-height: 1.25` directly (`style={{ lineHeight: 1.25 }}`), matching the hero paragraph.
- Removed block wrappers, margins, and redundant height wrappers that introduced extra vertical gaps between lines.
- Configured mobile responsive layout to 2 lines (`BUILT FOR HEAT.` / `BUILT TO LAST.`) using fluid clamp typography (`clamp(1.25rem, 5.6vw, 1.75rem)`), and desktop to 4 lines with clean grey and red accent color split.

### Task 2: Hero Slideshow Image Source
- Updated glob import in [Home.jsx](file:///c:/Users/shash/Desktop/indus/Indus-WH-/src/pages/Home.jsx) to target `/src/image-animation/*.{jpg,jpeg,png,webp,avif}`.
- Removed arbitrary filename filters and added alphabetical sorting (`.sort(([a], [b]) => a.localeCompare(b))`) to ensure clean sequential crossfade presentation across all 8 assets.

### Task 3: About Values Section Redesign
- Enhanced Core Principles cards in [About.jsx](file:///c:/Users/shash/Desktop/indus/Indus-WH-/src/pages/About.jsx) with custom inline SVGs (Precision crosshair/target, Reliability shield-check, Customization sliders) styled with 1.5px stroke in `#d81b21`.
- Added numbered indices (`01`, `02`, `03`) in subtle grey.
- Integrated interactive hover states: icon subtle translation (`-translate-y-0.5`), card background shift, and animated expanding red underline beneath each title.

### Task 4: Company Milestones Growth Graph
- Replaced the static timeline in [About.jsx](file:///c:/Users/shash/Desktop/indus/Indus-WH-/src/pages/About.jsx) with a responsive, animated SVG growth curve with area gradient fill.
- Placed 4 milestone data points (2002: Established, 2008: Expanded, 2015: Mutlur Plant, Now: Indus Heaters Pvt Ltd) along the growth curve.
- Implemented IntersectionObserver with smooth `stroke-dashoffset` path draw and staggered marker dot entries. Respects `prefers-reduced-motion`.
- Added pulsing live ring on "Now" milestone.
- Structured detailed milestone summaries beneath the graph in a 4-column desktop / responsive stacked mobile grid.

### Task 5: Heading Color Treatment
- Updated [SectionHeading.jsx](file:///c:/Users/shash/Desktop/indus/Indus-WH-/src/components/SectionHeading.jsx) so that the default heading color on white backgrounds is `#515151` (`text-primary`), replacing full red.
- Wrapped 1–2 key words per heading in `<span className="text-accent">` to add purposeful red emphasis:
  - **Home**: `PRECISION HEATING RANGE` -> `PRECISION`
  - **Home**: `PRECISION. EXPERIENCE. UNWAVERING TRUST.` -> `PRECISION`
  - **Home**: `INDUSTRIES WE SERVE` -> `SERVE`
  - **About**: `PRECISION. EXPERIENCE. TRUST.` -> `EXPERIENCE`
  - **About**: `COMPANY MILESTONES` -> `MILESTONES`
  - **About**: `OUR CORE PRINCIPLES` -> `PRINCIPLES`
  - **About**: `OUR FACILITIES` -> `FACILITIES`
  - **About**: `Indus Heaters Private Limited` -> `Private Limited`
  - **Products**: `PRODUCT INVENTORY` -> `INVENTORY`
  - **Contact**: `CONTACT US` -> `US`
  - **Enquiry**: `SEND ENQUIRY` -> `ENQUIRY`
  - **ProductDetail**: `RELATED PRODUCTS` -> `PRODUCTS` (and product card names in grey with red hover)
