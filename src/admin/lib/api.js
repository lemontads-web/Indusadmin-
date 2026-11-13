// Everything the admin panel reads and writes. Uses the admin's own login,
// so Supabase's security rules decide what is allowed.
import { getAdminClient, mediaUrl } from '../../lib/supabase';
import { prepareImage } from './images';

const db = () => getAdminClient();

export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

// Turns database errors into plain sentences
export function friendlyError(error) {
  const msg = error?.message || String(error || 'Something went wrong.');
  if (error?.code === '23505' || /duplicate key/i.test(msg)) {
    if (/slug/i.test(msg)) return 'That web address is already used by another item. Change the "web address" field.';
    if (/content_hash/i.test(msg)) return 'This exact photo is already in the media library.';
    return 'That already exists.';
  }
  if (error?.code === '23503' || /foreign key/i.test(msg)) {
    if (/products_category_id_fkey/i.test(msg)) return 'This category still has products (including any in Trash). Move or permanently delete them first.';
    return 'This item is still linked to something else, so it can’t be removed yet.';
  }
  if (error?.code === '23514' || /check constraint/i.test(msg)) {
    if (/slug/i.test(msg)) return 'Web address may only use lowercase letters, numbers and single dashes.';
    if (/name/i.test(msg)) return 'Name is too short or too long.';
    return 'One of the values isn’t allowed. Please check the form.';
  }
  if (error?.code === '42501' || /row-level security|permission/i.test(msg)) return 'Your account doesn’t have permission to do that.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Can’t reach the server. Check your internet connection and try again.';
  return msg;
}

const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// ── Dashboard ─────────────────────────────────────────────────────
export async function getDashboard() {
  const [products, categories, images] = await Promise.all([
    db().from('products').select('id, name, slug, status, deleted_at, updated_at, category:categories(slug)').order('updated_at', { ascending: false }).then(must),
    db().from('categories').select('id, status, deleted_at').then(must),
    db().from('product_images').select('product_id, alt_text, media(alt_text)').then(must),
  ]);
  const active = products.filter((p) => !p.deleted_at);
  const withPhoto = new Set(images.map((i) => i.product_id));
  return {
    live: active.filter((p) => p.status === 'published').length,
    drafts: active.filter((p) => p.status === 'draft').length,
    hidden: active.filter((p) => p.status === 'hidden').length,
    categories: categories.filter((c) => !c.deleted_at).length,
    trash: products.filter((p) => p.deleted_at).length + categories.filter((c) => c.deleted_at).length,
    noPhoto: active.filter((p) => !withPhoto.has(p.id)),
    missingAlt: images.filter((i) => !i.alt_text && !i.media?.alt_text).length,
    recent: active.slice(0, 6),
  };
}

// ── Categories ────────────────────────────────────────────────────
export async function listCategories({ trashed = false } = {}) {
  let query = db().from('categories')
    .select('id, slug, name, description, status, sort_order, deleted_at, updated_at, image:media(id, path), products(id, deleted_at)')
    .order('sort_order');
  query = trashed ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
  const rows = must(await query);
  return rows.map((c) => ({
    ...c,
    imageUrl: mediaUrl(c.image?.path),
    productCount: (c.products || []).filter((p) => !p.deleted_at).length,
  }));
}

export async function saveCategory(cat) {
  const row = {
    slug: cat.slug, name: cat.name, description: cat.description || null,
    status: cat.status, image_id: cat.image_id || null,
  };
  if (cat.id) return must(await db().from('categories').update(row).eq('id', cat.id).select('id').single()).id;
  const { data: last } = await db().from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  row.sort_order = (last?.[0]?.sort_order ?? -1) + 1;
  return must(await db().from('categories').insert(row).select('id').single()).id;
}

// Swap two categories' positions
export async function swapCategoryOrder(a, b) {
  must(await db().from('categories').update({ sort_order: b.sort_order }).eq('id', a.id));
  must(await db().from('categories').update({ sort_order: a.sort_order }).eq('id', b.id));
}

export async function moveProductsToCategory(fromId, toId) {
  must(await db().from('products').update({ category_id: toId }).eq('category_id', fromId).is('deleted_at', null));
}

export const trashCategory = async (id) => must(await db().from('categories').update({ deleted_at: new Date().toISOString() }).eq('id', id));
export const restoreCategory = async (id) => must(await db().from('categories').update({ deleted_at: null }).eq('id', id));
export const deleteCategoryForever = async (id) => must(await db().from('categories').delete().eq('id', id));

