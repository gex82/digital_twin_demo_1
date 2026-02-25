import { create } from 'zustand';

type GlobalSegmentFilter = 'All' | 'Dental' | 'AnimalHealth';

interface UiState {
  sidebarCollapsed: boolean;
  activePage: string;
  globalSegmentFilter: GlobalSegmentFilter;
  notificationsPanelOpen: boolean;
  unreadNotifications: number;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setActivePage: (page: string) => void;
  setGlobalSegmentFilter: (filter: GlobalSegmentFilter) => void;
  setNotificationsPanelOpen: (v: boolean) => void;
  markNotificationsRead: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  activePage: 'dashboard',
  globalSegmentFilter: 'All',
  notificationsPanelOpen: false,
  unreadNotifications: 4,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActivePage: (page) => set({ activePage: page }),
  setGlobalSegmentFilter: (filter) => set({ globalSegmentFilter: filter }),
  setNotificationsPanelOpen: (v) => set({ notificationsPanelOpen: v }),
  markNotificationsRead: () => set({ unreadNotifications: 0 }),
}));
