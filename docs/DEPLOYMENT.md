# Deploying Meridian (Render + Vercel + MongoDB Atlas)

All three services have free tiers that are more than enough for a demo.
Total time: **about 20 minutes**.

---

## 1. Database — MongoDB Atlas (free M0 cluster)

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com) (Google login works).
2. Create a **free M0** cluster (closest region to you).
3. Under **Security → Database Access**, create a user, e.g.
   `meridian` / a strong password.
4. Under **Security → Network Access**, add `0.0.0.0/0` (allow from anywhere — fine for a demo).
5. **Connect → Drivers** and copy the connection string. It looks like:
   ```
   mongodb+srv://meridian:<password>@cluster0.xxxxx.mongodb.net/meridian
   ```
   Replace `<password>` with the database user's password. **Save this** as `MONGODB_URI`.

## 2. Backend — Render

1. Push this repository to **GitHub**.
2. Go to [render.com](https://render.com) → **New → Blueprint**, select the repo.
   Render finds `render.yaml` and proposes the `meridian-api` service — click **Apply**.
3. In the service's **Environment** tab, fill the `sync: false` values:
   | Variable | Value |
   | -------- | ----- |
   | `MONGODB_URI` | the Atlas string from step 1 |
   | `CLIENT_URL` | your future Vercel URL, e.g. `https://meridian-store.vercel.app` |
   | `ADMIN_EMAIL` | `admin@meridian.store` |
   | `ADMIN_PASSWORD` | pick a strong one |
   (`JWT_SECRET` is auto-generated.)
4. **Manual Deploy → Deploy latest commit**. Watch the logs until you see
   `Meridian API listening`.
5. Seed the deployed database **once**, from your laptop:
   ```bash
   cd server
   MONGODB_URI="mongodb+srv://..." npm run seed
   ```
6. Confirm `https://meridian-api.onrender.com/api/health` returns `{ "status": "ok" }`.

> The free tier sleeps after 15 idle minutes; the first request after a pause takes ~30 s.

## 3. Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the same repo.
2. Set **Root Directory** to `client` (Vercel detects Vite automatically).
3. Add environment variable:
   | Name | Value |
   | ---- | ----- |
   | `VITE_API_URL` | `https://meridian-api.onrender.com/api` |
4. Deploy. Open the printed URL — you're live. 🎉

## 4. Checklist before submission

- [ ] Storefront loads at the Vercel URL (hero, categories, product grid)
- [ ] Register a fresh account → add to cart → apply `MERIDIAN10` → checkout → order success page
- [ ] Order shows under **My orders** with a timeline
- [ ] Sign in as admin → dashboard shows revenue chart, top sellers, low-stock alerts
- [ ] Admin: advance an order's status; cancel one and see stock return
- [ ] `GET /api/health` returns ok on Render

## Notes

- **CORS**: the API only accepts the origins listed in `CLIENT_URL`. If you add a second
  frontend URL later, separate them with commas.
- **Payments** are simulated (no gateway keys required) — the checkout marks UPI/card
  orders as *paid* instantly and COD as *pending*. Swapping in Razorpay test keys later
  only touches `order.controller.js`.
- **Images** ship inside the repo (`client/public/images`), so nothing depends on external CDNs.
