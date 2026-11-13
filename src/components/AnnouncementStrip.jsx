import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { STRIP_HEIGHT, dismissKey } from '../hooks/useTopStrip';

const THEMES = {
  red: 'bg-accent text-white',
  grey: 'bg-primary text-white',
  white: 'bg-white text-primary border-b border-muted/15',
};

// One-line announcement above the menu bar (offers, festival greetings).
export default function AnnouncementStrip({ banner, onDismiss }) {
  const theme = THEMES[banner.theme] || THEMES.red;
  const isExternal = /^https?:\/\//.test(banner.buttonLink || '');
  const linkClass = 'inline-flex items-center gap-1 underline underline-offset-2 decoration-1 hover:no-underline shrink-0';

  return (
    <div className={`${theme} relative`} style={{ height: STRIP_HEIGHT }} role="region" aria-label="Announcement">
      <div className="max-w-7xl mx-auto h-full px-10 flex items-center justify-center gap-3 font-heading font-light text-[11px] sm:text-xs uppercase tracking-[0.15em]">
        <span className="truncate">{banner.title}</span>
        {banner.buttonText && banner.buttonLink && (
          isExternal
            ? <a href={banner.buttonLink} target="_blank" rel="noopener noreferrer" className={linkClass}>{banner.buttonText} <ArrowRight className="w-3 h-3" /></a>
            : <Link to={banner.buttonLink} className={linkClass}>{banner.buttonText} <ArrowRight className="w-3 h-3" /></Link>
        )}
      </div>
      {banner.dismissible && (
        <button
          type="button"
          onClick={() => {
            try { localStorage.setItem(dismissKey(banner.id), '1'); } catch { /* ignore */ }
            onDismiss();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
