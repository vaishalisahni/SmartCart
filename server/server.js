const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('express-async-errors');

const app = express();
const httpServer = http.createServer(app);

// ── Allowed origins ───────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
  'https://smart-cart-shopping-cart.vercel.app',
].filter(Boolean);

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

// ── Security middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Session + Passport (Google OAuth) ────────────────────────
const session = require('express-session');
const passport = require('./utils/passport');

app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Rate limiting ─────────────────────────────────────────────
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,  message: { message: 'Too many attempts, try again later.' } });

app.use('/api/', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/products',  require('./routes/productRoutes'));
app.use('/api/categories',require('./routes/categoryRoutes'));
app.use('/api/cart',      require('./routes/cartRoutes'));
app.use('/api/wishlist',  require('./routes/wishlistRoutes'));
app.use('/api/orders',    require('./routes/orderRoutes'));
app.use('/api/reviews',   require('./routes/reviewRoutes'));
app.use('/api/coupons',   require('./routes/couponRoutes'));
app.use('/api/admin',     require('./routes/adminRoutes'));
app.use('/api/ai',        require('./routes/aiRoutes'));
app.use('/api/payment',   require('./routes/paymentRoutes'));
app.use('/api/chat',      require('./routes/chatRoutes'));
app.use('/api/loyalty',   require('./routes/loyaltyRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));

// ── Socket.IO chat ────────────────────────────────────────────
require('./chat/chatHandler')(io);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date(), env: process.env.NODE_ENV })
);

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

// ── DB Connect & Start ────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });