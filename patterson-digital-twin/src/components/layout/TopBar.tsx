import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { NETWORK_ALERTS } from '../../data/alerts';
import { useDemoStore } from '../../store/demoStore';
import { useShallow } from 'zustand/react/shallow';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useAuthStore();
  const {
    unreadNotifications,
    globalSegmentFilter,
    setGlobalSegmentFilter,
    roleLens,
    setRoleLens,
    maskSensitiveCosts,
    setMaskSensitiveCosts,
    integrationSources,
  } = useUiStore();
  const {
    isActive: isDemoActive,
    runState: demoRunState,
    startDemo,
    resumeDemo,
    restartDemo,
    exitDemo,
  } = useDemoStore(
    useShallow((state) => ({
      isActive: state.isActive,
      runState: state.runState,
      startDemo: state.startDemo,
      resumeDemo: state.resumeDemo,
      restartDemo: state.restartDemo,
      exitDemo: state.exitDemo,
    }))
  );
  const criticalAlerts = NETWORK_ALERTS.filter(a => !a.isRead && a.severity === 'critical').length;
  const healthyConnectors = integrationSources.filter((source) => source.status === 'Healthy').length;

  const demoButtonLabel = !isDemoActive
    ? (demoRunState === 'paused' ? 'Resume Demo' : 'Start Demo')
    : demoRunState === 'completed'
      ? 'Restart Demo'
      : demoRunState === 'paused'
        ? 'Resume Demo'
        : 'Restart Demo';

  function handleDemoButton() {
    if (!isDemoActive) {
      if (demoRunState === 'paused') {
        resumeDemo();
        return;
      }
      startDemo();
      return;
    }
    if (demoRunState === 'paused') {
      resumeDemo();
      return;
    }
    restartDemo();
  }

  return (
    <header style={{
      height: 64,
      background: 'rgba(0, 38, 74, 0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Page title */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-on-primary)', margin: 0, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: '#b6c4d8', margin: 0, marginTop: 2 }}>{subtitle}</p>}
      </div>

      {/* Segment filter */}
      <div style={{ display: 'flex', gap: 4, background: '#1a2840', borderRadius: 8, padding: 3, border: '1px solid #2e4168' }}>
        {(['All', 'Dental', 'AnimalHealth'] as const).map(seg => (
          <button
            key={seg}
            onClick={() => setGlobalSegmentFilter(seg)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              background: globalSegmentFilter === seg ? 'var(--patterson-accent)' : 'transparent',
              color: globalSegmentFilter === seg ? '#fff' : '#94a3b8',
              transition: 'all 0.15s',
            }}
          >
            {seg === 'AnimalHealth' ? 'Animal Health' : seg}
          </button>
        ))}
      </div>

      {/* Role lens */}
      <div style={{ display: 'flex', gap: 4, background: '#1a2840', borderRadius: 8, padding: 3, border: '1px solid #2e4168' }}>
        {(['Executive', 'Mixed', 'Analyst'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setRoleLens(role)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 500,
              background: roleLens === role ? '#00C2A8' : 'transparent',
              color: roleLens === role ? '#062d29' : '#94a3b8',
            }}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Compliance mode */}
      <button
        onClick={() => setMaskSensitiveCosts(!maskSensitiveCosts)}
        style={{
          background: maskSensitiveCosts ? 'rgba(245,158,11,0.16)' : '#1a2840',
          border: `1px solid ${maskSensitiveCosts ? 'rgba(245,158,11,0.35)' : '#2e4168'}`,
          borderRadius: 8,
          padding: '6px 10px',
          cursor: 'pointer',
          color: maskSensitiveCosts ? '#fbbf24' : '#94a3b8',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {maskSensitiveCosts ? 'Masked' : 'Unmasked'}
      </button>

      {/* Integration status */}
      <div style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, padding: '6px 10px' }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Connectors </span>
        <span style={{ fontSize: 11, color: healthyConnectors === integrationSources.length ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
          {healthyConnectors}/{integrationSources.length}
        </span>
      </div>

      {/* Demo controls */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleDemoButton}
          style={{
            background: 'rgba(208,100,20,0.18)',
            border: '1px solid rgba(208,100,20,0.42)',
            borderRadius: 8,
            color: '#fdba74',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {demoButtonLabel}
        </button>
        {isDemoActive && (
          <button
            onClick={() => exitDemo(false)}
            style={{
              background: 'transparent',
              border: '1px solid #2e4168',
              borderRadius: 8,
              color: '#94a3b8',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Exit Demo
          </button>
        )}
      </div>

      {/* Live status pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0, 194, 168, 0.1)',
        border: '1px solid rgba(0, 194, 168, 0.2)',
        borderRadius: 20, padding: '4px 10px',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C2A8', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 11, color: '#00C2A8', fontWeight: 600 }}>LIVE</span>
        <span style={{ fontSize: 11, color: '#64748b' }}>Feb 24, 2026 · 09:42 EST</span>
      </div>

      {/* Search */}
      <button style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
        <Search size={14} />
        <span style={{ fontSize: 12 }}>Search...</span>
        <span style={{ fontSize: 10, background: '#2e4168', borderRadius: 4, padding: '1px 5px' }}>⌘K</span>
      </button>

      {/* Notifications */}
      <button style={{
        position: 'relative',
        background: criticalAlerts > 0 ? 'rgba(239, 68, 68, 0.1)' : '#1a2840',
        border: `1px solid ${criticalAlerts > 0 ? 'rgba(239, 68, 68, 0.3)' : '#2e4168'}`,
        borderRadius: 8, width: 36, height: 36, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: criticalAlerts > 0 ? '#ef4444' : '#94a3b8',
      }}>
        <Bell size={16} />
        {unreadNotifications > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: criticalAlerts > 0 ? '#ef4444' : '#006EFF',
            borderRadius: 10, width: 16, height: 16,
            fontSize: 9, fontWeight: 700, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadNotifications}
          </span>
        )}
      </button>

      {/* User avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #006EFF, #00C2A8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'white',
        }}>
          {user?.initials || 'JM'}
        </div>
        <div style={{ display: 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{user?.name}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>{user?.role}</div>
        </div>
        <ChevronDown size={14} color="#64748b" />
      </div>
    </header>
  );
}
