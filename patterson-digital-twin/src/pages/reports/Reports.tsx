import { useEffect, useMemo, useState } from 'react';
import { Download, Share2, Printer, Check } from 'lucide-react';
import { useScenarioStore } from '../../store/scenarioStore';
import { NETWORK_KPIS } from '../../data/kpis';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatCurrency } from '../../utils/formatters';
import { useDemoStageBindings } from '../../hooks/useDemoStageBindings';
import { AppButton } from '../../components/ui/AppButton';
import { SkeletonBlock } from '../../components/ui/SkeletonBlock';
import { useUiStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';

const BLUE = '#006EFF';
const TEAL = '#00C2A8';
const BORDER = '#2e4168';
const SURFACE = '#1a2840';
const SURFACE2 = '#1e2f4a';
const GREEN = '#10b981';

const STANDARD_REPORTS = [
  { id: 'exec-summary', label: 'Executive Network Summary', desc: 'One-page KPI overview', pages: 1 },
  { id: 'cts-deepdive', label: 'Cost-to-Serve Deep Dive', desc: '4-page cost analysis', pages: 4 },
  { id: 'otif-review', label: 'OTIF Performance Review', desc: 'Service level analysis', pages: 3 },
  { id: 'carrier-analysis', label: 'Carrier Strategy Analysis', desc: 'Carrier performance', pages: 2 },
  { id: 'quarterly-review', label: 'Quarterly Network Review', desc: 'QBR deck format', pages: 8 },
];

const SCHEDULED_REPORTS = [
  { label: 'Weekly OTIF Flash', schedule: 'Every Monday', lastSent: 'Mon Feb 17' },
  { label: 'Monthly CTS Report', schedule: '1st of month', lastSent: 'Feb 1' },
];

// Activity bar data (last 7 days)
const ACTIVITY = [3, 5, 2, 8, 4, 6, 3];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CAPEX_PARAMETER_KEYS = new Set(['capexBudget', 'capexUSD', 'totalCapex']);

function getScenarioCapexUSD(
  parameters: Array<{ key: string; value: number | boolean | string }>
): number | null {
  const capexParam = parameters.find(p => CAPEX_PARAMETER_KEYS.has(p.key));
  if (!capexParam) return null;
  const raw = capexParam.value;
  const numeric = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(numeric)) return null;
  return numeric * 1_000_000;
}

