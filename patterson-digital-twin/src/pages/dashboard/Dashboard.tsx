import { useMemo, useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, ArrowRight, TrendingUp, Database, RefreshCcw, ShieldAlert } from 'lucide-react';
import { NetworkMap } from '../../components/map/NetworkMap';
import { KpiCard } from '../../components/ui/KpiCard';
import { GlassCard } from '../../components/ui/GlassCard';
import { OtifTrendChart } from '../../components/charts/OtifTrendChart';
import { ForecastAreaChart } from '../../components/charts/ForecastAreaChart';
import { NETWORK_KPIS, SEGMENT_KPIS } from '../../data/kpis';
import { NETWORK_ALERTS } from '../../data/alerts';
import { PRIMARY_FACILITIES } from '../../data/facilities';
import { useScenarioStore } from '../../store/scenarioStore';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { StatusPill } from '../../components/ui/StatusPill';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import { useDemoStageBindings } from '../../hooks/useDemoStageBindings';
import { useShallow } from 'zustand/react/shallow';
import { AppButton } from '../../components/ui/AppButton';
import { SkeletonBlock } from '../../components/ui/SkeletonBlock';

const ALERT_ICONS = {
  critical: <XCircle size={14} color="#ef4444" />,
  warning: <AlertTriangle size={14} color="#f59e0b" />,
  info: <Info size={14} color="#006EFF" />,
  success: <CheckCircle size={14} color="#10b981" />,
};

