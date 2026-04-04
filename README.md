# GigShield — Working Implementation

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

## Quick Start

### 1. Backend (Express API)
```bash
cd gigshield
npm install
# Edit .env — set MONGO_URI to your MongoDB connection string
npm run dev        # runs on http://localhost:5000
```

### 2. Seed demo data (optional)
```bash
node seed.js
```

### 3. Frontend (Next.js)
```bash
cd gigshield/client
npm install
npm run dev        # runs on http://localhost:3000
```

## Usage

### Worker App — http://localhost:3000
1. Enter any 10-digit phone number → OTP shown in server console
2. Fill registration details (name, platform, zone, UPI)
3. Select coverage tier → policy activates
4. Dashboard shows coverage status, claims, earnings protected
5. Use "Simulate Disruption" panel to trigger a test event

### Admin Dashboard — http://localhost:3000/admin/login
- Username: `admin` / Password: `gigshield2026`
- View stats, charts, all claims
- Simulate disruption events (fires trigger engine, creates claims)
- Approve/reject claims in human review

## Architecture

```
gigshield/
├── server.js              # Express entry point
├── models/                # Mongoose schemas
│   ├── Worker.js
│   ├── Policy.js
│   ├── Claim.js
│   └── TriggerEvent.js
├── routes/                # REST API routes
│   ├── auth.js            # OTP login
│   ├── workers.js         # Worker profile + dashboard
│   ├── policies.js        # Policy CRUD + AI quote
│   ├── claims.js          # Claims + worker confirm
│   ├── triggers.js        # Trigger engine + simulate
│   ├── admin.js           # Admin stats + analytics
│   └── ml.js              # ML endpoints
├── services/
│   ├── mlService.js       # XGBoost mock (risk scoring + BCS)
│   ├── fraudEngine.js     # Isolation Forest mock + ring detection
│   ├── triggerEngine.js   # Parametric trigger engine (cron)
│   └── paymentService.js  # Razorpay mock (UPI payout)
└── client/                # Next.js 14 frontend
    └── app/
        ├── login/         # Phone OTP login + registration
        ├── onboard/       # Tier selection + AI premium quote
        ├── dashboard/     # Worker dashboard
        ├── claims/        # Claims history + soft-hold confirm
        └── admin/         # Admin login + analytics dashboard
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/send-otp | — | Send OTP to phone |
| POST | /api/auth/verify-otp | — | Verify OTP + login/register |
| POST | /api/auth/admin-login | — | Admin login |
| GET | /api/workers/dashboard | Worker | Full dashboard data |
| GET | /api/policies/quote | Worker | AI premium quote |
| POST | /api/policies | Worker | Activate policy |
| GET | /api/claims | Worker | Worker's claims |
| POST | /api/claims/confirm/:id | Worker | One-tap soft-hold confirm |
| GET | /api/triggers/active | Worker | Active disruptions in zone |
| POST | /api/triggers/simulate | Admin | Simulate disruption event |
| GET | /api/admin/stats | Admin | Platform analytics |
| GET | /api/claims/admin/all | Admin | All claims |
| PUT | /api/claims/admin/:id/approve | Admin | Approve claim |
| PUT | /api/claims/admin/:id/reject | Admin | Reject claim |
