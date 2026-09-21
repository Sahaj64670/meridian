import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    tagline: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    /** Key used by the frontend to pick the right icon. */
    icon: { type: String, default: 'package' },
    /** Tailwind-friendly colour tokens so each category has its own identity. */
    accent: { type: String, default: 'emerald' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

categorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

/** Live product count for each category (shown in the sidebar / bento grid). */
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

export default mongoose.model('Category', categorySchema);
