import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X, Camera, Loader2, Star } from 'lucide-react';
import { uploadImage, friendlyError } from '../lib/api';
import { ACCEPT_ATTR } from '../lib/images';
import { moveItem } from '../lib/listUtils';
import { IconButton, MUTED, Notice } from './ui';

// Photos of one item. value: [{ media_id, url, alt_text }]; the first one is the main photo.
export default function ImageManager({ value, onChange, defaultAlt = '', userId, single = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(0);
  const [messages, setMessages] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, single ? 1 : 12);
    if (!files.length) return;
    setMessages([]);
    setBusy(files.length);
    let next = single ? [] : [...value];
    const notes = [];
    for (const file of files) {
      try {
        const img = await uploadImage(file, { altText: defaultAlt, userId });
        if (next.some((v) => v.media_id === img.media_id)) {
          notes.push({ type: 'info', text: `${file.name} is already on this item, so it was skipped.` });
        } else {
          next = [...next, img];
          if (img.reused) notes.push({ type: 'info', text: `${file.name} was already in your photo library, so the existing copy was used.` });
        }
      } catch (e) {
        notes.push({ type: 'error', text: friendlyError(e) });
      }
      setBusy((n) => n - 1);
    }
    onChange(next);
    setMessages(notes);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <ul className={`grid gap-3 ${single ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`} aria-label="Photos">
          {value.map((img, i) => {
            const isMain = i === 0 && !single;
            return (
              <li key={img.media_id} className={`bg-white border-2 ${isMain ? 'border-accent' : 'border-black/10'} flex sm:flex-col`}>
                {/* Phone: small photo on the left. Bigger screens: photo on top. */}
                <div className="relative w-28 sm:w-auto shrink-0 aspect-square bg-white p-1.5 sm:p-2 border-r sm:border-r-0 sm:border-b border-black/10">
                  <img src={img.url} alt={img.alt_text || defaultAlt} className="w-full h-full object-contain" />
                  {isMain && (
                    <span className="absolute top-0 left-0 inline-flex items-center gap-1 bg-accent text-white text-[12px] sm:text-[13px] px-1.5 py-0.5">
                      <Star className="w-3 h-3" aria-hidden="true" /> Main
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 p-2 space-y-1">
                  <label className="block">
                    <span className={`block text-[13px] ${MUTED} mb-1`}>What does it show?</span>
                    <input
                      className="w-full min-h-11 border border-[#8a8a8a] px-2 text-[15px] focus:border-accent focus:outline-none"
                      placeholder={defaultAlt || 'e.g. Spring coil heaters'}
                      value={img.alt_text}
                      onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, alt_text: e.target.value } : v)))}
                    />
                  </label>
                  <div className="flex flex-wrap items-center">
                    {!single && (
                      <>
                        <IconButton label="Move earlier" icon={<ArrowLeft className="w-4 h-4" />} disabled={i === 0} onClick={() => onChange(moveItem(value, i, i - 1))} />
                        <IconButton label="Move later" icon={<ArrowRight className="w-4 h-4" />} disabled={i === value.length - 1} onClick={() => onChange(moveItem(value, i, i + 1))} />
                        <IconButton label="Make this the main photo" icon={<Star className="w-4 h-4" />} disabled={i === 0} onClick={() => onChange(moveItem(value, i, 0))} />
                      </>
                    )}
                    <IconButton label="Remove photo" icon={<X className="w-4 h-4" />} className="ml-auto" onClick={() => onChange(value.filter((_, j) => j !== i))} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed ${dragOver ? 'border-accent bg-accent/5' : 'border-[#8a8a8a] bg-[#fafafa]'} p-5 text-center`}
      >
        <label className={`inline-flex items-center justify-center gap-2 min-h-12 px-5 cursor-pointer text-[16px] font-heading ${busy > 0 ? 'bg-white text-primary' : 'bg-accent text-white hover:bg-[#b5161b]'} focus-within:outline focus-within:outline-3 focus-within:outline-accent focus-within:outline-offset-2`}>
          {busy > 0 ? <Loader2 className="w-5 h-5 animate-spin text-accent" aria-hidden="true" /> : <Camera className="w-5 h-5" aria-hidden="true" />}
          {busy > 0 ? `Uploading ${busy} photo${busy === 1 ? '' : 's'}…` : single ? (value.length ? 'Choose a different photo' : 'Choose a photo') : (value.length ? 'Add more photos' : 'Add photos')}
          <input ref={inputRef} type="file" accept={ACCEPT_ATTR} multiple={!single} className="sr-only"
                 disabled={busy > 0} onChange={(e) => handleFiles(e.target.files)} />
        </label>
        <p className={`mt-3 text-[14px] ${MUTED}`}>
          On a phone you can take a photo with the camera. On a computer you can also drag photos here.
          <br className="hidden sm:inline" /> JPG, PNG or WebP — big photos are made smaller automatically.
        </p>
      </div>

      <div aria-live="polite" className="space-y-2">
        {messages.map((m, i) => <Notice key={i} type={m.type}>{m.text}</Notice>)}
      </div>
    </div>
  );
}
