# Meridian — Full-Stack E-Commerce Marketplace

A production-grade, multi-category e-commerce platform built with the **MERN stack**
(MongoDB · Express · React · Node.js). One storefront, six categories, a complete
admin console, and a design system built around a deep-evergreen & gold palette.

> Built as a Full-Stack Development course project — frontend, backend and deployment included.

---

## ✨ Features

### Storefront (customer)
- **Home** — hero, category bento grid, featured bestsellers, coupon banner, new arrivals
- **Catalog** — search, category / price / rating / brand filters, 6 sort modes, pagination
- **Product page** — gallery, colour & size variants, specs table, stock urgency, related items
- **Cart** — quantity steppers, coupons (`MERIDIAN10`, `FIRST200`, `FREESHIP`, `WELCOME50`), free-shipping progress
- **Checkout** — validated Indian address form, UPI QR or Cash on Delivery
- **Payments** — real-world Indian flow: **UPI QR** (two store accounts with
  copyable UPI IDs, UTR capture & admin verification) + **Cash on Delivery**.
  No gateway keys or paid services required
- **Catalogue** — 8 categories × 15 products (120 items), every product with a
  unique, openly-licensed photo
- **Orders** — list, detail page with delivery timeline, self-service cancellation (restocks items)
- **Auth** — register / login with JWT, hashed passwords, role-aware UI

### Admin console
- **Overview dashboard** — revenue, orders, customers, AOV, today vs yesterday,
  hand-rolled SVG revenue chart (30 days), top sellers, low-stock alerts, category revenue split
- **Orders** — search + status filters, one-click status progression (pending → confirmed → packed → shipped → delivered), automatic restock on cancel
- **Products** — full CRUD with modal editor, stock & visibility control
- **Customers** — registration date, order count, lifetime spend

### Engineering highlights
- Prices & stock are **never trusted from the client** — recalculated server-side at order time
- Atomic stock reservation with rollback on failure
- Zod request validation, centralised error handler, rate limiting, Helmet, CORS allowlist
- 6-test API smoke suite (`node:test` + in-memory MongoDB)
- Zero-install local MongoDB via `mongodb-memory-server` (`npm run db`)
- Seeded demo dataset: 42 products, 6 categories, coupons, 30 orders over the last 30 days

---

## 🚀 Quick start (local)

Requirements: **Node.js 18+**. No MongoDB install needed.

```bash
git clone <your-repo-url> meridian && cd meridian
npm run install:all      # installs root + server + client dependencies

# One command: in-memory MongoDB + API (port 5000) + React (port 5173)
npm run dev
```

In a **second terminal**, once, load the demo data:

```bash
npm run seed
```

Open **http://localhost:5173** — the storefront is live.

### Demo accounts

| Role     | Email                    | Password      |
| -------- | ------------------------ | ------------- |
| Admin    | `admin@meridian.store`   | `Admin@123`   |
| Admin    | `sahajsaxena2122@gmail.com` | `Admin@123` |
| Admin    | `luckydewangan022@gmail.com` | `Admin@123` |
| Admin    | `nitinankita09@gmail.com` | `Admin@123` |
| Customer | `customer@meridian.store`| `Customer@123`|

Sign in as the admin and open **Account → Admin dashboard** to see the analytics console
pre-filled with 30 days of realistic order data.

### Using a real MongoDB instead

Create `server/.env` (copy from `server/.env.example`) and point
`MONGODB_URI` at your local instance or a free **MongoDB Atlas** cluster, then run
`npm run server` (skip `npm run db`).

---

## 📁 Project structure

```
meridian/
├── package.json            # root scripts (dev / seed / test / build)
├── render.yaml             # Render deployment blueprint (API)
├── server/                 # Express REST API
│   ├── src/
│   │   ├── config/         # env loading, DB connection
│   │   ├── models/         # User, Product, Category, Order, Coupon
│   │   ├── controllers/    # auth, products, orders, admin stats
│   │   ├── middleware/     # auth, validation, error handling
│   │   ├── routes/         # all /api routes
│   │   ├── services/       # pricing engine (coupons, shipping)
│   │   ├── validators/     # Zod schemas
│   │   └── seed/           # demo catalogue + order generator
│   ├── scripts/memory-db.mjs  # zero-install mongod
│   └── tests/api.test.js   # API smoke tests
└── client/                 # React 18 + Vite + Tailwind storefront
    ├── public/images/      # curated product photography
    └── src/
        ├── pages/          # Home, Shop, Product, Cart, Checkout, Orders, Auth
        ├── pages/admin/    # Dashboard, Orders, Products, Customers
        ├── components/     # Navbar, ProductCard, layout, UI kit
        ├── store/          # Zustand: auth, cart, toasts
        └── lib/api.js      # fetch wrapper + helpers
```

## 🔌 API overview

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/auth/register` · `/api/auth/login` | JWT auth |
| GET  | `/api/products?search=&category=&brand=&minPrice=&maxPrice=&rating=&sort=&page=` | Catalog with filters |
| GET  | `/api/products/:slug` · `/api/products/:slug/related` | Product detail |
| GET  | `/api/products/meta/filters` | Filter metadata (brands, price range) |
| GET  | `/api/categories` | Categories with live product counts |
| POST | `/api/coupons/validate` | Preview a coupon against a subtotal |
| POST | `/api/orders` | Place order (auth) — server-side pricing & stock |
| GET  | `/api/orders/mine` · `/api/orders/:id` | Order history & detail (auth) |
| POST | `/api/orders/:id/cancel` | Cancel + automatic restock (auth) |
| GET  | `/api/admin/stats/overview` · `/stats/sales` | Dashboard data (admin) |
| GET/PATCH | `/api/admin/orders` · `/orders/:id/status` | Order management (admin) |
| GET  | `/api/admin/customers` | Customer list with spend (admin) |
| POST/PATCH/DELETE | `/api/products…` | Product CRUD (admin) |

Run the test suite: `npm test` (spins up an isolated in-memory MongoDB).

## ☁️ Deployment

Full walkthrough in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — in short:

1. **Database** — free MongoDB Atlas cluster → copy connection string
2. **API** — deploy `server/` to Render (`render.yaml` blueprint), set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`.
   For real order-confirmation emails add `BREVO_KEY` (free Brevo.com API key — Render's free tier blocks
   Gmail SMTP ports) and `MAIL_USER` (the verified Brevo sender address). Without them the store still
   works; emails are logged to the console instead of sent.
3. **Frontend** — deploy `client/` to Vercel, set `VITE_API_URL` to the Render URL

## 🧰 Tech stack

React 18 · Vite 5 · Tailwind CSS 3 · Zustand · TanStack Query · React Router 6 ·
Express 4 · Mongoose 8 · Zod · JWT (jsonwebtoken) · bcryptjs · Helmet · Node 20
