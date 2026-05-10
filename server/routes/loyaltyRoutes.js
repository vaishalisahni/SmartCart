const express = require('express');
const r = express.Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/loyaltyController');

r.get('/',        protect, c.getPoints);
r.post('/redeem', protect, c.redeemPoints);

module.exports = r;