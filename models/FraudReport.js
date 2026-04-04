const mongoose = require('mongoose');

/**
 * Community Fraud Report — workers flag suspicious claims in their zone.
 * Verified reports earn the reporter premium credits.
 * This creates a self-policing community layer on top of the ML fraud engine.
 */
const fraudReportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  claim: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', required: true },
  // What they observed
  reason: {
    type: String,
    enum: [
      'worker_not_in_zone',      // "I was in the same zone, didn't see them"
      'gps_spoofing_suspected',  // "Their location jumps were impossible"
      'known_fraudster',         // "This person is known in our community"
      'coordinated_group',       // "Multiple people from same building claiming"
      'other',
    ],
    required: true,
  },
  description: { type: String },
  // Evidence (optional — photos, screenshots)
  evidence: [String],
  // Review outcome
  status: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'dismissed'],
    default: 'pending',
  },
  reviewNote: { type: String },
  reviewedBy: { type: String }, // admin
  reviewedAt: { type: Date },
  // Reward
  creditsAwarded: { type: Number, default: 0 },
  creditsPaid: { type: Boolean, default: false },
  // Impact on claim
  claimImpacted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FraudReport', fraudReportSchema);
