/**
 * server/routes/aiRoutes.js  — drop-in replacement
 *
 * Key additions:
 *  • /chat now accepts `productContext` (a product _id) and injects
 *    live product data from MongoDB into the Claude system prompt.
 *  • Uses claude-sonnet-4-20250514 (the latest fast model).
 *  • Falls back to the rule-based FAQ if the AI service is unavailable.
 */

const express = require('express');
const r = express.Router();
const axios = require('axios');
const { protect, optionalAuth } = require('../middleware/auth');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Recommendations ──────────────────────────────────────────────────────────
r.get('/recommendations', protect, async (req, res) => {
  try {
    const { data } = await axios.get(`${AI_URL}/recommendations`, { params: { user_id: req.user._id.toString() } });
    res.json(data);
  } catch {
    res.json({ success: true, productIds: [] });
  }
});

// ── Sentiment ────────────────────────────────────────────────────────────────
r.get('/sentiment/:productId', async (req, res) => {
  try {
    const { data } = await axios.get(`${AI_URL}/sentiment/${req.params.productId}`);
    res.json(data);
  } catch {
    res.json({ success: true, summary: '', positive: 0, negative: 0, neutral: 0 });
  }
});

// ── Interaction tracking ─────────────────────────────────────────────────────
r.post('/interact', protect, async (req, res) => {
  try {
    await axios.post(`${AI_URL}/interact`, { user_id: req.user._id.toString(), ...req.body });
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

// ── Voice intent ─────────────────────────────────────────────────────────────
r.post('/voice-intent', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.json({ search: '' });
  try {
    const { data } = await axios.post(`${AI_URL}/voice-intent`, { transcript });
    res.json(data);
  } catch {
    res.json(parseTranscriptLocally(transcript));
  }
});

function parseTranscriptLocally(text) {
  const t = text.toLowerCase();
  const result = { search: text };
  const underMatch = t.match(/(?:under|below|less than|cheaper than)\s*₹?\s*(\d+)/);
  if (underMatch) result.maxPrice = underMatch[1];
  const overMatch = t.match(/(?:above|over|more than|greater than)\s*₹?\s*(\d+)/);
  if (overMatch) result.minPrice = overMatch[1];
  const betweenMatch = t.match(/between\s*₹?\s*(\d+)\s*(?:and|to)\s*₹?\s*(\d+)/);
  if (betweenMatch) { result.minPrice = betweenMatch[1]; result.maxPrice = betweenMatch[2]; }
  if (t.includes('cheapest') || t.includes('lowest price')) result.sort = 'price_asc';
  if (t.includes('expensive') || t.includes('highest price')) result.sort = 'price_desc';
  if (t.includes('top rated') || t.includes('best rated')) result.sort = 'rating';
  if (t.includes('popular') || t.includes('trending')) result.sort = 'popularity';
  if (t.includes('newest') || t.includes('latest')) result.sort = 'newest';
  result.search = text
    .replace(/(?:under|below|less than|above|over|more than|between|and)\s*₹?\s*\d+/gi, '')
    .replace(/(?:cheapest|expensive|top rated|popular|newest|latest|trending)/gi, '')
    .trim() || text;
  return result;
}

// ── Chat endpoint ─────────────────────────────────────────────────────────────
r.post('/chat', optionalAuth, async (req, res) => {
  const { message, history = [], productContext } = req.body;
  if (!message?.trim()) return res.status(400).json({ reply: '' });

  // Build product snippet if a productId was passed
  let productSnippet = '';
  if (productContext) {
    try {
      const Product = require('../models/Product');
      const product = await Product.findById(productContext).populate('category', 'name').lean();
      if (product) {
        productSnippet = `
\n--- PRODUCT THE USER IS CURRENTLY VIEWING ---
Name: ${product.name}
Price: ₹${product.price} (original: ₹${product.originalPrice || product.price})
Stock: ${product.stock > 0 ? product.stock + ' units available' : 'OUT OF STOCK'}
Brand: ${product.brand || 'N/A'}
Category: ${product.category?.name || 'N/A'}
Rating: ${product.ratings?.toFixed(1) || 'N/A'} from ${product.numReviews || 0} reviews
Description: ${product.description?.slice(0, 300)}
Specifications: ${product.specifications?.map(s => `${s.key}: ${s.value}`).join(', ') || 'N/A'}
---
When the user asks about this product (specs, availability, price, warranty, etc.),
answer using ONLY the above data. Do NOT make up specs not listed.`;
      }
    } catch (e) {
      console.error('Product context fetch failed:', e.message);
    }
  }

  const systemPrompt = `You are SmartCart's friendly AI support assistant.
SmartCart is an AI-powered e-commerce platform based in India.

Key facts:
- Returns: 7-day policy from delivery date
- Shipping: Free above ₹499, standard 3–5 business days
- Payment: Razorpay (UPI/Card/NetBanking) + Cash on Delivery
- Loyalty: 1 point per ₹10 spent, 200 pts = ₹100 off
- Referral: 200 bonus points per referred friend
- Cancel: Only before 'packed' status

When referring users to pages, use EXACTLY these labels so the frontend can make them clickable:
[My Orders] for order tracking/history
[Cart] for shopping cart
[Wishlist] for wishlist
[Profile] for account settings

Be concise (2–3 sentences), warm, and use Indian context (₹, Indian English).
If asked about a specific order number or personal account detail you can't see, tell the user to check [My Orders] instead of guessing.
If you genuinely cannot help, say so clearly and suggest the user ask for a human agent.
${productSnippet}`;

  // 1. Try Anthropic API directly (server-side — no key exposure)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 250,
          system: systemPrompt,
          messages: [...history.slice(-8), { role: 'user', content: message }],
        },
        {
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 9000,
        }
      );
      const reply = response.data.content?.[0]?.text || '';
      if (reply) return res.json({ success: true, reply });
    } catch (e) {
      console.error('Anthropic API error:', e.response?.data || e.message);
    }
  }

  // 2. Try Flask AI service
  try {
    const { data } = await axios.post(`${AI_URL}/chat`, { message, history }, { timeout: 7000 });
    if (data.reply) return res.json({ reply: data.reply });
  } catch {}

  // 3. Rule-based fallback
  res.json({ success: true, reply: getFAQReply(message) });
});

