import { useId } from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { moveItem } from '../lib/listUtils';
import { IconButton, MUTED, Select } from './ui';

const MAX = 3;

// Choose up to 3 products shown under "Related products" on the product page
export default function RelatedPicker({ value, onChange, products, selfId, categoryId }) {
  const selectId = useId();
  const byId = new Map(products.map((p) => [p.id, p]));
  const options = products.filter((p) => p.id !== selfId && !value.includes(p.id));
  const sameCategory = options.filter((p) => p.category?.id === categoryId);
  const others = options.filter((p) => p.category?.id !== categoryId);

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className={`text-[14px] ${MUTED}`}>None chosen. Up to 3 products can be shown.</p>}
      {value.length > 0 && (
        <ol className="border border-black/10 divide-y divide-black/10">
          {value.map((id, i) => (
            <li key={id} className="flex items-center gap-1 pl-3 text-[15px]">
              <span className="flex-1 py-2">{byId.get(id)?.name || 'Product no longer available'}</span>
              <IconButton label="Move up" icon={<ArrowUp className="w-4 h-4" />} disabled={i === 0} onClick={() => onChange(moveItem(value, i, i - 1))} />
              <IconButton label="Move down" icon={<ArrowDown className="w-4 h-4" />} disabled={i === value.length - 1} onClick={() => onChange(moveItem(value, i, i + 1))} />
              <IconButton label={`Remove ${byId.get(id)?.name || 'product'}`} icon={<X className="w-4 h-4" />} onClick={() => onChange(value.filter((v) => v !== id))} />
            </li>
          ))}
        </ol>
      )}
      {value.length < MAX && (
        <div>
          <label htmlFor={selectId} className="block text-[15px] font-heading mb-1.5">Add a related product</label>
          <Select id={selectId} value="" onChange={(e) => e.target.value && onChange([...value, e.target.value])}>
            <option value="">Choose a product… ({MAX - value.length} more allowed)</option>
            {sameCategory.length > 0 && (
              <optgroup label="Same category">
                {sameCategory.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            )}
            <optgroup label="Other categories">
              {others.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.category?.name}</option>)}
            </optgroup>
          </Select>
        </div>
      )}
    </div>
  );
}
