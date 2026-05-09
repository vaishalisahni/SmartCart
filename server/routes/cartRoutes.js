// cartRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/auth');
r.get('/', protect, c.getCart);
r.post('/add', protect, c.addToCart);
r.put('/update', protect, c.updateCartItem);
r.delete('/remove/:productId', protect, c.removeFromCart);
r.delete('/clear', protect, c.clearCart);
module.exports = r;