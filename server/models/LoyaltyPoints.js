const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
  type:        { type: String, enum: ['earned', 'redeemed', 'expired', 'referral', 'bonus'] },
  points:      { type: Number, required: true },
  description: { type: String, default: '' },
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
}, { timestamps: true });

const loyaltySchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  points:        { type: Number, default: 0 },
  totalEarned:   { type: Number, default: 0 },
  totalRedeemed: { type: Number, default: 0 },
  tier:          { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  history:       [historyEntrySchema],
}, { timestamps: true });

// Auto-update tier based on totalEarned
loyaltySchema.pre('save', function (next) {
  if (this.totalEarned >= 10000) this.tier = 'platinum';
  else if (this.totalEarned >= 5000) this.tier = 'gold';
  else if (this.totalEarned >= 2000) this.tier = 'silver';
  else this.tier = 'bronze';
  next();
});

module.exports = mongoose.model('LoyaltyPoints', loyaltySchema);