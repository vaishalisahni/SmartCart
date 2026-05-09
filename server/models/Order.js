const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], default: 'cod' },
  paymentResult: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    status: String,
  },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  itemsPrice: { type: Number, required: true },
  taxPrice: { type: Number, default: 0 },
  shippingPrice: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  couponCode: { type: String, default: '' },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'placed',
  },
  statusHistory: [{
    status: String,
    updatedAt: { type: Date, default: Date.now },
    note: String,
  }],
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,
  cancelReason: String,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);