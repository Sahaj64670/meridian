import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PackageOpen, ArrowRight } from 'lucide-react';
import { api, formatINR, formatDate } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { EmptyState, PageLoader, Badge } from '../components/ui';

export const STATUS_TONES = {
  pending: 'slate',
  confirmed: 'soft',
  packed: 'gold',
  shipped: 'brand',
  delivered: 'brand',
  cancelled: 'danger',
};

export default function Orders() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  useEffect(() => {
    if (!token) navigate('/auth?next=/orders');
  }, [token]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api('/orders/mine'),
    enabled: !!token,
  });

  if (isLoading) return <PageLoader />;
  const orders = data?.data || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">My orders</h1>
      <p className="mt-1 text-sm text-ink-faint">Track, review and manage everything you've ordered.</p>

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No orders yet"
          subtitle="When you place your first order it will show up here with live tracking."
          action={<Link to="/shop" className="btn-primary mt-2 px-6 py-2.5 text-sm">Browse products</Link>}
        />
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <Link
              key={o._id}
              to={`/orders/${o._id}`}
              className="card flex flex-wrap items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift animate-rise"
            >
              <div className="flex -space-x-3">
                {o.items.slice(0, 3).map((i, idx) => (
                  <img key={idx} src={i.image || '/images/hero.jpg'} alt="" className="h-12 w-12 rounded-xl border-2 border-white object-cover shadow-card" />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-brand-800">{o.orderNumber}</p>
                <p className="text-xs text-ink-faint">
                  {formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? 's' : ''} · {o.paymentMethod.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge tone={STATUS_TONES[o.orderStatus] || 'slate'}>{o.orderStatus}</Badge>
                <span className="font-display text-lg font-bold">{formatINR(o.pricing.total)}</span>
                <ArrowRight size={16} className="text-ink-faint" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
