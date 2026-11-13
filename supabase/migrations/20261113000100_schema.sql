-- ════════════════════════════════════════════════════════════════════
-- Indus Heaters — Phase 1: database schema
-- Run in Supabase → SQL Editor (or `supabase db push`). Safe to run once
-- on a new project. Files run in name order: schema → security → storage.
-- ════════════════════════════════════════════════════════════════════


-- ── Types ───────────────────────────────────────────────────────────
create type public.content_status   as enum ('draft', 'published', 'hidden');
create type public.admin_role       as enum ('owner', 'editor', 'sales');
create type public.banner_type      as enum ('offer', 'festival', 'announcement');
create type public.banner_placement as enum ('top_strip', 'home_hero');   -- no popups (decided)
create type public.banner_theme     as enum ('red', 'grey', 'white');     -- brand palette only
create type public.enquiry_status   as enum ('new', 'contacted', 'quoted', 'won', 'lost');
create type public.enquiry_source   as enum ('website_form', 'whatsapp_button');

-- ── Shared trigger: keep updated_at current ─────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ── Admin users (who can log in to /admin, and their role) ─────────
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       public.admin_role not null default 'editor',
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger admin_users_updated_at before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ── Media library (every uploaded image) ────────────────────────────
create table public.media (
  id                uuid primary key default gen_random_uuid(),
  bucket            text not null default 'media',
  path              text not null,                -- path inside the bucket
  original_filename text,
  mime_type         text,
  width             int  check (width  > 0),
  height            int  check (height > 0),
  size_bytes        bigint check (size_bytes >= 0),
  content_hash      text,                         -- sha-256 of the file: blocks exact duplicates
  alt_text          text,
  uploaded_by       uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (bucket, path)
);
-- Same photo can't be uploaded twice (ignoring items in the trash)
create unique index media_content_hash_unique on public.media (content_hash)
  where content_hash is not null and deleted_at is null;

-- ── Categories ──────────────────────────────────────────────────────
create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null check (char_length(name) between 2 and 80),
  description     text,
  image_id        uuid references public.media (id) on delete set null,
  sort_order      int  not null default 0,
  status          public.content_status not null default 'draft',
  seo_title       text,
  seo_description text,
  created_by      uuid references auth.users (id) on delete set null,
  updated_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz                       -- soft delete (trash)
);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ── Products ────────────────────────────────────────────────────────
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  legacy_id         text unique,                    -- id from the old products.json (for the import)
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 2 and 120),
  category_id       uuid not null references public.categories (id) on delete restrict,
  short_description text,
  full_description  text,
  specs             jsonb  not null default '[]' check (jsonb_typeof(specs) = 'array'),  -- [{label, value}]
  features          text[] not null default '{}',
  applications      text[] not null default '{}',
  keywords          text[] not null default '{}',   -- everyday names / misspellings for search
  status            public.content_status not null default 'draft',
  is_featured       boolean not null default false,
  sort_order        int not null default 0,
  seo_title         text,
  seo_description   text,
  created_by        uuid references auth.users (id) on delete set null,
  updated_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index products_category_idx on public.products (category_id, sort_order);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- Photos of a product, in display order (first = main photo)
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  media_id   uuid not null references public.media (id) on delete restrict,
  sort_order int  not null default 0,
  alt_text   text,
  unique (product_id, media_id)
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- "Related products" links
create table public.product_related (
  product_id uuid not null references public.products (id) on delete cascade,
  related_id uuid not null references public.products (id) on delete cascade,
  sort_order int  not null default 0,
  primary key (product_id, related_id),
  check (product_id <> related_id)
);

-- ── Banners (offers, festivals, announcements) ──────────────────────
create table public.banners (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  subtitle         text,
  type             public.banner_type      not null default 'announcement',
  placement        public.banner_placement not null default 'top_strip',
  theme            public.banner_theme     not null default 'red',
  image_desktop_id uuid references public.media (id) on delete set null,
  image_mobile_id  uuid references public.media (id) on delete set null,
  button_text      text,
  button_link      text,
  starts_at        timestamptz,                     -- null = immediately
  ends_at          timestamptz,                     -- null = until switched off
  priority         int not null default 0,
  status           public.content_status not null default 'draft',
  dismissible      boolean not null default true,
  created_by       uuid references auth.users (id) on delete set null,
  updated_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  -- keep the top strip subtle: one short line
  check (placement <> 'top_strip' or char_length(title) <= 90),
  check (button_link is null or button_link ~ '^(/|https?://)')
);
create trigger banners_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

-- Only one top strip may be published at a time
create unique index banners_one_live_strip on public.banners (placement)
  where placement = 'top_strip' and status = 'published' and deleted_at is null;

-- ── Enquiries ───────────────────────────────────────────────────────
create table public.enquiries (
  id                     uuid primary key default gen_random_uuid(),
  customer_name          text not null check (char_length(customer_name) between 1 and 120),
  company_name           text,
  phone                  text not null check (phone ~ '^[0-9+() -]{7,20}$'),
  has_whatsapp           boolean not null default true,
  email                  text,
  city                   text,
  delivery_address       text,
  message                text,
  source                 public.enquiry_source not null default 'website_form',
  status                 public.enquiry_status not null default 'new',
  internal_notes         text,
  assigned_to            uuid references auth.users (id) on delete set null,
  whatsapp_alert_sent_at timestamptz,               -- Phase 7 (automatic WhatsApp alert)
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index enquiries_status_idx on public.enquiries (status, created_at desc);
create trigger enquiries_updated_at before update on public.enquiries
  for each row execute function public.set_updated_at();

create table public.enquiry_items (
  id           uuid primary key default gen_random_uuid(),
  enquiry_id   uuid not null references public.enquiries (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,                        -- copy of the name at the time of enquiry
  quantity     int  not null default 1 check (quantity between 1 and 100000),
  measurements jsonb not null default '{}' check (jsonb_typeof(measurements) = 'object'),
  note         text
);
create index enquiry_items_enquiry_idx on public.enquiry_items (enquiry_id);

create table public.enquiry_attachments (
  id          uuid primary key default gen_random_uuid(),
  enquiry_id  uuid not null references public.enquiries (id) on delete cascade,
  path        text not null,                         -- in the private 'enquiry-attachments' bucket
  filename    text,
  mime_type   text,
  size_bytes  bigint,
  created_at  timestamptz not null default now()
);

-- ── Site settings (contact details, WhatsApp number, stats) ─────────
create table public.site_settings (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default true,          -- false = admin-only (e.g. alert number)
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (key, value, is_public) values
  ('whatsapp_number',       '"917338970698"', true),
  ('whatsapp_display',      '"+91 73389 70698"', true),
  ('whatsapp_alert_number', '"917338970698"', false),
  ('sales_email',           '"sales@indusheaters.com"', true);

-- ── Audit log (who changed what) ────────────────────────────────────
create table public.audit_log (
  id         bigint generated always as identity primary key,
  table_name text not null,
  record_id  text,
  action     text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data   jsonb,
  new_data   jsonb,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);
create index audit_log_record_idx on public.audit_log (table_name, record_id, changed_at desc);
