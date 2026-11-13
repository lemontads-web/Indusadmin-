// Phase 2 — copy the current catalogue into Supabase.
//   • uploads every photo used by products/categories to the 'media' bucket
//   • creates categories, products, product photos and related-product links
// Safe to run more than once: existing items are updated, not duplicated.
//
// Run:  npm run import:supabase              (asks for your admin email + password)
//       npm run import:supabase -- --dry-run (shows what would happen, no changes)
//
// Signs in as YOU, so all of Supabase's security rules apply. The password is
// read from the keyboard (hidden), used once for sign-in, and never saved.

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import readline from 'node:readline';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
const BUCKET = 'media';

// ── Load the site's current data ───────────────────────────────────
const products = JSON.parse(readFileSync(join(ROOT, 'src/data/products.json'), 'utf8'));
const { default: categories } = await import(pathToFileURL(join(ROOT, 'src/data/categories.js')).href);

// ── Image helpers ──────────────────────────────────────────────────
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function imageSize(buf, ext) {
  if (ext === '.png') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  // JPEG: walk markers until a Start-Of-Frame
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return { width: null, height: null };
}

// '/images/products/x.jpg' → bucket path 'products/x.jpg'
const bucketPath = (sitePath) => sitePath.replace(/^\/images\//, '');

// Every image the site uses, with a human description for alt text
const images = new Map(); // sitePath → { alt }
for (const c of categories) if (c.image) images.set(c.image, { alt: `${c.label} — Indus Heaters` });
for (const p of products) {
  p.images.forEach((img, i) => {
    if (!images.has(img)) images.set(img, { alt: p.images.length > 1 ? `${p.name} — photo ${i + 1}` : p.name });
  });
}

const files = [...images.entries()].map(([sitePath, { alt }]) => {
  const local = join(ROOT, 'public', sitePath);
  if (!existsSync(local)) throw new Error(`Missing image file: public${sitePath}`);
  const buf = readFileSync(local);
  const ext = extname(local).toLowerCase();
  return {
    sitePath, alt, buf,
    path: bucketPath(sitePath),
    mime: MIME[ext] || 'application/octet-stream',
    hash: createHash('sha256').update(buf).digest('hex'),
    size: buf.length,
    ...imageSize(buf, ext),
  };
});

// Two different paths with byte-identical content would break the "no duplicate photo" rule
const byHash = new Map();
for (const f of files) {
  if (byHash.has(f.hash)) throw new Error(`Same photo used under two names: ${byHash.get(f.hash)} and ${f.sitePath}`);
  byHash.set(f.hash, f.sitePath);
}

const productSlugs = new Set(products.map((p) => p.slug));
for (const p of products) {
  if (!categories.some((c) => c.slug === p.category)) throw new Error(`${p.slug}: unknown category ${p.category}`);
  for (const r of p.relatedProducts || []) if (!productSlugs.has(r)) throw new Error(`${p.slug}: related product ${r} not found`);
  if ((p.relatedProducts || []).includes(p.slug)) throw new Error(`${p.slug}: lists itself as a related product`);
  if (new Set(p.relatedProducts || []).size !== (p.relatedProducts || []).length) throw new Error(`${p.slug}: related product listed twice`);
}

const totalMB = (files.reduce((s, f) => s + f.size, 0) / 1048576).toFixed(1);
console.log(`Found ${categories.length} categories, ${products.length} products, ${files.length} photos (${totalMB} MB).`);

if (DRY) {
  console.log('\nDry run — nothing will be changed. Sample:');
  for (const f of files.slice(0, 3)) console.log(`  ${f.path}  ${f.width}x${f.height}  ${(f.size / 1024).toFixed(0)} KB  "${f.alt}"`);
  console.log(`  …and ${files.length - 3} more photos`);
  console.log(`  Categories: ${categories.map((c) => c.slug).join(', ')}`);
  console.log(`  Product photo links: ${products.reduce((s, p) => s + p.images.length, 0)}, related links: ${products.reduce((s, p) => s + (p.relatedProducts || []).length, 0)}`);
  process.exit(0);
}

// ── Sign in as the owner ───────────────────────────────────────────
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) { console.error('Missing .env.local values (see .env.example).'); process.exit(1); }

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); else rl.output.write('*'.repeat(s.length ? 1 : 0)); };
    }
    rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(answer.trim()); });
  });
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const email = process.env.IMPORT_EMAIL || (await ask('Admin email: '));
const password = await ask('Password (hidden): ', true);
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
if (authErr) { console.error(`Sign-in failed: ${authErr.message}`); process.exit(1); }
const { data: role } = await supabase.schema('public').from('admin_users').select('role').eq('user_id', auth.user.id).maybeSingle();
if (!role || !['owner', 'editor'].includes(role.role)) {
  console.error('This login is not an owner/editor in admin_users — cannot import.');
  process.exit(1);
}
console.log(`Signed in as ${email} (${role.role}).\n`);

