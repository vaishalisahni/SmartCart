const express = require('express');
const r = express.Router();
const { protect, admin } = require('../middleware/auth');
const ac = require('../controllers/adminController');
r.post('/validate', protect, ac.validateCoupon);
r.get('/', protect, admin, ac.getCoupons);
r.post('/', protect, admin, ac.createCoupon);
r.delete('/:id', protect, admin, ac.deleteCoupon);
module.exports = r;