import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { send } from '../utils/respond.js';
import {
  razorpayEnabled,
  createRazorpayOrder,
  verifySignature,
} from '../services/razorpay.js';
import { env } from '../config/env.js';

/** GET /api/payments/config — lets the frontend pick real vs simulated mode. */
export const config = asyncHandler(async (_req, res) => {
  await send(res, {
    data: {
      enabled: razorpayEnabled(),
      keyId: razorpayEnabled() ? env.razorpayKeyId : '',
    },
  });
});

/** POST /api/payments/create-order — Razorpay order for an existing Meridian order. */
export const createOrder = asyncHandler(async (req, res) => {
  if (!razorpayEnabled()) throw ApiError.badRequest('Payment gateway is not configured');

  const order = await Order.findById(req.body.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw ApiError.forbidden();
  if (order.paymentStatus === 'paid') throw ApiError.badRequest('This order is already paid');
  if (order.paymentMethod === 'cod') throw ApiError.badRequest('COD orders are paid on delivery');
  if (order.orderStatus === 'cancelled') throw ApiError.badRequest('Order is cancelled');

  const rzp = await createRazorpayOrder({
    amountPaise: Math.round(order.pricing.total * 100),
    receipt: order.orderNumber,
  });

  await send(res, {
    data: { id: rzp.id, amount: rzp.amount, currency: rzp.currency },
  });
});

/**
 * POST /api/payments/verify — validate the gateway signature and mark the
 * Meridian order as paid. One round trip, server-side truth.
 */
export const verify = asyncHandler(async (req, res) => {
  if (!razorpayEnabled()) throw ApiError.badRequest('Payment gateway is not configured');

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!verifySignature({ order_id: razorpay_order_id, payment_id: razorpay_payment_id, signature: razorpay_signature })) {
    throw ApiError.badRequest('Payment signature verification failed');
  }

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.user.toString() !== req.user._id.toString()) throw ApiError.forbidden();

  order.paymentStatus = 'paid';
  order.paymentRef = razorpay_payment_id;
  if (order.orderStatus === 'pending') order.orderStatus = 'confirmed';
  order.timeline.push({
    status: order.orderStatus,
    note: `Payment received via Razorpay (${razorpay_payment_id.slice(0, 12)}…)`,
    at: new Date(),
  });
  await order.save();

  await send(res, { data: order, message: 'Payment verified' });
});
