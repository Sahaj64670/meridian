/**
 * `npm run seed` — wipes the database and loads the Meridian catalogue:
 *   4 admins, 1 customer, 8 categories, 120 products, coupons.
 *
 * Every product gets a unique photo (looked up by search term in media.json).
 * Nothing fake is generated — no fake orders, reviews or sales counters —
 * so every number you see is real customer activity.
 */
import { readFileSync } from 'node:fs';
import { connectDB, disconnectDB } from '../config/db.js';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

import { categories as baseCategories, products as baseProducts, coupons } from './data.js';
import { newCategories, moreProducts, photoQuery } from './more-products.js';

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

const CUSTOMERS = [
  { name: 'Aarav Sharma', email: 'customer@meridian.store', password: 'Customer@123' },
];

/** Extra admin handles for the team — same demo password. */
const ADMINS = [
  { name: 'Sahaj Saxena', email: 'sahajsaxena2122@gmail.com', password: 'Admin@123' },
  { name: 'Lucky Dewangan', email: 'luckydewangan022@gmail.com', password: 'Admin@123' },
  { name: 'Ankita', email: 'nitinankita09@gmail.com', password: 'Admin@123' },
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
  const teamAdmins = await User.create(
    ADMINS.map((a) => ({ ...a, role: 'admin' }))
  );
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
  const docs = products.map((p) => {
    const query = p.photo || photoQuery[p.name] || p.tags?.[0] || p.name;
    const { photo, ...rest } = p;
    return {
      ...rest,
      // Original store: no fabricated ratings or sales counters.
      rating: { average: 0, count: 0 },
      sold: 0,
      category: catByName.get(p.category)._id,
      sku: `MRD-${p.category.slice(0, 3).toUpperCase()}-${String(Math.floor(rand() * 9000) + 1000)}`,
      images: [{ url: media[query] || IMAGE_BY_CATEGORY[p.category], alt: p.name }],
    };
  });
  const created = await Product.create(docs);
  console.log(`    ✔ ${created.length} products`);

  /* ------------------------------ coupons ------------------------------ */
  console.log('  … creating coupons');
  await Coupon.create(coupons);

  /* ------------------------------ summary ------------------------------ */
  // No fake orders/reviews/sales are generated — the store starts clean and
  // only real customer activity shows up (and in MongoDB Atlas).
  console.log(`\n  ✔ Seed complete`);
  console.log(`    Admin    : ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
  for (const a of teamAdmins) console.log(`    Admin    : ${a.email} / Admin@123`);
  console.log(`    Customer : ${users[0].email} / Customer@123`);
  console.log(`    Products : ${created.length} across ${cats.length} categories`);
  console.log(`    Orders   : none seeded — only real orders will exist\n`);

  await disconnectDB();
}

seed().catch((err) => {
  console.error('✖ Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
