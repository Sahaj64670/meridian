import { z } from 'zod';

/* ------------------------------- auth ------------------------------- */
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Za-z]/, 'Password needs a letter')
    .regex(/\d/, 'Password needs a number'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

/* ------------------------------ products ----------------------------- */
const colorSchema = z.object({ name: z.string(), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) });

export const productSchema = z.object({
  name: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10, 'Description is too short'),
  highlights: z.array(z.string()).default([]),
  brand: z.string().trim().min(1),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().min(0).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  sku: z.string().trim().optional().default(''),
  images: z.array(z.object({ url: z.string(), alt: z.string().default('') })).default([]),
  colors: z.array(colorSchema).default([]),
  sizes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  specs: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
  featured: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial();

export const productQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  inStock: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sort: z
    .enum(['newest', 'price-asc', 'price-desc', 'rating', 'popular', 'discount'])
    .default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});

/* ------------------------------- orders ------------------------------ */
export const addressSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  line1: z.string().trim().min(3),
  line2: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  pincode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
});

export const cartItemSchema = z.object({
  product: z.string().min(1),
  qty: z.coerce.number().int().min(1).max(10).default(1),
  size: z.string().optional().default(''),
  color: z.string().optional().default(''),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty'),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['cod', 'upi']).default('cod'),
  /** UPI transaction reference (UTR) — required for UPI payments. */
  utr: z.string().trim().max(30).optional().default(''),
  couponCode: z.string().trim().toUpperCase().optional().default(''),
  saveAddress: z.coerce.boolean().default(true),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']),
  note: z.string().trim().max(200).optional().default(''),
});

/* ------------------------------- users ------------------------------- */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().max(15).optional(),
});

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3),
  subtotal: z.coerce.number().min(0),
});
