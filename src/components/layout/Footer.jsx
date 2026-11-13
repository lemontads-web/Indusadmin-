import { Link } from 'react-router-dom';
import { MapPin, Mail } from 'lucide-react';
import productsData from '../../data/products.json';
import allCategories from '../../data/categories';
import finalLogo from '../../assets/Final logo.png';

const footerCategories = allCategories.filter((c) => productsData.some((p) => p.category === c.slug));

const Footer = () => {
  return (
    <footer className="bg-white text-primary border-t-4 border-accent font-heading font-light">

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-16 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-muted/15">

        {/* Brand */}
        <div>
          <div className="mb-5">
            <img src={finalLogo} alt="Indus Heaters" className="h-12 w-auto object-contain" />
          </div>
          <p className="text-primary text-sm leading-[1.25] mb-5 font-normal">
            India's leading industrial heater manufacturer since 2002. Precision engineering for plastic, polymer and rubber industries.
          </p>
          <div className="text-xs text-accent uppercase tracking-[0.25em] font-heading font-light">
            BUILT FOR HEAT. BUILT TO LAST.
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-heading text-sm font-light uppercase tracking-widest text-accent mb-5 pb-3 border-b border-muted/15">Quick Links</h4>
          <div className="flex flex-col gap-3">
            {[['/', 'Home'], ['/products', 'All Products'], ['/about', 'About Us'], ['/contact', 'Contact'], ['/enquiry', 'Send Enquiry']].map(([path, label]) => (
              <Link key={path} to={path} className="text-sm text-primary hover:text-accent hover:translate-x-1 transition-all inline-block font-normal">
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="font-heading text-sm font-light uppercase tracking-widest text-accent mb-5 pb-3 border-b border-muted/15">Product Range</h4>
          <div className="flex flex-col gap-3">
            {footerCategories.map(cat => (
              <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="text-sm text-primary hover:text-accent hover:translate-x-1 transition-all inline-block font-normal">
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <h4 className="font-heading text-sm font-light uppercase tracking-widest text-accent mb-5 pb-3 border-b border-muted/15">Locations</h4>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 text-sm text-primary font-normal">
              <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div>
                <div className="text-accent font-light text-[11px] uppercase tracking-[0.2em] mb-0.5 font-heading">HQ — CHENNAI</div>
                <div className="font-heading text-[11px] text-primary">Tamil Nadu, India</div>
              </div>
            </div>
            <div className="flex gap-3 text-sm text-primary font-normal">
              <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div>
                <div className="text-accent font-light text-[11px] uppercase tracking-[0.2em] mb-0.5 font-heading">PLANT — MUTLUR</div>
                <div className="font-heading text-[11px] text-primary">Tamil Nadu, India</div>
              </div>
            </div>
            <div className="flex gap-3 text-sm text-primary font-normal">
              <Mail className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <span>info@indusheaters.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs text-primary/70">© {new Date().getFullYear()} Indus Heaters. All rights reserved.</p>
        <div className="flex gap-6 text-xs text-primary/70">
          <Link to="#" className="hover:text-accent transition-colors">Privacy Policy</Link>
          <Link to="#" className="hover:text-accent transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
