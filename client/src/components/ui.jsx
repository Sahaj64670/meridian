import { clsx } from 'clsx';
import { Star, StarHalf, PackageSearch } from 'lucide-react';
import { formatINR } from '../lib/api';

export const Spinner = ({ className }) => (
  <span
    className={clsx(
      'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent',
      className
    )}
    aria-label="Loading"
  />
);

export const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-brand-700">
    <Spinner className="h-8 w-8" />
  </div>
);

export const Price = ({ price, compareAtPrice, size = 'md', className }) => (
  <span className={clsx('flex items-baseline gap-2', className)}>
    <span
      className={clsx(
        'font-bold text-ink',
        size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-lg' : 'text-sm'
      )}
    >
      {formatINR(price)}
    </span>
    {compareAtPrice > price && (
      <>
        <span className={clsx('text-ink-faint line-through', size === 'lg' ? 'text-lg' : 'text-xs')}>
          {formatINR(compareAtPrice)}
        </span>
        <span
          className={clsx(
            'rounded-full bg-brand-50 px-2 py-0.5 font-bold text-brand-700',
            size === 'lg' ? 'text-xs' : 'text-[10px]'
          )}
        >
          {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% OFF
        </span>
      </>
    )}
  </span>
);

export const RatingStars = ({ average = 0, count, size = 14, className }) => (
  <span className={clsx('flex items-center gap-1.5', className)}>
    <span className="flex text-gold-400">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(average - i + 1, 0), 1);
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-ink/15" fill="currentColor" />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={size} className="text-gold-400" fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
    </span>
    <span className="text-xs font-semibold text-ink-soft">{average.toFixed(1)}</span>
    {count !== undefined && <span className="text-xs text-ink-faint">({count.toLocaleString('en-IN')})</span>}
  </span>
);

export const Badge = ({ children, tone = 'brand', className }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
      {
        brand: 'bg-brand-800 text-white',
        gold: 'bg-gold-400 text-brand-950',
        soft: 'bg-brand-50 text-brand-800',
        danger: 'bg-red-50 text-red-700',
        slate: 'bg-ink/5 text-ink-soft',
      }[tone],
      className
    )}
  >
    {children}
  </span>
);

export const EmptyState = ({ icon: Icon = PackageSearch, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-center animate-rise">
    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
      <Icon size={28} />
    </span>
    <h3 className="font-display text-xl font-semibold">{title}</h3>
    {subtitle && <p className="max-w-sm text-sm text-ink-faint">{subtitle}</p>}
    {action}
  </div>
);

export const SectionHeading = ({ eyebrow, title, subtitle, right }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-xl text-sm text-ink-faint">{subtitle}</p>}
    </div>
    {right}
  </div>
);

export const ProductSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="skeleton aspect-square w-full rounded-none" />
    <div className="space-y-2 p-4">
      <div className="skeleton h-3 w-1/3" />
      <div className="skeleton h-4 w-4/5" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  </div>
);

export const QtyStepper = ({ value, onChange, max = 10, small }) => (
  <div
    className={clsx(
      'inline-flex items-center rounded-full border border-ink/15 bg-white',
      small ? 'text-xs' : 'text-sm'
    )}
  >
    <button
      type="button"
      onClick={() => onChange(Math.max(1, value - 1))}
      className={clsx('font-bold text-ink-soft transition hover:text-brand-800', small ? 'px-2.5 py-1' : 'px-3.5 py-1.5')}
      aria-label="Decrease quantity"
    >
      −
    </button>
    <span className={clsx('min-w-[1.5rem] text-center font-semibold', small ? 'min-w-[1.25rem]' : 'min-w-[2rem]')}>
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      className={clsx('font-bold text-ink-soft transition hover:text-brand-800', small ? 'px-2.5 py-1' : 'px-3.5 py-1.5')}
      aria-label="Increase quantity"
    >
      +
    </button>
  </div>
);
