import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuthStore } from '../../store/authStore';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/app/dashboard': { title: 'Network Operations Intelligence', subtitle: 'Live snapshot — Feb 24, 2026 | 13 FCs · 187,400 daily orders' },
  '/app/network': { title: 'Network Builder', subtitle: 'Interactive fulfillment network design and configuration' },
  '/app/scenarios': { title: 'Scenario Simulator', subtitle: 'What-if analysis · MILP optimization · Side-by-side comparison' },
  '/app/ai': { title: 'Patterson SupplyIQ™', subtitle: 'AI-powered network intelligence and scenario recommendations' },
  '/app/cost-to-serve': { title: 'Cost-to-Serve Analysis', subtitle: 'Lane · customer · order-level cost decomposition' },
  '/app/service-level': { title: 'Service Level & OTIF', subtitle: 'On-Time In-Full performance · delivery windows · coverage analysis' },
  '/app/reports': { title: 'Reports & Scenario Packs', subtitle: 'Exportable scenario summaries and executive briefing packs' },
};

export function AppShell() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const meta = PAGE_META[location.pathname] || { title: 'Patterson Network Intelligence', subtitle: '' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A1628' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={meta.title} subtitle={meta.subtitle} />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
