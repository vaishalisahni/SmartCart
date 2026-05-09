const express = require('express');
const r = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Get recommendations for a user
r.get('/recommendations', protect, async (req, res) => {
  try {
    const { data } = await axios.get(`${AI_URL}/recommendations`, { params: { user_id: req.user._id.toString() } });
    res.json(data);
  } catch {
    res.json({ success: true, productIds: [] });
  }
});

// Get sentiment for a product's reviews
r.get('/sentiment/:productId', async (req, res) => {
  try {
    const { data } = await axios.get(`${AI_URL}/sentiment/${req.params.productId}`);
    res.json(data);
  } catch {
    res.json({ success: true, summary: '', positive: 0, negative: 0, neutral: 0 });
  }
});

// Record user interaction (for recommendations)
r.post('/interact', protect, async (req, res) => {
  try {
    await axios.post(`${AI_URL}/interact`, { user_id: req.user._id.toString(), ...req.body });
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

module.exports = r;