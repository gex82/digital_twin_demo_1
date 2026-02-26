import { useCallback, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PRIMARY_FACILITIES } from '../../data/facilities';
import { CARRIER_OTIF } from '../../data/otif';
import { OtifTrendChart } from '../../components/charts/OtifTrendChart';
import { NETWORK_ALERTS } from '../../data/alerts';
import { GlassCard } from '../../components/ui/GlassCard';
import { useScenarioStore } from '../../store/scenarioStore';
import { useDemoStageBindings } from '../../hooks/useDemoStageBindings';
import { useShallow } from 'zustand/react/shallow';
import { useUiStore } from '../../store/uiStore';
import type { Facility } from '../../types';

const BLUE = '#006EFF';
const BORDER = '#2e4168';
const SURFACE = '#1a2840';
const SURFACE2 = '#1e2f4a';
const GREEN = '#10b981';
const RED = '#ef4444';
const YELLOW = '#f59e0b';

const TABS = ['OTIF Trend', 'By Facility', 'Carrier Performance', 'Coverage Analysis'] as const;
type Tab = typeof TABS[number];

const OTIF_EVENTS = [
  { month: 'Jan', note: 'Columbus expansion completed, OTIF +0.3pp' },
  { month: 'Mar', note: 'FedEx contract renegotiation, carrier OTIF improved' },
  { month: 'Aug', note: 'Peak dental season, order volume +18%' },
  { month: 'Nov', note: 'Midwest weather event, 2-day OTIF impact' },
];

const COVERAGE_REGIONS = [
  { region: 'Northeast', popCov: 94, custLoc: 4200, nextDay: 88, twoDay: 99, avgTransit: 1.3 },
  { region: 'Southeast', popCov: 91, custLoc: 3800, nextDay: 82, twoDay: 97, avgTransit: 1.6 },
  { region: 'Midwest', popCov: 96, custLoc: 5100, nextDay: 93, twoDay: 99, avgTransit: 1.1 },
  { region: 'Southwest', popCov: 88, custLoc: 2900, nextDay: 79, twoDay: 95, avgTransit: 1.8 },
  { region: 'West', popCov: 85, custLoc: 2400, nextDay: 74, twoDay: 93, avgTransit: 2.1 },
  { region: 'Mountain', popCov: 78, custLoc: 1200, nextDay: 65, twoDay: 88, avgTransit: 2.4 },
  { region: 'Canada', popCov: 72, custLoc: 800, nextDay: 41, twoDay: 76, avgTransit: 3.2 },
];

function otifColor(pct: number) {
  const normalized = pct > 1 ? pct / 100 : pct;
  if (normalized >= 0.975) return GREEN;
  if (normalized >= 0.95) return YELLOW;
  return RED;
}

// Simple sparkline SVG
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 60, H = 20;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function buildFacilityOtifSparkline(facility: Facility): number[] {
  const seed = facility.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = facility.otifPct * 100;
  const trendBias = facility.utilizationPct >= 0.82 ? -0.14 : facility.utilizationPct <= 0.74 ? 0.11 : -0.03;
  return Array.from({ length: 6 }, (_, index) => {
    const seasonal = ((seed * (index + 5)) % 9) - 4;
    const value = base + (index - 5) * trendBias + seasonal * 0.05;
    return Number(value.toFixed(2));
  });
}

