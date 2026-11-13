import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from './components/layout/MainLayout';
import ScrollToTop from './components/ScrollToTop';
import CatalogueProvider from './data/CatalogueProvider';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Enquiry = lazy(() => import('./pages/Enquiry'));
const EnquirySuccess = lazy(() => import('./pages/EnquirySuccess'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
// Admin panel: separate download, only fetched when someone opens /admin
const AdminApp = lazy(() => import('./admin/AdminApp'));

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex gap-2">
      {[0,1,2].map(i => (
        <div key={i} className="w-2 h-2 bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  </div>
);

function App() {
  return (
    <CatalogueProvider>
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={<Loader />}><AdminApp /></Suspense>} />
        <Route path="*" element={
      <MainLayout>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:categorySlug/:productSlug" element={<ProductDetail />} />
            <Route path="/enquiry" element={<Enquiry />} />
            <Route path="/enquiry/success" element={<EnquirySuccess />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={
              <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white text-primary">
                <div className="font-heading text-8xl font-bold text-muted/30 mb-4">404</div>
                <h1 className="font-heading text-3xl font-bold mb-6">Page Not Found</h1>
                <a href="/" className="bg-accent text-white px-8 py-3 font-heading font-bold text-sm uppercase tracking-widest hover:bg-primary transition-colors">Return Home</a>
              </div>
            } />
          </Routes>
        </Suspense>
      </MainLayout>
        } />
      </Routes>
    </Router>
    </CatalogueProvider>
  );
}

export default App;
