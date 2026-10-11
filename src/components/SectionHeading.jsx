export default function SectionHeading({
  label,
  title,
  subtitle,
  align = 'left',
  theme = 'on-white', // 'on-white' | 'on-red' | 'on-grey'
  action = null,
  className = '',
}) {
  const alignClasses = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  const labelColor = theme === 'on-white' ? 'text-accent' : 'text-white';
  const labelBarColor = theme === 'on-white' ? 'bg-accent' : 'bg-white';
  const titleColor = theme === 'on-white' ? 'text-primary' : 'text-white';
  const subtitleColor = theme === 'on-white' ? 'text-primary' : 'text-white/90';

  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 lg:mb-12 ${className}`}>
      <div className={`flex flex-col ${alignClasses}`}>
        {label && (
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-5 h-[2px] ${labelBarColor} shrink-0`} />
            <span className={`${labelColor} font-heading text-[11px] uppercase tracking-[0.25em] font-light`}>
              {label}
            </span>
          </div>
        )}
        {title && (
          <h2 className={`font-heading text-3xl sm:text-4xl lg:text-5xl font-light ${titleColor} uppercase tracking-tight leading-[1.25]`}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className={`mt-3 ${subtitleColor} text-sm sm:text-base max-w-2xl leading-[1.25] font-normal`}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="mt-4 md:mt-0 shrink-0">{action}</div>}
    </div>
  );
}
