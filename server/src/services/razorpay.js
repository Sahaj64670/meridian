import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/** True when Razorpay test/live keys are configured on the server. */
export const razorpayEnabled = () =>
  Boolean(env.razorpayKeyId && env.razorpayKeySecret);

const authHeaders = () => ({
  Authorization:
    'Basic ' + Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64'),
  'Content-Type': 'application/json',
});

/** Create a Razorpay Order (amount in paise). */
export async function createRazorpayOrder({ amountPaise, receipt }) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw ApiError.badRequest(`Payment gateway error: ${text.slice(0, 160)}`);
  }
  return res.json();
}

/**
 * Verify the HMAC-SHA256 signature Razorpay returns after a successful payment.
 * signature == HMAC(order_id + "|" + payment_id, key_secret)
 */
export function verifySignature({ order_id, payment_id, signature }) {
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
