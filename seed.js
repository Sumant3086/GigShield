/**
 * Seed script — creates demo workers and policies for testing
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Worker = require('./models/Worker');
const Policy = require('./models/Policy');

const DEMO_WORKERS = [
  { phone: '+919876543210', name: 'Raju Kumar', platform: 'amazon_flex', zone: 'HSR Layout', city: 'Bengaluru', upiId: 'raju@upi', weeklyEarnings: 4200, kycVerified: true },
  { phone: '+919876543211', name: 'Priya Sharma', platform: 'flipkart_quick', zone: 'T. Nagar', city: 'Chennai', upiId: 'priya@upi', weeklyEarnings: 3800, kycVerified: true },
  { phone: '+919876543212', name: 'Arjun Reddy', platform: 'swiggy', zone: 'Hitech City', city: 'Hyderabad', upiId: 'arjun@upi', weeklyEarnings: 5200, kycVerified: true },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const w of DEMO_WORKERS) {
    let worker = await Worker.findOne({ phone: w.phone });
    if (!worker) {
      worker = await Worker.create(w);
      console.log(`Created worker: ${worker.name}`);
    } else {
      console.log(`Worker exists: ${worker.name}`);
    }

    const existing = await Policy.findOne({ worker: worker._id, status: 'active' });
    if (!existing) {
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + 1);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      await Policy.create({
        worker: worker._id, tier: 'standard', weeklyPremium: 79,
        maxWeeklyPayout: 2500, zone: worker.zone, city: worker.city,
        startDate: monday, endDate: sunday,
        premiumBreakdown: { base: 59, zoneRisk: 14, seasonalRisk: 10, claimFrequency: 0, platformRisk: 3, loyaltyDiscount: 0 },
        totalPremiumPaid: 79,
      });
      console.log(`Created policy for: ${worker.name}`);
    }
  }

  console.log('\nSeed complete. Demo credentials:');
  DEMO_WORKERS.forEach(w => console.log(`  ${w.name}: ${w.phone} (OTP shown in server console)`));
  await mongoose.disconnect();
}

seed().catch(console.error);
