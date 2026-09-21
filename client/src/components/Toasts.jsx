import { useToastStore } from '../store/toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.tid}
          className={clsx(
            'flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lift animate-rise',
            t.tone === 'error' ? 'bg-red-600' : 'bg-brand-900'
          )}
        >
          {t.tone === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} className="text-gold-400" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
