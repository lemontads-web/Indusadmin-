import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import ourApproachImg from '../assets/products/5.png';


import SectionHeading from '../components/SectionHeading';
import StatsBar from '../components/StatsBar';
import HeroButton from '../components/HeroButton';

const heroImageModules = import.meta.glob('/src/image-animation/*.{jpg,jpeg,png,webp,avif}', { eager: true, import: 'default' });
const heroImages = Object.entries(heroImageModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, img]) => img);

const categories = [
  { name: 'Tubular Heaters',       image: '/images/Tubular Heaters 1.jpg',                    slug: 'tubular-heaters',    desc: 'For air, liquid and solid heating — SS304 to Inconel.' },
  { name: 'Cartridge Heaters',     image: '/images/Low & High Density Cartridge Heaters.jpg', slug: 'cartridge-heaters',  desc: 'High-density swaged construction. Custom dia & wattage.' },
  { name: 'Band Heaters',          image: '/images/Mica Band Heaters.jpg',                    slug: 'band-heaters',       desc: 'Mica and ceramic variants for extrusion cylinders.' },
  { name: 'Coil Heaters',          image: '/images/IMG_9425 copy.jpg',                        slug: 'hot-runner',         desc: 'Fast response — J/K thermocouple built-in, 550°C.' },
  { name: 'Infrared Heaters',      image: '/images/16.jpg',                                   slug: 'infrared-heaters',   desc: 'Ceramic & silica types — 400–1300°C range.' },
  { name: 'Thermocouples',         image: '/images/15.jpg',                                   slug: 'thermocouples',      desc: 'MI-type in 1mm, 1.5mm, 3mm — customizable length.' },
];

const industries = [
  'Plastic industry',
  'Packaging industry',
  'Corrugated industry',
  'Chennai industry',
  'Medical industry',
  'Food processing industry',
  'Engineering sectors',
  'Kitchen equipment manufacturing industry',
  'Powder coating industry',
  'Air conditioning systems',
  'Cold room industry',
  'Molds and dies heating industry',
  'Liquid heating industry (water, oil, chemical)',
  'Power plants',
  'Foundry',
  'Domestic applications',
  'PET performance blow moulding industry',
  'Rubber industry',
  'Automotive industry'
];

