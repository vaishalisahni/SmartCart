const Order = require('../models/Order');
const Product = require('../models/Product');
const { Coupon } = require('../models/Others');
const { sendOrderConfirmationEmail } = require('../utils/email');

// @POST /api/orders
exports.placeOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode, paymentResult } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });

  // Verify stock and calculate price
  let itemsPrice = 0;
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) return res.status(400).json({ message: `Product not found: ${item.product}` });
    if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
    orderItems.push({ product: product._id, name: product.name, image: product.images[0] || '', price: product.price, quantity: item.quantity });
    itemsPrice += product.price * item.quantity;
    product.stock -= item.quantity;
    await product.save();
  }

  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
    if (coupon && itemsPrice >= coupon.minOrderAmount) {
      discountAmount = coupon.discountType === 'percentage'
        ? Math.min(itemsPrice * coupon.discountValue / 100, coupon.maxDiscount || Infinity)
        : coupon.discountValue;
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  const taxPrice = Math.round(itemsPrice * 0.18);
  const shippingPrice = itemsPrice > 499 ? 0 : 49;
  const totalPrice = itemsPrice + taxPrice + shippingPrice - discountAmount;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    paymentResult: paymentResult || {},
    isPaid: paymentMethod !== 'cod',
    paidAt: paymentMethod !== 'cod' ? new Date() : undefined,
    itemsPrice,
    taxPrice,
    shippingPrice,
    discountAmount,
    totalPrice,
    couponCode: couponCode || '',
    statusHistory: [{ status: 'placed', note: 'Order placed successfully' }],
  });

  try { await sendOrderConfirmationEmail(req.user.email, order); } catch (e) { console.log('Email failed:', e.message); }

  res.status(201).json({ success: true, order });
};

// @GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('items.product', 'name images');
  res.json({ success: true, orders });
};

// @GET /api/orders/:id
exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product', 'name images');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ success: true, order });
};

// @PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });
  if (!['placed', 'confirmed'].includes(order.orderStatus)) return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
  order.orderStatus = 'cancelled';
  order.cancelReason = req.body.reason || '';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by user' });
  await order.save();
  res.json({ success: true, order });
};