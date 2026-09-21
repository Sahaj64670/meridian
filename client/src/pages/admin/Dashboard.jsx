import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { api, formatINR, formatDate } from '../../lib/api';
import { PageLoader, Badge } from '../../components/ui';
import { STATUS_TONES } from '../Orders';

const StatCard = ({ icon: Icon, label, value, sub, tone = 'brand', delay = 0 }) => (
  <div className="card p-5 animate-rise" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">{label}</p>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone === 'gold' ? 'bg-gold-400/20 text-gold-600' : 'bg-brand-50 text-brand-700'}`}>
        <Icon size={17} />
      </span>
    </div>
    <p className="mt-3 font-display text-2xl font-bold tracking-tight">{value}</p>
    {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
  </div>
);

/** Hand-rolled SVG area chart — zero chart-library weight. */
const SalesChart = ({ series }) => {
  const W = 720, H = 220, PAD = 8;
  const max = Math.max(...series.map((s) => s.revenue), 1);
  const pts = series.map((s, i) => [
    PAD + (i / (series.length - 1)) * (W - PAD * 2),
    H - PAD - (s.revenue / max) * (H - PAD * 2 - 24),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${H - PAD} L${pts[0][0]},${H - PAD} Z`;
  const total = series.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="card p-6 animate-rise" style={{ animationDelay: '160ms' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Revenue — last {series.length} days</h2>
          <p className="text-xs text-ink-faint">{formatINR(total)} total · hover for details</p>
        </div>
        <div className="flex gap-1.5 text-[11px] font-semibold text-ink-faint">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-600" /> Daily revenue</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue chart">
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a6b56" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2a6b56" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={H - PAD - f * (H - PAD * 2 - 24)} y2={H - PAD - f * (H - PAD * 2 - 24)} stroke="#131a17" strokeOpacity="0.06" strokeDasharray="3 5" />
        ))}
        <path d={area} fill="url(#rev)" />
        <path d={line} fill="none" stroke="#2a6b56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) =>
          series[i].revenue > 0 ? (
            <circle key={i} cx={x} cy={y} r="3.5" fill="#faf8f3" stroke="#2a6b56" strokeWidth="2">
              <title>{`${series[i].label}: ${formatINR(series[i].revenue)} · ${series[i].orders} orders`}</title>
            </circle>
          ) : null
        )}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-ink-faint">
        <span>{series[0]?.label}</span>
        <span>{series[Math.floor(series.length / 2)]?.label}</span>
        <span>{series[series.length - 1]?.label}</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const overview = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api('/admin/stats/overview'),
    refetchInterval: 30_000,
  });
  const sales = useQuery({
    queryKey: ['admin-sales'],
    queryFn: () => api('/admin/stats/sales', { params: { days: 30 } }),
  });

  if (overview.isLoading) return <PageLoader />;
  const d = overview.data?.data;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Admin console</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Store overview</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={IndianRupee} label="Total revenue" value={formatINR(d.revenue)} sub={`${formatINR(d.today.revenue)} today`} delay={0} />
        <StatCard icon={ShoppingBag} label="Orders" value={d.orders} sub={`${d.today.orders} placed today`} delay={40} />
        <StatCard icon={Users} label="Customers" value={d.customers} sub="Registered accounts" delay={80} />
        <StatCard icon={Package} label="Avg order value" value={formatINR(d.avgOrderValue)} sub={`${d.products} live products`} tone="gold" delay={120} />
      </div>

      {sales.data?.data && <SalesChart series={sales.data.data} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="card p-6 animate-rise" style={{ animationDelay: '200ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-brand-700 hover:underline">View all →</Link>
          </div>
          <ul className="divide-y divide-ink/5">
            {d.recentOrders.map((o) => (
              <li key={o._id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-ink-faint">{o.user?.name || 'Guest'} · {formatDate(o.createdAt)}</p>
                </div>
                <Badge tone={STATUS_TONES[o.orderStatus]}>{o.orderStatus}</Badge>
                <span className="w-20 text-right text-sm font-bold">{formatINR(o.pricing.total)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top products + low stock */}
        <div className="space-y-6">
          <div className="card p-6 animate-rise" style={{ animationDelay: '240ms' }}>
            <h2 className="mb-4 font-display text-lg font-semibold">Top sellers</h2>
            <ul className="space-y-3">
              {d.topProducts.map((p, i) => {
                const maxUnits = d.topProducts[0]?.units || 1;
                return (
                  <li key={p._id}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{i + 1}. {p.name}</span>
                      <span className="shrink-0 text-xs text-ink-faint">{p.units} sold · {formatINR(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" style={{ width: `${(p.units / maxUnits) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {d.lowStock.length > 0 && (
            <div className="card border-l-4 border-l-gold-400 p-6 animate-rise" style={{ animationDelay: '280ms' }}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                <AlertTriangle size={17} className="text-gold-600" /> Low stock alerts
              </h2>
              <ul className="space-y-2 text-sm">
                {d.lowStock.map((p) => (
                  <li key={p._id} className="flex justify-between gap-3">
                    <span className="truncate">{p.name}</span>
                    <span className={`shrink-0 font-bold ${p.stock <= 2 ? 'text-red-600' : 'text-gold-600'}`}>{p.stock} left</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Category split */}
      {d.categorySplit?.length > 0 && (
        <div className="card p-6 animate-rise" style={{ animationDelay: '320ms' }}>
          <h2 className="mb-4 font-display text-lg font-semibold">Revenue by category (30 days)</h2>
          <div className="flex h-3.5 w-full overflow-hidden rounded-full">
            {d.categorySplit.map((c, i) => {
              const total = d.categorySplit.reduce((s, x) => s + x.revenue, 0) || 1;
              const colors = ['#2a6b56', '#d9a53c', '#58a186', '#b5d9cb', '#1f453a', '#eec25f'];
              return <div key={c._id} title={`${c._id}: ${formatINR(c.revenue)}`} style={{ width: `${(c.revenue / total) * 100}%`, backgroundColor: colors[i % colors.length] }} />;
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-soft">
            {d.categorySplit.map((c, i) => {
              const colors = ['#2a6b56', '#d9a53c', '#58a186', '#b5d9cb', '#1f453a', '#eec25f'];
              return (
                <span key={c._id} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  {c._id} · <strong>{formatINR(c.revenue)}</strong>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
