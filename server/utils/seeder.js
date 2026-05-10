require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { v4: uuidv4 } = require('uuid');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to DB');

  await User.deleteMany();
  await Product.deleteMany();
  await Category.deleteMany();
  console.log('🗑️  Cleared existing data');

  // ── Categories ──────────────────────────────────────────────
  const cats = await Category.insertMany([
    { name: 'Electronics',   slug: 'electronics',   image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
    { name: 'Clothing',      slug: 'clothing',      image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400' },
    { name: 'Books',         slug: 'books',         image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' },
    { name: 'Home & Kitchen',slug: 'home-kitchen',  image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { name: 'Sports',        slug: 'sports',        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400' },
    { name: 'Beauty',        slug: 'beauty',        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400' },
    { name: 'Furniture',     slug: 'furniture',     image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' },
    { name: 'Groceries',     slug: 'groceries',     image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400' },
    { name: 'Jewellery',     slug: 'jewellery',     image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' },
    { name: 'Toys',          slug: 'toys',          image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=400' },
  ]);

  const [elec, cloth, books, home, sports, beauty, furn, groc, jewel, toys] = cats;

  // DummyJSON category → our category
  const dummyCatMap = {
    'smartphones':        elec,
    'laptops':            elec,
    'tablets':            elec,
    'mobile-accessories': elec,
    'mens-watches':       elec,
    'womens-watches':     jewel,
    'mens-shirts':        cloth,
    'mens-shoes':         cloth,
    'womens-shoes':       cloth,
    'womens-dresses':     cloth,
    'womens-bags':        cloth,
    'womens-jewellery':   jewel,
    'sunglasses':         cloth,
    'tops':               cloth,
    'furniture':          furn,
    'home-decoration':    home,
    'kitchen-accessories':home,
    'sports-accessories': sports,
    'skincare':           beauty,
    'fragrances':         beauty,
    'groceries':          groc,
    'beauty':             beauty,
    'motorcycle':         elec,
    'vehicle':            elec,
  };

  // FakeStore category → our category
  const fakeCatMap = {
    "electronics":        elec,
    "jewelery":           jewel,
    "men's clothing":     cloth,
    "women's clothing":   cloth,
  };

  // ── Users ────────────────────────────────────────────────────
  await User.create({ name: 'Admin',     email: 'admin@smartcart.com', password: 'admin123', role: 'admin',  isVerified: true, referralCode: 'ADMIN001' });
  await User.create({ name: 'Test User', email: 'user@smartcart.com',  password: 'user123',  role: 'user',   isVerified: true, referralCode: 'USER0001' });
  await User.create({ name: 'Seller',    email: 'seller@smartcart.com',password: 'seller123',role: 'seller', isVerified: true, referralCode: 'SELL0001',
    sellerProfile: { storeName: 'Demo Store', storeDescription: 'Quality products at best prices', approved: true }
  });
  console.log('✅ 3 users seeded (admin / user / seller)');

  const products = [];

  // ── DummyJSON — 2 pages × 100 products ──────────────────────
  try {
    console.log('📦 Fetching from DummyJSON...');
    const [r1, r2] = await Promise.all([
      axios.get('https://dummyjson.com/products?limit=100&skip=0', { timeout: 15000 }),
      axios.get('https://dummyjson.com/products?limit=100&skip=100', { timeout: 15000 }),
    ]);
    const dummyProducts = [...r1.data.products, ...r2.data.products];

    for (const p of dummyProducts) {
      const cat = dummyCatMap[p.category] || elec;
      const originalPriceUSD = p.price / (1 - p.discountPercentage / 100);
      products.push({
        sku:            uuidv4().slice(0, 8).toUpperCase(),
        name:           p.title,
        description:    p.description,
        price:          Math.round(p.price * 83),
        originalPrice:  Math.round(originalPriceUSD * 83),
        discountPercent:Math.round(p.discountPercentage),
        images:         (p.images?.length ? p.images : [p.thumbnail]).slice(0, 5),
        category:       cat._id,
        brand:          p.brand || 'Generic',
        tags:           p.tags || [],
        stock:          p.stock,
        ratings:        parseFloat(p.rating.toFixed(1)),
        numReviews:     Math.floor(Math.random() * 600) + 20,
        isFeatured:     p.rating >= 4.5,
        isBestSeller:   p.rating >= 4.3 && p.stock > 50,
        isNewArrival:   Math.random() > 0.7,
        isActive:       true,
        specifications: [
          { key: 'Brand',    value: p.brand || 'Generic' },
          { key: 'Category', value: p.category },
          ...(p.weight              ? [{ key: 'Weight',        value: `${p.weight} kg` }]  : []),
          ...(p.dimensions          ? [{ key: 'Dimensions',    value: `${p.dimensions.width}×${p.dimensions.height}×${p.dimensions.depth} cm` }] : []),
          ...(p.warrantyInformation ? [{ key: 'Warranty',      value: p.warrantyInformation }] : []),
          ...(p.shippingInformation ? [{ key: 'Shipping',      value: p.shippingInformation }] : []),
          ...(p.returnPolicy        ? [{ key: 'Return Policy', value: p.returnPolicy }]    : []),
        ],
      });
    }
    console.log(`✅ ${dummyProducts.length} products from DummyJSON`);
  } catch (err) {
    console.warn('⚠️  DummyJSON fetch failed:', err.message);
  }

  await sleep(500);

  // ── FakeStore ────────────────────────────────────────────────
  try {
    console.log('📦 Fetching from FakeStoreAPI...');
    const { data: fakeProducts } = await axios.get('https://fakestoreapi.com/products', { timeout: 15000 });

    for (const p of fakeProducts) {
      const cat = fakeCatMap[p.category?.toLowerCase()] || cloth;
      const discountPct = Math.floor(Math.random() * 30) + 5;
      const originalPrice = Math.round((p.price * 83) / (1 - discountPct / 100));
      products.push({
        sku:            uuidv4().slice(0, 8).toUpperCase(),
        name:           p.title,
        description:    p.description,
        price:          Math.round(p.price * 83),
        originalPrice,
        discountPercent:discountPct,
        images:         [p.image],
        category:       cat._id,
        brand:          p.category || 'Generic',
        tags:           [p.category?.toLowerCase().replace(/[' ]/g, '-') || 'general'],
        stock:          Math.floor(Math.random() * 150) + 10,
        ratings:        parseFloat(p.rating?.rate?.toFixed(1) || '4.0'),
        numReviews:     p.rating?.count || Math.floor(Math.random() * 300) + 10,
        isFeatured:     (p.rating?.rate || 0) >= 4.5,
        isBestSeller:   (p.rating?.count || 0) > 200,
        isNewArrival:   Math.random() > 0.6,
        isActive:       true,
        specifications: [
          { key: 'Category', value: p.category },
          { key: 'Rating',   value: `${p.rating?.rate} / 5` },
          { key: 'Reviews',  value: `${p.rating?.count} reviews` },
        ],
      });
    }
    console.log(`✅ ${fakeProducts.length} products from FakeStoreAPI`);
  } catch (err) {
    console.warn('⚠️  FakeStore fetch failed:', err.message);
  }

  // ── Manual seed products (always present as fallback) ────────
  const manualProducts = [
    { name: 'Wireless Bluetooth Headphones', description: 'Premium 30hr battery, ANC, foldable design. Crystal-clear sound.', price: 2499, originalPrice: 4999, discountPercent: 50, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'], category: elec._id, brand: 'SoundMax', stock: 50, tags: ['audio','wireless'], isFeatured: true, isBestSeller: true, ratings: 4.5, numReviews: 120 },
    { name: 'Smart LED TV 43"', description: '4K Ultra HD Android TV, WiFi, multiple HDMI ports.', price: 27999, originalPrice: 35000, discountPercent: 20, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'], category: elec._id, brand: 'VisionTech', stock: 20, tags: ['tv','4k'], isFeatured: true, ratings: 4.3, numReviews: 85 },
    { name: 'Mechanical Gaming Keyboard', description: 'RGB TKL, blue switches, USB-C. Built for gamers and coders.', price: 3499, originalPrice: 5000, discountPercent: 30, images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'], category: elec._id, brand: 'TechKey', stock: 35, tags: ['keyboard','gaming'], ratings: 4.7, numReviews: 200 },
    { name: "Men's Casual Cotton T-Shirt", description: '100% cotton, breathable, multiple colours and sizes.', price: 399, originalPrice: 799, discountPercent: 50, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'], category: cloth._id, brand: 'StyleWear', stock: 200, tags: ['tshirt','cotton'], isBestSeller: true, ratings: 4.2, numReviews: 350 },
    { name: 'Running Shoes Pro', description: 'Lightweight EVA sole, cushioned for all terrain.', price: 1999, originalPrice: 3500, discountPercent: 43, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'], category: sports._id, brand: 'RunFast', stock: 80, tags: ['shoes','running'], isFeatured: true, ratings: 4.6, numReviews: 180 },
    { name: 'Python Programming (Complete Guide)', description: 'Basics to advanced ML, web dev chapters included.', price: 599, originalPrice: 899, discountPercent: 33, images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600'], category: books._id, brand: 'TechPublish', stock: 100, tags: ['python','programming'], ratings: 4.8, numReviews: 420 },
    { name: 'Digital Air Fryer 4L', description: '8 presets, non-stick basket, 1400W, oil-free cooking.', price: 4499, originalPrice: 7000, discountPercent: 36, images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'], category: home._id, brand: 'HomeCook', stock: 40, tags: ['kitchen','airfryer'], isFeatured: true, isBestSeller: true, ratings: 4.4, numReviews: 95 },
    { name: 'Premium Yoga Mat 6mm', description: 'Non-slip eco TPE material, carrying strap included.', price: 799, originalPrice: 1500, discountPercent: 47, images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'], category: sports._id, brand: 'FitLife', stock: 120, tags: ['yoga','fitness'], ratings: 4.5, numReviews: 230 },
    { name: 'Serum Vitamin C Face', description: '20% Vitamin C, hyaluronic acid, brightens skin in 2 weeks.', price: 699, originalPrice: 1200, discountPercent: 42, images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'], category: beauty._id, brand: 'GlowLab', stock: 200, tags: ['skincare','vitamin-c'], isFeatured: true, ratings: 4.6, numReviews: 310 },
    { name: "Women's Floral Kurti", description: 'Rayon, A-line fit. Perfect for casual and festive occasions.', price: 699, originalPrice: 1299, discountPercent: 46, images: ['https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=600'], category: cloth._id, brand: 'EthnicWear', stock: 160, tags: ['kurti','ethnic'], isBestSeller: true, ratings: 4.3, numReviews: 280 },
    { name: 'Smart Watch Series 6', description: 'Heart rate, SpO2, GPS, 7-day battery, IP68 waterproof.', price: 5999, originalPrice: 9999, discountPercent: 40, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'], category: elec._id, brand: 'TechWear', stock: 60, tags: ['smartwatch','fitness'], isFeatured: true, ratings: 4.4, numReviews: 190 },
    { name: 'Noise-Cancelling Earbuds TWS', description: 'ANC, 24hr total battery, IPX5, premium sound.', price: 1799, originalPrice: 3499, discountPercent: 49, images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600'], category: elec._id, brand: 'SoundMax', stock: 90, tags: ['earbuds','tws'], ratings: 4.5, numReviews: 145 },
    { name: 'Stainless Steel Water Bottle 1L', description: 'Double-wall insulation, keeps cold 24hr, hot 12hr.', price: 549, originalPrice: 999, discountPercent: 45, images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'], category: sports._id, brand: 'HydroLife', stock: 300, tags: ['bottle','hydration'], ratings: 4.6, numReviews: 520 },
    { name: 'Laptop Backpack 30L', description: 'Fits 15.6" laptop, USB charging port, water resistant.', price: 1299, originalPrice: 2500, discountPercent: 48, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'], category: cloth._id, brand: 'TrekGear', stock: 75, tags: ['backpack','laptop'], ratings: 4.4, numReviews: 230 },
    { name: 'Scented Soy Candle Set (3pc)', description: 'Lavender, vanilla, sandalwood. 45hr burn each.', price: 899, originalPrice: 1599, discountPercent: 44, images: ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600'], category: home._id, brand: 'AromaCo', stock: 150, tags: ['candle','home-decor'], ratings: 4.7, numReviews: 95 },
  ];

  for (const p of manualProducts) {
    products.push({
      sku: uuidv4().slice(0, 8).toUpperCase(),
      isActive: true,
      isNewArrival: false,
      isFeatured: false,
      isBestSeller: false,
      specifications: [],
      ...p,
    });
  }

  // Insert all
  await Product.insertMany(products);
  console.log(`\n✅ Total: ${products.length} products seeded`);
  console.log('✅ 10 categories seeded');
  console.log('\n🚀 Database seeded! Login: admin@smartcart.com / admin123\n');
  process.exit(0);
};

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });