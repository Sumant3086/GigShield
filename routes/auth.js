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

  // Normalize phone — try both with and without +91 prefix
  let worker = await Worker.findOne({ phone });
  if (!worker) {
    // Try alternate format
    const altPhone = phone.startsWith('+91') ? phone.slice(3) : `+91${phone}`;
    worker = await Worker.findOne({ phone: altPhone });
  }

  if (!worker) {
    // Genuinely new worker — if no registration details, show form (keep OTP alive)
    if (!name || !platform || !zone || !city || !upiId) {
      return res.status(200).json({ needsRegistration: true });
    }
    // Registration details provided — create worker and consume OTP
    otpStore.delete(phone);
    worker = await Worker.create({
      phone, name, platform, zone, city,
      upiId, weeklyEarnings: weeklyEarnings || 4200,
      kycVerified: true,
    });
  } else {
    // Existing worker — just log in, consume OTP
    otpStore.delete(phone);
  }

  // Generate token with 30-day expiry for better UX
  const token = jwt.sign({ id: worker._id, phone: worker.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, worker });
});

// POST /api/auth/login (admin)
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'gigshield2026';
  
  if (username === adminUsername && password === adminPassword) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, role: 'admin' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// GET /api/auth/verify-token - Check if token is still valid
router.get('/verify-token', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false, error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const worker = await Worker.findById(decoded.id);
    if (!worker) return res.status(401).json({ valid: false, error: 'Worker not found' });
    
    res.json({ valid: true, worker });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

module.exports = router;
