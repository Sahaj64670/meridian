import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, formatINR, formatDate } from '../../lib/api';
import { Spinner } from '../../components/ui';

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, q],
    queryFn: () => api('/admin/customers', { params: { page, search: q } }),
  });
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-ink-faint">{meta?.total ?? '…'} registered accounts</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQ(search); setPage(1); }} className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email…" className="input pl-10" />
        </form>
      </div>

      <div className="card overflow-hidden animate-rise">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-brand-50/50 text-left text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5">Orders</th>
                <th className="px-5 py-3.5">Lifetime spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {isLoading ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-brand-700"><Spinner /></td></tr>
              ) : (data?.data || []).map((u) => (
                <tr key={u._id} className="transition hover:bg-brand-50/30">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-800 text-sm font-bold text-white">
                        {u.name?.[0]?.toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-xs text-ink-faint">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5 font-semibold">{u.orders}</td>
                  <td className="px-5 py-3.5 font-bold text-brand-800">{formatINR(u.spent)}</td>
                </tr>
              ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-ink-faint">No customers found.</td></tr>
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
