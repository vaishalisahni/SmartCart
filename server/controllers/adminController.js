const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { Review, Coupon } = require('../models/Others');

// Dashboard stats
exports.getDashboard = async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, orders] = await Promise.all([
    User.countDocuments({ role: { $ne: 'super_admin' } }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.find().select('totalPrice createdAt orderStatus'),
  ]);
  const totalRevenue = orders.filter(o => o.orderStatus !== 'cancelled').reduce((s, o) => s + o.totalPrice, 0);
  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email');

  // Sales by month (last 6 months)
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const salesData = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, orderStatus: { $ne: 'cancelled' } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const lowStockProducts = await Product.find({ isActive: true, stock: { $lt: 10 } }).select('name stock').limit(10);

  res.json({ success: true, stats: { totalUsers, totalProducts, totalOrders, totalRevenue }, recentOrders, salesData, lowStockProducts });
};

// All orders with filter
exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { orderStatus: status } : {};
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate('user', 'name email');
  res.json({ success: true, orders, total });
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.orderStatus = status;
  if (status === 'delivered') { order.isDelivered = true; order.deliveredAt = new Date(); }
  order.statusHistory.push({ status, note: note || '' });
  await order.save();
  res.json({ success: true, order });
};

// All users
exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = { role: { $ne: 'super_admin' } };
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, users, total });
};

exports.toggleBlockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ success: true, message: user.isBlocked ? 'User blocked' : 'User unblocked', user });
};

// Coupons
exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
};

exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
};

exports.deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
};

exports.validateCoupon = async (req, res) => {
  const { code, cartTotal } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
  if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon' });
  if (cartTotal < coupon.minOrderAmount) return res.status(400).json({ message: `Min order ₹${coupon.minOrderAmount} required` });
  const discount = coupon.discountType === 'percentage'
    ? Math.min(cartTotal * coupon.discountValue / 100, coupon.maxDiscount || Infinity)
    : coupon.discountValue;
  res.json({ success: true, coupon, discount });
};

exports.updateUserRole = async (req, res) => {
  if (req.user?.role !== 'super_admin')
    return res.status(403).json({ message: 'Only super admins can change roles' });
  const { role } = req.body;
  const allowed = ['user', 'admin', 'seller'];
  if (!allowed.includes(role))
    return res.status(400).json({ message: 'Invalid role' });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ success: true, user });
};