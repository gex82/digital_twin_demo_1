import type { DemoActionHandler } from '../../types/demo';
import { useScenarioStore } from '../../store/scenarioStore';
import { useUiStore } from '../../store/uiStore';
import { buildBoardPackArtifactName } from '../../utils/artifacts';

export function getBuiltInDemoActionHandler(actionType: string): DemoActionHandler | null {
  switch (actionType) {
    case 'DEMO_BOOTSTRAP':
      return async () => {
        useUiStore.getState().setGlobalSegmentFilter('All');
        useUiStore.getState().setRoleLens('Mixed');
        useUiStore.getState().setMaskSensitiveCosts(false);
      };
    case 'UI_SET_FILTER_ALL':
      return () => {
        useUiStore.getState().setGlobalSegmentFilter('All');
      };
    case 'UI_SET_ROLE_MIXED':
      return () => {
        useUiStore.getState().setRoleLens('Mixed');
      };
    case 'UI_SIMULATE_INTEGRATION_REFRESH':
      return () => {
        useUiStore.getState().simulateIntegrationRefresh();
      };
    case 'UI_ENABLE_MASKING':
      return () => {
        useUiStore.getState().setMaskSensitiveCosts(true);
      };
    case 'UI_DISABLE_MASKING':
      return () => {
        useUiStore.getState().setMaskSensitiveCosts(false);
      };
    case 'DECISION_INIT_FROM_BEST_SCENARIO':
      return () => {
        const bestScenario = useScenarioStore
          .getState()
          .scenarios.filter((scenario) => scenario.result)
          .sort((a, b) => (b.result?.annualSavingsUSD ?? 0) - (a.result?.annualSavingsUSD ?? 0))[0];
        if (!bestScenario) return;
        useScenarioStore.getState().setActiveScenario(bestScenario.id);
        useUiStore.getState().initializeDecisionWorkflow(bestScenario.id, bestScenario.name);
      };
    case 'DECISION_APPROVE_CHAIN':
      return () => {
        const ui = useUiStore.getState();
        const scenarioId = ui.decisionWorkflow.scenarioId;
        if (!scenarioId) return;

        const approvals: Array<{ stage: 'analyst' | 'director' | 'vp'; user: string; label: string }> = [
          { stage: 'analyst', user: 'A. Kowalski', label: 'Analyst Review' },
          { stage: 'director', user: 'R. Chen', label: 'Director Approval' },
          { stage: 'vp', user: 'J. Mitchell', label: 'VP Sign-Off' },
        ];

        for (const approval of approvals) {
          useUiStore.getState().approveDecisionStage(approval.stage, approval.user);
          useScenarioStore.getState().appendScenarioAuditEntry(scenarioId, {
            user: approval.user,
            action: approval.label,
            details: `${approval.label} completed in Decision Cockpit guided flow.`,
          });
        }
      };
    case 'DECISION_GENERATE_BOARD_PACK':
      return () => {
        const ui = useUiStore.getState();
        const workflow = ui.decisionWorkflow;
        const scenarioId = workflow.scenarioId;
        const scenarioName = workflow.scenarioName || 'scenario-pack';
        const artifact = buildBoardPackArtifactName(scenarioName);
        useUiStore.getState().markDecisionExport(artifact);
        if (scenarioId) {
          useScenarioStore.getState().appendScenarioAuditEntry(scenarioId, {
            user: 'System',
            action: 'Board Pack Exported',
            details: `Generated artifact ${artifact}`,
          });
        }
      };
    default:
      return null;
  }
}
