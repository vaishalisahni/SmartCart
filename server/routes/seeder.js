require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  await User.deleteMany(); await Product.deleteMany(); await Category.deleteMany();

  // Categories
  const cats = await Category.insertMany([
    { name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
    { name: 'Clothing', slug: 'clothing', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400' },
    { name: 'Books', slug: 'books', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { name: 'Sports', slug: 'sports', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400' },
  ]);

  const [elec, cloth, books, home, sports] = cats;

  // Admin user
  const adminPass = await bcrypt.hash('admin123', 12);
  await User.create({ name: 'Admin', email: 'admin@smartcart.com', password: adminPass, role: 'admin', isVerified: true });
  const userPass = await bcrypt.hash('user123', 12);
  await User.create({ name: 'Test User', email: 'user@smartcart.com', password: userPass, isVerified: true });
  console.log('✅ Users created  admin@smartcart.com / admin123');

  // Products
  await Product.insertMany([
    { name: 'Wireless Bluetooth Headphones', description: 'Premium sound quality with 30hr battery, noise cancellation, foldable design.', price: 2499, originalPrice: 4999, discountPercent: 50, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'], category: elec._id, brand: 'SoundMax', stock: 50, tags: ['audio', 'wireless', 'bluetooth'], isFeatured: true, isBestSeller: true, ratings: 4.5, numReviews: 120 },
    { name: 'Smart LED TV 43"', description: '4K Ultra HD Smart TV with built-in Android, WiFi, and multiple HDMI ports.', price: 27999, originalPrice: 35000, discountPercent: 20, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'], category: elec._id, brand: 'VisionTech', stock: 20, tags: ['tv', 'smart', '4k'], isFeatured: true, ratings: 4.3, numReviews: 85 },
    { name: 'Mechanical Keyboard', description: 'RGB backlit, TKL layout, blue switches, USB-C, built for gamers and coders.', price: 3499, originalPrice: 5000, discountPercent: 30, images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'], category: elec._id, brand: 'TechKey', stock: 35, tags: ['keyboard', 'gaming', 'rgb'], ratings: 4.7, numReviews: 200 },
    { name: 'Men\'s Casual T-Shirt', description: '100% cotton, breathable fabric, available in multiple sizes and colours.', price: 399, originalPrice: 799, discountPercent: 50, images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'], category: cloth._id, brand: 'StyleWear', stock: 200, tags: ['tshirt', 'casual', 'cotton'], isBestSeller: true, ratings: 4.2, numReviews: 350 },
    { name: 'Running Shoes', description: 'Lightweight, cushioned running shoes for all terrain. EVA sole for comfort.', price: 1999, originalPrice: 3500, discountPercent: 43, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'], category: sports._id, brand: 'RunFast', stock: 80, tags: ['shoes', 'running', 'sports'], isFeatured: true, ratings: 4.6, numReviews: 180 },
    { name: 'Python Programming Book', description: 'Complete Python guide from basics to advanced — includes ML, web dev chapters.', price: 599, originalPrice: 899, discountPercent: 33, images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600'], category: books._id, brand: 'TechPublish', stock: 100, tags: ['python', 'programming', 'education'], ratings: 4.8, numReviews: 420 },
    { name: 'Air Fryer 4L', description: 'Digital display, 8 presets, non-stick basket, 1400W, healthy oil-free cooking.', price: 4499, originalPrice: 7000, discountPercent: 36, images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'], category: home._id, brand: 'HomeCook', stock: 40, tags: ['kitchen', 'airfryer', 'cooking'], isFeatured: true, isBestSeller: true, ratings: 4.4, numReviews: 95 },
    { name: 'Yoga Mat Premium', description: 'Non-slip 6mm thick mat, eco-friendly TPE material, carrying strap included.', price: 799, originalPrice: 1500, discountPercent: 47, images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'], category: sports._id, brand: 'FitLife', stock: 120, tags: ['yoga', 'fitness', 'mat'], ratings: 4.5, numReviews: 230 },
    { name: 'Smartphone Stand', description: 'Adjustable aluminum desk stand for phones and tablets, 360° rotation.', price: 349, originalPrice: 599, discountPercent: 42, images: ['https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600'], category: elec._id, brand: 'DeskPro', stock: 150, tags: ['stand', 'phone', 'desk'], ratings: 4.1, numReviews: 75 },
    { name: 'Women\'s Kurti', description: 'Rayon fabric, floral print, A-line fit. Perfect for casual and festive occasions.', price: 699, originalPrice: 1299, discountPercent: 46, images: ['https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=600'], category: cloth._id, brand: 'EthnicWear', stock: 160, tags: ['kurti', 'ethnic', 'women'], isBestSeller: true, ratings: 4.3, numReviews: 280 },
  ]);

  console.log('✅ 10 products seeded');
  console.log('✅ 5 categories seeded');
  console.log('\n🚀 Database seeded successfully!');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });