import { createClient } from '@supabase/supabase-js';

// Values come from .env.local (see .env.example). Only the public "anon" /
// publishable key belongs here — never the service_role key. Vite bakes these
// in at build time.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Public website: ALWAYS reads as an anonymous visitor, even if an admin is
// logged in in the same browser — so drafts, hidden and trashed items never
// appear on the public pages.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'indus-public' },
    })
  : null;

// Admin panel: keeps the admin's login between visits.
let admin = null;
export const getAdminClient = () => {
  if (!isSupabaseConfigured) return null;
  if (!admin) {
    admin = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'indus-admin-auth' },
    });
  }
  return admin;
};

// Public URL of a file in the 'media' bucket (same for both clients).
export const mediaUrl = (path) =>
  supabase && path ? supabase.storage.from('media').getPublicUrl(path).data.publicUrl : null;
