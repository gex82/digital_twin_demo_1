export const BRAND = {
  name: 'Patterson Network Intelligence',
  tagline: 'Powered by SupplyIQ | Digital Twin Decision Engine',
  shortName: 'PNI',
  aiName: 'Patterson SupplyIQ',
  year: '2026',
} as const;

export const COLORS = {
  navy900: '#0A1628',
  navy800: '#0d1e35',
  surface100: '#1a2840',
  surface200: '#1e2f4a',
  surfaceBorder: '#2e4168',
  blue: '#006EFF',
  blueLight: '#3389FF',
  teal: '#00C2A8',
  tealLight: '#00DFC8',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate400: '#94a3b8',
} as const;

export const SEGMENT_COLORS: Record<string, string> = {
  Dental: '#3389FF',
  AnimalHealth: '#00C2A8',
  Shared: '#9333ea',
  Total: '#006EFF',
};

export const TRANSPORT_MODE_COLORS: Record<string, string> = {
  Parcel: '#006EFF',
  LTL: '#00C2A8',
  TL: '#9333ea',
  SelfFleet: '#f59e0b',
  Rail: '#64748b',
};

export const SCENARIO_TYPE_LABELS: Record<string, string> = {
  FCConsolidation: 'FC Consolidation',
  FCExpansion: 'FC Expansion',
  CarrierShift: 'Carrier Strategy Shift',
  AutomationROI: 'Automation ROI',
  DisruptionResponse: 'Disruption Response',
  InventoryReposition: 'Inventory Repositioning',
  HubSatelliteRedesign: 'Hub-and-Satellite Redesign',
  DemandSurge: 'Demand Surge Response',
};

export const DEMO_CREDENTIALS = {
  email: 'demo@patterson.com',
  password: 'Patterson2024!',
};

export const KPI_BASELINE = {
  networkCostUSD: 847_300_000,
  otifPct: 0.972,
  costToServePerOrder: 14.82,
  fcUtilizationPct: 0.78,
  carbonKgPerOrder: 0.43,
  nextDayCoveragePct: 0.91,
  fillRatePct: 0.991,
  orderAccuracyPct: 0.9987,
  avgTransitDays: 1.28,
  dailyOrders: 187_400,
  activeSKUs: 98_200,
  activeFCs: 13,
} as const;
