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

r.post('/voice-intent', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.json({ search: '' });

  try {
    const { data } = await axios.post(`${AI_URL}/voice-intent`, { transcript });
    res.json(data);
  } catch {
    // Fallback: simple local NLP without AI service
    res.json(parseTranscriptLocally(transcript));
  }
});

// Simple local fallback parser (no AI service needed)
function parseTranscriptLocally(text) {
  const t = text.toLowerCase();
  const result = { search: text };

  // Price extraction: "under 500", "below 1000", "less than 2000"
  const underMatch = t.match(/(?:under|below|less than|cheaper than)\s*₹?\s*(\d+)/);
  if (underMatch) result.maxPrice = underMatch[1];

  // "above 500", "more than 1000", "over 2000"
  const overMatch = t.match(/(?:above|over|more than|greater than)\s*₹?\s*(\d+)/);
  if (overMatch) result.minPrice = overMatch[1];

  // "between 500 and 2000"
  const betweenMatch = t.match(/between\s*₹?\s*(\d+)\s*(?:and|to)\s*₹?\s*(\d+)/);
  if (betweenMatch) {
    result.minPrice = betweenMatch[1];
    result.maxPrice = betweenMatch[2];
  }

  // Sort detection
  if (t.includes('cheapest') || t.includes('lowest price')) result.sort = 'price_asc';
  if (t.includes('expensive') || t.includes('highest price')) result.sort = 'price_desc';
  if (t.includes('top rated') || t.includes('best rated')) result.sort = 'rating';
  if (t.includes('popular') || t.includes('trending')) result.sort = 'popularity';
  if (t.includes('newest') || t.includes('latest')) result.sort = 'newest';

  // Category hints
  const cats = {
    electronics: ['phone', 'laptop', 'tablet', 'headphone', 'earphone', 'tv', 'camera', 'watch'],
    clothing:    ['shirt', 'dress', 'jeans', 'shoes', 'jacket', 'kurta', 'top', 'trouser'],
    books:       ['book', 'novel', 'textbook', 'comics'],
    sports:      ['gym', 'yoga', 'fitness', 'sport', 'cricket', 'football', 'running'],
    beauty:      ['cream', 'serum', 'lipstick', 'skincare', 'makeup', 'perfume'],
  };
  for (const [cat, keywords] of Object.entries(cats)) {
    if (keywords.some(k => t.includes(k))) { result.category = cat; break; }
  }

  // Clean search: strip price/sort words for cleaner search term
  result.search = text
    .replace(/(?:under|below|less than|above|over|more than|between|and)\s*₹?\s*\d+/gi, '')
    .replace(/(?:cheapest|expensive|top rated|popular|newest|latest|trending)/gi, '')
    .trim() || text;

  return result;
}

// POST /api/ai/chat  — AI support chatbot
 
r.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ reply: '' });
 
  try {
    // Try Flask AI service first
    const { data } = await axios.post(`${AI_URL}/chat`, { message, history }, { timeout: 7000 });
    return res.json({ reply: data.reply });
  } catch {
    // Fallback: rule-based FAQ bot
    return res.json({ reply: getFAQReply(message) });
  }
});
 
// ── Simple rule-based FAQ fallback ────────────────────────────
function getFAQReply(msg) {
  const t = msg.toLowerCase();
 
  if (/track|where.*order|order status|shipping status/.test(t))
    return "To track your order, go to **My Orders** from your profile menu. You'll see real-time status: Placed → Confirmed → Packed → Shipped → Delivered. 📦";
 
  if (/cancel|cancell/.test(t))
    return "You can cancel an order before it's packed. Go to **My Orders → Order Detail → Cancel Order**. Once shipped, cancellation isn't possible, but you can request a return after delivery.";
 
  if (/return|refund|exchange/.test(t))
    return "We have a **7-day return policy** from delivery date. Go to **My Orders → Order Detail → Request Return**. Refunds are processed within 5-7 business days to your original payment method. 💰";
 
  if (/payment|pay|upi|razorpay|cod|net banking/.test(t))
    return "We accept **UPI, Debit/Credit Cards, Net Banking** (via Razorpay) and **Cash on Delivery**. All online payments are secured with 256-bit encryption. 🔒";
 
  if (/delivery|shipping|how long/.test(t))
    return "Standard delivery takes **3-5 business days**. Free shipping on orders above ₹499! Express delivery (1-2 days) is available for select pin codes. 🚚";
 
  if (/coupon|discount|promo|offer/.test(t))
    return "Apply coupon codes at **checkout** or in your **cart**. Check the Offers page for latest deals! New users can use **WELCOME10** for 10% off their first order. 🎉";
 
  if (/points|loyalty|reward|refer/.test(t))
    return "You earn **1 point per ₹10 spent**. Points can be redeemed at checkout (200 pts = ₹100 off). Refer friends and earn **200 bonus points** per referral! Check **My Rewards** page. ⭐";
 
  if (/account|password|login|register/.test(t))
    return "For account issues, try **Forgot Password** on the login page. If you're still stuck, I can connect you to a human agent — just say **'connect to agent'**.";
 
  if (/agent|human|person|support team|help/.test(t))
    return "Sure! Let me connect you to a live support agent. Please wait a moment... 👨‍💼";
 
  if (/hi|hello|hey|namaste/.test(t))
    return "Hello! 👋 I'm SmartCart's AI assistant. I can help with orders, returns, payments, delivery, and more. What do you need help with?";
 
  return "I'm not sure about that specific query. I can help with:\n• **Order tracking & cancellation**\n• **Returns & refunds**\n• **Payment methods**\n• **Delivery info**\n• **Coupons & rewards**\n\nOr say **'connect to agent'** for human support! 😊";
}

module.exports = r;