# GigShield
# AI-Powered Parametric Income Insurance for E-Commerce Delivery Partners

Team JOD | Sumant Yadav · Mausumi Ghadei · Sameer Mahato
Guidewire DEVTrails 2026 | Phase 1 Submission


# Table of Contents

1. [The Problem](#1-the-problem)
2. [Our Solution](#2-our-solution)
3. [Persona and User Scenarios](#3-persona-and-user-scenarios)
4. [Application Workflow](#4-application-workflow)
5. [Weekly Premium Model](#5-weekly-premium-model)
6. [Parametric Triggers](#6-parametric-triggers)
7. [AI and ML Integration](#7-ai-and-ml-integration)
8. [Adversarial Defense and Anti-Spoofing Strategy](#8-adversarial-defense-and-anti-spoofing-strategy)
9. [Tech Stack](#9-tech-stack)
10. [Development Plan](#10-development-plan)
11. [Platform Choice](#11-platform-choice)


# 1. The Problem

India's e-commerce delivery ecosystem runs on millions of gig workers employed through platforms like Amazon Flex and Flipkart Quick. These workers earn between ₹15,000 and ₹30,000 a month, and every rupee depends entirely on their ability to physically get on the road and complete deliveries.

When a cyclone grounds Chennai, when Bengaluru floods during monsoon, or when a sudden Section 144 curfew locks down a delivery zone, these workers stop earning. The platform does not compensate them. The insurance industry does not serve them. They absorb the full income loss alone, with no safety net and no way to plan around it.

Disruption events cause 20 to 30 percent monthly income loss for workers in high-exposure metro zones. For someone earning ₹3,800 a week, losing even two days during a flood means ₹1,200 gone with no mechanism for recovery.

GigShield exists to close that gap. It covers lost income only. Health, accident, vehicle repair, and life coverage are strictly excluded. This is a purpose-built income safety net, nothing more and nothing less.


# 2. Our Solution

GigShield is a web-based, AI-powered parametric income insurance platform built exclusively for e-commerce delivery partners. The core principle is simple: when an objective, verifiable external disruption prevents a worker from earning, the system detects it automatically and pays them out without any action required on their end.

There are no claim forms. There are no phone calls to a helpline. There is no waiting for a surveyor. The worker receives an SMS notification and a UPI credit within hours of a disruption being confirmed.

The platform operates on a weekly pricing model aligned to how gig workers actually earn and spend. It uses AI to personalise premiums based on each worker's zone and risk profile, and it deploys multi-layer fraud detection to protect the liquidity pool from exploitation.


# 3. Persona and User Scenarios

Raju, 28 — Amazon Flex Partner, Bengaluru (HSR Layout zone)

Raju earns approximately ₹4,200 a week working six days from 9 AM to 9 PM. He operates within a 10 km delivery zone around HSR Layout and picks up packages from a fixed Amazon warehouse each morning. In July 2024, Bengaluru's monsoon floods kept him off the road for four days straight. He lost ₹2,800 with no explanation and no recourse from the platform. He uses a budget Android phone, lives in a shared flat, and has no financial buffer beyond one week of earnings. His primary vulnerability is waterlogged access roads cutting him off from his warehouse.

Priya, 32 — Flipkart Delivery Executive, Chennai (T. Nagar)

Priya works five to six days a week and averages ₹3,800. Chennai's cyclone season and intensifying heat waves are her primary disruption risks. When a cyclone advisory is issued, Flipkart suspends deliveries in her zone for two to three days at a stretch. Those lost days compound into a significant monthly shortfall every season.

Scenario 1 — Flash Flood, Bengaluru

It is Monday at 7 AM. IMD issues a Red Alert for HSR Layout as rainfall crosses 80 mm per hour. GigShield's trigger engine detects the threshold breach and cross-validates the event against IMD, OpenWeatherMap, and the NDMA flood feed. All three confirm. Raju has an active Standard Shield policy. The system checks his Amazon Flex session — he was logged in and had accepted a delivery batch at 6:45 AM. A claim is automatically initiated. By 9 AM, before Raju has even looked at his phone, a payout of ₹700 is queued to his UPI ID. He receives an SMS: "GigShield: Flood disruption confirmed in your zone. ₹700 income protection payout will be credited within 2 hours."

Scenario 2 — Section 144 Curfew, Chennai

A local protest escalates at 11 AM and authorities declare Section 144 in T. Nagar. Flipkart suspends deliveries for all registered zones in the area. GigShield's NLP civic feed detects the curfew notification and cross-validates it against the simulated Flipkart halt signal. Priya's policy is active. A claim is initiated for a half-day disruption, calculated at ₹475, and queued for payout.

Scenario 3 — Extreme Heat Wave, Hyderabad

IMD issues a heat wave advisory for Hyderabad: 46°C with a public health alert. E-commerce platforms voluntarily pause mandatory outdoor delivery shifts. GigShield detects the advisory threshold breach and auto-initiates claims for all active policy holders in the affected delivery zones.


# 4. Application Workflow

Stage 1 — Onboarding

The worker visits the GigShield web app and signs up using their phone number via OTP. After a lightweight Aadhaar-lite KYC step, they select their delivery platform, enter their primary delivery zone and warehouse area, and link their UPI ID. The AI Risk Engine generates a personalised weekly premium quote and the worker activates their first week of coverage.

Stage 2 — Active Coverage Week

Once the policy is active, GigShield monitors the worker's registered zone continuously in the background. This includes the weather feed from IMD and OpenWeatherMap, a civic disruption feed from the municipal API and NLP news scanner, and the platform delivery halt signal from the simulated API. The worker does not need to interact with the platform at all during normal operations.

Stage 3 — Disruption Detected

When the trigger engine detects a threshold breach in the worker's zone, it cross-validates the event across three or more independent data sources and confirms the worker holds an active policy. The fraud engine then runs the Behavioral Coherence Score check. A score of 60 or above with no ring signals triggers auto-approval. A score between 35 and 59 or one anomaly signal places the claim in a two-hour soft hold for automated re-check. A score below 35 or two or more ring signals suspends the claim and queues it for human review.

Stage 4 — Payout

An approved claim calculates the lost income as the worker's average weekly earnings divided by six working days, multiplied by a severity multiplier. The amount is transferred to the worker's UPI via Razorpay, the worker is notified by SMS, and the claim is recorded in the dashboard.

Stage 5 — Analytics

The worker dashboard shows active coverage status, current weekly premium, claims history, and total earnings protected to date. The admin dashboard shows zone-wise loss ratios, fraud flags, BCS distribution across the portfolio, and predictive disruption alerts for the coming week.


# 5. Weekly Premium Model

Gig workers earn weekly, plan weekly, and think about money weekly. A monthly or annual premium commitment creates immediate friction at onboarding and causes workers to lapse coverage during safer months. GigShield's entire financial model is structured around a weekly cadence. Coverage activates every Monday, expires Sunday, and renews automatically unless the worker pauses it.

Base Coverage Tiers

| Tier | Weekly Premium | Max Weekly Payout | Best Fit |
|---|---|---|---|
| Basic Shield | ₹29 | ₹1,000 | New workers, low-risk zones |
| Standard Shield | ₹59 | ₹2,500 | Most metro-zone delivery workers |
| Pro Shield | ₹99 | ₹5,000 | High earners in high-exposure zones |

AI-Driven Premium Adjustments

The base premium is modified weekly by the Risk Scoring Engine before each renewal. All adjustments are shown transparently to the worker before they confirm.

| Factor | Data Source | Weekly Adjustment |
|---|---|---|
| Zone historical flood or weather risk | IMD historical API | ₹5 to ₹20 |
| Current seasonal risk index | IMD forecast + calendar | ₹2 to ₹10 |
| Worker's own claim frequency | Internal DB | ₹2 to ₹8 |
| Loyalty discount after 4 clean weeks | Internal DB | Up to ₹6 reduction |
| Delivery platform risk profile | Simulated platform API | ₹1 to ₹5 |

Example: Raju in HSR Layout during July monsoon season starts at the Standard Shield base of ₹59. A ₹14 monsoon surcharge and a ₹6 high-risk zone adjustment bring his weekly premium to ₹79. After four consecutive claim-free weeks, a ₹5 loyalty discount applies, bringing his rate to ₹74.

Payout Calculation

Daily payout equals the worker's average weekly earnings divided by six working days, multiplied by a severity multiplier. An Orange Alert or partial disruption under four hours uses a multiplier of 0.5. A Red Alert or full zone shutdown lasting four or more hours uses a multiplier of 1.0. A multi-day declared disaster can use up to 3.0 times the daily rate, capped at the tier maximum.


# 6. Parametric Triggers

Every claim on GigShield is initiated by an objective, measurable external event. The worker never files a claim manually. The system detects, validates, and acts.

| Trigger | Data Source | Activation Threshold |
|---|---|---|
| Heavy Rainfall | IMD / OpenWeatherMap | Rainfall exceeds 64.5 mm per hour in delivery zone |
| Extreme Heat Wave | IMD API | Temperature above 45°C with official IMD advisory |
| Severe Flood Warning | IMD / NDMA (mock) | Red flood alert issued for the worker's district |
| Civic Curfew or Section 144 | Municipal API (mock) + NLP feed | Official curfew declared in delivery zone |
| Platform Delivery Halt | Simulated Platform API | Platform suspends operations in zone for more than 3 hours |

All triggers are zone-specific. An event in Chennai has no effect on a policy holder in Pune. Workers are matched to triggers by their registered delivery zones set at onboarding.


# 7. AI and ML Integration

Risk Scoring Engine

Model type: XGBoost Gradient Boosted Regression

The engine is trained on IMD historical weather records spanning three years, NDMA disaster event logs, and a simulated claims dataset representing 10,000 synthetic gig worker policies across six metro zones. Inputs include the worker's registered zone, historical disruption frequency for that zone, current month and season, the worker's personal claim history, and the delivery platform they operate on. The output is a weekly risk multiplier that adjusts the base premium before each Monday renewal. The model is retrained quarterly as real operational data accumulates.

Fraud Detection Engine

Model type: Isolation Forest anomaly detector combined with a deterministic rule-based layer

The Isolation Forest is trained on synthetic behavioural patterns representing both legitimate claims and known spoofing patterns. It produces an anomaly score for every claim submission, which feeds into the Behavioral Coherence Score calculation detailed in Section 8. The rule-based layer applies hard checks including device fingerprint deduplication, GPS impossibility detection, and platform halt confirmation that operate independently of the ML model and can trigger escalation on their own.

NLP Civic Disruption Feed

A lightweight text classifier built on a fine-tuned DistilBERT model monitors aggregated public news feeds and civic announcement channels for signals of local disruptions including curfews, large-scale strikes, and market closures. Detected events are geocoded against delivery zone boundaries and fed into the trigger engine. All feeds are mocked in Phase 1.


# 8. Adversarial Defense and Anti-Spoofing Strategy

This section addresses the Market Crash threat scenario: a coordinated syndicate of 500 delivery workers using GPS-spoofing applications to fake their location inside a red-alert weather zone, triggering mass false payouts and draining the platform's liquidity pool.

Why GPS-Only Verification Fails

Any system that issues a payout based solely on GPS coordinates falling within an affected zone will be exploited. GPS is the easiest signal to fake and the worst signal to trust in isolation. GigShield treats GPS as one low-trust input among many, not the basis for a payout decision.

The Behavioral Coherence Score

For every claim, GigShield constructs a Behavioral Coherence Score ranging from 0 to 100. The score answers one question: does the complete set of signals around this worker's claim tell a consistent story?

Delivery Platform Activity — Was the worker actively logged into Amazon Flex or Flipkart within two hours before the disruption event? A worker genuinely stranded in a flood had been working. A fraudster sitting at home has no active platform session to show. This is the highest-weight signal in the BCS.

Route Coherence — Does the GPS movement pattern from the 30 minutes before disruption resemble a real delivery route? Genuine delivery movement shows multiple waypoint stops and realistic two-wheel speeds of 20 to 40 km/h. Spoofed GPS typically shows either a stationary device or physically impossible location jumps.

Network Triangulation — Does cell tower and Wi-Fi network location data corroborate the GPS coordinates? A worker whose GPS claims a flood-hit delivery zone but whose device is connected to their home Wi-Fi router fails this check immediately.

Historical Zone Presence — Has this worker historically operated in this specific zone, on this day of the week, at this time? GigShield maintains four weeks of zone presence history per worker. A worker who has never once delivered in Zone X but suddenly appears there during a Red Alert is a statistical outlier requiring explanation.

Device Integrity — Is a GPS mock application or Android developer mode detected on the device at the time of the claim? This is treated as a soft flag on its own but compounds significantly when combined with other signals.

Platform Delivery Halt Confirmation — Did the delivery platform actually issue a halt for the claimed zone? If Amazon Flex has not suspended operations in that zone, there is no platform-level income loss to compensate regardless of weather conditions.

Accelerometer and Motion Consistency — Does device motion data from the 30 minutes before the disruption indicate the worker was on a moving vehicle rather than stationary? A genuine last-mile delivery partner is physically moving between drop points right up until the moment they cannot continue.

The final BCS is a weighted combination of these seven signals. A score above 60 with no ring-level signals triggers auto-approval. A score below 35 or two or more ring signals escalates the claim.

Detecting Coordinated Fraud Rings

Organised fraud at scale leaves statistical fingerprints that individual actors cannot hide.

Zone-Level Claim Spike Detection — If claims from a single 2 km² delivery zone spike more than 300 percent above the four-week rolling average for that zone at that time of day, the system raises a Zone Anomaly Alert. A real rainstorm distributes stranded workers across a wide geographic area. A fraud ring clusters unnaturally in one zone.

Claim Timing Synchronicity — In a genuine disruption, claims arrive as a gradual wave over two to four hours. Organised fraud tends to produce a cluster of submissions within a tight 10 to 15 minute window. GigShield measures the standard deviation of claim submission timestamps per zone per event. An abnormally low deviation is a strong ring signal.

Social Graph Clustering — Workers who registered within 48 hours of each other, share a referral code, or whose UPI IDs resolve to the same bank branch are assigned a Correlated Registration Flag. When multiple flagged accounts claim simultaneously during the same event, the composite fraud score for the group compounds substantially.

Device Fingerprint Deduplication — Multiple distinct accounts submitting claims from the same physical device is a hard fraud flag. Device fingerprints are hashed at registration and cross-referenced at every claim submission.

GPS Impossibility Detection — Spoofed traces frequently contain physically impossible movement sequences: Zone A at 9:00 AM, Zone B twelve kilometres away at 9:03 AM, back in Zone A at 9:08 AM. The location validator checks every GPS trace against road network speed constraints and flags sequences that cannot physically occur on two wheels.

Handling Flagged Claims Without Penalising Honest Workers

A genuine delivery worker in a real flood may have GPS drift caused by a budget phone, poor network connectivity, or a dropped platform session because the app crashed in the rain. These are realities of working on low-end hardware in adverse conditions. The fraud system must never penalise poverty, poor connectivity, or cheap devices.

Tier 1 — Auto-Approved: Applies when BCS is 60 or above and no ring signals are detected. The claim is approved instantly, the payout is queued, and the worker receives an SMS confirmation. Zero friction, zero delay.

Tier 2 — Soft Hold: Applies when BCS is between 35 and 59 or when one anomaly signal is present. The claim is not rejected. A two-hour automated review window opens during which the system attempts to resolve the flag using additional signals including carrier network data and updated platform session information. If resolved positively, the claim auto-approves. If still ambiguous, the worker receives a single one-tap confirmation prompt in the app. No documents, no phone calls, no forms. Workers cleared through Tier 2 face no mark on their record and no premium penalty.

Tier 3 — Human Review: Applies when BCS is below 35, two or more ring signals are present, or device-level fraud indicators are detected. The claim is suspended and sent to a fraud analyst queue. The worker is notified that their claim is under review and will be resolved within 24 hours. If the analyst finds the claim legitimate, it is approved with no consequence to the worker. Only confirmed fraudulent claims result in policy suspension.

The guiding principle throughout: scrutiny is proportional to risk. Low-risk workers face no friction. Medium-risk workers receive one lightweight automated prompt. Only genuinely high-risk signals reach a human reviewer, and honest workers at every tier are made whole.


# 9. Tech Stack

Frontend

| Component | Technology | Reason |
|---|---|---|
| Framework | Next.js 14 with React | Server-side rendering for fast loads on mobile data, native PWA support |
| Styling | Tailwind CSS | Mobile-first responsive design, rapid UI development |
| State Management | Zustand | Lightweight, no boilerplate, right-sized for this scope |
| Charts and Dashboard | Recharts | React-native charting, clean output for analytics views |

Backend

| Component | Technology | Reason |
|---|---|---|
| API Layer | Node.js with Express | Fast REST API development, large ecosystem |
| ML Microservice | Python with FastAPI | XGBoost and Isolation Forest isolated from the application server |
| Authentication | Firebase Auth | Phone-based OTP login out of the box |
| Real-time Updates | Firebase Firestore | Live claim status pushed to worker without polling |

Data Layer

| Component | Technology | Reason |
|---|---|---|
| Primary Database | Supabase (PostgreSQL) | Relational integrity for financial records: workers, policies, claims, payouts |
| Real-time Notifications | Firebase Firestore | Push notifications for claim status and payout confirmations |

External Integrations

| Service | Provider | Phase 1 Mode |
|---|---|---|
| Weather Data | OpenWeatherMap free tier | Live API |
| IMD Alerts and Flood Data | IMD public API | Mocked JSON server |
| Platform Activity | Simulated internal API | Mocked |
| Civic Disruption Feed | NLP classifier on mock news feed | Mocked |
| Payment Gateway | Razorpay test mode | Sandbox |

Hosting: Vercel for the Next.js frontend. Railway for the Node.js API server and Python ML microservice.


# 10. Development Plan

Phase 1 — Ideation and Foundation (March 4 to 20)

Completed deliverables include full persona research, architecture design, Supabase schema definition covering workers, policies, claims, zones and triggers, and the adversarial defense strategy documented in Section 8. The project repository has been initialised with Next.js and Express scaffolding.

Phase 2 — Automation and Protection (March 21 to April 4)

Planned deliverables include the worker onboarding flow with phone OTP authentication, zone selection and UPI linking, weekly premium calculation UI connected to the AI Risk Scoring Engine, policy creation and management screens, parametric trigger engine wired to mock weather and civic APIs covering at least five trigger types, automated claim initiation pipeline end-to-end, fraud detection rule-based layer and Isolation Forest model integration, claims management dashboard for workers, and the two-minute demo video.

Phase 3 — Scale and Optimise (April 5 to 17)

Planned deliverables include full Behavioral Coherence Score implementation across all seven signal layers, coordinated ring detection signals covering zone spike detection, timing analysis, social graph clustering and device deduplication, Razorpay sandbox integration for simulated UPI payouts, worker dashboard with earnings protected and claims history, admin dashboard with zone-level loss ratios and predictive disruption heatmaps, five-minute platform walkthrough demo video demonstrating a simulated disruption event end-to-end, and the final pitch deck in PDF format.


# 11. Platform Choice

GigShield is a web application with Progressive Web App capabilities rather than a native Android or iOS app.

Delivery workers on budget Android devices frequently have limited storage and are reluctant to install applications from companies they have not heard of. A PWA accessible through a single browser link removes the installation barrier entirely. Once opened, the worker can add it to their home screen, receive push notifications, and access core features on an intermittent data connection — matching the functional experience of a native app without any app store dependency.

A single Next.js codebase also serves both the worker-facing mobile interface and the insurer admin dashboard on desktop, without requiring two separate development tracks. Given a six-week build timeline with a three-person team, this was the only architecture that could realistically deliver a polished product across both surfaces before the final submission.


# What GigShield Does Not Cover

In keeping with the competition constraints and the product's core purpose, the following are explicitly excluded from all coverage tiers:

- Health or medical expenses of any kind
- Accident or injury claims
- Vehicle repair or maintenance costs
- Life insurance
- Income loss from personal reasons such as illness or voluntary absence

GigShield is a single-purpose income protection product. It does one thing and does it well.


# Team JOD

| Name | Role |
|---|---|
| Sumant Yadav | Team Leader |
| Mausumi Ghadei | Member |
| Sameer Mahato | Member |

Guidewire DEVTrails 2026 · University Hackathon

GigShield — protecting the last mile.
