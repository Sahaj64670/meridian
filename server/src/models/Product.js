import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 140 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    highlights: [{ type: String, trim: true }],
    brand: { type: String, required: true, trim: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    price: { type: Number, required: true, min: 0 },
    /** "Was" price used to render the strike-through + discount %. */
    compareAtPrice: { type: Number, min: 0, default: 0 },

    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, unique: true, sparse: true, trim: true },

    images: [{ url: String, alt: String }],
    /** Short showcase clip shown on the product page (free stock, CC-licensed). */
    video: { type: String, default: '' },
    colors: [{ name: String, hex: String }],
    sizes: [{ type: String, trim: true }],

    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    specs: [{ key: String, value: String }],

    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    sold: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.pre('validate', function (next) {
  if (this.name) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

/** Powers the search box: text index across the fields customers actually type. */
productSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ 'rating.average': -1 });

productSchema.virtual('discountPercent').get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

export default mongoose.model('Product', productSchema);
