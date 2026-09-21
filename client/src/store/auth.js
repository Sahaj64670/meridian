import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
    }),
    { name: 'meridian-auth' }
  )
);

export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin');