function getFAQReply(msg) {
  const t = msg.toLowerCase();
  if (/track|where.*order|order status/.test(t))
    return 'To track your order, go to [My Orders] from your profile. You\'ll see live status: Placed → Confirmed → Packed → Shipped → Delivered. 📦';
  if (/cancel/.test(t))
    return 'You can cancel before the order is packed. Go to [My Orders] → Order Detail → Cancel Order.';
  if (/return|refund|exchange/.test(t))
    return 'We have a 7-day return policy. Go to [My Orders] → Order Detail and raise a return request. Refunds take 5–7 business days. 💰';
  if (/payment|pay|upi|cod|card/.test(t))
    return 'We accept UPI, Cards, Net Banking (via Razorpay), and Cash on Delivery. All payments are 256-bit encrypted. 🔒';
  if (/deliver|shipping|how long/.test(t))
    return 'Standard delivery takes 3–5 business days. Free shipping on orders above ₹499! 🚚';
  if (/coupon|discount|promo/.test(t))
    return 'Apply coupons at checkout. New users get 10% off with WELCOME10! 🎉';
  if (/points|loyalty|reward|refer/.test(t))
    return 'Earn 1 point per ₹10 spent. 200 points = ₹100 discount. Refer friends for 200 bonus points! ⭐';
  if (/hi|hello|hey|namaste/.test(t))
    return 'Hello! 👋 I\'m SmartCart AI. I can help with orders, returns, payments, and rewards. What do you need?';
  return "I'm not sure about that. I can help with orders, returns, payments, and rewards — or I can connect you to a human agent if you prefer.";
}

module.exports = r;