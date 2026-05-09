const express = require('express');
const r = express.Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/auth');
r.get('/', protect, c.getWishlist);
r.post('/toggle', protect, c.toggleWishlist);
module.exports = r;