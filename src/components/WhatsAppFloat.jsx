import { useLocation } from 'react-router-dom';
import WhatsAppIcon from './WhatsAppIcon';
import { whatsappLink } from '../utils/whatsapp';

// Small floating "chat on WhatsApp" button, bottom-right on every page.
export default function WhatsAppFloat() {
  const { pathname } = useLocation();
  const message = pathname.startsWith('/products/')
    ? `Hi Indus Heaters, I have a question about this product: ${window.location.href}`
    : 'Hi Indus Heaters, I have an enquiry.';

  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Indus Heaters on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-white text-primary border border-muted/15 shadow-md shadow-black/5 h-12 pl-3.5 pr-3.5 hover:bg-accent hover:text-white hover:border-accent transition-colors duration-200"
    >
      <WhatsAppIcon className="w-5 h-5 text-accent group-hover:text-white transition-colors" />
      <span className="hidden sm:inline font-heading font-light text-[11px] uppercase tracking-[0.2em]">WhatsApp</span>
    </a>
  );
}
