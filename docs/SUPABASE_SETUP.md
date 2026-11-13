# Supabase setup (Phase 1) — step by step

About 15 minutes. You only do this once. Everything you paste is in the
`supabase/` folder of this project.

---

## 1. Create the project

1. Go to **supabase.com** → **Start your project** and sign up (signing in with GitHub is easiest).
2. **New project**
   - Organization: your own (Free plan is fine to start)
   - Name: `indus-heaters`
   - Database password: let Supabase generate one and **save it in your password manager**. You won't need it day to day.
   - Region: **South Asia (Mumbai)**, which is closest to Chennai, so the site loads fastest
3. Wait ~2 minutes until the project shows as ready.

> **Free plan note:** Supabase pauses free projects after about a week with no activity. Once the live site reads products from Supabase (Phase 3), normal visitor traffic keeps it active. If it ever pauses, press **Restore** in the dashboard; the Pro plan never pauses.

## 2. Create the tables and security rules

1. Left menu → **SQL Editor** → **New query**.
2. Open `supabase/migrations/20261113000100_schema.sql` in this project, copy **all** of it, paste, press **Run**. You should see *Success. No rows returned*.
3. New query → do the same with `20261113000200_security.sql`.
4. New query → do the same with `20261113000300_storage.sql`.

Run them **in that order**, once each. If one fails, stop and send me the error message.

## 3. Lock sign-ups and create your admin login

1. **Authentication → Sign In / Providers** → turn **off** "Allow new users to sign up". This means only people you add can log in.
2. **Authentication → Users → Add user → Create new user**
   - Email: your email
   - Password: choose a strong one, ideally from your password manager
   - Tick **Auto Confirm User**
3. **SQL Editor → New query** → paste `supabase/make-me-owner.sql`, replace `YOUR-EMAIL@example.com` with the email from the previous step, press **Run**. The result should show one row with `role = owner`.

## 4. Connect the website

1. **Project Settings → API Keys** (older dashboards: **Project Settings → API**).
2. In this project, copy `.env.example` to a new file named **`.env.local`** and fill in:
   - `VITE_SUPABASE_URL` = the **Project URL** (looks like `https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = the **anon** / **publishable** key
3. **Never** use the `service_role` / secret key in the website or share it. `.env.local` is already excluded from Git.
4. In a terminal in the project folder run:

   ```bash
   npm run check:supabase
   ```

   Every line should show ✔. If any shows ✘, send me the output.

## 5. Allowed website addresses

**Authentication → URL Configuration**
- Site URL: `https://indusheaters.com` (or your Hostinger domain)
- Redirect URLs: add `http://localhost:5173` (for testing) and `https://indusheaters.com/admin`

## 6. Protect your Supabase account

- Turn on **two-factor authentication** for your Supabase account (Account → Security).
- If you add staff later, give them a role in the admin panel, not access to the Supabase dashboard.

---

## What this sets up

| Part | What it does |
|---|---|
| Tables | categories, products, product photos, related products, media library, banners, enquiries (+ products, attachments), site settings, admin users, audit log |
| Roles | **owner** (you: everything), **editor** (products, categories, banners, photos), **sales** (enquiries) |
| Visitor access | Read-only, and only **published** items. Enquiries go in through one checked function; visitors can never read them back. |
| Safety rules | Same photo can't be uploaded twice · only one live top strip · strip text ≤ 90 characters · trash before permanent delete (owner only) · the last owner can't be removed · max 5 enquiries per phone number per hour · every change recorded in the audit log |
| Storage | `media` (public product/banner photos, 10 MB max) and `enquiry-attachments` (private customer drawings, 10 MB max) |
| Settings | WhatsApp number +91 73389 70698 pre-filled |

These rules are tested automatically (41 checks): `npm run test:db`.

## Hosting on Hostinger

The two values in `.env.local` are built into the site when you run `npm run build`. Build on your computer, then upload the contents of `dist/` (including the hidden `.htaccess` file) to `public_html`. If the Supabase project URL or key ever changes, rebuild and upload again.

## Next: Phase 2

Once `npm run check:supabase` is all ✔, Phase 2 copies the current 37 products, 9 categories and all photos into Supabase.
