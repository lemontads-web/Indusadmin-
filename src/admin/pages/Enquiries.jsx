import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Download, Paperclip, Phone, ChevronRight, Inbox } from 'lucide-react';
import { listEnquiries, friendlyError } from '../lib/api';
import { timeAgo, productSummary } from '../lib/format';
import { Button, EmptyState, EnquiryBadge, ENQUIRY_STATUS, Field, Input, MUTED, Notice, PageHeader, Segmented, Spinner } from '../components/ui';



// Spreadsheet-friendly export (opens in Excel / Google Sheets)
function downloadCsv(rows) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Received', 'Name', 'Company', 'Phone', 'Email', 'Status', 'Products', 'Internal notes'];
  const lines = rows.map((e) => [
    new Date(e.created_at).toLocaleString(), e.customer_name, e.company_name, e.phone, e.email,
    ENQUIRY_STATUS[e.status]?.label, productSummary(e.items), e.internal_notes,
  ].map(cell).join(','));
  const blob = new Blob(['﻿' + [header.map(cell).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `indus-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default function Enquiries() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const status = params.get('status') ?? 'new';
  const q = params.get('q') || '';

  useEffect(() => {
    let alive = true;
    listEnquiries().then((r) => alive && setRows(r)).catch((e) => alive && setError(friendlyError(e)));
    return () => { alive = false; };
  }, []);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    if (key === 'q' && !value) next.delete('q');
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => {
    const c = { all: rows?.length || 0 };
    for (const key of Object.keys(ENQUIRY_STATUS)) c[key] = rows?.filter((r) => r.status === key).length || 0;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((r) => {
      if (status && status !== 'all' && r.status !== status) return false;
      if (!words.length) return true;
      const hay = [r.customer_name, r.company_name, r.phone, r.email, r.city, r.internal_notes, productSummary(r.items)].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [rows, status, q]);

  return (
    <>
      <PageHeader
        title="Enquiries"
        subtitle="Every enquiry sent from the website. Open one to reply, add notes or change its stage."
        actions={rows?.length > 0 && (
          <Button variant="secondary" onClick={() => downloadCsv(visible)}>
            <Download className="w-4 h-4" aria-hidden="true" /> Download list (Excel)
          </Button>
        )}
      />

      <div className="bg-white border border-black/10 p-4 mb-4 space-y-4">
        <Field label="Search enquiries" htmlFor="enquiry-search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#767676] pointer-events-none" aria-hidden="true" />
            <Input id="enquiry-search" type="search" value={q} onChange={(e) => setParam('q', e.target.value)}
              placeholder="Name, company, phone or product" style={{ paddingLeft: '2.5rem' }} />
          </div>
        </Field>
        <Segmented label="Show enquiries that are" value={status} onChange={(v) => setParam('status', v)} options={[
          { value: 'new', label: 'New', count: counts.new },
          { value: 'contacted', label: 'Contacted', count: counts.contacted },
          { value: 'quoted', label: 'Quote sent', count: counts.quoted },
          { value: 'won', label: 'Order received', count: counts.won },
          { value: 'lost', label: 'Closed', count: counts.lost },
          { value: 'all', label: 'All', count: counts.all },
        ]} />
      </div>

      <div className="mb-4"><Notice type="error" title="Something went wrong" onClose={() => setError('')}>{error}</Notice></div>
      {!rows && !error && <Spinner label="Loading enquiries…" />}

      {rows && visible.length === 0 && (
        <EmptyState title={rows.length === 0 ? 'No enquiries yet' : status === 'new' && !q ? 'All caught up' : 'No enquiries match'}>
          {rows.length === 0
            ? 'When someone sends an enquiry from the website, it appears here — and you still get the email copy.'
            : status === 'new' && !q ? 'There are no new enquiries. Choose another stage above to see older ones.'
            : 'Try another word, or choose “All”.'}
        </EmptyState>
      )}

      {visible.length > 0 && (
        <ul className="space-y-2">
          {visible.map((e) => (
            <li key={e.id}>
              <Link to={`/admin/enquiries/${e.id}`}
                className={`flex items-start gap-3 sm:gap-4 p-4 bg-white border hover:border-accent ${e.status === 'new' ? 'border-l-4 border-l-accent border-black/10' : 'border-black/10'}`}>
                <Inbox className={`w-5 h-5 mt-1 shrink-0 ${e.status === 'new' ? 'text-accent' : 'text-[#767676]'}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`text-[17px] ${e.status === 'new' ? 'font-heading' : ''}`}>{e.customer_name}</span>
                    {e.company_name && <span className={`text-[15px] ${MUTED}`}>{e.company_name}</span>}
                    <EnquiryBadge status={e.status} />
                  </div>
                  <p className="mt-1 text-[15px] line-clamp-2">{productSummary(e.items) || 'No products listed'}</p>
                  <div className={`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] ${MUTED}`}>
                    <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" aria-hidden="true" /> {e.phone}</span>
                    {e.attachments?.length > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" aria-hidden="true" /> {e.attachments.length} file{e.attachments.length === 1 ? '' : 's'}</span>}
                    <span>{timeAgo(e.created_at)}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 mt-1 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
