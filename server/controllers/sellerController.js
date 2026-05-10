const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// ── Profile ──────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  res.json({ success: true, profile });
};

exports.createOrUpdateProfile = async (req, res) => {
  const { storeName, storeDescription, storeLogo, storeBanner, contactEmail, contactPhone, address, gstNumber, bankDetails } = req.body;
  if (!storeName) return res.status(400).json({ message: 'Store name is required' });

  let profile = await SellerProfile.findOne({ user: req.user._id });
  if (profile) {
    Object.assign(profile, { storeName, storeDescription, storeLogo, storeBanner, contactEmail, contactPhone, address, gstNumber, ...(bankDetails && { bankDetails }) });
    await profile.save();
  } else {
    profile = await SellerProfile.create({ user: req.user._id, storeName, storeDescription, storeLogo, storeBanner, contactEmail, contactPhone, address, gstNumber, bankDetails });
    // Update user role to seller
    await User.findByIdAndUpdate(req.user._id, {
      role: 'seller',
      'sellerProfile.storeName': storeName,
      'sellerProfile.storeDescription': storeDescription,
    });
  }
  res.json({ success: true, profile });
};

exports.registerAsSeller = async (req, res) => {
  const { storeName, storeDescription } = req.body;
  if (!storeName) return res.status(400).json({ message: 'Store name required' });

  const existing = await SellerProfile.findOne({ user: req.user._id });
  if (existing) return res.status(400).json({ message: 'You already have a seller profile' });

  const profile = await SellerProfile.create({
    user: req.user._id,
    storeName,
    storeDescription: storeDescription || '',
    approved: false,
  });

  await User.findByIdAndUpdate(req.user._id, {
    role: 'seller',
    'sellerProfile.storeName': storeName,
    'sellerProfile.storeDescription': storeDescription || '',
  });

  res.status(201).json({ success: true, profile, message: 'Seller registration submitted. Awaiting admin approval.' });
};

// ── Dashboard Stats ──────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: 'Seller profile not found. Please register as a seller first.' });

  const [myProducts, totalProducts] = await Promise.all([
    Product.find({ seller: req.user._id, isActive: true }).select('name price stock ratings numReviews images').limit(5).sort({ createdAt: -1 }),
    Product.countDocuments({ seller: req.user._id, isActive: true }),
  ]);

  const allOrders = await Order.find({ 'items.seller': req.user._id })
    .populate('user', 'name email').sort({ createdAt: -1 }).limit(10);

  const totalOrders    = allOrders.length;
  const totalRevenue   = allOrders.filter(o => o.orderStatus !== 'cancelled').reduce((s, o) => {
    const myItems = o.items.filter(i => String(i.seller) === String(req.user._id));
    return s + myItems.reduce((a, i) => a + i.price * i.quantity, 0);
  }, 0);

  const lowStock = await Product.find({ seller: req.user._id, isActive: true, stock: { $lt: 10 } }).select('name stock');

  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const salesData = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.seller': req.user._id, createdAt: { $gte: sixMonthsAgo }, orderStatus: { $ne: 'cancelled' } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, orders: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({ success: true, profile, stats: { totalProducts, totalOrders, totalRevenue }, recentProducts: myProducts, recentOrders: allOrders.slice(0, 5), lowStock, salesData });
};

// ── Products ─────────────────────────────────────────────────
exports.getMyProducts = async (req, res) => {
  const { page = 1, limit = 15, search = '' } = req.query;
  const query = { seller: req.user._id };
  if (search) query.$text = { $search: search };

  const [products, total] = await Promise.all([
    Product.find(query).populate('category', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    Product.countDocuments(query),
  ]);
  res.json({ success: true, products, total, pages: Math.ceil(total / limit) });
};

exports.createProduct = async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile || !profile.approved) {
    return res.status(403).json({ message: 'Your seller account is pending approval.' });
  }
  const product = await Product.create({
    ...req.body,
    seller: req.user._id,
    sku: uuidv4().slice(0, 8).toUpperCase(),
    price: Number(req.body.price),
    originalPrice: Number(req.body.originalPrice || req.body.price),
    stock: Number(req.body.stock),
  });
  res.status(201).json({ success: true, product });
};

exports.updateProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
  if (!product) return res.status(404).json({ message: 'Product not found or not yours' });
  Object.assign(product, req.body);
  await product.save();
  res.json({ success: true, product });
};

exports.deleteProduct = async (req, res) => {
  await Product.findOneAndUpdate({ _id: req.params.id, seller: req.user._id }, { isActive: false });
  res.json({ success: true, message: 'Product removed' });
};

// ── Orders ───────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  const { page = 1, limit = 20, status = '' } = req.query;
  const match = { 'items.seller': req.user._id };
  if (status) match.orderStatus = status;

  const orders = await Order.find(match)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Order.countDocuments(match);

  // Filter items to only show this seller's items
  const filtered = orders.map(o => ({
    ...o.toObject(),
    items: o.items.filter(i => String(i.seller) === String(req.user._id)),
  }));

  res.json({ success: true, orders: filtered, total });
};

// ── Admin: manage sellers ─────────────────────────────────────
exports.getAllSellers = async (req, res) => {
  const sellers = await SellerProfile.find().populate('user', 'name email createdAt').sort({ createdAt: -1 });
  res.json({ success: true, sellers });
};

exports.approveSeller = async (req, res) => {
  const profile = await SellerProfile.findByIdAndUpdate(req.params.id, { approved: req.body.approved }, { new: true });
  if (!profile) return res.status(404).json({ message: 'Seller not found' });
  res.json({ success: true, profile });
};