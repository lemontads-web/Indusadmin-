-- ════════════════════════════════════════════════════════════════════
-- Indus Heaters — Phase 1: hardening (from Supabase security/performance
-- advisors).
--  • Permission helpers move to a private schema that the public API does
--    not expose. Policies reference functions by internal id, so every
--    existing rule keeps working.
--  • Trigger functions can no longer be called through the API.
--  • Fixed search_path on remaining functions; indexes on foreign keys.
--  submit_enquiry stays public on purpose (the website calls it).
-- ════════════════════════════════════════════════════════════════════

create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.current_admin_role()       set schema private;
alter function public.is_owner()                 set schema private;
alter function public.can_edit_content()         set schema private;
alter function public.can_manage_enquiries()     set schema private;
alter function public.is_admin()                 set schema private;
alter function public.category_is_public(uuid)   set schema private;
alter function public.product_is_public(uuid)    set schema private;

-- Re-point the bodies at the new schema (same signatures keep the same ids)
create or replace function private.current_admin_role()
returns public.admin_role
language sql stable security definer set search_path = '' as $$
  select role from public.admin_users
  where user_id = (select auth.uid()) and active
$$;

create or replace function private.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_admin_role() = 'owner', false)
$$;

create or replace function private.can_edit_content()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_admin_role() in ('owner', 'editor'), false)
$$;

create or replace function private.can_manage_enquiries()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_admin_role() in ('owner', 'sales'), false)
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.current_admin_role() is not null
$$;

create or replace function private.category_is_public(cat_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.categories c
                 where c.id = cat_id and c.status = 'published' and c.deleted_at is null)
$$;

create or replace function private.product_is_public(prod_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.products p
                 where p.id = prod_id and p.status = 'published' and p.deleted_at is null
                   and private.category_is_public(p.category_id))
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated;

-- Trigger functions: never callable through the API (triggers still fire)
revoke execute on function public.protect_last_owner() from public, anon, authenticated;
revoke execute on function public.write_audit()        from public, anon, authenticated;
revoke execute on function public.stamp_user()         from public, anon, authenticated;
revoke execute on function public.set_updated_at()     from public, anon, authenticated;

alter function public.set_updated_at() set search_path = '';
alter function public.stamp_user()     set search_path = '';

-- Evaluate auth.uid() once per query, not once per row
drop policy "admins see themselves; owner sees all" on public.admin_users;
create policy "admins see themselves; owner sees all" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()) or private.is_owner());

-- Indexes on foreign keys used in joins / deletes
create index if not exists product_images_media_idx       on public.product_images (media_id);
create index if not exists product_related_related_idx    on public.product_related (related_id);
create index if not exists enquiry_attachments_enq_idx    on public.enquiry_attachments (enquiry_id);
create index if not exists enquiry_items_product_idx      on public.enquiry_items (product_id);
create index if not exists enquiries_assigned_idx         on public.enquiries (assigned_to);
create index if not exists categories_image_idx           on public.categories (image_id);
create index if not exists banners_image_desktop_idx      on public.banners (image_desktop_id);
create index if not exists banners_image_mobile_idx       on public.banners (image_mobile_id);
create index if not exists media_uploaded_by_idx          on public.media (uploaded_by);
