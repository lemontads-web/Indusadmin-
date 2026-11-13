import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Save, Globe, AlertTriangle } from 'lucide-react';
import { useAdminAuth } from '../authContext';
import { getProduct, listCategories, listProducts, saveProduct, slugify, uniqueProductSlug, friendlyError } from '../lib/api';
import { Button, Card, Field, Input, MUTED, Notice, PageHeader, Select, Spinner, STATUS, StatusBadge, Textarea, Toast } from '../components/ui';
import { ListEditor, SpecsEditor } from '../components/Editors';
import ImageManager from '../components/ImageManager';
import RelatedPicker from '../components/RelatedPicker';

const EMPTY = {
  id: null, name: '', slug: '', category_id: '', status: 'draft', is_featured: false,
  short_description: '', full_description: '', specs: [], features: [], applications: [], keywords: [],
  images: [], related: [], seo_title: '', seo_description: '',
};

const LEAVE_MESSAGE = 'You have unsaved changes on this product. Leave without saving?';

function StatusChooser({ value, onChange }) {
  return (
    <fieldset>
      <legend className="text-[18px] mb-1">Who can see this product?</legend>
      <p className={`text-[14px] ${MUTED} mb-3`}>You can change this at any time. Remember to save afterwards.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {['published', 'draft', 'hidden'].map((key) => (
          <label key={key} className={`flex items-start gap-3 p-3 border-2 cursor-pointer min-h-11 ${value === key ? 'border-accent bg-accent/5' : 'border-black/10 bg-white hover:border-black/30'}`}>
            <input type="radio" name="status" value={key} checked={value === key} onChange={() => onChange(key)} className="mt-0.5 shrink-0" />
            <span>
              <span className="block text-[16px] font-heading">{STATUS[key].label}</span>
              <span className={`block text-[14px] ${MUTED}`}>{STATUS[key].help}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function ProductEdit() {
  const { id } = useParams();
  const location = useLocation();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null); // last saved copy, to detect unsaved changes
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [editingSlug, setEditingSlug] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(location.state?.toast || null);
  const summaryRef = useRef(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let alive = true;
    Promise.all([isNew ? Promise.resolve({ ...EMPTY }) : getProduct(id), listCategories(), listProducts()])
      .then(([p, c, all]) => {
        if (!alive) return;
        const start = isNew && c[0] ? { ...p, category_id: c[0].id } : p;
        setForm(start); setSaved(start); setCategories(c); setProducts(all);
      })
      .catch((e) => alive && setLoadError(friendlyError(e)));
    return () => { alive = false; };
  }, [id, isNew]);

  const dirty = useMemo(() => form && saved && JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  // Ask before leaving with unsaved changes — closing the tab, or clicking a link inside the panel
  useEffect(() => {
    if (!dirty) return undefined;
    const beforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    const onClick = (e) => {
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.origin !== window.location.origin) return;
      if (a.getAttribute('href')?.startsWith('#') || a.pathname === window.location.pathname) return; // stays on this page
      if (!window.confirm(LEAVE_MESSAGE)) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);

  if (!form) return loadError ? <Notice type="error" title="This product couldn’t be opened">{loadError}</Notice> : <Spinner label="Opening product…" />;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const category = categories.find((c) => c.id === form.category_id);
  const webAddress = `indusheaters.com/products/${category?.slug || 'category'}/${form.slug || '…'}`;

  const validate = (f) => {
    const e = {};
    if (f.name.trim().length < 2) e.name = { text: 'Enter the product name.', target: 'f-name' };
    if (!f.category_id) e.category_id = { text: 'Choose a category.', target: 'f-category' };
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) e.slug = { text: 'The web address can only use small letters, numbers and dashes.', target: 'f-slug' };
    if (f.status === 'published' && f.images.length === 0) e.images = { text: 'Add at least one photo before putting the product on the website.', target: 'photos' };
    setErrors(e);
    return e;
  };

  const save = async (statusOverride) => {
    const next = statusOverride ? { ...form, status: statusOverride } : form;
    setError('');
    const found = validate(next);
    if (Object.keys(found).length) {
      if (found.slug) setEditingSlug(true);
      setTimeout(() => summaryRef.current?.focus(), 0);
      return;
    }
    setSaving(true);
    try {
      const newId = await saveProduct(next);
      const savedCopy = { ...next, id: newId };
      setSaved(savedCopy);
      setForm((f) => ({ ...f, status: next.status, id: newId }));
      const message = { text: next.status === 'published' ? 'Saved. It’s on the website now.' : `Saved as ${STATUS[next.status].label.toLowerCase()} — not on the website.` };
      setSlugTouched(true); // from now on, renaming never changes the web address by itself
      if (isNew) navigate(`/admin/products/${newId}`, { replace: true, state: { toast: message } });
      else setToast(message);
    } catch (e) {
      if (e?.code === '23505' && /slug/i.test(e?.message || '')) {
        setEditingSlug(true);
        setErrors({ slug: { text: 'Another product already uses this web address. Change the last part of the address, or press “Make unique”.', target: 'f-slug' } });
      } else {
        setError(friendlyError(e));
      }
      setTimeout(() => summaryRef.current?.focus(), 0);
    } finally {
      setSaving(false);
    }
  };

  const errorList = Object.values(errors);
  const wasLive = saved?.status === 'published';

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="max-w-3xl">
      <Link to="/admin/products" className="inline-flex items-center gap-1.5 min-h-11 text-[15px] hover:text-accent mb-2">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All products
      </Link>
      <PageHeader
        title={isNew ? 'Add a new product' : saved?.name || 'Product'}
        docTitle={isNew ? 'New product' : `Edit ${saved?.name || 'product'}`}
        subtitle={isNew ? 'Fill in the steps below. It stays a draft until you publish it.' : undefined}
        actions={!isNew && (
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={saved?.status} />
            {wasLive && category && (
              <a href={`/products/${category.slug}/${saved.slug}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-11 text-[15px] underline underline-offset-4 hover:text-accent">
                View on website <ExternalLink className="w-4 h-4" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        )}
      />

      {/* Error summary — receives focus so screen readers announce it */}
      <div ref={summaryRef} tabIndex={-1} className="focus:outline-none space-y-3 mb-5">
        {error && <Notice type="error" title="Not saved" onClose={() => setError('')}>{error}</Notice>}
        {errorList.length > 0 && (
          <Notice type="error" title={`Please fix ${errorList.length === 1 ? 'this' : `these ${errorList.length} things`} before saving:`}>
            <ul className="mt-1 space-y-1">
              {errorList.map((e) => (
                <li key={e.target}>
                  <a href={`#${e.target}`} className="underline underline-offset-2 hover:text-accent"
                    onClick={(ev) => { ev.preventDefault(); const el = document.getElementById(e.target); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus?.(); }}>
                    {e.text}
                  </a>
                </li>
              ))}
            </ul>
          </Notice>
        )}
      </div>

      <div className="space-y-5">
        <div className="bg-white border border-black/10 p-4 sm:p-5">
          <StatusChooser value={form.status} onChange={(v) => set('status', v)} />
        </div>

        <Card step="1" title="Name and category">
          <div className="space-y-5">
            <Field label="Product name" required error={errors.name?.text} hint="As customers know it, e.g. “Spring Coil Heaters”.">
              <Input id="f-name" value={form.name} autoComplete="off" onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
              }} />
            </Field>
            <Field label="Category" required error={errors.category_id?.text}>
              <Select id="f-category" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">Choose a category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>

            <div className="bg-[#fafafa] border border-black/10 p-3">
              <div className="flex flex-wrap items-center gap-2 text-[14px]">
                <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className={MUTED}>Web page address:</span>
                <span className="break-all">{webAddress}</span>
                {!editingSlug && (
                  <button type="button" onClick={() => setEditingSlug(true)} className="min-h-11 px-2 underline underline-offset-4 hover:text-accent">Change</button>
                )}
              </div>
              {editingSlug && (
                <div className="mt-3 space-y-2">
                  <Field label="Last part of the address" error={errors.slug?.text}
                    hint="Small letters, numbers and dashes only, e.g. spring-coil-heaters.">
                    <div className="flex gap-2">
                      <Input id="f-slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
                      <Button variant="secondary" onClick={async () => { set('slug', await uniqueProductSlug(form.slug || form.name, form.id)); setErrors((current) => { const rest = { ...current }; delete rest.slug; return rest; }); }}>Make unique</Button>
                    </div>
                  </Field>
                  {!isNew && (
                    <p className="flex items-start gap-2 text-[14px] text-accent">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      Changing this breaks links that people or Google already have to this product.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card step="2" id="photos" title="Photos" description="The first photo is the main one, shown on product cards. Add a few angles if you have them.">
          {errors.images && <div className="mb-3"><Notice type="error">{errors.images.text}</Notice></div>}
          <ImageManager value={form.images} onChange={(v) => set('images', v)} defaultAlt={form.name} userId={user?.id} />
        </Card>

        <Card step="3" title="Description">
          <div className="space-y-5">
            <Field label="Short description" hint="One sentence. Shown on product cards and in Google results.">
              <Input value={form.short_description} maxLength={200} onChange={(e) => set('short_description', e.target.value)} />
            </Field>
            <Field label="Full description" hint="A few sentences about what it is and what it’s used for.">
              <Textarea rows={5} value={form.full_description} onChange={(e) => set('full_description', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card step="4" title="Specifications" description="Shown as a table on the product page.">
          <SpecsEditor value={form.specs} onChange={(v) => set('specs', v)} />
        </Card>

        <Card step="5" title="Features and uses">
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] mb-2">Features</h3>
              <ListEditor label="feature" value={form.features} onChange={(v) => set('features', v)} placeholder="e.g. Fast heat-up" addLabel="Add a feature" />
            </div>
            <div>
              <h3 className="text-[16px] mb-2">Where it’s used (applications)</h3>
              <ListEditor label="application" value={form.applications} onChange={(v) => set('applications', v)} placeholder="e.g. Injection moulding" addLabel="Add an application" />
            </div>
          </div>
        </Card>

        <Card step="6" title="Search words" description="Other names and spellings customers might type, e.g. “geyser element”, “thermocupal”. They help the website’s search find this product.">
          <ListEditor chips label="search word" value={form.keywords} onChange={(v) => set('keywords', v)} placeholder="e.g. immersion rod, water heater" addLabel="Add search words" />
        </Card>

        <Card step="7" title="Related products" description="Shown at the bottom of this product’s page.">
          <RelatedPicker value={form.related} onChange={(v) => set('related', v)} products={products} selfId={form.id} categoryId={form.category_id} />
        </Card>

        <details className="bg-white border border-black/10 group">
          <summary className="flex items-center gap-3 px-4 sm:px-5 min-h-14 cursor-pointer list-none">
            <span className="inline-flex items-center justify-center w-7 h-7 shrink-0 bg-[#ececec] text-primary text-[14px] font-heading" aria-hidden="true">8</span>
            <span className="flex-1">
              <span className="block text-[18px] font-heading">Google settings <span className={`font-normal text-[15px] ${MUTED}`}>(optional)</span></span>
              <span className={`block text-[14px] ${MUTED}`}>Leave empty — sensible text is used automatically.</span>
            </span>
            <span className="text-[14px] underline underline-offset-4 group-open:hidden">Show</span>
            <span className="text-[14px] underline underline-offset-4 hidden group-open:inline">Hide</span>
          </summary>
          <div className="p-4 sm:p-5 border-t border-black/10 space-y-5">
            <Field label="Title in Google" hint={`If empty: “${form.name || 'Product name'} | ${category?.name || 'Category'} | Indus Heaters”. Up to 70 characters.`}>
              <Input value={form.seo_title} maxLength={70} onChange={(e) => set('seo_title', e.target.value)} />
            </Field>
            <Field label="Description in Google" hint="If empty, the short description is used. Up to 170 characters.">
              <Textarea rows={3} maxLength={170} value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
            </Field>
          </div>
        </details>
      </div>

      {/* Save bar — always visible at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 z-30 bg-white border-t border-black/15 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-4 sm:px-8 py-3">
        <div className="max-w-3xl flex flex-wrap items-center justify-end gap-2">
          <span className="mr-auto text-[14px] flex items-center gap-2" role="status">
            <span className={`w-2.5 h-2.5 ${dirty ? 'bg-accent' : 'bg-[#2e7d32]'}`} aria-hidden="true" />
            {saving ? 'Saving…' : dirty || isNew ? 'Not saved yet' : 'All changes saved'}
          </span>
          {form.status === 'published' ? (
            <Button type="submit" loading={saving} disabled={!dirty && !isNew}>
              <Save className="w-4 h-4" aria-hidden="true" /> {wasLive ? 'Save changes' : 'Save and publish'}
            </Button>
          ) : (
            <>
              <Button type="submit" variant="secondary" loading={saving} disabled={!dirty && !isNew}>
                <Save className="w-4 h-4" aria-hidden="true" /> {form.status === 'draft' ? 'Save draft' : 'Save'}
              </Button>
              <Button onClick={() => save('published')} loading={saving}>
                <Globe className="w-4 h-4" aria-hidden="true" /> Publish to website
              </Button>
            </>
          )}
        </div>
      </div>

      <Toast toast={toast} onClose={closeToast} />
    </form>
  );
}
