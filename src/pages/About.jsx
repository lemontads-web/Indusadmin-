import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Award } from 'lucide-react';
import pvtCert from '../assets/products/pvt.jpg';
import aboutHeroImg from '../assets/products/1.png';
import finalLogo from '../assets/Final logo.png';
import SectionHeading from '../components/SectionHeading';
import StatsBar from '../components/StatsBar';

const timeline = [
  { year: '2002', label: 'Established', desc: 'Founded in Chennai with a focus on industrial heating elements.', x: 100, y: 180 },
  { year: '2008', label: 'Expanded', desc: 'Grew production capacity and entered new industrial verticals.', x: 280, y: 135 },
  { year: '2015', label: 'Mutlur Plant', desc: 'Opened dedicated manufacturing facility in Mutlur.', x: 480, y: 85 },
  { year: 'Now', label: 'Indus Heaters Pvt Ltd', desc: 'Supplying 500+ custom products annually across 4 locations.', x: 680, y: 30 },
];

const values = [
  {
    num: '01',
    title: 'Precision',
    desc: 'Every heater is engineered to exact customer specifications — no compromises.',
    icon: (
      <svg className="w-8 h-8 text-accent transition-transform duration-300 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Reliability',
    desc: 'Designed to perform in the most demanding industrial conditions.',
    icon: (
      <svg className="w-8 h-8 text-accent transition-transform duration-300 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Customization',
    desc: '100% application-specific — wattage, form factor, sheath material, thermocouple type.',
    icon: (
      <svg className="w-8 h-8 text-accent transition-transform duration-300 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
  },
];

const locations = [
  { city: 'Chennai HQ', address: 'Tamil Nadu, India', phone: '+91 44 0000 0000', email: 'info@indusheaters.com' },
  { city: 'Mutlur Plant', address: 'Tamil Nadu, India', phone: '+91 44 0000 0001', email: 'plant@indusheaters.com' },
];

export default function About() {
  const [isGraphInView, setIsGraphInView] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const graphContainerRef = useRef(null);

  useEffect(() => {
    if (isGraphInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsGraphInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (graphContainerRef.current) {
      observer.observe(graphContainerRef.current);
    }

    return () => observer.disconnect();
  }, [isGraphInView]);

  return (
    <div className="bg-white text-primary font-heading font-light">

      {/* Hero */}
      <section className="border-b border-muted/15 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <SectionHeading
              label="Our Story"
              title={<>PRECISION.<br /><span className="text-accent">EXPERIENCE.</span><br />TRUST.</>}
              theme="on-white"
            />
            {/* Color Mix: Grey Paragraph on White */}
            <p className="text-primary leading-[1.25] text-base font-normal">
              Since 2002, Indus Heaters has built its reputation delivering heating elements with zero tolerance for failure. Based in Chennai, we serve plastic, polymer, rubber and chemical industries across India and beyond.
            </p>
          </motion.div>

          <div className="border border-muted/15 overflow-hidden h-72 sm:h-80 lg:h-[420px] w-full relative bg-white">
            <img
              src={aboutHeroImg}
              alt="Indus Heaters coil heater close-up"
              style={{ objectPosition: '80% center' }}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Unified Stats Bar */}
      <StatsBar />

      {/* Corporate Milestone */}
      <section className="w-full bg-white border-b border-muted/15 py-12 sm:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 w-full h-[40vh] lg:h-[60vh] bg-white flex items-center justify-center p-4 border border-muted/15">
            <img
              src={pvtCert}
              alt="Indus Heaters Private Limited Corporate Certificate"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-accent text-xs font-heading font-light uppercase tracking-[0.25em] mb-3">
              <Award className="w-4 h-4 text-accent" /> Corporate Milestone
            </div>
            {/* Color Mix: Grey Heading with Accent Highlight */}
            <h2 className="font-heading font-light text-3xl sm:text-4xl lg:text-5xl text-primary mb-4 leading-[1.25] uppercase">
              Indus Heaters<br />
              <span className="text-accent">Private Limited</span>
            </h2>
            {/* Color Mix: Grey Paragraph */}
            <p className="text-base text-primary leading-[1.25] font-normal mb-4">
              Formally incorporated as a Private Limited entity, solidifying 22+ years of industrial engineering excellence.
            </p>
            <p className="text-sm text-primary/80 leading-[1.25] font-normal">
              Our official Private Limited incorporation reflects our unwavering commitment to quality standards, compliance, and expanded manufacturing infrastructure serving top-tier engineering clients nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Milestone Growth Graph */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 border-b border-muted/15">
        <SectionHeading label="History" title={<>COMPANY <span className="text-accent">MILESTONES</span></>} theme="on-white" />

        {/* SVG Growth Graph */}
        <div ref={graphContainerRef} className="border border-muted/15 p-4 sm:p-8 bg-white relative overflow-hidden">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 800 240"
              className="w-full h-auto min-w-[600px] select-none"
              style={{ maxHeight: '280px' }}
            >
              <defs>
                <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d81b21" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#d81b21" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="60" y1="210" x2="740" y2="210" stroke="#515151" strokeOpacity="0.2" strokeWidth="1" />
              <line x1="60" y1="140" x2="740" y2="140" stroke="#515151" strokeOpacity="0.08" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="60" y1="75" x2="740" y2="75" stroke="#515151" strokeOpacity="0.08" strokeDasharray="4 4" strokeWidth="1" />

              {/* Vertical Drop Lines */}
              {timeline.map((pt) => (
                <line
                  key={`drop-${pt.year}`}
                  x1={pt.x}
                  y1={pt.y}
                  x2={pt.x}
                  y2="210"
                  stroke="#515151"
                  strokeOpacity="0.15"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              ))}

              {/* Shaded Area */}
              <path
                d="M 100 180 C 180 165, 200 140, 280 135 C 360 130, 400 90, 480 85 C 560 80, 600 35, 680 30 L 680 210 L 100 210 Z"
                fill="url(#growthAreaGradient)"
                style={{
                  opacity: isGraphInView ? 1 : 0,
                  transition: 'opacity 0.8s ease-in 0.3s',
                }}
              />

              {/* Growth Curve */}
              <path
                d="M 100 180 C 180 165, 200 140, 280 135 C 360 130, 400 90, 480 85 C 560 80, 600 35, 680 30"
                fill="none"
                stroke="#d81b21"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 800,
                  strokeDashoffset: isGraphInView ? 0 : 800,
                  transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />

              {/* Data Markers & Labels */}
              {timeline.map((pt, i) => (
                <g key={`marker-${pt.year}`}>
                  {/* Pulse ring on 'Now' */}
                  {pt.year === 'Now' && isGraphInView && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="none"
                      stroke="#d81b21"
                      strokeWidth="1"
                      strokeOpacity="0.6"
                      className="animate-ping"
                      style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                    />
                  )}

                  {/* Marker Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#ffffff"
                    stroke="#d81b21"
                    strokeWidth="2.5"
                    style={{
                      opacity: isGraphInView ? 1 : 0,
                      transform: isGraphInView ? 'scale(1)' : 'scale(0.3)',
                      transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.5 + i * 0.15}s`,
                      transformOrigin: `${pt.x}px ${pt.y}px`,
                    }}
                  />

                  {/* Year text above */}
                  <text
                    x={pt.x}
                    y={pt.y - 12}
                    textAnchor="middle"
                    fill="#d81b21"
                    fontSize="12"
                    fontWeight="500"
                    fontFamily="inherit"
                    letterSpacing="0.05em"
                    style={{
                      opacity: isGraphInView ? 1 : 0,
                      transition: `opacity 0.4s ease-out ${0.6 + i * 0.15}s`,
                    }}
                  >
                    {pt.year}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Details Below Graph */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-muted/15 mt-4 pt-6 gap-6 sm:gap-4">
            {timeline.map((item, i) => (
              <div
                key={i}
                className="group relative pr-4 border-b sm:border-b-0 lg:border-r border-muted/15 last:border-0 pb-6 sm:pb-0"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-heading text-3xl sm:text-4xl font-light text-accent">{item.year}</span>
                  <span className="text-xs font-mono text-primary/40">0{i + 1}</span>
                </div>
                <div className="font-heading text-base font-light text-primary uppercase tracking-wide mb-2">
                  {item.label}
                </div>
                <p className="text-sm text-primary leading-[1.25] font-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 border-b border-muted/15">
        <SectionHeading label="Values" title={<>OUR CORE <span className="text-accent">PRINCIPLES</span></>} theme="on-white" />
        <div className="grid grid-cols-1 md:grid-cols-3 border border-muted/15">
          {values.map((v, i) => (
            <div
              key={i}
              className="group relative p-8 border-b md:border-b-0 md:border-r border-muted/15 last:border-0 hover:bg-muted/[0.03] transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <div>{v.icon}</div>
                <span className="font-heading font-light text-xs tracking-widest text-primary/40">{v.num}</span>
              </div>
              <div className="relative inline-block mb-3">
                <h3 className="font-heading text-2xl font-light text-accent uppercase">{v.title}</h3>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-accent transition-all duration-300 group-hover:w-full" />
              </div>
              <p className="text-sm text-primary leading-[1.25] font-normal">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Locations */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <SectionHeading label="Locations" title={<>OUR <span className="text-accent">FACILITIES</span></>} theme="on-white" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-muted/15">
          {locations.map((loc, i) => (
            <div key={i} className="p-8 border-b md:border-b-0 md:border-r border-muted/15 last:border-0">
              <MapPin className="w-5 h-5 text-accent mb-3" />
              <h3 className="font-heading text-xl font-light mb-1 text-accent uppercase">{loc.city}</h3>
              <p className="text-sm text-primary mb-4 font-normal leading-[1.25]">{loc.address}</p>
              <div className="flex items-center gap-2 text-sm text-primary mb-2 font-normal leading-[1.25]"><Phone className="w-3.5 h-3.5 text-accent" /> {loc.phone}</div>
              <div className="flex items-center gap-2 text-sm text-primary font-normal leading-[1.25]"><Mail className="w-3.5 h-3.5 text-accent" /> {loc.email}</div>
            </div>
          ))}
        </div>

        {/* Brand closing logo */}
        <div className="mt-16 flex flex-col items-center gap-4 py-10 border-t border-muted/15">
          <img src={finalLogo} alt="Indus Heaters" className="h-14 w-auto object-contain opacity-90" />
          <p className="text-xs font-heading font-light uppercase tracking-[0.3em] text-primary/60">Built For Heat. Built To Last.</p>
        </div>
      </section>
    </div>
  );
}
