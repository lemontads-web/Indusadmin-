import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Runs every migration in an in-memory Postgres (PGlite) with stand-ins for
// Supabase auth/storage, then checks each role's permissions. Run: npm run test:db
const MIG = process.argv[2] || fileURLToPath(new URL('../migrations', import.meta.url));
const db = new PGlite();
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const expectError = async (name, sql, match) => {
  try { await db.exec(sql); ok(name, false, 'no error'); }
  catch (e) { ok(name, !match || new RegExp(match, 'i').test(e.message), e.message.split('\n')[0]); }
};

// ── Stand-ins for what Supabase provides ──
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;

`).catch(async (e) => { if (!/pgcrypto/.test(e.message)) throw e; });

for (const f of readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort()) {
  try { await db.exec(readFileSync(join(MIG, f), 'utf8')); ok(`migration ${f} runs`, true); }
  catch (e) { ok(`migration ${f} runs`, false, e.message); process.exit(1); }
}

// ── Users ──
const OWNER = '00000000-0000-0000-0000-00000000000a', EDITOR = '00000000-0000-0000-0000-00000000000b',
      SALES = '00000000-0000-0000-0000-00000000000c', RANDO = '00000000-0000-0000-0000-00000000000d';
await db.exec(`insert into auth.users values ('${OWNER}','owner@x.com'),('${EDITOR}','ed@x.com'),('${SALES}','sales@x.com'),('${RANDO}','rando@x.com')`);
await db.exec(readFileSync(join(MIG, '..', 'make-me-owner.sql'), 'utf8').replace('YOUR-EMAIL@example.com', 'owner@x.com'));
await db.exec(`insert into public.admin_users (user_id,email,role) values ('${EDITOR}','ed@x.com','editor'),('${SALES}','sales@x.com','sales')`);
ok('make-me-owner.sql creates owner', (await db.query(`select role from admin_users where user_id='${OWNER}'`)).rows[0]?.role === 'owner');

const as = async (uid, role, fn) => {
  await db.exec(`set test.uid = '${uid || ''}'; set role ${role};`);
  try { return await fn(); } finally { await db.exec(`reset role; set test.uid = '';`); }
};
const q = async (sql) => (await db.query(sql)).rows;

// ── Editor creates content ──
await as(EDITOR, 'authenticated', async () => {
  await db.exec(`insert into categories (slug,name,status) values ('coil-heaters','Coil Heaters','published'),('secret','Hidden Cat','draft')`);
  await db.exec(`insert into media (path, content_hash) values ('p/a.jpg','hashA')`);
  await db.exec(`insert into products (slug,name,category_id,status,keywords) select 'spring-coil-heaters','Spring Coil Heaters',id,'published','{spring heater}' from categories where slug='coil-heaters'`);
  await db.exec(`insert into products (slug,name,category_id,status) select 'draft-one','Draft Product',id,'draft' from categories where slug='coil-heaters'`);
  await db.exec(`insert into products (slug,name,category_id,status) select 'in-hidden-cat','In Hidden Cat',id,'published' from categories where slug='secret'`);
  await db.exec(`insert into product_images (product_id, media_id) select p.id, m.id from products p, media m where p.slug='spring-coil-heaters'`);
  await db.exec(`insert into banners (title, placement, status) values ('Happy Pongal from Indus Heaters','top_strip','published')`);
  await db.exec(`insert into banners (title, placement, status, starts_at) values ('Future offer','home_hero','published', now() + interval '2 days')`);
  ok('editor can create categories/products/banners', true);
  ok('created_by stamped automatically', (await q(`select created_by from products where slug='spring-coil-heaters'`))[0].created_by === EDITOR);
});

// ── Public visitor ──
await as(null, 'anon', async () => {
  const prods = (await q(`select slug from products order by slug`)).map((r) => r.slug);
  ok('visitor sees only published products in published categories', JSON.stringify(prods) === '["spring-coil-heaters"]', prods.join(','));
  ok('visitor sees only published categories', (await q(`select count(*)::int c from categories`))[0].c === 1);
  ok('visitor sees images of public products', (await q(`select count(*)::int c from product_images`))[0].c === 1);
  const b = (await q(`select title from banners`)).map((r) => r.title);
  ok('visitor sees only live banners (future one hidden)', JSON.stringify(b) === '["Happy Pongal from Indus Heaters"]', b.join(','));
  ok('visitor sees public settings only', (await q(`select key from site_settings where key='whatsapp_alert_number'`)).length === 0);
});
await as(null, 'anon', () => expectError('visitor cannot edit products', `update products set name='hacked'`, 'permission denied'));
await as(null, 'anon', () => expectError('visitor cannot insert enquiries directly', `insert into enquiries (customer_name, phone) values ('x','9999999999')`, 'permission denied'));

// ── Enquiry submission ──
const payload = JSON.stringify({ customer_name: 'Ravi', company_name: 'ABC Plastics', phone: '9876543210', city: 'Chennai',
  items: [{ product_slug: 'spring-coil-heaters', product_name: 'Spring Coil Heaters', quantity: 10, measurements: { A: '3x3mm' } }],
  attachments: [{ path: 'incoming/abc/drawing.pdf', filename: 'drawing.pdf' }, { path: 'secret/evil.pdf' }] }).replace(/'/g, "''");
await as(null, 'anon', async () => {
  const id = (await q(`select submit_enquiry('${payload}'::jsonb) id`))[0].id;
  ok('visitor can submit an enquiry', !!id);
  ok('visitor cannot read enquiries back', (await q(`select count(*)::int c from enquiries`))[0].c === 0);
});
await as(SALES, 'authenticated', async () => {
  const items = await q(`select product_name, quantity, product_id is not null linked from enquiry_items`);
  ok('sales sees enquiry with linked product + qty', items.length === 1 && items[0].quantity === 10 && items[0].linked);
  ok('only incoming/ attachments accepted', (await q(`select count(*)::int c from enquiry_attachments`))[0].c === 1);
  await db.exec(`update enquiries set status='contacted'`);
  ok('sales can update enquiry status', (await q(`select status from enquiries`))[0].status === 'contacted');
  ok('sales cannot see draft products', (await q(`select count(*)::int c from products where status='draft'`))[0].c === 0);
});
await as(SALES, 'authenticated', () => expectError('sales cannot edit products', `insert into categories (slug,name) values ('x-y','Nope')`, 'row-level security'));
await as(EDITOR, 'authenticated', async () => ok('editor cannot read enquiries', (await q(`select count(*)::int c from enquiries`))[0].c === 0));
await as(RANDO, 'authenticated', async () => ok('logged-in non-admin gets no admin access', (await q(`select count(*)::int c from products`))[0].c === 1));

for (let i = 0; i < 5; i++) await as(null, 'anon', () => q(`select submit_enquiry('{"customer_name":"Spam","phone":"9000000000"}'::jsonb)`)).catch(() => {});
await as(null, 'anon', () => expectError('spam guard: 6th enquiry/hour from same number blocked', `select submit_enquiry('{"customer_name":"Spam","phone":"9000000000"}'::jsonb)`, 'Too many enquiries'));
await as(null, 'anon', () => expectError('enquiry needs a valid phone', `select submit_enquiry('{"customer_name":"A","phone":"abc"}'::jsonb)`, 'valid phone'));

// ── Rules that keep content clean ──
await as(EDITOR, 'authenticated', () => expectError('same photo cannot be uploaded twice', `insert into media (path, content_hash) values ('p/b.jpg','hashA')`, 'duplicate'));
await as(EDITOR, 'authenticated', () => expectError('only one live top strip at a time', `insert into banners (title, placement, status) values ('Second strip','top_strip','published')`, 'duplicate'));
await as(EDITOR, 'authenticated', () => expectError('top strip text max 90 chars', `insert into banners (title, placement) values (repeat('x',91),'top_strip')`, 'check'));
await as(EDITOR, 'authenticated', () => expectError('slug must be lowercase-with-dashes', `insert into categories (slug,name) values ('Bad Slug','Valid Name')`, 'categories_slug_check'));
await as(EDITOR, 'authenticated', async () => {
  await db.exec(`delete from products where slug='draft-one'`);
  ok('editor cannot permanently delete (row survives)', (await q(`select count(*)::int c from products where slug='draft-one'`))[0].c === 1);
  await db.exec(`update products set deleted_at=now() where slug='draft-one'`);
  ok('editor can move product to trash (soft delete)', (await q(`select deleted_at is not null d from products where slug='draft-one'`))[0].d);
});
await as(OWNER, 'authenticated', async () => {
  await db.exec(`delete from products where slug='draft-one'`);
  ok('owner can permanently delete', (await q(`select count(*)::int c from products where slug='draft-one'`))[0].c === 0);
  ok('owner reads audit log', (await q(`select count(*)::int c from audit_log where table_name='products'`))[0].c >= 4);
  ok('owner reads all settings', (await q(`select count(*)::int c from site_settings`))[0].c === 4);
});
await as(OWNER, 'authenticated', () => expectError('cannot remove the last owner', `update admin_users set role='editor' where user_id='${OWNER}'`, 'at least one active owner'));
await as(EDITOR, 'authenticated', () => q(`update admin_users set role='owner' where user_id='${EDITOR}'`).then(async () =>
  ok('editor cannot promote themselves', (await db.query(`select role from admin_users where user_id='${EDITOR}'`)).rows[0].role === 'editor')));

// ── Storage ──
await as(null, 'anon', () => db.exec(`insert into storage.objects (bucket_id, name) values ('enquiry-attachments','incoming/abc/drawing.pdf')`))
  .then(() => ok('visitor can upload to incoming/', true)).catch((e) => ok('visitor can upload to incoming/', false, e.message));
await as(null, 'anon', () => expectError('visitor cannot upload elsewhere', `insert into storage.objects (bucket_id, name) values ('enquiry-attachments','other/x.pdf')`, 'row-level security'));
await as(null, 'anon', () => expectError('visitor cannot upload product photos', `insert into storage.objects (bucket_id, name) values ('media','p/x.jpg')`, 'row-level security'));
await as(null, 'anon', async () => ok('visitor cannot list enquiry files', (await q(`select count(*)::int c from storage.objects`))[0].c === 0));
await as(SALES, 'authenticated', async () => ok('sales can open enquiry files', (await q(`select count(*)::int c from storage.objects where bucket_id='enquiry-attachments'`))[0].c === 1));
await as(EDITOR, 'authenticated', () => db.exec(`insert into storage.objects (bucket_id, name) values ('media','p/x.jpg')`))
  .then(() => ok('editor can upload product photos', true)).catch((e) => ok('editor can upload product photos', false, e.message));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
