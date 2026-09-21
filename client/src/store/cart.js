import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Cart state lives client-side (localStorage) until checkout, where the server
 * re-verifies prices and stock. Lines are keyed by product id + size + color.
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { product: {_id,name,price,images,slug,stock}, qty, size, color }
      coupon: null, // { code, description, discount, shipping }

      addItem: (product, { qty = 1, size = '', color = '' } = {}) => {
        const key = `${product._id}|${size}|${color}`;
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, qty: Math.min(10, i.qty + qty) } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { key, product: { ...product }, qty: Math.min(10, qty), size, color },
            ],
          };
        });
      },

      removeItem: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),

      setQty: (key, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(10, qty)) } : i)),
        })),

      clear: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),

      subtotal: () => get().items.reduce((s, i) => s + i.product.price * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    {
      name: 'meridian-cart',
      partialize: (s) => ({ items: s.items }), // coupons are re-validated server-side
    }
  )
);
