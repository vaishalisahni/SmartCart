const express = require('express');
const r = express.Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/auth');
r.get('/product/:productId', c.getProductReviews);
r.post('/', protect, c.addReview);
r.delete('/:id', protect, c.deleteReview);
module.exports = r;