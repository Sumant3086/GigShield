const mongoose = require('mongoose');

const triggerEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['heavy_rainfall', 'extreme_heat', 'flood_warning', 'civic_curfew', 'platform_halt'],
    required: true,
  },
  severity: { type: String, enum: ['orange', 'red', 'disaster'], default: 'red' },
  zone: { type: String, required: true },
  city: { type: String, required: true },
  description: { type: String },
  value: { type: Number }, // e.g. rainfall mm/hr or temperature
  unit: { type: String },
  dataSources: [String],
  validatedSources: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  affectedWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  claimsInitiated: { type: Number, default: 0 },
  expiresAt: { type: Date },
  detectedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('TriggerEvent', triggerEventSchema);
