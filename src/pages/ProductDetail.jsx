import { useParams, Link, Navigate } from 'react-router-dom';
import { getCategory } from '../data/categories';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import productsData from '../data/products.json';
import { useCartStore } from '../store/useCartStore';
import { ClipboardList, Check, Zap, Shield, ChevronRight, Plus, Minus, UploadCloud, Paperclip } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { whatsappLink, productEnquiryMessage } from '../utils/whatsapp';


export default function ProductDetail() {
  const { productSlug, categorySlug } = useParams();
  const product = productsData.find(p => p.slug === productSlug);
  const addItem = useCartStore(state => state.addItem);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [measurements, setMeasurements] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [note, setNote] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [shownSlug, setShownSlug] = useState(productSlug);
  if (shownSlug !== productSlug) {
    setShownSlug(productSlug);
    setActiveImage(0);
  }
  const measurementLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Page title + meta tags so search engines and browser tabs show the product name and common keywords
  useEffect(() => {
    if (!product) return undefined;
    const previousTitle = document.title;
    document.title = `${product.name} | ${product.categoryLabel} | Indus Heaters`;
    const setMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      const previous = tag.getAttribute('content');
      tag.setAttribute('content', content);
      return () => (previous === null ? tag.remove() : tag.setAttribute('content', previous));
    };
    const restoreDescription = setMeta('description', `${product.name} by Indus Heaters, Chennai. ${product.shortDescription}`);
    const restoreKeywords = setMeta('keywords', [product.name, product.categoryLabel, ...(product.keywords || [])].join(', '));
    return () => {
      document.title = previousTitle;
      restoreDescription();
      restoreKeywords();
    };
  }, [product]);

  if (!product && getCategory(categorySlug)) {
    // Old product address (e.g. before products were split) → show its category instead
    return <Navigate to={`/products?category=${categorySlug}`} replace />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-primary font-heading font-light">
        <div className="font-heading text-xs font-light text-primary mb-4 uppercase tracking-[0.3em]">Resource Not Found</div>
        <h1 className="font-heading text-4xl font-light mb-8 text-accent uppercase">Product Not Found</h1>
        <Link to="/products" className="bg-accent text-white px-8 py-3 font-heading font-light text-sm uppercase tracking-widest hover:bg-accent/90 transition-all">
          ← Return to Catalogue
        </Link>
      </div>
    );
  }

  const handleMeasurementChange = (key, value) => {
    setMeasurements((current) => ({ ...current, [key]: value }));
  };

  const handleFileChange = (fileList) => {
    const nextFiles = Array.from(fileList || [])
      .filter((file) => file.type.startsWith('image/') || file.type === 'application/pdf')
      .slice(0, 5)
      .map((file) => ({ name: file.name, type: file.type, size: file.size }));

    setAttachments(nextFiles);
  };

  const handleAdd = () => {
    addItem(product, { quantity, measurements, attachments, note });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const related = (product.relatedProducts || [])
    .map((slug) => productsData.find((p) => p.slug === slug))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="bg-white text-primary font-heading font-light">

      {/* ── BREADCRUMB SYSTEM ─────────────────── */}
      <div className="border-b border-muted/15 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-4 flex items-center gap-3 text-[10px] font-heading font-light uppercase tracking-widest text-primary">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 opacity-40" />
          <Link to="/products" className="hover:text-accent transition-colors">Catalogue</Link>
          <ChevronRight className="w-3 h-3 opacity-40" />
          <Link to={`/products?category=${product.category}`} className="hover:text-accent transition-colors">{product.categoryLabel}</Link>
          <ChevronRight className="w-3 h-3 opacity-40" />
          <span className="text-accent">{product.name}</span>
        </div>
      </div>

      {/* ── MAIN SYSTEM VIEW ──────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col border-b border-muted/15">

          {/* TOP: Image Panel */}
          <div className="w-full bg-white flex items-center justify-center p-6 sm:p-10 relative overflow-hidden border-b border-muted/15 group min-h-[320px] sm:min-h-[420px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-muted/15" />

            <motion.img
              key={product.images[activeImage] || product.images[0]}
              src={product.images[activeImage] || product.images[0]}
              alt={product.name}
              className="w-full max-h-[70vh] object-contain relative z-10 drop-shadow-md"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
            
            <div className="absolute bottom-4 right-6 font-heading text-[9px] text-primary uppercase tracking-[0.3em] font-light">
               {product.images.length > 1 ? `${activeImage + 1} / ${product.images.length}` : 'Indus Heaters'}
            </div>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-4 border-b border-muted/15" role="list" aria-label={`${product.name} photos`}>
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Show photo ${i + 1} of ${product.name}`}
                  aria-current={i === activeImage}
                  className={`shrink-0 w-20 h-16 sm:w-24 sm:h-20 bg-white border p-1.5 transition-colors ${
                    i === activeImage ? 'border-accent' : 'border-muted/15 hover:border-accent/30'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* BELOW: Product Details, Specifications and Enquiry Form */}
          <div className="py-10 px-4 sm:px-6 lg:px-8 bg-white relative">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 pb-6 border-b border-muted/15">
              <div>
                <SectionHeading
                  label={product.categoryLabel}
                  title={product.name}
                  theme="on-white"
                  className="mb-0"
                />
              </div>
              <div className="font-heading text-[10px] font-light text-primary uppercase tracking-widest px-3 py-1.5 border border-muted/15 shrink-0 self-start">
                 Unit ID: 1024-0{product.id}
              </div>
            </div>

            <p className="text-primary leading-[1.25] mb-10 text-base border-l-2 border-muted/15 pl-6 font-normal max-w-4xl">
              {product.fullDescription}
            </p>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
              
              {/* Column 1: Specifications & CTAs */}
              <div className="flex flex-col">
                <div className="mb-8 flex-grow">
                  <div className="text-[10px] tracking-[0.25em] font-heading font-light uppercase text-primary mb-3 flex items-center gap-4">
                     <span className="shrink-0">Datasheet v0.8</span>
                     <div className="w-full h-[1px] bg-muted/15" />
                  </div>
                  
                  <div className="border border-muted/15 overflow-hidden">
                    <table className="w-full text-sm border-collapse font-heading font-light">
                      <thead>
                        <tr className="bg-accent text-white text-[10px] font-light uppercase tracking-widest">
                           <th className="py-3 px-6 text-left border-r border-white/20 font-light">Parameter</th>
                           <th className="py-3 px-6 text-left font-light text-white">Specification Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-muted/5">
                        {product.specs.map((spec, i) => (
                          <tr key={i} className="border-b border-muted/15 last:border-0 hover:bg-muted/10 group transition-colors">
                            <td className="py-3.5 px-6 font-light text-primary w-2/5 border-r border-muted/15 uppercase text-xs tracking-tight">
                              {spec.label}
                            </td>
                            <td className="py-3.5 px-6 text-primary font-light text-sm tracking-tight">
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-0 border border-muted/15 shadow-sm mt-auto">
                  <button
                    onClick={handleAdd}
                    className={`flex-[2] flex items-center justify-center gap-3 py-5 font-heading font-light text-base uppercase tracking-[0.2em] transition-all relative group/add ${
                      added
                        ? 'bg-accent text-white'
                        : 'bg-accent text-white hover:bg-accent/90'
                    }`}
                  >
                    {added ? <><Check className="w-5 h-5" /> Added to Enquiry</> : <><ClipboardList className="w-5 h-5 group-hover/add:rotate-12 transition-transform" /> Add to Enquiry</>}
                  </button>
                  <a
                    href={whatsappLink(productEnquiryMessage({ product, quantity, measurements, note, url: window.location.href }))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-5 px-6 bg-white sm:border-l border-t sm:border-t-0 border-muted/15 text-primary font-heading font-light text-sm uppercase tracking-[0.2em] hover:bg-muted/10 hover:text-accent transition-all"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-accent" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Column 2: Custom Order & Form Details */}
              <div>
                <div className="border border-muted/15 bg-white">
                  <div className="px-6 py-3.5 bg-muted/5 border-b border-muted/15 font-heading text-[10px] font-light uppercase tracking-[0.25em] text-primary">
                    Custom Order Details
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="font-heading text-[9px] text-primary uppercase tracking-[0.25em] mb-2 font-light">Quantity</div>
                      <div className="flex items-center border border-muted/15 w-fit bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                          className="w-10 h-10 flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-all"
                          aria-label="Decrease product quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                          className="w-16 h-10 text-center text-base font-heading font-light bg-muted/5 border-x border-muted/15 focus:outline-none focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity((current) => current + 1)}
                          className="w-10 h-10 flex items-center justify-center text-primary hover:bg-accent hover:text-white transition-all"
                          aria-label="Increase product quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border border-muted/15">
                      <div className="px-4 py-2.5 bg-muted/5 border-b border-muted/15 font-heading text-[9px] font-light uppercase tracking-[0.25em] text-primary">Custom Measurements</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-muted/15">
                        {(product.specs?.length ? product.specs : [{ label: 'Measurement' }]).map((spec, index) => {
                          const label = measurementLabels[index] || 'M' + (index + 1);
                          return (
                            <label key={label} className="bg-white px-4 py-3 flex items-center gap-3">
                              <span className="w-8 h-8 shrink-0 bg-accent text-white flex items-center justify-center font-heading text-xs font-light">{label}</span>
                              <input
                                type="text"
                                value={measurements[label] || ''}
                                onChange={(event) => handleMeasurementChange(label, event.target.value)}
                                placeholder={spec.label ? spec.label.toUpperCase() : 'Custom Size'}
                                className="min-w-0 flex-1 border-b-2 border-muted/15 px-0 py-1.5 text-xs font-heading font-light text-primary placeholder:text-primary/50 focus:border-accent focus:outline-none bg-transparent transition-all"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <label className="block">
                      <div className="font-heading text-[9px] text-primary uppercase tracking-[0.25em] mb-2 font-light">Custom Details</div>
                      <input
                        type="text"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Add note..."
                        className="w-full text-xs font-heading border border-muted/15 px-4 py-3 text-primary placeholder:text-primary/50 focus:border-accent focus:outline-none bg-muted/5 font-light"
                      />
                    </label>

                    <div className="border border-dashed border-muted/15 bg-muted/5 p-4">
                      <label className="flex items-center justify-center gap-3 text-[10px] font-heading font-light uppercase tracking-[0.25em] text-primary cursor-pointer hover:text-accent">
                        <UploadCloud className="w-5 h-5 text-accent" />
                        Attach Sample Image or PDF
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,application/pdf"
                          className="sr-only"
                          onChange={(event) => handleFileChange(event.target.files)}
                        />
                      </label>
                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {attachments.map((file, fileIndex) => (
                            <div key={file.name + fileIndex} className="flex items-center gap-2 text-[10px] font-heading font-light text-primary/70 truncate">
                              <Paperclip className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── TECHNICAL DEEP DIVE ───────────────── */}
        {(product.features.length > 0 || product.applications.length > 0) && (
        <div className={`grid grid-cols-1 ${product.features.length > 0 && product.applications.length > 0 ? 'md:grid-cols-2' : ''} border-b border-muted/15`}>
          {/* Features */}
          {product.features.length > 0 && (
          <div className="py-16 px-8 lg:px-12 border-r border-muted/15 bg-muted/5 group">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-6 h-6 text-accent" />
              <h2 className="font-heading text-2xl font-light uppercase tracking-tight text-accent">System Advantages</h2>
            </div>
            <div className="space-y-4">
              {product.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4 text-sm text-primary font-normal leading-[1.25]">
                  <div className="w-5 h-5 bg-accent flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="leading-[1.25] border-b border-transparent group-hover:border-muted/15 transition-all">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Applications */}
          {product.applications.length > 0 && (
          <div className="py-16 px-8 lg:px-12">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-6 h-6 text-accent" />
              <h2 className="font-heading text-2xl font-light uppercase tracking-tight text-accent">Active Sectors</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {product.applications.map((app, i) => (
                <span
                  key={i}
                  className="px-5 py-3.5 border-l-2 border-accent text-[10px] font-heading font-light uppercase tracking-widest text-primary bg-muted/5 hover:bg-accent hover:text-white transition-all cursor-default"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>
          )}
        </div>
        )}

        {/* ── RELATED MODULES ───────────────────── */}
        {related.length > 0 && (
          <div className="py-16">
            <SectionHeading title={<>RELATED <span className="text-accent">PRODUCTS</span></>} theme="on-white" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-muted/15">
              {related.map((rel, i) => (
                <Link
                  key={i}
                  to={`/products/${rel.category}/${rel.slug}`}
                  className="group border-r border-muted/15 last:border-0 p-8 hover:bg-muted/5 hover:border-accent/30 transition-all flex flex-col items-center text-center"
                >
                  <img src={rel.images[0]} alt={rel.name} className="w-24 h-24 object-contain mb-6 group-hover:scale-105 transition-transform duration-300" />
                  <div className="text-[9px] text-accent font-heading font-light uppercase tracking-[0.3em] mb-2">{rel.categoryLabel}</div>
                  <div className="font-heading text-lg font-light text-primary group-hover:text-accent transition-colors">{rel.name}</div>
                  <div className="mt-3 opacity-0 group-hover:opacity-100 font-heading text-[9px] text-accent tracking-widest transition-opacity uppercase font-light">View Specs →</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
