import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import * as authController from '../controllers/user.controller.js';
import * as productController from '../controllers/product.controller.js';
import * as categoryController from '../controllers/category.controller.js';
import * as orderController from '../controllers/order.controller.js';
import * as adminController from '../controllers/admin.controller.js';

import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  productQuerySchema,
  createOrderSchema,
  updateOrderStatusSchema,
  updateProfileSchema,
  addressSchema,
  couponSchema,
} from '../validators/schemas.js';

const router = Router();

/** Throttle only the sensitive auth endpoints — everything else stays snappy. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

/* ------------------------------- health ------------------------------ */
router.get('/health', (_req, res) =>
  res.json({ success: true, status: 'ok', uptime: process.uptime(), time: new Date().toISOString() })
);

/* -------------------------------- auth ------------------------------- */
router.post('/auth/register', authLimiter, validate(registerSchema), authController.register);
router.post('/auth/login', authLimiter, validate(loginSchema), authController.login);
router.get('/auth/me', protect, authController.me);

/* ------------------------------- users ------------------------------- */
router.patch('/users/me', protect, validate(updateProfileSchema), authController.updateProfile);
router.post('/users/me/addresses', protect, validate(addressSchema), authController.addAddress);
router.delete('/users/me/addresses/:id', protect, authController.removeAddress);

/* ----------------------------- categories ---------------------------- */
router.get('/categories', categoryController.listCategories);

/* ------------------------------ products ----------------------------- */
router.get('/products/meta/filters', productController.getFilterMeta);
router.get('/products', validate(productQuerySchema, 'query'), productController.listProducts);
router.get('/products/:slug', productController.getProduct);
router.get('/products/:slug/related', productController.getRelated);

router.post('/products', protect, authorize('admin'), validate(productSchema), productController.createProduct);
router.patch('/products/:id', protect, authorize('admin'), validate(productUpdateSchema), productController.updateProduct);
router.delete('/products/:id', protect, authorize('admin'), productController.deleteProduct);

/* ------------------------------- orders ------------------------------ */
router.post('/coupons/validate', validate(couponSchema), orderController.validateCoupon);
router.post('/orders', protect, validate(createOrderSchema), orderController.createOrder);
router.get('/orders/mine', protect, orderController.myOrders);
router.get('/orders/:id', protect, orderController.getOrder);
router.post('/orders/:id/cancel', protect, orderController.cancelOrder);

/* -------------------------------- admin ------------------------------ */
const admin = Router();
admin.use(protect, authorize('admin'));
admin.get('/stats/overview', adminController.overview);
admin.get('/stats/sales', adminController.salesSeries);
admin.get('/products', adminController.listProductsAdmin);
admin.get('/orders', adminController.listOrders);
admin.patch('/orders/:id/status', validate(updateOrderStatusSchema), adminController.updateOrderStatus);
admin.get('/customers', adminController.listCustomers);
router.use('/admin', admin);

export default router;
