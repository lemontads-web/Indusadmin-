import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Send, Paperclip, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import SectionHeading from '../components/SectionHeading';

const RECIPIENT_EMAIL = 'shashank1341@gmail.com';
const BASIN_ENDPOINT = 'https://usebasin.com/f/7ada9d583ec3';

const formatOrderDetails = (items) => {
  return items.map((item, index) => {
    const measurements = Object.entries(item.measurements || {})
      .filter(([, value]) => value)
      .map(([label, value]) => `    ${label}: ${value}`)
      .join('\n');

    const attachments = (item.attachments || [])
      .map((file) => `    ${file.name}`)
      .join('\n');

    return [
      `${index + 1}. ${item.name}`,
      `   Category: ${item.category}`,
      `   Quantity: ${item.quantity}`,
      item.note ? `   Note: ${item.note}` : '',
      measurements ? `   Measurements:\n${measurements}` : '',
      attachments ? `   Attached files:\n${attachments}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');
};

export default function Enquiry() {
  const { items, removeItem, clearCart, getTotalCount } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);

    const buyerName = formData.get('buyerName');
    const companyName = formData.get('companyName');
    const orderDetails = formatOrderDetails(items);

    formData.set('form_name', 'Indus Heaters Enquiry');
    formData.set('recipient_email', RECIPIENT_EMAIL);
    formData.set('order_details', orderDetails);
    formData.set('cart_item_count', String(getTotalCount()));
    formData.set('subject', `Indus Heaters Enquiry - ${companyName || buyerName}`);

    const attachmentFiles = formData.getAll('attachments').filter((file) => file instanceof File && file.size > 0);
    formData.delete('attachments');
    attachmentFiles.forEach((file) => formData.append('attachments[]', file));

    setLoading(true);

    fetch(BASIN_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('The enquiry could not be sent. Please try again.');
        }
        clearCart();
        navigate('/enquiry/success');
      })
      .catch((submitError) => {
        setError(submitError.message || 'The enquiry could not be sent. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="bg-white text-primary font-heading font-light">
      <div className="bg-white border-b border-muted/15">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12">
          <div className="structural-line-left pl-4">
            <SectionHeading
              label="Order Overview"
              title={<>SEND <span className="text-accent">ENQUIRY</span></>}
              subtitle="Share your buyer details and delivery address. Your selected cart items will be included in the enquiry email."
              theme="on-white"
              className="mb-0"
            />
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-24 flex flex-col items-center justify-center text-center border-b border-muted/15 bg-white">
          <div className="w-20 h-20 bg-muted/10 flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-heading text-3xl font-light mb-3 uppercase tracking-tight text-accent">Your cart is empty</h2>
          <p className="text-primary mb-8 text-sm font-normal leading-[1.25]">Add products to your enquiry before sending.</p>
          <Link to="/products" className="bg-accent text-white px-8 py-4 font-heading font-light text-sm uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center gap-3">
            Browse Products <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-muted/15 shadow-sm">
            <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-muted/15 bg-white">
              <div className="flex items-center justify-between px-8 py-5 bg-accent text-white border-b-2 border-accent">
                <span className="font-heading text-base font-light uppercase tracking-widest text-white">Order Summary</span>
                <span className="text-sm font-light text-white/90">{getTotalCount()} item{getTotalCount() === 1 ? '' : 's'}</span>
              </div>

              <div className="divide-y divide-muted/15">
                {items.map((item) => (
                  <div key={item.id} className="p-6 sm:p-8 flex flex-col gap-4 group hover:bg-muted/5 transition-all">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-white border border-muted/15 shrink-0 flex items-center justify-center p-2">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-light uppercase tracking-[0.15em] text-accent mb-1">{item.category}</div>
                        <div className="font-heading text-base font-light text-accent leading-tight mb-2">{item.name}</div>
                        <div className="inline-flex items-center border border-muted/15 bg-muted/10 px-2.5 py-1 text-xs font-light text-primary uppercase tracking-[0.12em]">
                          Quantity: {item.quantity}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} className="text-primary hover:text-accent transition-colors self-start pt-1" aria-label={'Remove ' + item.name}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {item.attachments?.length > 0 && (
                      <div className="border border-muted/15 bg-muted/5 p-3">
                        <div className="text-[10px] text-primary uppercase tracking-[0.2em] mb-1 font-light">Attached files</div>
                        <div className="space-y-1">
                          {item.attachments.map((file, index) => (
                            <div key={file.name + index} className="flex items-center gap-2 text-xs font-light text-primary/70 truncate">
                              <Paperclip className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-muted/15 bg-muted/5">
                <button onClick={clearCart} className="w-full text-center text-xs font-light uppercase tracking-widest text-accent hover:underline transition-colors mb-4">
                  Clear Cart
                </button>
                <Link to="/products" className="block text-center text-xs font-light uppercase tracking-[0.2em] text-primary border border-muted/30 py-3 hover:bg-muted hover:text-white transition-all">
                  Add More Products
                </Link>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              action={BASIN_ENDPOINT}
              method="POST"
              encType="multipart/form-data"
              className="lg:col-span-3 flex flex-col bg-white"
            >
              <div className="px-8 sm:px-10 py-6 border-b border-muted/15 bg-muted/5">
                <h2 className="font-heading text-xl font-light uppercase tracking-wide text-accent">Buyer Details</h2>
              </div>

              <div className="px-8 sm:px-10 py-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="block text-xs font-light uppercase tracking-[0.15em] text-primary mb-2">Buyer Name *</span>
                    <input name="buyerName" required type="text" className="w-full border border-muted/15 px-4 py-3 text-sm font-heading font-light text-primary focus:border-accent focus:outline-none" />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-light uppercase tracking-[0.15em] text-primary mb-2">Company Name *</span>
                    <input name="companyName" required type="text" className="w-full border border-muted/15 px-4 py-3 text-sm font-heading font-light text-primary focus:border-accent focus:outline-none" />
                  </label>
                </div>

                <label className="block">
                  <span className="block text-xs font-light uppercase tracking-[0.15em] text-primary mb-2">Contact Number *</span>
                  <input name="contactNumber" required type="tel" className="w-full border border-muted/15 px-4 py-3 text-sm font-heading font-light text-primary focus:border-accent focus:outline-none" />
                </label>

                <label className="block">
                  <span className="block text-xs font-light uppercase tracking-[0.15em] text-primary mb-2">Delivery Address *</span>
                  <textarea name="deliveryAddress" required rows={5} className="w-full border border-muted/15 px-4 py-3 text-sm font-heading font-light text-primary focus:border-accent focus:outline-none resize-y" />
                </label>

                <label className="block">
                  <span className="block text-xs font-light uppercase tracking-[0.15em] text-primary mb-2">Attach Files</span>
                  <input
                    name="attachments"
                    type="file"
                    multiple
                    className="w-full border border-dashed border-muted/15 bg-muted/5 px-4 py-4 text-sm font-heading font-light text-primary/70 file:mr-4 file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-light file:uppercase file:tracking-wider file:text-white hover:file:bg-accent/90 file:transition-colors"
                  />
                  <p className="mt-2 text-xs text-primary font-normal leading-[1.25]">
                    Upload drawings, sample images, or PDFs related to this enquiry.
                  </p>
                </label>

                {error && (
                  <div className="border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-light text-accent">
                    {error}
                  </div>
                )}
              </div>

              <div className="px-8 sm:px-10 py-6 mt-auto bg-muted/5 border-t border-muted/15">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent text-white py-4 font-heading font-light text-base uppercase tracking-[0.2em] hover:bg-accent/90 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                >
                  {loading ? 'Preparing Email...' : 'Send Enquiry'}
                  {!loading && <Send className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
