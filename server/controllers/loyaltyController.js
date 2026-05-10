const LoyaltyPoints = require('../models/LoyaltyPoints');

const POINTS_PER_RUPEE = 0.1;   // ₹10 spent → 1 point
const POINTS_TO_RUPEE = 0.5;    // 1 point → ₹0.50 (200 pts = ₹100 off)
const REFERRAL_BONUS  = 200;
const WELCOME_BONUS   = 50;

// Get or create loyalty account
const getOrCreate = async (userId) => {
  let loyalty = await LoyaltyPoints.findOne({ user: userId });
  if (!loyalty) loyalty = await LoyaltyPoints.create({ user: userId });
  return loyalty;
};

// @GET /api/loyalty
exports.getPoints = async (req, res) => {
  const loyalty = await getOrCreate(req.user._id);
  res.json({
    success: true,
    loyalty,
    conversion: { earnRate: POINTS_PER_RUPEE, redeemRate: POINTS_TO_RUPEE },
  });
};

// Called internally after order placement
exports.earnPoints = async (orderId, userId, orderTotal) => {
  const points = Math.floor(orderTotal * POINTS_PER_RUPEE);
  if (points <= 0) return;
  const loyalty = await getOrCreate(userId);
  loyalty.points      += points;
  loyalty.totalEarned += points;
  loyalty.history.push({ type: 'earned', points, description: `Earned for order #${String(orderId).slice(-8).toUpperCase()}`, orderId });
  await loyalty.save();
};

// Called on first registration with a referral code
exports.addReferralPoints = async (referrerId) => {
  const loyalty = await getOrCreate(referrerId);
  loyalty.points      += REFERRAL_BONUS;
  loyalty.totalEarned += REFERRAL_BONUS;
  loyalty.history.push({ type: 'referral', points: REFERRAL_BONUS, description: 'Friend joined using your referral link!' });
  await loyalty.save();
};

// Give welcome bonus on registration
exports.addWelcomeBonus = async (userId) => {
  const loyalty = await getOrCreate(userId);
  loyalty.points      += WELCOME_BONUS;
  loyalty.totalEarned += WELCOME_BONUS;
  loyalty.history.push({ type: 'bonus', points: WELCOME_BONUS, description: 'Welcome bonus — thanks for joining SmartCart!' });
  await loyalty.save();
};

// @POST /api/loyalty/redeem  — body: { points }
exports.redeemPoints = async (req, res) => {
  const { points } = req.body;
  if (!points || points <= 0) return res.status(400).json({ message: 'Invalid points amount' });
  const loyalty = await LoyaltyPoints.findOne({ user: req.user._id });
  if (!loyalty || loyalty.points < points) {
    return res.status(400).json({ message: `Insufficient points. You have ${loyalty?.points || 0} points.` });
  }
  const discount = Math.floor(points * POINTS_TO_RUPEE);
  loyalty.points        -= points;
  loyalty.totalRedeemed += points;
  loyalty.history.push({ type: 'redeemed', points, description: `Redeemed ${points} pts for ₹${discount} discount` });
  await loyalty.save();
  res.json({ success: true, discount, remainingPoints: loyalty.points });
};