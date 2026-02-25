import type { DemoStage } from '../types/demo';

export const DEMO_STAGES: DemoStage[] = [
  {
    id: 'S01',
    route: '/',
    title: 'Welcome',
    summary: "We'll walk through how a network decision gets made end to end.",
    detail: 'You will see current-state risk, scenario simulation, AI guidance, and an executive-ready decision pack.',
    personaCopy: {
      Executive: {
        summary: 'We will move from baseline risk to a signed decision in one guided flow.',
        detail: 'You will see savings, service impact, governance checks, and final approval closure.',
      },
      Analyst: {
        summary: 'We will execute a deterministic decision script across core modules.',
        detail: 'Each step logs assumptions, constraints, and actions for replay and audit.',
      },
    },
    anchorId: 'demo-landing-start',
    defaultBubblePosition: { x: 40, y: 120 },
    enterActions: [{ type: 'DEMO_BOOTSTRAP' }],
  },
  {
    id: 'S02',
    route: '/login',
    title: 'Sign-In',
    summary: 'We sign in as a business user and load the network workspace.',
    detail: 'Demo credentials are auto-filled so the flow stays smooth.',
    anchorId: 'demo-login-form',
    defaultBubblePosition: { x: 40, y: 140 },
    enterActions: [{ type: 'LOGIN_FILL_DEMO' }],
    nextActions: [{ type: 'LOGIN_SUBMIT_DEMO', timeoutMs: 6000 }],
  },
  {
    id: 'S03',
    route: '/app/dashboard',
    title: 'Network Health',
    summary: 'This is the current network health: cost, service, and risk in one view.',
    detail: 'We start from the baseline before changing anything.',
    personaCopy: {
      Executive: {
        summary: 'This is the baseline business posture before approving any change.',
        detail: 'Focus on cost-to-serve, OTIF, and where risk is concentrated now.',
      },
      Analyst: {
        summary: 'This baseline merges cost, service, utilization, and connector telemetry.',
        detail: 'All later scenario deltas are measured from this snapshot.',
      },
    },
    anchorId: 'demo-dashboard-kpi-grid',
    defaultBubblePosition: { x: 24, y: 110 },
    enterActions: [
      { type: 'UI_SET_FILTER_ALL' },
      { type: 'DASHBOARD_FOCUS_HEALTH' },
      { type: 'UI_SIMULATE_INTEGRATION_REFRESH' },
    ],
  },
  {
    id: 'S04',
    route: '/app/network',
    title: 'Constraint Test',
    summary: 'Here we test a network constraint and see where pressure builds.',
    detail: 'A temporary capacity override mimics a real operational bottleneck.',
    anchorId: 'demo-network-canvas',
    defaultBubblePosition: { x: 24, y: 120 },
    enterActions: [
      { type: 'NETWORK_SELECT_CONSTRAINED_FC', payload: { facilityId: 'FC-HBG-003' } },
      { type: 'NETWORK_APPLY_TEMP_OVERRIDE', payload: { capacity: 9100, cost: 4.15 } },
    ],
  },
  {
    id: 'S05',
    route: '/app/scenarios',
    title: 'Build Scenario',
    summary: 'Now we create a what-if scenario with explicit assumptions.',
    detail: 'This stage sets up a consolidation case with controlled assumptions.',
    personaCopy: {
      Executive: {
        summary: 'We create a decision candidate with explicit assumptions.',
        detail: 'Assumptions remain transparent before any recommendation is approved.',
      },
      Analyst: {
        summary: 'We seed a parameterized scenario template for deterministic replay.',
        detail: 'Assumption values are logged to support governance and versioning.',
      },
    },
    anchorId: 'demo-scenario-list',
    defaultBubblePosition: { x: 24, y: 120 },
    enterActions: [
      { type: 'SCENARIO_CREATE_PREFILLED', payload: { templateId: 'SCN-001' } },
      { type: 'SCENARIO_SET_ASSUMPTIONS' },
    ],
  },
  {
    id: 'S06',
    route: '/app/scenarios',
    title: 'Run Simulation',
    summary: 'The engine returns cost and service tradeoffs in minutes.',
    detail: 'Results include annual savings, OTIF impact, risk level, and payback.',
    personaCopy: {
      Executive: {
        summary: 'The model returns quantified tradeoffs fast enough for decision cadence.',
        detail: 'You get savings, service impact, payback, and execution risk in one view.',
      },
      Analyst: {
        summary: 'Optimization computes deltas against baseline assumptions.',
        detail: 'Outputs include savings, OTIF movement, uncertainty drivers, and risk class.',
      },
    },
    anchorId: 'demo-scenario-results',
    defaultBubblePosition: { x: 24, y: 120 },
    enterActions: [{ type: 'SCENARIO_RUN_ACTIVE_AND_WAIT', timeoutMs: 12000 }],
  },
  {
    id: 'S07',
    route: '/app/cost-to-serve',
    title: 'Lane Opportunity',
    summary: 'This pinpoints lane-level savings and turns them into action.',
    detail: 'Top lane opportunity is converted into a draft scenario automatically.',
    anchorId: 'demo-cts-top-lane',
    defaultBubblePosition: { x: 24, y: 120 },
    enterActions: [
      { type: 'CTS_OPEN_TOP_LANE', payload: { laneIndex: 0 } },
      { type: 'CTS_PUSH_TO_SCENARIO' },
    ],
  },
  {
    id: 'S08',
    route: '/app/service-level',
    title: 'Service Risk Check',
    summary: 'Service impact is checked before we commit any cost change.',
    detail: 'We surface OTIF risk and trigger a carrier business review path.',
    anchorId: 'demo-service-carriers',
    defaultBubblePosition: { x: 24, y: 120 },
    enterActions: [
      { type: 'SERVICE_SHOW_OTIF_RISK' },
      { type: 'SERVICE_TRIGGER_SBR' },
    ],
  },
  {
    id: 'S09',
    route: '/app/ai',
    title: 'AI Recommendation',
    summary: 'AI summarizes options and recommends the best next move.',
    detail: 'We pin the strongest recommendation and pass it into the workflow.',
    personaCopy: {
      Executive: {
        summary: 'AI distills options into a direct recommendation with expected impact.',
        detail: 'The recommendation is pinned and handed into the decision packet.',
      },
      Analyst: {
        summary: 'AI composes recommendations from scenario and service context.',
        detail: 'Pinned output is converted into downstream scenario and report artifacts.',
      },
    },
    anchorId: 'demo-ai-chat',
    defaultBubblePosition: { x: 24, y: 120 },
    enterActions: [
      {
        type: 'AI_SEND_STAGE_PROMPT',
        payload: {
          text: 'Give me the best next move balancing cost savings and OTIF risk in plain English.',
        },
        timeoutMs: 120000,
      },
      { type: 'AI_PIN_TOP_RECOMMENDATION', timeoutMs: 30000 },
    ],
  },
  {
    id: 'S10',
    route: '/app/reports',
    title: 'Decision Pack',
    summary: 'We package results into an executive-ready decision brief.',
    detail: 'The scenario pack is selected and an export artifact is generated.',
    personaCopy: {
      Executive: {
        summary: 'Results are packaged into a board-ready decision brief.',
        detail: 'The pack combines financial impact, service deltas, and recommendation rationale.',
      },
      Analyst: {
        summary: 'Report generation assembles KPI, scenario, and governance sections.',
        detail: 'Export artifact is generated with scenario-linked evidence for review.',
      },
    },
    anchorId: 'demo-reports-preview',
    defaultBubblePosition: { x: 24, y: 120 },
    enterActions: [
      { type: 'REPORT_SELECT_SCENARIO_PACK' },
      { type: 'REPORT_GENERATE_EXPORT' },
    ],
  },
  {
    id: 'S11',
    route: '/app/decision-cockpit',
    title: 'Decision Cockpit',
    summary: 'Final step: approve, track impact, and keep an auditable record.',
    detail: 'We finalize the recommendation through analyst, director, and VP approvals.',
    personaCopy: {
      Executive: {
        summary: 'Final step: move from recommendation to signed decision.',
        detail: 'Approval chain, impact recap, and board export close the decision loop.',
      },
      Analyst: {
        summary: 'Final step: execute governance workflow and preserve traceability.',
        detail: 'Approval stages and export events are written back to scenario audit history.',
      },
    },
    anchorId: 'demo-cockpit-summary',
    defaultBubblePosition: { x: 24, y: 120 },
    enterActions: [
      { type: 'DECISION_INIT_FROM_BEST_SCENARIO' },
      { type: 'DECISION_APPROVE_CHAIN' },
      { type: 'DECISION_GENERATE_BOARD_PACK' },
      { type: 'UI_SET_ROLE_MIXED' },
    ],
  },
];
