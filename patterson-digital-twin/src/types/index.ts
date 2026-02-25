export type FacilityType = 'FC' | 'Hub' | 'Satellite' | 'CrossDock' | 'Corporate';
export type Segment = 'Shared' | 'Dental' | 'AnimalHealth';
export type OwnershipType = 'Owned' | 'Leased' | '3PL';
export type AutomationLevel = 'Manual' | 'Assisted' | 'SemiAuto' | 'Automated';
export type Country = 'US' | 'CA';

export interface Facility {
  id: string;
  name: string;
  shortName: string;
  type: FacilityType;
  segment: Segment;
  ownership: OwnershipType;
  coordinates: [number, number];
  address: string;
  city: string;
  state: string;
  country: Country;
  squareFootage: number;
  storageLocations: number;
  dockDoors: number;
  dailyOrderCapacity: number;
  currentDailyOrders: number;
  utilizationPct: number;
  skuCount: number;
  employeeCount: number;
  annualFixedCostUSD: number;
  laborCostPerHour: number;
  handlingCostPerOrder: number;
  annualLeaseCostUSD: number;
  cutoffTime: string;
  nextDayCoverageRadius: number;
  avgProcessingHours: number;
  hasGTP: boolean;
  hasVoicePicking: boolean;
  hasRFScanning: boolean;
  automationLevel: AutomationLevel;
  otifPct: number;
  fillRatePct: number;
  orderAccuracyPct: number;
  avgTransitDaysFromHere: number;
  isVirtualCandidate?: boolean;
  scenarioCapacityOverride?: number;
  scenarioCostOverride?: number;
}

export type TransportMode = 'Parcel' | 'LTL' | 'TL' | 'SelfFleet' | 'Rail';
export type CarrierTier = 'Primary' | 'Secondary' | 'Backup';

export interface Lane {
  id: string;
  originId: string;
  destinationId: string;
  mode: TransportMode;
  carrier: string;
  carrierTier: CarrierTier;
  dailyShipments: number;
  avgWeightLbs: number;
  annualVolumeOrders: number;
  costPerOrder: number;
  costPerMile: number;
  fuelSurchargeRate: number;
  accessorialAvgPct: number;
  annualFreightCostUSD: number;
  transitDays: number;
  onTimeDeliveryPct: number;
  distanceMiles: number;
  co2PerOrderKg: number;
  maxDailyCapacity: number;
  isActive: boolean;
  isScenarioModified?: boolean;
}

export interface KpiSnapshot {
  id: string;
  label: string;
  value: number;
  unit: 'USD' | 'PCT' | 'DAYS' | 'COUNT' | 'KG_CO2' | 'M_USD';
  displayValue: string;
  trend: 'up' | 'down' | 'flat';
  trendDeltaPct: number;
  trendLabel: string;
  isPositiveTrendGood: boolean;
  sparklineData: number[];
  segment?: 'Dental' | 'AnimalHealth' | 'Total';
  drilldownRoute?: string;
  color?: string;
}

export type ScenarioType =
  | 'FCConsolidation' | 'FCExpansion' | 'CarrierShift' | 'AutomationROI'
  | 'DisruptionResponse' | 'InventoryReposition' | 'HubSatelliteRedesign' | 'DemandSurge';

export type ScenarioStatus = 'Draft' | 'Running' | 'Complete' | 'Approved' | 'Archived';
export type TimeHorizon = '1yr' | '3yr' | '5yr';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface ScenarioParameter {
  key: string;
  label: string;
  value: number | boolean | string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  type: 'slider' | 'toggle' | 'select' | 'text';
}

export interface ScenarioResult {
  networkCostUSD: number;
  costToServePerOrder: number;
  otifPct: number;
  fcUtilizationPct: number;
  carbonKgPerOrder: number;
  nextDayCoveragePct: number;
  totalTransitDaysAvg: number;
  paybackMonths?: number;
  npv3yrUSD?: number;
  annualSavingsUSD?: number;
  affectedFacilities: string[];
  affectedLanes: string[];
  riskLevel: RiskLevel;
  executiveSummary: string;
}

export interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface Scenario {
  id: string;
  name: string;
  type: ScenarioType;
  status: ScenarioStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  version: number;
  isLocked: boolean;
  isBaseline: boolean;
  description: string;
  assumptionNotes: string;
  timeHorizon: TimeHorizon;
  parameters: ScenarioParameter[];
  baseline: ScenarioResult;
  result?: ScenarioResult;
  runDurationMs?: number;
  tags: string[];
  auditLog: AuditLogEntry[];
}

export interface AiRecommendation {
  title: string;
  detail: string;
  impactUSD: number;
  impactOtifPct?: number;
  timeToValue: string;
  complexity: 'Low' | 'Medium' | 'High';
  priority: 1 | 2 | 3;
  scenarioType?: ScenarioType;
  affectedFacilities?: string[];
}

export interface AiInsightScript {
  id: string;
  triggerKeywords: string[];
  promptExamples: string[];
  thinkingSteps: string[];
  response: string;
  recommendations: AiRecommendation[];
  dataSourcesUsed: string[];
  confidenceScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendations?: AiRecommendation[];
  isTyping?: boolean;
  confidenceScore?: number;
  dataSourcesUsed?: string[];
}

export interface CarrierProfile {
  id: string;
  name: string;
  type: TransportMode;
  annualSpendUSD: number;
  shipmentCount: number;
  onTimePct: number;
  claimRatePct: number;
  avgCostPerShipment: number;
  contractExpirationDate: string;
  primaryLanes: string[];
  performanceTrend: 'Improving' | 'Stable' | 'Declining';
}

export interface OtifDataPoint {
  month: string;
  otifPct: number;
  onTimePct: number;
  inFullPct: number;
  lateOrderCount: number;
  shortShipCount: number;
  segment: 'Dental' | 'AnimalHealth' | 'Total';
}

export interface CostBucket {
  category: string;
  subcategory: string;
  annualCostUSD: number;
  costPerOrder: number;
  pctOfTotal: number;
  segment: 'Dental' | 'AnimalHealth' | 'Total';
  trend3moPct: number;
  facilityId?: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface NetworkAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  facilityId?: string;
  timestamp: string;
  isRead: boolean;
}
