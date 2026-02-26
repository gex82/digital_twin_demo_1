import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Plus, Copy, CheckCircle, Lock, ChevronRight, ChevronLeft,
  Sliders, Building2, BarChart2, Clock, DollarSign, TrendingUp,
  AlertTriangle, X, Check, Loader2, NotebookText
} from 'lucide-react';
import { useScenarioStore } from '../../store/scenarioStore';
import { PRIMARY_FACILITIES } from '../../data/facilities';
import { SCENARIO_TYPE_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { StatusPill } from '../../components/ui/StatusPill';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScenarioCompareChart } from '../../components/charts/ScenarioCompareChart';
import type { Scenario, ScenarioParameter, ScenarioType } from '../../types';
import { useDemoStageBindings } from '../../hooks/useDemoStageBindings';
import { useUiStore } from '../../store/uiStore';
import { AppButton } from '../../components/ui/AppButton';

const SURFACE = '#1a2840';
const SURFACE2 = '#1e2f4a';
const BORDER = '#2e4168';
const BLUE = '#006EFF';
const TEAL = '#00C2A8';
const GREEN = '#10b981';
const RED = '#ef4444';
const YELLOW = '#f59e0b';

const FILTER_TABS = ['All', 'Draft', 'Complete', 'Approved'] as const;
type FilterTab = typeof FILTER_TABS[number];

const SCENARIO_TYPES: { type: ScenarioType; label: string; desc: string; icon: typeof Building2 }[] = [
  { type: 'FCConsolidation', label: 'FC Consolidation', desc: 'Merge under-utilized FCs to reduce fixed cost', icon: Building2 },
  { type: 'FCExpansion', label: 'FC Expansion', desc: 'Add or expand FC footprint for coverage and growth', icon: Building2 },
  { type: 'CarrierShift', label: 'Carrier Strategy Shift', desc: 'Reallocate volume across carrier network', icon: TrendingUp },
  { type: 'AutomationROI', label: 'Automation ROI', desc: 'Model GTP, voice pick, or robotics investment', icon: Sliders },
  { type: 'DisruptionResponse', label: 'Disruption Response', desc: 'Simulate weather, strike, or capacity shock', icon: AlertTriangle },
  { type: 'InventoryReposition', label: 'Inventory Reposition', desc: 'Optimize safety stock placement by SKU', icon: BarChart2 },
  { type: 'HubSatelliteRedesign', label: 'Hub-Satellite Redesign', desc: 'Restructure network topology with hub and satellites', icon: Building2 },
  { type: 'DemandSurge', label: 'Demand Surge', desc: 'Stress-test network against abrupt volume increases', icon: TrendingUp },
];

