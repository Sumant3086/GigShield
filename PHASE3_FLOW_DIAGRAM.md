# Phase 3 Integration Flow Diagram

## Complete Claim Lifecycle with Phase 3 Features

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRIGGER ENGINE (Every 5 min)                     │
│                   services/triggerEngine.js                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Weather API Check      │
                    │  (OpenWeather/IMD)      │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Threshold Exceeded?      │
                    │  (Rain >64.5mm, Heat >45°C)│
                    └─────────────┬─────────────┘
                                  │ YES
                                  ▼
                    ┌─────────────────────────┐
                    │  Create TriggerEvent    │
                    │  Find Active Policies   │
                    └─────────────────────────┘
                                  │
                                  ▼
        ┌───────────────────────────────────────────────┐
        │         FOR EACH WORKER IN ZONE               │
        └───────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Run Fraud Analysis       │
                    │  (7-Signal BCS)           │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Calculate Payout         │
                    │  (Daily Rate × Multiplier)│
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   CREATE CLAIM          │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │ 🔗 BLOCKCHAIN     │       │ BCS Score Check   │
        │ recordClaimOnChain│       │                   │
        │ (Polygon)         │       └─────────┬─────────┘
        └───────────────────┘                 │
                                  ┌───────────┴───────────┐
                                  │                       │
                    BCS ≥ 60      │           BCS 35-60   │      BCS < 35
                    AUTO-APPROVED │           SOFT-HOLD   │      HUMAN REVIEW
                                  │                       │
                    ┌─────────────┴─────────────┐         │
                    │                           │         │
                    ▼                           ▼         ▼
        ┌───────────────────┐       ┌───────────────────┐
        │ 💰 PAYOUT         │       │ 📞 VOICE CALL     │
        │ simulatePayout()  │       │ initiateVoice     │
        │                   │       │ Verification()    │
        │ ├─ Razorpay       │       │                   │
        │ ├─ Update Status  │       │ ├─ Twilio Call    │
        │ └─ Record Payment │       │ ├─ Hindi Prompt   │
        └─────────┬─────────┘       │ └─ Press 1/2      │
                  │                 └─────────┬─────────┘
                  │                           │
                  ▼                           │ Worker Confirms
        ┌───────────────────┐                 │
        │ 📱 WHATSAPP       │◄────────────────┘
        │ notifyPayment     │
        │ Received()        │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ 🔗 BLOCKCHAIN     │
        │ recordClaimOnChain│
        │ (Status: PAID)    │
        └───────────────────┘
```

---

## Prediction Engine Flow (Every 6 hours)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  PREDICTION ENGINE (Every 6 hours)                  │
│                   services/predictionService.js                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Calculate Probabilities│
                    │  (Historical + Seasonal)│
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Confidence ≥ 20%?        │
                    └─────────────┬─────────────┘
                                  │ YES
                                  ▼
                    ┌─────────────────────────┐
                    │  Create Forecast        │
                    │  (48-hour prediction)   │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Confidence ≥ 60%?        │
                    └─────────────┬─────────────┘
                                  │ YES
                                  ▼
                    ┌─────────────────────────┐
                    │  Find Workers in Zone   │
                    │  (Limit: 50 workers)    │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ 📱 WHATSAPP BATCH       │
                    │ notifyForecastAlert()   │
                    │                         │
                    │ ├─ Disruption Type      │
                    │ ├─ Confidence %         │
                    │ ├─ Recommendation       │
                    │ └─ Alternative Zones    │
                    └─────────────────────────┘
```

---

## Pool Health Update Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    POOL STATS CALCULATION                           │
│                   services/poolService.js                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Calculate Loss Ratio   │
                    │  (Payouts / Premiums)   │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Recalculate Health     │
                    │  Score (0-100)          │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │  Health Score ≥ 80?       │
                    │  (Previously < 80)        │
                    └─────────────┬─────────────┘
                                  │ YES
                                  ▼
                    ┌─────────────────────────┐
                    │  Find Pool Members      │
                    │  (Limit: 50 workers)    │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ 📱 WHATSAPP BATCH       │
                    │ notifyPoolDiscount()    │
                    │                         │
                    │ ├─ Health Score         │
                    │ ├─ Discount %           │
                    │ └─ Loss Ratio           │
                    └─────────────────────────┘
```

---

## Blockchain Verification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WORKER REQUESTS VERIFICATION                     │
│              GET /api/claims/:id/verify-blockchain                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Fetch Claim from DB    │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  verifyClaimOnChain()   │
                    │  (Query Polygon)        │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  generateVerificationQR()│
                    │                         │
                    │ ├─ Verification URL     │
                    │ ├─ Explorer URL         │
                    │ └─ Transaction Hash     │
                    └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Return to Worker       │
                    │  (JSON Response)        │
                    └─────────────────────────┘
```

---

## Integration Points Summary

### 🔗 Blockchain Recording (5 points)
1. Claim creation → `triggerEngine.js`
2. Worker confirmation → `routes/claims.js`
3. Admin approval → `routes/claims.js`
4. Admin rejection → `routes/claims.js`
5. Payment completion → `paymentService.js`

### 📱 WhatsApp Notifications (4 types)
1. Claim approved → `triggerEngine.js`
2. Payment received → `paymentService.js`
3. Forecast alerts → `predictionService.js` (batch)
4. Pool health → `poolService.js` (batch)

### 📞 Voice Verification (1 point)
1. Soft-hold claims → `triggerEngine.js`

### 🎯 AI Insights (2 endpoints)
1. Personalized insights → `routes/insights.js`
2. Risk score → `routes/insights.js`

---

## Error Handling Pattern

All integrations use non-blocking error handling:

```javascript
// Pattern used throughout
somePhase3Function(data).catch(err =>
  console.warn('[Service] Phase 3 feature failed:', err.message)
);

// Main flow continues regardless of Phase 3 success/failure
```

This ensures:
- ✅ Payments never fail due to WhatsApp issues
- ✅ Claims never fail due to blockchain issues
- ✅ Core functionality is always reliable
- ✅ Phase 3 features enhance but don't block

---

## Demo Mode vs Production

### Demo Mode (No Credentials)
```
[WhatsApp] Demo mode - would send: Payment received...
[Voice] Demo mode - would call: +919876543210
[Blockchain] Demo mode - would record claim: 507f1f77bcf86cd799439011
```

### Production Mode (With Credentials)
```
[WhatsApp] Message sent: wamid.HBgLMTIzNDU2Nzg5MAA=
[Voice] Call initiated: CA1234567890abcdef
[Blockchain] Tx recorded: 0x1a2b3c4d5e6f7890abcdef...
```

---

**All Phase 3 features are now fully integrated and operational!** 🚀
