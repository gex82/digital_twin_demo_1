import { beforeEach, describe, expect, it } from 'vitest';
import { getBuiltInDemoActionHandler } from '../../src/domain/demo/builtInActionHandlers';
import { useScenarioStore } from '../../src/store/scenarioStore';
import { useUiStore } from '../../src/store/uiStore';

describe('built-in demo action handlers', () => {
  beforeEach(() => {
    useScenarioStore.getState().resetScenariosToSeed();
    useUiStore.getState().resetDemoUiState();
  });

  it('DEMO_BOOTSTRAP resets role/filter/masking controls', async () => {
    useUiStore.setState({
      globalSegmentFilter: 'Dental',
      roleLens: 'Executive',
      maskSensitiveCosts: true,
    });

    const handler = getBuiltInDemoActionHandler('DEMO_BOOTSTRAP');
    expect(handler).not.toBeNull();
    await handler?.({ type: 'DEMO_BOOTSTRAP' });

    const ui = useUiStore.getState();
    expect(ui.globalSegmentFilter).toBe('All');
    expect(ui.roleLens).toBe('Mixed');
    expect(ui.maskSensitiveCosts).toBe(false);
  });

  it('DECISION_APPROVE_CHAIN approves all stages and appends audit entries', async () => {
    const scenario = useScenarioStore.getState().scenarios.find((item) => item.result);
    expect(scenario).toBeTruthy();
    if (!scenario) return;

    const beforeAuditCount = scenario.auditLog.length;
    useUiStore.getState().initializeDecisionWorkflow(scenario.id, scenario.name);

    const handler = getBuiltInDemoActionHandler('DECISION_APPROVE_CHAIN');
    expect(handler).not.toBeNull();
    await handler?.({ type: 'DECISION_APPROVE_CHAIN' });

    const stages = useUiStore.getState().decisionWorkflow.stages;
    expect(stages.every((stage) => stage.status === 'approved')).toBe(true);

    const updatedScenario = useScenarioStore.getState().scenarios.find((item) => item.id === scenario.id);
    expect((updatedScenario?.auditLog.length ?? 0) - beforeAuditCount).toBe(3);
  });

  it('DECISION_GENERATE_BOARD_PACK creates export artifact and audit trail', async () => {
    const scenario = useScenarioStore.getState().scenarios.find((item) => item.result);
    expect(scenario).toBeTruthy();
    if (!scenario) return;

    const beforeAuditCount = scenario.auditLog.length;
    useUiStore.getState().initializeDecisionWorkflow(scenario.id, scenario.name);

    const handler = getBuiltInDemoActionHandler('DECISION_GENERATE_BOARD_PACK');
    expect(handler).not.toBeNull();
    await handler?.({ type: 'DECISION_GENERATE_BOARD_PACK' });

    const exportArtifact = useUiStore.getState().decisionWorkflow.exportArtifact;
    expect(exportArtifact).toContain('-board-pack-');
    expect(exportArtifact).toContain('.pdf');

    const updatedScenario = useScenarioStore.getState().scenarios.find((item) => item.id === scenario.id);
    expect((updatedScenario?.auditLog.length ?? 0) - beforeAuditCount).toBe(1);
  });
});
