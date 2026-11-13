import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Paperclip, Download, Eye, Trash2, ExternalLink } from 'lucide-react';
import { useAdminAuth, isOwner } from '../authContext';
import { getEnquiry, updateEnquiry, attachmentLink, deleteEnquiryForever, friendlyError } from '../lib/api';
import { timeAgo, productSummary, toWhatsAppNumber } from '../lib/format';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { Button, Card, EnquiryBadge, ENQUIRY_STATUS, Field, MUTED, Notice, PageHeader, Spinner, Textarea, Toast } from '../components/ui';

const replyMessage = (e) =>
  `Hello ${e.customer_name}, thank you for your enquiry with Indus Heaters about ${productSummary(e.items) || 'our heaters'}. `;

const customerWhatsApp = (e) => {
  const message = encodeURIComponent(replyMessage(e));
  return `https://wa.me/${toWhatsAppNumber(e.phone)}?text=${message}`;
};

export default function EnquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAdminAuth();
  const owner = isOwner(role);
  const [enquiry, setEnquiry] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let alive = true;
    getEnquiry(id)
      .then((e) => { if (alive) { setEnquiry(e); setNotes(e.internal_notes || ''); } })
      .catch((e) => alive && setError(friendlyError(e)));
    return () => { alive = false; };
  }, [id]);

  if (!enquiry) return error ? <Notice type="error" title="This enquiry couldn’t be opened">{error}</Notice> : <Spinner label="Opening enquiry…" />;

  const save = async (fields, message) => {
    setBusy(true); setError('');
    try {
      const updated = await updateEnquiry(enquiry.id, fields);
      setEnquiry((e) => ({ ...e, ...updated }));
      if (message) setToast({ text: message });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const openFile = async (att, download) => {
    try {
      const url = await attachmentLink(att, { download });
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const remove = async () => {
    setBusy(true); setError('');
    try {
      await deleteEnquiryForever(enquiry);
      navigate('/admin/enquiries', { replace: true });
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  const notesChanged = notes.trim() !== (enquiry.internal_notes || '').trim();
  const received = new Date(enquiry.created_at);

  return (
    <div className="max-w-3xl">
      <Link to="/admin/enquiries" className="inline-flex items-center gap-1.5 min-h-11 text-[15px] hover:text-accent mb-2">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All enquiries
      </Link>
      <PageHeader
        title={enquiry.customer_name}
        docTitle={`Enquiry from ${enquiry.customer_name}`}
        subtitle={`${enquiry.company_name ? `${enquiry.company_name} · ` : ''}Received ${timeAgo(enquiry.created_at)} (${received.toLocaleString(undefined, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })})`}
        actions={<EnquiryBadge status={enquiry.status} />}
      />

      <div className="space-y-3 mb-5">
        <Notice type="error" title="Something went wrong" onClose={() => setError('')}>{error}</Notice>
      </div>

      <div className="space-y-5">
        {/* Contact the customer */}
        <Card title="Contact the customer">
          <div className="flex flex-wrap gap-2">
            <a href={customerWhatsApp(enquiry)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-11 px-5 bg-accent text-white text-[15px] font-heading hover:bg-[#b5161b]"
              onClick={() => enquiry.status === 'new' && save({ status: 'contacted' })}>
              <WhatsAppIcon className="w-5 h-5" /> Reply on WhatsApp<span className="sr-only"> (opens WhatsApp)</span>
            </a>
            <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, '')}`}
              className="inline-flex items-center gap-2 min-h-11 px-5 border border-[#8a8a8a] text-[15px] hover:border-accent hover:text-accent">
              <Phone className="w-4 h-4" aria-hidden="true" /> Call {enquiry.phone}
            </a>
            {enquiry.email && (
              <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent('Your enquiry with Indus Heaters')}`}
                className="inline-flex items-center gap-2 min-h-11 px-5 border border-[#8a8a8a] text-[15px] hover:border-accent hover:text-accent">
                <Mail className="w-4 h-4" aria-hidden="true" /> Email
              </a>
            )}
          </div>
          <p className={`mt-3 text-[14px] ${MUTED}`}>
            “Reply on WhatsApp” opens a chat with a ready-made greeting and marks the enquiry as Contacted.
          </p>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-[15px]">
            <dt className={MUTED}>Phone</dt><dd>{enquiry.phone}</dd>
            {enquiry.email && (<><dt className={MUTED}>Email</dt><dd className="break-all">{enquiry.email}</dd></>)}
            {enquiry.company_name && (<><dt className={MUTED}>Company</dt><dd>{enquiry.company_name}</dd></>)}
            {enquiry.city && (<><dt className={MUTED}>City</dt><dd>{enquiry.city}</dd></>)}
            {enquiry.delivery_address && (
              <><dt className={`${MUTED} flex items-center gap-1`}><MapPin className="w-4 h-4" aria-hidden="true" /> Delivery address</dt>
                <dd className="whitespace-pre-line">{enquiry.delivery_address}</dd></>
            )}
            <dt className={MUTED}>Sent from</dt><dd>{enquiry.source === 'whatsapp_button' ? 'WhatsApp button' : 'Website enquiry form'}</dd>
          </dl>
        </Card>

        {/* What they asked for */}
        <Card title={`What they asked for (${enquiry.items.length})`}>
          {enquiry.items.length === 0 ? (
            <p className={MUTED}>No products were listed.</p>
          ) : (
            <ul className="divide-y divide-black/10 -my-2">
              {enquiry.items.map((item) => {
                const sizes = Object.entries(item.measurements || {}).filter(([, v]) => v);
                const live = item.product && item.product.status === 'published';
                return (
                  <li key={item.id} className="py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[16px] font-heading">{item.product_name}</span>
                      <span className="text-[15px]">Quantity: <strong>{item.quantity}</strong></span>
                    </div>
                    {sizes.length > 0 && (
                      <p className="mt-1 text-[15px]"><span className={MUTED}>Sizes: </span>{sizes.map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>
                    )}
                    {item.note && <p className="mt-1 text-[15px]"><span className={MUTED}>Note: </span>{item.note}</p>}
                    <div className="mt-1 flex flex-wrap gap-x-4">
                      {item.product && (
                        <Link to={`/admin/products/${item.product.id}`} className="inline-flex items-center min-h-11 text-[14px] underline underline-offset-2 hover:text-accent">Open product in admin</Link>
                      )}
                      {live && (
                        <a href={`/products/${item.product.category?.slug}/${item.product.slug}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 min-h-11 text-[14px] underline underline-offset-2 hover:text-accent">
                          View on website <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span>
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {enquiry.message && (
            <div className="mt-4 pt-4 border-t border-black/10">
              <div className={`text-[14px] ${MUTED} mb-1`}>Message</div>
              <p className="whitespace-pre-line text-[15px]">{enquiry.message}</p>
            </div>
          )}
        </Card>

        {/* Files */}
        {enquiry.attachments.length > 0 && (
          <Card title={`Files from the customer (${enquiry.attachments.length})`} description="Private: only the owner and sales staff can open these.">
            <ul className="space-y-2">
              {enquiry.attachments.map((att) => (
                <li key={att.id} className="flex flex-wrap items-center gap-2 border border-black/10 p-2 pl-3">
                  <Paperclip className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0 break-all text-[15px]">{att.filename || att.path.split('/').pop()}</span>
                  <Button variant="secondary" onClick={() => openFile(att, false)}><Eye className="w-4 h-4" aria-hidden="true" /> Open</Button>
                  <Button variant="secondary" onClick={() => openFile(att, true)}><Download className="w-4 h-4" aria-hidden="true" /> Download</Button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Stage */}
        <Card title="Where is this enquiry at?" description="Change the stage as you go, so everyone knows what’s been done.">
          <fieldset>
            <legend className="sr-only">Enquiry stage</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(ENQUIRY_STATUS).map(([key, s]) => (
                <label key={key} className={`flex items-start gap-3 p-3 border-2 cursor-pointer min-h-11 ${enquiry.status === key ? 'border-accent bg-accent/5' : 'border-black/10 hover:border-black/30'}`}>
                  <input type="radio" name="enquiry-status" className="mt-0.5 shrink-0" checked={enquiry.status === key} disabled={busy}
                    onChange={() => save({ status: key }, `Stage changed to “${s.label}”.`)} />
                  <span>
                    <span className="block text-[16px] font-heading">{s.label}</span>
                    <span className={`block text-[14px] ${MUTED}`}>{s.help}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        {/* Notes */}
        <Card title="Notes for your team" description="Only visible here, never to the customer — e.g. price quoted, follow-up date.">
          <Field label="Notes">
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Quoted ₹1,200 each, call back on Monday" />
          </Field>
          <div className="mt-3 flex justify-end">
            <Button loading={busy} disabled={!notesChanged} onClick={() => save({ internal_notes: notes.trim() || null }, 'Notes saved.')}>Save notes</Button>
          </div>
        </Card>

        {owner && (
          <div className="border-t border-black/10 pt-5">
            {!confirming ? (
              <Button variant="quiet" onClick={() => setConfirming(true)}><Trash2 className="w-4 h-4" aria-hidden="true" /> Delete this enquiry</Button>
            ) : (
              <div className="bg-white border-2 border-accent p-4 space-y-3" role="alertdialog" aria-label="Delete this enquiry forever?">
                <p className="text-[15px]"><strong>Delete this enquiry forever?</strong> Its details and attached files are removed and can’t be brought back. To keep it but mark it finished, choose “Closed — no order” instead.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger" loading={busy} onClick={remove} autoFocus>Yes, delete forever</Button>
                  <Button variant="secondary" onClick={() => setConfirming(false)}>No, keep it</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
