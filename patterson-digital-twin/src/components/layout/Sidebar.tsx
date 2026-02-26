import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Network, FlaskConical, Brain,
  DollarSign, Target, FileText, ChevronLeft, ChevronRight,
  Activity, Settings, HelpCircle, ClipboardCheck, X
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { BRAND } from '../../utils/constants';
import { useScenarioStore } from '../../store/scenarioStore';
import { useDemoStore } from '../../store/demoStore';

const NAV_ITEMS = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { path: '/app/network', icon: Network, label: 'Network Builder', badge: null },
  { path: '/app/scenarios', icon: FlaskConical, label: 'Scenario Simulator', badge: null },
  { path: '/app/ai', icon: Brain, label: 'SupplyIQ Engine', badge: 'AI' },
  { path: '/app/cost-to-serve', icon: DollarSign, label: 'Cost-to-Serve', badge: null },
  { path: '/app/service-level', icon: Target, label: 'Service Level & OTIF', badge: null },
  { path: '/app/reports', icon: FileText, label: 'Reports', badge: null },
  { path: '/app/decision-cockpit', icon: ClipboardCheck, label: 'Decision Cockpit', badge: null },
];

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    integrationSources,
    isIntegrationRefreshing,
    simulateIntegrationRefresh,
    commandCenterMode,
    setCommandCenterMode,
    maskSensitiveCosts,
    setMaskSensitiveCosts,
    roleLens,
    setRoleLens,
  } = useUiStore();
  const scenarioCount = useScenarioStore((state) => state.scenarios.length);
  const { isActive: isDemoActive, runState: demoRunState, startDemo, restartDemo } = useDemoStore();
  const location = useLocation();
  const [utilityPanel, setUtilityPanel] = useState<null | 'status' | 'settings' | 'help'>(null);
  const healthyConnectors = useMemo(
    () => integrationSources.filter((source) => source.status === 'Healthy').length,
    [integrationSources]
  );

  const utilityItems: Array<{ id: 'status' | 'settings' | 'help'; icon: typeof Activity; label: string }> = [
    { id: 'status', icon: Activity, label: 'System Status' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'help', icon: HelpCircle, label: 'Help' },
  ];

  return (
    <aside
      style={{
        width: sidebarCollapsed ? 64 : 240,
        minWidth: sidebarCollapsed ? 64 : 240,
        background: '#002846',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #2e4168', display: 'flex', alignItems: 'center', gap: 12, minHeight: 72 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #006EFF, #00C2A8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: 'white',
        }}>
          PN
        </div>
        {!sidebarCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              {BRAND.shortName} Platform
            </div>
            <div style={{ fontSize: 10, color: '#00C2A8', whiteSpace: 'nowrap', marginTop: 2 }}>
              Digital Twin Engine
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ path, icon: Icon, label, badge }) => {
          const isActive = location.pathname.startsWith(path);
          const resolvedBadge = path === '/app/scenarios' ? String(scenarioCount) : badge;
          return (
            <NavLink key={path} to={path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: sidebarCollapsed ? '10px 14px' : '10px 16px',
                margin: '2px 8px',
                borderRadius: 8,
                cursor: 'pointer',
                background: isActive ? 'rgba(208, 100, 20, 0.15)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--patterson-accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#1a2840'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Icon size={18} color={isActive ? '#fdba74' : '#94a3b8'} strokeWidth={isActive ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && (
                  <>
                    <span style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : '#94a3b8',
                      flex: 1,
                      whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                    {resolvedBadge && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: resolvedBadge === 'AI' ? 'linear-gradient(135deg, #006EFF, #00C2A8)' : '#1a2840',
                        color: resolvedBadge === 'AI' ? 'white' : '#94a3b8',
                        border: resolvedBadge === 'AI' ? 'none' : '1px solid #2e4168',
                        padding: '1px 6px',
                        borderRadius: 10,
                      }}>
                        <span data-testid={path === '/app/scenarios' ? 'sidebar-scenarios-badge' : undefined}>
                          {resolvedBadge}
                        </span>
                      </span>
                    )}
                  </>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid #2e4168', padding: '12px 0' }}>
        {utilityItems.map(({ id, icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setUtilityPanel((active) => active === id ? null : id)}
            data-testid={`sidebar-utility-${id}`}
            style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: sidebarCollapsed ? '8px 14px' : '8px 16px',
            margin: '2px 8px', borderRadius: 8, cursor: 'pointer',
            color: '#64748b',
            border: 'none',
            width: `calc(100% - 16px)`,
            background: utilityPanel === id ? '#1a2840' : 'transparent',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a2840'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
          >
            <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{label}</span>}
          </button>
        ))}
      </div>

      {utilityPanel && (
        <div
          data-testid="sidebar-utility-panel"
          style={{
            position: 'absolute',
            left: sidebarCollapsed ? 72 : 8,
            right: sidebarCollapsed ? 'auto' : 8,
            width: sidebarCollapsed ? 236 : undefined,
            bottom: 64,
            background: '#0f1f35',
            border: '1px solid #2e4168',
            borderRadius: 10,
            padding: 10,
            boxShadow: '0 16px 34px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>
              {utilityPanel === 'status' ? 'System Status' : utilityPanel === 'settings' ? 'Settings' : 'Help'}
            </span>
            <button
              onClick={() => setUtilityPanel(null)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
            >
              <X size={13} />
            </button>
          </div>

          {utilityPanel === 'status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>
                Connectors healthy: <strong style={{ color: '#10b981' }}>{healthyConnectors}/{integrationSources.length}</strong>
              </div>
              <button
                onClick={() => simulateIntegrationRefresh()}
                disabled={isIntegrationRefreshing}
                style={{
                  background: '#1a2840',
                  border: '1px solid #2e4168',
                  borderRadius: 8,
                  color: '#93c5fd',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '6px 8px',
                  cursor: isIntegrationRefreshing ? 'not-allowed' : 'pointer',
                  opacity: isIntegrationRefreshing ? 0.6 : 1,
                }}
              >
                {isIntegrationRefreshing ? 'Refreshing...' : 'Refresh Connector Health'}
              </button>
            </div>
          )}

          {utilityPanel === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setCommandCenterMode(!commandCenterMode)}
                style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, color: '#94a3b8', fontSize: 11, padding: '6px 8px', cursor: 'pointer' }}
              >
                Command Center: {commandCenterMode ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => setMaskSensitiveCosts(!maskSensitiveCosts)}
                style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, color: '#94a3b8', fontSize: 11, padding: '6px 8px', cursor: 'pointer' }}
              >
                Sensitive Cost Masking: {maskSensitiveCosts ? 'On' : 'Off'}
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['Executive', 'Mixed', 'Analyst'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleLens(role)}
                    style={{
                      flex: 1,
                      background: roleLens === role ? 'rgba(0,194,168,0.2)' : '#1a2840',
                      border: '1px solid #2e4168',
                      borderRadius: 6,
                      color: roleLens === role ? '#5eead4' : '#94a3b8',
                      fontSize: 10,
                      padding: '5px 4px',
                      cursor: 'pointer',
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {utilityPanel === 'help' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.4 }}>
                Keyboard shortcuts: <strong style={{ color: '#e2e8f0' }}>←/→</strong> stage nav, <strong style={{ color: '#e2e8f0' }}>M</strong> minimize demo bubble.
              </div>
              <button
                onClick={() => {
                  if (isDemoActive && demoRunState !== 'completed') {
                    restartDemo();
                  } else {
                    startDemo();
                  }
                }}
                style={{ background: 'rgba(208,100,20,0.2)', border: '1px solid rgba(208,100,20,0.45)', borderRadius: 8, color: '#fdba74', fontSize: 11, fontWeight: 700, padding: '6px 8px', cursor: 'pointer' }}
              >
                {isDemoActive && demoRunState !== 'completed' ? 'Restart Guided Demo' : 'Start Guided Demo'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          top: '50%',
          right: -12,
          transform: 'translateY(-50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#1a2840',
          border: '1px solid #2e4168',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
        }}
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
