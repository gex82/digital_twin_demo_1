import { AlertTriangle, Info, CheckCircle, XCircle, ArrowRight, TrendingUp } from 'lucide-react';
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
  const { scenarios } = useScenarioStore();
  const activeScenarios = scenarios.filter(s => s.status === 'Complete' || s.status === 'Approved');
  const approvedScenarios = scenarios.filter(s => s.status === 'Approved' && s.result?.annualSavingsUSD && s.result.annualSavingsUSD > 0);
  const totalSavings = approvedScenarios.reduce((s, scn) => s + (scn.result?.annualSavingsUSD || 0), 0);

  const topKpis = NETWORK_KPIS.slice(0, 6);

  const highUtilFCs = PRIMARY_FACILITIES
    .filter(f => f.utilizationPct >= 0.80)
    .sort((a, b) => b.utilizationPct - a.utilizationPct)
    .slice(0, 3);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
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
              <span style={{ color: '#00C2A8' }}>{formatCurrency(totalSavings, true)}/yr</span> in projected savings pending implementation
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
        {topKpis.map((kpi, i) => (
          <KpiCard key={kpi.id} kpi={kpi} delay={i * 100} />
        ))}
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
