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
module.exports = r;