// categoryRoutes.js
const express = require('express');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

const catRouter = express.Router();
catRouter.get('/', async (req, res) => {
  const cats = await Category.find({ isActive: true });
  res.json({ success: true, categories: cats });
});
catRouter.post('/', protect, admin, async (req, res) => {
  const cat = await Category.create(req.body);
  res.status(201).json({ success: true, category: cat });
});
catRouter.put('/:id', protect, admin, async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, category: cat });
});
catRouter.delete('/:id', protect, admin, async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Category deleted' });
});
module.exports = catRouter;