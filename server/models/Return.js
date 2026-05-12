const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:     String,
    image:    String,
    price:    Number,
    quantity: { type: Number, required: true },
    reason:   { type: String, required: true },
  }],

  reason: {
    type: String,
    enum: [
      'damaged_defective',
      'wrong_item',
      'not_as_described',
      'changed_mind',
      'missing_parts',
      'poor_quality',
      'other',
    ],
    required: true,
  },
  reasonDetails: { type: String, default: '' },

  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'picked_up', 'refunded'],
    default: 'requested',
  },

  refundAmount:  { type: Number, default: 0 },
  refundMethod:  { type: String, default: 'original' }, // original | wallet
  adminNote:     { type: String, default: '' },

  statusHistory: [{
    status:    String,
    note:      String,
    updatedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);