const ALERT_COLORS = {
  critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', dot: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  info: { bg: 'rgba(0,110,255,0.08)', border: 'rgba(0,110,255,0.2)', dot: '#006EFF' },
  success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', dot: '#10b981' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [focusHealth, setFocusHealth] = useState(false);
  const [showDecisionRecap, setShowDecisionRecap] = useState(false);
  const { scenarios } = useScenarioStore();
  const {
    maskSensitiveCosts,
    lastModelCalibratedAt,
    integrationSources,
    integrationIncidents,
    isIntegrationRefreshing,
    decisionTrail,
    simulateIntegrationRefresh,
    acknowledgeIncident,
    addDecisionTrail,
  } = useUiStore(
    useShallow((state) => ({
      maskSensitiveCosts: state.maskSensitiveCosts,
      lastModelCalibratedAt: state.lastModelCalibratedAt,
      integrationSources: state.integrationSources,
      integrationIncidents: state.integrationIncidents,
      isIntegrationRefreshing: state.isIntegrationRefreshing,
      decisionTrail: state.decisionTrail,
      simulateIntegrationRefresh: state.simulateIntegrationRefresh,
      acknowledgeIncident: state.acknowledgeIncident,
      addDecisionTrail: state.addDecisionTrail,
    }))
  );
  const activeScenarios = scenarios.filter(s => s.status === 'Complete' || s.status === 'Approved');
  const approvedScenarios = scenarios.filter(s => s.status === 'Approved' && s.result?.annualSavingsUSD && s.result.annualSavingsUSD > 0);
  const totalSavings = approvedScenarios.reduce((s, scn) => s + (scn.result?.annualSavingsUSD || 0), 0);

  const topKpis = NETWORK_KPIS.slice(0, 6);
  const healthyConnectors = useMemo(
    () => integrationSources.filter((source) => source.status === 'Healthy').length,
    [integrationSources]
  );
  const unresolvedIncidents = integrationIncidents.filter((incident) => !incident.acknowledged);
  const averageLatencyMs = Math.round(
    integrationSources.reduce((sum, source) => sum + source.latencyMs, 0) / integrationSources.length
  );
  const modelCalibratedLabel = useMemo(() => {
    const date = new Date(lastModelCalibratedAt);
    if (Number.isNaN(date.getTime())) return 'Unavailable';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
      timeZoneName: 'short',
    }).format(date);
  }, [lastModelCalibratedAt]);

  useDemoStageBindings('/app/dashboard', useMemo(() => ({
    DASHBOARD_FOCUS_HEALTH: async () => {
      setFocusHealth(true);
      setShowDecisionRecap(false);
    },
    DASHBOARD_SHOW_DECISION_RECAP: async () => {
      setShowDecisionRecap(true);
      setFocusHealth(false);
    },
  }), []));

  const highUtilFCs = PRIMARY_FACILITIES
    .filter(f => f.utilizationPct >= 0.80)
    .sort((a, b) => b.utilizationPct - a.utilizationPct)
    .slice(0, 3);

  function refreshDataOps() {
    simulateIntegrationRefresh();
    addDecisionTrail('Integration Refresh', 'Executed connector refresh and lineage check.');
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Demo governance card */}
      <GlassCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 14, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Integration & Governance
            </div>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
              Connectors healthy: {healthyConnectors}/{integrationSources.length}
            </div>
            <div style={{ color: '#64748b', fontSize: 11 }}>
              Decision trail events: {decisionTrail.length} · Cost masking: {maskSensitiveCosts ? 'On' : 'Off'}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Latency Envelope</div>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>
              {averageLatencyMs}ms avg
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Last Decision</div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>
              {decisionTrail.length > 0 ? decisionTrail[decisionTrail.length - 1].step : 'No stage actions recorded yet'}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard data-demo-anchor="demo-data-ops-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={14} color="#93c5fd" />
            <div>
              <div style={{ color: '#93c5fd', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Data Operations
              </div>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>
                Source freshness, lineage trace, and connector health simulation
              </div>
            </div>
          </div>
          <AppButton variant="secondary" size="sm" disabled={isIntegrationRefreshing} onClick={refreshDataOps}>
            <RefreshCcw size={12} style={{ animation: isIntegrationRefreshing ? 'spin 1s linear infinite' : undefined }} />
            {isIntegrationRefreshing ? 'Refreshing...' : 'Refresh Connectors'}
          </AppButton>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
          <div style={{ border: '1px solid #2e4168', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 0.6fr 0.9fr 1fr', gap: 8, padding: '8px 10px', background: '#17253b', color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>Source</span>
              <span>Status</span>
              <span>Freshness</span>
              <span>Latency</span>
              <span>Lineage</span>
            </div>
            {isIntegrationRefreshing ? (
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 0.6fr 0.9fr 1fr', gap: 8 }}>
                    <SkeletonBlock height={10} />
                    <SkeletonBlock height={10} />
                    <SkeletonBlock height={10} />
                    <SkeletonBlock height={10} />
                    <SkeletonBlock height={10} />
                  </div>
                ))}
              </div>
            ) : (
              integrationSources.map((source) => {
                const statusColor =
                  source.status === 'Healthy' ? '#10b981' : source.status === 'Degraded' ? '#d06414' : '#ef4444';
                return (
                  <div
                    key={source.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 0.7fr 0.6fr 0.9fr 1fr',
                      gap: 8,
                      padding: '9px 10px',
                      borderTop: '1px solid #22324f',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#e2e8f0', fontSize: 12 }}>{source.name}</span>
                    <span style={{ color: statusColor, fontSize: 11, fontWeight: 700 }}>{source.status}</span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{source.freshnessLabel}</span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{source.latencyMs}ms</span>
                    <span style={{ color: '#64748b', fontSize: 10 }}>{source.lineageTag}</span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ border: '1px solid #2e4168', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Open Incidents
              </div>
              <span style={{ color: unresolvedIncidents.length > 0 ? '#d06414' : '#10b981', fontSize: 11, fontWeight: 700 }}>
                {unresolvedIncidents.length}
              </span>
            </div>
            {unresolvedIncidents.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 11 }}>No active connector incidents.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {unresolvedIncidents.map((incident) => (
                  <div key={incident.id} style={{ background: 'rgba(208,100,20,0.08)', border: '1px solid rgba(208,100,20,0.28)', borderRadius: 8, padding: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldAlert size={12} color="#fdba74" />
                        <span style={{ color: '#fdba74', fontSize: 11, fontWeight: 700 }}>{incident.title}</span>
                      </div>
                      <AppButton
                        size="sm"
                        variant="ghost"
                        style={{ padding: '3px 6px', fontSize: 10 }}
                        onClick={() => acknowledgeIncident(incident.id)}
                      >
                        Ack
                      </AppButton>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: 1.4 }}>{incident.detail}</div>
                    <div style={{ color: '#64748b', fontSize: 9, marginTop: 4 }}>
                      {new Date(incident.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {showDecisionRecap && (
        <div
          data-demo-anchor="demo-dashboard-decision-card"
          style={{
            background: 'rgba(0,110,255,0.12)',
            border: '1px solid rgba(0,110,255,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <div style={{ color: '#93c5fd', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Final Demo Recommendation
            </div>
            <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
              Execute carrier shift now, then sequence automation + consolidation.
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>
              Projected annual impact: {maskSensitiveCosts ? '***' : formatCurrency(18_800_000)} savings, OTIF +0.3pp.
            </div>
          </div>
          <button
            onClick={() => navigate('/app/reports')}
            style={{ background: 'rgba(0,110,255,0.2)', border: '1px solid rgba(0,110,255,0.45)', borderRadius: 8, color: '#93c5fd', padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            Open Decision Pack →
          </button>
        </div>
      )}

      {/* Scenario banner (if any approved) */}
      {approvedScenarios.length > 0 && (
        <div style={{
          background: 'rgba(0,194,168,0.08)', border: '1px solid rgba(0,194,168,0.2)',
          borderRadius: 10, padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={16} color="#00C2A8" />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              <strong style={{ color: 'white' }}>{approvedScenarios.length} scenario{approvedScenarios.length > 1 ? 's' : ''} approved</strong>
              {' · '}
              <span style={{ color: '#00C2A8' }}>{maskSensitiveCosts ? '***' : `${formatCurrency(totalSavings, true)}/yr`}</span> in projected savings pending implementation
            </span>
          </div>
          <button
            onClick={() => navigate('/app/scenarios')}
            style={{ background: 'rgba(0,194,168,0.15)', border: '1px solid rgba(0,194,168,0.3)', borderRadius: 6, color: '#00C2A8', padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            View Scenarios <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* KPI grid */}
      <div
        data-demo-anchor="demo-dashboard-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 14,
          border: focusHealth ? '1px solid rgba(0,194,168,0.35)' : '1px solid transparent',
          borderRadius: 12,
          padding: focusHealth ? 10 : 0,
          transition: 'all 0.2s ease',
        }}
      >
        {topKpis.map((kpi, i) => (
          <KpiCard key={kpi.id} kpi={kpi} delay={i * 100} />
        ))}
      </div>
      <div style={{ marginTop: -10, color: '#64748b', fontSize: 11 }}>
        Data as of: Model calibrated {modelCalibratedLabel}
      </div>

      {/* Network map + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Network map */}
        <GlassCard noPadding style={{ overflow: 'hidden', position: 'relative' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e4168', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Live Network Map</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>13 FCs · 4 Hubs · Real-time telemetry</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['FC', '#006EFF'], ['Hub', '#9333ea'], ['Dental', '#3389FF'], ['Animal Health', '#00C2A8']].map(([label, color]) => (
                <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color as string }} />
                  <span style={{ fontSize: 10, color: '#64748b' }}>{label as string}</span>
                </div>
              ))}
            </div>
          </div>
          <NetworkMap height={420} showFlows={true} showCoverage={false} />
        </GlassCard>

        {/* Alert feed */}
        <GlassCard style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #2e4168', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Network Alerts</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {NETWORK_ALERTS.filter(a => !a.isRead).length} unread · {NETWORK_ALERTS.filter(a => a.severity === 'critical').length} critical
              </p>
            </div>
            <span style={{ fontSize: 10, background: '#ef4444', color: 'white', borderRadius: 10, padding: '2px 7px', fontWeight: 700 }}>
              {NETWORK_ALERTS.filter(a => !a.isRead && a.severity === 'critical').length} CRIT
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {NETWORK_ALERTS.map(alert => {
              const c = ALERT_COLORS[alert.severity];
              return (
                <div key={alert.id} style={{
                  background: alert.isRead ? 'transparent' : c.bg,
                  border: `1px solid ${alert.isRead ? 'transparent' : c.border}`,
                  borderRadius: 8, padding: '10px 12px', marginBottom: 6,
                  opacity: alert.isRead ? 0.5 : 1,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {ALERT_ICONS[alert.severity]}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'white', lineHeight: 1.3 }}>{alert.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginTop: 2 }}>{alert.message}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                        {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <OtifTrendChart height={200} />
        <ForecastAreaChart height={200} />

        {/* Segment split */}
        <GlassCard>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'white' }}>Segment Performance</h3>
          {[
            { label: 'Patterson Dental', orders: SEGMENT_KPIS.dental.dailyOrders, otif: SEGMENT_KPIS.dental.otifPct, cost: SEGMENT_KPIS.dental.costPerOrder, color: '#3389FF', pct: 38 },
            { label: 'Patterson Animal Health', orders: SEGMENT_KPIS.animalHealth.dailyOrders, otif: SEGMENT_KPIS.animalHealth.otifPct, cost: SEGMENT_KPIS.animalHealth.costPerOrder, color: '#00C2A8', pct: 62 },
          ].map(seg => (
            <div key={seg.label} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{seg.label}</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>{seg.pct}%</span>
              </div>
              <div style={{ height: 5, background: '#2e4168', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${seg.pct}%`, background: seg.color, borderRadius: 3 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { l: 'Daily Orders', v: `${(seg.orders / 1000).toFixed(0)}K` },
                  { l: 'OTIF', v: formatPercent(seg.otif) },
                  { l: 'Cost/Order', v: `$${seg.cost.toFixed(2)}` },
                ].map(({ l, v }) => (
                  <div key={l} style={{ background: '#1a2840', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </GlassCard>
      </div>

      {/* FC Utilization + Recent Scenarios row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* High utilization FCs */}
        <GlassCard>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Utilization Watch</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>FCs at or above 80% — monitor capacity risk</p>
            </div>
            <button onClick={() => navigate('/app/network')} style={{ background: 'transparent', border: 'none', color: '#006EFF', cursor: 'pointer', fontSize: 12 }}>
              View All →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {highUtilFCs.map(fc => {
              const pct = fc.utilizationPct * 100;
              const barColor = pct >= 90 ? '#ef4444' : pct >= 85 ? '#f97316' : '#f59e0b';
              return (
                <div key={fc.id} style={{ background: '#1a2840', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{fc.shortName}</span>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{fc.city}, {fc.state}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: barColor }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 4, background: '#2e4168', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: '#475569' }}>{fc.currentDailyOrders.toLocaleString()} / {fc.dailyOrderCapacity.toLocaleString()} orders/day</span>
                    <span style={{ fontSize: 10, color: '#475569' }}>{fc.automationLevel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Recent scenarios */}
        <GlassCard>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Active Scenarios</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>{activeScenarios.length} scenarios · {approvedScenarios.length} approved for action</p>
            </div>
            <button onClick={() => navigate('/app/scenarios')} style={{ background: 'transparent', border: 'none', color: '#006EFF', cursor: 'pointer', fontSize: 12 }}>
              View All →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scenarios.filter(s => !s.isBaseline).slice(0, 5).map(scn => (
              <div key={scn.id} style={{
                background: '#1a2840', borderRadius: 8, padding: '11px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/app/scenarios')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {scn.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{scn.createdBy} · v{scn.version}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <StatusPill status={scn.status} size="sm" />
                  {scn.result?.annualSavingsUSD && scn.result.annualSavingsUSD > 0 && (
                    <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>
                      {formatCurrency(scn.result.annualSavingsUSD, true)}/yr
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
