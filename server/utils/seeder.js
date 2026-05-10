/**
 * SmartCart Database Seeder
 * Run: node utils/seeder.js
 * 
 * Works with both local MongoDB and MongoDB Atlas.
 * Make sure MONGO_URI in .env points to the right database.
 * For production seeding: temporarily set .env MONGO_URI to your Atlas URI.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { v4: uuidv4 } = require('uuid');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const seed = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }

  console.log('🔗 Connecting to:', process.env.MONGO_URI.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to DB');

  // ── Clear existing data ──────────────────────────────────────
  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Category.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Categories ───────────────────────────────────────────────
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

  const [elec, cloth, books, home, sports, beauty, furn, groc, jewel, toys] = cats;
  console.log(`✅ ${cats.length} categories seeded`);

  // Category mappings
  const dummyCatMap = {
    'smartphones': elec, 'laptops': elec, 'tablets': elec,
    'mobile-accessories': elec, 'mens-watches': elec, 'womens-watches': jewel,
    'mens-shirts': cloth, 'mens-shoes': cloth, 'womens-shoes': cloth,
    'womens-dresses': cloth, 'womens-bags': cloth, 'womens-jewellery': jewel,
    'sunglasses': cloth, 'tops': cloth, 'furniture': furn,
    'home-decoration': home, 'kitchen-accessories': home,
    'sports-accessories': sports, 'skincare': beauty, 'fragrances': beauty,
    'groceries': groc, 'beauty': beauty, 'motorcycle': elec, 'vehicle': elec,
  };
  const fakeCatMap = {
    'electronics': elec, 'jewelery': jewel,
    "men's clothing": cloth, "women's clothing": cloth,
  };

  // ── Users ────────────────────────────────────────────────────
  await User.create([
    { name: 'Admin',     email: 'admin@smartcart.com',  password: 'admin123',  role: 'admin',  isVerified: true, referralCode: 'ADMIN001' },
    { name: 'Test User', email: 'user@smartcart.com',   password: 'user123',   role: 'user',   isVerified: true, referralCode: 'USER0001' },
    { name: 'Seller',    email: 'seller@smartcart.com', password: 'seller123', role: 'seller', isVerified: true, referralCode: 'SELL0001',
      sellerProfile: { storeName: 'Demo Store', storeDescription: 'Quality products', approved: true } },
  ]);
  console.log('✅ 3 users seeded  →  admin@smartcart.com / admin123');

  const products = [];

  // ── DummyJSON ────────────────────────────────────────────────
  try {
    console.log('📦 Fetching from DummyJSON...');
    const [r1, r2] = await Promise.all([
      axios.get('https://dummyjson.com/products?limit=100&skip=0',   { timeout: 20000 }),
      axios.get('https://dummyjson.com/products?limit=100&skip=100', { timeout: 20000 }),
    ]);
    const all = [...r1.data.products, ...r2.data.products];
    for (const p of all) {
      const cat = dummyCatMap[p.category] || elec;
      const origUSD = p.price / (1 - (p.discountPercentage || 0) / 100);
      products.push({
        sku:            uuidv4().slice(0, 8).toUpperCase(),
        name:           p.title,
        description:    p.description,
        price:          Math.round(p.price * 83),
        originalPrice:  Math.round(origUSD * 83),
        discountPercent:Math.round(p.discountPercentage || 0),
        images:         (p.images?.length ? p.images : [p.thumbnail]).slice(0, 5),
        category:       cat._id,
        brand:          p.brand || 'Generic',
        tags:           p.tags || [],
        stock:          p.stock || Math.floor(Math.random() * 100) + 10,
        ratings:        parseFloat((p.rating || 4).toFixed(1)),
        numReviews:     Math.floor(Math.random() * 600) + 20,
        isFeatured:     (p.rating || 0) >= 4.5,
        isBestSeller:   (p.rating || 0) >= 4.3 && (p.stock || 0) > 50,
        isNewArrival:   Math.random() > 0.7,
        isActive:       true,
        specifications: [
          { key: 'Brand',    value: p.brand || 'Generic' },
          { key: 'Category', value: p.category },
          ...(p.weight              ? [{ key: 'Weight',   value: `${p.weight} kg` }] : []),
          ...(p.warrantyInformation ? [{ key: 'Warranty', value: p.warrantyInformation }] : []),
          ...(p.returnPolicy        ? [{ key: 'Returns',  value: p.returnPolicy }] : []),
        ],
      });
    }
    console.log(`✅ ${all.length} products from DummyJSON`);
  } catch (err) {
    console.warn('⚠️  DummyJSON failed:', err.message, '— continuing without it');
  }

  await sleep(300);

  // ── FakeStore ────────────────────────────────────────────────
  try {
    console.log('📦 Fetching from FakeStoreAPI...');
    const { data: fp } = await axios.get('https://fakestoreapi.com/products', { timeout: 20000 });
    for (const p of fp) {
      const cat = fakeCatMap[p.category?.toLowerCase()] || cloth;
      const disc = Math.floor(Math.random() * 30) + 5;
      const orig = Math.round((p.price * 83) / (1 - disc / 100));
      products.push({
        sku:            uuidv4().slice(0, 8).toUpperCase(),
        name:           p.title,
        description:    p.description,
        price:          Math.round(p.price * 83),
        originalPrice:  orig,
        discountPercent:disc,
        images:         [p.image],
        category:       cat._id,
        brand:          p.category || 'Generic',
        tags:           [p.category?.toLowerCase().replace(/[' ]/g, '-') || 'general'],
        stock:          Math.floor(Math.random() * 150) + 10,
        ratings:        parseFloat((p.rating?.rate || 4).toFixed(1)),
        numReviews:     p.rating?.count || Math.floor(Math.random() * 300) + 10,
        isFeatured:     (p.rating?.rate || 0) >= 4.5,
        isBestSeller:   (p.rating?.count || 0) > 200,
        isNewArrival:   Math.random() > 0.6,
        isActive:       true,
        specifications: [
          { key: 'Category', value: p.category },
          { key: 'Rating',   value: `${p.rating?.rate} / 5` },
        ],
      });
    }
    console.log(`✅ ${fp.length} products from FakeStoreAPI`);
  } catch (err) {
    console.warn('⚠️  FakeStore failed:', err.message, '— continuing without it');
  }

  // ── Manual fallback products (always seeded) ─────────────────
  const manual = [
    { name: 'Wireless Bluetooth Headphones', description: 'Premium 30hr battery, ANC, foldable design. Crystal-clear sound for music and calls.', price: 2499, originalPrice: 4999, discountPercent: 50, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'], category: elec._id, brand: 'SoundMax', stock: 50, tags: ['audio','wireless'], isFeatured: true, isBestSeller: true, ratings: 4.5, numReviews: 120 },
    { name: 'Smart LED TV 43"', description: '4K Ultra HD Android TV, WiFi, multiple HDMI ports, Dolby Audio.', price: 27999, originalPrice: 35000, discountPercent: 20, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'], category: elec._id, brand: 'VisionTech', stock: 20, tags: ['tv','4k'], isFeatured: true, ratings: 4.3, numReviews: 85 },
    { name: 'Mechanical Gaming Keyboard RGB', description: 'TKL layout, blue switches, USB-C, per-key RGB. Built for gamers and coders.', price: 3499, originalPrice: 5000, discountPercent: 30, images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'], category: elec._id, brand: 'TechKey', stock: 35, tags: ['keyboard','gaming'], ratings: 4.7, numReviews: 200 },
    { name: "Men's Casual Cotton T-Shirt", description: '100% organic cotton, pre-shrunk, breathable. Available in 8 colours and sizes XS–3XL.', price: 399, originalPrice: 799, discountPercent: 50, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'], category: cloth._id, brand: 'StyleWear', stock: 200, tags: ['tshirt','cotton'], isBestSeller: true, ratings: 4.2, numReviews: 350 },
    { name: 'Running Shoes Pro X', description: 'Lightweight EVA sole, mesh upper, cushioned for road & trail. Sizes 6–12.', price: 1999, originalPrice: 3500, discountPercent: 43, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'], category: sports._id, brand: 'RunFast', stock: 80, tags: ['shoes','running'], isFeatured: true, ratings: 4.6, numReviews: 180 },
    { name: 'Python Programming: Complete Guide', description: 'From basics to advanced ML, web dev, and automation. 600+ pages.', price: 599, originalPrice: 899, discountPercent: 33, images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600'], category: books._id, brand: 'TechPublish', stock: 100, tags: ['python','programming'], ratings: 4.8, numReviews: 420 },
    { name: 'Digital Air Fryer 4L', description: '8 presets, non-stick basket, 1400W, 360° rapid air. Healthier cooking without oil.', price: 4499, originalPrice: 7000, discountPercent: 36, images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'], category: home._id, brand: 'HomeCook', stock: 40, tags: ['kitchen','airfryer'], isFeatured: true, isBestSeller: true, ratings: 4.4, numReviews: 95 },
    { name: 'Premium Yoga Mat 6mm', description: 'Non-slip eco TPE material, double-layer, carrying strap. Perfect for all yoga styles.', price: 799, originalPrice: 1500, discountPercent: 47, images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'], category: sports._id, brand: 'FitLife', stock: 120, tags: ['yoga','fitness'], ratings: 4.5, numReviews: 230 },
    { name: 'Vitamin C Face Serum 30ml', description: '20% Vitamin C, hyaluronic acid, niacinamide. Visibly brighter skin in 2 weeks.', price: 699, originalPrice: 1200, discountPercent: 42, images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'], category: beauty._id, brand: 'GlowLab', stock: 200, tags: ['skincare','vitamin-c'], isFeatured: true, ratings: 4.6, numReviews: 310 },
    { name: "Women's Floral Kurti", description: 'Rayon, A-line fit, floral print. Perfect for casual and festive occasions.', price: 699, originalPrice: 1299, discountPercent: 46, images: ['https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=600'], category: cloth._id, brand: 'EthnicWear', stock: 160, tags: ['kurti','ethnic'], isBestSeller: true, ratings: 4.3, numReviews: 280 },
    { name: 'Smart Watch Series 6', description: 'Heart rate, SpO2, GPS, 7-day battery, IP68 waterproof, 50+ sport modes.', price: 5999, originalPrice: 9999, discountPercent: 40, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'], category: elec._id, brand: 'TechWear', stock: 60, tags: ['smartwatch','fitness'], isFeatured: true, ratings: 4.4, numReviews: 190 },
    { name: 'TWS Noise-Cancelling Earbuds', description: 'Hybrid ANC, 24hr total battery, IPX5 rating, wireless charging case.', price: 1799, originalPrice: 3499, discountPercent: 49, images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'], category: elec._id, brand: 'SoundMax', stock: 90, tags: ['earbuds','tws'], ratings: 4.5, numReviews: 145 },
    { name: 'Stainless Steel Water Bottle 1L', description: 'Double-wall vacuum insulation, keeps cold 24hr, hot 12hr. BPA-free.', price: 549, originalPrice: 999, discountPercent: 45, images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'], category: sports._id, brand: 'HydroLife', stock: 300, tags: ['bottle','hydration'], ratings: 4.6, numReviews: 520 },
    { name: 'Laptop Backpack 30L Waterproof', description: 'Fits 15.6" laptop, built-in USB charging port, TSA-friendly, waterproof 600D.', price: 1299, originalPrice: 2500, discountPercent: 48, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'], category: cloth._id, brand: 'TrekGear', stock: 75, tags: ['backpack','laptop'], ratings: 4.4, numReviews: 230 },
    { name: 'Scented Soy Candle Set (3pc)', description: 'Lavender, Vanilla & Sandalwood. 100% soy wax, 45hr burn each, cotton wick.', price: 899, originalPrice: 1599, discountPercent: 44, images: ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600'], category: home._id, brand: 'AromaCo', stock: 150, tags: ['candle','home-decor'], ratings: 4.7, numReviews: 95 },
    { name: 'Wooden Bookshelf 5-Tier', description: 'Solid engineered wood, walnut finish, easy assembly. Holds up to 60kg per shelf.', price: 7999, originalPrice: 12000, discountPercent: 33, images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600'], category: furn._id, brand: 'WoodCraft', stock: 25, tags: ['furniture','bookshelf'], isFeatured: true, ratings: 4.5, numReviews: 67 },
    { name: 'Gold Plated Necklace Set', description: '22k gold plated, hypoallergenic, comes with matching earrings. Gift-box included.', price: 1299, originalPrice: 2499, discountPercent: 48, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'], category: jewel._id, brand: 'GoldGlam', stock: 80, tags: ['jewellery','gold'], isBestSeller: true, ratings: 4.3, numReviews: 142 },
    { name: 'Organic Green Tea (100 bags)', description: '100% organic, single-estate Darjeeling. Rich antioxidants, no artificial flavour.', price: 349, originalPrice: 599, discountPercent: 42, images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600'], category: groc._id, brand: 'TeaGarden', stock: 500, tags: ['tea','organic'], ratings: 4.6, numReviews: 380 },
    { name: 'LEGO Creator 3-in-1 Set', description: '500+ pieces, build a house, car or robot. Ages 7+. STEM-certified.', price: 2499, originalPrice: 3999, discountPercent: 38, images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600'], category: toys._id, brand: 'BrickWorld', stock: 45, tags: ['lego','stem'], isFeatured: true, ratings: 4.8, numReviews: 95 },
    { name: 'Resistance Bands Set (5 levels)', description: 'Heavy-duty latex, door anchor + handles + ankle straps included. 15–80 lbs.', price: 699, originalPrice: 1299, discountPercent: 46, images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600'], category: sports._id, brand: 'FitLife', stock: 200, tags: ['gym','resistance'], ratings: 4.5, numReviews: 210 },
  ];

  for (const p of manual) {
    products.push({
      sku: uuidv4().slice(0, 8).toUpperCase(),
      isActive: true, isNewArrival: false, isFeatured: false,
      isBestSeller: false, specifications: [],
      ...p,
    });
  }

  // ── Insert ────────────────────────────────────────────────────
  try {
    await Product.insertMany(products, { ordered: false });
    console.log(`\n✅ ${products.length} products seeded successfully`);
  } catch (err) {
    // Some duplicates might fail — that's OK
    console.log(`⚠️  Inserted with some errors (likely duplicate SKUs). Inserted ~${products.length} products.`);
  }

  console.log('\n──────────────────────────────────────');
  console.log('🎉 Database seeded!');
  console.log('   Admin:  admin@smartcart.com / admin123');
  console.log('   User:   user@smartcart.com  / user123');
  console.log('   Seller: seller@smartcart.com / seller123');
  console.log('──────────────────────────────────────\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});