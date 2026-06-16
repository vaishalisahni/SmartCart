/**
 * server/routes/sellerRoutes.js
 *
 * Mounts all seller-facing endpoints.
 * Protect every route — sellers must be logged in.
 * The seller role check is inside each controller method.
 */
const express = require('express');
const r       = express.Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/sellerController');

// ── Registration & Profile ──────────────────────────────────
r.post('/register',        protect, c.registerAsSeller);
r.get('/profile',          protect, c.getProfile);
r.put('/profile',          protect, c.createOrUpdateProfile);

// ── Dashboard ───────────────────────────────────────────────
r.get('/dashboard',        protect, c.getDashboard);

// ── Products ────────────────────────────────────────────────
r.get('/products',         protect, c.getMyProducts);
r.post('/products',        protect, c.createProduct);
r.put('/products/:id',     protect, c.updateProduct);
r.delete('/products/:id',  protect, c.deleteProduct);

// ── Orders ──────────────────────────────────────────────────
r.get('/orders',           protect, c.getMyOrders);

// ── Admin: manage sellers ────────────────────────────────────
// (import admin middleware separately if you want to gate these)
// r.get('/admin/all',        protect, admin, c.getAllSellers);
// r.put('/admin/:id/approve', protect, admin, c.approveSeller);

module.exports = r;