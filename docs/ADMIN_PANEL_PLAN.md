# Indus Heaters — Admin Panel Plan

Goal: let staff add, edit and delete **products**, **product categories** and **banners/offers** (festival greetings, discounts, announcements) without touching code, and have the public website update immediately.

---

## 0. Decisions confirmed (13 Nov 2026)

| Question | Decision |
|---|---|
| Who uses the panel | You are the **Owner/admin**. Permission levels **are needed** for any staff added later (Editor, Sales). |
| Enquiries | Move into the **admin panel inbox**, **and** send them over **WhatsApp**. Basin can stay as an email backup during the switch. |
| Hosting | **Hostinger** (for now). |
| Prices on the site | **No** — enquiry-only. No price, cart-total or payment features. Offers are shown as banner text only. |
| Banner placements | **Subtle, on-brand:** (1) a slim **announcement strip** above the navbar (brand red, white text, one line, close button, remembered per visitor) and (2) an **offer/festival slide** in the existing Home hero slideshow. **No popups.** Both switch on/off automatically by start/end date. |
| Languages | **English only.** No Tamil version planned. |
| WhatsApp number | **+91 73389 70698** — used for customer chat buttons and new-enquiry alerts. Customer buttons are already live (see 5a). |
| Product names flagged in audit | Resolved: PTFE product renamed **Fluoropolymer Immersion Heaters (PTFE / PVDF)**; **Bayonet & Threaded Thermocouples** merged into one product; ceramic band heater photos kept as Indus Heaters labels them. |

---

## 1. Where things stand today

| Area | Today | Problem for an admin panel |
|---|---|---|
| Products | `src/data/products.json` (38 products), bundled into the site at build time | Any change needs a developer + rebuild + redeploy |
| Categories | `src/data/categories.js` (9 categories) | Same |
| Images | Files in `public/images/products/` and `public/images/originals/` | No upload, no resizing, no duplicate check |
| Banners | Hero slideshow reads files from `src/image-animation/` | No way to schedule or switch off an offer |
| Enquiries | Sent to Basin (`usebasin.com`) by email | Not visible in one place, no status tracking |
| Hosting | Static Vite + React site (no server) | Needs a backend for logins, saving data and uploads |

---

## 2. Recommended approach

**Use Supabase as the backend** (managed Postgres database + login + file storage, free tier is enough to start).

Why:
- No server to run or patch — fits the current static React site.
- Built-in email/password login with optional 2-factor.
- File storage with public URLs for product photos and banners.
- Row-level security: the public can only *read published* items; only logged-in admins can write.

The admin panel is a protected section of the same React app at `/admin` (separate code bundle, so visitors never download it).

### How this fits Hostinger

- **Hostinger serves the website files** (the `dist/` folder from `npm run build`), exactly as today. Supabase holds the data, logins and photos. No server code has to run on Hostinger, so any Hostinger web hosting plan works.
- **Page refresh rule:** Hostinger runs Apache. Without a rewrite rule, refreshing a page such as `/products/coil-heaters/spring-coil-heaters` gives a 404. This is fixed by `public/.htaccess` (already added), which is copied into `dist/` on every build.
- **Deploying:** upload the contents of `dist/` to `public_html` (File Manager or FTP), or connect the GitHub repo with Hostinger's Git deployment and upload the build output. Product/banner edits made in the admin panel appear on the live site **without** re-uploading anything.
- **Domain & HTTPS:** point `indusheaters.com` at Hostinger and switch on the free SSL certificate. Add the domain to Supabase's allowed URLs so admin login works.
- **Alternative if you prefer everything on Hostinger:** a PHP + MySQL backend on Hostinger instead of Supabase. Possible, but it means building and securing logins, uploads and the API by hand — roughly 1–2 extra weeks and more maintenance. Supabase is recommended.

Alternatives considered:
- **Firebase** — similar, but NoSQL makes specs/related products/reporting clumsier.
- **Headless CMS (Sanity / Strapi)** — fastest to get an editor UI, but monthly cost or self-hosting, and less control over banners and enquiries.
- **Keep JSON + edit through GitHub** — free, but every change still needs a rebuild and someone comfortable with Git.

---

## 3. Data model (database tables)

### `categories`
| Field | Notes |
|---|---|
| id, slug (unique) | slug auto-made from name, editable |
| name, description | |
| image_id | tile image on Home page |
| sort_order | drag to reorder in admin |
| status | `published` / `hidden` |
| seo_title, seo_description | optional |
| created_at, updated_at, deleted_at | `deleted_at` = soft delete (trash) |

