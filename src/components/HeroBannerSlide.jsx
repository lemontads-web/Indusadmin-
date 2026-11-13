import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const TEXT_ONLY_THEMES = {
  red: 'bg-accent text-white',
  grey: 'bg-primary text-white',
  white: 'bg-white text-primary',
};

// One offer / festival slide inside the Home hero slideshow. Same panel,
// same fade as the product photos — just a short caption on top.
export default function HeroBannerSlide({ banner, active }) {
  const hasImage = Boolean(banner.imageDesktop || banner.imageMobile);
  const isExternal = /^https?:\/\//.test(banner.buttonLink || '');
  const button = banner.buttonText && banner.buttonLink && (
    isExternal ? (
      <a href={banner.buttonLink} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}
         className="mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent hover:underline">
        {banner.buttonText} <ArrowRight className="w-3.5 h-3.5" />
      </a>
    ) : (
      <Link to={banner.buttonLink} tabIndex={active ? 0 : -1}
            className="mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent hover:underline">
        {banner.buttonText} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    )
  );

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
      aria-hidden={!active}
    >
      {hasImage ? (
        <>
          <picture>
            {banner.imageMobile && <source media="(max-width: 767px)" srcSet={banner.imageMobile} />}
            <img src={banner.imageDesktop || banner.imageMobile} alt={banner.imageAlt} className="w-full h-full object-contain object-center" />
          </picture>
          {/* Phone: along the bottom of the photo. Desktop: over the lower part of the photo, kept above the fold */}
          <div className="absolute left-3 right-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm md:bottom-auto md:top-[50%] bg-white/95 border-l-2 border-accent px-4 py-3 shadow-sm shadow-black/5">
            <div className="font-heading font-light uppercase tracking-wide text-primary text-sm sm:text-base leading-tight">{banner.title}</div>
            {banner.subtitle && <p className="mt-1 text-xs text-primary/80 font-normal leading-[1.25]">{banner.subtitle}</p>}
            {button}
          </div>
        </>
      ) : (
        // No photo: a calm text card in brand colours
        <div className={`w-full h-full flex items-center justify-center p-8 ${TEXT_ONLY_THEMES[banner.theme] || TEXT_ONLY_THEMES.red}`}>
          <div className="max-w-sm text-center">
            <div className="font-heading font-light uppercase tracking-wide text-2xl sm:text-3xl leading-tight">{banner.title}</div>
            {banner.subtitle && <p className="mt-3 text-sm opacity-90 font-normal leading-[1.25]">{banner.subtitle}</p>}
            {banner.buttonText && banner.buttonLink && (
              <div className={banner.theme === 'white' ? '' : '[&_a]:text-white'}>{button}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
