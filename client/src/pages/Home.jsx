import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, Tag } from 'lucide-react';
import { api } from '../lib/api';
import { SectionHeading, ProductSkeleton } from '../components/ui';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';

const OFFERS = [
  'Free shipping over ₹1,499',
  'COD available across India',
  '7-day easy returns',
  'UPI QR payments',
  'First order? Code MERIDIAN10',
];

const CATEGORY_ICON_TINTS = {
  indigo: 'from-indigo-100 to-indigo-50 text-indigo-700',
  rose: 'from-rose-100 to-rose-50 text-rose-700',
  amber: 'from-amber-100 to-amber-50 text-amber-700',
  pink: 'from-pink-100 to-pink-50 text-pink-700',
  emerald: 'from-emerald-100 to-emerald-50 text-emerald-700',
  teal: 'from-teal-100 to-teal-50 text-teal-700',
};

export default function Home() {
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api('/categories') });
  const featured = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api('/products', { params: { featured: 'true', limit: 8 } }),
  });
  const newest = useQuery({
    queryKey: ['products', 'newest'],
    queryFn: () => api('/products', { params: { sort: 'newest', limit: 4 } }),
  });

  return (
    <div>
      {/* ---------------------------- OFFERS TICKER ------------------------ */}
      <div className="overflow-hidden bg-gold-400 py-1.5">
        <div className="animate-marquee flex min-w-max items-center">
          {[...OFFERS, ...OFFERS].map((t, i) => (
            <span
              key={i}
              className="flex items-center text-[11px] font-bold uppercase tracking-widest text-brand-950"
            >
              <span className="px-6">{t}</span>
              <span className="text-brand-950/40">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------- HERO ------------------------------ */}
      <section className="relative overflow-hidden bg-brand-950">
        <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl animate-float" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #ff9f00 0, transparent 34%), radial-gradient(circle at 85% 75%, #327ef7 0, transparent 40%)',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-rise">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-300">
              <Sparkles size={13} /> New season · up to 45% off curated picks
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-6xl">
              Everything worth owning,{' '}
              <span className="text-animated-gradient italic">delivered beautifully.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-brand-100/85">
              Electronics, fashion, home, beauty, sport, books, toys and grocery — one considered
              marketplace, eight categories, zero clutter.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-gold shine px-7 py-3 text-sm">
                Shop the collection <ArrowRight size={16} />
              </Link>
              <Link
                to="/shop?category=electronics"
                className="btn border border-white/25 px-7 py-3 text-sm text-white hover:bg-white/10"
              >
                Explore electronics
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-xs text-brand-200/70">
              <span>Free shipping over ₹1,499</span>
              <span>7-day returns</span>
              <span>UPI & COD available</span>
            </div>
          </div>

          <div className="relative animate-rise" style={{ animationDelay: '120ms' }}>
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gold-400/10 blur-2xl" />
            <img
              src="/images/hero.jpg"
              alt="Curated Meridian products"
              className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-lift ring-1 ring-white/20"
            />
            <div className="absolute -bottom-5 -left-4 rounded-2xl bg-white px-5 py-3.5 shadow-lift md:-left-8 animate-float">
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Payments</p>
              <p className="font-display text-lg font-semibold text-brand-800">UPI QR & COD</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- CATEGORIES --------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <Reveal>
        <SectionHeading
          eyebrow="Browse by category"
          title="Eight worlds, one doorstep"
          subtitle="Each category is curated like its own boutique — focused ranges, honest prices."
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {(categories.data?.data || []).map((c, i) => (
            <Link
              key={c.slug}
              to={`/shop?category=${c.slug}`}
              className="group relative overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-rise"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img src={c.image} alt={c.name} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span
                  className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${CATEGORY_ICON_TINTS[c.accent] || 'from-brand-100 to-white text-brand-700'}`}
                >
                  <Tag size={14} />
                </span>
                <h3 className="font-display text-lg font-semibold text-white">{c.name}</h3>
                <p className="text-xs text-white/70">
                  {c.productCount ?? 0} products · {c.tagline}
                </p>
              </div>
            </Link>
          ))}
          {!categories.data &&
            Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3]" />)}
        </div>
        </Reveal>
      </section>

      {/* ----------------------------- FEATURED ---------------------------- */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
          <SectionHeading
            eyebrow="Handpicked"
            title="Featured this week"
            subtitle="Bestsellers our customers keep coming back for."
            right={
              <Link to="/shop" className="btn-outline px-5 py-2.5 text-sm">
                View all <ArrowRight size={15} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {featured.data?.data?.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            {!featured.data && Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------- BANNER ---------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-12 text-center md:py-16">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 15% 20%, #ff9f00 0, transparent 30%), radial-gradient(circle at 90% 80%, #327ef7 0, transparent 35%)',
            }}
          />
          <div className="relative">
            <p className="eyebrow mb-3 text-gold-400">First order?</p>
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold text-white md:text-4xl">
              Take 10% off with code{' '}
              <span className="rounded-lg bg-white/10 px-3 py-1 text-gold-400">MERIDIAN10</span>
            </h2>
            <p className="mt-3 text-sm text-brand-100/80">
              Valid on orders above ₹999 · Free shipping over ₹1,499 · COD available
            </p>
            <Link to="/shop" className="btn-gold shine mt-7 px-8 py-3 text-sm">
              Start shopping <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        </Reveal>
      </section>

      {/* ------------------------------ NEW IN ----------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-8">
        <Reveal>
        <SectionHeading
          eyebrow="Fresh arrivals"
          title="New in the catalog"
          right={
            <Link to="/shop?sort=newest" className="btn-outline px-5 py-2.5 text-sm">
              See everything <ArrowRight size={15} />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {newest.data?.data?.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          {!newest.data && Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
        </Reveal>
      </section>
    </div>
  );
}
