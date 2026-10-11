import { useState } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import finalLogo from '../assets/Final logo.png';

const locations = [
  { city: 'Chennai — Headquarters', address: '123 Industrial Estate, Ambattur, Chennai 600058, Tamil Nadu', phone: '+91 44 0000 0000', email: 'info@indusheaters.com' },
  { city: 'Mutlur — Manufacturing Plant', address: 'Mutlur Industrial Zone, Chidambaram, Tamil Nadu 608301', phone: '+91 44 0000 0001', email: 'plant@indusheaters.com' },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  };

  return (
    <div className="bg-white text-primary font-heading font-light">

      {/* Page Header */}
      <div className="bg-white border-b border-muted/15">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12">
          <SectionHeading
            label="Get In Touch"
            title={<>CONTACT <span className="text-accent">US</span></>}
            subtitle="Reach out with product questions, custom requirements, or general enquiries. Our team responds within 24 business hours."
            theme="on-white"
            className="mb-0"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-muted/15">

          {/* ── CONTACT FORM (3/5) ── */}
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-muted/15">
            <div className="px-8 py-5 border-b border-muted/15 bg-muted/5">
              <h2 className="font-heading text-xl font-light uppercase tracking-wide text-accent">Send a Message</h2>
            </div>

            {submitted ? (
              <div className="px-8 py-16 text-center">
                <div className="w-12 h-12 bg-accent text-white flex items-center justify-center mx-auto mb-5 font-light">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="font-heading text-2xl font-light mb-2 text-accent uppercase">Message Sent</h3>
                <p className="text-primary text-sm font-normal leading-[1.25]">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ label: 'Full Name', type: 'text' }, { label: 'Company', type: 'text' }].map(f => (
                    <div key={f.label}>
                      <label className="block text-[10px] font-heading font-light uppercase tracking-[0.15em] text-primary mb-1">{f.label} *</label>
                      <input required type={f.type} className="w-full border border-muted/15 px-3 py-2.5 text-sm font-heading font-light focus:border-accent focus:outline-none transition-colors text-primary" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ label: 'Email', type: 'email' }, { label: 'Phone', type: 'tel' }].map(f => (
                    <div key={f.label}>
                      <label className="block text-[10px] font-heading font-light uppercase tracking-[0.15em] text-primary mb-1">{f.label} *</label>
                      <input required type={f.type} className="w-full border border-muted/15 px-3 py-2.5 text-sm font-heading font-light focus:border-accent focus:outline-none transition-colors text-primary" />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-heading font-light uppercase tracking-[0.15em] text-primary mb-1">Message *</label>
                  <textarea required rows={5} className="w-full border border-muted/15 px-3 py-2.5 text-sm font-heading font-light focus:border-accent focus:outline-none transition-colors resize-y text-primary" placeholder="Describe your requirement or question..." />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-accent text-white py-4 font-heading font-light text-sm uppercase tracking-widest hover:bg-accent/90 transition-colors disabled:opacity-60">
                  {loading ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>

          {/* ── LOCATIONS (2/5) ── */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="px-8 py-5 border-b border-muted/15 bg-muted/5">
              <h2 className="font-heading text-xl font-light uppercase tracking-wide text-accent">Our Locations</h2>
            </div>

            <div className="divide-y divide-muted/15 flex-1">
              {locations.map((loc, i) => (
                <div key={i} className="p-8 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start gap-3 mb-5">
                    <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <div>
                      <div className="font-heading text-base font-light uppercase tracking-wide mb-1 text-accent">{loc.city}</div>
                      <p className="text-sm text-primary font-normal leading-[1.25]">{loc.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-primary mb-2 font-normal leading-[1.25]">
                    <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                    <a href={`tel:${loc.phone}`} className="hover:text-accent transition-colors">{loc.phone}</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-primary font-normal leading-[1.25]">
                    <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                    <a href={`mailto:${loc.email}`} className="hover:text-accent transition-colors">{loc.email}</a>
                  </div>
                </div>
              ))}
            </div>

            {/* Hours */}
            <div className="p-8 bg-muted/10 border-t border-muted/15">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-accent" />
                <span className="font-heading text-xs font-light uppercase tracking-widest text-accent">Business Hours</span>
              </div>
              <div className="text-sm text-primary space-y-1 font-normal leading-[1.25]">
                <div className="flex justify-between"><span>Monday – Friday</span><span className="font-light text-primary">9:00 – 18:00</span></div>
                <div className="flex justify-between"><span>Saturday</span><span className="font-light text-primary">9:00 – 14:00</span></div>
                <div className="flex justify-between text-primary/60"><span>Sunday</span><span>Closed</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Maps Embed */}
        <div className="mt-6 border border-muted/15 overflow-hidden h-72 bg-white flex items-center justify-center">
          <iframe
            title="Indus Heaters Chennai Location"
            src="https://maps.google.com/maps?q=Ambattur+Industrial+Estate,+Chennai&t=&z=13&ie=UTF8&iwloc=&output=embed"
            className="w-full h-full border-0"
            allowFullScreen=""
            loading="lazy"
          />
        </div>

        {/* Brand closing logo */}
        <div className="mt-12 flex flex-col items-center gap-4 py-10 border-t border-muted/15">
          <img src={finalLogo} alt="Indus Heaters" className="h-14 w-auto object-contain opacity-90" />
          <p className="text-xs font-heading font-light uppercase tracking-[0.3em] text-primary/60">Built For Heat. Built To Last.</p>
        </div>
      </div>
    </div>
  );
}
