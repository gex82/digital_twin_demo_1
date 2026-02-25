import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Network, FlaskConical, Brain,
  DollarSign, Target, FileText, ChevronLeft, ChevronRight,
  Activity, Settings, HelpCircle, ClipboardCheck
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { BRAND } from '../../utils/constants';

const NAV_ITEMS = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { path: '/app/network', icon: Network, label: 'Network Builder', badge: null },
  { path: '/app/scenarios', icon: FlaskConical, label: 'Scenario Simulator', badge: '8' },
  { path: '/app/ai', icon: Brain, label: 'SupplyIQ Engine', badge: 'AI' },
  { path: '/app/cost-to-serve', icon: DollarSign, label: 'Cost-to-Serve', badge: null },
  { path: '/app/service-level', icon: Target, label: 'Service Level & OTIF', badge: null },
  { path: '/app/reports', icon: FileText, label: 'Reports', badge: null },
  { path: '/app/decision-cockpit', icon: ClipboardCheck, label: 'Decision Cockpit', badge: null },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const location = useLocation();

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
                    {badge && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: badge === 'AI' ? 'linear-gradient(135deg, #006EFF, #00C2A8)' : '#1a2840',
                        color: badge === 'AI' ? 'white' : '#94a3b8',
                        border: badge === 'AI' ? 'none' : '1px solid #2e4168',
                        padding: '1px 6px',
                        borderRadius: 10,
                      }}>
                        {badge}
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
        {[
          { icon: Activity, label: 'System Status' },
          { icon: Settings, label: 'Settings' },
          { icon: HelpCircle, label: 'Help' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: sidebarCollapsed ? '8px 14px' : '8px 16px',
            margin: '2px 8px', borderRadius: 8, cursor: 'pointer',
            color: '#64748b',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a2840'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
          >
            <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{label}</span>}
          </div>
        ))}
      </div>

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
