import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Loader2, Search, Trash2, Package, FolderTree } from 'lucide-react';
import { useAdminAuth, isOwner } from '../authContext';
import { listLibrary, updateMediaAlt, deleteMediaForever, uploadImage, friendlyError } from '../lib/api';
import { ACCEPT_ATTR } from '../lib/images';
import { Button, EmptyState, Field, Input, MUTED, Notice, PageHeader, Segmented, Spinner, StatusBadge, Toast } from '../components/ui';

const kb = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const MAX_AT_ONCE = 12;

function PhotoCard({ photo, owner, onSaved, onDeleted }) {
  const [alt, setAlt] = useState(photo.alt_text || '');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const changed = alt.trim() !== (photo.alt_text || '').trim();
  const unused = photo.usedBy.length === 0;

  const save = async () => {
    setSaving(true); setError('');
    try { await updateMediaAlt(photo.id, alt); onSaved('Photo description saved.'); }
    catch (e) { setError(friendlyError(e)); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    setSaving(true); setError('');
    try { await deleteMediaForever(photo); onDeleted(`“${photo.original_filename || 'Photo'}” deleted forever.`); }
    catch (e) { setError(friendlyError(e)); setSaving(false); }
  };

  return (
    <li className={`bg-white border ${unused ? 'border-dashed border-[#8a8a8a]' : 'border-black/10'} flex flex-col`}>
      <a href={photo.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square bg-white p-2 border-b border-black/10">
        <img src={photo.url} alt={photo.alt_text || ''} loading="lazy" className="w-full h-full object-contain" />
        <span className="sr-only">Open full size (new tab)</span>
        {unused && <span className="absolute top-0 left-0 bg-primary text-white text-[13px] px-2 py-0.5">Not used</span>}
      </a>
      <div className="p-3 flex-1 flex flex-col gap-3">
        <div>
          <div className="text-[14px] font-heading break-all">{photo.original_filename || photo.path.split('/').pop()}</div>
          <div className={`text-[13px] ${MUTED}`}>
            {photo.width && photo.height ? `${photo.width} × ${photo.height} px · ` : ''}{photo.size_bytes ? kb(photo.size_bytes) : ''}
          </div>
        </div>

        <div className="text-[14px]">
          {unused ? (
            <p className={MUTED}>Not used on any product or category.</p>
          ) : (
            <>
              <div className={`text-[13px] ${MUTED} mb-1`}>Used on:</div>
              <ul className="space-y-1">
                {photo.usedBy.map((u) => (
                  <li key={`${u.kind}-${u.id}`} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {u.kind === 'product' ? <Package className="w-4 h-4 shrink-0" aria-hidden="true" /> : <FolderTree className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    <Link to={u.kind === 'product' ? `/admin/products/${u.id}` : '/admin/categories'} className="underline underline-offset-2 hover:text-accent min-h-8 inline-flex items-center">
                      {u.name}
                    </Link>
                    {u.kind === 'category' && <span className={`text-[13px] ${MUTED}`}>(category tile)</span>}
                    {u.kind === 'product' && !u.trashed && u.status !== 'published' && <StatusBadge status={u.status} />}
                    {u.trashed && <span className="text-[13px] text-accent">(in Trash)</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Field label="What does the photo show?" hint="Used by Google and screen readers when no other description is given.">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Spring coil heaters" />
        </Field>
        {changed && <Button variant="secondary" loading={saving} onClick={save}>Save description</Button>}
        {error && <Notice type="error">{error}</Notice>}

        {owner && unused && (
          <div className="mt-auto pt-2 border-t border-black/10">
            {!confirming ? (
              <Button variant="quiet" className="w-full" onClick={() => setConfirming(true)}>
                <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete forever
              </Button>
            ) : (
              <div className="space-y-2" role="alertdialog" aria-label="Delete this photo forever?">
                <p className="text-[14px]"><strong>Delete this photo forever?</strong> It can’t be brought back.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger" loading={saving} onClick={remove} autoFocus>Yes, delete</Button>
                  <Button variant="secondary" onClick={() => setConfirming(false)}>No, keep it</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function Photos() {
  const { role, user } = useAdminAuth();
  const owner = isOwner(role);
  const [photos, setPhotos] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [uploading, setUploading] = useState(0);
  const [notes, setNotes] = useState([]);
  const [toast, setToast] = useState(null);
  const [reload, setReload] = useState(0);
  const inputRef = useRef(null);
  const closeToast = useCallback(() => setToast(null), []);
  const refresh = useCallback((text) => { if (text) setToast({ text }); setReload((n) => n + 1); }, []);

  useEffect(() => {
    let alive = true;
    listLibrary().then((p) => alive && setPhotos(p)).catch((e) => alive && setError(friendlyError(e)));
    return () => { alive = false; };
  }, [reload]);

  const counts = useMemo(() => ({
    all: photos?.length || 0,
    used: photos?.filter((p) => p.usedBy.length).length || 0,
    unused: photos?.filter((p) => !p.usedBy.length).length || 0,
  }), [photos]);

  const visible = useMemo(() => {
    if (!photos) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return photos.filter((p) => {
      if (filter === 'used' && !p.usedBy.length) return false;
      if (filter === 'unused' && p.usedBy.length) return false;
      if (!words.length) return true;
      const hay = [p.original_filename, p.path, p.alt_text, ...p.usedBy.map((u) => u.name)].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [photos, filter, q]);

  const upload = async (fileList) => {
    const chosen = Array.from(fileList || []);
    const files = chosen.slice(0, MAX_AT_ONCE);
    if (!files.length) return;
    setNotes([]); setUploading(files.length);
    const out = [];
    if (chosen.length > MAX_AT_ONCE) out.push({ type: 'info', text: `The first ${MAX_AT_ONCE} of ${chosen.length} photos were added — add the rest in a second go.` });
    let added = 0;
    for (const f of files) {
      try {
        const r = await uploadImage(f, { userId: user?.id });
        if (r.reused) out.push({ type: 'info', text: `${f.name} is already in the library, so it wasn’t added again.` });
        else added++;
      } catch (e) {
        out.push({ type: 'error', text: friendlyError(e) });
      }
      setUploading((n) => n - 1);
    }
    if (inputRef.current) inputRef.current.value = '';
    setNotes(out);
    refresh(added ? `${added} photo${added === 1 ? '' : 's'} added to the library.` : '');
  };

  return (
    <>
      <PageHeader
        title="Photos"
        subtitle="Every photo on your website, and where each one is used."
        actions={(
          <label className={`inline-flex items-center gap-2 min-h-11 px-5 cursor-pointer text-[15px] font-heading ${uploading ? 'bg-white text-primary border border-[#8a8a8a]' : 'bg-accent text-white hover:bg-[#b5161b]'} focus-within:outline focus-within:outline-3 focus-within:outline-accent focus-within:outline-offset-2`}>
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-accent" aria-hidden="true" /> : <Camera className="w-5 h-5" aria-hidden="true" />}
            {uploading ? `Uploading ${uploading}…` : 'Add photos'}
            <input ref={inputRef} type="file" accept={ACCEPT_ATTR} multiple className="sr-only" disabled={uploading > 0} onChange={(e) => upload(e.target.files)} />
          </label>
        )}
      />

      <div className="space-y-2 mb-4" aria-live="polite">
        {notes.map((n, i) => <Notice key={i} type={n.type}>{n.text}</Notice>)}
        <Notice type="error" title="Something went wrong" onClose={() => setError('')}>{error}</Notice>
      </div>

      <div className="bg-white border border-black/10 p-4 mb-4 space-y-4">
        <Field label="Search photos" htmlFor="photo-search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#767676] pointer-events-none" aria-hidden="true" />
            <Input id="photo-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="File name, description or product" style={{ paddingLeft: '2.5rem' }} />
          </div>
        </Field>
        <Segmented label="Show" value={filter} onChange={setFilter} options={[
          { value: '', label: 'All', count: counts.all },
          { value: 'used', label: 'Used', count: counts.used },
          { value: 'unused', label: 'Not used', count: counts.unused },
        ]} />
        {counts.unused > 0 && filter !== 'unused' && (
          <p className={`text-[14px] ${MUTED}`}>
            {counts.unused} photo{counts.unused === 1 ? ' isn’t' : 's aren’t'} used anywhere.{' '}
            <button type="button" className="underline underline-offset-2 hover:text-accent min-h-8" onClick={() => setFilter('unused')}>Show them</button>
            {owner ? ' — you can delete them to keep the library tidy.' : '.'}
          </p>
        )}
      </div>

      {!photos && !error && <Spinner label="Loading photos…" />}
      {photos && visible.length === 0 && (
        <EmptyState title={photos.length ? 'No photos match' : 'No photos yet'}>
          {photos.length ? 'Try another word or show all photos.' : 'Photos you add to products, categories or here will appear in this library.'}
        </EmptyState>
      )}
      {visible.length > 0 && (
        <>
          <p className={`mb-2 text-[14px] ${MUTED}`} role="status">Showing {visible.length} of {photos.length} photos</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((p) => <PhotoCard key={p.id + (p.alt_text || '')} photo={p} owner={owner} onSaved={refresh} onDeleted={refresh} />)}
          </ul>
        </>
      )}
      {!owner && photos && (
        <p className={`mt-6 text-[14px] ${MUTED} flex items-center gap-2`}>
          Only the owner can delete photos that aren’t used.
        </p>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
