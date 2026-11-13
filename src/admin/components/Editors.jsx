import { useId, useState } from 'react';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { moveItem as move } from '../lib/listUtils';
import { Input, IconButton, MUTED } from './ui';

// List of short texts (features, applications) or "chips" (search words).
export function ListEditor({ value, onChange, placeholder = 'Type here', chips = false, label = 'item', addLabel }) {
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const add = () => {
    const parts = draft.split(chips ? /[,\n]/ : /\n/).map((s) => s.trim()).filter(Boolean);
    const fresh = parts.filter((p) => !value.some((v) => v.toLowerCase() === p.toLowerCase()));
    if (fresh.length) onChange([...value, ...fresh]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className={`text-[14px] ${MUTED}`}>Nothing added yet.</p>}

      {chips && value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={`${label}s added`}>
          {value.map((v, i) => (
            <li key={v + i} className="inline-flex items-center gap-1 bg-[#f1f1f1] border border-black/10 pl-3 text-[15px]">
              {v}
              <IconButton label={`Remove “${v}”`} icon={<X className="w-4 h-4" />} onClick={() => onChange(value.filter((_, j) => j !== i))} />
            </li>
          ))}
        </ul>
      )}

      {!chips && value.length > 0 && (
        <ol className="border border-black/10 divide-y divide-black/10">
          {value.map((v, i) => (
            <li key={i} className="flex items-center gap-1 pl-3">
              <span className={`text-[14px] ${MUTED} w-5 shrink-0`} aria-hidden="true">{i + 1}.</span>
              <input
                className="flex-1 min-w-0 min-h-11 text-base bg-transparent focus:outline-none focus:bg-accent/5 px-1"
                value={v}
                aria-label={`${label} ${i + 1}`}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
              />
              <IconButton label="Move up" icon={<ArrowUp className="w-4 h-4" />} disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))} />
              <IconButton label="Move down" icon={<ArrowDown className="w-4 h-4" />} disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))} />
              <IconButton label={`Remove ${label} ${i + 1}`} icon={<X className="w-4 h-4" />} onClick={() => onChange(value.filter((_, j) => j !== i))} />
            </li>
          ))}
        </ol>
      )}

      <div>
        <label htmlFor={inputId} className="sr-only">{addLabel || `Add ${label}`}</label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          />
          <button type="button" onClick={add} disabled={!draft.trim()}
            className="inline-flex items-center gap-1.5 min-h-11 px-4 border border-[#8a8a8a] text-[15px] hover:border-accent hover:text-accent disabled:opacity-40 shrink-0">
            <Plus className="w-4 h-4" aria-hidden="true" /> Add
          </button>
        </div>
        <p className={`mt-1.5 text-[13px] ${MUTED}`}>{chips ? 'Tip: add several at once by separating them with commas.' : 'Press Enter or “Add” after each one.'}</p>
      </div>
    </div>
  );
}

// Specification table: "what" + "value" rows
export function SpecsEditor({ value, onChange }) {
  const update = (i, key, v) => onChange(value.map((row, j) => (j === i ? { ...row, [key]: v } : row)));
  return (
    <div className="space-y-3">
      {value.length === 0 && <p className={`text-[14px] ${MUTED}`}>No specifications yet. Add rows like “Operating temperature — Up to 450°C”.</p>}
      {value.length > 0 && (
        <div className="border border-black/10 divide-y divide-black/10">
          <div className={`hidden sm:grid grid-cols-[2fr_3fr_auto] gap-2 px-3 py-2 text-[13px] ${MUTED} bg-[#fafafa]`} aria-hidden="true">
            <span>What</span><span>Value</span><span className="w-[132px]" />
          </div>
          {value.map((row, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[2fr_3fr_auto] gap-2 p-2 sm:px-3">
              <Input placeholder="e.g. Operating temperature" value={row.label} aria-label={`Row ${i + 1}: what`}
                onChange={(e) => update(i, 'label', e.target.value)} />
              <Input placeholder="e.g. Up to 450°C" value={row.value} aria-label={`Row ${i + 1}: value`}
                onChange={(e) => update(i, 'value', e.target.value)} />
              <div className="flex justify-end">
                <IconButton label="Move up" icon={<ArrowUp className="w-4 h-4" />} disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))} />
                <IconButton label="Move down" icon={<ArrowDown className="w-4 h-4" />} disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))} />
                <IconButton label={`Remove row ${i + 1}`} icon={<X className="w-4 h-4" />} onClick={() => onChange(value.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => onChange([...value, { label: '', value: '' }])}
        className="inline-flex items-center gap-1.5 min-h-11 px-4 border border-[#8a8a8a] text-[15px] hover:border-accent hover:text-accent">
        <Plus className="w-4 h-4" aria-hidden="true" /> Add a row
      </button>
    </div>
  );
}
