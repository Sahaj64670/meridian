import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'fixed', 'shipping'], required: true },
    value: { type: Number, default: 0, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
