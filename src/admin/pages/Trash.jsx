import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useAdminAuth, isOwner } from '../authContext';
import { listProducts, listCategories, restoreProduct, restoreCategory, deleteProductForever, deleteCategoryForever, friendlyError } from '../lib/api';
import { Button, EmptyState, MUTED, Notice, PageHeader, Spinner, Toast } from '../components/ui';

function TrashItem({ title, subtitle, deletedAt, onRestore, onDelete, canDelete, busy }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="bg-white border border-black/10 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="text-[17px] font-heading">{title}</div>
          <div className={`text-[14px] ${MUTED}`}>{subtitle} · moved to Trash on {new Date(deletedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        {!confirming && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={busy} onClick={onRestore}><RotateCcw className="w-4 h-4" aria-hidden="true" /> Restore<span className="sr-only"> {title}</span></Button>
            {canDelete && <Button variant="quiet" disabled={busy} onClick={() => setConfirming(true)}><Trash2 className="w-4 h-4" aria-hidden="true" /> Delete forever<span className="sr-only"> — {title}</span></Button>}
          </div>
        )}
      </div>
      {confirming && (
        <div className="mt-3 border-t-2 border-accent pt-3 space-y-3" role="alertdialog" aria-label={`Delete ${title} forever?`}>
          <p className="text-[15px]"><strong>Delete “{title}” forever?</strong> It can’t be brought back. Its photos stay in the photo library.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" loading={busy} onClick={onDelete} autoFocus>Yes, delete forever</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>No, keep it</Button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function Trash() {
  const { role } = useAdminAuth();
  const owner = isOwner(role);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let alive = true;
    Promise.all([listProducts({ trashed: true }), listCategories({ trashed: true })])
      .then(([products, categories]) => alive && setData({ products, categories }))
      .catch((e) => alive && setError(friendlyError(e)));
    return () => { alive = false; };
  }, [reload]);

  const run = async (fn, text) => {
    setBusy(true); setError('');
    try { await fn(); setToast({ text }); setReload((n) => n + 1); }
    catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  };

  const empty = data && data.products.length === 0 && data.categories.length === 0;

  return (
    <>
      <PageHeader title="Trash" subtitle={owner
        ? 'Deleted products and categories wait here, so mistakes can be undone. Restore them, or delete them forever.'
        : 'Deleted products and categories wait here, so mistakes can be undone. Only the owner can delete forever.'} />
      <div className="mb-4"><Notice type="error" title="Something went wrong" onClose={() => setError('')}>{error}</Notice></div>
      {!data && !error && <Spinner label="Loading Trash…" />}
      {empty && <EmptyState title="Trash is empty">When you move a product or category to Trash, it will appear here.</EmptyState>}

      {data && data.products.length > 0 && (
        <section className="mb-6" aria-labelledby="trash-products">
          <h2 id="trash-products" className="text-[18px] mb-2">Products ({data.products.length})</h2>
          <ul className="space-y-2">
            {data.products.map((p) => (
              <TrashItem key={p.id} title={p.name} subtitle={p.category?.name} deletedAt={p.deleted_at} busy={busy} canDelete={owner}
                onRestore={() => run(() => restoreProduct(p.id), `“${p.name}” restored. It keeps its previous status.`)}
                onDelete={() => run(() => deleteProductForever(p.id), `“${p.name}” deleted forever.`)} />
            ))}
          </ul>
        </section>
      )}
      {data && data.categories.length > 0 && (
        <section aria-labelledby="trash-categories">
          <h2 id="trash-categories" className="text-[18px] mb-2">Categories ({data.categories.length})</h2>
          <ul className="space-y-2">
            {data.categories.map((c) => (
              <TrashItem key={c.id} title={c.name} subtitle={`${c.productCount} product(s)`} deletedAt={c.deleted_at} busy={busy} canDelete={owner}
                onRestore={() => run(() => restoreCategory(c.id), `“${c.name}” restored.`)}
                onDelete={() => run(() => deleteCategoryForever(c.id), `“${c.name}” deleted forever.`)} />
            ))}
          </ul>
        </section>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
