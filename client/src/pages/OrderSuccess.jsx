import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { api, formatINR, formatDate } from '../lib/api';
import { PageLoader } from '../components/ui';

export default function OrderSuccess() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api(`/orders/${id}`),
    retry: false,
  });
  const order = data?.data;

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="card overflow-hidden text-center animate-rise">
        <div className="bg-brand-900 px-8 py-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 text-brand-950 shadow-lift animate-pop">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold text-white">Order placed!</h1>
          <p className="mt-2 text-sm text-brand-100/85">
            Thank you for shopping with Meridian. Track it anytime from My Orders.
          </p>
        </div>

        {order && (
          <div className="px-8 py-8">
            <div className="mx-auto grid max-w-md grid-cols-2 gap-4 text-left text-sm">
              <div><p className="text-xs text-ink-faint">Order number</p><p className="font-bold text-brand-800">{order.orderNumber}</p></div>
              <div><p className="text-xs text-ink-faint">Placed on</p><p className="font-semibold">{formatDate(order.createdAt)}</p></div>
              <div><p className="text-xs text-ink-faint">Payment</p><p className="font-semibold uppercase">{order.paymentMethod}</p></div>
              <div><p className="text-xs text-ink-faint">Total paid</p><p className="font-bold">{formatINR(order.pricing.total)}</p></div>
            </div>

            <div className="mt-6 rounded-2xl bg-brand-50/70 p-5 text-left">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-800">
                <Package size={14} /> Items ({order.items.length})
              </p>
              <ul className="space-y-2.5">
                {order.items.map((i, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <img src={i.image || '/images/hero.jpg'} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1 truncate">{i.name} × {i.qty}</span>
                    <span className="font-semibold">{formatINR(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {order.paymentMethod === 'upi' && order.paymentStatus === 'pending' && (
              <div className="mx-auto mt-6 max-w-md rounded-2xl bg-gold-400/15 p-4 text-left text-sm text-brand-900">
                <p className="font-bold">One last step — complete your UPI payment</p>
                <p className="mt-1 leading-relaxed">
                  Open the order page for our QR codes (UPI: <span className="font-mono font-semibold">sahajs290@okicici</span> or{' '}
                  <span className="font-mono font-semibold">luckydewangan022@okaxis</span>), pay {formatINR(order.pricing.total)}, and we'll
                  verify your UTR <span className="font-mono font-semibold">{order.paymentRef}</span> shortly.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to={`/orders/${order._id}`} className="btn-outline px-6 py-2.5 text-sm">Track this order</Link>
              <Link to="/shop" className="btn-primary px-6 py-2.5 text-sm">Continue shopping <ArrowRight size={15} /></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
