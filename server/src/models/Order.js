import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
  },
  { _id: false }
);

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (v) => v.length > 0, message: 'An order needs at least one item' },
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ['cod', 'upi', 'card', 'netbanking'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },

    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      shipping: { type: Number, required: true, min: 0, default: 0 },
      discount: { type: Number, required: true, min: 0, default: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    couponCode: { type: String, default: '' },

    /** Append-only history that renders as a timeline on the order page. */
    timeline: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        note: { type: String, default: '' },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    deliveredAt: { type: Date },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.orderNumber = `MRD-${stamp}-${rand}`;
  }
  if (this.timeline.length === 0) {
    this.timeline.push({ status: 'pending', note: 'Order placed', at: new Date() });
  }
  next();
});

export { ORDER_STATUSES };
export default mongoose.model('Order', orderSchema);
