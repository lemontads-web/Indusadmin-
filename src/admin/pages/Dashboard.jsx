import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, FolderTree, AlertTriangle, ChevronRight, Inbox, Image as ImageIcon } from 'lucide-react';
import { useAdminAuth, canEditContent, canManageEnquiries } from '../authContext';
import { getDashboard, countNewEnquiries, friendlyError } from '../lib/api';
import { Card, MUTED, Notice, PageHeader, Spinner, StatusBadge } from '../components/ui';

function Task(props) {
  const { to, title, text, primary } = props;
  const TaskIcon = props.icon;
  return (
    <Link to={to} className={`group flex items-center gap-4 p-4 sm:p-5 border min-h-20 transition-colors ${primary
      ? 'bg-accent text-white border-accent hover:bg-[#b5161b]'
      : 'bg-white text-primary border-black/10 hover:border-accent'}`}>
      <TaskIcon className="w-7 h-7 shrink-0" aria-hidden="true" />
      <span className="flex-1">
        <span className="block text-[17px] font-heading">{title}</span>
        <span className={`block text-[14px] ${primary ? 'text-white/90' : MUTED}`}>{text}</span>
      </span>
      <ChevronRight className="w-5 h-5 shrink-0" aria-hidden="true" />
    </Link>
  );
}

function Stat({ value, label, help, to }) {
  return (
    <Link to={to} className="block bg-white border border-black/10 p-4 hover:border-accent min-h-11">
      <span className="block text-[28px] font-heading text-primary leading-none">{value}</span>
      <span className="block mt-2 text-[15px] font-heading">{label}</span>
      <span className={`block text-[13px] ${MUTED}`}>{help}</span>
    </Link>
  );
}

export default function Dashboard() {
  const { role, name, user } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const editor = canEditContent(role);
  const sales = canManageEnquiries(role);
  const [newEnquiries, setNewEnquiries] = useState(null);

  useEffect(() => {
    if (!sales) return undefined;
    let alive = true;
    countNewEnquiries().then((n) => alive && setNewEnquiries(n)).catch(() => alive && setNewEnquiries(null));
    return () => { alive = false; };
  }, [sales]);

  useEffect(() => {
    if (!editor) return undefined;
    let alive = true;
    getDashboard().then((d) => alive && setData(d)).catch((e) => alive && setError(friendlyError(e)));
    return () => { alive = false; };
  }, [editor]);

  const enquiriesBox = sales && newEnquiries !== null && (
    <Link to="/admin/enquiries" className={`flex items-center gap-4 p-4 sm:p-5 mb-6 border-2 ${newEnquiries ? 'border-accent bg-accent/5' : 'border-black/10 bg-white'} hover:border-accent`}>
      <Inbox className={`w-8 h-8 shrink-0 ${newEnquiries ? 'text-accent' : ''}`} aria-hidden="true" />
      <span className="flex-1">
        <span className="block text-[18px] font-heading">{newEnquiries ? `${newEnquiries} new enquir${newEnquiries === 1 ? 'y' : 'ies'} waiting` : 'No new enquiries'}</span>
        <span className={`block text-[14px] ${MUTED}`}>{newEnquiries ? 'Open the inbox to reply on WhatsApp or by phone.' : 'You’re all caught up. Open the inbox to see earlier ones.'}</span>
      </span>
      <ChevronRight className="w-5 h-5 shrink-0" aria-hidden="true" />
    </Link>
  );

  if (!editor) {
    return (
      <>
        <PageHeader title="Welcome" subtitle={user?.email} docTitle="Home" />
        {enquiriesBox || <Spinner label="Checking for new enquiries…" />}
      </>
    );
  }

  const greeting = name && name !== 'Owner' ? `Welcome back, ${name}` : 'Welcome back';

  return (
    <>
      <PageHeader title={greeting} subtitle="What would you like to do today?" docTitle="Home" />
      {enquiriesBox}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Task primary to="/admin/products/new" icon={Plus} title="Add a new product" text="Name, photos and details" />
        <Task to="/admin/products" icon={Package} title="Edit products" text="Change details, photos or visibility" />
        <Task to="/admin/categories" icon={FolderTree} title="Organise categories" text="Add, rename or reorder" />
        <Task to="/admin/photos" icon={ImageIcon} title="Photo library" text="See where photos are used, tidy unused ones" />
      </div>

      <Notice type="error">{error}</Notice>
      {!data && !error && <Spinner label="Loading your summary…" />}

      {data && (
        <div className="space-y-6">
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className="text-[18px] mb-3">Your website at a glance</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat value={data.live} label="On website" help="Customers can see these" to="/admin/products?status=published" />
              <Stat value={data.drafts} label="Drafts" help="Not published yet" to="/admin/products?status=draft" />
              <Stat value={data.hidden} label="Hidden" help="Taken off the website" to="/admin/products?status=hidden" />
              <Stat value={data.trash} label="In Trash" help="Can still be restored" to="/admin/trash" />
            </div>
          </section>

          {(data.noPhoto.length > 0 || data.missingAlt > 0) && (
            <Card title="Needs your attention">
              <ul className="space-y-3 text-[15px]">
                {data.noPhoto.map((p) => (
                  <li key={p.id} className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
                    <span><Link className="underline underline-offset-2 hover:text-accent" to={`/admin/products/${p.id}`}>{p.name}</Link> has no photo — products need a photo to go on the website.</span>
                  </li>
                ))}
                {data.missingAlt > 0 && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
                    {data.missingAlt} photo(s) have no short description. Descriptions help Google and people using screen readers.
                  </li>
                )}
              </ul>
            </Card>
          )}

          <Card title="Recently changed" description="The last products you or your team edited.">
            <ul className="-my-2 divide-y divide-black/10">
              {data.recent.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/products/${p.id}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 min-h-11 hover:text-accent">
                    <span className="text-[16px]">{p.name}</span>
                    <span className="flex items-center gap-3">
                      <StatusBadge status={p.status} />
                      <span className={`text-[14px] ${MUTED}`}>{new Date(p.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="How it works">
            <ol className="space-y-2 text-[15px] list-decimal pl-5">
              <li><strong>Draft</strong> — a new product starts here. Customers can’t see it yet.</li>
              <li><strong>On website</strong> — press “Publish to website” and it appears straight away.</li>
              <li><strong>Hidden</strong> — take a product off the website without losing it.</li>
              <li><strong>Trash</strong> — deleted items wait here, so mistakes can be undone.</li>
            </ol>
          </Card>
        </div>
      )}
    </>
  );
}
