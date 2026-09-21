/**
 * `npm run seed` — wipes the dev database and loads the Meridian demo dataset:
 *   1 admin, 3 customers, 8 categories, 120 products, coupons, ~30 demo orders.
 *
 * Every product gets a unique photo (looked up by search term in media.json)
 * and a short showcase video from the per-category video pool.
 *
 * The demo orders are generated with a seeded PRNG so everyone gets the same
 * dashboard numbers (and a nice-looking 30-day revenue chart).
 */
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';

import { categories as baseCategories, products as baseProducts, coupons } from './data.js';
import { newCategories, moreProducts, photoQuery, videoPool } from './more-products.js';

const categories = [...baseCategories, ...newCategories];
const products = [...baseProducts, ...moreProducts];

/** Unique photo per product, harvested from Openverse (see media.json). */
const media = JSON.parse(readFileSync(new URL('./media.json', import.meta.url), 'utf-8'));

/* Deterministic PRNG so the demo data is identical every run. */
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(20260921);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

const CUSTOMERS = [
  { name: 'Aarav Sharma', email: 'customer@meridian.store', password: 'Customer@123' },
  { name: 'Priya Nair', email: 'priya@example.com', password: 'Customer@123' },
  { name: 'Rohan Mehta', email: 'rohan@example.com', password: 'Customer@123' },
];

