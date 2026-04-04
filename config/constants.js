/**
 * Single source of truth for all GigShield configuration.
 * All pricing, thresholds, zones, and platform data lives here.
 * Frontend fetches this via /api/config — nothing is hardcoded in UI.
 */

const TIERS = {
  basic: {
    key: 'basic',
    name: 'Basic Shield',
    icon: '🌱',
    weeklyPremium: 29,
    maxWeeklyPayout: 1000,
    description: 'New workers, low-risk zones',
    color: '#4a5080',
  },
  standard: {
    key: 'standard',
    name: 'Standard Shield',
    icon: '⚡',
    weeklyPremium: 59,
    maxWeeklyPayout: 2500,
    description: 'Most metro-zone delivery workers',
    color: '#00e5ff',
    popular: true,
  },
  pro: {
    key: 'pro',
    name: 'Pro Shield',
    icon: '🚀',
    weeklyPremium: 99,
    maxWeeklyPayout: 5000,
    description: 'High earners, high-exposure zones',
    color: '#7c3aed',
  },
};

const PLATFORMS = [
  { value: 'amazon_flex',    label: 'Amazon Flex',    icon: '📦', riskScore: 3 },
  { value: 'flipkart_quick', label: 'Flipkart Quick', icon: '🛒', riskScore: 4 },
  { value: 'swiggy',         label: 'Swiggy',         icon: '🍔', riskScore: 2 },
  { value: 'zomato',         label: 'Zomato',         icon: '🍕', riskScore: 2 },
  { value: 'dunzo',          label: 'Dunzo',           icon: '🏃', riskScore: 5 },
];

const CITIES = {
  Bengaluru: {
    zones: ['HSR Layout', 'Koramangala', 'Whitefield', 'Indiranagar', 'Jayanagar', 'Marathahalli', 'BTM Layout'],
    riskProfile: 'high_rainfall',
  },
  Chennai: {
    zones: ['T. Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Tambaram', 'Porur', 'Sholinganallur'],
    riskProfile: 'cyclone_flood',
  },
  Hyderabad: {
    zones: ['Banjara Hills', 'Hitech City', 'Gachibowli', 'Madhapur', 'Kukatpally', 'Secunderabad'],
    riskProfile: 'extreme_heat',
  },
  Mumbai: {
    zones: ['Andheri', 'Bandra', 'Kurla', 'Thane', 'Borivali', 'Dadar', 'Malad'],
    riskProfile: 'monsoon_flood',
  },
  Delhi: {
    zones: ['Connaught Place', 'Lajpat Nagar', 'Dwarka', 'Rohini', 'Noida Sector 18', 'Saket', 'Janakpuri'],
    riskProfile: 'heat_fog',
  },
  Pune: {
    zones: ['Koregaon Park', 'Hinjewadi', 'Kothrud', 'Viman Nagar', 'Hadapsar'],
    riskProfile: 'moderate',
  },
};

const ZONE_RISK_SCORES = {
  'HSR Layout': 18, 'Koramangala': 15, 'Whitefield': 12, 'Indiranagar': 14, 'Jayanagar': 11,
  'T. Nagar': 16, 'Adyar': 14, 'Anna Nagar': 13, 'Velachery': 17, 'Tambaram': 12,
  'Banjara Hills': 10, 'Hitech City': 9, 'Gachibowli': 8, 'Madhapur': 9, 'Kukatpally': 10,
  'Andheri': 11, 'Bandra': 10, 'Kurla': 13, 'Thane': 12, 'Borivali': 9,
  'Connaught Place': 8, 'Lajpat Nagar': 9, 'Dwarka': 7, 'Rohini': 7,
  'Koregaon Park': 8, 'Hinjewadi': 7, 'Kothrud': 8,
  default: 10,
};

const TRIGGER_TYPES = [
  {
    key: 'heavy_rainfall',
    label: 'Heavy Rainfall',
    icon: '🌧️',
    source: 'IMD / OpenWeatherMap',
    threshold: 'Rainfall > 64.5 mm/hr in delivery zone',
    severityMultipliers: { orange: 0.5, red: 1.0, disaster: 3.0 },
  },
  {
    key: 'extreme_heat',
    label: 'Extreme Heat Wave',
    icon: '🌡️',
    source: 'IMD API',
    threshold: 'Temperature > 45°C with official IMD advisory',
    severityMultipliers: { orange: 0.5, red: 1.0, disaster: 2.0 },
  },
  {
    key: 'flood_warning',
    label: 'Flood Warning',
    icon: '🌊',
    source: 'IMD / NDMA',
    threshold: 'Red flood alert issued for worker district',
    severityMultipliers: { orange: 0.5, red: 1.0, disaster: 3.0 },
  },
  {
    key: 'civic_curfew',
    label: 'Civic Curfew / Sec 144',
    icon: '🚧',
    source: 'Municipal API + NLP Feed',
    threshold: 'Official curfew declared in delivery zone',
    severityMultipliers: { orange: 0.5, red: 1.0, disaster: 1.5 },
  },
  {
    key: 'platform_halt',
    label: 'Platform Delivery Halt',
    icon: '📦',
    source: 'Simulated Platform API',
    threshold: 'Platform suspends operations in zone > 3 hours',
    severityMultipliers: { orange: 0.5, red: 1.0, disaster: 1.5 },
  },
];

const FRAUD_REPORT_REASONS = [
  { value: 'worker_not_in_zone',     label: 'Worker was not in the zone' },
  { value: 'gps_spoofing_suspected', label: 'GPS spoofing suspected' },
  { value: 'known_fraudster',        label: 'Known fraudster in community' },
  { value: 'coordinated_group',      label: 'Coordinated group fraud' },
  { value: 'other',                  label: 'Other reason' },
];

const BCS_THRESHOLDS = {
  autoApprove: 60,
  softHold: 35,
  humanReview: 0,
};

const PREMIUM_ADJUSTMENTS = {
  loyaltyWeeks: 4,
  loyaltyDiscount: -6,
  multiPlatformSurcharge: 4,
  partTimeFingerprintDiscount: -3,
  daytimeFingerprintDiscount: -2,
  maxPoolDiscount: 15,
  fraudReportCredit: 15,
};

const PAYOUT_MULTIPLIERS = {
  orange: 0.5,
  red: 1.0,
  disaster: 3.0,
};

const SEASONAL_RISK = {
  monsoon: { months: [6, 7, 8, 9], score: 10, label: 'Monsoon Season' },
  cyclone: { months: [10, 11, 12], score: 7, label: 'Cyclone Season' },
  summer:  { months: [3, 4, 5],   score: 5, label: 'Summer Season' },
  default: { months: [],           score: 2, label: 'Normal Season' },
};

module.exports = {
  TIERS, PLATFORMS, CITIES, ZONE_RISK_SCORES,
  TRIGGER_TYPES, FRAUD_REPORT_REASONS,
  BCS_THRESHOLDS, PREMIUM_ADJUSTMENTS,
  PAYOUT_MULTIPLIERS, SEASONAL_RISK,
};
