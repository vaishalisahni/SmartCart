// server/utils/seederRoute.js
// Admin-only HTTP seed endpoint — use when shell access is unavailable
const express = require('express');
const r = express.Router();
const { protect, admin } = require('../middleware/auth');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

r.post('/seed', protect, admin, async (req, res) => {
  try {
    const { clearExisting = false } = req.body;

    // Only clear if explicitly requested
    if (clearExisting) {
      await Product.deleteMany({});
      await Category.deleteMany({});
    }

    // Skip if already seeded
    const existingCats = await Category.countDocuments();
    if (existingCats > 0 && !clearExisting) {
      return res.json({ success: false, message: 'Already seeded. Send clearExisting:true to re-seed.' });
    }

    // Seed categories
    const cats = await Category.insertMany([
      { name: 'Electronics',    slug: 'electronics',    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
      { name: 'Clothing',       slug: 'clothing',       image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400' },
      { name: 'Books',          slug: 'books',          image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' },
      { name: 'Home & Kitchen', slug: 'home-kitchen',   image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
      { name: 'Sports',         slug: 'sports',         image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400' },
      { name: 'Beauty',         slug: 'beauty',         image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400' },
      { name: 'Furniture',      slug: 'furniture',      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' },
      { name: 'Groceries',      slug: 'groceries',      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' },
      { name: 'Jewellery',      slug: 'jewellery',      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' },
      { name: 'Toys',           slug: 'toys',           image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=400' },
    ]);

    const [elec, cloth, books, home, sports, beauty, furn, groc, jewel, toysC] = cats;

    // Minimal manual product set (fast, no external API calls)
    const manual = [
      { name: 'Wireless Bluetooth Headphones', description: 'Premium 30hr battery, ANC, foldable design.', price: 2499, originalPrice: 4999, discountPercent: 50, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'], category: elec._id, brand: 'SoundMax', stock: 50, tags: ['audio','wireless'], isFeatured: true, isBestSeller: true, ratings: 4.5, numReviews: 120 },
      { name: 'Smart LED TV 43"', description: '4K Ultra HD Android TV, WiFi, multiple HDMI ports.', price: 27999, originalPrice: 35000, discountPercent: 20, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'], category: elec._id, brand: 'VisionTech', stock: 20, tags: ['tv','4k'], isFeatured: true, ratings: 4.3, numReviews: 85 },
      { name: 'Mechanical Gaming Keyboard RGB', description: 'TKL layout, blue switches, USB-C, per-key RGB.', price: 3499, originalPrice: 5000, discountPercent: 30, images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'], category: elec._id, brand: 'TechKey', stock: 35, tags: ['keyboard','gaming'], ratings: 4.7, numReviews: 200 },
      { name: "Men's Casual Cotton T-Shirt", description: '100% organic cotton, breathable, multiple colours.', price: 399, originalPrice: 799, discountPercent: 50, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'], category: cloth._id, brand: 'StyleWear', stock: 200, tags: ['tshirt','cotton'], isBestSeller: true, ratings: 4.2, numReviews: 350 },
      { name: 'Running Shoes Pro X', description: 'Lightweight EVA sole, mesh upper, cushioned.', price: 1999, originalPrice: 3500, discountPercent: 43, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'], category: sports._id, brand: 'RunFast', stock: 80, tags: ['shoes','running'], isFeatured: true, ratings: 4.6, numReviews: 180 },
      { name: 'Python Programming: Complete Guide', description: 'From basics to ML and web dev. 600+ pages.', price: 599, originalPrice: 899, discountPercent: 33, images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600'], category: books._id, brand: 'TechPublish', stock: 100, tags: ['python','programming'], ratings: 4.8, numReviews: 420 },
      { name: 'Digital Air Fryer 4L', description: '8 presets, non-stick basket, 1400W, healthier cooking.', price: 4499, originalPrice: 7000, discountPercent: 36, images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'], category: home._id, brand: 'HomeCook', stock: 40, tags: ['kitchen','airfryer'], isFeatured: true, isBestSeller: true, ratings: 4.4, numReviews: 95 },
      { name: 'Premium Yoga Mat 6mm', description: 'Non-slip eco TPE, double-layer, carrying strap.', price: 799, originalPrice: 1500, discountPercent: 47, images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'], category: sports._id, brand: 'FitLife', stock: 120, tags: ['yoga','fitness'], ratings: 4.5, numReviews: 230 },
      { name: 'Vitamin C Face Serum 30ml', description: '20% Vitamin C, hyaluronic acid, brighter skin.', price: 699, originalPrice: 1200, discountPercent: 42, images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'], category: beauty._id, brand: 'GlowLab', stock: 200, tags: ['skincare','vitamin-c'], isFeatured: true, ratings: 4.6, numReviews: 310 },
      { name: 'Smart Watch Series 6', description: 'Heart rate, SpO2, GPS, 7-day battery, IP68.', price: 5999, originalPrice: 9999, discountPercent: 40, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'], category: elec._id, brand: 'TechWear', stock: 60, tags: ['smartwatch','fitness'], isFeatured: true, ratings: 4.4, numReviews: 190 },
      { name: 'Wooden Bookshelf 5-Tier', description: 'Solid engineered wood, walnut finish, easy assembly.', price: 7999, originalPrice: 12000, discountPercent: 33, images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600'], category: furn._id, brand: 'WoodCraft', stock: 25, tags: ['furniture','bookshelf'], isFeatured: true, ratings: 4.5, numReviews: 67 },
      { name: 'Gold Plated Necklace Set', description: '22k gold plated, hypoallergenic, gift-box included.', price: 1299, originalPrice: 2499, discountPercent: 48, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'], category: jewel._id, brand: 'GoldGlam', stock: 80, tags: ['jewellery','gold'], isBestSeller: true, ratings: 4.3, numReviews: 142 },
      { name: 'LEGO Creator 3-in-1 Set', description: '500+ pieces, build a house, car or robot. Ages 7+.', price: 2499, originalPrice: 3999, discountPercent: 38, images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600'], category: toysC._id, brand: 'BrickWorld', stock: 45, tags: ['lego','stem'], isFeatured: true, ratings: 4.8, numReviews: 95 },
      { name: 'Organic Green Tea (100 bags)', description: '100% organic Darjeeling, rich antioxidants.', price: 349, originalPrice: 599, discountPercent: 42, images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600'], category: groc._id, brand: 'TeaGarden', stock: 500, tags: ['tea','organic'], ratings: 4.6, numReviews: 380 },
      { name: 'Stainless Steel Water Bottle 1L', description: 'Double-wall vacuum insulated, cold 24hr, hot 12hr.', price: 549, originalPrice: 999, discountPercent: 45, images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'], category: sports._id, brand: 'HydroLife', stock: 300, tags: ['bottle','hydration'], ratings: 4.6, numReviews: 520 },
      { name: 'TWS Noise-Cancelling Earbuds', description: 'Hybrid ANC, 24hr total battery, IPX5, wireless charging.', price: 1799, originalPrice: 3499, discountPercent: 49, images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'], category: elec._id, brand: 'SoundMax', stock: 90, tags: ['earbuds','tws'], ratings: 4.5, numReviews: 145 },
      { name: "Women's Floral Kurti", description: 'Rayon A-line, floral print, festive and casual.', price: 699, originalPrice: 1299, discountPercent: 46, images: ['https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=600'], category: cloth._id, brand: 'EthnicWear', stock: 160, tags: ['kurti','ethnic'], isBestSeller: true, ratings: 4.3, numReviews: 280 },
      { name: 'Resistance Bands Set (5 levels)', description: 'Heavy-duty latex, door anchor + handles included.', price: 699, originalPrice: 1299, discountPercent: 46, images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600'], category: sports._id, brand: 'FitLife', stock: 200, tags: ['gym','resistance'], ratings: 4.5, numReviews: 210 },
      { name: 'Scented Soy Candle Set (3pc)', description: 'Lavender, Vanilla & Sandalwood. 100% soy wax, 45hr burn.', price: 899, originalPrice: 1599, discountPercent: 44, images: ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600'], category: home._id, brand: 'AromaCo', stock: 150, tags: ['candle','home-decor'], ratings: 4.7, numReviews: 95 },
      { name: 'Laptop Backpack 30L Waterproof', description: '15.6" laptop fit, USB charging port, TSA-friendly.', price: 1299, originalPrice: 2500, discountPercent: 48, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'], category: cloth._id, brand: 'TrekGear', stock: 75, tags: ['backpack','laptop'], ratings: 4.4, numReviews: 230 },
    ];

    const toInsert = manual.map(p => ({
      sku: uuidv4().slice(0, 8).toUpperCase(),
      isActive: true, isNewArrival: true, isFeatured: false,
      isBestSeller: false, specifications: [], ...p,
    }));

    await Product.insertMany(toInsert, { ordered: false });

    res.json({
      success: true,
      message: `Seeded ${cats.length} categories and ${toInsert.length} products successfully!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = r;