import { useEffect, useState } from 'react';
import { CatalogueContext } from './catalogueContext';
import { BUNDLED, fetchLiveCatalogue, readCachedCatalogue, writeCachedCatalogue } from './catalogueApi';
import { isSupabaseConfigured } from '../lib/supabase';
import { setWhatsAppNumber } from '../utils/whatsapp';

// Shows the built-in (or last cached) catalogue instantly, then swaps in the
// live Supabase data once it arrives. Any failure keeps what is on screen.
export default function CatalogueProvider({ children }) {
  const [state, setState] = useState(() => ({
    ...(readCachedCatalogue() || BUNDLED),
    loaded: !isSupabaseConfigured,
  }));

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let cancelled = false;
    fetchLiveCatalogue()
      .then((live) => {
        if (cancelled) return;
        writeCachedCatalogue(live);
        setState({ ...live, loaded: true });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[catalogue] Using built-in product data:', error?.message || error);
        // Built-in data, not the cached copy: if Supabase is down its photos are too,
        // while the built-in photos are served from this website.
        setState({ ...BUNDLED, loaded: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.settings?.whatsapp_number) setWhatsAppNumber(state.settings.whatsapp_number);
  }, [state.settings]);

  return <CatalogueContext.Provider value={state}>{children}</CatalogueContext.Provider>;
}
