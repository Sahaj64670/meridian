/**
 * Smoke tests for the Meridian API.
 * Runs against mongodb-memory-server (zero local setup) with node's test runner:
 *
 *   npm test
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

let mongod;
let app;
let server;
let baseUrl;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('meridian_test');
  const { connectDB } = await import('../src/config/db.js');
  const { createApp } = await import('../src/app.js');
  await connectDB(process.env.MONGODB_URI);
  app = createApp();
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  // Seed minimal data.
  const Category = (await import('../src/models/Category.js')).default;
  const Product = (await import('../src/models/Product.js')).default;
  await Category.create({ name: 'Electronics', slug: 'electronics', icon: 'laptop' });
  const cat = await Category.findOne({ slug: 'electronics' });
  await Product.create({
    name: 'Test Earbuds',
    brand: 'TestBrand',
    category: cat._id,
    price: 1999,
    compareAtPrice: 2999,
    stock: 10,
    description: 'Test product for the smoke test suite.',
  });
});

after(async () => {
  server.close();
  await (await import('mongoose')).disconnect();
  await mongod.stop();
});

const api = (path, options = {}) =>
  fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  }).then(async (res) => ({ status: res.status, body: await res.json() }));

test('GET /api/health responds ok', async () => {
  const res = await api('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('register → login → me flow works', async () => {
  const reg = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'Password123' }),
  });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.data.token);

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', password: 'Password123' }),
  });
  assert.equal(login.status, 200);

  const me = await api('/api/auth/me', {
    headers: { Authorization: `Bearer ${login.body.data.token}` },
  });
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, 'test@example.com');
  assert.equal(me.body.data.user.password, undefined, 'password must never leak');
});

test('login rejects a wrong password', async () => {
  const res = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', password: 'WrongPass123' }),
  });
  assert.equal(res.status, 401);
});

test('product list supports search and pagination', async () => {
  const res = await api('/api/products?search=earbuds&limit=5');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 1);
  assert.ok(res.body.meta);
});

test('admin endpoint is protected', async () => {
  const res = await api('/api/admin/stats/overview');
  assert.equal(res.status, 401);
});

test('full order flow: login → place order → prices computed server-side', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', password: 'Password123' }),
  });
  const token = login.body.data.token;

  const products = await api('/api/products?limit=1');
  const product = products.body.data[0];

  const order = await api('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      items: [{ product: product._id, qty: 2 }],
      shippingAddress: {
        fullName: 'Test User', phone: '9812345670', line1: '1 Test Street',
        city: 'Kharar', state: 'Punjab', pincode: '140301',
      },
      paymentMethod: 'upi',
      utr: '123456789012',
      couponCode: '',
      saveAddress: false,
    }),
  });

  assert.equal(order.status, 201);
  const o = order.body.data;
  assert.ok(o.orderNumber.startsWith('MRD-'));
  // Regression: pricing must be real numbers computed server-side (was NaN).
  assert.equal(o.pricing.subtotal, product.price * 2);
  assert.ok(Number.isFinite(o.pricing.total));
  assert.equal(o.paymentStatus, 'pending'); // UPI QR = manual verification
  assert.equal(o.paymentRef, '123456789012'); // UTR recorded
  assert.equal(o.orderStatus, 'pending');

  // Stock must have been decremented.
  const after = await api(`/api/products/${product.slug}`);
  assert.equal(after.body.data.stock, product.stock - 2);
});

test('UPI orders require a valid UTR number', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', password: 'Password123' }),
  });
  const products = await api('/api/products?limit=1');
  const res = await api('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${login.body.data.token}` },
    body: JSON.stringify({
      items: [{ product: products.body.data[0]._id, qty: 1 }],
      shippingAddress: {
        fullName: 'Test User', phone: '9812345670', line1: '1 Test Street',
        city: 'Kharar', state: 'Punjab', pincode: '140301',
      },
      paymentMethod: 'upi',
      utr: 'not-a-utr',
    }),
  });
  assert.equal(res.status, 400);
});

test('unknown routes return a 404 JSON body', async () => {
  const res = await api('/api/nope');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});
