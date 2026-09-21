/**
 * Thin wrapper around Razorpay Checkout (checkout.js loaded from their CDN).
 * Everything here runs in TEST mode with test keys — no real money moves.
 */
let loader = null;

export function loadRazorpay() {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve(true);
  loader ??= new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return loader;
}

/**
 * Opens the Razorpay modal.
 * Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Rejects when the customer cancels or the payment fails.
 */
export function openRazorpay({ keyId, rzpOrder, prefill, orderNumber }) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) return reject(new Error('Could not load the payment gateway'));

    const rzp = new window.Razorpay({
      key: keyId,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency || 'INR',
      name: 'Meridian',
      description: `Order ${orderNumber}`,
      image: '/images/hero.jpg',
      prefill,
      notes: { orderNumber },
      theme: { color: '#1f453a' },
      modal: { ondismiss: () => reject(new Error('Payment window closed')) },
      handler: (resp) => resolve(resp),
    });

    rzp.on('payment.failed', (r) =>
      reject(new Error(r?.error?.description || 'Payment failed'))
    );

    rzp.open();
  });
}
