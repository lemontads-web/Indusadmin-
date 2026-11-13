import { createClient } from '@supabase/supabase-js';

// Values come from .env.local (see .env.example). Only the public "anon" key
// belongs here — never the service_role key. Vite bakes these in at build time.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// null until configured, so the site keeps working from products.json meanwhile.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

// Public URL of a file in the 'media' bucket.
export const mediaUrl = (path) =>
  supabase && path ? supabase.storage.from('media').getPublicUrl(path).data.publicUrl : null;
