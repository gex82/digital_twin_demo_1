import { useState } from 'react';
import { DollarSign, TrendingDown, Zap, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { COST_BUCKETS, SEGMENT_COST_SPLITS, TOP_COST_OPPORTUNITIES } from '../../data/costToServe';
import { CostWaterfallChart } from '../../components/charts/CostWaterfallChart';
import { GlassCard } from '../../components/ui/GlassCard';
import { formatCurrency } from '../../utils/formatters';

const BLUE = '#006EFF';
const TEAL = '#00C2A8';
const BORDER = '#2e4168';
const SURFACE = '#1a2840';
const SURFACE2 = '#1e2f4a';
const GREEN = '#10b981';
const RED = '#ef4444';

const TOP_KPIS = [
  { label: 'Total Network Cost', value: '$847.3M', delta: -2.1, unit: 'pct', icon: DollarSign, color: BLUE },
  { label: 'Cost per Order', value: '$14.82', delta: -1.3, unit: 'pct', icon: TrendingDown, color: TEAL },
  { label: 'YoY Cost Delta', value: '-2.1%', delta: -2.1, unit: 'pct', icon: TrendingDown, color: GREEN },
  { label: 'Optimization Potential', value: '$31.2M', delta: 0, unit: 'usd', icon: Zap, color: '#f59e0b' },
];

const TABS = ['Overview', 'By Category', 'By Lane', 'Opportunities'] as const;
type Tab = typeof TABS[number];

// Top lanes by cost
const TOP_LANES = [
  { origin: 'ELG – Elgin, IL', dest: 'Northeast Region', vol: 4200, mode: 'TL', costPerOrder: 18.4, otif: 97.1, carrier: 'FedEx Freight' },
  { origin: 'DAL – Dallas, TX', dest: 'Southwest Region', vol: 3800, mode: 'Parcel', costPerOrder: 16.2, otif: 96.8, carrier: 'UPS Ground' },
  { origin: 'HBG – Harrisburg, PA', dest: 'Mid-Atlantic', vol: 3500, mode: 'LTL', costPerOrder: 15.9, otif: 97.4, carrier: 'Old Dominion' },
  { origin: 'COL – Columbus, OH', dest: 'Southeast Region', vol: 2900, mode: 'Parcel', costPerOrder: 17.1, otif: 96.2, carrier: 'FedEx Ground' },
  { origin: 'GSO – Greensboro, NC', dest: 'Southeast Region', vol: 2700, mode: 'LTL', costPerOrder: 14.6, otif: 97.6, carrier: 'Saia' },
  { origin: 'RNO – Reno, NV', dest: 'Mountain West', vol: 2100, mode: 'TL', costPerOrder: 19.2, otif: 95.8, carrier: 'XPO' },
  { origin: 'PHX – Phoenix, AZ', dest: 'Southwest', vol: 1900, mode: 'Parcel', costPerOrder: 15.3, otif: 97.0, carrier: 'UPS Ground' },
  { origin: 'MSP – Minneapolis, MN', dest: 'Upper Midwest', vol: 1800, mode: 'LTL', costPerOrder: 16.8, otif: 96.9, carrier: 'Estes' },
  { origin: 'SAC – Sacramento, CA', dest: 'Pacific West', vol: 1700, mode: 'SelfFleet', costPerOrder: 13.1, otif: 98.2, carrier: 'Patterson Fleet' },
  { origin: 'OKC – Oklahoma City, OK', dest: 'South Central', vol: 1400, mode: 'LTL', costPerOrder: 14.4, otif: 97.3, carrier: 'ABF Freight' },
];

const MODE_COLORS: Record<string, string> = { Parcel: BLUE, LTL: TEAL, TL: '#9333ea', SelfFleet: '#f59e0b' };

export default function CostToServe() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [sortCol, setSortCol] = useState<'annualCostUSD' | 'pctOfTotal' | 'costPerOrder' | 'trend3moPct'>('annualCostUSD');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [laneModalLane, setLaneModalLane] = useState<null | typeof TOP_LANES[0]>(null);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const sortedBuckets = [...COST_BUCKETS].sort((a, b) => {
    const va = a[sortCol] as number;
    const vb = b[sortCol] as number;
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const SortIcon = ({ col }: { col: typeof sortCol }) => sortCol === col
    ? (sortDir === 'asc' ? <ChevronUp size={11} style={{ color: BLUE }} /> : <ChevronDown size={11} style={{ color: BLUE }} />)
    : null;

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: 'calc(100vh - 64px)', boxSizing: 'border-box' }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {TOP_KPIS.map(kpi => (
          <div key={kpi.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <kpi.icon size={13} style={{ color: kpi.color }} />
              <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
            </div>
            <div style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{kpi.value}</div>
            {kpi.delta !== 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: kpi.delta < 0 ? GREEN : RED, fontSize: 11 }}>
                  {kpi.delta < 0 ? '▼' : '▲'} {Math.abs(kpi.delta).toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
              color: tab === t ? '#e2e8f0' : '#64748b',
              borderBottom: tab === t ? `2px solid ${BLUE}` : '2px solid transparent',
              fontWeight: tab === t ? 600 : 400,
            }}
          >{t}</button>
        ))}
      </div>

      {/* TAB: Overview */}
      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
          <GlassCard noPadding>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: 0 }}>Cost-to-Serve Breakdown — $847.3M Annual</h3>
            </div>
            <CostWaterfallChart compact={false} height={320} />
          </GlassCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <GlassCard>
              <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>By Segment</h3>
              {SEGMENT_COST_SPLITS.map(seg => (
                <div key={seg.segment} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{seg.segment}</span>
                    <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{formatCurrency(seg.totalCostUSD)}</span>
                  </div>
                  <div style={{ background: SURFACE2, borderRadius: 3, height: 8, marginBottom: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${seg.pctOfTotal}%`, background: `linear-gradient(90deg, ${BLUE}, ${TEAL})`, borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: 10 }}>{seg.pctOfTotal.toFixed(1)}% of total</span>
                    <span style={{ color: '#64748b', fontSize: 10 }}>${seg.costPerOrderUSD.toFixed(2)}/order</span>
                  </div>
                </div>
              ))}
            </GlassCard>
            <GlassCard>
              <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Category Split</h3>
              {[
                { label: 'Transportation', pct: 58.2, color: BLUE },
                { label: 'Warehousing', pct: 24.7, color: TEAL },
                { label: 'Inventory Carry', pct: 12.1, color: '#9333ea' },
                { label: 'Overhead', pct: 5.0, color: '#f59e0b' },
              ].map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8', fontSize: 11, flex: 1 }}>{c.label}</span>
                  <div style={{ width: 80, background: SURFACE2, borderRadius: 2, height: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600, width: 36, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              ))}
            </GlassCard>
          </div>
        </div>
      )}

      {/* TAB: By Category */}
      {tab === 'By Category' && (
        <GlassCard noPadding>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {[
                  { label: 'Category', col: null },
                  { label: 'Sub-category', col: null },
                  { label: 'Annual Cost', col: 'annualCostUSD' as typeof sortCol },
                  { label: '% of Total', col: 'pctOfTotal' as typeof sortCol },
                  { label: 'Per Order', col: 'costPerOrder' as typeof sortCol },
                  { label: '3-Mo Trend', col: 'trend3moPct' as typeof sortCol },
                ].map(h => (
                  <th
                    key={h.label}
                    onClick={() => h.col && toggleSort(h.col)}
                    style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: h.col ? 'pointer' : 'default', userSelect: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {h.label} {h.col && <SortIcon col={h.col} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedBuckets.map((b, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? 'transparent' : `${SURFACE2}50` }}>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.category === 'Transportation' ? BLUE : b.category === 'Warehousing' ? TEAL : b.category === 'Inventory Carrying' ? '#9333ea' : '#f59e0b' }} />
                      {b.category}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{b.subcategory}</td>
                  <td style={{ padding: '10px 14px', color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>{formatCurrency(b.annualCostUSD)}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>{b.pctOfTotal.toFixed(1)}%</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>${b.costPerOrder.toFixed(2)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: b.trend3moPct <= 0 ? GREEN : RED, fontSize: 11, fontWeight: 600 }}>
                      {b.trend3moPct > 0 ? '+' : ''}{b.trend3moPct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* TAB: By Lane */}
      {tab === 'By Lane' && (
        <>
          <GlassCard noPadding>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: 0 }}>Top 10 Lanes by Cost/Order</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Origin FC', 'Destination', 'Vol/Day', 'Mode', 'Cost/Order', 'OTIF', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_LANES.map((lane, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? 'transparent' : `${SURFACE2}50` }}>
                    <td style={{ padding: '9px 14px', color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{lane.origin}</td>
                    <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: 12 }}>{lane.dest}</td>
                    <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: 12 }}>{lane.vol.toLocaleString()}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{ background: `${MODE_COLORS[lane.mode] ?? BLUE}25`, color: MODE_COLORS[lane.mode] ?? BLUE, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>
                        {lane.mode}
                      </span>
                    </td>
                    <td style={{ padding: '9px 14px', color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>${lane.costPerOrder.toFixed(2)}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{ color: lane.otif >= 97 ? GREEN : '#f59e0b', fontSize: 12, fontWeight: 600 }}>{lane.otif.toFixed(1)}%</span>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <button
                        onClick={() => setLaneModalLane(lane)}
                        style={{ background: `${BLUE}20`, border: `1px solid ${BLUE}40`, color: BLUE, borderRadius: 5, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                      >
                        Optimize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>

          {laneModalLane && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, width: 440, padding: 24 }}>
                <h3 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Lane Optimization Analysis</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>{laneModalLane.origin} → {laneModalLane.dest}</p>
                <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 8px' }}>
                    Current carrier: <strong style={{ color: '#e2e8f0' }}>{laneModalLane.carrier}</strong>
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 8px' }}>
                    Current cost/order: <strong style={{ color: RED }}>${laneModalLane.costPerOrder.toFixed(2)}</strong>
                  </p>
                  <div style={{ height: 1, background: BORDER, margin: '10px 0' }} />
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 4px' }}>
                    Recommendation: Switch to <strong style={{ color: TEAL }}>Regional LTL Carrier</strong>
                  </p>
                  <p style={{ color: GREEN, fontSize: 13, fontWeight: 700, margin: 0 }}>
                    Estimated savings: -$1.20/order · ~${(laneModalLane.vol * 1.2 * 250 / 1_000_000).toFixed(1)}M/yr
                  </p>
                </div>
                <button
                  onClick={() => setLaneModalLane(null)}
                  style={{ background: BLUE, border: 'none', color: '#fff', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Model in Scenario
                </button>
                <button
                  onClick={() => setLaneModalLane(null)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginLeft: 8, fontSize: 13 }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB: Opportunities */}
      {tab === 'Opportunities' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[...TOP_COST_OPPORTUNITIES].sort((a, b) => b.annualSavingsPotentialUSD - a.annualSavingsPotentialUSD).map(opp => (
            <div
              key={opp.id}
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, borderLeft: `3px solid ${opp.priority === 'high' ? RED : opp.priority === 'medium' ? '#f59e0b' : TEAL}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{opp.title}</span>
                <span style={{ color: GREEN, fontSize: 14, fontWeight: 700, marginLeft: 8, flexShrink: 0 }}>
                  {formatCurrency(opp.annualSavingsPotentialUSD)}/yr
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5, margin: '0 0 10px' }}>{opp.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ background: `${BLUE}20`, color: BLUE, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{opp.category}</span>
                <span style={{ background: `${opp.priority === 'high' ? RED : opp.priority === 'medium' ? '#f59e0b' : TEAL}20`, color: opp.priority === 'high' ? RED : opp.priority === 'medium' ? '#f59e0b' : TEAL, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>
                  {opp.priority} priority
                </span>
                <span style={{ color: '#475569', fontSize: 10, marginLeft: 'auto' }}>
                  {opp.confidencePct}% confidence
                </span>
              </div>
              <div style={{ background: SURFACE2, borderRadius: 3, height: 4, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${opp.confidencePct}%`, background: `linear-gradient(90deg, ${BLUE}, ${TEAL})`, borderRadius: 3 }} />
              </div>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${BLUE}20`, border: `1px solid ${BLUE}40`, color: BLUE, borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
              >
                Model in Scenario <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
