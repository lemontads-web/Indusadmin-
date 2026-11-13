-- ════════════════════════════════════════════════════════════════════
-- Indus Heaters — Phase 1: roles, row-level security, enquiry intake,
-- audit trail.
--   Public visitors : read published content, submit enquiries (via
--                     submit_enquiry only), nothing else.
--   owner           : everything, incl. staff, settings, permanent delete
--   editor          : products, categories, banners, media
--   sales           : enquiries
-- ════════════════════════════════════════════════════════════════════

-- ── Role helpers ────────────────────────────────────────────────────
create or replace function public.current_admin_role()
returns public.admin_role
language sql stable security definer set search_path = public as $$
  select role from public.admin_users
  where user_id = auth.uid() and active
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_admin_role() = 'owner', false)
$$;

create or replace function public.can_edit_content()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_admin_role() in ('owner', 'editor'), false)
$$;

create or replace function public.can_manage_enquiries()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_admin_role() in ('owner', 'sales'), false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_admin_role() is not null
$$;

-- ── Never lose the last owner ──────────────────────────────────────
create or replace function public.protect_last_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE' and old.role = 'owner' and old.active)
     or (tg_op = 'UPDATE' and old.role = 'owner' and old.active
         and (new.role <> 'owner' or not new.active)) then
    if (select count(*) from public.admin_users
        where role = 'owner' and active and user_id <> old.user_id) = 0 then
      raise exception 'There must always be at least one active owner.';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger admin_users_protect_owner before update or delete on public.admin_users
  for each row execute function public.protect_last_owner();

-- ── Stamp created_by / updated_by automatically ─────────────────────
create or replace function public.stamp_user()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_by := auth.uid();
  return new;
end $$;
create trigger categories_stamp before insert or update on public.categories for each row execute function public.stamp_user();
create trigger products_stamp   before insert or update on public.products   for each row execute function public.stamp_user();
create trigger banners_stamp    before insert or update on public.banners    for each row execute function public.stamp_user();

-- ── Audit trail ─────────────────────────────────────────────────────
create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  row_data jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (table_name, record_id, action, old_data, new_data)
  values (
    tg_table_name,
    coalesce(row_data ->> 'id', row_data ->> 'user_id', row_data ->> 'key', row_data ->> 'product_id'),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['admin_users','media','categories','products','product_images',
                           'product_related','banners','enquiries','site_settings']
  loop
    execute format('create trigger %I after insert or update or delete on public.%I
                    for each row execute function public.write_audit()', t || '_audit', t);
  end loop;
end $$;

-- ── Turn on row-level security everywhere ──────────────────────────
alter table public.admin_users         enable row level security;
alter table public.media               enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.product_related     enable row level security;
alter table public.banners             enable row level security;
alter table public.enquiries           enable row level security;
alter table public.enquiry_items       enable row level security;
alter table public.enquiry_attachments enable row level security;
alter table public.site_settings       enable row level security;
alter table public.audit_log           enable row level security;

-- Visitors can never write directly (enquiries go through submit_enquiry)
revoke insert, update, delete on all tables in schema public from anon;

-- ── Public visibility rules ─────────────────────────────────────────
create or replace function public.category_is_public(cat_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.categories c
                 where c.id = cat_id and c.status = 'published' and c.deleted_at is null)
$$;

create or replace function public.product_is_public(prod_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.products p
                 where p.id = prod_id and p.status = 'published' and p.deleted_at is null
                   and public.category_is_public(p.category_id))
$$;

-- ── admin_users ─────────────────────────────────────────────────────
create policy "admins see themselves; owner sees all" on public.admin_users
  for select to authenticated using (user_id = auth.uid() or public.is_owner());
create policy "owner manages staff" on public.admin_users
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ── media ───────────────────────────────────────────────────────────
create policy "public reads media" on public.media
  for select to anon, authenticated using (deleted_at is null);
create policy "editors read all media" on public.media
  for select to authenticated using (public.can_edit_content());
create policy "editors add media" on public.media
  for insert to authenticated with check (public.can_edit_content());
create policy "editors edit media" on public.media
  for update to authenticated using (public.can_edit_content()) with check (public.can_edit_content());
create policy "owner deletes media" on public.media
  for delete to authenticated using (public.is_owner());

-- ── categories ──────────────────────────────────────────────────────
create policy "public reads published categories" on public.categories
  for select to anon, authenticated using (status = 'published' and deleted_at is null);
create policy "editors read all categories" on public.categories
  for select to authenticated using (public.can_edit_content());
create policy "editors add categories" on public.categories
  for insert to authenticated with check (public.can_edit_content());
create policy "editors edit categories" on public.categories
  for update to authenticated using (public.can_edit_content()) with check (public.can_edit_content());
create policy "owner deletes categories" on public.categories
  for delete to authenticated using (public.is_owner());

-- ── products ────────────────────────────────────────────────────────
create policy "public reads published products" on public.products
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null and public.category_is_public(category_id));
create policy "editors read all products" on public.products
  for select to authenticated using (public.can_edit_content());
create policy "editors add products" on public.products
  for insert to authenticated with check (public.can_edit_content());
create policy "editors edit products" on public.products
  for update to authenticated using (public.can_edit_content()) with check (public.can_edit_content());
create policy "owner deletes products" on public.products
  for delete to authenticated using (public.is_owner());

-- ── product_images & product_related (editors manage fully) ────────
create policy "public reads images of public products" on public.product_images
  for select to anon, authenticated using (public.product_is_public(product_id));
create policy "editors manage product images" on public.product_images
  for all to authenticated using (public.can_edit_content()) with check (public.can_edit_content());

create policy "public reads related links" on public.product_related
  for select to anon, authenticated
  using (public.product_is_public(product_id) and public.product_is_public(related_id));
create policy "editors manage related links" on public.product_related
  for all to authenticated using (public.can_edit_content()) with check (public.can_edit_content());

-- ── banners ─────────────────────────────────────────────────────────
create policy "public reads live banners" on public.banners
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null
         and (starts_at is null or starts_at <= now())
         and (ends_at   is null or ends_at   >  now()));
