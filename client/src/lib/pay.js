import { api } from './api';
import { loadRazorpay, openRazorpay } from './razorpay';

/**
 * Shared "pay for this order" flow, used by Checkout and by the
 * "Pay now" retry button on the order page.
 *
 * Returns:
 *  { mode: 'razorpay', order }  – gateway payment verified server-side
 *  { mode: 'simulated' }        – gateway not configured; server already marked paid
 * Throws when the customer cancels / payment fails (order stays pending).
 */
export async function payForOrder(order, prefill = {}) {
  const cfg = await api('/payments/config');
  if (!cfg.data.enabled) return { mode: 'simulated' };

  const loaded = await loadRazorpay();
  if (!loaded) throw new Error('Could not load the payment gateway');

  const rzpOrder = (
    await api('/payments/create-order', { method: 'POST', body: { orderId: order._id } })
  ).data;

  const resp = await openRazorpay({
    keyId: cfg.data.keyId,
    rzpOrder,
    prefill,
    orderNumber: order.orderNumber,
  });

  const verified = await api('/payments/verify', {
    method: 'POST',
    body: {
      orderId: order._id,
      razorpay_order_id: resp.razorpay_order_id,
      razorpay_payment_id: resp.razorpay_payment_id,
      razorpay_signature: resp.razorpay_signature,
    },
  });

  return { mode: 'razorpay', order: verified.data };
}
