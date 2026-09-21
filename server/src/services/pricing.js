import Coupon from '../models/Coupon.js';

export const FREE_SHIPPING_THRESHOLD = 1499;
export const SHIPPING_FEE = 79;

/**
 * The single source of truth for order maths.
 * The client uses it for display only — the server re-runs it when an order is
 * placed so a tampered request body can never change what the customer pays.
 */
export async function calculatePricing(items, couponCode = '') {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  let discount = 0;
  let freeShippingByCoupon = false;
  let coupon = null;

  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });

    if (!coupon) throw couponError('That coupon code is not valid');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw couponError('That coupon has expired');
    if (subtotal < coupon.minOrder)
      throw couponError(`Add items worth ₹${coupon.minOrder - subtotal} more to use this coupon`);

    if (coupon.type === 'percent') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'shipping') {
      freeShippingByCoupon = true;
    }
  }

  const shipping =
    freeShippingByCoupon || subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0
      ? 0
      : SHIPPING_FEE;

  const total = Math.max(0, subtotal - discount + shipping);

  return {
    subtotal,
    shipping,
    discount,
    total,
    couponCode: coupon ? coupon.code : '',
    couponDescription: coupon?.description || '',
  };
}

function couponError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  err.isOperational = true;
  return err;
}
