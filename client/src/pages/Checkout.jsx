import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Banknote, Smartphone, Landmark, ChevronRight, Loader2 } from 'lucide-react';
import { api, formatINR } from '../lib/api';
import { payForOrder } from '../lib/pay';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { toast } from '../store/toast';
import { clsx } from 'clsx';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { id: 'card', label: 'Credit / debit card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { id: 'netbanking', label: 'Netbanking', sub: 'All major banks', icon: Landmark },
  { id: 'cod', label: 'Cash on delivery', sub: 'Pay when it arrives', icon: Banknote },
];

const EMPTY = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, coupon, clear } = useCartStore();
  const { user, token } = useAuthStore();

  const [form, setForm] = useState(EMPTY);
  const [payment, setPayment] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(null);

  const payCfg = useQuery({
    queryKey: ['payments-config'],
    queryFn: () => api('/payments/config'),
  });
  const razorpayOn = payCfg.data?.data?.enabled;

  useEffect(() => {
    if (!token) navigate('/auth?next=/checkout');
    else if (!items.length) navigate('/cart');
  }, [token, items.length]);

  useEffect(() => {
    if (user?.addresses?.length) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSaved(def);
      setForm({ fullName: def.fullName, phone: def.phone, line1: def.line1, line2: def.line2 || '', city: def.city, state: def.state, pincode: def.pincode });
    }
  }, [user]);

  const sub = subtotal();
  const discount = coupon?.discount || 0;
  const shipping = sub - discount >= 1499 ? 0 : 79;
  const total = Math.max(0, sub - discount + shipping);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    setErrors({});
    try {
      const res = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ product: i.product._id, qty: i.qty, size: i.size, color: i.color })),
          shippingAddress: form,
          paymentMethod: payment,
          couponCode: coupon?.code || '',
          saveAddress: true,
        },
      });
      const order = res.data;

      // Online payment via Razorpay (test mode) when configured.
      if (payment !== 'cod') {
        try {
          await payForOrder(order, {
            name: form.fullName,
            email: user?.email || '',
            contact: form.phone,
          });
          toast.success('Payment verified 🎉');
        } catch (payErr) {
          // Gateway cancelled/failed — the order is saved, stock reserved,
          // and the customer can retry from the order page.
          clear();
          toast.error(payErr.message || 'Payment cancelled — order saved as pending');
          navigate(`/orders/${order._id}`);
          return;
        }
      }

      clear();
      toast.success('Order placed 🎉');
      navigate(`/order-success/${order._id}`);
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-ink-faint">
        <Link to="/cart" className="hover:text-ink">Cart</Link>
        <ChevronRight size={12} />
        <span className="text-ink-soft font-semibold">Checkout</span>
      </nav>
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Address */}
          <section className="card p-6 animate-rise">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><MapPin size={17} /></span>
              <div>
                <h2 className="font-display text-lg font-semibold">Shipping address</h2>
                {saved && <p className="text-xs text-ink-faint">Prefilled from your saved address — edit if needed</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors['shippingAddress.fullName']}>
                <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="Aarav Sharma" />
              </Field>
              <Field label="Mobile number" error={errors['shippingAddress.phone']}>
                <input className="input" value={form.phone} onChange={set('phone')} placeholder="98XXXXXXXX" maxLength={10} />
              </Field>
              <Field label="Address line 1" error={errors['shippingAddress.line1']} full>
                <input className="input" value={form.line1} onChange={set('line1')} placeholder="House no, street, area" />
              </Field>
              <Field label="Address line 2 (optional)" full>
                <input className="input" value={form.line2} onChange={set('line2')} placeholder="Landmark, apartment" />
              </Field>
              <Field label="City" error={errors['shippingAddress.city']}>
                <input className="input" value={form.city} onChange={set('city')} placeholder="Kharar" />
              </Field>
              <Field label="State" error={errors['shippingAddress.state']}>
                <input className="input" value={form.state} onChange={set('state')} placeholder="Punjab" />
              </Field>
              <Field label="PIN code" error={errors['shippingAddress.pincode']}>
                <input className="input" value={form.pincode} onChange={set('pincode')} placeholder="140301" maxLength={6} />
              </Field>
            </div>
          </section>

          {/* Payment */}
          <section className="card p-6 animate-rise" style={{ animationDelay: '60ms' }}>
            <h2 className="mb-5 font-display text-lg font-semibold">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_METHODS.map(({ id, label, sub, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setPayment(id)}
                  className={clsx(
                    'flex items-center gap-3.5 rounded-2xl border p-4 text-left transition',
                    payment === id ? 'border-brand-700 bg-brand-50/60 ring-2 ring-brand-600/20' : 'border-ink/10 hover:border-brand-400'
                  )}
                >
                  <span className={clsx('flex h-10 w-10 items-center justify-center rounded-xl', payment === id ? 'bg-brand-800 text-white' : 'bg-ink/5 text-ink-soft')}>
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-ink-faint">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-gold-400/15 px-4 py-3 text-xs font-medium text-brand-900">
              {razorpayOn
                ? 'Payments run through Razorpay in TEST mode — use the test UPI/card options in the popup. No real money moves, and every payment is verified server-side.'
                : 'Demo mode — gateway keys not configured, so online payments are simulated and marked “paid” instantly. (Add Razorpay test keys on the server to enable the real test gateway.)'}
            </p>
          </section>
        </div>

        {/* Summary */}
        <div className="h-fit lg:sticky lg:top-32">
          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <ul className="mt-4 space-y-3 border-b border-ink/10 pb-4">
              {items.map((i) => (
                <li key={i.key} className="flex items-center gap-3 text-sm">
                  <img src={i.product.images?.[0]?.url || '/images/hero.jpg'} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 truncate">{i.product.name} <span className="text-ink-faint">× {i.qty}</span></span>
                  <span className="font-semibold">{formatINR(i.product.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-faint">Subtotal</dt><dd className="font-semibold">{formatINR(sub)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-brand-700"><dt>Coupon ({coupon?.code})</dt><dd className="font-semibold">− {formatINR(discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-faint">Shipping</dt><dd className="font-semibold">{shipping === 0 ? 'FREE' : formatINR(shipping)}</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-3"><dt className="font-bold">To pay</dt><dd className="font-display text-xl font-bold text-brand-800">{formatINR(total)}</dd></div>
            </dl>
            <button type="submit" disabled={placing} className="btn-primary mt-6 w-full py-3.5 text-sm">
              {placing ? (<><Loader2 size={16} className="animate-spin" /> Placing order…</>) : (`Place order · ${formatINR(total)}`)}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const Field = ({ label, error, full, children }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-ink-faint">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);
