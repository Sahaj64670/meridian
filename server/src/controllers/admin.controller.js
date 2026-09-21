import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { send } from '../utils/respond.js';

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** GET /api/admin/stats/overview */
export const overview = asyncHandler(async (_req, res) => {
  const today = startOfDay();
  const yesterday = new Date(today.getTime() - 86400000);
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 86400000);

  const REVENUE_MATCH = { orderStatus: { $ne: 'cancelled' } };

  const [revenueAgg, todayAgg, yesterdayAgg, orderCount, userCount, productCount, lowStock, recent, topProducts, categorySplit] =
    await Promise.all([
      Order.aggregate([{ $match: REVENUE_MATCH }, { $group: { _id: null, total: { $sum: '$pricing.total' }, orders: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { ...REVENUE_MATCH, createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...REVENUE_MATCH, createdAt: { $gte: yesterday, $lt: today } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
      Product.find({ stock: { $lte: 5 }, isActive: true }).sort({ stock: 1 }).limit(6).select('name stock sku'),
      Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email'),
      Order.aggregate([
        { $match: REVENUE_MATCH },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, units: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
        { $sort: { units: -1 } },
        { $limit: 6 },
      ]),
      Order.aggregate([
        { $match: { ...REVENUE_MATCH, createdAt: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
        { $unwind: '$p' },
        { $lookup: { from: 'categories', localField: 'p.category', foreignField: '_id', as: 'c' } },
        { $unwind: '$c' },
        { $group: { _id: '$c.name', revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
        { $sort: { revenue: -1 } },
      ]),
    ]);

  const revenue = Math.round(revenueAgg[0]?.total || 0);
  const todayRevenue = Math.round(todayAgg[0]?.total || 0);
  const yesterdayRevenue = Math.round(yesterdayAgg[0]?.total || 0);
  const ordersToday = todayAgg[0]?.orders || 0;

  await send(res, {
    data: {
      revenue,
      orders: orderCount,
      customers: userCount,
      products: productCount,
      avgOrderValue: orderCount ? Math.round(revenue / orderCount) : 0,
      today: { revenue: todayRevenue, orders: ordersToday },
      growth: yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : todayRevenue > 0 ? 100 : 0,
      lowStock,
      recentOrders: recent,
      topProducts,
      categorySplit,
    },
  });
});

/** GET /api/admin/stats/sales?days=30 — series for the dashboard chart. */
export const salesSeries = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const from = new Date(startOfDay().getTime() - (days - 1) * 86400000);

  const rows = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' }, createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = new Map(rows.map((r) => [r._id, r]));
  const series = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    series.push({
      date: key,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: Math.round(map.get(key)?.revenue || 0),
      orders: map.get(key)?.orders || 0,
    });
  }

  await send(res, { data: series });
});

/** GET /api/admin/orders */
export const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const filter = {};

  if (req.query.status && req.query.status !== 'all') filter.orderStatus = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ orderNumber: rx }, { 'shippingAddress.fullName': rx }, { 'shippingAddress.city': rx }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  await send(res, { data: orders, meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
});

/** PATCH /api/admin/orders/:id/status */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  order.orderStatus = orderStatus;
  order.timeline.push({ status: orderStatus, note: note || `Status set to ${orderStatus}`, at: new Date() });

  // Confirming a UPI order means the owner checked the bank app — mark it paid.
  if (orderStatus === 'confirmed' && order.paymentMethod === 'upi' && order.paymentStatus !== 'paid') {
    order.paymentStatus = 'paid';
    order.timeline.push({
      status: orderStatus,
      note: `UPI payment verified (UTR ${order.paymentRef || 'n/a'})`,
      at: new Date(),
    });
  }

  if (orderStatus === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';
  }
  if (orderStatus === 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty, sold: -item.qty } });
    }
  }

  await order.save();
  await send(res, { data: order, message: 'Order updated' });
});

/** GET /api/admin/customers */
export const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;

  const match = { role: 'user' };
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [{ name: rx }, { email: rx }];
  }

  const [rows, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'orders',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$uid'] }, orderStatus: { $ne: 'cancelled' } } },
            { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: '$pricing.total' } } },
          ],
          as: 'stats',
        },
      },
      { $addFields: { orders: { $ifNull: [{ $arrayElemAt: ['$stats.count', 0] }, 0] }, spent: { $ifNull: [{ $arrayElemAt: ['$stats.spent', 0] }, 0] } } },
      { $project: { password: 0, stats: 0 } },
    ]),
    User.countDocuments(match),
  ]);

  await send(res, { data: rows, meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
});

/** GET /api/admin/products — full list including inactive, for the admin table. */
export const listProductsAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { sku: rx }];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  await send(res, { data: products, meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
});