export default function Home() {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white text-primary font-heading font-light">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-75px)] md:min-h-[520px] lg:min-h-[600px] flex items-stretch border-b border-muted/15 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full flex flex-col md:flex-row items-stretch justify-between relative z-10 md:py-0">
          
          {/* Mobile: Top (order-1), Desktop: Right Panel — flush to top, no gap */}
          <div className="order-1 md:order-2 w-full md:w-1/2 md:absolute md:top-0 md:bottom-0 md:right-0 h-64 sm:h-80 md:h-full relative overflow-hidden bg-white">
            {heroImages.map((imgSrc, idx) => (
              <img
                key={imgSrc}
                src={imgSrc}
                alt={`Indus Heaters product asset ${idx + 1}`}
                loading={idx === 0 ? 'eager' : 'lazy'}
                className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-1000 ease-in-out ${
                  idx === currentHeroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}
          </div>

          {/* Mobile: Bottom (order-2), Desktop: Left Panel */}
          <motion.div
            className="order-2 md:order-1 w-full md:w-1/2 py-8 sm:py-12 md:py-20 lg:py-24 md:pr-12"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Headline: line-height 1.25 only — no block wrappers, no extra gaps */}
            <h1 className="font-heading font-light mb-6 sm:mb-8 tracking-tight" style={{ lineHeight: 1.25 }}>
              {/* Mobile: 2 lines, fluid clamp font */}
              <span className="md:hidden" style={{ fontSize: 'clamp(1.25rem, 5.6vw, 1.75rem)' }}>
                <span className="text-primary">BUILT FOR </span><span className="text-accent">HEAT.</span>
                <br />
                <span className="text-primary">BUILT TO </span><span className="text-accent">LAST.</span>
              </span>
              {/* Desktop: 4 lines */}
              <span className="hidden md:inline text-5xl sm:text-7xl lg:text-8xl">
                <span className="text-primary">BUILT FOR</span><br />
                <span className="text-accent">HEAT.</span><br />
                <span className="text-primary">BUILT TO</span><br />
                <span className="text-accent">LAST.</span>
              </span>
            </h1>

            {/* Color Mix: Grey Paragraph on White */}
            <p className="text-primary text-base sm:text-lg leading-[1.25] mb-8 sm:mb-10 max-w-md font-normal">
              India's precision industrial heater manufacturer since 2002. Custom heating solutions for plastic, polymer and rubber industries, engineered to 0.1% tolerance.
            </p>

            {/* Color Mix: Buttons */}
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <HeroButton to="/products" variant="solid" icon={ArrowRight}>
                Catalog Access
              </HeroButton>
              <HeroButton to="/enquiry" variant="outline">
                Request Quote
              </HeroButton>
            </div>
          </motion.div>

        </div>
      </section>


      {/* ── PRODUCT CATEGORIES ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <SectionHeading
          label="Product Range"
          title={<><span className="text-accent">PRECISION</span><br />HEATING RANGE</>}
          theme="on-white"
          action={
            <Link to="/products" className="flex items-center gap-3 text-xs font-heading font-light uppercase tracking-[0.2em] text-primary hover:text-accent transition-all group">
              View All Products <ArrowRight className="w-4 h-4 group-hover:translate-x-1 duration-300" />
            </Link>
          }
        />

        {/* Product Categories Grid with subtle 15% opacity border and red hover shadow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border border-muted/15">
          {categories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group border-b border-r border-muted/15 hover:border-accent/40 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 relative bg-white flex flex-col justify-between"
              style={{ borderRight: (idx + 1) % 3 === 0 ? 'none' : undefined }}
            >
              <Link to={`/products?category=${cat.slug}`} className="block h-full flex flex-col justify-between">
                {/* Image area */}
                <div className="aspect-[4/3] w-full bg-white overflow-hidden relative border-b border-muted/15 flex items-center justify-center p-5">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                {/* Text area: Single Category Title in #515151 grey + description & red action link */}
                <div className="p-5 bg-white flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-light text-primary tracking-tight group-hover:text-accent transition-colors mb-2">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-primary/80 font-normal leading-[1.25]">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-heading font-light uppercase tracking-[0.15em] text-accent group-hover:translate-x-1 transition-transform">
                    <span>View Category</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ── STATS BAR (Red Background: White Text) ─── */}
      <StatsBar />


      {/* ── ABOUT STRUCTURAL ─────────────────────────── */}
      <section className="border-b border-muted/15 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 items-center">

          {/* Mobile: Top (order-1), Desktop: Right (lg:order-2 lg:col-span-7) */}
          <div className="order-1 lg:order-2 lg:col-span-7 w-full bg-white relative overflow-hidden group h-64 sm:h-80 lg:h-[480px]">
            <img
              src={ourApproachImg}
              alt="Indus Heaters Manufacturing Facility"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
            />
          </div>

          {/* Mobile: Bottom (order-2), Desktop: Left (lg:order-1 lg:col-span-5) */}
          <div className="order-2 lg:order-1 lg:col-span-5 py-12 lg:py-16 pr-0 lg:pr-10 border-r border-muted/15 structural-line-left pl-4">
            <SectionHeading
              label="Our Approach"
              title={<><span className="text-accent">PRECISION.</span><br />EXPERIENCE.<br />UNWAVERING TRUST.</>}
              theme="on-white"
            />
            {/* Color Mix: Grey Paragraph on White */}
            <p className="text-primary leading-[1.25] mb-4 text-sm sm:text-base font-normal">
              Since inception in 2002, Indus Heaters has been the backbone for high-stakes industrial heating cycles. We don't just "make" heaters; we engineer thermal stability for environments where zero-downtime is the only acceptable metric.
            </p>
            <p className="text-primary leading-[1.25] mb-8 text-sm sm:text-base font-normal">
              Based in Chennai with ISO-aligned facilities in Mutlur, our engineers design to your application, not our catalogue.
            </p>
            <Link to="/about" className="btn-industrial inline-flex items-center gap-3 text-sm font-heading font-light uppercase tracking-[0.2em] text-accent hover:text-accent transition-all">
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>


      {/* ── INDUSTRIES TECHNICAL ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 border-b border-muted/15">
        <SectionHeading
          label="Industries"
          title={<>INDUSTRIES WE <span className="text-accent">SERVE</span></>}
          theme="on-white"
        />
        {/* Soft 15% opacity border */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-muted/15">
          {industries.map((ind, i) => (
            <div
              key={i}
              tabIndex={0}
              role="button"
              className="group px-6 py-5 font-heading text-[15px] font-light uppercase tracking-widest text-primary border-b border-r border-muted/15 transition-all duration-200 ease-in-out cursor-pointer flex justify-between items-center select-none hover:bg-accent hover:text-white hover:border-accent hover:-translate-y-[2px] hover:shadow-md hover:shadow-accent/25 focus-visible:bg-accent focus-visible:text-white focus-visible:border-accent focus-visible:-translate-y-[2px] focus-visible:shadow-md focus-visible:shadow-accent/25 active:bg-accent active:text-white active:border-accent active:-translate-y-[2px] active:shadow-md active:shadow-accent/25"
            >
              <span className="pr-2 transition-colors duration-200">{ind}</span>
              <span className="text-[10px] text-muted group-hover:text-white group-focus-visible:text-white group-active:text-white font-light shrink-0 transition-colors duration-200">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </section>


      {/* ── CTA BANNER (ACCENT RED BACKGROUND) ───── */}
      <section className="bg-accent text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <div className="w-12 h-[2px] bg-white mb-6" />
            <h2 className="font-heading text-4xl sm:text-5xl font-light text-white leading-[1.25] tracking-tight mb-6 uppercase">
              CAN'T FIND WHAT YOU NEED?<br />
              <span className="text-white">WE BUILD TO SPEC.</span>
            </h2>
            <p className="text-white/90 leading-[1.25] max-w-md text-base sm:text-lg font-normal">
              Custom wattage, diameter, voltage, and form factor. Describe your requirement and our engineering team will sync within 24 business hours.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <HeroButton to="/enquiry" variant="outline-white">
              Request Enquiry
            </HeroButton>
          </div>
        </div>
      </section>

    </div>
  );
}
