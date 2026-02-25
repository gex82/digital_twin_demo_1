import { useMemo } from 'react';
import { CheckCircle2, ClipboardCheck, FileCheck2, Shield, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { AppButton } from '../../components/ui/AppButton';
import { useScenarioStore } from '../../store/scenarioStore';
import { useUiStore, type DecisionApprovalStageId } from '../../store/uiStore';
import { formatCurrency } from '../../utils/formatters';
import { useDemoStageBindings } from '../../hooks/useDemoStageBindings';
import { useShallow } from 'zustand/react/shallow';

const APPROVER_NAME: Record<DecisionApprovalStageId, string> = {
  analyst: 'A. Kowalski',
  director: 'R. Chen',
  vp: 'J. Mitchell',
};

const STAGE_ACTION_LABEL: Record<DecisionApprovalStageId, string> = {
  analyst: 'Analyst Review',
  director: 'Director Approval',
  vp: 'VP Sign-Off',
};

const IMPLEMENTATION_STEPS = [
  { label: 'Carrier Contract Amendment', owner: 'Procurement', eta: '5 days', status: 'Ready' },
  { label: 'Route Playbook Update', owner: 'Network Ops', eta: '7 days', status: 'Ready' },
  { label: 'Service Guardrail Monitoring', owner: 'Service Ops', eta: '14 days', status: 'Scheduled' },
  { label: 'Savings Realization Review', owner: 'Finance', eta: '30 days', status: 'Planned' },
];

function canApproveStage(
  stageId: DecisionApprovalStageId,
  stages: Array<{ id: DecisionApprovalStageId; status: 'pending' | 'approved' }>
): boolean {
  if (stageId === 'analyst') return true;
  if (stageId === 'director') return stages.find((stage) => stage.id === 'analyst')?.status === 'approved';
  return stages.find((stage) => stage.id === 'director')?.status === 'approved';
}

export default function DecisionCockpit() {
  const navigate = useNavigate();
  const {
    scenarios,
    activeScenarioId,
    setActiveScenario,
    appendScenarioAuditEntry,
  } = useScenarioStore(
    useShallow((state) => ({
      scenarios: state.scenarios,
      activeScenarioId: state.activeScenarioId,
      setActiveScenario: state.setActiveScenario,
      appendScenarioAuditEntry: state.appendScenarioAuditEntry,
    }))
  );
  const {
    decisionWorkflow,
    initializeDecisionWorkflow,
    approveDecisionStage,
    markDecisionExport,
    pushToast,
  } = useUiStore(
    useShallow((state) => ({
      decisionWorkflow: state.decisionWorkflow,
      initializeDecisionWorkflow: state.initializeDecisionWorkflow,
      approveDecisionStage: state.approveDecisionStage,
      markDecisionExport: state.markDecisionExport,
      pushToast: state.pushToast,
    }))
  );

  useDemoStageBindings('/app/decision-cockpit');

  const workflowScenario = decisionWorkflow.scenarioId
    ? scenarios.find((scenario) => scenario.id === decisionWorkflow.scenarioId)
    : null;
  const fallbackScenario = useMemo(
    () =>
      scenarios
        .filter((scenario) => scenario.result)
        .sort((a, b) => (b.result?.annualSavingsUSD ?? 0) - (a.result?.annualSavingsUSD ?? 0))[0] ?? null,
    [scenarios]
  );
  const activeScenario = workflowScenario ?? scenarios.find((scenario) => scenario.id === activeScenarioId) ?? fallbackScenario;
  const result = activeScenario?.result;
  const baseline = activeScenario?.baseline;

  const approvalsComplete = decisionWorkflow.stages.every((stage) => stage.status === 'approved');

  function loadScenarioContext() {
    if (!activeScenario) return;
    setActiveScenario(activeScenario.id);
    initializeDecisionWorkflow(activeScenario.id, activeScenario.name);
    pushToast({
      title: 'Decision Context Loaded',
      message: `${activeScenario.name} is now the active decision packet.`,
      tone: 'info',
    });
  }

  function approveStage(stageId: DecisionApprovalStageId) {
    if (!canApproveStage(stageId, decisionWorkflow.stages)) {
      pushToast({
        title: 'Approval Order Enforced',
        message: 'Complete earlier approval stages before continuing.',
        tone: 'warning',
      });
      return;
    }

    approveDecisionStage(stageId, APPROVER_NAME[stageId]);
    if (activeScenario) {
      appendScenarioAuditEntry(activeScenario.id, {
        user: APPROVER_NAME[stageId],
        action: STAGE_ACTION_LABEL[stageId],
        details: `${STAGE_ACTION_LABEL[stageId]} completed in Decision Cockpit.`,
      });
    }
    pushToast({
      title: `${STAGE_ACTION_LABEL[stageId]} Complete`,
      message: `${APPROVER_NAME[stageId]} approved this decision stage.`,
      tone: 'success',
    });
  }

  function generateBoardPack() {
    if (!activeScenario) return;
    const artifact = `${activeScenario.name.replace(/\s+/g, '-').toLowerCase()}-board-pack-${new Date().toISOString().slice(0, 10)}.pdf`;
    markDecisionExport(artifact);
    appendScenarioAuditEntry(activeScenario.id, {
      user: 'System',
      action: 'Board Pack Exported',
      details: `Generated artifact ${artifact}`,
    });
    pushToast({
      title: 'Board Pack Generated',
      message: `${artifact} ready for executive distribution.`,
      tone: 'success',
    });
  }

  if (!activeScenario || !result || !baseline) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <GlassCard>
          <div style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Decision Cockpit</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
            No complete scenario available yet. Run a scenario and generate a report pack first.
          </div>
          <AppButton onClick={() => navigate('/app/scenarios')} variant="primary">Open Scenario Simulator</AppButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GlassCard data-demo-anchor="demo-cockpit-summary">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div>
            <div style={{ color: '#93c5fd', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Decision Cockpit
            </div>
            <div style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{activeScenario.name}</div>
            <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5, maxWidth: 760 }}>
              {result.executiveSummary}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <AppButton onClick={loadScenarioContext} variant="secondary" size="sm">Refresh Context</AppButton>
            <AppButton onClick={() => navigate('/app/reports')} variant="secondary" size="sm">Open Reports</AppButton>
          </div>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <GlassCard>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Annual Savings</div>
          <div style={{ color: '#10b981', fontSize: 20, fontWeight: 800 }}>{formatCurrency(result.annualSavingsUSD ?? 0)}</div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>vs baseline {formatCurrency(baseline.networkCostUSD)}</div>
        </GlassCard>
        <GlassCard>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>OTIF Delta</div>
          <div style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 800 }}>{((result.otifPct - baseline.otifPct) * 100).toFixed(2)}pp</div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>Current {((result.otifPct) * 100).toFixed(2)}%</div>
        </GlassCard>
        <GlassCard>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Cost / Order Delta</div>
          <div style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 800 }}>${(result.costToServePerOrder - baseline.costToServePerOrder).toFixed(2)}</div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>Now ${result.costToServePerOrder.toFixed(2)}</div>
        </GlassCard>
        <GlassCard>
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>3yr NPV</div>
          <div style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 800 }}>{formatCurrency(result.npv3yrUSD ?? 0)}</div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>Payback {result.paybackMonths ?? 'N/A'} months</div>
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <UserCheck size={14} color="#93c5fd" />
            <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Approval Chain
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {decisionWorkflow.stages.map((stage) => {
              const readyToApprove = stage.status === 'pending' && canApproveStage(stage.id, decisionWorkflow.stages);
              return (
                <div
                  key={stage.id}
                  data-demo-anchor={`demo-cockpit-approval-${stage.id}`}
                  style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                >
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>{stage.label}</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>
                      {stage.status === 'approved' ? `${stage.approvedBy} · ${new Date(stage.approvedAt ?? '').toLocaleString()}` : 'Awaiting approval'}
                    </div>
                  </div>
                  {stage.status === 'approved' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 11, fontWeight: 700 }}>
                      <CheckCircle2 size={12} />
                      Approved
                    </div>
                  ) : (
                    <AppButton
                      size="sm"
                      variant={readyToApprove ? 'primary' : 'ghost'}
                      onClick={() => approveStage(stage.id)}
                    >
                      Approve
                    </AppButton>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, color: approvalsComplete ? '#86efac' : '#fbbf24', fontSize: 11, fontWeight: 700 }}>
            {approvalsComplete ? 'All approvals complete. Decision is ready for execution.' : 'Pending approvals remain before execution.'}
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ClipboardCheck size={14} color="#93c5fd" />
            <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Implementation Tracker
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {IMPLEMENTATION_STEPS.map((step) => (
              <div key={step.label} style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>{step.label}</div>
                <div style={{ color: '#64748b', fontSize: 10 }}>
                  Owner: {step.owner} · ETA: {step.eta} · {step.status}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard data-demo-anchor="demo-cockpit-export">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileCheck2 size={14} color="#93c5fd" />
            <div>
              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>Board Pack Artifact</div>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>
                {decisionWorkflow.exportArtifact ?? 'No board pack generated yet.'}
              </div>
              {decisionWorkflow.lastExportAt && (
                <div style={{ color: '#64748b', fontSize: 10 }}>
                  Exported {new Date(decisionWorkflow.lastExportAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <AppButton variant="secondary" size="sm" onClick={() => navigate('/app/reports')}>
              Open Reports
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={generateBoardPack}>
              <Shield size={12} />
              Generate Board Pack
            </AppButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
