import type { ScenarioResult, ScenarioParameter } from '../types';

const BASELINE: ScenarioResult = {
  networkCostUSD: 847_300_000,
  costToServePerOrder: 14.82,
  otifPct: 0.972,
  fcUtilizationPct: 0.78,
  carbonKgPerOrder: 0.43,
  nextDayCoveragePct: 0.91,
  totalTransitDaysAvg: 1.28,
  affectedFacilities: [],
  affectedLanes: [],
  riskLevel: 'Low',
  executiveSummary: '',
};

function jitter(value: number, pct: number): number {
  return value * (1 + (Math.random() * 2 - 1) * pct);
}

export function computeScenarioResult(
  type: string,
  parameters: ScenarioParameter[]
): ScenarioResult {
  const getParam = (key: string, defaultVal: number | boolean | string) => {
    const p = parameters.find(p => p.key === key);
    return p ? p.value : defaultVal;
  };

  switch (type) {
    case 'FCConsolidation': {
      const demandChange = (getParam('demandChange', 0) as number) / 100;
      return {
        ...BASELINE,
        networkCostUSD: jitter(842_600_000, 0.02),
        costToServePerOrder: jitter(14.74, 0.02),
        otifPct: jitter(0.963, 0.01),
        fcUtilizationPct: jitter(0.83, 0.02),
        carbonKgPerOrder: jitter(0.41, 0.03),
        nextDayCoveragePct: jitter(0.89, 0.01),
        totalTransitDaysAvg: jitter(1.34, 0.03),
        paybackMonths: 14,
        npv3yrUSD: jitter(12_400_000, 0.05),
        annualSavingsUSD: jitter(4_700_000, 0.05) * (1 + demandChange * 0.2),
        affectedFacilities: ['FC-COL-002', 'FC-ELG-001', 'FC-HBG-003'],
        affectedLanes: [],
        riskLevel: 'Medium',
        executiveSummary: 'Consolidation saves $7.8M fixed cost, offset by $3.1M cross-shipping. Net: $4.7M annually. OTIF risk: -0.9pp at Elgin 88% utilization.',
      };
    }
    case 'CarrierShift': {
      const rateReduction = (getParam('rateReduction', 3.2) as number) / 100;
      return {
        ...BASELINE,
        networkCostUSD: jitter(839_100_000, 0.02),
        costToServePerOrder: jitter(14.68, 0.02),
        otifPct: jitter(0.975, 0.005),
        fcUtilizationPct: BASELINE.fcUtilizationPct,
        carbonKgPerOrder: BASELINE.carbonKgPerOrder,
        nextDayCoveragePct: BASELINE.nextDayCoveragePct,
        totalTransitDaysAvg: jitter(1.27, 0.02),
        paybackMonths: 3,
        npv3yrUSD: jitter(24_600_000, 0.04),
        annualSavingsUSD: jitter(8_200_000 * (rateReduction / 0.032), 0.04),
        affectedFacilities: ['FC-GSO-004', 'FC-BSM-005'],
        affectedLanes: [],
        riskLevel: 'Low',
        executiveSummary: `Carrier shift saves $${(8_200_000 * rateReduction / 0.032 / 1_000_000).toFixed(1)}M annually with 3-month payback. OTIF improves +0.3pp.`,
      };
    }
    case 'AutomationROI': {
      const laborRed = (getParam('laborReduction', 32) as number) / 100;
      return {
        ...BASELINE,
        networkCostUSD: jitter(841_400_000, 0.02),
        costToServePerOrder: jitter(14.71, 0.02),
        otifPct: jitter(0.978, 0.005),
        fcUtilizationPct: jitter(0.76, 0.02),
        carbonKgPerOrder: jitter(0.41, 0.02),
        nextDayCoveragePct: jitter(0.92, 0.01),
        totalTransitDaysAvg: jitter(1.25, 0.02),
        paybackMonths: Math.round(jitter(22, 0.1)),
        npv3yrUSD: jitter(7_800_000, 0.05),
        annualSavingsUSD: jitter(5_900_000 * (laborRed / 0.32), 0.05),
        affectedFacilities: ['FC-ELG-001'],
        affectedLanes: [],
        riskLevel: 'Low',
        executiveSummary: `GTP automation saves $${(5_900_000 * laborRed / 0.32 / 1_000_000).toFixed(1)}M/yr. OTIF improves +0.6pp. Payback: ~22 months.`,
      };
    }
    case 'DisruptionResponse': {
      const duration = getParam('disruptionDays', 7) as number;
      return {
        ...BASELINE,
        networkCostUSD: jitter(865_200_000, 0.02),
        costToServePerOrder: jitter(15.14, 0.02),
        otifPct: jitter(0.941, 0.01),
        fcUtilizationPct: jitter(0.89, 0.02),
        carbonKgPerOrder: jitter(0.52, 0.03),
        nextDayCoveragePct: jitter(0.82, 0.02),
        totalTransitDaysAvg: jitter(1.68, 0.05),
        annualSavingsUSD: jitter(-17_900_000 * (duration / 7), 0.1),
        affectedFacilities: ['FC-ELG-001', 'FC-COL-002', 'FC-MSP-008', 'FC-OKC-007'],
        affectedLanes: [],
        riskLevel: 'High',
        executiveSummary: `${duration}-day disruption impacts 4 Midwest FCs. OTIF drops -3.1pp. Dallas FC absorbs critical overflow. Incremental cost: +$2.1M/week.`,
      };
    }
    case 'InventoryReposition': {
      const reduction = (getParam('ssReduction', 18) as number) / 100;
      return {
        ...BASELINE,
        networkCostUSD: jitter(843_900_000, 0.02),
        costToServePerOrder: jitter(14.76, 0.02),
        otifPct: jitter(0.971, 0.005),
        fcUtilizationPct: jitter(0.77, 0.01),
        carbonKgPerOrder: BASELINE.carbonKgPerOrder,
        nextDayCoveragePct: BASELINE.nextDayCoveragePct,
        totalTransitDaysAvg: BASELINE.totalTransitDaysAvg,
        paybackMonths: 4,
        annualSavingsUSD: jitter(3_400_000 * (reduction / 0.18), 0.05),
        affectedFacilities: ['FC-ELG-001', 'FC-COL-002', 'FC-HBG-003'],
        affectedLanes: [],
        riskLevel: 'Low',
        executiveSummary: `${(reduction * 100).toFixed(0)}% safety stock reduction frees $${(3_400_000 * reduction / 0.18 / 1_000_000).toFixed(1)}M/yr in carrying cost.`,
      };
    }
    default:
      return { ...BASELINE, executiveSummary: 'Scenario results computed.' };
  }
}
