// Compares what a website visitor gets from Supabase with src/data/*.
// Run: npm run verify:supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const products = JSON.parse(readFileSync(join(ROOT, 'src/data/products.json'), 'utf8'));
const { default: categories } = await import(pathToFileURL(join(ROOT, 'src/data/categories.js')).href);
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const problems = [];
const same = (what, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) problems.push(`${what}: site=${JSON.stringify(a)} supabase=${JSON.stringify(b)}`); };
const toSite = (path) => `/images/${path}`;

const { data: cats, error: e1 } = await db.from('categories').select('slug, name, description, sort_order, image:media(path)').order('sort_order');
const { data: prods, error: e2 } = await db.from('products')
  .select('legacy_id, slug, name, short_description, full_description, specs, features, applications, keywords, sort_order, category:categories(slug), images:product_images(sort_order, media(path)), related:product_related!product_related_product_id_fkey(sort_order, related:products!product_related_related_id_fkey(slug))')
  .order('sort_order');
if (e1 || e2) { console.error(e1 || e2); process.exit(1); }

same('category count', categories.length, cats.length);
categories.forEach((c, i) => {
  const s = cats.find((x) => x.slug === c.slug);
  if (!s) return problems.push(`category missing: ${c.slug}`);
  same(`${c.slug} name`, c.label, s.name);
  same(`${c.slug} description`, c.desc, s.description);
  same(`${c.slug} order`, i, s.sort_order);
  same(`${c.slug} tile image`, c.image, toSite(s.image?.path));
});

same('product count', products.length, prods.length);
products.forEach((p, i) => {
  const s = prods.find((x) => x.slug === p.slug);
  if (!s) return problems.push(`product missing: ${p.slug}`);
  same(`${p.slug} name`, p.name, s.name);
  same(`${p.slug} category`, p.category, s.category?.slug);
  same(`${p.slug} short description`, p.shortDescription || null, s.short_description);
  same(`${p.slug} full description`, p.fullDescription || null, s.full_description);
  same(`${p.slug} specs`, p.specs || [], s.specs);
  same(`${p.slug} features`, p.features || [], s.features);
  same(`${p.slug} applications`, p.applications || [], s.applications);
  same(`${p.slug} keywords`, p.keywords || [], s.keywords);
  same(`${p.slug} order`, i, s.sort_order);
  same(`${p.slug} photos (in order)`, p.images, s.images.sort((a, b) => a.sort_order - b.sort_order).map((x) => toSite(x.media.path)));
  same(`${p.slug} related (in order)`, p.relatedProducts || [], s.related.sort((a, b) => a.sort_order - b.sort_order).map((x) => x.related.slug));
});

// Download a sample of photos and compare byte size with the local file
const sample = [...new Set(products.flatMap((p) => p.images))].filter((_, i) => i % 8 === 0);
for (const img of sample) {
  const { data } = db.storage.from('media').getPublicUrl(img.replace(/^\/images\//, ''));
  const res = await fetch(data.publicUrl);
  const bytes = (await res.arrayBuffer()).byteLength;
  if (!res.ok) problems.push(`photo not served (${res.status}): ${img}`);
  else same(`${img} file size`, statSync(join(ROOT, 'public', img)).size, bytes);
}

console.log(`Checked ${cats.length} categories, ${prods.length} products, every field, photo order, related links, and downloaded ${sample.length} photos.`);
if (problems.length) { console.log(`\n✘ ${problems.length} difference(s):\n  ` + problems.join('\n  ')); process.exit(1); }
console.log('✔ Supabase matches the website data exactly.');