export default function ScenarioSimulator() {
  const {
    scenarios, activeScenarioId, setActiveScenario,
    comparisonScenarioIds, addToComparison, removeFromComparison,
    isSimulating, simulationProgress, simulationLog,
    runScenario, runScenarioAsync, createScenario, createScenarioFromTemplate, duplicateScenario,
    approveScenario, lockScenario,
  } = useScenarioStore();

  const [filter, setFilter] = useState<FilterTab>('All');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showAssumptionsLog, setShowAssumptionsLog] = useState(false);
  const [builderStep, setBuilderStep] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [newScenario, setNewScenario] = useState<{
    type: ScenarioType;
    name: string;
    facilities: string[];
    params: Record<string, number | string>;
    horizon: number;
  }>({
    type: 'FCConsolidation',
    name: '',
    facilities: [],
    params: {},
    horizon: 24,
  });
  const logRef = useRef<HTMLDivElement>(null);
  const lastCompletedRunKey = useRef<string>('');
  const pushToast = useUiStore((state) => state.pushToast);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [simulationLog]);

  useEffect(() => {
    const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId);
    if (!activeScenario || isSimulating || activeScenario.status !== 'Complete' || !activeScenario.result) return;
    const runKey = `${activeScenario.id}-${activeScenario.runDurationMs ?? 0}`;
    if (runKey === lastCompletedRunKey.current) return;
    lastCompletedRunKey.current = runKey;
    pushToast({
      title: 'Scenario Run Complete',
      message: `${activeScenario.name} finished in ${(activeScenario.runDurationMs ?? 0).toLocaleString()}ms.`,
      tone: 'success',
    });
  }, [activeScenarioId, isSimulating, pushToast, scenarios]);

  const filtered = scenarios.filter(s => {
    if (filter === 'All') return true;
    if (filter === 'Draft') return s.status === 'Draft';
    if (filter === 'Complete') return s.status === 'Complete';
    if (filter === 'Approved') return s.status === 'Approved';
    return true;
  });

  const active = scenarios.find(s => s.id === activeScenarioId);
  const comparison = scenarios.filter(s => comparisonScenarioIds.includes(s.id));
  const baselineScenario = scenarios.find(s => s.isBaseline) ?? null;

  useDemoStageBindings('/app/scenarios', useMemo(() => ({
    SCENARIO_CREATE_PREFILLED: async (action) => {
      const templateId = typeof action.payload?.templateId === 'string' ? action.payload.templateId : 'SCN-001';
      const id = createScenarioFromTemplate(templateId, {
        name: 'Demo: Midwest Consolidation Candidate',
        assumptionNotes: 'Assumptions locked for guided demo. Focus: cost-service tradeoff with risk controls.',
      });
      setActiveScenario(id);
      setCompareMode(false);
    },
    SCENARIO_SET_ASSUMPTIONS: async () => {
      setCompareMode(false);
      setShowBuilder(false);
      if (activeScenarioId) {
        setActiveScenario(activeScenarioId);
      }
    },
    SCENARIO_RUN_ACTIVE_AND_WAIT: async () => {
      const targetId = useScenarioStore.getState().activeScenarioId;
      if (!targetId) return;
      await runScenarioAsync(targetId);
      setCompareMode(false);
    },
  }), [activeScenarioId, createScenarioFromTemplate, runScenarioAsync, setActiveScenario]));

  function handleRunScenario() {
    if (!activeScenarioId) return;
    runScenario(activeScenarioId);
  }

  function handleCreate() {
    const id = createScenario({
      type: newScenario.type,
      name: newScenario.name || `New ${SCENARIO_TYPE_LABELS[newScenario.type]} Scenario`,
      parameters: [],
    });
    setActiveScenario(id);
    pushToast({
      title: 'Scenario Draft Created',
      message: `Initialized ${newScenario.name || SCENARIO_TYPE_LABELS[newScenario.type]} with editable assumptions.`,
      tone: 'info',
    });
    setShowBuilder(false);
    setShowAssumptionsLog(true);
    setBuilderStep(1);
    setNewScenario({ type: 'FCConsolidation', name: '', facilities: [], params: {}, horizon: 24 });
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#0A1628' }}>

      {/* LEFT: Scenario List */}
      <div style={{ width: 320, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${BORDER}` }} data-demo-anchor="demo-scenario-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scenarios</span>
            <button
              onClick={() => setShowBuilder(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: BLUE, border: 'none', color: '#fff', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
            >
              <Plus size={12} /> New
            </button>
          </div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {FILTER_TABS.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  flex: 1, padding: '4px 0', fontSize: 11, border: 'none', borderRadius: 4, cursor: 'pointer',
                  background: filter === t ? SURFACE2 : 'transparent',
                  color: filter === t ? '#e2e8f0' : '#64748b',
                }}
              >{t}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => setActiveScenario(s.id)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: `1px solid ${BORDER}`,
                borderLeft: s.id === activeScenarioId ? `3px solid ${BLUE}` : '3px solid transparent',
                background: s.id === activeScenarioId ? `${BLUE}10` : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{s.name}</span>
                <span style={{ color: '#475569', fontSize: 10, marginLeft: 8, flexShrink: 0 }}>v{s.version}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusPill status={s.status} size="sm" />
                {s.result && (s.result.annualSavingsUSD ?? 0) > 0 && (
                  <span style={{ color: GREEN, fontSize: 11 }}>
                    +{formatCurrency(s.result.annualSavingsUSD ?? 0)}/yr
                  </span>
                )}
              </div>
              {/* Compare checkbox */}
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={comparisonScenarioIds.includes(s.id)}
                  onChange={e => {
                    e.stopPropagation();
                    if (e.target.checked) addToComparison(s.id);
                    else removeFromComparison(s.id);
                  }}
                  style={{ accentColor: TEAL, cursor: 'pointer' }}
                />
                <span style={{ color: '#475569', fontSize: 10 }}>Compare</span>
              </div>
            </div>
          ))}
        </div>

        {comparisonScenarioIds.length > 0 && (
          <div style={{ padding: 12, borderTop: `1px solid ${BORDER}` }}>
            <button
              onClick={() => setCompareMode(!compareMode)}
              style={{
                width: '100%', padding: '8px', background: compareMode ? TEAL : SURFACE2,
                border: `1px solid ${BORDER}`, borderRadius: 6, color: compareMode ? '#0A1628' : '#e2e8f0',
                fontSize: 12, cursor: 'pointer', fontWeight: 600,
              }}
            >
              {compareMode ? 'Exit Compare' : `Compare ${comparisonScenarioIds.length} Scenarios`}
            </button>
          </div>
        )}
      </div>

      {/* MAIN PANEL */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} data-demo-anchor="demo-scenario-results">

        {/* Compare Mode */}
        {compareMode && comparison.length > 0 ? (
          <div>
            <h2 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              Scenario Comparison
            </h2>
            <GlassCard style={{ marginBottom: 24 }}>
              {baselineScenario && (
                <ScenarioCompareChart
                  baseline={baselineScenario}
                  scenarios={comparison}
                  height={320}
                />
              )}
            </GlassCard>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparison.length}, 1fr)`, gap: 16 }}>
              {comparison.map(s => {
                const otifDelta = s.result ? (s.result.otifPct - s.baseline.otifPct) * 100 : 0;
                const costDelta = s.result ? s.result.costToServePerOrder - s.baseline.costToServePerOrder : 0;
                return (
                  <GlassCard key={s.id}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{s.name}</span>
                      <span style={{ marginLeft: 8 }}>
                        <StatusPill status={s.status} size="sm" />
                      </span>
                    </div>
                    {s.result && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <MetricRow label="Annual Savings" value={formatCurrency(s.result.annualSavingsUSD ?? 0)} positive={(s.result.annualSavingsUSD ?? 0) > 0} />
                        <MetricRow label="OTIF Delta" value={`${otifDelta > 0 ? '+' : ''}${otifDelta.toFixed(2)}pp`} positive={otifDelta > 0} />
                        <MetricRow label="Cost/Order" value={`${costDelta > 0 ? '+' : ''}$${Math.abs(costDelta).toFixed(2)}`} positive={costDelta < 0} />
                        {s.result.npv3yrUSD != null && <MetricRow label="NPV (3yr)" value={formatCurrency(s.result.npv3yrUSD)} positive={s.result.npv3yrUSD > 0} />}
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ) : active ? (
          /* SCENARIO DETAIL */
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h2 style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 700, margin: 0 }}>{active.name}</h2>
                  <StatusPill status={active.status} />
                  <span style={{ color: '#475569', fontSize: 11 }}>v{active.version}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 12 }}>
                  <span>Type: <span style={{ color: '#94a3b8' }}>{SCENARIO_TYPE_LABELS[active.type]}</span></span>
                  <span>By: <span style={{ color: '#94a3b8' }}>{active.createdBy}</span></span>
                  <span>Created: <span style={{ color: '#94a3b8' }}>{new Date(active.createdAt).toLocaleDateString()}</span></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(active.status === 'Draft' || active.status === 'Complete') && (
                  <button
                    onClick={handleRunScenario}
                    disabled={isSimulating}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: isSimulating ? SURFACE2 : BLUE, border: 'none',
                      color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13,
                      cursor: isSimulating ? 'not-allowed' : 'pointer', fontWeight: 600,
                    }}
                  >
                    {isSimulating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
                    {isSimulating ? 'Running...' : 'Run Simulation'}
                  </button>
                )}
                {active.status === 'Complete' && (
                  <button
                    onClick={() => approveScenario(active.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: GREEN, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Check size={14} /> Approve
                  </button>
                )}
                {active.status === 'Approved' && (
                  <button
                    onClick={() => lockScenario(active.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#9333ea', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Lock size={14} /> Lock
                  </button>
                )}
                <AppButton variant="secondary" onClick={() => setShowAssumptionsLog(true)}>
                  <NotebookText size={14} />
                  Assumptions Log
                </AppButton>
                <button
                  onClick={() => duplicateScenario(active.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: SURFACE2, border: `1px solid ${BORDER}`, color: '#94a3b8', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Simulation Progress */}
            {isSimulating && (
              <GlassCard style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
                    Running MILP Optimization Engine...
                  </span>
                  <span style={{ color: TEAL, fontSize: 12, fontWeight: 700 }}>{simulationProgress}%</span>
                </div>
                <div style={{ background: SURFACE2, borderRadius: 4, height: 6, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${simulationProgress}%`, background: `linear-gradient(90deg, ${BLUE}, ${TEAL})`, transition: 'width 0.3s ease', borderRadius: 4 }} />
                </div>
                <div
                  ref={logRef}
                  style={{ background: '#0A1628', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 10, height: 140, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11 }}
                >
                  {simulationLog.map((line, i) => (
                    <div key={i} style={{ color: i === simulationLog.length - 1 ? TEAL : '#64748b', marginBottom: 2 }}>{line}</div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Result KPIs */}
            {active.result && !isSimulating && (() => {
              const r = active.result;
              const b = active.baseline;
              const otifDelta = (r.otifPct - b.otifPct) * 100;
              const costDelta = r.costToServePerOrder - b.costToServePerOrder;
              const carbonDelta = r.carbonKgPerOrder - b.carbonKgPerOrder;
              const uncertaintySummary = buildUncertaintySummary(active);
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    <ResultKpiCard
                      label="Annual Savings"
                      value={formatCurrency(r.annualSavingsUSD ?? 0)}
                      icon={DollarSign}
                      color={(r.annualSavingsUSD ?? 0) > 0 ? GREEN : RED}
                    />
                    <ResultKpiCard
                      label="OTIF Delta"
                      value={`${otifDelta > 0 ? '+' : ''}${otifDelta.toFixed(2)}pp`}
                      icon={TrendingUp}
                      color={otifDelta >= 0 ? GREEN : YELLOW}
                    />
                    <ResultKpiCard
                      label="Cost/Order Delta"
                      value={`${costDelta > 0 ? '+' : ''}$${costDelta.toFixed(2)}`}
                      icon={BarChart2}
                      color={costDelta <= 0 ? GREEN : RED}
                    />
                    {r.paybackMonths ? (
                      <ResultKpiCard
                        label="Payback Period"
                        value={`${r.paybackMonths}mo`}
                        icon={Clock}
                        color={BLUE}
                      />
                    ) : (
                      <ResultKpiCard
                        label="Carbon Delta"
                        value={`${carbonDelta.toFixed(0)}t CO₂`}
                        icon={TrendingUp}
                        color={carbonDelta <= 0 ? GREEN : YELLOW}
                      />
                    )}
                  </div>

                  <GlassCard style={{ marginBottom: 16 }} data-demo-anchor="demo-scenario-uncertainty">
                    <div style={{ marginBottom: 12 }}>
                      <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        Uncertainty & Sensitivity
                      </h3>
                      <p style={{ color: '#cbd5e1', fontSize: 12, margin: 0 }}>
                        Confidence score {uncertaintySummary.confidenceScore}% based on parameter volatility and implementation complexity.
                      </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {uncertaintySummary.drivers.map((driver) => (
                        <div key={driver.label} style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>{driver.label}</div>
                          <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{driver.value}</div>
                          <div style={{ color: driver.riskLevel === 'High' ? '#f59e0b' : driver.riskLevel === 'Medium' ? '#93c5fd' : '#86efac', fontSize: 10, fontWeight: 600 }}>
                            {driver.riskLevel} sensitivity
                          </div>
                          <div style={{ color: '#64748b', fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>{driver.note}</div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Executive Summary */}
                  <GlassCard style={{ marginBottom: 16 }}>
                    <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Executive Summary</h3>
                    <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{r.executiveSummary}</p>
                  </GlassCard>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Affected Facilities */}
                    {r.affectedFacilities && r.affectedFacilities.length > 0 && (
                      <GlassCard>
                        <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Affected Facilities</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {r.affectedFacilities.map(fid => {
                            const fc = PRIMARY_FACILITIES.find(f => f.id === fid);
                            return (
                              <div key={fid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE }} />
                                <span style={{ color: '#e2e8f0', fontSize: 13 }}>{fc ? `${fc.shortName} – ${fc.city}, ${fc.state}` : fid}</span>
                              </div>
                            );
                          })}
                        </div>
                      </GlassCard>
                    )}

                    {/* Financial Details */}
                    {r.npv3yrUSD != null && (
                      <GlassCard>
                        <h3 style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Financial Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <MetricRow label="NPV (3yr)" value={formatCurrency(r.npv3yrUSD)} positive={r.npv3yrUSD > 0} />
                          {r.paybackMonths != null && <MetricRow label="Payback Period" value={`${r.paybackMonths} months`} positive={true} />}
                          <MetricRow label="Annual Run-Rate Savings" value={formatCurrency(r.annualSavingsUSD ?? 0)} positive={(r.annualSavingsUSD ?? 0) > 0} />
                        </div>
                      </GlassCard>
                    )}
                  </div>
                </>
              );
            })()}

            {/* No results yet */}
            {!active.result && !isSimulating && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
                <Play size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>Run the simulation to compute network impact analysis</p>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: '#475569' }}>
            <BarChart2 size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 16, color: '#64748b' }}>Select a scenario from the list</p>
            <p style={{ fontSize: 13 }}>or create a new one to begin modeling</p>
          </div>
        )}
      </div>

      {showAssumptionsLog && active && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.58)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 460, maxWidth: '100%', background: SURFACE, borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>Assumptions Log</div>
                <div style={{ color: '#64748b', fontSize: 11 }}>{active.name} · v{active.version}</div>
              </div>
              <button
                onClick={() => setShowAssumptionsLog(false)}
                style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}
                aria-label="Close assumptions log"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 16, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <GlassCard noPadding>
                <div style={{ padding: 12 }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Scenario Notes
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.6 }}>
                    {active.assumptionNotes || 'No additional assumption notes supplied.'}
                  </div>
                </div>
              </GlassCard>

              <GlassCard noPadding>
                <div style={{ padding: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Parameter Baseline
                  </div>
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {active.parameters.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: 11 }}>No tunable parameters for this scenario.</div>
                  ) : (
                    active.parameters.map((parameter) => (
                      <div key={parameter.key} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 8, borderBottom: '1px dashed #253652', paddingBottom: 6 }}>
                        <div>
                          <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{parameter.label}</div>
                          <div style={{ color: '#64748b', fontSize: 10 }}>{parameter.key}</div>
                        </div>
                        <div style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                          {String(parameter.value)}{parameter.unit ? ` ${parameter.unit}` : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              <GlassCard noPadding data-demo-anchor="demo-scenario-assumptions-log">
                <div style={{ padding: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Audit Timeline
                  </div>
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {active.auditLog.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: 11 }}>No audit events recorded.</div>
                  ) : (
                    active.auditLog
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <div key={`${entry.timestamp}-${entry.action}`} style={{ borderLeft: '2px solid #335581', paddingLeft: 8 }}>
                          <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700 }}>{entry.action}</div>
                          <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.45 }}>{entry.details}</div>
                          <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>
                            {entry.user} · {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* NEW SCENARIO BUILDER MODAL */}
      {showBuilder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, width: 560, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>New Scenario — Step {builderStep} of 5</span>
              <button onClick={() => { setShowBuilder(false); setBuilderStep(1); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div style={{ padding: '12px 20px', display: 'flex', gap: 6 }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= builderStep ? BLUE : SURFACE2 }} />
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
              {/* Step 1: Scenario Type */}
              {builderStep === 1 && (
                <div>
                  <h3 style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 4 }}>Select Scenario Type</h3>
                  <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Choose what kind of network change you want to model</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {SCENARIO_TYPES.map(({ type, label, desc, icon: Icon }) => (
                      <button
                        key={type}
                        onClick={() => setNewScenario(s => ({ ...s, type }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                          background: newScenario.type === type ? `${BLUE}20` : SURFACE2,
                          border: `1px solid ${newScenario.type === type ? BLUE : BORDER}`,
                          borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <Icon size={18} style={{ color: newScenario.type === type ? BLUE : '#64748b', flexShrink: 0 }} />
                        <div>
                          <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{label}</div>
                          <div style={{ color: '#64748b', fontSize: 11 }}>{desc}</div>
                        </div>
                        {newScenario.type === type && <CheckCircle size={14} style={{ marginLeft: 'auto', color: BLUE }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Facilities */}
              {builderStep === 2 && (
                <div>
                  <h3 style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 4 }}>Select Affected Facilities</h3>
                  <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Choose which FCs will be impacted by this scenario</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {PRIMARY_FACILITIES.map(fc => (
                      <label
                        key={fc.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                          background: newScenario.facilities.includes(fc.id) ? `${BLUE}15` : SURFACE2,
                          border: `1px solid ${newScenario.facilities.includes(fc.id) ? BLUE : BORDER}`,
                          borderRadius: 6, cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newScenario.facilities.includes(fc.id)}
                          onChange={e => {
                            setNewScenario(s => ({
                              ...s,
                              facilities: e.target.checked
                                ? [...s.facilities, fc.id]
                                : s.facilities.filter(id => id !== fc.id),
                            }));
                          }}
                          style={{ accentColor: BLUE }}
                        />
                        <div>
                          <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{fc.shortName}</div>
                          <div style={{ color: '#64748b', fontSize: 10 }}>{fc.city}, {fc.state}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: 10, color: fc.utilizationPct >= 0.85 ? YELLOW : '#64748b' }}>
                          {(fc.utilizationPct * 100).toFixed(0)}%
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Parameters */}
              {builderStep === 3 && (
                <div>
                  <h3 style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 4 }}>Configure Parameters</h3>
                  <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Adjust the model inputs for this scenario</p>
                  <ParameterSliders type={newScenario.type} params={newScenario.params} onChange={params => setNewScenario(s => ({ ...s, params }))} />
                </div>
              )}

              {/* Step 4: Time Horizon */}
              {builderStep === 4 && (
                <div>
                  <h3 style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 4 }}>Time Horizon</h3>
                  <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>How far forward should this scenario be modeled?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[12, 24, 36].map(h => (
                      <button
                        key={h}
                        onClick={() => setNewScenario(s => ({ ...s, horizon: h }))}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                          background: newScenario.horizon === h ? `${BLUE}20` : SURFACE2,
                          border: `1px solid ${newScenario.horizon === h ? BLUE : BORDER}`,
                          borderRadius: 8, cursor: 'pointer',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ color: '#e2e8f0', fontSize: 13 }}>{h} Months</div>
                          <div style={{ color: '#64748b', fontSize: 11 }}>
                            {h === 12 ? 'Short-term tactical' : h === 24 ? 'Medium-term operational' : 'Long-term strategic'}
                          </div>
                        </div>
                        {newScenario.horizon === h && <CheckCircle size={16} style={{ color: BLUE }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {builderStep === 5 && (
                <div>
                  <h3 style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 4 }}>Review & Create</h3>
                  <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Confirm configuration before running simulation</p>
                  <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <MetricRow label="Type" value={SCENARIO_TYPE_LABELS[newScenario.type]} positive />
                      <MetricRow label="Facilities" value={`${newScenario.facilities.length} selected`} positive />
                      <MetricRow label="Time Horizon" value={`${newScenario.horizon} months`} positive />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginBottom: 4 }}>Scenario Name</label>
                    <input
                      value={newScenario.name}
                      onChange={e => setNewScenario(s => ({ ...s, name: e.target.value }))}
                      placeholder={`New ${SCENARIO_TYPE_LABELS[newScenario.type]} Scenario`}
                      style={{
                        width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`,
                        borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: 13,
                        outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => builderStep > 1 ? setBuilderStep(s => s - 1) : setShowBuilder(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: SURFACE2, border: `1px solid ${BORDER}`, color: '#94a3b8', borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}
              >
                <ChevronLeft size={14} /> {builderStep === 1 ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={() => builderStep < 5 ? setBuilderStep(s => s + 1) : handleCreate()}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: BLUE, border: 'none', color: '#fff', borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
              >
                {builderStep === 5 ? <><Check size={14} /> Create Scenario</> : <>Next <ChevronRight size={14} /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SensitivityDriver {
  label: string;
  value: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  note: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function numericScenarioParam(parameters: ScenarioParameter[], key: string, fallback: number): number {
  const raw = parameters.find((parameter) => parameter.key === key)?.value;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function classifyRisk(value: number, mediumThreshold: number, highThreshold: number): 'Low' | 'Medium' | 'High' {
  if (value >= highThreshold) return 'High';
  if (value >= mediumThreshold) return 'Medium';
  return 'Low';
}

function buildUncertaintySummary(scenario: Scenario): { confidenceScore: number; drivers: SensitivityDriver[] } {
  const baseline = scenario.baseline;
  const result = scenario.result ?? baseline;
  const otifDeltaPp = Math.abs((result.otifPct - baseline.otifPct) * 100);
  const demandVolatility = Math.max(
    numericScenarioParam(scenario.parameters, 'demandGrowth', 8),
    numericScenarioParam(scenario.parameters, 'demandSurgePct', 0),
    numericScenarioParam(scenario.parameters, 'volumeRedirectPct', 0)
  );
  const capexMillions = Math.max(
    numericScenarioParam(scenario.parameters, 'capexBudget', 0),
    numericScenarioParam(scenario.parameters, 'capexUSD', 0),
    numericScenarioParam(scenario.parameters, 'totalCapex', 0),
    numericScenarioParam(scenario.parameters, 'capexMillions', 0)
  );
  const transitShiftDays = Math.abs(result.totalTransitDaysAvg - baseline.totalTransitDaysAvg);

  const confidencePenalty = otifDeltaPp * 5.5 + demandVolatility * 0.45 + capexMillions * 1.6 + transitShiftDays * 12;
  const confidenceScore = Math.round(clamp(94 - confidencePenalty, 61, 97));

  const drivers: SensitivityDriver[] = [
    {
      label: 'Demand & Volume Shock',
      value: `${demandVolatility.toFixed(1)}% swing modeled`,
      riskLevel: classifyRisk(demandVolatility, 10, 20),
      note: 'Higher demand volatility increases route and labor uncertainty.',
    },
    {
      label: 'Service Buffer',
      value: `${otifDeltaPp.toFixed(2)}pp OTIF movement`,
      riskLevel: classifyRisk(otifDeltaPp, 0.6, 1.2),
      note: 'OTIF movement is the strongest predictor of operational execution risk.',
    },
    {
      label: 'Capital / Execution Exposure',
      value: capexMillions > 0 ? `$${capexMillions.toFixed(1)}M implementation` : 'Operational change only',
      riskLevel: capexMillions > 12 ? 'High' : capexMillions > 3 ? 'Medium' : 'Low',
      note: capexMillions > 0 ? 'CapEx assumptions are sensitive to schedule and vendor readiness.' : 'No capex dependency; impact driven by run-rate operations.',
    },
  ];

  return { confidenceScore, drivers };
}

function MetricRow({ label, value, positive, neutral }: { label: string; value: string; positive: boolean; neutral?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
      <span style={{ color: neutral ? '#94a3b8' : positive ? GREEN : '#94a3b8', fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ResultKpiCard({ label, value, color, icon: Icon }: {
  label: string; value: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string;
}) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={14} style={{ color }} />
        <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ color: color, fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function ParameterSliders({ type, params, onChange }: {
  type: ScenarioType;
  params: Record<string, number | string>;
  onChange: (p: Record<string, number | string>) => void;
}) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const recalcTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (recalcTimer.current != null) {
      window.clearTimeout(recalcTimer.current);
    }
  }, []);

  const update = (key: string, val: number | string) => {
    onChange({ ...params, [key]: val });
    setIsRecalculating(true);
    if (recalcTimer.current != null) {
      window.clearTimeout(recalcTimer.current);
    }
    recalcTimer.current = window.setTimeout(() => {
      setIsRecalculating(false);
      recalcTimer.current = null;
    }, 520);
  };

  const recalculationNotice = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        fontSize: 11,
        color: isRecalculating ? '#00C2A8' : '#64748b',
        transition: 'color 0.2s ease',
      }}
    >
      <Clock size={12} />
      {isRecalculating ? 'Recalculating scenario sensitivity...' : 'Adjust sliders to preview sensitivity impact.'}
    </div>
  );

  const Slider = ({ label, paramKey, min, max, step = 1, unit = '%' }: {
    label: string; paramKey: string; min: number; max: number; step?: number; unit?: string;
  }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
        <span style={{ color: BLUE, fontSize: 12, fontWeight: 600 }}>{params[paramKey] ?? min}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={(params[paramKey] as number) ?? min}
        onChange={e => update(paramKey, Number(e.target.value))}
        style={{ width: '100%', accentColor: BLUE }}
      />
    </div>
  );

  if (type === 'FCConsolidation') return (
    <>
      {recalculationNotice}
      <Slider label="Volume Redirect %" paramKey="volumeRedirectPct" min={0} max={100} />
      <Slider label="Labor Savings %" paramKey="laborSavingsPct" min={0} max={50} />
    </>
  );
  if (type === 'CarrierShift') return (
    <>
      {recalculationNotice}
      <Slider label="Shift Volume %" paramKey="shiftVolumePct" min={0} max={80} />
      <Slider label="Rate Reduction %" paramKey="rateReduction" min={0} max={8} step={0.1} />
    </>
  );
  if (type === 'AutomationROI') return (
    <>
      {recalculationNotice}
      <Slider label="CapEx ($M)" paramKey="capexMillions" min={0} max={10} step={0.5} unit="M" />
      <Slider label="Labor Reduction %" paramKey="laborReductionPct" min={0} max={60} />
    </>
  );
  if (type === 'DisruptionResponse') return (
    <>
      {recalculationNotice}
      <Slider label="Affected FC Count" paramKey="affectedFCCount" min={1} max={4} unit="" />
      <Slider label="Disruption Duration (days)" paramKey="durationDays" min={1} max={30} unit=" days" />
    </>
  );
  if (type === 'InventoryReposition') return (
    <>
      {recalculationNotice}
      <Slider label="Inventory Reduction %" paramKey="inventoryReductionPct" min={0} max={30} />
    </>
  );
  if (type === 'FCExpansion') return (
    <>
      {recalculationNotice}
      <Slider label="Demand Growth %" paramKey="demandGrowth" min={0} max={20} />
      <Slider label="CapEx Budget ($M)" paramKey="capexBudget" min={6} max={24} step={0.5} unit="M" />
      <Slider label="Hub Size (K sqft)" paramKey="hubSqFt" min={30} max={80} step={5} unit="K" />
    </>
  );
  if (type === 'DemandSurge') return (
    <>
      {recalculationNotice}
      <Slider label="Demand Surge %" paramKey="demandSurgePct" min={10} max={50} />
      <Slider label="Surge Duration (days)" paramKey="surgeDuration" min={30} max={180} unit=" days" />
      <Slider label="Volume Redirect %" paramKey="volumeRedirectPct" min={0} max={60} />
    </>
  );
  if (type === 'HubSatelliteRedesign') return (
    <>
      {recalculationNotice}
      <Slider label="Satellites per Hub" paramKey="satelliteCount" min={3} max={8} unit="" />
      <Slider label="Total CapEx ($M)" paramKey="totalCapex" min={8} max={25} step={0.5} unit="M" />
      <Slider label="Automation Enablement %" paramKey="automationEnablementPct" min={0} max={100} />
    </>
  );
  return null;
}
