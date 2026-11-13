// Saves a website enquiry into the admin inbox (Supabase).
// Attached files go to the private "enquiry-attachments" storage first.
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const ENQUIRY_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel',
  'application/dxf', 'image/vnd.dxf',
];
export const ENQUIRY_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,.pdf,.xlsx,.xls,.dxf';
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

const safeName = (name) => name.normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(-80) || 'file';

async function uploadAttachments(files) {
  const uploaded = [];
  const skipped = [];
  const folder = `incoming/${crypto.randomUUID()}`;
  for (const file of files.slice(0, MAX_FILES)) {
    const okType = ENQUIRY_FILE_TYPES.includes(file.type) || /\.(dxf|pdf|xlsx?)$/i.test(file.name);
    if (!okType || file.size > MAX_BYTES) { skipped.push(file.name); continue; }
    const path = `${folder}/${safeName(file.name)}`;
    const { error } = await supabase.storage.from('enquiry-attachments').upload(path, file, {
      contentType: file.type || 'application/octet-stream', upsert: false,
    });
    if (error) skipped.push(file.name);
    else uploaded.push({ path, filename: file.name, mime_type: file.type || null, size_bytes: file.size });
  }
  return { uploaded, skipped: [...skipped, ...files.slice(MAX_FILES).map((f) => f.name)] };
}

// Returns { id } on success. Throws on failure (the caller still has the email copy).
export async function saveEnquiryToInbox({ customerName, companyName, phone, deliveryAddress, message, items, files = [], source = 'website_form' }) {
  if (!isSupabaseConfigured) throw new Error('Inbox not configured');
  const { uploaded, skipped } = files.length ? await uploadAttachments(files) : { uploaded: [], skipped: [] };
  const payload = {
    customer_name: customerName,
    company_name: companyName || null,
    phone,
    delivery_address: deliveryAddress || null,
    message: [message, skipped.length ? `(Files not uploaded: ${skipped.join(', ')})` : ''].filter(Boolean).join('\n') || null,
    source,
    items: items.map((item) => ({
      product_slug: item.slug || null,
      product_name: item.name,
      quantity: item.quantity,
      measurements: item.measurements || {},
      note: item.note || null,
    })),
    attachments: uploaded,
  };
  const { data, error } = await supabase.rpc('submit_enquiry', { payload });
  if (error) throw error;
  return { id: data, skipped };
}
