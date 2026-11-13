import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppFloat from '../WhatsAppFloat';

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow pt-[75px] md:pt-[83px]">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default MainLayout;
