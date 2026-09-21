import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Tag, ArrowRight, ShieldCheck } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { useCartStore } from '../store/cart';
import { EmptyState, QtyStepper } from '../components/ui';
import { toast } from '../store/toast';

const FREE_SHIP = 1499;

export default function Cart() {
  const navigate = useNavigate();
  const { items, setQty, removeItem, subtotal, coupon, setCoupon } = useCartStore();
  const [code, setCode] = useState(coupon?.code || '');
  const [checking, setChecking] = useState(false);

  const sub = subtotal();
  const discount = coupon?.discount || 0;
  const shipping = sub - discount >= FREE_SHIP || sub === 0 ? 0 : 79;
  const total = Math.max(0, sub - discount + shipping);
  const toFreeShip = Math.max(0, FREE_SHIP - (sub - discount));

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    try {
      const res = await api('/coupons/validate', { method: 'POST', body: { code, subtotal: sub } });
      setCoupon({
        code: res.data.couponCode,
        description: res.data.couponDescription,
        discount: res.data.discount,
        freeShipping: res.data.shipping === 0 && sub < FREE_SHIP,
      });
      toast.success(res.message || 'Coupon applied');
    } catch (err) {
      setCoupon(null);
      toast.error(err.message);
    } finally {
      setChecking(false);
    }
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is feeling light"
          subtitle="Browse the catalog and add something you'll love — free shipping kicks in at ₹1,499."
          action={<Link to="/shop" className="btn-primary mt-2 px-7 py-3 text-sm">Start shopping <ArrowRight size={15} /></Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Your cart</h1>
      <p className="mt-1 text-sm text-ink-faint">{items.length} line item{items.length > 1 ? 's' : ''} · review before checkout</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Lines */}
        <div className="space-y-4">
          {toFreeShip > 0 && (
            <div className="card flex items-center gap-3 border-l-4 border-l-gold-400 p-4 text-sm">
              <Truck />
              <p>
                Add <strong>{formatINR(toFreeShip)}</strong> more to unlock{' '}
                <strong className="text-brand-800">free shipping</strong>.
              </p>
            </div>
          )}
          {items.map((item) => (
            <div key={item.key} className="card flex gap-4 p-4 animate-rise">
              <Link to={`/product/${item.product.slug}`} className="shrink-0">
                <img
                  src={item.product.images?.[0]?.url || '/images/hero.jpg'}
                  alt={item.product.name}
                  className="h-24 w-24 rounded-xl object-cover md:h-28 md:w-28"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">{item.product.brand}</p>
                    <Link to={`/product/${item.product.slug}`} className="mt-0.5 block truncate font-semibold hover:text-brand-800">
                      {item.product.name}
                    </Link>
                    {(item.size || item.color) && (
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    className="btn-ghost shrink-0 p-2 text-ink-faint hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <QtyStepper small value={item.qty} onChange={(v) => setQty(item.key, v)} max={Math.min(10, item.product.stock || 10)} />
                  <p className="font-bold">{formatINR(item.product.price * item.qty)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit space-y-4 lg:sticky lg:top-32">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold">Order summary</h2>

            <form onSubmit={applyCoupon} className="mt-4">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-ink-faint">Coupon code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MERIDIAN10" className="input pl-9" />
                </div>
                <button className="btn-outline px-4 py-2 text-sm" disabled={checking}>
                  {checking ? 'Checking…' : 'Apply'}
                </button>
              </div>
              {coupon && (
                <p className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-brand-700">
                    ✓ {coupon.code} — {coupon.description}
                  </span>
                  <button type="button" onClick={() => { setCoupon(null); setCode(''); }} className="text-ink-faint hover:text-red-600">
                    Remove
                  </button>
                </p>
              )}
            </form>

            <dl className="mt-5 space-y-2.5 border-t border-ink/10 pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-faint">Subtotal</dt><dd className="font-semibold">{formatINR(sub)}</dd></div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-700"><dt>Coupon discount</dt><dd className="font-semibold">− {formatINR(discount)}</dd></div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-faint">Shipping</dt>
                <dd className="font-semibold">{shipping === 0 ? <span className="text-brand-700">FREE</span> : formatINR(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
                <dt className="font-bold">Total</dt><dd className="font-display text-xl font-bold text-brand-800">{formatINR(total)}</dd>
              </div>
            </dl>

            <button onClick={() => navigate('/checkout')} className="btn-primary mt-6 w-full py-3.5 text-sm">
              Proceed to checkout <ArrowRight size={16} />
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-faint">
              <ShieldCheck size={13} /> Prices & stock re-verified at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const Truck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gold-500">
    <path d="M5 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v11" /><path d="M15 8h4l3 4v5a1 1 0 0 1-1 1h-1" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" />
  </svg>
);
