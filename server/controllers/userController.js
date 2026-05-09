const { Cart, Wishlist, Review } = require('../models/Others');
const Product = require('../models/Product');
const User = require('../models/User');

// ========== CART ==========
exports.getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price images stock isActive discountPercent');
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.json({ success: true, cart });
};

exports.addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });
  const existing = cart.items.find(i => i.product.toString() === productId);
  if (existing) existing.quantity = Math.min(existing.quantity + quantity, product.stock);
  else cart.items.push({ product: productId, quantity });
  await cart.save();
  await cart.populate('items.product', 'name price images stock isActive discountPercent');
  res.json({ success: true, cart });
};

exports.updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  const item = cart.items.find(i => i.product.toString() === productId);
  if (!item) return res.status(404).json({ message: 'Item not in cart' });
  if (quantity <= 0) cart.items = cart.items.filter(i => i.product.toString() !== productId);
  else item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product', 'name price images stock isActive discountPercent');
  res.json({ success: true, cart });
};

exports.removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true, cart });
};

exports.clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ success: true, message: 'Cart cleared' });
};

// ========== WISHLIST ==========
exports.getWishlist = async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products', 'name price images ratings stock');
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  res.json({ success: true, wishlist });
};

exports.toggleWishlist = async (req, res) => {
  const { productId } = req.body;
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });
  const idx = wishlist.products.indexOf(productId);
  let added;
  if (idx === -1) { wishlist.products.push(productId); added = true; }
  else { wishlist.products.splice(idx, 1); added = false; }
  await wishlist.save();
  res.json({ success: true, added, message: added ? 'Added to wishlist' : 'Removed from wishlist' });
};

// ========== REVIEWS ==========
exports.getProductReviews = async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name avatar').sort({ createdAt: -1 });
  res.json({ success: true, reviews });
};

exports.addReview = async (req, res) => {
  const { productId, rating, comment, title } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const existing = await Review.findOne({ user: req.user._id, product: productId });
  if (existing) return res.status(400).json({ message: 'You already reviewed this product' });
  const review = await Review.create({ user: req.user._id, product: productId, rating, comment, title });
  // Update product rating
  const all = await Review.find({ product: productId });
  product.ratings = all.reduce((s, r) => s + r.rating, 0) / all.length;
  product.numReviews = all.length;
  await product.save();
  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, review });
};

exports.deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  await review.deleteOne();
  const all = await Review.find({ product: review.product });
  const product = await Product.findById(review.product);
  if (product) {
    product.ratings = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
    product.numReviews = all.length;
    await product.save();
  }
  res.json({ success: true, message: 'Review deleted' });
};

// ========== USER PROFILE ==========
exports.updateProfile = async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone, avatar }, { new: true });
  res.json({ success: true, user });
};

exports.addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  user.addresses.push(req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
};

exports.updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) return res.status(404).json({ message: 'Address not found' });
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  Object.assign(addr, req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
};

exports.deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
};

exports.addRecentlyViewed = async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);
  user.recentlyViewed = [productId, ...user.recentlyViewed.filter(p => p.toString() !== productId)].slice(0, 10);
  await user.save();
  res.json({ success: true });
};

exports.getRecentlyViewed = async (req, res) => {
  const user = await User.findById(req.user._id).populate('recentlyViewed', 'name price images ratings');
  res.json({ success: true, products: user.recentlyViewed });
};