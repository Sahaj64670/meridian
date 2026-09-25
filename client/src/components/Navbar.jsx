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
  <Link to="/" className="flex shrink-0 items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-card">
      <svg viewBox="0 0 32 32" className="h-5 w-5">
        <path
          d="M8 22V10l8 7 8-7v12"
          stroke="#2874f0"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    <span className="font-display text-xl font-bold tracking-tight text-white">
      Meridian<span className="text-gold-400">.</span>
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

  const searchBox = (
    <div className="relative w-full">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search for products, brands and more"
        className="w-full rounded-lg border-0 bg-white px-4 py-2.5 pl-10 text-sm text-ink shadow-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-gold-400"
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-40 shadow-card">
      {/* Row 1 — brand bar */}
      <div className="bg-brand-600">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:gap-6">
          <button
            className="btn-ghost -ml-1 p-2 text-white hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Wordmark />

          <form onSubmit={submitSearch} className="hidden max-w-2xl flex-1 md:block">
            {searchBox}
          </form>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/cart"
              className="btn-ghost relative p-2.5 text-white hover:bg-white/10 hover:text-white"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span
                  key={count}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-brand-950 animate-pop"
                >
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenu(!menu)}
                  className="btn-ghost flex items-center gap-2 p-1.5 hover:bg-white/10"
                  aria-label="Account menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-700">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                  <span className="hidden max-w-24 truncate text-sm font-semibold text-white lg:block">
                    {user.name?.split(' ')[0]}
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
              <Link to="/auth" className="btn shine bg-white px-5 py-2 text-sm text-brand-700 hover:bg-brand-50">
                <User size={16} /> Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-2.5 md:hidden">{searchBox}</div>
      </div>

      {/* Row 2 — category strip */}
      <nav className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-1">
            <NavLink
              to="/shop"
              end
              className={({ isActive }) =>
                clsx(
                  'border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-gold-400 hover:text-brand-700',
                  isActive && 'border-gold-400 text-brand-700'
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
                    'border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-gold-400 hover:text-brand-700',
                    isActive && 'border-gold-400 text-brand-700'
                  )
                }
              >
                {c.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-b border-ink/10 bg-white px-4 py-4 lg:hidden animate-rise">
          <div className="flex flex-wrap gap-2">
            <Link to="/shop" onClick={() => setOpen(false)} className="chip">
              Shop all
            </Link>
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
