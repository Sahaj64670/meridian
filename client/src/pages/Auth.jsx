import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LogIn, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { toast } from '../store/toast';
import { clsx } from 'clsx';

export default function Auth() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: mode === 'login' ? { email: form.email, password: form.password } : form,
      });
      setSession(res.data);
      toast.success(res.message);
      navigate(res.data.user.role === 'admin' && next === '/' ? '/admin' : next);
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const quickFill = (email) => setForm({ ...form, email, password: email.startsWith('admin') ? 'Admin@123' : 'Customer@123' });

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2">
      {/* Left: pitch */}
      <div className="hidden lg:block animate-rise">
        <p className="eyebrow mb-3">Welcome to Meridian</p>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
          One account for<br />six curated worlds.
        </h1>
        <ul className="mt-6 space-y-3 text-sm text-ink-soft">
          <li className="flex gap-2.5"><span className="text-gold-500">✦</span> Track every order from warehouse to doorstep</li>
          <li className="flex gap-2.5"><span className="text-gold-500">✦</span> Save addresses for one-tap checkout</li>
          <li className="flex gap-2.5"><span className="text-gold-500">✦</span> Unlock member coupons like FIRST200</li>
        </ul>
        <div className="mt-8 rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-xs text-brand-900">
          <p className="font-bold">Demo accounts (one click to fill):</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => quickFill('admin@meridian.store')} className="chip">Admin — admin@meridian.store</button>
            <button onClick={() => quickFill('customer@meridian.store')} className="chip">Customer — customer@meridian.store</button>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="card mx-auto w-full max-w-md p-8 animate-rise" style={{ animationDelay: '80ms' }}>
        <div className="mb-6 grid grid-cols-2 rounded-full bg-ink/5 p-1 text-sm font-semibold">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErrors({}); }}
              className={clsx('rounded-full py-2 transition', mode === m ? 'bg-white shadow-card text-brand-800' : 'text-ink-faint hover:text-ink')}
            >
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-ink-faint">Full name</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Aarav Sharma" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-ink-faint">Email</label>
            <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-ink-faint">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="input pr-11" value={form.password} onChange={set('password')} placeholder={mode === 'register' ? 'Min 8 chars, letter + number' : '••••••••'} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink" aria-label="Toggle password">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <button className="btn-primary w-full py-3 text-sm" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {mode === 'login' ? 'Sign in' : 'Create my account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-faint">
          {mode === 'login' ? (
            <>New here? <button onClick={() => setMode('register')} className="font-semibold text-brand-700 hover:underline">Create an account</button></>
          ) : (
            <>Already registered? <button onClick={() => setMode('login')} className="font-semibold text-brand-700 hover:underline">Sign in instead</button></>
          )}
        </p>
      </div>
    </div>
  );
}
