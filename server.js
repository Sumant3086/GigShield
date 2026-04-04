require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

// Config — single source of truth for all platform constants
app.use('/api/config', require('./routes/config'));

// Core routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/triggers', require('./routes/triggers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ml', require('./routes/ml'));

// Phase 2 — Differentiating features
app.use('/api/pools', require('./routes/pools'));           // Cooperative risk pooling
app.use('/api/forecasts', require('./routes/forecasts'));   // 48hr disruption prediction
app.use('/api/income', require('./routes/income'));         // Multi-platform income aggregation
app.use('/api/reports', require('./routes/reports'));       // Community fraud reporting

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  time: new Date(),
  features: ['cooperative_pools', 'disruption_prediction', 'income_aggregation', 'community_reporting', 'earnings_fingerprint'],
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    const { runTriggerEngine } = require('./services/triggerEngine');
    const { runPredictionEngine } = require('./services/predictionService');

    // Trigger engine — every 5 minutes
    cron.schedule('*/5 * * * *', runTriggerEngine);

    // Prediction engine — every 6 hours
    cron.schedule('0 */6 * * *', runPredictionEngine);

    // Run prediction engine on startup
    runPredictionEngine().catch(console.error);

    console.log('Trigger engine + Prediction engine scheduled');
  })
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`GigShield API running on port ${PORT}`));
