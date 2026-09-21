import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, formatINR } from '../../lib/api';
import { Badge, Spinner } from '../../components/ui';
import { toast } from '../../store/toast';

const EMPTY = {
  name: '', brand: '', category: '', price: '', compareAtPrice: '',
  stock: '', description: '', featured: false, isActive: true,
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | {mode:'create'} | {mode:'edit', product}
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => api('/admin/products', { params: { page, search, limit: 8 } }),
  });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api('/categories') });

  const openCreate = () => { setForm(EMPTY); setModal({ mode: 'create' }); };
  const openEdit = (p) => {
    setForm({
      name: p.name, brand: p.brand, category: p.category?.slug || '', price: p.price,
      compareAtPrice: p.compareAtPrice || '', stock: p.stock, description: p.description,
      featured: p.featured, isActive: p.isActive,
    });
    setModal({ mode: 'edit', product: p });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        name: form.name, brand: form.brand, category: form.category,
        price: Number(form.price), compareAtPrice: Number(form.compareAtPrice || 0),
        stock: Number(form.stock), description: form.description,
        featured: !!form.featured, isActive: !!form.isActive,
      };
      if (modal.mode === 'create') {
        await api('/products', { method: 'POST', body });
        toast.success('Product created');
      } else {
        await api(`/products/${modal.product._id}`, { method: 'PATCH', body });
        toast.success('Product updated');
      }
      setModal(null);
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      toast.error(err.details ? Object.values(err.details)[0] : err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}" permanently?`)) return;
    try {
      await api(`/products/${p._id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const meta = data?.meta;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-ink-faint">{meta?.total ?? '…'} products in the catalog</p>
        </div>
        <div className="flex gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, brand, SKU…" className="input pl-10" />
          </form>
          <button onClick={openCreate} className="btn-primary px-5 py-2.5 text-sm"><Plus size={16} /> Add product</button>
        </div>
      </div>

      <div className="card overflow-hidden animate-rise">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-brand-50/50 text-left text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-brand-700"><Spinner /></td></tr>
              ) : (data?.data || []).map((p) => (
                <tr key={p._id} className="transition hover:bg-brand-50/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url || '/images/hero.jpg'} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="text-xs text-ink-faint">{p.brand} · {p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{p.category?.name}</td>
                  <td className="px-5 py-3 font-semibold">{formatINR(p.price)}</td>
                  <td className="px-5 py-3">
                    <span className={`font-bold ${p.stock <= 5 ? 'text-red-600' : ''}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={p.isActive ? 'brand' : 'slate'}>{p.isActive ? 'Live' : 'Hidden'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="btn-ghost p-2" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => remove(p)} className="btn-ghost p-2 text-ink-faint hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <form onSubmit={save} className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-lift animate-rise">
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
              <h2 className="font-display text-xl font-semibold">
                {modal.mode === 'create' ? 'Add product' : `Edit — ${modal.product.name}`}
              </h2>
              <button type="button" onClick={() => setModal(null)} className="btn-ghost p-2"><X size={17} /></button>
            </div>
            <div className="grid max-h-[65vh] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink-faint">Name</label>
                <input required className="input" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink-faint">Brand</label>
                <input required className="input" value={form.brand} onChange={set('brand')} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink-faint">Category</label>
                <select required className="input" value={form.category} onChange={set('category')}>
                  <option value="">Select…</option>
                  {(categories.data?.data || []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink-faint">Price (₹)</label>
                <input required type="number" min="1" className="input" value={form.price} onChange={set('price')} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink-faint">Compare-at (₹)</label>
                <input type="number" min="0" className="input" value={form.compareAtPrice} onChange={set('compareAtPrice')} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink-faint">Stock</label>
                <input required type="number" min="0" className="input" value={form.stock} onChange={set('stock')} />
              </div>
              <div className="flex items-end gap-5 pb-1">
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="accent-brand-700" checked={form.featured} onChange={set('featured')} /> Featured</label>
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="accent-brand-700" checked={form.isActive} onChange={set('isActive')} /> Live</label>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink-faint">Description</label>
                <textarea required rows={3} className="input resize-none" value={form.description} onChange={set('description')} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-ink/10 px-6 py-4">
              <button type="button" onClick={() => setModal(null)} className="btn-ghost px-5 py-2.5 text-sm">Cancel</button>
              <button disabled={busy} className="btn-primary px-6 py-2.5 text-sm">{busy ? 'Saving…' : modal.mode === 'create' ? 'Create product' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
