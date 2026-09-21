import { Copy, CheckCircle2, QrCode } from 'lucide-react';
import { useState } from 'react';
import { formatINR } from '../lib/api';
import { toast } from '../store/toast';
import { clsx } from 'clsx';

/**
 * The store's real receiving accounts — customers scan and pay from any
 * UPI app, then type the UTR from their receipt. No gateway needed.
 */
export const UPI_ACCOUNTS = [
  { name: 'Sahaj Rajeev Saxena', upiId: 'sahajs290@okicici', qr: '/images/upi/qr-sahaj.png' },
  { name: 'Lucky Dewangan', upiId: 'luckydewangan022@okaxis', qr: '/images/upi/qr-lucky.png' },
];

export default function UpiPanel({ amount, utr, onUtrChange }) {
  const [copied, setCopied] = useState('');

  const copy = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
      toast.success('UPI ID copied');
      setTimeout(() => setCopied(''), 1500);
    } catch {
      toast.error('Could not copy — long-press the ID to copy');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {UPI_ACCOUNTS.map((a) => (
          <div key={a.upiId} className="rounded-2xl border border-ink/10 bg-white p-4 text-center">
            <div className="mx-auto w-fit rounded-xl bg-white p-2 ring-1 ring-ink/10">
              <img src={a.qr} alt={`UPI QR for ${a.name}`} className="h-40 w-40 object-contain" />
            </div>
            <p className="mt-2.5 text-sm font-bold">{a.name}</p>
            <button
              type="button"
              onClick={() => copy(a.upiId)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-mono text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
            >
              {a.upiId} {copied === a.upiId ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 rounded-xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white">
        <QrCode size={16} className="text-gold-400" />
        Scan with any UPI app and pay exactly {formatINR(amount)}
      </div>

      {onUtrChange && (
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-ink-faint">
            UTR / transaction number (from your UPI app receipt)
          </label>
          <input
            value={utr}
            onChange={(e) => onUtrChange(e.target.value.replace(/\D/g, '').slice(0, 20))}
            placeholder="e.g. 415023987612"
            inputMode="numeric"
            className={clsx('input font-mono', utr && 'border-brand-600 ring-2 ring-brand-600/20')}
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            In GPay/PhonePe: tap the payment → “UTR no.” or “Transaction ID”. We verify it before shipping.
          </p>
        </div>
      )}
    </div>
  );
}
