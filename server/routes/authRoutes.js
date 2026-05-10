// authRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
r.post('/register', c.register);
r.post('/login', c.login);
r.post('/logout', protect, c.logout);
r.post('/refresh', c.refresh);
r.post('/forgot-password', c.forgotPassword);
r.post('/reset-password', c.resetPassword);
r.get('/me', protect, c.getMe);

const passport = require('../utils/passport');
const { generateTokens } = require('../utils/jwt');

// Redirect to Google
r.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback
r.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`, session: false }),
  async (req, res) => {
    const { accessToken, refreshToken } = generateTokens(req.user._id);
    req.user.refreshToken = refreshToken;
    await req.user.save({ validateBeforeSave: false });
    // Send token to frontend via URL param, frontend stores it
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${accessToken}`);
  }
);

module.exports = r;