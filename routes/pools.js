const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { joinPool, leavePool, getPoolStats, listPoolsForCity } = require('../services/poolService');
const Worker = require('../models/Worker');
const RiskPool = require('../models/RiskPool');

// GET /api/pools/my  — current worker's pool
router.get('/my', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    if (!worker.poolId) return res.json({ pool: null, inPool: false });
    const stats = await getPoolStats(worker.poolId);
    res.json({ inPool: true, ...stats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/pools/available  — pools in worker's city
router.get('/available', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    const pools = await listPoolsForCity(worker.city);
    res.json(pools);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pools/join  — join or create pool for worker's zone
router.post('/join', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    const result = await joinPool(req.user.id, worker.zone, worker.city);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pools/leave
router.post('/leave', auth, async (req, res) => {
  try {
    const result = await leavePool(req.user.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/pools/:id/stats
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const stats = await getPoolStats(req.params.id);
    if (!stats) return res.status(404).json({ error: 'Pool not found' });
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