// ── Products ──────────────────────────────────────────────────────
export async function listProducts({ trashed = false } = {}) {
  let query = db().from('products')
    .select('id, slug, name, status, sort_order, updated_at, deleted_at, category:categories(id, slug, name), images:product_images(sort_order, media(path))')
    .order('sort_order');
  query = trashed ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
  const rows = must(await query);
  return rows.map((p) => {
    const first = [...(p.images || [])].sort((a, b) => a.sort_order - b.sort_order)[0];
    return { ...p, thumb: mediaUrl(first?.media?.path), photoCount: (p.images || []).length };
  });
}

export async function getProduct(id) {
  const p = must(await db().from('products')
    .select(`id, slug, name, category_id, short_description, full_description, specs, features, applications,
             keywords, status, is_featured, seo_title, seo_description, deleted_at,
             images:product_images(sort_order, alt_text, media(id, path, alt_text, width, height)),
             related:product_related!product_related_product_id_fkey(sort_order, related_id)`)
    .eq('id', id).single());
  return {
    ...p,
    short_description: p.short_description || '',
    full_description: p.full_description || '',
    seo_title: p.seo_title || '',
    seo_description: p.seo_description || '',
    images: [...p.images].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({
      media_id: i.media.id, url: mediaUrl(i.media.path), alt_text: i.alt_text || i.media.alt_text || '',
      width: i.media.width, height: i.media.height,
    })),
    related: [...p.related].sort((a, b) => a.sort_order - b.sort_order).map((r) => r.related_id),
  };
}

export async function saveProduct(form) {
  const payload = {
    id: form.id || null,
    slug: form.slug, name: form.name.trim(), category_id: form.category_id,
    short_description: form.short_description, full_description: form.full_description,
    specs: form.specs.filter((s) => s.label.trim() || s.value.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
    features: form.features, applications: form.applications, keywords: form.keywords,
    status: form.status, is_featured: form.is_featured,
    seo_title: form.seo_title, seo_description: form.seo_description,
    images: form.images.map((i) => ({ media_id: i.media_id, alt_text: i.alt_text })),
    related: form.related,
  };
  return must(await db().rpc('save_product', { payload }));
}

// Finds a free web address: name, name-2, name-3 …
export async function uniqueProductSlug(base, exceptId = null) {
  const root = slugify(base) || 'product';
  const { data } = await db().from('products').select('id, slug').like('slug', `${root}%`);
  const taken = new Set((data || []).filter((r) => r.id !== exceptId).map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let n = 2; n < 500; n++) if (!taken.has(`${root}-${n}`)) return `${root}-${n}`;
  return `${root}-${Date.now()}`;
}

export async function duplicateProduct(id) {
  const p = await getProduct(id);
  const slug = await uniqueProductSlug(`${p.slug}-copy`);
  return saveProduct({ ...p, id: null, slug, name: `${p.name} (copy)`, status: 'draft' });
}

export const setProductStatus = async (id, status) => must(await db().from('products').update({ status }).eq('id', id));
export const trashProduct = async (id) => must(await db().from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id));
export const restoreProduct = async (id) => must(await db().from('products').update({ deleted_at: null }).eq('id', id));
export const deleteProductForever = async (id) => must(await db().from('products').delete().eq('id', id));

// ── Photos ────────────────────────────────────────────────────────
// Returns { media_id, url, alt_text, reused } — reused = this photo was already in the library
export async function uploadImage(file, { altText = '', userId } = {}) {
  const prepared = await prepareImage(file);

  const { data: existing } = await db().from('media')
    .select('id, path, alt_text').eq('content_hash', prepared.hash).is('deleted_at', null).maybeSingle();
  if (existing) {
    return { media_id: existing.id, url: mediaUrl(existing.path), alt_text: altText || existing.alt_text || '', reused: true };
  }

  const now = new Date();
  const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${prepared.ext}`;
  const { error: upErr } = await db().storage.from('media').upload(path, prepared.blob, {
    contentType: prepared.mime, cacheControl: '2592000', upsert: false,
  });
  if (upErr) throw upErr;

  const { data: row, error } = await db().from('media').insert({
    bucket: 'media', path, original_filename: prepared.name, mime_type: prepared.mime,
    width: prepared.width, height: prepared.height, size_bytes: prepared.blob.size,
    content_hash: prepared.hash, alt_text: altText || null, uploaded_by: userId || null,
  }).select('id').single();
  if (error) {
    await db().storage.from('media').remove([path]); // don't leave an orphan file behind
    throw error;
  }
  return { media_id: row.id, url: mediaUrl(path), alt_text: altText, reused: false };
}
