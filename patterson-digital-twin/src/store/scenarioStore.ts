import { create } from 'zustand';
import type { Scenario, ScenarioResult, ScenarioType } from '../types';
import { PREBUILT_SCENARIOS, BASELINE_SCENARIO } from '../data/scenarios';

const SIMULATION_LOG_LINES = [
  'Initializing network model...',
  'Loading 98,200 active SKU profiles...',
  'Resolving 13 fulfillment center configurations...',
  'Loading 164 active lane configurations...',
  'Applying scenario parameter overrides...',
  'Running MILP solver (8,432 variables, 2,847 constraints)...',
  'Evaluating 847 lane cost combinations...',
  'Computing OTIF impact curves by carrier and segment...',
  'Validating service level constraints (next-day ground)...',
  'Generating cost-to-serve breakdown by category...',
  'Computing carbon emissions delta by transport mode...',
  'Running sensitivity analysis (±10% demand)...',
  'Generating executive risk/reward summary...',
  'Simulation complete. Preparing results...',
] as const;

const ANNUAL_ORDERS = 187_400 * 365;
const SCENARIO_SEED: Scenario[] = [BASELINE_SCENARIO, ...PREBUILT_SCENARIOS];

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

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

function estimateScenarioResult(scenario: Scenario): ScenarioResult {
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

export interface ScenarioStoreSnapshot {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  comparisonScenarioIds: string[];
}

interface ScenarioState {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  comparisonScenarioIds: string[];
  isSimulating: boolean;
  simulationProgress: number;
  simulationLog: string[];
  currentLogLine: string;

  setActiveScenario: (id: string | null) => void;
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  runScenario: (id: string, onComplete?: () => void) => void;
  runScenarioAsync: (id: string) => Promise<void>;
  createScenario: (partial: Partial<Scenario>) => string;
  createScenarioFromTemplate: (templateId: string, overrides?: Partial<Scenario>) => string;
  duplicateScenario: (id: string) => string;
  approveScenario: (id: string) => void;
  lockScenario: (id: string) => void;
  resetScenariosToSeed: () => void;
  getSnapshot: () => ScenarioStoreSnapshot;
  restoreSnapshot: (snapshot: ScenarioStoreSnapshot) => void;
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenarios: deepClone(SCENARIO_SEED),
  activeScenarioId: null,
  comparisonScenarioIds: [],
  isSimulating: false,
  simulationProgress: 0,
  simulationLog: [],
  currentLogLine: '',

  setActiveScenario: (id) => set({ activeScenarioId: id }),

  addToComparison: (id) => {
    const { comparisonScenarioIds } = get();
    if (comparisonScenarioIds.length < 2 && !comparisonScenarioIds.includes(id)) {
      set({ comparisonScenarioIds: [...comparisonScenarioIds, id] });
    }
  },

  removeFromComparison: (id) => {
    set({ comparisonScenarioIds: get().comparisonScenarioIds.filter((scenarioId) => scenarioId !== id) });
  },

  clearComparison: () => set({ comparisonScenarioIds: [] }),

  runScenario: (id, onComplete) => {
    void get().runScenarioAsync(id).then(() => onComplete?.());
  },

  runScenarioAsync: async (id) => {
    if (get().isSimulating) return;
    const target = get().scenarios.find((scenario) => scenario.id === id);
    if (!target) return;

    set({
      isSimulating: true,
      simulationProgress: 0,
      simulationLog: [],
      currentLogLine: '',
      scenarios: get().scenarios.map((scenario) =>
        scenario.id === id ? { ...scenario, status: 'Running' } : scenario
      ),
    });

    const startedAt = Date.now();
    for (let i = 0; i < SIMULATION_LOG_LINES.length; i += 1) {
      const line = SIMULATION_LOG_LINES[i];
      set((state) => ({
        simulationLog: [...state.simulationLog, line],
        currentLogLine: line,
        simulationProgress: Math.min(95, Math.round(((i + 1) / SIMULATION_LOG_LINES.length) * 95)),
      }));
      await sleep(220);
    }

    const finishedAt = Date.now();
    const result = estimateScenarioResult(target);
    const completedAudit = {
      timestamp: new Date().toISOString(),
      user: 'Demo User',
      action: 'Simulation Run',
      details: `Completed run in ${finishedAt - startedAt}ms`,
    };

    set({
      isSimulating: false,
      simulationProgress: 100,
      currentLogLine: 'Complete.',
      activeScenarioId: id,
      scenarios: get().scenarios.map((scenario) =>
        scenario.id === id
          ? {
              ...scenario,
              status: 'Complete',
              result,
              runDurationMs: finishedAt - startedAt,
              auditLog: [...scenario.auditLog, completedAudit],
            }
          : scenario
      ),
    });
  },

  createScenario: (partial) => {
    const baselineResult =
      get().scenarios.find((scenario) => scenario.isBaseline)?.result ?? BASELINE_SCENARIO.baseline;
    const id = `SCN-${Date.now().toString(36).toUpperCase()}`;
    const newScenario: Scenario = {
      id,
      name: 'New Scenario',
      type: 'FCConsolidation',
      status: 'Draft',
      createdBy: 'J. Mitchell',
      createdAt: new Date().toISOString(),
      version: 1,
      isLocked: false,
      isBaseline: false,
      description: '',
      assumptionNotes: '',
      timeHorizon: '3yr',
      parameters: [],
      baseline: baselineResult ?? BASELINE_SCENARIO.baseline,
      tags: ['Demo'],
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          user: 'J. Mitchell',
          action: 'Created',
          details: 'New scenario created',
        },
      ],
      ...partial,
    };
    set({ scenarios: [...get().scenarios, newScenario], activeScenarioId: id });
    return id;
  },

  createScenarioFromTemplate: (templateId, overrides = {}) => {
    const template =
      get().scenarios.find((scenario) => scenario.id === templateId) ??
      SCENARIO_SEED.find((scenario) => scenario.id === templateId) ??
      SCENARIO_SEED.find((scenario) => !scenario.isBaseline);

    if (!template) {
      return get().createScenario(overrides);
    }

    const clonedTemplate = deepClone(template);
    const id = `SCN-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const scenario: Scenario = {
      ...clonedTemplate,
      id,
      name: overrides.name ?? `${clonedTemplate.name} (Demo)`,
      status: 'Draft',
      createdAt: now,
      createdBy: overrides.createdBy ?? 'Demo User',
      approvedBy: undefined,
      version: 1,
      isLocked: false,
      isBaseline: false,
      result: undefined,
      runDurationMs: undefined,
      tags: Array.from(new Set([...(clonedTemplate.tags ?? []), 'Demo'])),
      auditLog: [
        {
          timestamp: now,
          user: 'Demo User',
          action: 'Created from Template',
          details: `Seeded from ${clonedTemplate.id}`,
        },
      ],
      ...overrides,
      parameters: overrides.parameters ?? clonedTemplate.parameters,
      baseline: overrides.baseline ?? clonedTemplate.baseline,
    };

    set({ scenarios: [...get().scenarios, scenario], activeScenarioId: id });
    return id;
  },

  duplicateScenario: (id) => {
    const source = get().scenarios.find((scenario) => scenario.id === id);
    if (!source) return '';
    const newId = `SCN-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const copy: Scenario = {
      ...deepClone(source),
      id: newId,
      name: `${source.name} (Copy)`,
      status: 'Draft',
      isLocked: false,
      isBaseline: false,
      version: 1,
      createdAt: now,
      approvedBy: undefined,
      result: undefined,
      runDurationMs: undefined,
      auditLog: [
        {
          timestamp: now,
          user: 'J. Mitchell',
          action: 'Duplicated',
          details: `Copied from ${source.id}`,
        },
      ],
    };
    set({ scenarios: [...get().scenarios, copy], activeScenarioId: newId });
    return newId;
  },

  approveScenario: (id) => {
    set({
      scenarios: get().scenarios.map((scenario) =>
        scenario.id === id
          ? {
              ...scenario,
              status: 'Approved',
              approvedBy: 'K. Barry',
              auditLog: [
                ...scenario.auditLog,
                {
                  timestamp: new Date().toISOString(),
                  user: 'K. Barry',
                  action: 'Approved',
                  details: 'Scenario approved for implementation',
                },
              ],
            }
          : scenario
      ),
    });
  },

  lockScenario: (id) => {
    set({
      scenarios: get().scenarios.map((scenario) =>
        scenario.id === id
          ? {
              ...scenario,
              isLocked: true,
              auditLog: [
                ...scenario.auditLog,
                {
                  timestamp: new Date().toISOString(),
                  user: 'K. Barry',
                  action: 'Locked',
                  details: 'Scenario locked for governance traceability',
                },
              ],
            }
          : scenario
      ),
    });
  },

  resetScenariosToSeed: () => {
    set({
      scenarios: deepClone(SCENARIO_SEED),
      activeScenarioId: null,
      comparisonScenarioIds: [],
      isSimulating: false,
      simulationProgress: 0,
      simulationLog: [],
      currentLogLine: '',
    });
  },

  getSnapshot: () => {
    const state = get();
    return {
      scenarios: deepClone(state.scenarios),
      activeScenarioId: state.activeScenarioId,
      comparisonScenarioIds: [...state.comparisonScenarioIds],
    };
  },

  restoreSnapshot: (snapshot) => {
    set({
      scenarios: deepClone(snapshot.scenarios),
      activeScenarioId: snapshot.activeScenarioId,
      comparisonScenarioIds: [...snapshot.comparisonScenarioIds],
      isSimulating: false,
      simulationProgress: 0,
      simulationLog: [],
      currentLogLine: '',
    });
  },
}));
