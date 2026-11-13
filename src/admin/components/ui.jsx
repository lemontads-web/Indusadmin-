// Building blocks for the admin panel.
// Rules: every control ≥ 44 px, text ≥ 14 px (inputs 16 px), WCAG AA contrast,
// words on buttons (not just icons), plain language.
import { useEffect, useId, cloneElement, isValidElement } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { MUTED, FIELD_BORDER, STATUS } from '../lib/tokens';

export { MUTED, STATUS };


const base = 'inline-flex items-center justify-center gap-2 min-h-11 px-5 text-[15px] font-heading transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none';
const variants = {
  primary: 'bg-accent text-white hover:bg-[#b5161b] disabled:bg-[#e4e4e4] disabled:text-[#666666] disabled:opacity-100',
  secondary: `bg-white text-primary border ${FIELD_BORDER} hover:border-accent hover:text-accent`,
  danger: 'bg-white text-accent border border-accent hover:bg-accent hover:text-white',
  quiet: 'text-primary hover:text-accent hover:bg-accent/5 px-3',
};

export function Button({ variant = 'primary', loading = false, className = '', children, ...props }) {
  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant = 'primary', className = '', children, ...props }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</Link>;
}

// Square 44×44 button with an icon. `label` is read out by screen readers and shown as a tooltip;
// pass `showLabel` to also print the word next to the icon.
export function IconButton({ label, showLabel = false, icon, className = '', ...props }) {
  return (
    <button type="button" aria-label={showLabel ? undefined : label} title={label}
      className={`inline-flex items-center justify-center gap-1.5 min-w-11 min-h-11 ${showLabel ? 'px-3' : ''} text-[14px] text-primary hover:text-accent hover:bg-accent/5 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary ${className}`}
      {...props}>
      {icon}
      {showLabel && <span>{label}</span>}
    </button>
  );
}

// A labelled form field. The hint and error are linked to the input for screen readers.
// Pass `htmlFor` when the input is wrapped in another element (it then needs that id itself).
export function Field({ label, hint, error, required, children, className = '', htmlFor }) {
  const autoId = useId();
  const id = htmlFor || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = !htmlFor && isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || id,
        'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })
    : children;
  return (
    <div className={className}>
      <label htmlFor={htmlFor || children?.props?.id || id} className="block text-[15px] font-heading text-primary mb-1.5">
        {label}{required && <span className={`font-normal ${MUTED}`}> (required)</span>}
      </label>
      {control}
      {hint && <p id={hintId} className={`mt-1.5 text-[14px] ${MUTED}`}>{hint}</p>}
      {error && (
        <p id={errorId} className="mt-1.5 text-[14px] text-accent flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

const inputBase = `w-full min-h-11 border ${FIELD_BORDER} bg-white px-3 py-2 text-base text-primary placeholder:text-[#767676] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 aria-[invalid=true]:border-accent`;

export function Input(props) {
  return <input className={inputBase} {...props} />;
}

export function Textarea({ rows = 4, ...props }) {
  return <textarea rows={rows} className={`${inputBase} resize-y`} {...props} />;
}

export function Select({ children, className = '', ...props }) {
  return <select className={`${inputBase} pr-8 ${className}`} {...props}>{children}</select>;
}

export function Card({ title, step, description, actions, children, className = '', id }) {
  return (
    <section id={id} className={`bg-white border border-black/10 ${className}`} aria-labelledby={title ? `${id || title}-title` : undefined}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 pb-3 border-b border-black/10">
          <div className="flex items-start gap-3">
            {step && (
              <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 shrink-0 bg-accent text-white text-[14px] font-heading" aria-hidden="true">{step}</span>
            )}
            <div>
              {title && <h2 id={`${id || title}-title`} className="text-[18px] text-primary">{title}</h2>}
              {description && <p className={`text-[14px] ${MUTED} mt-0.5`}>{description}</p>}
            </div>
          </div>
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, docTitle }) {
  useEffect(() => {
    document.title = `${docTitle || title} · Indus Heaters admin`;
  }, [title, docTitle]);
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[26px] sm:text-[30px] text-primary">{title}</h1>
        {subtitle && <p className={`mt-1 text-[15px] ${MUTED}`}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}


export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.draft;
  return <span className={`inline-flex items-center px-2 py-0.5 text-[13px] font-heading whitespace-nowrap ${s.badge}`}>{s.label}</span>;
}

const NOTICE = {
  error: { cls: 'border-accent bg-accent/5 text-primary', Icon: AlertTriangle, iconCls: 'text-accent' },
  success: { cls: 'border-[#2e7d32]/40 bg-[#2e7d32]/5 text-primary', Icon: CheckCircle2, iconCls: 'text-[#2e7d32]' },
  info: { cls: 'border-black/15 bg-white text-primary', Icon: Info, iconCls: 'text-primary' },
};

export function Notice({ type = 'info', children, onClose, title }) {
  if (!children) return null;
  const { cls, Icon, iconCls } = NOTICE[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 border-l-4 border px-4 py-3 text-[15px] ${cls}`}>
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconCls}`} aria-hidden="true" />
      <div className="flex-1">
        {title && <div className="font-heading">{title}</div>}
        {children}
      </div>
      {onClose && <IconButton label="Close message" icon={<X className="w-4 h-4" />} onClick={onClose} className="-m-2" />}
    </div>
  );
}

// Short message at the bottom of the screen, optionally with an action like "Undo"
export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onClose, toast.action ? 10000 : 5000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  return (
    <div className="fixed inset-x-0 bottom-20 md:bottom-6 z-50 flex justify-center px-4 pointer-events-none" aria-live="polite">
      {toast && (
        <div className="pointer-events-auto flex items-center gap-3 bg-primary text-white pl-4 pr-1 py-1 shadow-lg max-w-lg w-full sm:w-auto">
          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-[15px] py-2">{toast.text}</span>
          {toast.action && (
            <button type="button" onClick={() => { toast.action.onClick(); onClose(); }}
              className="min-h-11 px-3 font-heading text-[15px] underline underline-offset-4 hover:text-white/80">
              {toast.action.label}
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close message" className="min-w-11 min-h-11 inline-flex items-center justify-center hover:text-white/80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Row of filter buttons ("All · On website · Draft · Hidden")
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`min-h-11 px-4 text-[15px] border transition-colors ${value === o.value
            ? 'bg-primary text-white border-primary'
            : `bg-white text-primary ${FIELD_BORDER} hover:border-accent hover:text-accent`}`}>
          {o.label}{typeof o.count === 'number' && <span className={value === o.value ? 'text-white/80' : MUTED}> ({o.count})</span>}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className={`flex items-center gap-3 py-12 justify-center text-[15px] ${MUTED}`} role="status">
      <Loader2 className="w-5 h-5 animate-spin text-accent" aria-hidden="true" /> {label}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="border border-dashed border-[#8a8a8a] bg-white py-10 px-6 text-center">
      {title && <div className="text-[17px] font-heading text-primary mb-1">{title}</div>}
      <p className={`text-[15px] ${MUTED} max-w-md mx-auto`}>{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
