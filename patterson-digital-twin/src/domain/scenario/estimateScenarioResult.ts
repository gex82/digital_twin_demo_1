import type { Scenario, ScenarioResult, ScenarioType } from '../../types';

const ANNUAL_ORDERS = 187_400 * 365;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function numericParam(scenario: Scenario, key: string, fallback: number): number {
  const raw = scenario.parameters.find((p) => p.key === key)?.value;
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function containsType(type: ScenarioType, accepted: ScenarioType[]): boolean {
  return accepted.includes(type);
}

export function estimateScenarioResult(scenario: Scenario): ScenarioResult {
  const baseline = scenario.baseline;
  let costPerOrderDelta = 0;
  let otifDelta = 0;
  let utilizationDelta = 0;
  let carbonDelta = 0;
  let coverageDelta = 0;
  let transitDelta = 0;
  let capexUSD = 0;
  let affectedFacilities: string[] = [];
  let affectedLanes: string[] = [];
  let summary = 'Scenario run complete with balanced cost and service outcomes.';

  if (containsType(scenario.type, ['FCConsolidation'])) {
    const volumeRedirectPct = numericParam(scenario, 'volumeRedirectPct', 62);
    const laborSavingsPct = numericParam(scenario, 'laborSavingsPct', 14);
    costPerOrderDelta = -(0.22 + volumeRedirectPct * 0.0014 + laborSavingsPct * 0.0035);
    otifDelta = -(0.003 + volumeRedirectPct * 0.00003);
    utilizationDelta = 0.04 + volumeRedirectPct * 0.0003;
    carbonDelta = -0.015;
    coverageDelta = -0.012;
    transitDelta = 0.05;
    affectedFacilities = ['FC-COL-002', 'FC-ELG-001', 'FC-HBG-003'];
    affectedLanes = ['LANE-COL-ELG', 'LANE-COL-HBG'];
    summary =
      'Consolidation lowers fixed cost and cost-to-serve, with moderate OTIF pressure at receiving FCs. Sequence with automation for lower execution risk.';
  } else if (containsType(scenario.type, ['FCExpansion'])) {
    const demandGrowth = numericParam(scenario, 'demandGrowth', 8);
    capexUSD = numericParam(scenario, 'capexBudget', 12) * 1_000_000;
    costPerOrderDelta = 0.04 - demandGrowth * 0.004;
    otifDelta = 0.004 + demandGrowth * 0.0001;
    utilizationDelta = -0.018;
    carbonDelta = -0.01;
    coverageDelta = 0.025;
    transitDelta = -0.06;
    affectedFacilities = ['FC-GSO-004'];
    summary =
      'Expansion improves coverage and OTIF by adding regional capacity, with a short-term operating cost increase until demand catches up.';
  } else if (containsType(scenario.type, ['CarrierShift'])) {
    const shiftPct = numericParam(scenario, 'fedexShiftPct', numericParam(scenario, 'shiftVolumePct', 40));
    const rateReduction = numericParam(scenario, 'rateReduction', 3.2);
    costPerOrderDelta = -(0.06 + shiftPct * 0.002 + rateReduction * 0.018);
    otifDelta = 0.001 + shiftPct * 0.00003;
    carbonDelta = -0.003;
    coverageDelta = 0.002;
    transitDelta = -0.01;
    affectedFacilities = ['FC-GSO-004', 'FC-BSM-005'];
    affectedLanes = ['LANE-GSO-ATL', 'LANE-BSM-ATL', 'LANE-GSO-BSM'];
    summary =
      'Carrier reallocation reduces transportation spend quickly while improving reliability on stressed lanes. Operational complexity remains low.';
  } else if (containsType(scenario.type, ['AutomationROI'])) {
    const laborReduction = numericParam(scenario, 'laborReduction', numericParam(scenario, 'laborReductionPct', 30));
    capexUSD = numericParam(scenario, 'capexUSD', numericParam(scenario, 'capexMillions', 4.2)) * 1_000_000;
    costPerOrderDelta = -(0.05 + laborReduction * 0.0048);
    otifDelta = 0.004 + laborReduction * 0.00004;
    utilizationDelta = -0.02;
    carbonDelta = -0.012;
    coverageDelta = 0.007;
    transitDelta = -0.03;
    affectedFacilities = ['FC-ELG-001'];
    summary =
      'Automation improves throughput and labor efficiency, creating both direct savings and optionality for future network redesign decisions.';
  } else if (containsType(scenario.type, ['DisruptionResponse'])) {
    const disruptionDays = numericParam(scenario, 'disruptionDays', numericParam(scenario, 'durationDays', 7));
    const severity = clamp(disruptionDays / 7, 0.5, 2.5);
    costPerOrderDelta = 0.32 * severity;
    otifDelta = -0.024 * severity;
    utilizationDelta = 0.09 * severity;
    carbonDelta = 0.07 * severity;
    coverageDelta = -0.07 * severity;
    transitDelta = 0.26 * severity;
    affectedFacilities = ['FC-ELG-001', 'FC-COL-002', 'FC-MSP-008', 'FC-OKC-007'];
    affectedLanes = ['LANE-ELG-COL', 'LANE-MSP-ELG', 'LANE-OKC-DAL'];
    summary =
      'Disruption scenario quantifies service and cost exposure under severe weather constraints and validates mitigation playbook assumptions.';
  } else if (containsType(scenario.type, ['InventoryReposition'])) {
    const reductionPct = numericParam(scenario, 'ssReduction', numericParam(scenario, 'inventoryReductionPct', 16));
    costPerOrderDelta = -(0.03 + reductionPct * 0.0027);
    otifDelta = -(0.001 + Math.max(0, reductionPct - 18) * 0.00008);
    utilizationDelta = -0.01;
    carbonDelta = -0.001;
    coverageDelta = 0;
    transitDelta = 0;
    affectedFacilities = ['FC-ELG-001', 'FC-COL-002', 'FC-HBG-003'];
    summary =
      'Inventory repositioning reduces carrying cost while preserving service when phased by SKU criticality and forecast confidence.';
  } else if (containsType(scenario.type, ['HubSatelliteRedesign'])) {
    const satellites = numericParam(scenario, 'satelliteCount', 5);
    capexUSD = numericParam(scenario, 'totalCapex', 15) * 1_000_000;
    costPerOrderDelta = -(0.11 + satellites * 0.012);
    otifDelta = 0.001 + satellites * 0.0004;
    utilizationDelta = 0.03;
    carbonDelta = -0.02;
    coverageDelta = 0.018;
    transitDelta = -0.05;
    affectedFacilities = ['FC-BSM-005', 'FC-GRV-012', 'FC-OKC-007'];
    summary =
      'Hub-and-satellite redesign drives structural savings and coverage gains, but requires staged implementation and stronger governance controls.';
  } else if (containsType(scenario.type, ['DemandSurge'])) {
    const surgePct = numericParam(scenario, 'demandSurgePct', 25);
    costPerOrderDelta = 0.05 + surgePct * 0.004;
    otifDelta = -0.002 - surgePct * 0.00024;
    utilizationDelta = 0.02 + surgePct * 0.001;
    carbonDelta = 0.005 + surgePct * 0.0008;
    coverageDelta = -0.008;
    transitDelta = 0.04;
    affectedFacilities = ['FC-PHX-011', 'FC-SAC-010', 'FC-DAL-006'];
    affectedLanes = ['LANE-DAL-PHX', 'LANE-DAL-SAC'];
    summary =
      'Demand surge can be absorbed with managed OTIF degradation if overflow and labor surge plans are activated early.';
  }

  const costToServePerOrder = round2(clamp(baseline.costToServePerOrder + costPerOrderDelta, 12, 20));
  const networkCostUSD = Math.round(costToServePerOrder * ANNUAL_ORDERS);
  const annualSavingsUSD = Math.round(baseline.networkCostUSD - networkCostUSD);
  const otifPct = clamp(baseline.otifPct + otifDelta, 0.9, 0.995);
  const fcUtilizationPct = clamp(baseline.fcUtilizationPct + utilizationDelta, 0.65, 0.95);
  const carbonKgPerOrder = round2(clamp(baseline.carbonKgPerOrder + carbonDelta, 0.25, 0.85));
  const nextDayCoveragePct = clamp(baseline.nextDayCoveragePct + coverageDelta, 0.72, 0.98);
  const totalTransitDaysAvg = round2(clamp(baseline.totalTransitDaysAvg + transitDelta, 0.9, 3.5));

  let riskLevel: ScenarioResult['riskLevel'] = 'Low';
  if (otifPct < baseline.otifPct - 0.01 || fcUtilizationPct > 0.88) riskLevel = 'Medium';
  if (otifPct < baseline.otifPct - 0.02 || fcUtilizationPct > 0.92) riskLevel = 'High';

  const npv3yrUSD = Math.round(annualSavingsUSD * 2.35 - capexUSD * 0.9);
  const paybackMonths =
    capexUSD > 0 && annualSavingsUSD > 0
      ? Math.max(3, Math.round((capexUSD / annualSavingsUSD) * 12))
      : undefined;

  return {
    networkCostUSD,
    costToServePerOrder,
    otifPct,
    fcUtilizationPct,
    carbonKgPerOrder,
    nextDayCoveragePct,
    totalTransitDaysAvg,
    paybackMonths,
    npv3yrUSD,
    annualSavingsUSD,
    affectedFacilities,
    affectedLanes,
    riskLevel,
    executiveSummary: summary,
  };
}
