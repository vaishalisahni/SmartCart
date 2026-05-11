const express = require('express');
const { protect, admin, superAdmin } = require('../middleware/auth');
const ac = require('../controllers/adminController');

const adminRouter = express.Router();
adminRouter.use(protect, admin);
adminRouter.get('/dashboard', ac.getDashboard);
adminRouter.get('/orders', ac.getAllOrders);
adminRouter.put('/orders/:id/status', ac.updateOrderStatus);
adminRouter.get('/users', ac.getAllUsers);
adminRouter.put('/users/:id/block', ac.toggleBlockUser);
adminRouter.put('/users/:id/role', superAdmin, ac.updateUserRole);
module.exports = adminRouter;