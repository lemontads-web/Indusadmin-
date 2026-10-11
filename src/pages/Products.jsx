import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import productsData from '../data/products.json';
import { Filter, X, Grid, Search, Activity } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';

const ALL_CATEGORIES = [...new Set(productsData.map(p => p.categoryLabel))];
const categoryToSlug = (category) => category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const activeCategory = useMemo(() => {
    const categorySlug = searchParams.get('category');
    return ALL_CATEGORIES.find((category) => categoryToSlug(category) === categorySlug) || '';
  }, [searchParams]);

  const setActiveCategory = (category) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category) {
      nextParams.set('category', categoryToSlug(category));
    } else {
      nextParams.delete('category');
    }
    setSearchParams(nextParams);
  };

  const filtered = productsData
    .filter(p => activeCategory === '' || p.categoryLabel === activeCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-white text-primary font-heading font-light">

      {/* ── CATALOGUE HEADER ──────────────────── */}
      <div className="border-b border-muted/15 bg-white relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="structural-line-left pl-4">
            <SectionHeading
              label="System Catalogue v2.0"
              title={<>PRODUCT<br /><span className="text-accent">INVENTORY</span></>}
              subtitle="Access 500+ precision heating configurations. Use the sidebar module to filter by category or technical specification."
              theme="on-white"
              className="mb-0"
            />
          </div>

          {/* Search Module */}
          <div className="w-full md:w-80 group">
             <div className="text-primary font-heading text-[10px] uppercase tracking-[0.2em] mb-2 font-light group-focus-within:text-accent transition-colors">Search Catalogue</div>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 group-focus-within:text-accent" />
                <input 
                  type="text" 
                  placeholder="ID / NAME / SPEC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-muted/15 pl-10 pr-4 py-3 text-xs font-heading font-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all uppercase tracking-widest placeholder:text-primary/50"
                  style={{ borderRadius: 0 }}
                />
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10 flex flex-col lg:flex-row gap-0">

        {/* ── SIDEBAR CONTROL MODULE ───────────── */}
        <aside className="lg:w-64 shrink-0 lg:border-r border-muted/15 lg:pr-10 lg:mr-10">
          <div className="flex items-center justify-between mb-6 border-b border-muted/15 pb-4">
            <div className="flex items-center gap-3 font-heading text-[11px] font-light uppercase tracking-[0.2em] text-primary">
              <Filter className="w-3.5 h-3.5 text-accent" /> Filter Products
            </div>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory('')}
                className="text-[10px] text-accent font-heading font-light uppercase tracking-wider flex items-center gap-1 hover:underline transition-all"
              >
                <X className="w-2.5 h-2.5" /> RESET
              </button>
            )}
          </div>

          <div className="hidden lg:block sticky top-24">
            <div className="space-y-1">
              <button
                onClick={() => setActiveCategory('')}
                className={`w-full text-left px-4 py-3 text-xs font-heading font-light transition-all border-l-4 group flex justify-between items-center ${
                  activeCategory === ''
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-transparent text-primary hover:text-accent hover:bg-muted/5'
                }`}
              >
                <span>All Products</span>
                <span className={`text-[10px] opacity-60 group-hover:opacity-100 ${activeCategory === '' ? 'opacity-100 font-light' : ''}`}>{productsData.length}</span>
              </button>
              {ALL_CATEGORIES.map(cat => {
                const count = productsData.filter(p => p.categoryLabel === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-4 py-3 text-xs font-heading font-light transition-all border-l-4 group flex justify-between items-center uppercase tracking-wider ${
                      activeCategory === cat
                        ? 'border-accent text-accent bg-accent/5'
                        : 'border-transparent text-primary hover:text-accent hover:bg-muted/5'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className={`text-[10px] opacity-60 group-hover:opacity-100 ${activeCategory === cat ? 'opacity-100 font-light' : ''}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Technical Help Box */}
            <div className="mt-10 p-6 bg-white border-l-4 border-accent border border-muted/15">
               <div className="font-heading text-[10px] font-light uppercase tracking-[0.25em] mb-2 text-accent">System Note</div>
               <p className="font-heading text-xs leading-[1.25] text-primary font-light">
                 All products are available with custom J/K type thermocouples and SS316 sheath configurations.
               </p>
            </div>
          </div>

          {/* Mobile filter chips */}
          <div className="lg:hidden flex gap-0 flex-wrap mb-8 border border-muted/15">
            <button
              onClick={() => setActiveCategory('')}
              className={`flex-1 min-w-[33%] px-4 py-3 text-[10px] font-heading font-light uppercase tracking-widest border-r border-b border-muted/15 transition-all ${
                activeCategory === '' ? 'bg-accent text-white font-light border-accent' : 'bg-white text-primary hover:text-accent'
              }`}
            >
              ALL
            </button>
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 min-w-[33%] px-4 py-3 text-[10px] font-heading font-light uppercase tracking-widest border-r border-b border-muted/15 transition-all truncate ${
                  activeCategory === cat ? 'bg-accent text-white font-light border-accent' : 'bg-white text-primary hover:text-accent'
                }`}
              >
                {cat.split(' ')[0]}
              </button>
            ))}
          </div>
        </aside>

        {/* ── PRODUCT GRID ──────────────────── */}
        <main className="flex-1">
          {/* Metadata Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted/15">
            <div className="font-heading text-[10px] font-light text-primary uppercase tracking-[0.2em] flex items-center gap-3">
              <Activity className="w-3.5 h-3.5 text-accent" />
              Loaded: <span className="text-accent font-light">{filtered.length} SKUs Found</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex items-center gap-2 font-heading text-[10px] uppercase tracking-widest text-primary font-light">
                  View Mode: <Grid className="w-3.5 h-3.5 text-accent" />
               </div>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-24 border border-dashed border-muted/15 bg-white"
              >
                <div className="font-heading text-xs font-light text-primary uppercase tracking-[0.3em]">No Products Found</div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-0 border border-muted/15 bg-white">
                {filtered.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layoutProps={{ duration: 0.4 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group border border-muted/15 hover:border-accent/30 bg-white relative flex flex-col h-full overflow-hidden transition-colors"
                  >
                    <Link to={`/products/${product.category}/${product.slug}`} className="block relative flex-grow">
                      {/* Image Module */}
                      <div className="aspect-[4/3] w-full bg-white flex items-center justify-center overflow-hidden border-b border-muted/15 p-6 relative">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Info Module */}
                      <div className="p-5 bg-white">
                        <div className="text-[10px] font-heading font-light uppercase tracking-[0.2em] text-accent mb-1">
                          {product.categoryLabel}
                        </div>
                        <h3 className="font-heading text-lg font-light text-primary tracking-tight group-hover:text-accent transition-colors">
                          {product.name}
                        </h3>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
