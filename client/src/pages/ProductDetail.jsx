import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Play,
  Camera,
} from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { Badge, Price, RatingStars, QtyStepper, PageLoader } from '../components/ui';
import ProductCard from '../components/ProductCard';
import { useCartStore } from '../store/cart';
import { toast } from '../store/toast';
import { clsx } from 'clsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api(`/products/${slug}`),
  });
  const related = useQuery({
    queryKey: ['related', slug],
    queryFn: () => api(`/products/${slug}/related`),
    enabled: !!data,
  });

  const product = data?.data;
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [color, setColor] = useState(product?.colors?.[0]?.name || '');
  const [mediaTab, setMediaTab] = useState('photo');

  const activeColor = color || product?.colors?.[0]?.name || '';
  const activeSize = size || product?.sizes?.[0] || '';

  if (isLoading) return <PageLoader />;
  if (isError || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Product not found</h1>
        <p className="mt-2 text-ink-faint">It may have been removed or the link is wrong.</p>
        <Link to="/shop" className="btn-primary mt-6 px-6 py-2.5 text-sm">Back to shop</Link>
      </div>
    );
  }

  const addToCart = (goCheckout = false) => {
    addItem(product, { qty, size: activeSize, color: activeColor });
    toast.success(`Added ${qty} × ${product.name} to cart`);
    if (goCheckout) navigate('/cart');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-ink-faint">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={12} />
        <Link to="/shop" className="hover:text-ink">Shop</Link>
        <ChevronRight size={12} />
        <Link to={`/shop?category=${product.category?.slug}`} className="hover:text-ink">
          {product.category?.name}
        </Link>
        <ChevronRight size={12} />
        <span className="truncate text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="animate-rise">
          {product.video && (
            <div className="mb-3 flex gap-2">
              {[
                { id: 'photo', label: 'Photo', icon: Camera },
                { id: 'video', label: 'Video', icon: Play },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMediaTab(id)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition',
                    mediaTab === id ? 'bg-brand-800 text-white shadow-card' : 'bg-white text-ink-soft hover:text-brand-800 border border-ink/10'
                  )}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}
          <div className="card relative overflow-hidden">
            {mediaTab === 'video' && product.video ? (
              <video
                key={product.video}
                src={product.video}
                poster={product.images?.[0]?.url}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="aspect-square w-full bg-black object-cover"
              />
            ) : (
              <img
                src={product.images?.[0]?.url || '/images/hero.jpg'}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            )}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {product.featured && <Badge tone="gold">Bestseller</Badge>}
              {product.discountPercent > 0 && <Badge tone="brand">{product.discountPercent}% off</Badge>}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[11px] font-medium text-ink-faint">
            <div className="card flex flex-col items-center gap-1.5 p-3"><Truck size={17} className="text-brand-700" />Free ship ₹1,499+</div>
            <div className="card flex flex-col items-center gap-1.5 p-3"><RotateCcw size={17} className="text-brand-700" />7-day returns</div>
            <div className="card flex flex-col items-center gap-1.5 p-3"><ShieldCheck size={17} className="text-brand-700" />1-year warranty</div>
          </div>
        </div>

        {/* Info */}
        <div className="animate-rise" style={{ animationDelay: '80ms' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
            {product.brand} · {product.category?.name}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {product.name}
          </h1>
          <div className="mt-3">
            <RatingStars average={product.rating?.average} count={product.rating?.count} size={16} />
          </div>

          <div className="mt-5">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            <p className="mt-1 text-xs text-ink-faint">Inclusive of all taxes</p>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">{product.description}</p>

          {product.highlights?.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand-600" /> {h}
                </li>
              ))}
            </ul>
          )}

          {/* Color */}
          {product.colors?.length > 0 && (
            <div className="mt-7">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-ink-faint">
                Colour — <span className="text-ink">{activeColor}</span>
              </p>
              <div className="flex gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    title={c.name}
                    className={clsx(
                      'h-9 w-9 rounded-full border-2 transition',
                      activeColor === c.name ? 'border-brand-700 ring-2 ring-brand-600/30' : 'border-ink/10 hover:border-ink/30'
                    )}
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-ink-faint">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={clsx(
                      'min-w-11 rounded-xl border px-3.5 py-2 text-sm font-semibold transition',
                      activeSize === s
                        ? 'border-brand-800 bg-brand-800 text-white'
                        : 'border-ink/15 bg-white text-ink-soft hover:border-brand-600'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + CTA */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} max={Math.min(10, product.stock || 1)} />
            {product.stock > 0 ? (
              <>
                <button onClick={() => addToCart(false)} className="btn-outline flex-1 px-6 py-3 text-sm sm:flex-none">
                  <ShoppingBag size={16} /> Add to cart
                </button>
                <button onClick={() => addToCart(true)} className="btn-primary flex-1 px-8 py-3 text-sm">
                  Buy now
                </button>
              </>
            ) : (
              <span className="rounded-full bg-ink/5 px-5 py-3 text-sm font-semibold text-ink-faint">
                Currently out of stock
              </span>
            )}
          </div>
          {product.stock > 0 && product.stock <= 5 && (
            <p className="mt-3 text-xs font-semibold text-red-600">
              Hurry — only {product.stock} unit{product.stock > 1 ? 's' : ''} left in stock.
            </p>
          )}

          {/* Specs */}
          {product.specs?.length > 0 && (
            <div className="mt-9 overflow-hidden rounded-2xl border border-ink/10">
              <p className="border-b border-ink/10 bg-brand-50/60 px-5 py-3 text-xs font-bold uppercase tracking-widest text-brand-800">
                Specifications
              </p>
              <dl>
                {product.specs.map((s, i) => (
                  <div
                    key={s.key}
                    className={clsx('flex justify-between gap-4 px-5 py-3 text-sm', i % 2 === 0 && 'bg-white')}
                  >
                    <dt className="text-ink-faint">{s.key}</dt>
                    <dd className="text-right font-medium">{s.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 px-5 py-3 text-sm">
                  <dt className="text-ink-faint">SKU</dt>
                  <dd className="font-medium">{product.sku || '—'}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.data?.data?.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl font-semibold">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.data.data.slice(0, 4).map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
