const mongoose = require('mongoose');

/**
 * Cooperative Risk Pool — workers in the same zone form a mutual micro-pool.
 * When the pool is healthy (low claims), all members get a premium discount.
 * When the pool is stressed, the discount shrinks. This aligns incentives:
 * workers benefit from each other's honest behaviour.
 */
const riskPoolSchema = new mongoose.Schema({
  zone: { type: String, required: true },
  city: { type: String, required: true },
  name: { type: String }, // e.g. "HSR Layout Mutual Pool #1"
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  maxMembers: { type: Number, default: 50 },
  // Pool financials
  poolFund: { type: Number, default: 0 },       // total premiums contributed this week
  totalPayouts: { type: Number, default: 0 },    // total paid out from pool
  weeklyContribution: { type: Number, default: 0 }, // per-member contribution this week
  // Health metrics
  lossRatio: { type: Number, default: 0 },       // payouts / premiums (0-1)
  healthScore: { type: Number, default: 100 },   // 0-100, drives discount
  // Discount applied to members' premiums
  discountPercent: { type: Number, default: 10 }, // starts at 10%, adjusts weekly
  // Status
  status: { type: String, enum: ['forming', 'active', 'stressed', 'dissolved'], default: 'forming' },
  weekStart: { type: Date },
  weekEnd: { type: Date },
  // History
  weeklyHistory: [{
    weekStart: Date,
    lossRatio: Number,
    discountApplied: Number,
    memberCount: Number,
    totalPremiums: Number,
    totalPayouts: Number,
  }],
}, { timestamps: true });

// Compute health score and discount from loss ratio
riskPoolSchema.methods.recalculate = function () {
  const lr = this.lossRatio;
  // Health: 100 at 0% loss ratio, 0 at 100%+ loss ratio
  this.healthScore = Math.max(0, Math.round(100 - lr * 100));
  // Discount: 15% when healthy, 0% when stressed
  if (this.healthScore >= 80) this.discountPercent = 15;
  else if (this.healthScore >= 60) this.discountPercent = 10;
  else if (this.healthScore >= 40) this.discountPercent = 5;
  else this.discountPercent = 0;
  // Status
  if (this.members.length < 3) this.status = 'forming';
  else if (lr > 0.8) this.status = 'stressed';
  else this.status = 'active';
};

module.exports = mongoose.model('RiskPool', riskPoolSchema);
