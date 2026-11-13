# Changes Document

## Session Summary: Hosted on Vercel

- Live at **https://indus-heaters.vercel.app** (Vercel project `indus-heaters`, team "sha", Hobby plan).
- `vercel.json`: Vite build to `dist`, every address served by the app (refresh-safe), long caching for code and photos, `X-Robots-Tag: noindex` on /admin.
- `.vercelignore` keeps `.env.local` (and build leftovers) off Vercel; `.vercel/` link folder git-ignored.
- Supabase public URL and key added as Vercel environment variables (production, preview, development).
- Checked live: home, products (37 from Supabase, no broken photos), direct product URLs, admin sign-in, robots.txt; design preview disabled in production.
- Deploy again: `npx vercel@65.15.0 deploy --prod --scope sha-d5ae` (automatic deploys on GitHub push need a GitHub login connection in Vercel).

## Session Summary: Admin Panel Audit Fixes

Bugs:
- Renaming a product after its first save no longer changes its web address (each product gets a fresh form; tested with a real save).
- Clicking an item in the error list no longer asks "Leave without saving?".
- Text typed in an "Add" box is added when you leave the box; emptied lines remove themselves; empty entries are never saved.
- "Web address already used" opens the address box, explains the fix, and "Make unique" now works on existing products too.
- Category photo no longer shows a description box that wasn't saved.
- A connection problem at sign-in shows "We couldn't check your account — Try again" instead of "not staff".
- No more flash of the sign-in page after signing in; the button stops spinning if the check fails.

Smaller fixes:
- Box headings linked to their content for screen readers (no ids with spaces).
- Category "Move up/down" spoken names start with the visible words.
- Every photo is re-saved before upload, removing hidden GPS/camera data.
- Choosing more than 12 photos explains that only the first 12 were added.
- Admin search uses each product's search words (e.g. "geyser").
- Public Home: categories without products are hidden; a category without a photo shows the logo.
- `public/robots.txt` keeps /admin out of search engines.
- New database rules (`20261113000600_editor_upload_cleanup.sql`): staff can see photo-file records (needed for any file delete) and editors can remove their own unfinished uploads. 58 automated checks. Applied to the live database (confirmed 13 Nov 2026).

Tested with the owner login: create draft with a reused library photo, rename (address kept), Move to Trash, Undo, delete forever — nothing left behind.

## Session Summary: Admin Panel Phase 4 + Accessibility / Usability Redesign

**Admin panel (`/admin`)** — separate download, hidden from Google:
- Sign in (show/hide password, "Forgot your password?" email link, reset page), staff-only guard by role.
- Home: three big task buttons, counts with plain explanations, "Needs your attention", recent changes, "How it works".
- Products: search, category filter, status filter buttons with counts, labelled actions (Edit, View on website, Duplicate, Move to Trash with Undo).
- Product form: "Who can see this product?" first, then 8 numbered steps; auto web address with "Change"; photo upload (resize to 1600 px, duplicate photos reused), reorder, main photo, descriptions; specs table; features/applications; search words; related products; optional Google text; error summary that links to each problem; warning before leaving with unsaved changes; save bar ("Save draft" / "Publish to website" / "Save changes").
- Categories: add/edit inline, reorder, tile photo, delete safely (moves products first), Undo.
- Trash: restore, owner-only "Delete forever" with confirmation.
- Database: `save_product` saves details, photos and related products in one all-or-nothing step (10 new checks; 52 total).
- Public site always reads as a visitor, so drafts never show even when signed in.

**Audit fixes (WCAG 2.1 AA, design critique, UX copy):**
- Readable admin type: Gilroy Regular/Medium, normal capitals, 16 px base, 1.5 line height (public site unchanged).
- Tap targets: 192 under 44 px → 0 on the form/categories; inputs 16 px (no phone zoom).
- Contrast: secondary text #666 (5.7:1), field borders #8a8a8a (3.4:1).
- Words on buttons, one status wording (On website / Draft / Hidden), phone bottom tab bar, skip link, per-page tab titles, labelled fields linked to hints/errors.
- Phone product form: visibility moved from ~3,900 px to ~350 px; photo section 2,060 → 970 px.
- Dev-only design preview (`/admin/login?design-preview=1`, read-only, removed from production builds).

## Session Summary: Admin Panel Phase 3 — Website Reads Live Data

- **Live catalogue** (`src/data/catalogueApi.js`, `CatalogueProvider.jsx`, `catalogueContext.js`): one request set loads categories, products, photos, related links, live banners and public settings from Supabase. Pages (Home, Products, Product detail, Navbar, Footer) read it through `useCatalogue()`.
- **Never blank, never broken**: the built-in `products.json` (or the visitor's last live copy) shows instantly; live data swaps in when it arrives. If Supabase is slow (8 s timeout), paused or unreachable, or returns an empty catalogue, the site uses the built-in data with photos from this website.
- Product pages added only in Supabase wait for live data instead of showing "not found"; SEO title/description from Supabase are used when set.
- WhatsApp number now comes from Supabase `site_settings.whatsapp_number` (default kept in `src/utils/whatsapp.js`).
- **Banners**: `AnnouncementStrip` (one-line strip above the menu, brand red/grey/white, closable and remembered) and `HeroBannerSlide` (offer/festival slide leading the Home slideshow, 6 s, caption kept above the fold). Both appear only when a banner is published and within its dates.
- Tested in the browser: live data, banners on phone and desktop, closing the strip, slideshow hand-off, and a simulated Supabase outage.

## Session Summary: Admin Panel Phase 2 — Catalogue Imported into Supabase

- `scripts/import-to-supabase.mjs` (`npm run import:supabase`, `-- --dry-run` to preview): signs in as the owner (password typed, hidden, never stored), uploads photos to the `media` bucket with size, SHA-256 hash and alt text, then saves categories, products, photo links and related links. Re-runnable: updates instead of duplicating. Validates data first (missing files, unknown categories, duplicate photos, self-related products).
- Imported: 9 categories, 37 products, 64 photos (3.4 MB), 63 product photo links, 93 related links.
- `scripts/verify-supabase-import.mjs` (`npm run verify:supabase`): reads Supabase as a visitor and compares every field, photo order and related link with the site data, and downloads sample photos.
- Fix: "Bayonet & Threaded Thermocouples" listed itself as a related product (left over from merging the Threaded product); now links to Washer & Nozzle Thermocouples.
- Website still reads `products.json`; switching to Supabase is Phase 3.

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