const ADDRESSES = [
  { fullName: 'Aarav Sharma', phone: '9812045673', line1: '14, Sector 7A, Green Enclave', line2: 'Near City Mall', city: 'Kharar', state: 'Punjab', pincode: '140301', isDefault: true },
  { fullName: 'Priya Nair', phone: '9988776655', line1: 'B-702, Marina Heights', line2: 'Marine Drive', city: 'Kochi', state: 'Kerala', pincode: '682016', isDefault: true },
  { fullName: 'Rohan Mehta', phone: '9876501234', line1: '221, Indiranagar 100 Feet Road', line2: '', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', isDefault: true },
];

const STATUS_FLOW = [
  ['pending'],
  ['pending', 'confirmed'],
  ['pending', 'confirmed', 'packed'],
  ['pending', 'confirmed', 'packed', 'shipped'],
  ['pending', 'confirmed', 'packed', 'shipped', 'delivered'],
];

async function seed() {
  await connectDB();
  console.log('  … clearing existing data');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Coupon.deleteMany({}),
  ]);

  /* ------------------------------- users ------------------------------- */
  console.log('  … creating users');
  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Meridian Admin',
    email: process.env.ADMIN_EMAIL || 'admin@meridian.store',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
  });
  const users = await User.create(CUSTOMERS);

  /* ----------------------------- categories ---------------------------- */
  console.log('  … creating categories');
  const CAT_IMAGE = {
    Electronics: '/images/products/electronics.jpg',
    Fashion: '/images/products/fashion.jpg',
    'Home & Living': '/images/products/home-living.jpg',
    'Beauty & Care': '/images/products/beauty-care.jpg',
    'Sports & Outdoors': '/images/products/sports.jpg',
    'Books & Stationery': '/images/products/books.jpg',
    'Toys & Games': '/images/products/toys.jpg',
    'Grocery & Gourmet': '/images/products/grocery.jpg',
  };
  const cats = await Category.create(
    categories.map((c) => ({ ...c, image: CAT_IMAGE[c.name] }))
  );
  const catByName = new Map(cats.map((c) => [c.name, c]));

  /* ------------------------------ products ----------------------------- */
  console.log('  … creating products');
  // Fallback image per category if a photo query ever misses.
  const IMAGE_BY_CATEGORY = {
    Electronics: '/images/products/electronics.jpg',
    Fashion: '/images/products/fashion.jpg',
    'Home & Living': '/images/products/home-living.jpg',
    'Beauty & Care': '/images/products/beauty-care.jpg',
    'Sports & Outdoors': '/images/products/sports.jpg',
    'Books & Stationery': '/images/products/books.jpg',
    'Toys & Games': '/images/products/toys.jpg',
    'Grocery & Gourmet': '/images/products/grocery.jpg',
  };
  const videoCursor = {};
  const docs = products.map((p) => {
    const query = p.photo || photoQuery[p.name] || p.tags?.[0] || p.name;
    const pool = videoPool[p.category] || [];
    const cursor = (videoCursor[p.category] = (videoCursor[p.category] || 0) + 1) - 1;
    const { photo, ...rest } = p;
    return {
      ...rest,
      category: catByName.get(p.category)._id,
      sku: `MRD-${p.category.slice(0, 3).toUpperCase()}-${String(Math.floor(rand() * 9000) + 1000)}`,
      images: [{ url: media[query] || IMAGE_BY_CATEGORY[p.category], alt: p.name }],
      video: pool.length ? pool[cursor % pool.length] : '',
    };
  });
  const created = await Product.create(docs);
  console.log(`    ✔ ${created.length} products`);

  /* ------------------------------ coupons ------------------------------ */
  console.log('  … creating coupons');
  await Coupon.create(coupons);

  /* --------------------------- demo orders ----------------------------- */
  console.log('  … generating demo orders (last 30 days)');
  const orders = [];
  for (let i = 0; i < 30; i++) {
    const user = pick(users);
    const itemCount = between(1, 3);
    const chosen = [];
    while (chosen.length < itemCount) {
      const p = pick(created);
      if (!chosen.some((c) => c.product._id.equals(p._id))) chosen.push({ product: p, qty: between(1, 2) });
    }

    const subtotal = chosen.reduce((s, c) => s + c.product.price * c.qty, 0);
    const shipping = subtotal >= 1499 ? 0 : 79;
    const total = subtotal + shipping;

    const daysAgo = Math.floor(rand() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - between(0, 20) * 3600000);
    const flow = pick(STATUS_FLOW);
    const finalStatus = flow[flow.length - 1];

    const timeline = flow.map((status, idx) => ({
      status,
      note:
        status === 'pending'
          ? 'Order placed'
          : status === 'confirmed'
            ? 'Order confirmed'
            : status === 'packed'
              ? 'Packed at the warehouse'
              : status === 'shipped'
                ? 'Handed to courier'
                : 'Delivered',
      at: new Date(createdAt.getTime() + idx * 6 * 3600000),
    }));

    orders.push({
      user: user._id,
      items: chosen.map(({ product, qty }) => ({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price: product.price,
        qty,
      })),
      shippingAddress: pick(ADDRESSES),
      paymentMethod: pick(['cod', 'upi', 'card', 'netbanking']),
      paymentStatus: pick(['cod', 'upi', 'card', 'netbanking']) === 'cod' ? 'pending' : 'paid',
      orderStatus: finalStatus,
      pricing: { subtotal, shipping, discount: 0, total },
      timeline,
      deliveredAt: finalStatus === 'delivered' ? timeline[timeline.length - 1].at : undefined,
      createdAt,
      updatedAt: createdAt,
    });
  }

  // Bypass default timestamps so createdAt reflects the generated dates.
  for (const o of orders) {
    const doc = new Order(undefined, { timestamps: false });
    doc.set({
      user: o.user,
      items: o.items,
      shippingAddress: o.shippingAddress,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      pricing: o.pricing,
      timeline: o.timeline,
      deliveredAt: o.deliveredAt,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    });
    await doc.validate();
    await doc.save({ timestamps: false });
  }

  /* ------------------------------ summary ------------------------------ */
  const revenue = orders.reduce((s, o) => s + o.pricing.total, 0);
  console.log(`\n  ✔ Seed complete`);
  console.log(`    Admin    : ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
  console.log(`    Customer : ${users[0].email} / Customer@123`);
  console.log(`    Products : ${created.length} across ${cats.length} categories`);
  console.log(`    Orders   : ${orders.length} (₹${revenue.toLocaleString('en-IN')} in demo revenue)\n`);

  await disconnectDB();
}

seed().catch((err) => {
  console.error('✖ Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
