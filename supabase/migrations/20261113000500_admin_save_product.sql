-- ════════════════════════════════════════════════════════════════════
-- Indus Heaters — Phase 4: save a product in one step.
-- Product details, its photos (in order) and related products are saved
-- together: if anything fails, nothing changes.
-- Runs with the caller's permissions (security invoker), so the normal
-- row-level security rules apply — only owner/editor can save.
-- ════════════════════════════════════════════════════════════════════

create or replace function public.save_product(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := nullif(payload ->> 'id', '')::uuid;
begin
  if not private.can_edit_content() then
    raise exception 'You do not have permission to edit products.' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.products (slug, name, category_id, short_description, full_description, specs,
                                 features, applications, keywords, status, is_featured, sort_order,
                                 seo_title, seo_description)
    values (
      payload ->> 'slug', payload ->> 'name', (payload ->> 'category_id')::uuid,
      nullif(payload ->> 'short_description', ''), nullif(payload ->> 'full_description', ''),
      coalesce(payload -> 'specs', '[]'::jsonb),
      coalesce(array(select jsonb_array_elements_text(payload -> 'features')), '{}'),
      coalesce(array(select jsonb_array_elements_text(payload -> 'applications')), '{}'),
      coalesce(array(select jsonb_array_elements_text(payload -> 'keywords')), '{}'),
      coalesce((payload ->> 'status')::public.content_status, 'draft'),
      coalesce((payload ->> 'is_featured')::boolean, false),
      coalesce((payload ->> 'sort_order')::int,
               (select coalesce(max(sort_order), -1) + 1 from public.products)),
      nullif(payload ->> 'seo_title', ''), nullif(payload ->> 'seo_description', '')
    )
    returning id into v_id;
  else
    update public.products set
      slug              = payload ->> 'slug',
      name              = payload ->> 'name',
      category_id       = (payload ->> 'category_id')::uuid,
      short_description = nullif(payload ->> 'short_description', ''),
      full_description  = nullif(payload ->> 'full_description', ''),
      specs             = coalesce(payload -> 'specs', '[]'::jsonb),
      features          = coalesce(array(select jsonb_array_elements_text(payload -> 'features')), '{}'),
      applications      = coalesce(array(select jsonb_array_elements_text(payload -> 'applications')), '{}'),
      keywords          = coalesce(array(select jsonb_array_elements_text(payload -> 'keywords')), '{}'),
      status            = coalesce((payload ->> 'status')::public.content_status, status),
      is_featured       = coalesce((payload ->> 'is_featured')::boolean, is_featured),
      seo_title         = nullif(payload ->> 'seo_title', ''),
      seo_description   = nullif(payload ->> 'seo_description', '')
    where id = v_id;
    if not found then
      raise exception 'Product not found (it may have been deleted).';
    end if;
  end if;

  -- Photos, in the order given; first one is the main photo
  if payload ? 'images' then
    delete from public.product_images where product_id = v_id;
    insert into public.product_images (product_id, media_id, sort_order, alt_text)
    select v_id, (img ->> 'media_id')::uuid, (ord - 1)::int, nullif(img ->> 'alt_text', '')
    from jsonb_array_elements(payload -> 'images') with ordinality as t(img, ord);
  end if;

  -- Related products (by id), in order, never itself, no repeats
  if payload ? 'related' then
    delete from public.product_related where product_id = v_id;
    insert into public.product_related (product_id, related_id, sort_order)
    select v_id, rid, min(ord - 1)::int
    from (select (r #>> '{}')::uuid as rid, ord
          from jsonb_array_elements(payload -> 'related') with ordinality as t(r, ord)) x
    where rid <> v_id
    group by rid;
  end if;

  return v_id;
end $$;

revoke all on function public.save_product(jsonb) from public, anon;
grant execute on function public.save_product(jsonb) to authenticated;