create policy "editors read all banners" on public.banners
  for select to authenticated using (public.can_edit_content());
create policy "editors add banners" on public.banners
  for insert to authenticated with check (public.can_edit_content());
create policy "editors edit banners" on public.banners
  for update to authenticated using (public.can_edit_content()) with check (public.can_edit_content());
create policy "owner deletes banners" on public.banners
  for delete to authenticated using (public.is_owner());

-- ── enquiries (sales + owner) ───────────────────────────────────────
create policy "sales reads enquiries" on public.enquiries
  for select to authenticated using (public.can_manage_enquiries());
create policy "sales updates enquiries" on public.enquiries
  for update to authenticated using (public.can_manage_enquiries()) with check (public.can_manage_enquiries());
create policy "owner deletes enquiries" on public.enquiries
  for delete to authenticated using (public.is_owner());

create policy "sales reads enquiry items" on public.enquiry_items
  for select to authenticated using (public.can_manage_enquiries());
create policy "sales reads enquiry attachments" on public.enquiry_attachments
  for select to authenticated using (public.can_manage_enquiries());

-- ── site settings ───────────────────────────────────────────────────
create policy "public reads public settings" on public.site_settings
  for select to anon, authenticated using (is_public);
create policy "admins read all settings" on public.site_settings
  for select to authenticated using (public.is_admin());
create policy "owner manages settings" on public.site_settings
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ── audit log (owner reads; written only by triggers) ───────────────
create policy "owner reads audit log" on public.audit_log
  for select to authenticated using (public.is_owner());

-- ── Enquiry intake for the public website ───────────────────────────
-- One call saves the enquiry, its products and attachment references.
-- Example payload:
-- { "customer_name": "Ravi", "company_name": "ABC Plastics", "phone": "9876543210",
--   "has_whatsapp": true, "email": null, "city": "Chennai", "delivery_address": "...",
--   "message": "...", "source": "website_form",
--   "items": [{ "product_slug": "spring-coil-heaters", "product_name": "Spring Coil Heaters",
--               "quantity": 10, "measurements": {"A": "3x3mm"}, "note": "" }],
--   "attachments": [{ "path": "incoming/<uuid>/drawing.pdf", "filename": "drawing.pdf",
--                     "mime_type": "application/pdf", "size_bytes": 12345 }] }
create or replace function public.submit_enquiry(payload jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  new_id   uuid;
  item     jsonb;
  att      jsonb;
  v_phone  text := trim(payload ->> 'phone');
  v_items  jsonb := coalesce(payload -> 'items', '[]'::jsonb);
  v_atts   jsonb := coalesce(payload -> 'attachments', '[]'::jsonb);
begin
  if coalesce(trim(payload ->> 'customer_name'), '') = '' then
    raise exception 'Please enter your name.';
  end if;
  if v_phone is null or v_phone !~ '^[0-9+() -]{7,20}$' then
    raise exception 'Please enter a valid phone number.';
  end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) > 50 then
    raise exception 'Too many products in one enquiry (max 50).';
  end if;
  if jsonb_typeof(v_atts) <> 'array' or jsonb_array_length(v_atts) > 5 then
    raise exception 'Too many attachments (max 5).';
  end if;
  -- simple spam guard: max 5 enquiries per phone number per hour
  if (select count(*) from public.enquiries
      where phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many enquiries from this number. Please try again later or contact us on WhatsApp.';
  end if;

  insert into public.enquiries (customer_name, company_name, phone, has_whatsapp, email, city,
                                delivery_address, message, source)
  values (
    left(trim(payload ->> 'customer_name'), 120),
    left(payload ->> 'company_name', 160),
    v_phone,
    coalesce((payload ->> 'has_whatsapp')::boolean, true),
    left(payload ->> 'email', 160),
    left(payload ->> 'city', 80),
    left(payload ->> 'delivery_address', 1000),
    left(payload ->> 'message', 4000),
    coalesce((payload ->> 'source')::public.enquiry_source, 'website_form')
  )
  returning id into new_id;

  for item in select * from jsonb_array_elements(v_items) loop
    insert into public.enquiry_items (enquiry_id, product_id, product_name, quantity, measurements, note)
    values (
      new_id,
      (select p.id from public.products p where p.slug = item ->> 'product_slug'),
      left(coalesce(item ->> 'product_name', item ->> 'product_slug', 'Unknown product'), 160),
      greatest(1, least(100000, coalesce((item ->> 'quantity')::int, 1))),
      case when jsonb_typeof(item -> 'measurements') = 'object' then item -> 'measurements' else '{}'::jsonb end,
      left(item ->> 'note', 1000)
    );
  end loop;

  for att in select * from jsonb_array_elements(v_atts) loop
    -- only files uploaded to the public drop-folder are accepted
    if (att ->> 'path') like 'incoming/%' and (att ->> 'path') not like '%..%' then
      insert into public.enquiry_attachments (enquiry_id, path, filename, mime_type, size_bytes)
      values (new_id, att ->> 'path', left(att ->> 'filename', 200), att ->> 'mime_type',
              (att ->> 'size_bytes')::bigint);
    end if;
  end loop;

  return new_id;
end $$;

revoke all on function public.submit_enquiry(jsonb) from public;
grant execute on function public.submit_enquiry(jsonb) to anon, authenticated;
