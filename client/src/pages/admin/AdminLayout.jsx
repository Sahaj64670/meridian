import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Store, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { clsx } from 'clsx';

const LINKS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token) navigate('/auth?next=/admin');
    else if (user?.role !== 'admin') navigate('/');
  }, [token, user]);

  if (!token || user?.role !== 'admin') return null;

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-32 space-y-1">
          <p className="eyebrow mb-3 px-3">Admin console</p>
          {LINKS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                  isActive ? 'bg-brand-800 text-white shadow-card' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                )
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <div className="pt-4">
            <NavLink to="/shop" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-faint transition hover:bg-ink/5 hover:text-ink">
              <Store size={16} /> Back to store
            </NavLink>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile tabs */}
        <div className="mb-5 flex gap-2 overflow-x-auto md:hidden">
          {LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx('chip whitespace-nowrap', isActive && 'chip-active')
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
