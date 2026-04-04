const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');

// Mock OTP store (in prod: Firebase Auth / SMS gateway)
const otpStore = new Map();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });
  console.log(`OTP for ${phone}: ${otp}`); // In prod: send via SMS
  res.json({ success: true, message: 'OTP sent', devOtp: otp }); // devOtp only in dev
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone, otp, name, platform, zone, city, upiId, weeklyEarnings } = req.body;
  const stored = otpStore.get(phone);
  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  let worker = await Worker.findOne({ phone });
  let isNew = false;

  if (!worker) {
    // New worker — if registration details not provided yet, tell frontend to show form
    // but DO NOT delete the OTP so the second call (with form data) still works
    if (!name || !platform || !zone || !city || !upiId) {
      return res.status(200).json({ needsRegistration: true });
    }
    // All details provided — now consume the OTP and create the worker
    otpStore.delete(phone);
    worker = await Worker.create({
      phone, name, platform, zone, city,
      upiId, weeklyEarnings: weeklyEarnings || 4200,
      kycVerified: true,
    });
    isNew = true;
  } else {
    // Existing worker — consume OTP and log in
    otpStore.delete(phone);
  }

  const token = jwt.sign({ id: worker._id, phone: worker.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, worker, isNew });
});

// POST /api/auth/login (admin)
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'gigshield2026') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, role: 'admin' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;