const fail = (what, error) => { console.error(`\n✘ ${what}: ${error.message}`); process.exit(1); };

// ── 1. Photos ──────────────────────────────────────────────────────
const mediaId = new Map(); // sitePath → media.id
{
  const { data: existing, error } = await supabase.from('media').select('id, path, content_hash').eq('bucket', BUCKET);
  if (error) fail('Reading media library', error);
  const known = new Map(existing.map((m) => [m.path, m]));
  let uploaded = 0, skipped = 0;
  for (const [n, f] of files.entries()) {
    process.stdout.write(`\rPhotos: ${n + 1}/${files.length}`);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(f.path, f.buf, {
      contentType: f.mime, cacheControl: '2592000', upsert: false,
    });
    if (upErr && !/exists|duplicate/i.test(upErr.message)) fail(`Uploading ${f.path}`, upErr);
    upErr ? skipped++ : uploaded++;

    const row = {
      bucket: BUCKET, path: f.path, original_filename: f.path.split('/').pop(), mime_type: f.mime,
      width: f.width, height: f.height, size_bytes: f.size, content_hash: f.hash, alt_text: f.alt,
      uploaded_by: auth.user.id,
    };
    const { data, error: rowErr } = known.has(f.path)
      ? await supabase.from('media').update(row).eq('id', known.get(f.path).id).select('id').single()
      : await supabase.from('media').insert(row).select('id').single();
    if (rowErr) fail(`Saving photo record ${f.path}`, rowErr);
    mediaId.set(f.sitePath, data.id);
  }
  console.log(`\rPhotos: ${files.length} ready (${uploaded} uploaded, ${skipped} already there).`);
}

// ── 2. Categories ──────────────────────────────────────────────────
const categoryId = new Map();
{
  const rows = categories.map((c, i) => ({
    slug: c.slug, name: c.label, description: c.desc, image_id: mediaId.get(c.image) || null,
    sort_order: i, status: 'published',
  }));
  const { data, error } = await supabase.from('categories').upsert(rows, { onConflict: 'slug' }).select('id, slug');
  if (error) fail('Saving categories', error);
  data.forEach((c) => categoryId.set(c.slug, c.id));
  console.log(`Categories: ${data.length} saved.`);
}

// ── 3. Products ────────────────────────────────────────────────────
const productId = new Map();
{
  const rows = products.map((p, i) => ({
    legacy_id: p.id, slug: p.slug, name: p.name, category_id: categoryId.get(p.category),
    short_description: p.shortDescription || null, full_description: p.fullDescription || null,
    specs: p.specs || [], features: p.features || [], applications: p.applications || [],
    keywords: p.keywords || [], status: 'published', sort_order: i,
  }));
  const { data, error } = await supabase.from('products').upsert(rows, { onConflict: 'slug' }).select('id, slug');
  if (error) fail('Saving products', error);
  data.forEach((p) => productId.set(p.slug, p.id));
  console.log(`Products: ${data.length} saved.`);
}

// ── 4. Product photos & related links (replaced to match the site exactly) ──
{
  const ids = [...productId.values()];
  let { error } = await supabase.from('product_images').delete().in('product_id', ids);
  if (error) fail('Clearing old photo links', error);
  const imageRows = products.flatMap((p) => p.images.map((img, i) => ({
    product_id: productId.get(p.slug), media_id: mediaId.get(img), sort_order: i,
    alt_text: p.images.length > 1 ? `${p.name} — photo ${i + 1}` : p.name,
  })));
  ({ error } = await supabase.from('product_images').insert(imageRows));
  if (error) fail('Saving photo links', error);

  ({ error } = await supabase.from('product_related').delete().in('product_id', ids));
  if (error) fail('Clearing old related links', error);
  const relatedRows = products.flatMap((p) => (p.relatedProducts || []).map((r, i) => ({
    product_id: productId.get(p.slug), related_id: productId.get(r), sort_order: i,
  })));
  ({ error } = await supabase.from('product_related').insert(relatedRows));
  if (error) fail('Saving related links', error);
  console.log(`Links: ${imageRows.length} product photos, ${relatedRows.length} related products.`);
}

await supabase.auth.signOut();
console.log('\n✔ Import complete. The website still shows products.json until Phase 3.');