export default function ServiceLevel() {
  const [tab, setTab] = useState<Tab>('OTIF Trend');
  const [sbrRequestedCarrier, setSbrRequestedCarrier] = useState<string | null>(null);
  const [sbrMessage, setSbrMessage] = useState('');
  const { createScenarioFromTemplate, setActiveScenario } = useScenarioStore(
    useShallow((state) => ({
      createScenarioFromTemplate: state.createScenarioFromTemplate,
      setActiveScenario: state.setActiveScenario,
    }))
  );
  const pushToast = useUiStore((state) => state.pushToast);

  const TOP_KPIS = [
    { label: 'Network OTIF', value: '97.2%', color: GREEN, delta: '+0.4pp YoY' },
    { label: 'Dental OTIF', value: '97.8%', color: GREEN, delta: '+0.6pp YoY' },
    { label: 'Animal Health OTIF', value: '96.7%', color: YELLOW, delta: '-0.1pp YoY' },
    { label: 'Next-Day Coverage', value: '91%', color: BLUE, delta: '+2pp YoY' },
  ];

  const requestSbr = useCallback((carrier: string) => {
    setSbrRequestedCarrier(carrier);
    setSbrMessage(`SBR request submitted for ${carrier}. Procurement and carrier ops notified.`);
    pushToast({
      title: 'SBR Request Submitted',
      message: `${carrier} performance review has been routed to procurement and carrier ops.`,
      tone: 'warning',
    });
    window.setTimeout(() => setSbrMessage(''), 2600);
  }, [pushToast]);

  function modelCoverageScenario(region: string) {
    const scenarioId = createScenarioFromTemplate('SCN-002', {
      name: `Coverage Improvement: ${region}`,
      description: `Model service improvement options for ${region}.`,
      assumptionNotes: `Triggered from Service Level coverage analysis for ${region}.`,
      tags: ['Service-Level', 'Coverage', region],
      createdBy: 'Service Ops',
    });
    setActiveScenario(scenarioId);
    pushToast({
      title: 'Coverage Scenario Drafted',
      message: `${region} service-level scenario created for simulation.`,
      tone: 'info',
    });
  }

  useDemoStageBindings('/app/service-level', {
    SERVICE_SHOW_OTIF_RISK: async () => {
      setTab('Carrier Performance');
    },
    SERVICE_TRIGGER_SBR: async () => {
      setTab('Carrier Performance');
      requestSbr('FedEx Ground');
    },
  });

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: 'calc(100vh - 64px)', boxSizing: 'border-box' }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {TOP_KPIS.map(kpi => (
          <div key={kpi.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ color: kpi.color, fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ color: kpi.delta.startsWith('+') ? GREEN : kpi.delta.startsWith('-') ? RED : '#94a3b8', fontSize: 11 }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
            color: tab === t ? '#e2e8f0' : '#64748b',
            borderBottom: tab === t ? `2px solid ${BLUE}` : '2px solid transparent',
            fontWeight: tab === t ? 600 : 400,
          }}>{t}</button>
        ))}
      </div>

      {sbrMessage && (
        <div style={{ marginBottom: 14, background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.3)', borderRadius: 8, padding: '8px 10px', color: '#00C2A8', fontSize: 12 }}>
          {sbrMessage}
        </div>
      )}

      {/* OTIF Trend */}
      {tab === 'OTIF Trend' && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
          <GlassCard noPadding>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: 0 }}>12-Month OTIF Performance</h3>
            </div>
            <OtifTrendChart height={280} />
          </GlassCard>
          <GlassCard>
            <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Key Events</h3>
            {OTIF_EVENTS.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, background: `${BLUE}20`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, height: 28 }}>
                  <span style={{ color: BLUE, fontSize: 10, fontWeight: 700 }}>{e.month}</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{e.note}</p>
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {/* By Facility */}
      {tab === 'By Facility' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {PRIMARY_FACILITIES.map(fc => {
            const color = otifColor(fc.otifPct);
            const sparkData = buildFacilityOtifSparkline(fc);
            return (
              <div key={fc.id} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{fc.shortName}</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>{fc.city}, {fc.state}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color, fontSize: 16, fontWeight: 700 }}>{(fc.otifPct * 100).toFixed(1)}%</div>
                    <Sparkline values={sparkData} color={color} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ color: '#64748b', fontSize: 10 }}>Orders/day</span>
                  <span style={{ color: '#94a3b8', fontSize: 10 }}>{fc.currentDailyOrders.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: 10 }}>Utilization</span>
                  <span style={{ color: fc.utilizationPct >= 0.85 ? YELLOW : '#94a3b8', fontSize: 10 }}>{(fc.utilizationPct * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Carrier Performance */}
      {tab === 'Carrier Performance' && (
        <GlassCard noPadding>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
            <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: 0 }}>Carrier OTIF Performance</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} data-demo-anchor="demo-service-carriers">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Carrier', 'OTIF %', 'Volume Share', 'Trend', '30-Day Δ', 'Contract Expiry', ''].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CARRIER_OTIF.map((c, i) => (
                <tr
                  key={c.carrier}
                  style={{ borderBottom: `1px solid ${BORDER}`, background: c.carrier === 'FedEx Ground' ? `${YELLOW}08` : i % 2 === 0 ? 'transparent' : `${SURFACE2}50` }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.carrier === 'FedEx Ground' && <AlertTriangle size={12} style={{ color: YELLOW }} />}
                      <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{c.carrier}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: otifColor(c.otifPct), fontSize: 13, fontWeight: 700 }}>{c.otifPct.toFixed(1)}%</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, background: SURFACE2, borderRadius: 2, height: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.volumeSharePct}%`, background: BLUE, borderRadius: 2 }} />
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>{c.volumeSharePct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <Sparkline values={c.trend} color={otifColor(c.otifPct)} />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: c.delta30Day >= 0 ? GREEN : RED, fontSize: 11, fontWeight: 600 }}>
                      {c.delta30Day >= 0 ? '+' : ''}{c.delta30Day.toFixed(1)}pp
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 11 }}>{c.contractExpiry}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => requestSbr(c.carrier)}
                      style={{ background: `${BLUE}20`, border: `1px solid ${BLUE}40`, color: BLUE, borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}
                    >
                      {sbrRequestedCarrier === c.carrier ? 'SBR Requested' : 'Request SBR'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Coverage Analysis */}
      {tab === 'Coverage Analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          <GlassCard noPadding>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: 0 }}>Coverage by Region</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Region', 'Pop. Coverage', 'Customer Locations', 'Next-Day %', '2-Day %', 'Avg Transit (days)', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COVERAGE_REGIONS.map((r, i) => (
                  <tr key={r.region} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? 'transparent' : `${SURFACE2}50` }}>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{r.region}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, background: SURFACE2, borderRadius: 2, height: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.popCov}%`, background: r.popCov >= 90 ? GREEN : YELLOW, borderRadius: 2 }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: 11 }}>{r.popCov}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>{r.custLoc.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ color: r.nextDay >= 85 ? GREEN : r.nextDay >= 70 ? YELLOW : RED, fontSize: 12, fontWeight: 600 }}>{r.nextDay}%</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ color: r.twoDay >= 95 ? GREEN : YELLOW, fontSize: 12, fontWeight: 600 }}>{r.twoDay}%</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>{r.avgTransit.toFixed(1)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {(r.nextDay < 80 || r.popCov < 85) && (
                        <button
                          onClick={() => modelCoverageScenario(r.region)}
                          style={{ background: `${YELLOW}20`, border: `1px solid ${YELLOW}40`, color: YELLOW, borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}
                        >
                          Improve Coverage
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <GlassCard>
              <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Coverage Gaps</h3>
              {['Mountain West', 'Pacific Northwest', 'Rural South', 'Canada'].map(gap => (
                <div key={gap} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={11} style={{ color: YELLOW, flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>{gap}</span>
                </div>
              ))}
              <button
                onClick={() => modelCoverageScenario('Mountain West')}
                style={{ width: '100%', marginTop: 8, background: `${BLUE}20`, border: `1px solid ${BLUE}40`, color: BLUE, borderRadius: 6, padding: '7px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
              >
                Model Hub Expansion
              </button>
            </GlassCard>

            <GlassCard>
              <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Service Alerts</h3>
              {NETWORK_ALERTS.filter(a => a.severity === 'critical' || a.severity === 'warning').slice(0, 3).map(alert => (
                <div key={alert.id} style={{ marginBottom: 8, padding: '8px', background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: alert.severity === 'critical' ? RED : YELLOW, marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 500 }}>{alert.title}</div>
                      <div style={{ color: '#475569', fontSize: 10 }}>{alert.message.slice(0, 60)}...</div>
                    </div>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
