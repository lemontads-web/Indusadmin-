import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { ClipboardList, Menu, X, ChevronDown } from 'lucide-react';
import productsData from '../../data/products.json';
import finalLogo from '../../assets/Final logo.png';

const categories = [...new Set(productsData.map((product) => product.categoryLabel))];
const categoryToSlug = (category) => category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const location = useLocation();
  const totalCount = useCartStore((state) => state.getTotalCount());

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-muted/15">
      {/* Top accent line */}
      <div className="h-[3px] bg-accent w-full" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-[72px] md:h-20 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center min-w-0 group py-1" onClick={() => setMobileOpen(false)}>
          <img
            src={finalLogo}
            alt="Indus Heaters – Built For Heat, Built To Last"
            className="h-9 sm:h-11 md:h-14 w-auto object-contain max-w-[180px] sm:max-w-[240px]"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-0">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-5 h-16 flex items-center font-heading text-sm font-light tracking-widest uppercase border-b-[3px] transition-colors ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-primary hover:text-accent'
              }`
            }
          >
            Home
          </NavLink>

          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className={`px-5 h-16 flex items-center gap-1 font-heading text-sm font-light tracking-widest uppercase border-b-[3px] transition-colors ${
              productsOpen || location.pathname.startsWith('/products') ? 'border-accent text-accent' : 'border-transparent text-primary hover:text-accent'
            }`}>
              Products <ChevronDown className={`w-3 h-3 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
            </button>

            {productsOpen && (
              <div className="absolute top-full left-0 w-64 bg-white border border-muted/15 border-t-2 border-t-accent shadow-md z-50">
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    to={`/products?category=${categoryToSlug(cat)}`}
                    onClick={() => setProductsOpen(false)}
                    className="block px-5 py-3 text-sm text-primary hover:bg-muted/5 hover:text-accent border-b border-muted/15 last:border-0 font-body transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
                <Link to="/products" className="block px-5 py-3 text-sm font-light text-accent bg-accent/5 hover:bg-accent hover:text-white transition-colors uppercase tracking-wider font-heading">
                  View All Products →
                </Link>
              </div>
            )}
          </div>

          {[['/about', 'About'], ['/contact', 'Contact']].map(([path, label]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `px-5 h-16 flex items-center font-heading text-sm font-light tracking-widest uppercase border-b-[3px] transition-colors ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-primary hover:text-accent'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <Link
            to="/enquiry"
            className="relative flex items-center gap-2 bg-accent text-white px-4 h-9 font-heading text-sm font-light tracking-widest uppercase hover:bg-accent/90 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Enquiry</span>
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-light w-5 h-5 flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </Link>

          <button
            className="md:hidden p-2 text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-muted/15 bg-white">
          {[['/', 'Home'], ['/products', 'Products'], ['/about', 'About'], ['/contact', 'Contact']].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className="block px-6 py-4 font-heading text-sm font-light uppercase tracking-widest text-primary border-b border-muted/15 hover:text-accent hover:pl-8 transition-all"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