### `products`
| Field | Notes |
|---|---|
| id, slug (unique), name | |
| category_id | one category; could later allow multiple |
| short_description, full_description | |
| specs | list of `{label, value}` rows (table editor) |
| features, applications | lists |
| keywords | everyday names and misspellings used by search (e.g. "geyser element") |
| related_product_ids | pick up to 3 |
| status | `draft` / `published` / `hidden` |
| is_featured, sort_order | for Home page / ordering |
| seo_title, seo_description | default from name + short description |
| created_by, updated_by, timestamps, deleted_at | |

### `product_images`
| Field | Notes |
|---|---|
| id, product_id, media_id | |
| sort_order | first image = main photo on cards |
| alt_text | required (accessibility + Google) |

### `media` (media library)
| Field | Notes |
|---|---|
| id, file_path, width, height, size | |
| content_hash | **duplicate detection** — blocks uploading the same photo twice under a different name |
| original_filename, uploaded_by, created_at | |

### `banners`
| Field | Notes |
|---|---|
| id, title, subtitle | e.g. "Happy Pongal — 10% off coil heaters" |
| type | `offer` / `festival` / `announcement` |
| placement | `home_hero` / `top_strip` / `popup` / `products_page` |
| image_desktop_id, image_mobile_id | separate crops for phone |
| button_text, button_link | e.g. link to a category or product |
| colors | text/background (limited to brand palette) |
| starts_at, ends_at | **auto show/hide by date** |
| priority, status | `draft` / `scheduled` / `live` / `ended` |
| dismissible | for popup/strip |

### `enquiries` (confirmed — moves into the admin panel)
Customer name, company, phone (with WhatsApp yes/no), email, city; products + quantities + measurements + notes; attachments (stored in Supabase Storage); source (`website form` / `whatsapp button`); status (`new` / `contacted` / `quoted` / `won` / `lost`); internal notes; assigned_to; WhatsApp notification sent (yes/no + time).

### `admin_users` and `audit_log`
- Roles: **Owner** (you — everything, including adding/removing staff and changing roles), **Editor** (products, categories, banners, media), **Sales** (enquiries only). Only the Owner can permanently delete anything.
- Audit log: who changed what and when, with before/after values.

### `site_settings`
Phone numbers, emails, addresses, social links and the Home page stats — editable rather than hard-coded.

---

## 4. Admin panel screens

1. **Login** — email + password, optional 2-factor, "forgot password".
2. **Dashboard** — counts (products, drafts, live banners, new enquiries), recent changes, warnings (products without photos, missing alt text, duplicate images, banners ending soon).
3. **Products**
   - List: search, filter by category/status, thumbnail, bulk actions (publish, hide, move category, delete).
   - Add/Edit form: name → auto slug; category; descriptions; **specs table editor** (add/remove/reorder rows); features & applications lists; **keywords** with suggestions; related products picker; **image uploader** (drag & drop, reorder, set main photo, alt text); status; live preview.
   - Duplicate product (start a new one from an existing one).
   - Delete → moves to **Trash** (restore within 30 days, then permanent).
4. **Categories** — list with drag-to-reorder, add/edit (name, description, tile image), hide. Deleting a category that still has products asks where to move them.
5. **Banners & Offers**
   - List grouped by Live / Scheduled / Draft / Ended.
   - Form: type, placement (**top strip** or **Home hero slide**), desktop + mobile image (hero slide only), text, button, start/end date and time, priority.
   - Style guardrails so banners stay subtle: brand red/grey/white only, one line of text on the strip (max ~90 characters), max one live strip at a time, hero slide uses the same layout and fonts as the other slides.
   - Preview on desktop and phone before going live.
   - Templates for common festivals (Pongal, Diwali, New Year, Independence Day) with brand colours.
6. **Media library** — all uploaded images, search, see where each is used, find unused images, **duplicate finder**.
7. **Enquiries** — inbox with new-enquiry badge, filter by status/date/product, detail view (customer, products, measurements, attachments), status and notes, **"Reply on WhatsApp"** button that opens a chat with the customer pre-filled, export to Excel/CSV.
8. **Settings** — contact details, stats, admin users and roles.
9. **Activity log** — audit history with filter by user/date.

---

## 5. Changes to the public website

- Load categories, products and live banners from Supabase instead of the bundled JSON; keep the JSON as an **offline fallback** so the site never shows empty.
- Only `published` products/categories and banners whose dates are current are shown.
- New **Banner components**: slim dismissible top strip (remembers dismissal) and an offer slide inside the Home hero slideshow. No popups.
- Search keeps using `keywords` (already built in `src/utils/productSearch.js`).
- **SEO**: product pages are currently filled in by JavaScript. For reliable Google indexing, add pre-rendering at build time (or move to a framework with server rendering such as Next.js), plus an automatic `sitemap.xml` rebuilt when products change.
- Images served resized (WebP, phone and desktop sizes) for speed.

