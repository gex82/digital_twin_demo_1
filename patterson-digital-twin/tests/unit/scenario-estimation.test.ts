import { describe, expect, it } from 'vitest';
import { PREBUILT_SCENARIOS, BASELINE_SCENARIO } from '../../src/data/scenarios';
import { estimateScenarioResult } from '../../src/domain/scenario/estimateScenarioResult';
import type { Scenario, ScenarioParameter, ScenarioType } from '../../src/types';

function buildScenario(type: ScenarioType, overrides: Record<string, number> = {}): Scenario {
  const template = PREBUILT_SCENARIOS.find((scenario) => scenario.type === type);
  if (!template) {
    throw new Error(`No template scenario for ${type}`);
  }

  const parameters: ScenarioParameter[] = template.parameters.map((parameter) => {
    const override = overrides[parameter.key];
    if (override === undefined) return parameter;
    return { ...parameter, value: override };
  });

  return {
    ...template,
    id: `UT-${type}`,
    baseline: BASELINE_SCENARIO.baseline,
    result: undefined,
    parameters,
  };
}

describe('estimateScenarioResult', () => {
  it('is deterministic for identical inputs', () => {
    const scenario = buildScenario('CarrierShift', {
      fedexShiftPct: 40,
      rateReduction: 3.2,
    });
    const first = estimateScenarioResult(scenario);
    const second = estimateScenarioResult(scenario);
    expect(second).toEqual(first);
  });

  it('improves FC expansion cost/order as demand growth increases', () => {
    const lowGrowth = estimateScenarioResult(buildScenario('FCExpansion', { demandGrowth: 4 }));
    const highGrowth = estimateScenarioResult(buildScenario('FCExpansion', { demandGrowth: 12 }));
    expect(highGrowth.costToServePerOrder).toBeLessThan(lowGrowth.costToServePerOrder);
    expect(highGrowth.otifPct).toBeGreaterThanOrEqual(lowGrowth.otifPct);
  });

  it('shows demand surge stress at higher surge percentages', () => {
    const moderate = estimateScenarioResult(buildScenario('DemandSurge', { demandSurgePct: 18 }));
    const severe = estimateScenarioResult(buildScenario('DemandSurge', { demandSurgePct: 45 }));
    expect(severe.costToServePerOrder).toBeGreaterThan(moderate.costToServePerOrder);
    expect(severe.otifPct).toBeLessThan(moderate.otifPct);
  });

  it('accounts for capex in payback and NPV calculations', () => {
    const lowCapex = estimateScenarioResult(buildScenario('AutomationROI', {
      capexUSD: 2.5,
      laborReduction: 35,
    }));
    const highCapex = estimateScenarioResult(buildScenario('AutomationROI', {
      capexUSD: 7.5,
      laborReduction: 35,
    }));
    expect(highCapex.npv3yrUSD).toBeLessThan(lowCapex.npv3yrUSD);
    if ((lowCapex.annualSavingsUSD ?? 0) > 0) {
      expect(lowCapex.paybackMonths).toBeDefined();
    } else {
      expect(lowCapex.paybackMonths).toBeUndefined();
    }
  });
});
