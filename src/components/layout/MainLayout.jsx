import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppFloat from '../WhatsAppFloat';
import AnnouncementStrip from '../AnnouncementStrip';
import { STRIP_HEIGHT, useTopStrip } from '../../hooks/useTopStrip';
import { useCatalogue } from '../../data/catalogueContext';

const MainLayout = ({ children }) => {
  const { banners } = useCatalogue();
  const { banner, dismiss } = useTopStrip(banners);

  return (
    <div className="flex flex-col min-h-screen bg-white" style={{ '--strip': `${banner ? STRIP_HEIGHT : 0}px` }}>
      <Navbar strip={banner ? <AnnouncementStrip banner={banner} onDismiss={dismiss} /> : null} />
      <main className="flex-grow pt-[calc(75px+var(--strip))] md:pt-[calc(83px+var(--strip))]">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default MainLayout;
