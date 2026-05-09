const express = require('express');
const r = express.Router();
const { protect } = require('../middleware/auth');
const pc = require('../controllers/paymentController');
r.post('/razorpay/order', protect, pc.createRazorpayOrder);
r.post('/razorpay/verify', protect, pc.verifyPayment);
module.exports = r;