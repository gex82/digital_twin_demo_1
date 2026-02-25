import { create } from 'zustand';

export type GlobalSegmentFilter = 'All' | 'Dental' | 'AnimalHealth';
export type RoleLens = 'Executive' | 'Analyst' | 'Mixed';
type ConnectorStatus = 'Healthy' | 'Degraded' | 'Offline';

export interface IntegrationSourceStatus {
  id: string;
  name: string;
  status: ConnectorStatus;
  freshnessLabel: string;
  latencyMs: number;
  lineageTag: string;
}

export interface UiDecisionTrailEntry {
  id: string;
  timestamp: string;
  step: string;
  detail: string;
}

export interface UiStoreSnapshot {
  sidebarCollapsed: boolean;
  activePage: string;
  globalSegmentFilter: GlobalSegmentFilter;
  notificationsPanelOpen: boolean;
  unreadNotifications: number;
  roleLens: RoleLens;
  maskSensitiveCosts: boolean;
  integrationSources: IntegrationSourceStatus[];
  decisionTrail: UiDecisionTrailEntry[];
}

interface UiState {
  sidebarCollapsed: boolean;
  activePage: string;
  globalSegmentFilter: GlobalSegmentFilter;
  notificationsPanelOpen: boolean;
  unreadNotifications: number;
  roleLens: RoleLens;
  maskSensitiveCosts: boolean;
  integrationSources: IntegrationSourceStatus[];
  decisionTrail: UiDecisionTrailEntry[];

  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setActivePage: (page: string) => void;
  setGlobalSegmentFilter: (filter: GlobalSegmentFilter) => void;
  setNotificationsPanelOpen: (v: boolean) => void;
  markNotificationsRead: () => void;
  setRoleLens: (role: RoleLens) => void;
  setMaskSensitiveCosts: (masked: boolean) => void;
  simulateIntegrationRefresh: () => void;
  addDecisionTrail: (step: string, detail: string) => void;
  clearDecisionTrail: () => void;
  resetDemoUiState: () => void;
  getSnapshot: () => UiStoreSnapshot;
  restoreSnapshot: (snapshot: UiStoreSnapshot) => void;
}

const INITIAL_SOURCES: IntegrationSourceStatus[] = [
  { id: 'sap-ewm', name: 'SAP EWM', status: 'Healthy', freshnessLabel: '2m', latencyMs: 180, lineageTag: 'RAW->ODS->DTW' },
  { id: 'sap-erp', name: 'SAP ERP', status: 'Healthy', freshnessLabel: '5m', latencyMs: 220, lineageTag: 'RAW->ODS->FIN' },
  { id: 'carrier-ups', name: 'UPS API', status: 'Healthy', freshnessLabel: 'live', latencyMs: 95, lineageTag: 'API->TMS' },
  { id: 'carrier-fedex', name: 'FedEx API', status: 'Healthy', freshnessLabel: 'live', latencyMs: 108, lineageTag: 'API->TMS' },
  { id: 'forecast', name: 'Demand Forecast', status: 'Degraded', freshnessLabel: '58m', latencyMs: 460, lineageTag: 'ML->ODS->DTW' },
];

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function refreshedLabel(previous: string): string {
  if (previous === 'live') return 'live';
  return 'just now';
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  activePage: 'dashboard',
  globalSegmentFilter: 'All',
  notificationsPanelOpen: false,
  unreadNotifications: 4,
  roleLens: 'Mixed',
  maskSensitiveCosts: false,
  integrationSources: deepClone(INITIAL_SOURCES),
  decisionTrail: [],

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setActivePage: (page) => set({ activePage: page }),

  setGlobalSegmentFilter: (filter) => set({ globalSegmentFilter: filter }),

  setNotificationsPanelOpen: (v) => set({ notificationsPanelOpen: v }),

  markNotificationsRead: () => set({ unreadNotifications: 0 }),

  setRoleLens: (role) => set({ roleLens: role }),

  setMaskSensitiveCosts: (masked) => set({ maskSensitiveCosts: masked }),

  simulateIntegrationRefresh: () => {
    set((state) => ({
      integrationSources: state.integrationSources.map((source, index) => ({
        ...source,
        freshnessLabel: refreshedLabel(source.freshnessLabel),
        latencyMs:
          source.status === 'Offline'
            ? source.latencyMs
            : Math.max(80, source.latencyMs + (index % 2 === 0 ? -12 : 17)),
        status: source.status === 'Degraded' && index === 0 ? 'Healthy' : source.status,
      })),
    }));
  },

  addDecisionTrail: (step, detail) => {
    set((state) => ({
      decisionTrail: [
        ...state.decisionTrail,
        {
          id: `${Date.now()}-${state.decisionTrail.length + 1}`,
          timestamp: new Date().toISOString(),
          step,
          detail,
        },
      ],
    }));
  },

  clearDecisionTrail: () => set({ decisionTrail: [] }),

  resetDemoUiState: () => {
    set({
      sidebarCollapsed: false,
      activePage: 'dashboard',
      globalSegmentFilter: 'All',
      notificationsPanelOpen: false,
      unreadNotifications: 4,
      roleLens: 'Mixed',
      maskSensitiveCosts: false,
      integrationSources: deepClone(INITIAL_SOURCES),
      decisionTrail: [],
    });
  },

  getSnapshot: () => {
    const state = get();
    return {
      sidebarCollapsed: state.sidebarCollapsed,
      activePage: state.activePage,
      globalSegmentFilter: state.globalSegmentFilter,
      notificationsPanelOpen: state.notificationsPanelOpen,
      unreadNotifications: state.unreadNotifications,
      roleLens: state.roleLens,
      maskSensitiveCosts: state.maskSensitiveCosts,
      integrationSources: deepClone(state.integrationSources),
      decisionTrail: deepClone(state.decisionTrail),
    };
  },

  restoreSnapshot: (snapshot) => {
    set({
      sidebarCollapsed: snapshot.sidebarCollapsed,
      activePage: snapshot.activePage,
      globalSegmentFilter: snapshot.globalSegmentFilter,
      notificationsPanelOpen: snapshot.notificationsPanelOpen,
      unreadNotifications: snapshot.unreadNotifications,
      roleLens: snapshot.roleLens,
      maskSensitiveCosts: snapshot.maskSensitiveCosts,
      integrationSources: deepClone(snapshot.integrationSources),
      decisionTrail: deepClone(snapshot.decisionTrail),
    });
  },
}));
