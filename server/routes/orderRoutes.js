const express = require('express');
const r = express.Router();
const c = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
r.post('/', protect, c.placeOrder);
r.get('/my', protect, c.getMyOrders);
r.get('/:id', protect, c.getOrder);
r.put('/:id/cancel', protect, c.cancelOrder);
module.exports = r;