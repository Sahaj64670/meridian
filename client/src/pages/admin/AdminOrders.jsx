import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, formatINR, formatDate } from '../../lib/api';
import { Badge, Spinner } from '../../components/ui';
import { STATUS_TONES } from '../Orders';
import { toast } from '../../store/toast';
import { clsx } from 'clsx';

const STATUSES = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
const NEXT = { pending: 'confirmed', confirmed: 'packed', packed: 'shipped', shipped: 'delivered' };

export default function AdminOrders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status, q],
    queryFn: () => api('/admin/orders', { params: { page, status, search: q, limit: 8 } }),
  });

  const updateStatus = async (order, next) => {
    try {
      await api(`/admin/orders/${order._id}/status`, { method: 'PATCH', body: { orderStatus: next } });
      toast.success(`${order.orderNumber} → ${next}`);
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-ink-faint">{meta?.total ?? '…'} orders · update status as they move through the warehouse</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setQ(search); setPage(1); }}
          className="relative w-full max-w-xs"
        >
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order no, customer, city…" className="input pl-10" />
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={clsx('chip capitalize', status === s && 'chip-active')}>
            {s}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden animate-rise">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-brand-50/50 text-left text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-brand-700"><Spinner /></td></tr>
              ) : (data?.data || []).map((o) => (
                <tr key={o._id} className="transition hover:bg-brand-50/30">
                  <td className="px-5 py-3.5 font-bold text-brand-800">{o.orderNumber}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold">{o.user?.name || '—'}</p>
                    <p className="text-xs text-ink-faint">{o.shippingAddress.city}, {o.shippingAddress.state}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(o.createdAt)}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="px-5 py-3.5 font-bold">{formatINR(o.pricing.total)}</td>
                  <td className="px-5 py-3.5"><Badge tone={STATUS_TONES[o.orderStatus]}>{o.orderStatus}</Badge></td>
                  <td className="px-5 py-3.5 text-right">
                    {NEXT[o.orderStatus] ? (
                      <button
                        onClick={() => updateStatus(o, NEXT[o.orderStatus])}
                        className="btn-primary px-3.5 py-1.5 text-xs"
                      >
                        → {NEXT[o.orderStatus]}
                      </button>
                    ) : (
                      <span className="text-xs text-ink-faint">{o.orderStatus === 'cancelled' ? '—' : 'Done'}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-ink-faint">No orders match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline h-9 w-9 rounded-full p-0"><ChevronLeft size={16} /></button>
          <span className="text-ink-faint">Page {meta.page} of {meta.pages}</span>
          <button disabled={page >= meta.pages} onClick={() => setPage(page + 1)} className="btn-outline h-9 w-9 rounded-full p-0"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
