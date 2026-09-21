import { create } from 'zustand';

let id = 0;
export const useToastStore = create((set) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const tid = ++id;
    set((s) => ({ toasts: [...s.toasts, { tid, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.tid !== tid) }));
    }, 3200);
  },
}));

export const toast = {
  success: (m) => useToastStore.getState().push(m, 'success'),
  error: (m) => useToastStore.getState().push(m, 'error'),
};