---

## 5a. WhatsApp enquiries

Three parts, from simplest to most automatic:

1. **"Enquire on WhatsApp" for customers** (free, no approval needed)
   - A WhatsApp button on every product page and the enquiry list, plus a floating WhatsApp button on all pages.
   - Opens WhatsApp with a ready-made message to **+91 73389 70698**, e.g. *"Hi Indus Heaters, I'd like a quote for: Spring Coil Heaters, Qty: 10, Sizes: …"*.
   - **Already built** (no backend needed): WhatsApp button next to "Add to Enquiry" on every product page, "Or send this list on WhatsApp" on the enquiry page, and a small floating WhatsApp button on every page. Number is set in `src/utils/whatsapp.js`.
   - Once the admin panel exists, the website will also save the enquiry to the admin inbox first (source = `whatsapp button`), so nothing is lost even if the customer doesn't press send.

2. **"Reply on WhatsApp" for you** (free)
   - In the admin inbox, one click opens a chat with the customer's number and a pre-filled reply.

3. **Automatic WhatsApp alert to you for every new enquiry** (needs setup and has a small per-message cost)
   - Uses the official **WhatsApp Business Platform (Cloud API)** from Meta, triggered by Supabase when an enquiry is saved.
   - Needs: a Meta Business account, a phone number for the API (one not already registered in the normal WhatsApp app), and an approved message template such as *"New enquiry from {name} ({company}) for {products}. Open the admin panel to view."*
   - Meta charges per message for business-initiated templates; for one alert per enquiry this is low. Check current rates in Meta's pricing page when setting up.
   - Fallback if approval takes time: email alert (via Supabase) to you immediately, WhatsApp added once approved.

Settings screen will hold: the WhatsApp business number shown to customers (+91 73389 70698), the number that receives alerts (same by default), and the message wording. Note: the alert number for the Cloud API must be a number **not** already active in the normal WhatsApp / WhatsApp Business app — if 73389 70698 stays on the app, alerts are sent *to* it from a second API number.

---

## 6. Image rules (enforced on upload)

- Accept JPG, PNG, WebP up to 10 MB; convert TIF automatically.
- Resize to max 1600 px and create a thumbnail; strip camera metadata.
- **Reject or warn on duplicates** using a content hash and a visual-similarity check (the same check used in this audit found 19 duplicate pairs across both image sets).
- Alt text required before publishing.
- Banners: recommend 1920×640 desktop and 1080×1080 mobile, safe area for text.

---

## 7. Security

- Admin URL behind login; no admin code shipped to normal visitors.
- Database rules: public read-only for published items; writes only for admin roles.
- Secret keys never in the website code (only the public "anon" key).
- 2-factor for Owner accounts, login rate limiting, session timeout.
- Daily automatic database backups; trash + audit log for undo.

---

## 8. Build phases

| Phase | Scope | Estimate* |
|---|---|---|
| 1. Backend setup ✅ **done (13 Nov 2026)** | Live Supabase project `znajahlcdqxiwzffrcmu` (Seoul): schema, roles, row-level security, storage, hardening applied; Owner login set up; `npm run check:supabase` all ✔. To do: switch off public sign-ups. | 2–3 days |
| 2. Migration | Script to import current 38 products, 9 categories and all images (with duplicate check) | 1–2 days |
| 3. Public site on live data | Read from Supabase with JSON fallback, banner component | 2–3 days |
| 4. Admin: auth + products + categories | Login, lists, forms, image uploader, trash | 5–7 days |
| 5. Admin: banners & offers | Scheduling, placements, preview, festival templates | 3–4 days |
| 6. Media library + duplicate finder | | 2 days |
| 7. Enquiries inbox + WhatsApp | Inbox, statuses, export; WhatsApp buttons for customers and replies; email alert, then automatic WhatsApp alert once Meta approves | 4–5 days (+ Meta approval wait) |
| 8. SEO + polish + Hostinger go-live | Pre-rendering, sitemap, activity log, phone/desktop testing, deploy to Hostinger, SSL, domain | 3–4 days |

\*One developer, rough working days. Total roughly 22–30 days.

---

## 9. Still to confirm

Nothing blocking. Before Phase 7 (automatic WhatsApp alerts): create a Meta Business account and decide which number will send the alerts.
