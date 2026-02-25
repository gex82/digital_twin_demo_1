import { create } from 'zustand';
import { DEMO_STAGES } from '../data/demoStages';
import type {
  DemoAction,
  DemoActionHandler,
  DemoBubblePosition,
  DemoDirection,
  DemoRunState,
  DemoStage,
  DemoStageId,
  DemoStoreSnapshot,
} from '../types/demo';
import { useScenarioStore, type ScenarioStoreSnapshot } from './scenarioStore';
import { useAiStore, type AiStoreSnapshot } from './aiStore';
import { useUiStore, type UiStoreSnapshot } from './uiStore';

const BUBBLE_POSITION_KEY = 'patterson-demo-bubble-position';
const BUBBLE_PINNED_KEY = 'patterson-demo-bubble-pinned';
const DEFAULT_POSITION: DemoBubblePosition = { x: 36, y: 110 };

function loadBubblePosition(): DemoBubblePosition {
  if (typeof window === 'undefined') return DEFAULT_POSITION;
  try {
    const raw = window.localStorage.getItem(BUBBLE_POSITION_KEY);
    if (!raw) return DEFAULT_POSITION;
    const parsed = JSON.parse(raw) as DemoBubblePosition;
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return DEFAULT_POSITION;
    return parsed;
  } catch {
    return DEFAULT_POSITION;
  }
}

function loadBubblePinned(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(BUBBLE_PINNED_KEY) === '1';
}

function saveBubble(position: DemoBubblePosition, pinned: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BUBBLE_POSITION_KEY, JSON.stringify(position));
  window.localStorage.setItem(BUBBLE_PINNED_KEY, pinned ? '1' : '0');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number | undefined, actionType: string): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${actionType} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function collectHandlers(
  sources: Record<string, Record<string, DemoActionHandler>>
): Record<string, DemoActionHandler> {
  return Object.values(sources).reduce<Record<string, DemoActionHandler>>(
    (acc, sourceHandlers) => ({ ...acc, ...sourceHandlers }),
    {}
  );
}

interface DemoSnapshots {
  scenario: ScenarioStoreSnapshot;
  ai: AiStoreSnapshot;
  ui: UiStoreSnapshot;
}

interface DemoState {
  stages: DemoStage[];
  isActive: boolean;
  runState: DemoRunState;
  currentStageIndex: number;
  pendingDirection: DemoDirection;
  actionRunToken: number;
  isActionRunning: boolean;
  actionError: string | null;
  statusNote: string;

  bubblePosition: DemoBubblePosition;
  bubblePinnedByUser: boolean;

  pageReady: Record<string, boolean>;
  actionHandlersBySource: Record<string, Record<string, DemoActionHandler>>;
  baselineSnapshots: DemoSnapshots | null;

  startDemo: () => void;
  resumeDemo: () => void;
  restartDemo: () => void;
  exitDemo: (reset?: boolean) => void;

  nextStage: () => Promise<void>;
  prevStage: () => Promise<void>;
  goToStage: (stageId: DemoStageId) => void;

  setBubblePosition: (position: DemoBubblePosition, pinned?: boolean) => void;
  resetBubblePosition: () => void;

  registerPageReady: (route: string, ready: boolean) => void;
  registerActionHandlers: (source: string, handlers: Record<string, DemoActionHandler>) => void;
  unregisterActionHandlers: (source: string) => void;

  runStageActions: (stageId: DemoStageId, direction: DemoDirection) => Promise<void>;
  retryStageActions: () => void;

  setStatusNote: (note: string) => void;
  clearStatusNote: () => void;

  getCurrentStage: () => DemoStage;
  getSnapshot: () => DemoStoreSnapshot;
}

async function executeActionList(
  actions: DemoAction[],
  handlers: Record<string, DemoActionHandler>
): Promise<void> {
  for (const action of actions) {
    const handler = handlers[action.type] ?? getBuiltInActionHandler(action.type);
    if (!handler) {
      throw new Error(`No action handler registered for ${action.type}`);
    }
    await withTimeout(Promise.resolve(handler(action)), action.timeoutMs, action.type);
  }
}

