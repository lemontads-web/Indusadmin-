import { supabase, isSupabaseConfigured, mediaUrl } from '../lib/supabase';
import bundledProducts from './products.json';
import bundledCategories from './categories';

// Built-in copy shipped with the site — shown instantly, and used whenever
// Supabase can't be reached.
export const BUNDLED = {
  products: bundledProducts,
  categories: bundledCategories,
  banners: [],
  settings: {},
  source: 'bundled',
};

const TIMEOUT_MS = 8000;
const CACHE_KEY = 'indus-catalogue-v1';

const byOrder = (a, b) => a.sort_order - b.sort_order;

// Supabase rows → the same shapes products.json / categories.js use,
// so every page works the same with either source.
function toSiteShape({ categories, products, banners, settings }) {
  const cats = categories.map((c) => ({
    slug: c.slug,
    label: c.name,
    desc: c.description || '',
    image: mediaUrl(c.image?.path),
  }));

  const prods = products.map((p) => ({
    id: p.legacy_id || p.id,
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    categoryLabel: p.category.name,
    images: [...p.images].sort(byOrder).map((i) => mediaUrl(i.media.path)).filter(Boolean),
    imageAlts: [...p.images].sort(byOrder).map((i) => i.alt_text || p.name),
    shortDescription: p.short_description || '',
    fullDescription: p.full_description || '',
    specs: p.specs || [],
    features: p.features || [],
    applications: p.applications || [],
    keywords: p.keywords || [],
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    relatedProducts: [...p.related].sort(byOrder).map((r) => r.related?.slug).filter(Boolean),
  }));

  const bans = banners.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    type: b.type,
    placement: b.placement,
    theme: b.theme,
    buttonText: b.button_text,
    buttonLink: b.button_link,
    dismissible: b.dismissible,
    imageDesktop: mediaUrl(b.desktop?.path),
    imageMobile: mediaUrl(b.mobile?.path),
    imageAlt: b.desktop?.alt_text || b.title,
  }));

  const sets = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return { categories: cats, products: prods, banners: bans, settings: sets, source: 'live' };
}

export async function fetchLiveCatalogue() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const sig = controller.signal;
  try {
    const [cats, prods, bans, sets] = await Promise.all([
      supabase.from('categories')
        .select('slug, name, description, sort_order, image:media(path)')
        .order('sort_order').abortSignal(sig),
      supabase.from('products')
        .select(`legacy_id, id, slug, name, short_description, full_description, specs, features,
                 applications, keywords, seo_title, seo_description, sort_order,
                 category:categories!inner(slug, name),
                 images:product_images(sort_order, alt_text, media(path)),
                 related:product_related!product_related_product_id_fkey(sort_order,
                   related:products!product_related_related_id_fkey(slug))`)
        .order('sort_order').abortSignal(sig),
      supabase.from('banners')
        .select(`id, title, subtitle, type, placement, theme, button_text, button_link, priority, dismissible,
                 desktop:media!banners_image_desktop_id_fkey(path, alt_text),
                 mobile:media!banners_image_mobile_id_fkey(path)`)
        .order('priority', { ascending: false }).abortSignal(sig),
      supabase.from('site_settings').select('key, value').abortSignal(sig),
    ]);
    const failed = [cats, prods, bans, sets].find((r) => r.error);
    if (failed) throw failed.error;

    const live = toSiteShape({ categories: cats.data, products: prods.data, banners: bans.data, settings: sets.data });
    // An empty catalogue almost always means a setup problem, not intent — keep the built-in data.
    if (live.products.length === 0 || live.categories.length === 0) throw new Error('Supabase returned an empty catalogue');
    return live;
  } finally {
    clearTimeout(timer);
  }
}

// Last good live copy, so returning visitors see admin changes immediately.
export function readCachedCatalogue() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.products?.length ? { ...parsed, source: 'cache' } : null;
  } catch {
    return null;
  }
}

export function writeCachedCatalogue(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // storage full or blocked — not important
  }
}
