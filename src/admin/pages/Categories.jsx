import { useCallback, useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, ImageOff } from 'lucide-react';
import { useAdminAuth } from '../authContext';
import { listCategories, saveCategory, swapCategoryOrder, trashCategory, restoreCategory, moveProductsToCategory, slugify, friendlyError } from '../lib/api';
import { Button, EmptyState, Field, IconButton, Input, MUTED, Notice, PageHeader, Select, Spinner, STATUS, StatusBadge, Textarea, Toast } from '../components/ui';
import ImageManager from '../components/ImageManager';

const blank = { id: null, name: '', slug: '', description: '', status: 'published', image: [] };

function CategoryForm({ initial, onSaved, onCancel, userId }) {
  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Enter the category name.');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setError('The web address can only use small letters, numbers and dashes.');
    setSaving(true);
    try {
      await saveCategory({ ...form, name: form.name.trim(), image_id: form.image[0]?.media_id || null });
      onSaved(form.id ? `“${form.name.trim()}” saved.` : `“${form.name.trim()}” added.`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5 bg-white border-2 border-accent p-4 sm:p-5">
      <h2 className="text-[18px]">{initial.id ? `Edit “${initial.name}”` : 'Add a new category'}</h2>
      {error && <Notice type="error" title="Not saved">{error}</Notice>}
      <Field label="Category name" required hint="e.g. Coil Heaters">
        <Input value={form.name} autoFocus onChange={(e) => {
          const name = e.target.value;
          setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
        }} />
      </Field>
      <Field label="Short description" hint="One line shown under the category on the Home page.">
        <Textarea rows={2} value={form.description} maxLength={160} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <fieldset>
        <legend className="text-[15px] mb-1.5">Who can see this category?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {['published', 'draft', 'hidden'].map((key) => (
            <label key={key} className={`flex items-start gap-3 p-3 border-2 cursor-pointer ${form.status === key ? 'border-accent bg-accent/5' : 'border-black/10 hover:border-black/30'}`}>
              <input type="radio" name="cat-status" checked={form.status === key} onChange={() => set('status', key)} className="mt-0.5" />
              <span>
                <span className="block font-heading">{STATUS[key].label}</span>
                <span className={`block text-[13px] ${MUTED}`}>{key === 'published' ? 'Shown in the menu and on Home.' : 'Its products are not shown either.'}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <div className="text-[15px] font-heading mb-1.5">Photo for the Home page tile</div>
        <ImageManager single value={form.image} onChange={(v) => set('image', v)} defaultAlt={`${form.name} — Indus Heaters`} userId={userId} />
      </div>
      <Field label="Web address" hint={`indusheaters.com/products?category=${form.slug || '…'}${initial.id ? ' — changing it breaks old links.' : ''}`}>
        <Input value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
      </Field>
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{initial.id ? 'Save changes' : 'Add category'}</Button>
      </div>
    </form>
  );
}

export default function Categories() {
  const { user } = useAdminAuth();
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // category being edited, or 'new'
  const [removing, setRemoving] = useState(null); // { cat, target }
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let alive = true;
    listCategories().then((r) => alive && setRows(r)).catch((e) => alive && setError(friendlyError(e)));
    return () => { alive = false; };
  }, [reload]);

  const done = (text, action) => { if (text) setToast({ text, action }); setEditing(null); setRemoving(null); setReload((n) => n + 1); };

  const run = async (fn, text, action) => {
    setBusy(true); setError('');
    try { await fn(); done(text, action); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  };

  const toForm = (c) => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description || '', status: c.status,
    image: c.image ? [{ media_id: c.image.id, url: c.imageUrl, alt_text: '' }] : [],
  });

  const trash = (c) => (c.productCount > 0
    ? (setEditing(null), setRemoving({ cat: c, target: '' }))
    : run(() => trashCategory(c.id), `“${c.name}” moved to Trash.`, { label: 'Undo', onClick: () => run(() => restoreCategory(c.id), `“${c.name}” is back.`) }));

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="The order here is the order on the Home page, in the menu and in the footer."
        actions={editing !== 'new' && <Button onClick={() => { setRemoving(null); setEditing('new'); }}><Plus className="w-5 h-5" aria-hidden="true" /> Add a category</Button>}
      />
      <div className="mb-4"><Notice type="error" title="Something went wrong" onClose={() => setError('')}>{error}</Notice></div>

      {editing === 'new' && <div className="mb-5"><CategoryForm initial={{ ...blank }} userId={user?.id} onSaved={done} onCancel={() => setEditing(null)} /></div>}

      {!rows && !error && <Spinner label="Loading categories…" />}
      {rows && rows.length === 0 && editing !== 'new' && (
        <EmptyState title="No categories yet" action={<Button onClick={() => setEditing('new')}><Plus className="w-5 h-5" aria-hidden="true" /> Add the first category</Button>}>
          Categories group your products, like “Coil Heaters” or “Thermocouples”.
        </EmptyState>
      )}

      {rows && rows.length > 0 && (
        <ol className="space-y-2">
          {rows.map((c, i) => (
            <li key={c.id}>
              {editing?.id === c.id ? (
                <CategoryForm initial={editing} userId={user?.id} onSaved={done} onCancel={() => setEditing(null)} />
              ) : (
                <div className="bg-white border border-black/10">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                    <span className={`w-6 text-center text-[15px] ${MUTED}`} aria-hidden="true">{i + 1}</span>
                    <div className="w-20 h-16 shrink-0 border border-black/10 flex items-center justify-center bg-white">
                      {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full h-full object-contain" /> : <ImageOff className="w-5 h-5 text-accent" aria-hidden="true" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[17px] font-heading">{c.name}</div>
                      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[14px] ${MUTED}`}>
                        <StatusBadge status={c.status} />
                        <span>{c.productCount} product{c.productCount === 1 ? '' : 's'}</span>
                        {!c.imageUrl && <span className="text-accent">No photo</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 border-t border-black/5 px-2 py-1">
                    <Button variant="quiet" className="text-accent font-heading" onClick={() => { setRemoving(null); setEditing(toForm(c)); }}>
                      <Pencil className="w-4 h-4" aria-hidden="true" /> Edit<span className="sr-only"> {c.name}</span>
                    </Button>
                    <IconButton showLabel label="Move up" icon={<ArrowUp className="w-4 h-4" />} disabled={i === 0 || busy}
                      aria-label={`Move ${c.name} up`} onClick={() => run(() => swapCategoryOrder(c, rows[i - 1]))} />
                    <IconButton showLabel label="Move down" icon={<ArrowDown className="w-4 h-4" />} disabled={i === rows.length - 1 || busy}
                      aria-label={`Move ${c.name} down`} onClick={() => run(() => swapCategoryOrder(c, rows[i + 1]))} />
                    <Button variant="quiet" className="sm:ml-auto" disabled={busy} onClick={() => trash(c)}>
                      <Trash2 className="w-4 h-4" aria-hidden="true" /> Move to Trash<span className="sr-only"> — {c.name}</span>
                    </Button>
                  </div>

                  {removing?.cat.id === c.id && (
                    <div className="border-t-2 border-accent p-4 space-y-3 bg-accent/5" role="group" aria-label={`Move ${c.name} to Trash`}>
                      <p className="text-[15px]">
                        <strong>{c.name}</strong> still has {c.productCount} product{c.productCount === 1 ? '' : 's'}. Choose a new category for {c.productCount === 1 ? 'it' : 'them'} first, so nothing disappears from the website.
                      </p>
                      <Field label="Move the products to">
                        <Select value={removing.target} onChange={(e) => setRemoving((r) => ({ ...r, target: e.target.value }))}>
                          <option value="">Choose a category…</option>
                          {rows.filter((x) => x.id !== c.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </Select>
                      </Field>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="secondary" onClick={() => setRemoving(null)}>Cancel</Button>
                        <Button variant="danger" loading={busy} disabled={!removing.target}
                          onClick={() => run(async () => {
                            await moveProductsToCategory(c.id, removing.target);
                            await trashCategory(c.id);
                          }, `Products moved, and “${c.name}” moved to Trash.`)}>
                          Move products and delete category
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
