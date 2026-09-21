import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShoppingBag,
  User,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Package,
} from 'lucide-react';
import { api } from '../lib/api';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { clsx } from 'clsx';

const Wordmark = () => (
  <Link to="/" className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 shadow-card">
      <svg viewBox="0 0 32 32" className="h-5 w-5">
        <path
          d="M8 22V10l8 7 8-7v12"
          stroke="#ff9f00"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    <span className="font-display text-xl font-bold tracking-tight">
      Meridian<span className="text-gold-500">.</span>
    </span>
  </Link>
);

export default function Navbar() {
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();
  const count = useCartStore((s) => s.count());
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api('/categories'),
    staleTime: 10 * 60 * 1000,
  });
  const categories = catData?.data || [];

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    setOpen(false);
    navigate(q.trim() ? `/shop?search=${encodeURIComponent(q.trim())}` : '/shop');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
      {/* Utility strip */}
      <div className="bg-brand-900 text-[11px] font-medium tracking-wide text-brand-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span>Free shipping on orders over ₹1,499</span>
          <span className="hidden sm:block">7-day easy returns · COD available</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button className="btn-ghost -ml-2 p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Wordmark />

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <NavLink
            to="/shop"
            end
            className={({ isActive }) =>
              clsx(
                'rounded-full px-3.5 py-2 text-sm font-medium transition',
                isActive ? 'bg-brand-800 text-white' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
              )
            }
          >
            Shop all
          </NavLink>
          {categories.map((c) => (
            <NavLink
              key={c.slug}
              to={`/shop?category=${c.slug}`}
              className={({ isActive }) =>
                clsx(
                  'rounded-full px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-brand-800 text-white' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                )
              }
            >
              {c.name}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands…"
              className="input rounded-full py-2 pl-10"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-3">
          <Link to="/cart" className="btn-ghost relative p-2.5" aria-label="Cart">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-brand-950">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenu(!menu)} className="btn-ghost flex items-center gap-2 p-1.5" aria-label="Account menu">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-800 text-sm font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-ink/10 bg-white p-1.5 shadow-lift animate-rise">
                  <div className="border-b border-ink/5 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-ink-faint">{user.email}</p>
                  </div>
                  <MenuItem to="/orders" onClick={() => setMenu(false)} icon={<Package size={15} />}>
                    My orders
                  </MenuItem>
                  {user.role === 'admin' && (
                    <MenuItem to="/admin" onClick={() => setMenu(false)} icon={<LayoutDashboard size={15} />}>
                      Admin dashboard
                    </MenuItem>
                  )}
                  <button
                    onClick={() => {
                      clearSession();
                      setMenu(false);
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn-primary px-4 py-2 text-sm">
              <User size={16} /> Sign in
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-ink/10 bg-white px-4 py-4 lg:hidden animate-rise">
          <form onSubmit={submitSearch} className="mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="input"
            />
          </form>
          <div className="flex flex-wrap gap-2">
            <Link to="/shop" onClick={() => setOpen(false)} className="chip">Shop all</Link>
            {categories.map((c) => (
              <Link key={c.slug} to={`/shop?category=${c.slug}`} onClick={() => setOpen(false)} className="chip">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

const MenuItem = ({ to, icon, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-ink/5 hover:text-ink"
  >
    {icon} {children}
  </Link>
);
