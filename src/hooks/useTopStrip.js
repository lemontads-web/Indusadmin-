import { useState } from 'react';

export const STRIP_HEIGHT = 32; // px — MainLayout adds this to the page offset

export const dismissKey = (id) => `indus-banner-dismissed-${id}`;
const wasDismissed = (id) => {
  try { return localStorage.getItem(dismissKey(id)) === '1'; } catch { return false; }
};

// Picks the live top-strip banner the visitor hasn't closed.
export function useTopStrip(banners) {
  const [dismissed, setDismissed] = useState([]);
  const banner = banners.find((b) => b.placement === 'top_strip' && !dismissed.includes(b.id) && !wasDismissed(b.id));
  return { banner, dismiss: () => banner && setDismissed((d) => [...d, banner.id]) };
}
