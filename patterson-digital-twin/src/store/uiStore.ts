import { create } from 'zustand';

export type GlobalSegmentFilter = 'All' | 'Dental' | 'AnimalHealth';
export type RoleLens = 'Executive' | 'Analyst' | 'Mixed';
type ConnectorStatus = 'Healthy' | 'Degraded' | 'Offline';
export type ToastTone = 'info' | 'success' | 'warning' | 'error';
type IncidentSeverity = 'low' | 'medium' | 'high';

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

export interface IntegrationIncident {
  id: string;
  sourceId: string;
  severity: IncidentSeverity;
  title: string;
  detail: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface AppToast {
  id: string;
  title: string;
  message: string;
  tone: ToastTone;
  createdAt: string;
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
  integrationIncidents: IntegrationIncident[];
  integrationRefreshCounter: number;
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
  integrationIncidents: IntegrationIncident[];
  integrationRefreshCounter: number;
  isIntegrationRefreshing: boolean;
  toasts: AppToast[];
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
  acknowledgeIncident: (id: string) => void;
  pushToast: (toast: { title: string; message: string; tone?: ToastTone }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
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

const INITIAL_INCIDENTS: IntegrationIncident[] = [
  {
    id: 'inc-forecast-lag',
    sourceId: 'forecast',
    severity: 'medium',
    title: 'Forecast Connector Lagging',
    detail: 'Demand forecast feed is behind SLA and currently serving cached output.',
    timestamp: '2026-02-25T13:00:00.000Z',
    acknowledged: false,
  },
];

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function refreshedLabel(previous: string): string {
  if (previous === 'live') return 'live';
  return 'just now';
}

function makeToast(input: { title: string; message: string; tone?: ToastTone }): AppToast {
  return {
    id: `toast-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: input.title,
    message: input.message,
    tone: input.tone ?? 'info',
    createdAt: new Date().toISOString(),
  };
}

function pushToastWithLimit(toasts: AppToast[], toast: AppToast): AppToast[] {
  return [...toasts.slice(-4), toast];
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
  integrationIncidents: deepClone(INITIAL_INCIDENTS),
  integrationRefreshCounter: 0,
  isIntegrationRefreshing: false,
  toasts: [],
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
    const now = new Date().toISOString();
    set((state) => ({
      isIntegrationRefreshing: true,
      integrationRefreshCounter: state.integrationRefreshCounter + 1,
    }));

    window.setTimeout(() => {
      set((state) => {
        const counter = state.integrationRefreshCounter;
        const forecastRecovered = counter % 4 !== 0;
        const nextSources: IntegrationSourceStatus[] = state.integrationSources.map((source, index): IntegrationSourceStatus => {
          if (source.id === 'forecast') {
            return {
              ...source,
              status: (forecastRecovered ? 'Healthy' : 'Degraded') as ConnectorStatus,
              freshnessLabel: forecastRecovered ? 'just now' : '42m',
              latencyMs: forecastRecovered ? 210 : 410,
              lineageTag: forecastRecovered ? 'ML->ODS->DTW' : 'ML->ODS->DTW (cached)',
            };
          }

          return {
            ...source,
            freshnessLabel: refreshedLabel(source.freshnessLabel),
            latencyMs:
              source.status === 'Offline'
                ? source.latencyMs
                : Math.max(80, source.latencyMs + (index % 2 === 0 ? -14 : 11)),
            status: source.status === 'Offline' ? 'Degraded' : source.status,
          };
        });

        const unresolvedForecastIncident = state.integrationIncidents.find(
          (incident) => incident.sourceId === 'forecast' && !incident.acknowledged
        );
        const nextIncidents = [...state.integrationIncidents];

        if (!forecastRecovered) {
          if (!unresolvedForecastIncident) {
            nextIncidents.unshift({
              id: `inc-forecast-${Date.now()}`,
              sourceId: 'forecast',
              severity: 'medium',
              title: 'Forecast Feed Delay',
              detail: 'Demand planning feed delayed. Platform is using cached forecast until recovery.',
              timestamp: now,
              acknowledged: false,
            });
          }
        } else if (unresolvedForecastIncident) {
          for (const incident of nextIncidents) {
            if (incident.sourceId === 'forecast') {
              incident.acknowledged = true;
            }
          }
        }

        const healthyConnectors = nextSources.filter((source) => source.status === 'Healthy').length;
        const refreshToast = makeToast({
          title: 'Integration Refresh Complete',
          message: `Ingested latest snapshots. Connector health ${healthyConnectors}/${nextSources.length}.`,
          tone: forecastRecovered ? 'success' : 'warning',
        });

        return {
          integrationSources: nextSources,
          integrationIncidents: nextIncidents.slice(0, 8),
          isIntegrationRefreshing: false,
          toasts: pushToastWithLimit(state.toasts, refreshToast),
        };
      });
    }, 750);
  },

  acknowledgeIncident: (id) => {
    set((state) => ({
      integrationIncidents: state.integrationIncidents.map((incident) =>
        incident.id === id ? { ...incident, acknowledged: true } : incident
      ),
    }));
  },

  pushToast: (input) => {
    const toast = makeToast(input);
    set((state) => ({
      toasts: pushToastWithLimit(state.toasts, toast),
    }));
    return toast.id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),

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
      integrationIncidents: deepClone(INITIAL_INCIDENTS),
      integrationRefreshCounter: 0,
      isIntegrationRefreshing: false,
      toasts: [],
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
      integrationIncidents: deepClone(state.integrationIncidents),
      integrationRefreshCounter: state.integrationRefreshCounter,
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
      integrationIncidents: deepClone(snapshot.integrationIncidents),
      integrationRefreshCounter: snapshot.integrationRefreshCounter,
      isIntegrationRefreshing: false,
      toasts: [],
      decisionTrail: deepClone(snapshot.decisionTrail),
    });
  },
}));
