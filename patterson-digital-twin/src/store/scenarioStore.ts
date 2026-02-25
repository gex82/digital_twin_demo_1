import { create } from 'zustand';
import type { Scenario } from '../types';
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
];

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
  createScenario: (partial: Partial<Scenario>) => string;
  duplicateScenario: (id: string) => string;
  approveScenario: (id: string) => void;
  lockScenario: (id: string) => void;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenarios: [BASELINE_SCENARIO, ...PREBUILT_SCENARIOS],
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
    set({ comparisonScenarioIds: get().comparisonScenarioIds.filter(s => s !== id) });
  },

  clearComparison: () => set({ comparisonScenarioIds: [] }),

  runScenario: (id, onComplete) => {
    set({ isSimulating: true, simulationProgress: 0, simulationLog: [], currentLogLine: '' });

    let lineIndex = 0;
    let progress = 0;

    const logInterval = setInterval(() => {
      if (lineIndex < SIMULATION_LOG_LINES.length) {
        const line = SIMULATION_LOG_LINES[lineIndex];
        set(state => ({
          simulationLog: [...state.simulationLog, line],
          currentLogLine: line,
          simulationProgress: Math.min(progress, 95),
        }));
        lineIndex++;
        progress += (95 / SIMULATION_LOG_LINES.length);
      }
    }, 320);

    setTimeout(() => {
      clearInterval(logInterval);
      set({
        isSimulating: false,
        simulationProgress: 100,
        currentLogLine: 'Complete.',
      });
      // Update scenario status to 'Complete'
      const { scenarios } = get();
      set({
        scenarios: scenarios.map(s =>
          s.id === id ? { ...s, status: 'Complete' as const } : s
        ),
        activeScenarioId: id,
      });
      onComplete?.();
    }, 4800);
  },

  createScenario: (partial) => {
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
      baseline: BASELINE_SCENARIO.baseline,
      tags: [],
      auditLog: [
        { timestamp: new Date().toISOString(), user: 'J. Mitchell', action: 'Created', details: 'New scenario created' },
      ],
      ...partial,
    };
    set({ scenarios: [...get().scenarios, newScenario] });
    return id;
  },

  duplicateScenario: (id) => {
    const source = get().scenarios.find(s => s.id === id);
    if (!source) return '';
    const newId = `SCN-${Date.now().toString(36).toUpperCase()}`;
    const copy: Scenario = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      status: 'Draft',
      isLocked: false,
      version: 1,
      createdAt: new Date().toISOString(),
      approvedBy: undefined,
      auditLog: [
        { timestamp: new Date().toISOString(), user: 'J. Mitchell', action: 'Duplicated', details: `Copied from ${source.id}` },
      ],
    };
    set({ scenarios: [...get().scenarios, copy] });
    return newId;
  },

  approveScenario: (id) => {
    set({
      scenarios: get().scenarios.map(s =>
        s.id === id ? {
          ...s,
          status: 'Approved' as const,
          approvedBy: 'K. Barry',
          auditLog: [...s.auditLog, {
            timestamp: new Date().toISOString(),
            user: 'K. Barry',
            action: 'Approved',
            details: 'Scenario approved for implementation',
          }],
        } : s
      ),
    });
  },

  lockScenario: (id) => {
    set({
      scenarios: get().scenarios.map(s =>
        s.id === id ? { ...s, isLocked: true } : s
      ),
    });
  },
}));
