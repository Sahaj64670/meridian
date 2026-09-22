import { Link } from 'react-router-dom';
import { ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';
import { Badge, Price, RatingStars } from './ui';
import { useCartStore } from '../store/cart';
import { toast } from '../store/toast';

export default function ProductCard({ product, index = 0 }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const img = product.images?.[0]?.url || '/images/hero.jpg';
  const lowStock = product.stock > 0 && product.stock <= 5;

  const quickAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="card group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-rise"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-[#e9ecef]">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.featured && <Badge tone="gold">Bestseller</Badge>}
          {lowStock && <Badge tone="danger">Only {product.stock} left</Badge>}
          {product.stock === 0 && <Badge tone="slate">Out of stock</Badge>}
        </div>
        {product.stock > 0 && (
          <button
            onClick={quickAdd}
            className="btn-primary absolute bottom-3 right-3 h-10 w-10 rounded-full opacity-0 shadow-lift transition-all duration-300 group-hover:opacity-100"
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? <Check size={17} /> : <ShoppingBag size={17} />}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
          {product.brand} · {product.category?.name}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition group-hover:text-brand-800">
          {product.name}
        </h3>
        <RatingStars average={product.rating?.average} count={product.rating?.count} />
        <div className="mt-auto pt-1">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </div>
    </Link>
  );
}
