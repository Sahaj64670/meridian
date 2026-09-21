import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Truck, ShieldCheck, RotateCcw, Headset } from 'lucide-react';

const PROMISES = [
  { icon: Truck, title: 'Fast, tracked delivery', sub: '2–5 days across India' },
  { icon: ShieldCheck, title: 'Secure payments', sub: 'UPI, cards, COD & netbanking' },
  { icon: RotateCcw, title: '7-day returns', sub: 'No-questions-asked policy' },
  { icon: Headset, title: 'Real human support', sub: '9 am – 9 pm, all week' },
];

export default function Footer() {
  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api('/categories'),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <footer className="mt-20 bg-brand-950 text-brand-100">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-400">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-brand-200/80">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-2xl font-bold text-white">
            Meridian<span className="text-gold-400">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-200/80">
            Everything worth owning, delivered. A curated multi-category marketplace built for
            considered shopping.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold-400">Shop</p>
          <ul className="space-y-2 text-sm">
            {(data?.data || []).map((c) => (
              <li key={c.slug}>
                <Link to={`/shop?category=${c.slug}`} className="transition hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold-400">Account</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/orders" className="transition hover:text-white">My orders</Link></li>
            <li><Link to="/cart" className="transition hover:text-white">Cart</Link></li>
            <li><Link to="/auth" className="transition hover:text-white">Sign in / Register</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold-400">Help</p>
          <ul className="space-y-2 text-sm text-brand-200/80">
            <li>support@meridian.store</li>
            <li>1800-120-4567 (toll free)</li>
            <li>Mon–Sun, 9 am – 9 pm IST</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-brand-200/60">
          <p>© {new Date().getFullYear()} Meridian Marketplace. Built as a full-stack demonstration project.</p>
          <p>React · Express · MongoDB · Node.js</p>
        </div>
      </div>
    </footer>
  );
}
