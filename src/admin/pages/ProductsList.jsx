import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Copy, Trash2, ExternalLink, Search, ImageOff, Pencil } from 'lucide-react';
import { listProducts, listCategories, trashProduct, restoreProduct, duplicateProduct, friendlyError } from '../lib/api';
import { searchProducts } from '../../utils/productSearch';
import { Button, ButtonLink, EmptyState, Field, Input, MUTED, Notice, PageHeader, Segmented, Select, Spinner, StatusBadge, Toast } from '../components/ui';

export default function ProductsList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [reload, setReload] = useState(0);
  const q = params.get('q') || '';
  const cat = params.get('category') || '';
  const status = params.get('status') || '';
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let alive = true;
    Promise.all([listProducts(), listCategories()])
      .then(([p, c]) => { if (alive) { setRows(p); setCategories(c); } })
      .catch((e) => alive && setError(friendlyError(e)));
    return () => { alive = false; };
  }, [reload]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const inCategory = useMemo(() => (rows || []).filter((p) => !cat || p.category?.id === cat), [rows, cat]);
  const counts = useMemo(() => ({
    all: inCategory.length,
    published: inCategory.filter((p) => p.status === 'published').length,
    draft: inCategory.filter((p) => p.status === 'draft').length,
    hidden: inCategory.filter((p) => p.status === 'hidden').length,
  }), [inCategory]);

  const visible = useMemo(() => {
    const filtered = inCategory.filter((p) => !status || p.status === status);
    const searchable = filtered.map((p) => ({ ...p, categoryLabel: p.category?.name }));
    return q ? searchProducts(searchable, q) : searchable;
  }, [inCategory, q, status]);

  const act = async (id, fn, done) => {
    setBusyId(id); setError('');
    try {
      const result = await fn();
      await done?.(result);
      setReload((n) => n + 1);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusyId(null);
    }
  };

  const moveToTrash = (p) => act(p.id, () => trashProduct(p.id), () => setToast({
    text: `“${p.name}” moved to Trash.`,
    action: { label: 'Undo', onClick: () => act(p.id, () => restoreProduct(p.id), () => setToast({ text: `“${p.name}” is back.` })) },
  }));

  const filtersActive = q || cat || status;

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={rows ? `${rows.length} products in total. Click a product to change it.` : ' '}
        actions={<ButtonLink to="/admin/products/new"><Plus className="w-5 h-5" aria-hidden="true" /> Add a new product</ButtonLink>}
      />

      <div className="bg-white border border-black/10 p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-3">
          <Field label="Search" htmlFor="product-search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#767676] pointer-events-none" aria-hidden="true" />
              <Input id="product-search" value={q} onChange={(e) => setFilter('q', e.target.value)} placeholder="e.g. coil, immersion, thermocouple" style={{ paddingLeft: '2.5rem' }} type="search" />
            </div>
          </Field>
          <Field label="Category">
            <Select value={cat} onChange={(e) => setFilter('category', e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
        <Segmented
          label="Show products that are"
          value={status}
          onChange={(v) => setFilter('status', v)}
          options={[
            { value: '', label: 'All', count: counts.all },
            { value: 'published', label: 'On website', count: counts.published },
            { value: 'draft', label: 'Drafts', count: counts.draft },
            { value: 'hidden', label: 'Hidden', count: counts.hidden },
          ]}
        />
      </div>

      <div className="mb-4"><Notice type="error" onClose={() => setError('')}>{error}</Notice></div>

      {!rows && !error && <Spinner label="Loading products…" />}
      {rows && visible.length === 0 && (
        <EmptyState
          title={filtersActive ? 'No products match' : 'No products yet'}
          action={filtersActive
            ? <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>Clear search and filters</Button>
            : <ButtonLink to="/admin/products/new"><Plus className="w-5 h-5" aria-hidden="true" /> Add your first product</ButtonLink>}
        >
          {filtersActive ? 'Try a different word, or clear the search and filters to see everything.' : 'Products you add will appear here.'}
        </EmptyState>
      )}

      {visible.length > 0 && (
        <>
          {filtersActive && <p className={`mb-2 text-[14px] ${MUTED}`} role="status">Showing {visible.length} of {rows.length} products</p>}
          <ul className="space-y-2">
            {visible.map((p) => (
              <li key={p.id} className="bg-white border border-black/10 hover:border-black/25">
                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                  <Link to={`/admin/products/${p.id}`} className="w-20 h-16 sm:w-24 sm:h-[72px] shrink-0 border border-black/10 bg-white flex items-center justify-center" tabIndex={-1} aria-hidden="true">
                    {p.thumb ? <img src={p.thumb} alt="" className="w-full h-full object-contain" loading="lazy" /> : <ImageOff className="w-5 h-5 text-accent" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/admin/products/${p.id}`} className="inline-flex items-center min-h-11 text-[17px] font-heading text-primary hover:text-accent hover:underline underline-offset-2">{p.name}</Link>
                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] ${MUTED}`}>
                      <StatusBadge status={p.status} />
                      <span>{p.category?.name}</span>
                      <span className={p.photoCount === 0 ? 'text-accent' : ''}>{p.photoCount === 0 ? 'No photo' : `${p.photoCount} photo${p.photoCount === 1 ? '' : 's'}`}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 border-t border-black/5 px-2 py-1">
                  <Link to={`/admin/products/${p.id}`} className="inline-flex items-center gap-1.5 min-h-11 px-3 text-[15px] font-heading text-accent hover:bg-accent/5">
                    <Pencil className="w-4 h-4" aria-hidden="true" /> Edit<span className="sr-only"> {p.name}</span>
                  </Link>
                  {p.status === 'published' && (
                    <a href={`/products/${p.category?.slug}/${p.slug}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 min-h-11 px-3 text-[15px] hover:text-accent hover:bg-accent/5">
                      <ExternalLink className="w-4 h-4" aria-hidden="true" /> View on website<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                  <Button variant="quiet" disabled={busyId === p.id}
                    onClick={() => act(p.id, () => duplicateProduct(p.id), (newId) => navigate(`/admin/products/${newId}`))}>
                    <Copy className="w-4 h-4" aria-hidden="true" /> Duplicate<span className="sr-only"> {p.name}</span>
                  </Button>
                  <Button variant="quiet" className="sm:ml-auto" disabled={busyId === p.id} onClick={() => moveToTrash(p)}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" /> Move to Trash<span className="sr-only"> — {p.name}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
