import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, CreditCard, ChevronRight, XCircle, CheckCircle2 } from 'lucide-react';
import { api, formatINR, formatDate } from '../lib/api';
import { payForOrder } from '../lib/pay';
import { PageLoader, Badge } from '../components/ui';
import { STATUS_TONES } from './Orders';
import { useAuthStore } from '../store/auth';
import { toast } from '../store/toast';
import { clsx } from 'clsx';

const FLOW = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [paying, setPaying] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api(`/orders/${id}`),
  });

  const cancel = async () => {
    if (!confirm('Cancel this order? Stock will be released immediately.')) return;
    try {
      await api(`/orders/${id}/cancel`, { method: 'POST', body: { reason: 'Cancelled by customer' } });
      toast.success('Order cancelled');
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader />;
  const order = data?.data;
  if (!order) return <p className="py-24 text-center text-ink-faint">Order not found.</p>;

  const cancelled = order.orderStatus === 'cancelled';
  const currentIdx = FLOW.indexOf(order.orderStatus);
  const canCancel = ['pending', 'confirmed', 'packed'].includes(order.orderStatus);
  const needsPayment =
    order.paymentStatus === 'pending' && order.paymentMethod !== 'cod' && !cancelled;

  const payNow = async () => {
    setPaying(true);
    try {
      await payForOrder(order, {
        name: order.shippingAddress.fullName,
        email: user?.email || '',
        contact: order.shippingAddress.phone,
      });
      toast.success('Payment verified 🎉');
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    } catch (err) {
      toast.error(err.message || 'Payment cancelled');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-ink-faint">
        <Link to="/orders" className="hover:text-ink">My orders</Link>
        <ChevronRight size={12} />
        <span className="font-semibold text-ink-soft">{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-faint">Placed {formatDate(order.createdAt)} at {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <Badge tone={STATUS_TONES[order.orderStatus]}>{order.orderStatus}</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Timeline */}
          <div className="card p-6 animate-rise">
            <h2 className="mb-6 font-display text-lg font-semibold">Delivery timeline</h2>
            {cancelled ? (
              <p className="flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
                <XCircle size={17} /> {order.cancelReason || 'This order was cancelled.'}
              </p>
            ) : (
              <ol className="space-y-0">
                {FLOW.map((step, i) => {
                  const done = i <= currentIdx;
                  const entry = order.timeline?.find((t) => t.status === step);
                  return (
                    <li key={step} className="relative flex gap-4 pb-7 last:pb-0">
                      {i < FLOW.length - 1 && (
                        <span className={clsx('absolute left-[11px] top-6 h-full w-0.5', done && i < currentIdx ? 'bg-brand-600' : 'bg-ink/10')} />
                      )}
                      <span
                        className={clsx(
                          'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                          done ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink/15 bg-white'
                        )}
                      >
                        {done && <CheckCircle2 size={13} />}
                      </span>
                      <div className="min-w-0">
                        <p className={clsx('text-sm font-semibold capitalize', done ? 'text-ink' : 'text-ink-faint')}>{step}</p>
                        {entry && <p className="text-xs text-ink-faint">{entry.note} · {formatDate(entry.at)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Items */}
          <div className="card p-6 animate-rise" style={{ animationDelay: '60ms' }}>
            <h2 className="mb-4 font-display text-lg font-semibold">Items</h2>
            <ul className="divide-y divide-ink/5">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-4 py-3.5">
                  <img src={i.image || '/images/hero.jpg'} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{i.name}</p>
                    <p className="text-xs text-ink-faint">Qty {i.qty}{i.size ? ` · Size ${i.size}` : ''}{i.color ? ` · ${i.color}` : ''}</p>
                  </div>
                  <p className="font-bold">{formatINR(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="card p-6 animate-rise" style={{ animationDelay: '90ms' }}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><MapPin size={17} className="text-brand-700" /> Ship to</h2>
            <p className="text-sm font-semibold">{order.shippingAddress.fullName}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            </p>
            <p className="mt-2 text-xs text-ink-faint">{order.shippingAddress.phone}</p>
          </div>

          <div className="card p-6 animate-rise" style={{ animationDelay: '120ms' }}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><CreditCard size={17} className="text-brand-700" /> Payment</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-faint">Method</dt><dd className="font-semibold uppercase">{order.paymentMethod}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">Status</dt><dd><Badge tone={order.paymentStatus === 'paid' ? 'brand' : 'slate'}>{order.paymentStatus}</Badge></dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-2"><dt className="text-ink-faint">Subtotal</dt><dd>{formatINR(order.pricing.subtotal)}</dd></div>
              {order.pricing.discount > 0 && <div className="flex justify-between text-brand-700"><dt>Discount</dt><dd>− {formatINR(order.pricing.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-faint">Shipping</dt><dd>{order.pricing.shipping === 0 ? 'FREE' : formatINR(order.pricing.shipping)}</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-display text-lg font-bold text-brand-800">{formatINR(order.pricing.total)}</dd></div>
            </dl>
          </div>

          {needsPayment && (
            <button onClick={payNow} disabled={paying} className="btn-gold w-full py-3 text-sm">
              {paying ? 'Opening gateway…' : `Pay ${formatINR(order.pricing.total)} now`}
            </button>
          )}
          {canCancel && (
            <button onClick={cancel} className="btn-outline w-full border-red-200 py-3 text-sm text-red-600 hover:border-red-400 hover:bg-red-50 hover:text-red-700">
              Cancel this order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
