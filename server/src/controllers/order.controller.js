import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { send } from '../utils/respond.js';
import { calculatePricing } from '../services/pricing.js';

/** POST /api/coupons/validate — used by the cart to preview a discount. */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const pricing = await calculatePricing(
    [{ price: subtotal, qty: 1 }],
    code
  );
  await send(res, {
    data: {
      ...pricing,
      subtotal,
      message: pricing.couponDescription || 'Coupon applied',
    },
    message: 'Coupon applied',
  });
});

/** POST /api/orders */
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode, saveAddress, utr } = req.body;

  // UPI orders must carry the transaction reference the customer got after paying.
  if (paymentMethod === 'upi' && !/^\d{6,20}$/.test(utr || '')) {
    throw ApiError.badRequest('Enter the UTR / transaction number from your UPI app');
  }

  // 1. Resolve every product from the DB — prices come from us, never the client.
  const ids = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids }, isActive: true });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const resolved = [];
  for (const item of items) {
    const product = byId.get(item.product);
    if (!product) throw ApiError.badRequest('One of the products in your cart is no longer available');
    resolved.push({ product, qty: item.qty, size: item.size, color: item.color });
  }

  // 2. Recalculate totals on the server.
  const pricing = await calculatePricing(
    resolved.map((r) => ({ ...r.product.toJSON(), qty: r.qty })),
    couponCode
  );

  // 3. Reserve stock atomically; roll back anything already reserved on failure.
  const reserved = [];
  try {
    for (const { product, qty } of resolved) {
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: qty } },
        { $inc: { stock: -qty, sold: qty } },
        { new: true }
      );
      if (!updated) {
        throw ApiError.badRequest(
          `Only ${product.stock} unit(s) of "${product.name}" left in stock`
        );
      }
      reserved.push({ id: product._id, qty });
    }
  } catch (err) {
    for (const { id, qty } of reserved) {
      await Product.findByIdAndUpdate(id, { $inc: { stock: qty, sold: -qty } });
    }
    throw err;
  }

  // 4. Persist the order.
  const order = await Order.create({
    user: req.user._id,
    items: resolved.map(({ product, qty, size, color }) => ({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      price: product.price,
      qty,
      size,
      color,
    })),
    shippingAddress,
    paymentMethod,
    // UPI (QR) and COD are real money movements — the admin confirms
    // them from the dashboard once the bank app shows the credit.
    paymentStatus: 'pending',
    paymentRef: paymentMethod === 'upi' ? utr : '',
    orderStatus: paymentMethod === 'upi' ? 'pending' : 'confirmed',
    pricing,
    couponCode: pricing.couponCode,
    timeline: [
      paymentMethod === 'upi'
        ? { status: 'pending', note: `Order placed — awaiting UPI verification (UTR ${utr})`, at: new Date() }
        : { status: 'confirmed', note: 'Order confirmed', at: new Date() },
    ],
  });

  // 5. Optionally remember the address on the profile.
  if (saveAddress) {
    const user = await User.findById(req.user._id);
    const duplicate = user.addresses.some(
      (a) => a.line1 === shippingAddress.line1 && a.pincode === shippingAddress.pincode
    );
    if (!duplicate) {
      if (user.addresses.length === 0) shippingAddress.isDefault = true;
      user.addresses.push(shippingAddress);
      await user.save();
    }
  }

  // 6. Done.
  await send(res, {
    status: 201,
    data: order,
    message: 'Order placed successfully',
  });
});

/** GET /api/orders/mine */
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  await send(res, { data: orders });
});

/** GET /api/orders/:id — owner or admin only. */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = order.user?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw ApiError.forbidden();

  await send(res, { data: order });
});

/** POST /api/orders/:id/cancel */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    throw ApiError.forbidden();
  if (!['pending', 'confirmed', 'packed'].includes(order.orderStatus))
    throw ApiError.badRequest('This order has already shipped and cannot be cancelled');

  // Give the stock back.
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.qty, sold: -item.qty },
    });
  }

  order.orderStatus = 'cancelled';
  order.cancelReason = req.body?.reason || 'Cancelled by customer';
  order.timeline.push({ status: 'cancelled', note: order.cancelReason, at: new Date() });
  await order.save();

  await send(res, { data: order, message: 'Order cancelled' });
});
