const Product = require('../models/Product');
const { Review } = require('../models/Others');

// @GET /api/products
exports.getProducts = async (req, res) => {
  const {
    search, category, brand, minPrice, maxPrice,
    rating, sort, page = 1, limit = 12, featured, ids,
  } = req.query;

  // ── If specific IDs requested (AI recommendations) ──────────
  if (ids) {
    const mongoose = require('mongoose');
    const idList = ids.split(',').filter(Boolean);
    const validIds = idList.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) return res.json({ success: true, products: [], total: 0, page: 1, pages: 0 });
    const products = await Product.find({ _id: { $in: validIds }, isActive: true })
      .populate('category', 'name slug');
    // Preserve order from AI
    const ordered = validIds
      .map(id => products.find(p => p._id.toString() === id))
      .filter(Boolean);
    return res.json({ success: true, products: ordered, total: ordered.length, page: 1, pages: 1 });
  }

  // ── Normal query ─────────────────────────────────────────────
  const query = { isActive: true };

  if (search) {
    // Try full-text first; fall back to regex if index not ready
    try {
      query.$text = { $search: search };
    } catch (_) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand:       { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
      ];
    }
  }

  if (category) query.category = category;
  if (brand)    query.brand = new RegExp(brand, 'i');
  if (featured === 'true') query.isFeatured = true;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (rating) query.ratings = { $gte: Number(rating) };

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc')   sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'rating')     sortOption = { ratings: -1 };
  else if (sort === 'popularity') sortOption = { numReviews: -1 };
  else if (sort === 'newest')     sortOption = { createdAt: -1 };

  const total    = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
};

// @GET /api/products/:id
exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found' });
  res.json({ success: true, product });
};

// @POST /api/products (admin)
exports.createProduct = async (req, res) => {
  const { v4: uuidv4 } = require('uuid');
  const product = await Product.create({
    ...req.body,
    sku: uuidv4().slice(0, 8).toUpperCase(),
  });
  res.status(201).json({ success: true, product });
};

// @PUT /api/products/:id (admin)
exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id, req.body, { new: true, runValidators: true }
  );
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ success: true, product });
};

// @DELETE /api/products/:id (admin) — soft delete
exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id, { isActive: false }, { new: true }
  );
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ success: true, message: 'Product removed' });
};

// @GET /api/products/brands
exports.getBrands = async (req, res) => {
  const brands = await Product.distinct('brand', { isActive: true, brand: { $ne: '' } });
  res.json({ success: true, brands });
};