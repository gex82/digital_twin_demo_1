import { create } from 'zustand';
import type { Scenario } from '../types';
import { PREBUILT_SCENARIOS, BASELINE_SCENARIO } from '../data/scenarios';
import { estimateScenarioResult } from '../domain/scenario/estimateScenarioResult';

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

const SCENARIO_SEED: Scenario[] = [BASELINE_SCENARIO, ...PREBUILT_SCENARIOS];

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
  appendScenarioAuditEntry: (id: string, entry: { user: string; action: string; details: string }) => void;
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

  appendScenarioAuditEntry: (id, entry) => {
    set({
      scenarios: get().scenarios.map((scenario) =>
        scenario.id === id
          ? {
              ...scenario,
              auditLog: [
                ...scenario.auditLog,
                {
                  timestamp: new Date().toISOString(),
                  user: entry.user,
                  action: entry.action,
                  details: entry.details,
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
