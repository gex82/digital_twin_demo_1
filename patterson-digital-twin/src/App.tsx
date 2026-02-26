import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/dashboard/Dashboard';
import NetworkBuilder from './pages/network/NetworkBuilder';
import ScenarioSimulator from './pages/scenarios/ScenarioSimulator';
import AiInsightEngine from './pages/ai-engine/AiInsightEngine';
import CostToServe from './pages/cost-to-serve/CostToServe';
import ServiceLevel from './pages/service-level/ServiceLevel';
import Reports from './pages/reports/Reports';
import DecisionCockpit from './pages/decision-cockpit/DecisionCockpit';
import { DemoOverlay } from './components/demo/DemoOverlay';
import { ToastStack } from './components/ui/ToastStack';
import { GlobalFootnote } from './components/layout/GlobalFootnote';

function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="network" element={<NetworkBuilder />} />
          <Route path="scenarios" element={<ScenarioSimulator />} />
          <Route path="ai" element={<AiInsightEngine />} />
          <Route path="cost-to-serve" element={<CostToServe />} />
          <Route path="service-level" element={<ServiceLevel />} />
          <Route path="reports" element={<Reports />} />
          <Route path="decision-cockpit" element={<DecisionCockpit />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalFootnote />
      <DemoOverlay />
      <ToastStack />
    </BrowserRouter>
  );
}
