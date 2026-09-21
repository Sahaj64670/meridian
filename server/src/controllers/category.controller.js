import Category from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { send } from '../utils/respond.js';

/** GET /api/categories — every category with a live product count. */
export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find()
    .sort({ order: 1, name: 1 })
    .populate({ path: 'productCount', match: { isActive: true } });

  await send(res, { data: categories });
});
