// Checks that the Supabase project is set up correctly, using only the
// public key (exactly what a website visitor has). Run: npm run check:supabase
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local (copy .env.example).');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed++;
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
};

for (const table of ['categories', 'products', 'product_images', 'banners', 'site_settings']) {
  const { error } = await db.from(table).select('*', { head: true, count: 'exact' });
  check(`table "${table}" readable by visitors`, !error, error?.message);
}

const { data: settings } = await db.from('site_settings').select('key, value');
const wa = settings?.find((s) => s.key === 'whatsapp_number')?.value;
check('WhatsApp number setting present', wa === '917338970698', String(wa));
check('private settings hidden from visitors', !settings?.some((s) => s.key === 'whatsapp_alert_number'));

const { count: enquiries, error: enqErr } = await db.from('enquiries').select('*', { head: true, count: 'exact' });
check('visitors cannot read enquiries', enqErr || !enquiries, enqErr?.message || `${enquiries ?? 0} visible`);

const { error: writeErr } = await db.from('products').update({ name: 'x' }).eq('slug', '__none__');
check('visitors cannot edit products', Boolean(writeErr), writeErr?.message || 'update was allowed!');

const { data: buckets } = await db.storage.from('media').list('', { limit: 1 });
check('"media" storage bucket exists', Array.isArray(buckets));

console.log(failed ? `\n${failed} check(s) failed — see docs/SUPABASE_SETUP.md` : '\nSupabase is set up correctly.');
process.exit(failed ? 1 : 0);
