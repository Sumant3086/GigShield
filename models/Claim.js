const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  policy: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
  triggerType: {
    type: String,
    enum: ['heavy_rainfall', 'extreme_heat', 'flood_warning', 'civic_curfew', 'platform_halt'],
    required: true,
  },
  triggerSeverity: { type: String, enum: ['orange', 'red', 'disaster'], default: 'red' },
  zone: { type: String, required: true },
  city: { type: String, required: true },
  eventDescription: { type: String },
  // Payout calculation
  dailyRate: { type: Number }, // weeklyEarnings / 6
  severityMultiplier: { type: Number, default: 1.0 },
  payoutAmount: { type: Number },
  // Fraud scoring
  bcsScore: { type: Number, default: 0 },
  bcsSignals: {
    platformSession: { score: Number, passed: Boolean },
    routeCoherence: { score: Number, passed: Boolean },
    networkTriangulation: { score: Number, passed: Boolean },
    historicalZone: { score: Number, passed: Boolean },
    deviceIntegrity: { score: Number, passed: Boolean },
    platformHalt: { score: Number, passed: Boolean },
    accelerometer: { score: Number, passed: Boolean },
  },
  fraudFlags: [String],
  // Status flow
  status: {
    type: String,
    enum: ['pending', 'auto_approved', 'soft_hold', 'human_review', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },
  reviewNote: { type: String },
  // Payment
  paymentRef: { type: String },
  paidAt: { type: Date },
  // Data sources used
  dataSources: [String],
  initiatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);
