const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName:        { type: String, required: true, trim: true },
  storeSlug:        { type: String, unique: true },
  storeDescription: { type: String, default: '' },
  storeLogo:        { type: String, default: '' },
  storeBanner:      { type: String, default: '' },
  contactEmail:     { type: String, default: '' },
  contactPhone:     { type: String, default: '' },
  address:          { type: String, default: '' },
  gstNumber:        { type: String, default: '' },
  bankDetails: {
    accountName:   { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc:          { type: String, default: '' },
    bankName:      { type: String, default: '' },
  },
  approved:         { type: Boolean, default: false },
  suspended:        { type: Boolean, default: false },
  totalSales:       { type: Number, default: 0 },
  totalRevenue:     { type: Number, default: 0 },
  rating:           { type: Number, default: 0 },
  numRatings:       { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate slug
sellerProfileSchema.pre('save', function (next) {
  if (this.isModified('storeName') && !this.storeSlug) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);