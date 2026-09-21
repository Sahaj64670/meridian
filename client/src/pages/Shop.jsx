import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton, EmptyState, RatingStars } from '../components/ui';
import { clsx } from 'clsx';

const SORTS = [
  ['newest', 'Newest first'],
  ['popular', 'Most popular'],
  ['rating', 'Top rated'],
  ['price-asc', 'Price: low → high'],
  ['price-desc', 'Price: high → low'],
  ['discount', 'Biggest discount'],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);

  const get = (k, d = '') => params.get(k) ?? d;
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const query = {
    search: get('search'),
    category: get('category'),
    brand: get('brand'),
    minPrice: get('min'),
    maxPrice: get('max'),
    rating: get('rating'),
    sort: get('sort', 'newest'),
    page: get('page', '1'),
    limit: 12,
  };

  const products = useQuery({
    queryKey: ['products', query],
    queryFn: () => api('/products', { params: query }),
    placeholderData: (prev) => prev,
  });
  const meta = useQuery({ queryKey: ['filter-meta'], queryFn: () => api('/products/meta/filters') });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api('/categories') });

  const filterMeta = meta.data?.data;
  const brands = filterMeta?.brands || [];
  const activeBrands = get('brand') ? get('brand').split(',') : [];

  const toggleBrand = (b) => {
    const set = new Set(activeBrands);
    set.has(b) ? set.delete(b) : set.add(b);
    setParam('brand', [...set].join(','));
  };

  const activeFilterCount = ['category', 'brand', 'min', 'max', 'rating'].filter((k) => get(k)).length;

  const sidebar = (
    <div className="space-y-7">
      {/* Category */}
      <FilterBlock title="Category">
        <div className="space-y-1">
          <FilterLink active={!get('category')} to="/shop" label={`All categories`} />
          {(categories.data?.data || []).map((c) => (
            <FilterLink
              key={c.slug}
              active={get('category') === c.slug}
              to={`/shop?category=${c.slug}${get('search') ? `&search=${get('search')}` : ''}`}
              label={`${c.name}`}
              count={c.productCount}
            />
          ))}
        </div>
      </FilterBlock>

      {/* Price */}
      <FilterBlock title="Price">
        <div className="space-y-1.5">
          {[
            [0, 999, 'Under ₹999'],
            [1000, 2999, '₹1,000 – ₹2,999'],
            [3000, 9999, '₹3,000 – ₹9,999'],
            [10000, 999999, '₹10,000+'],
          ].map(([min, max, label]) => (
            <label key={label} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft hover:text-ink">
              <input
                type="radio"
                name="price"
                className="accent-brand-700"
                checked={get('min') === String(min) && get('max') === String(max)}
                onChange={() => {
                  setParam('min', min);
                  setParam('max', max);
                }}
              />
              {label}
            </label>
          ))}
          {(get('min') || get('max')) && (
            <button
              onClick={() => {
                setParam('min', '');
                setParam('max', '');
              }}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Clear price filter
            </button>
          )}
        </div>
      </FilterBlock>

      {/* Rating */}
      <FilterBlock title="Rating">
        <div className="space-y-1.5">
          {[4.5, 4, 3].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft hover:text-ink">
              <input
                type="radio"
                name="rating"
                className="accent-brand-700"
                checked={get('rating') === String(r)}
                onChange={() => setParam('rating', r)}
              />
              <RatingStars average={r} /> <span>& up</span>
            </label>
          ))}
        </div>
      </FilterBlock>

      {/* Brand */}
      {brands.length > 0 && (
        <FilterBlock title="Brand">
          <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {brands.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft hover:text-ink">
                <input
                  type="checkbox"
                  className="accent-brand-700"
                  checked={activeBrands.includes(b)}
                  onChange={() => toggleBrand(b)}
                />
                {b}
              </label>
            ))}
          </div>
        </FilterBlock>
      )}

      {activeFilterCount > 0 && (
        <Link to="/shop" className="btn-outline w-full py-2 text-xs">
          <X size={13} /> Clear all filters ({activeFilterCount})
        </Link>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <p className="eyebrow mb-1">Shop</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {get('search') ? `Results for “${get('search')}”` : get('category') ? categories.data?.data?.find((c) => c.slug === get('category'))?.name || 'Catalog' : 'All products'}
        </h1>
        <p className="mt-1 text-sm text-ink-faint">
          {products.data?.meta ? `${products.data.meta.total} products` : 'Loading catalog…'}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-8 pr-2">{sidebar}</div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button onClick={() => setMobileFilters(true)} className="btn-outline px-4 py-2 text-sm lg:hidden">
              <SlidersHorizontal size={15} /> Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-ink-faint sm:block">Sort by</span>
              <select
                value={get('sort', 'newest')}
                onChange={(e) => setParam('sort', e.target.value)}
                className="input w-auto cursor-pointer rounded-full py-2"
              >
                {SORTS.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {Array.from({ length: 9 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.data?.data?.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {products.data.data.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
              <Pagination meta={products.data.meta} page={Number(get('page', '1'))} onPage={(p) => setParam('page', p)} />
            </>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No products match those filters"
              subtitle="Try clearing a filter or searching for something broader."
              action={<Link to="/shop" className="btn-primary mt-2 px-6 py-2.5 text-sm">Clear everything</Link>}
            />
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-80 overflow-y-auto bg-paper p-6 shadow-lift animate-rise">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Filters</h2>
              <button onClick={() => setMobileFilters(false)} className="btn-ghost p-2"><X size={18} /></button>
            </div>
            {sidebar}
            <button onClick={() => setMobileFilters(false)} className="btn-primary mt-8 w-full py-3 text-sm">
              Show {products.data?.meta?.total ?? ''} products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const FilterBlock = ({ title, children }) => (
  <div>
    <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-faint">{title}</h3>
    {children}
  </div>
);

const FilterLink = ({ active, to, label, count }) => (
  <Link
    to={to}
    className={clsx(
      'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition',
      active ? 'bg-brand-800 font-semibold text-white' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
    )}
  >
    {label}
    {count !== undefined && <span className={clsx('text-xs', active ? 'text-white/70' : 'text-ink-faint')}>{count}</span>}
  </Link>
);

const Pagination = ({ meta, page, onPage }) => {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="btn-outline h-10 w-10 rounded-full p-0"
        aria-label="Previous page"
      >
        <ChevronLeft size={17} />
      </button>
      {Array.from({ length: meta.pages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onPage(i + 1)}
          className={clsx(
            'h-10 w-10 rounded-full text-sm font-semibold transition',
            page === i + 1 ? 'bg-brand-800 text-white' : 'text-ink-soft hover:bg-ink/5'
          )}
        >
          {i + 1}
        </button>
      ))}
      <button
        disabled={page >= meta.pages}
        onClick={() => onPage(page + 1)}
        className="btn-outline h-10 w-10 rounded-full p-0"
        aria-label="Next page"
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
};
