import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  name: string;
  email: string;
  role: 'Executive' | 'Analyst' | 'Planner' | 'Viewer';
  title: string;
  initials: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const DEMO_USER: User = {
  name: 'Jessica Mitchell',
  email: 'demo@patterson.com',
  role: 'Executive',
  title: 'VP, Distribution Operations',
  initials: 'JM',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email: string, password: string) => {
        if (email === 'demo@patterson.com' && password === 'Patterson2026!') {
          set({ isAuthenticated: true, user: DEMO_USER });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    { name: 'patterson-auth' }
  )
);
