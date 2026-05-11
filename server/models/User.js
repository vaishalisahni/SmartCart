const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName:  { type: String, required: true },
  phone:     { type: String, required: true },
  street:    { type: String, required: true },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone:    { type: String, default: '' },
  avatar:   { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin', 'seller', 'super_admin'], default: 'user' },
  addresses:[addressSchema],
  isVerified:{ type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  resetOTP:  { type: String, select: false },
  resetOTPExpiry: { type: Date, select: false },
  recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  refreshToken: { type: String, select: false },

  // Referral
  referralCode: { type: String, unique: true, sparse: true },
  referredBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralCount:{ type: Number, default: 0 },

  // Seller info (lightweight — full profile in SellerProfile model)
  sellerProfile: {
    storeName:        { type: String, default: '' },
    storeDescription: { type: String, default: '' },
    approved:         { type: Boolean, default: false },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);