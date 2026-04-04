const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  // Multi-platform support — workers often run 2-3 apps simultaneously
  platform: { type: String, enum: ['amazon_flex', 'flipkart_quick', 'swiggy', 'zomato', 'dunzo'], required: true },
  linkedPlatforms: [{
    platform: { type: String, enum: ['amazon_flex', 'flipkart_quick', 'swiggy', 'zomato', 'dunzo'] },
    weeklyEarnings: Number,
    verifiedAt: Date,
    active: { type: Boolean, default: true },
  }],
  zone: { type: String, required: true },
  city: { type: String, required: true },
  upiId: { type: String, required: true },
  // Earnings — single platform + aggregated multi-platform
  weeklyEarnings: { type: Number, default: 4200 },
  aggregatedWeeklyEarnings: { type: Number, default: 0 }, // sum across all linked platforms
  earningsVerifiedAt: { type: Date },
  kycVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Earnings fingerprint — personal delivery pattern
  earningsFingerprint: {
    peakHours: [Number],           // hours of day with highest activity (0-23)
    activeDays: [Number],          // days of week (0=Sun, 6=Sat)
    avgOrdersPerDay: Number,
    avgKmPerDay: Number,
    preferredZones: [String],      // zones visited most
    platformMix: mongoose.Schema.Types.Mixed, // { amazon_flex: 0.6, swiggy: 0.4 }
    lastUpdated: Date,
  },

  // Cooperative pool membership
  poolId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskPool' },
  poolJoinedAt: { type: Date },
  poolDiscountEarned: { type: Number, default: 0 }, // total ₹ saved via pool

  // 4-week zone presence history for BCS
  zoneHistory: [{ zone: String, date: Date, dayOfWeek: Number, hour: Number }],

  // Device fingerprint for fraud detection
  deviceFingerprint: { type: String },
  referralCode: { type: String },
  registeredAt: { type: Date, default: Date.now },
  cleanWeeks: { type: Number, default: 0 },

  // Community fraud reporting
  communityCredits: { type: Number, default: 0 },  // ₹ credits earned from verified reports
  reportsSubmitted: { type: Number, default: 0 },
  reportsVerified: { type: Number, default: 0 },
  communityTrustScore: { type: Number, default: 50 }, // 0-100, affects report weight

  // Forecast notifications
  forecastsReceived: { type: Number, default: 0 },
  forecastsActedOn: { type: Number, default: 0 }, // shifted zone based on forecast
}, { timestamps: true });

module.exports = mongoose.model('Worker', workerSchema);
