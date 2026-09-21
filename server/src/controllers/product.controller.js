import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { send } from '../utils/respond.js';

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { 'rating.average': -1, 'rating.count': -1 },
  popular: { sold: -1, 'rating.count': -1 },
  discount: { price: 1 },
};

/** GET /api/products — list with search, filters, sorting and pagination. */
export const listProducts = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = { isActive: true };

  if (q.search) {
    // Escape regex metacharacters so a search string can't become a pattern.
    const rx = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { tags: rx }, { description: rx }];
  }

  if (q.category) {
    const ids = q.category
      .split(',')
      .filter(Boolean)
      .map((slugOrId) =>
        mongoose.isValidObjectId(slugOrId) ? new mongoose.Types.ObjectId(slugOrId) : null
      );
    const slugs = q.category.split(',').filter((s) => s && !mongoose.isValidObjectId(s));

    const bySlug = slugs.length ? await Category.find({ slug: { $in: slugs } }).select('_id') : [];
    const idsAll = [...ids.filter(Boolean), ...bySlug.map((c) => c._id)];
    if (idsAll.length) filter.category = { $in: idsAll };
  }

  if (q.brand) filter.brand = { $in: q.brand.split(',') };
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.price = {
      ...(q.minPrice !== undefined ? { $gte: q.minPrice } : {}),
      ...(q.maxPrice !== undefined ? { $lte: q.maxPrice } : {}),
    };
  }
  if (q.rating !== undefined) filter['rating.average'] = { $gte: q.rating };
  if (q.inStock) filter.stock = { $gt: 0 };
  if (q.featured) filter.featured = true;

  const sort = SORTS[q.sort] || SORTS.newest;
  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sort).skip(skip).limit(q.limit),
    Product.countDocuments(filter),
  ]);

  // `discount` sorting needs a computed value — sort that page set in memory.
  const data =
    q.sort === 'discount'
      ? [...items].sort((a, b) => b.discountPercent - a.discountPercent)
      : items;

  await send(res, {
    data,
    meta: {
      total,
      page: q.page,
      limit: q.limit,
      pages: Math.max(1, Math.ceil(total / q.limit)),
      hasMore: skip + items.length < total,
    },
  });
});

/** GET /api/products/:slug */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate('category', 'name slug accent');

  if (!product) throw ApiError.notFound('Product not found');
  await send(res, { data: product });
});

/** GET /api/products/:slug/related */
export const getRelated = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true });
  if (!product) throw ApiError.notFound('Product not found');

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .sort({ 'rating.average': -1 })
    .limit(Number(req.query.limit) || 8)
    .populate('category', 'name slug');

  await send(res, { data: related });
});

/** GET /api/products/meta/filters — powers the filter sidebar. */
export const getFilterMeta = asyncHandler(async (_req, res) => {
  const [brands, priceAgg, count] = await Promise.all([
    Product.distinct('brand', { isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
    Product.countDocuments({ isActive: true }),
  ]);

  await send(res, {
    data: {
      brands: brands.sort(),
      price: {
        min: Math.floor((priceAgg[0]?.min ?? 0) / 100) * 100,
        max: Math.ceil((priceAgg[0]?.max ?? 100000) / 1000) * 1000,
      },
      count,
    },
  });
});

/* ----------------------------- admin CRUD ----------------------------- */

/** POST /api/products */
export const createProduct = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    $or: [{ slug: req.body.category }, { _id: mongoose.isValidObjectId(req.body.category) ? req.body.category : null }],
  });
  if (!category) throw ApiError.badRequest('Category does not exist');

  const product = await Product.create({ ...req.body, category: category._id });
  await send(res, { status: 201, data: product, message: 'Product created' });
});

/** PATCH /api/products/:id */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  if (req.body.category) {
    const category = await Category.findOne({
      $or: [{ slug: req.body.category }, { _id: mongoose.isValidObjectId(req.body.category) ? req.body.category : null }],
    });
    if (!category) throw ApiError.badRequest('Category does not exist');
    req.body.category = category._id;
  }

  Object.assign(product, req.body);
  await product.save();
  await send(res, { data: product, message: 'Product updated' });
});

/** DELETE /api/products/:id */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  await product.deleteOne();
  await send(res, { message: 'Product deleted' });
});
