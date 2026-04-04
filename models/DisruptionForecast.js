const mongoose = require('mongoose');

/**
 * 48-hour ahead disruption prediction.
 * Instead of reacting to events, GigShield warns workers in advance
 * so they can shift zones, stock up, or plan rest days.
 */
const disruptionForecastSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['heavy_rainfall', 'extreme_heat', 'flood_warning', 'civic_curfew', 'platform_halt'],
    required: true,
  },
  zone: { type: String, required: true },
  city: { type: String, required: true },
  // Prediction window
  forecastedFor: { type: Date, required: true },   // when the event is expected
  forecastedUntil: { type: Date },                  // expected end
  // Confidence and severity
  confidence: { type: Number, min: 0, max: 100 },  // model confidence %
  predictedSeverity: { type: String, enum: ['low', 'moderate', 'high', 'extreme'], default: 'moderate' },
  predictedValue: { type: Number },                 // e.g. expected rainfall mm/hr
  unit: { type: String },
  // Data sources used for prediction
  dataSources: [String],
  // Recommendation for workers
  recommendation: { type: String },                 // e.g. "Consider shifting to Koramangala zone"
  alternativeZones: [String],                       // safer zones nearby
  // Lifecycle
  isActive: { type: Boolean, default: true },
  didMaterialize: { type: Boolean, default: false }, // did the event actually happen?
  accuracy: { type: Number },                        // filled in after event window
  notifiedWorkers: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('DisruptionForecast', disruptionForecastSchema);