export default function Reports() {
  const navigate = useNavigate();
  const scenarios = useScenarioStore((state) => state.scenarios);
  const appendScenarioAuditEntry = useScenarioStore((state) => state.appendScenarioAuditEntry);
  const [selectedReport, setSelectedReport] = useState<string>('exec-summary');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [artifactMsg, setArtifactMsg] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const pushToast = useUiStore((state) => state.pushToast);
  const initializeDecisionWorkflow = useUiStore((state) => state.initializeDecisionWorkflow);
  const markDecisionExport = useUiStore((state) => state.markDecisionExport);

  const completeScenarios = scenarios.filter(s => s.result);

  const activeScenario = selectedScenarioId
    ? scenarios.find(s => s.id === selectedScenarioId)
    : null;

  const kpiTarget: Record<string, string> = {
    'Network Cost': '$830M',
    'OTIF': '97.5%',
    'Cost/Order': '$14.50',
    'Utilization': '82%',
  };
  const kpiPrior: Record<string, string> = {
    'Network Cost': '$864.5M',
    'OTIF': '96.8%',
    'Cost/Order': '$15.02',
    'Utilization': '77%',
  };
  const topKpis = [
    { label: 'Network Cost', value: '$847.3M', delta: '-2.0%' },
    { label: 'OTIF', value: '97.2%', delta: '+0.4pp' },
    { label: 'Cost/Order', value: '$14.82', delta: '-1.3%' },
    { label: 'Utilization', value: '78.0%', delta: '+1pp' },
  ];

  function selectScenarioPack(scenarioId: string) {
    setSelectedScenarioId(scenarioId);
    setSelectedReport('scenario');
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (scenario) {
      initializeDecisionWorkflow(scenario.id, scenario.name);
    }
  }

  function generatePackArtifact(scenarioName: string, scenarioId?: string) {
    const artifact = `${scenarioName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
    setArtifactMsg(`Generated pack artifact: ${artifact}`);
    markDecisionExport(artifact);
    if (scenarioId) {
      appendScenarioAuditEntry(scenarioId, {
        user: 'System',
        action: 'Decision Pack Generated',
        details: `Generated report artifact ${artifact}`,
      });
    }
    pushToast({
      title: 'Scenario Pack Generated',
      message: `${scenarioName} pack exported and staged for executive review.`,
      tone: 'success',
    });
    window.setTimeout(() => setArtifactMsg(''), 3200);
  }

  useDemoStageBindings('/app/reports', useMemo(() => ({
    REPORT_SELECT_SCENARIO_PACK: async () => {
      const bestScenario = scenarios
        .filter((scenario) => scenario.result)
        .sort((a, b) => (b.result?.annualSavingsUSD ?? 0) - (a.result?.annualSavingsUSD ?? 0))[0];
      if (!bestScenario) return;
      selectScenarioPack(bestScenario.id);
    },
    REPORT_GENERATE_EXPORT: async () => {
      const active = selectedScenarioId
        ? scenarios.find((scenario) => scenario.id === selectedScenarioId)
        : scenarios.find((scenario) => scenario.result);
      if (!active) return;
      initializeDecisionWorkflow(active.id, active.name);
      generatePackArtifact(active.name, active.id);
    },
  }), [initializeDecisionWorkflow, scenarios, selectedScenarioId]));

  function downloadJson() {
    const data = activeScenario ?? { kpis: NETWORK_KPIS, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patterson-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ title: 'Export Complete', message: 'Downloaded report data as JSON artifact.', tone: 'info' });
  }

  function handleCopy() {
    const text = activeScenario?.result?.executiveSummary
      ?? `Patterson Companies Network Intelligence Report — ${new Date().toLocaleDateString()}. Network OTIF: 97.2%. Annual network cost: $847.3M. Cost/order: $14.82. Three FCs are above 85% utilization requiring capacity planning. Recommend approving SCN-003 Carrier Strategy Shift for $8.2M annual savings.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg('Copied!');
      pushToast({ title: 'Summary Copied', message: 'Executive summary copied to clipboard.', tone: 'success' });
      setTimeout(() => setCopyMsg(''), 2000);
    });
  }

  function handleShare() {
    setShareMsg('Link copied: https://patterson-digital-twin.pages.dev/reports/exec');
    pushToast({ title: 'Share Link Ready', message: 'Report link copied for stakeholder distribution.', tone: 'info' });
    setTimeout(() => setShareMsg(''), 3000);
  }

  useEffect(() => {
    setIsPreviewLoading(true);
    const timer = window.setTimeout(() => setIsPreviewLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, [selectedReport, selectedScenarioId]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#0A1628' }}>

      {/* LEFT: Library */}
      <div style={{ width: 280, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '14px', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Report Library</span>
        </div>

        {/* Scenario Packs */}
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>SCENARIO PACKS</div>
          {completeScenarios.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>Run a scenario first to generate a pack.</p>
          ) : (
            completeScenarios.map(s => (
              <div
                key={s.id}
                onClick={() => selectScenarioPack(s.id)}
                style={{
                  padding: '8px 10px', cursor: 'pointer', borderRadius: 6, marginBottom: 4,
                  background: selectedScenarioId === s.id ? `${BLUE}15` : SURFACE2,
                  border: `1px solid ${selectedScenarioId === s.id ? BLUE : BORDER}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ color: '#e2e8f0', fontSize: 12 }}>{s.name}</span>
                  <StatusPill status={s.status} size="sm" />
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    selectScenarioPack(s.id);
                    generatePackArtifact(s.name, s.id);
                  }}
                  style={{ fontSize: 10, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Generate Pack →
                </button>
              </div>
            ))
          )}
        </div>

        {/* Standard Reports */}
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>STANDARD REPORTS</div>
          {STANDARD_REPORTS.map(r => (
            <div
              key={r.id}
              onClick={() => { setSelectedReport(r.id); setSelectedScenarioId(null); }}
              style={{
                padding: '8px 10px', cursor: 'pointer', borderRadius: 6, marginBottom: 4,
                background: selectedReport === r.id && !selectedScenarioId ? `${BLUE}15` : SURFACE2,
                border: `1px solid ${selectedReport === r.id && !selectedScenarioId ? BLUE : BORDER}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e2e8f0', fontSize: 12 }}>{r.label}</span>
                <span style={{ color: '#475569', fontSize: 9 }}>{r.pages}p</span>
              </div>
              <div style={{ color: '#64748b', fontSize: 10 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Scheduled */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>SCHEDULED REPORTS</div>
          {SCHEDULED_REPORTS.map(r => (
            <div key={r.label} style={{ padding: '8px 10px', background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 6, marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ color: '#e2e8f0', fontSize: 12 }}>{r.label}</span>
                <button style={{ background: 'none', border: 'none', color: BLUE, fontSize: 10, cursor: 'pointer' }}>Edit</button>
              </div>
              <div style={{ color: '#64748b', fontSize: 10 }}>{r.schedule} · Last: {r.lastSent}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Preview + Export */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, background: SURFACE, flexShrink: 0 }}>
          <span style={{ color: '#94a3b8', fontSize: 12, marginRight: 4 }}>
            {activeScenario ? activeScenario.name : STANDARD_REPORTS.find(r => r.id === selectedReport)?.label ?? 'Executive Network Summary'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {copyMsg && <span style={{ color: GREEN, fontSize: 11, alignSelf: 'center' }}>{copyMsg}</span>}
            {shareMsg && <span style={{ color: TEAL, fontSize: 10, alignSelf: 'center', maxWidth: 240 }}>{shareMsg}</span>}
            {artifactMsg && <span style={{ color: '#93c5fd', fontSize: 10, alignSelf: 'center', maxWidth: 320 }}>{artifactMsg}</span>}
            <AppButton onClick={downloadJson} variant="secondary" size="sm" style={{ fontSize: 11 }}>
              <Download size={12} /> Export JSON
            </AppButton>
            <AppButton onClick={handleCopy} variant="secondary" size="sm" style={{ fontSize: 11 }}>
              <Check size={12} /> Copy Summary
            </AppButton>
            <AppButton onClick={handleShare} variant="secondary" size="sm" style={{ fontSize: 11 }}>
              <Share2 size={12} /> Share Link
            </AppButton>
            <AppButton onClick={() => window.print()} variant="primary" size="sm" style={{ fontSize: 11 }}>
              <Printer size={12} /> Print
            </AppButton>
            <AppButton onClick={() => navigate('/app/decision-cockpit')} variant="warning" size="sm" style={{ fontSize: 11 }}>
              Decision Cockpit
            </AppButton>
          </div>
        </div>

        {/* Report Preview */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Document preview */}
            {isPreviewLoading ? (
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', marginBottom: 20, padding: 24 }} data-demo-anchor="demo-reports-preview">
                <div style={{ marginBottom: 10, color: '#1f2937', fontSize: 12, fontWeight: 600 }}>
                  Compiling executive report package...
                </div>
                <SkeletonBlock height={20} style={{ marginBottom: 10 }} />
                <SkeletonBlock height={12} style={{ marginBottom: 8 }} />
                <SkeletonBlock height={12} style={{ marginBottom: 8 }} />
                <SkeletonBlock height={12} width="86%" style={{ marginBottom: 16 }} />
                <SkeletonBlock height={150} style={{ marginBottom: 10 }} />
                <SkeletonBlock height={120} />
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', marginBottom: 20 }} data-demo-anchor="demo-reports-preview">
              {/* Report header band */}
              <div style={{ background: 'linear-gradient(135deg, #0A1628, #006EFF)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Patterson Companies</div>
                  <div style={{ color: '#93c5fd', fontSize: 12 }}>
                    {activeScenario ? `Scenario Analysis: ${activeScenario.name}` : 'Network Intelligence Report'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#93c5fd', fontSize: 11 }}>Generated</div>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{new Date().toLocaleDateString()}</div>
                  <div style={{ color: '#93c5fd', fontSize: 10 }}>Confidential</div>
                </div>
              </div>

              <div style={{ padding: '24px 28px' }}>
                {!activeScenario ? (
                  /* Executive Summary Report */
                  <>
                    <h2 style={{ color: '#0f172a', fontSize: 16, fontWeight: 700, marginBottom: 10, borderBottom: '2px solid #006EFF', paddingBottom: 6 }}>
                      Executive Summary
                    </h2>
                    <p style={{ color: '#334155', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
                      Patterson Companies' distribution network is performing at or above target across key service and cost metrics for the trailing twelve months.
                      The network OTIF of 97.2% exceeds the 97% target, and cost-per-order has declined 1.3% year-over-year to $14.82 driven by carrier contract improvements
                      and operational efficiency gains at the Elgin IL facility. Three fulfillment centers (Columbus OH, Harrisburg PA, Phoenix AZ) are above 85% utilization
                      and require near-term capacity planning attention heading into peak season.
                    </p>

                    <h3 style={{ color: '#0f172a', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>KPI Summary</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          {['Metric', 'Current', 'Target', 'Prior Period', 'Δ'].map(h => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#475569', fontSize: 11, fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {topKpis.map(kpi => (
                          <tr key={kpi.label} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '7px 10px', color: '#0f172a', fontSize: 12, fontWeight: 500 }}>{kpi.label}</td>
                            <td style={{ padding: '7px 10px', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>{kpi.value}</td>
                            <td style={{ padding: '7px 10px', color: '#64748b', fontSize: 12 }}>{kpiTarget[kpi.label]}</td>
                            <td style={{ padding: '7px 10px', color: '#64748b', fontSize: 12 }}>{kpiPrior[kpi.label]}</td>
                            <td style={{ padding: '7px 10px', fontSize: 12, color: kpi.delta.startsWith('+') && kpi.label === 'OTIF' ? '#10b981' : kpi.delta.startsWith('-') && kpi.label !== 'OTIF' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{kpi.delta}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <h3 style={{ color: '#0f172a', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔴 Top Risk Items</h3>
                        {['Columbus FC lease expires Oct 2025 — requires consolidation decision', 'FedEx Ground OTIF declining (-1.2pp) — carrier SBR recommended', 'Harrisburg capacity at 87% — seasonal surge risk Q3'].map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                            <span style={{ color: '#ef4444', fontSize: 11 }}>▶</span>
                            <span style={{ color: '#334155', fontSize: 11, lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3 style={{ color: '#0f172a', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>✅ Top Opportunities</h3>
                        {['SCN-003 Carrier Shift approved — $8.2M annual savings ready to capture', 'Elgin GTP automation: $5.9M labor savings, 22mo payback', 'Safety stock optimization: $3.4M inventory reduction'].map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                            <span style={{ color: '#10b981', fontSize: 11 }}>✓</span>
                            <span style={{ color: '#334155', fontSize: 11, lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: 10 }}>Prepared by Patterson SupplyIQ Digital Twin Engine · {new Date().toLocaleDateString()}</span>
                    </div>
                  </>
                ) : (
                  /* Scenario Pack */
                  <>
                    <h2 style={{ color: '#0f172a', fontSize: 16, fontWeight: 700, marginBottom: 4, borderBottom: '2px solid #006EFF', paddingBottom: 6 }}>
                      Scenario Analysis Pack
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
                      Type: {activeScenario.type} · Status: {activeScenario.status} · Version: v{activeScenario.version}
                    </p>

                    {activeScenario.result && (
                      <>
                        {(() => {
                          const result = activeScenario.result;
                          const baseline = activeScenario.baseline;
                          const annualSavings = result.annualSavingsUSD;
                          const capexUSD = getScenarioCapexUSD(activeScenario.parameters);
                          const otifDeltaPp = (result.otifPct - baseline.otifPct) * 100;
                          const costPerOrderDelta = result.costToServePerOrder - baseline.costToServePerOrder;
                          const carbonDeltaKgPerOrder = result.carbonKgPerOrder - baseline.carbonKgPerOrder;

                          return (
                            <>
                        <h3 style={{ color: '#0f172a', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Executive Summary</h3>
                        <p style={{ color: '#334155', fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>{result.executiveSummary}</p>

                        <h3 style={{ color: '#0f172a', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Financial Impact</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                          <tbody>
                            {[
                              ['Annual Savings', annualSavings != null ? formatCurrency(annualSavings) : 'N/A'],
                              ['NPV (3yr)', result.npv3yrUSD != null ? formatCurrency(result.npv3yrUSD) : 'N/A'],
                              ['Payback Period', result.paybackMonths ? `${result.paybackMonths} months` : 'N/A'],
                              ['CapEx Required', capexUSD != null ? formatCurrency(capexUSD) : 'None'],
                            ].map(([k, v]) => (
                              <tr key={k} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '7px 10px', color: '#475569', fontSize: 12 }}>{k}</td>
                                <td style={{ padding: '7px 10px', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>{v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <h3 style={{ color: '#0f172a', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Operational Impact</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                          <tbody>
                            {[
                              ['OTIF Delta', `${otifDeltaPp > 0 ? '+' : ''}${otifDeltaPp.toFixed(2)}pp`],
                              ['Cost/Order Delta', `${costPerOrderDelta > 0 ? '+' : ''}$${costPerOrderDelta.toFixed(2)}`],
                              ['Carbon Delta', `${carbonDeltaKgPerOrder > 0 ? '+' : ''}${carbonDeltaKgPerOrder.toFixed(2)} kg/order`],
                            ].map(([k, v]) => (
                              <tr key={k} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '7px 10px', color: '#475569', fontSize: 12 }}>{k}</td>
                                <td style={{ padding: '7px 10px', color: '#0f172a', fontSize: 12, fontWeight: 700 }}>{v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px' }}>
                          <span style={{ color: '#166534', fontSize: 12, fontWeight: 600 }}>
                            {(annualSavings ?? 0) > 0 ? '✓ Recommended for Implementation' : '⚠ Requires Further Review'}
                          </span>
                        </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </>
                )}
              </div>
              </div>
            )}

            {/* Report Activity */}
            <GlassCard>
              <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Report Activity</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Generated This Month', value: '24' },
                  { label: 'Last Export', value: '2h ago' },
                  { label: 'Scheduled Active', value: '2' },
                ].map(m => (
                  <div key={m.label} style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 12px' }}>
                    <div style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700 }}>{m.value}</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              {/* Mini bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 40 }}>
                {ACTIVITY.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: v * 4, background: `linear-gradient(to top, ${BLUE}, ${TEAL})`, borderRadius: 2 }} />
                    <span style={{ color: '#475569', fontSize: 9 }}>{DAYS[i]}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
