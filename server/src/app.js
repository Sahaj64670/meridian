import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // required behind Render's load balancer
  app.disable('x-powered-by');

  app.use(
    helmet({
      // The React build loads assets from the same origin; keep CSP permissive
      // for the API while still setting safe defaults.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
        cb(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (!env.isProd) app.use(morgan('dev'));
  else app.use(morgan('combined'));

  app.use(
    '/api',
    rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false })
  );

  app.get('/', (_req, res) =>
    res.json({
      name: 'Meridian Marketplace API',
      version: '1.0.0',
      docs: '/api/health',
      endpoints: [
        'GET  /api/health',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET  /api/products?search=&category=&sort=&page=',
        'GET  /api/products/:slug',
        'GET  /api/categories',
        'POST /api/orders',
        'GET  /api/orders/mine',
        'GET  /api/admin/stats/overview',
      ],
    })
  );

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
