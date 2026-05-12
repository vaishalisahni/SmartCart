const express = require('express');
const r = express.Router();
const c = require('../controllers/orderController');
const { downloadInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
 
r.post('/',             protect, c.placeOrder);
r.get('/my',            protect, c.getMyOrders);
r.get('/:id',           protect, c.getOrder);
r.put('/:id/cancel',    protect, c.cancelOrder);
r.get('/:id/invoice',   protect, downloadInvoice);   // ← NEW
 
module.exports = r;