export const useDemoStore = create<DemoState>((set, get) => ({
  stages: DEMO_STAGES,
  isActive: false,
  runState: 'idle',
  currentStageIndex: 0,
  pendingDirection: 'forward',
  actionRunToken: 0,
  isActionRunning: false,
  actionError: null,
  statusNote: '',

  bubblePosition: loadBubblePosition(),
  bubblePinnedByUser: loadBubblePinned(),

  pageReady: {},
  actionHandlersBySource: {},
  baselineSnapshots: null,

  startDemo: () => {
    const scenarioSnapshot = useScenarioStore.getState().getSnapshot();
    const aiSnapshot = useAiStore.getState().getSnapshot();
    const uiSnapshot = useUiStore.getState().getSnapshot();

    useScenarioStore.getState().resetScenariosToSeed();
    useAiStore.getState().resetDemoState();
    useUiStore.getState().resetDemoUiState();
    useUiStore.getState().addDecisionTrail('S01', 'Demo started and environment initialized.');

    set((state) => ({
      isActive: true,
      runState: 'running',
      currentStageIndex: 0,
      pendingDirection: 'forward',
      actionRunToken: state.actionRunToken + 1,
      isActionRunning: false,
      actionError: null,
      statusNote: '',
      baselineSnapshots: {
        scenario: scenarioSnapshot,
        ai: aiSnapshot,
        ui: uiSnapshot,
      },
    }));
  },

  resumeDemo: () => {
    set((state) => ({
      isActive: true,
      runState: state.runState === 'completed' ? 'completed' : 'running',
      actionError: null,
    }));
  },

  restartDemo: () => {
    useScenarioStore.getState().resetScenariosToSeed();
    useAiStore.getState().resetDemoState();
    useUiStore.getState().resetDemoUiState();
    useUiStore.getState().addDecisionTrail('S01', 'Demo restarted from clean state.');

    set((state) => ({
      isActive: true,
      runState: 'running',
      currentStageIndex: 0,
      pendingDirection: 'forward',
      actionRunToken: state.actionRunToken + 1,
      isActionRunning: false,
      actionError: null,
      statusNote: '',
    }));
  },

  exitDemo: (reset = true) => {
    if (reset) {
      const baseline = get().baselineSnapshots;
      if (baseline) {
        useScenarioStore.getState().restoreSnapshot(baseline.scenario);
        useAiStore.getState().restoreSnapshot(baseline.ai);
        useUiStore.getState().restoreSnapshot(baseline.ui);
      }
    }

    set((state) => ({
      isActive: false,
      runState: reset ? 'idle' : 'paused',
      currentStageIndex: reset ? 0 : state.currentStageIndex,
      pendingDirection: 'forward',
      isActionRunning: false,
      actionError: null,
      statusNote: '',
    }));
  },

  nextStage: async () => {
    const state = get();
    if (!state.isActive || state.isActionRunning) return;

    const current = state.stages[state.currentStageIndex];
    if (!current) return;

    try {
      const handlers = collectHandlers(get().actionHandlersBySource);
      await executeActionList(current.nextActions ?? [], handlers);
    } catch (error) {
      set({
        runState: 'error',
        actionError: error instanceof Error ? error.message : 'Next transition failed',
      });
      return;
    }

    if (state.currentStageIndex >= state.stages.length - 1) {
      set({ runState: 'completed', statusNote: 'Demo completed.' });
      return;
    }

    const nextIndex = state.currentStageIndex + 1;
    const nextStage = state.stages[nextIndex];
    if (nextStage) {
      useUiStore.getState().addDecisionTrail(nextStage.id, `Advanced to ${nextStage.title}.`);
    }

    set((prev) => ({
      currentStageIndex: Math.min(prev.currentStageIndex + 1, prev.stages.length - 1),
      pendingDirection: 'forward',
      actionRunToken: prev.actionRunToken + 1,
      actionError: null,
      runState: 'running',
      statusNote: '',
    }));
  },

  prevStage: async () => {
    const state = get();
    if (!state.isActive || state.isActionRunning) return;
    if (state.currentStageIndex <= 0) return;

    const previousStage = state.stages[state.currentStageIndex - 1];
    if (previousStage) {
      useUiStore.getState().addDecisionTrail(previousStage.id, `Moved back to ${previousStage.title}.`);
    }

    set((prev) => ({
      currentStageIndex: Math.max(prev.currentStageIndex - 1, 0),
      pendingDirection: 'back',
      actionRunToken: prev.actionRunToken + 1,
      actionError: null,
      runState: 'running',
      statusNote: '',
    }));
  },

  goToStage: (stageId) => {
    const index = get().stages.findIndex((stage) => stage.id === stageId);
    if (index < 0) return;
    set((state) => ({
      currentStageIndex: index,
      pendingDirection: 'jump',
      actionRunToken: state.actionRunToken + 1,
      actionError: null,
      runState: 'running',
      statusNote: '',
    }));
  },

  setBubblePosition: (position, pinned = true) => {
    saveBubble(position, pinned);
    set({ bubblePosition: position, bubblePinnedByUser: pinned });
  },

  resetBubblePosition: () => {
    saveBubble(DEFAULT_POSITION, false);
    set({ bubblePosition: DEFAULT_POSITION, bubblePinnedByUser: false });
  },

  registerPageReady: (route, ready) => {
    set((state) => ({
      pageReady: {
        ...state.pageReady,
        [route]: ready,
      },
    }));
  },

  registerActionHandlers: (source, handlers) => {
    set((state) => ({
      actionHandlersBySource: {
        ...state.actionHandlersBySource,
        [source]: handlers,
      },
    }));
  },

  unregisterActionHandlers: (source) => {
    set((state) => {
      const next = { ...state.actionHandlersBySource };
      delete next[source];
      return { actionHandlersBySource: next };
    });
  },

  runStageActions: async (stageId, direction) => {
    const stage = get().stages.find((item) => item.id === stageId);
    if (!stage) return;

    const handlers = collectHandlers(get().actionHandlersBySource);
    const fallbackActions = stage.enterActions ?? [];
    const actions = direction === 'back' ? stage.backActions ?? fallbackActions : fallbackActions;

    set({
      isActionRunning: true,
      actionError: null,
      runState: 'running',
    });

    try {
      await executeActionList(actions, handlers);
      set((state) => ({
        isActionRunning: false,
        runState:
          state.currentStageIndex >= state.stages.length - 1 && state.pendingDirection !== 'back'
            ? 'completed'
            : 'running',
        actionError: null,
      }));
    } catch (error) {
      set({
        isActionRunning: false,
        runState: 'error',
        actionError: error instanceof Error ? error.message : 'Demo stage action failed',
      });
    }
  },

  retryStageActions: () => {
    set((state) => ({
      runState: 'running',
      actionError: null,
      actionRunToken: state.actionRunToken + 1,
      statusNote: '',
    }));
  },

  setStatusNote: (note) => set({ statusNote: note }),
  clearStatusNote: () => set({ statusNote: '' }),

  getCurrentStage: () => {
    const state = get();
    return state.stages[state.currentStageIndex] ?? state.stages[0];
  },

  getSnapshot: () => {
    const state = get();
    return {
      stageIndex: state.currentStageIndex,
      isActive: state.isActive,
      runState: state.runState,
    };
  },
}));

function getBuiltInActionHandler(actionType: string): DemoActionHandler | null {
  switch (actionType) {
    case 'DEMO_BOOTSTRAP':
      return async () => {
        useUiStore.getState().setGlobalSegmentFilter('All');
        useUiStore.getState().setRoleLens('Mixed');
        useUiStore.getState().setMaskSensitiveCosts(false);
      };
    case 'UI_SET_FILTER_ALL':
      return () => {
        useUiStore.getState().setGlobalSegmentFilter('All');
      };
    case 'UI_SET_ROLE_MIXED':
      return () => {
        useUiStore.getState().setRoleLens('Mixed');
      };
    case 'UI_SIMULATE_INTEGRATION_REFRESH':
      return () => {
        useUiStore.getState().simulateIntegrationRefresh();
      };
    case 'UI_ENABLE_MASKING':
      return () => {
        useUiStore.getState().setMaskSensitiveCosts(true);
      };
    case 'UI_DISABLE_MASKING':
      return () => {
        useUiStore.getState().setMaskSensitiveCosts(false);
      };
    default:
      return null;
  }
}
