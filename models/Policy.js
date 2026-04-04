const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  tier: { type: String, enum: ['basic', 'standard', 'pro'], required: true },
  weeklyPremium: { type: Number, required: true },
  maxWeeklyPayout: { type: Number, required: true },
  status: { type: String, enum: ['active', 'paused', 'expired'], default: 'active' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  zone: { type: String, required: true },
  city: { type: String, required: true },
  // AI premium breakdown
  premiumBreakdown: {
    base: Number,
    zoneRisk: Number,
    seasonalRisk: Number,
    claimFrequency: Number,
    platformRisk: Number,
    loyaltyDiscount: Number,
  },
  autoRenew: { type: Boolean, default: true },
  totalPremiumPaid: { type: Number, default: 0 },
  totalPayoutReceived: { type: Number, default: 0 },
}, { timestamps: true });

// Tier config
policySchema.statics.TIERS = {
  basic:    { base: 29, maxPayout: 1000 },
  standard: { base: 59, maxPayout: 2500 },
  pro:      { base: 99, maxPayout: 5000 },
};

module.exports = mongoose.model('Policy', policySchema);
