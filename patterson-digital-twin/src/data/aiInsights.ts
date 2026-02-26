import type { AiInsightScript } from '../types';

const ANALYSIS_DATE_LONG = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/Chicago',
}).format(new Date());

const ANALYSIS_DATE_SHORT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/Chicago',
}).format(new Date());

const ANALYSIS_TIMESTAMP_UTC = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
}).format(new Date());

export const AI_INSIGHTS: AiInsightScript[] = [
  {
    id: 'cost-opportunities',
    triggerKeywords: ['cost', 'opportunity', 'savings', 'reduce', 'optimize', 'expensive', 'cheap', 'money', 'biggest'],
    promptExamples: [
      'Where are my biggest cost opportunities?',
      'How can I reduce the network cost-to-serve?',
      'Which lanes are most expensive?',
    ],
    thinkingSteps: [
      `Querying SAP EWM cost telemetry (as of ${ANALYSIS_TIMESTAMP_UTC} UTC)...`,
      'Loading 847 active lane cost profiles...',
      'Cross-referencing carrier rate tables vs. current market rates...',
      'Analyzing FedEx vs. UPS performance delta on Southeast corridors...',
      'Evaluating Columbus FC fixed cost vs. Elgin/Harrisburg absorption capacity...',
      'Running MILP cost minimization heuristic (4,821 variables)...',
      'Ranking opportunities by NPV and implementation complexity...',
    ],
    response: `**Network Cost Analysis – ${ANALYSIS_DATE_LONG}**

Your network is generating **$847.3M** in total annual cost-to-serve, representing **$14.82 per order** — up 3.1% year-over-year. I've identified three actionable opportunities totaling **$17.9M** in annualized savings that can be executed within 12 months.

**Priority 1 — FedEx Southeast Lane Renegotiation ($8.2M savings, 45-day implementation)**
FedEx Ground performance on your Southeast corridors (GSO→ATL, BSM→ATL, GSO→BSM) has declined 1.4 percentage points over the trailing 6 months — now at 96.5% on-time vs. your 97.0% network target. Meanwhile, UPS Ground rates on these same lanes are 3.2% lower and their OTIF is running at 97.8%. Migrating 40% of SE parcel volume to UPS saves $8.2M annually with a 3-month payback and actually *improves* OTIF. I've already drafted Scenario SCN-003 for this.

**Priority 2 — Columbus FC Fixed Cost Elimination ($4.7M net savings, 6-month implementation)**
Columbus is operating at **75% utilization** — the lowest single-purpose cost efficiency in your network. The FC carries $7.8M in annual fixed cost. Elgin currently has 22% headroom (10,920 vs. 14,000/day capacity), and Harrisburg has 18% headroom. Closing Columbus and redistributing volume to these two FCs generates $4.7M net annual savings — $7.8M fixed cost reduction, partially offset by $3.1M in incremental cross-shipping. Columbus's lease expires Q3 2026, making timing ideal.

**Priority 3 — Dental Segment Safety Stock Rightsizing ($3.4M savings, 3-month implementation)**
Your dental segment carries **32 days of safety stock coverage** vs. an industry benchmark of 26 days for comparable distribution operations. Tightening to 26 days — achievable through improved demand signal integration with your SAP forecasting module — frees approximately $3.4M in inventory carrying cost annually. I recommend a phased SKU-tier approach starting with high-velocity Class A items.

**Total addressable opportunity: $16.3M–$17.9M annually** across these three initiatives.`,
    recommendations: [
      {
        title: 'FedEx → UPS Lane Shift (Southeast)',
        detail: 'Migrate 40% of FedEx SE volume to UPS Ground. $8.2M annual savings, 45-day implementation.',
        impactUSD: 8_200_000,
        impactOtifPct: 0.003,
        timeToValue: '45 days',
        complexity: 'Low',
        priority: 1,
        scenarioType: 'CarrierShift',
        affectedFacilities: ['FC-GSO-004', 'FC-BSM-005'],
      },
      {
        title: 'Close Columbus FC',
        detail: 'Redistribute to Elgin + Harrisburg. $4.7M net savings. OTIF risk managed if Elgin GTP installed first.',
        impactUSD: 4_700_000,
        impactOtifPct: -0.009,
        timeToValue: '6 months',
        complexity: 'Medium',
        priority: 2,
        scenarioType: 'FCConsolidation',
        affectedFacilities: ['FC-COL-002', 'FC-ELG-001', 'FC-HBG-003'],
      },
      {
        title: 'Dental Safety Stock Reduction',
        detail: 'Reduce from 32 to 26 days coverage. $3.4M carrying cost savings, minimal OTIF risk.',
        impactUSD: 3_400_000,
        timeToValue: '3 months',
        complexity: 'Low',
        priority: 3,
        scenarioType: 'InventoryReposition',
        affectedFacilities: ['FC-ELG-001', 'FC-COL-002', 'FC-HBG-003'],
      },
    ],
    dataSourcesUsed: ['SAP EWM – All 13 FCs', 'UPS Carrier API', 'FedEx API', 'Patterson TMS', 'Demand Forecast Engine'],
    confidenceScore: 0.91,
  },
  {
    id: 'close-columbus',
    triggerKeywords: ['columbus', 'close', 'consolidate', 'COL', 'ohio', 'shut', 'eliminate'],
    promptExamples: [
      'What happens if we close the Columbus FC?',
      'Should we consolidate Columbus with another FC?',
      'Model the Columbus closure scenario',
    ],
    thinkingSteps: [
      'Loading Columbus FC (FC-COL-002) operational profile...',
      'Current utilization: 75% | Daily orders: 8,250 | Annual fixed cost: $7.8M',
      'Evaluating absorption capacity at Elgin (22% headroom) and Harrisburg (18% headroom)...',
      'Modeling order redistribution using nearest-FC routing algorithm...',
      'Computing incremental transport cost for redistributed volume...',
      'Assessing OTIF impact under Elgin 88% utilization scenario...',
      'Running sensitivity analysis on demand growth scenarios...',
      'Generating executive risk/reward summary...',
    ],
    response: `**Columbus FC Closure Analysis – Scenario SCN-001**

**Bottom Line:** Closing Columbus saves **$4.7M net annually** with a 14-month payback and $12.4M 3-year NPV. The primary risk is Elgin capacity — manageable if the Elgin GTP upgrade (Scenario SCN-004) is sequenced first.

**The Math:**
- Columbus annual fixed cost eliminated: **+$7.8M savings**
- Incremental cross-shipping to Elgin + Harrisburg: **-$3.1M cost**
- **Net annual benefit: $4.7M**

**Volume Redistribution:**
8,250 daily orders from Columbus would flow as follows:
- **Elgin (IL): +4,400 orders/day** → utilization rises from 78% → 88%
- **Harrisburg (PA): +3,850 orders/day** → utilization rises from 82% → 92%

**Service Level Risk:**
- Harrisburg at 92% is near the critical threshold where processing delays begin affecting OTIF
- OTIF network impact: **-0.9 percentage points** (from 97.2% → 96.3%)
- Columbus customers in central Ohio shift to 1.3 avg transit days (from 1.1) — still within next-day ground window for 78% of that customer base

**My Recommendation:**
Execute in this sequence:
1. Approve Elgin GTP automation (SCN-004) — reduces Elgin's labor burden and expands effective capacity
2. Close Columbus 6 months later once GTP is live
3. Combined result: $10.6M annual savings with OTIF risk reduced to -0.3pp

The Columbus lease expires Q3 2026, so there is a natural decision window in the next 4–5 months.`,
    recommendations: [
      {
        title: 'Sequence: Elgin GTP → Columbus Closure',
        detail: 'Install GTP at Elgin first, then close Columbus 6 months later. Combined savings: $10.6M/yr.',
        impactUSD: 10_600_000,
        impactOtifPct: -0.003,
        timeToValue: '8 months',
        complexity: 'Medium',
        priority: 1,
        scenarioType: 'FCConsolidation',
        affectedFacilities: ['FC-ELG-001', 'FC-COL-002', 'FC-HBG-003'],
      },
    ],
    dataSourcesUsed: ['SAP EWM – Columbus FC', 'SAP EWM – Elgin FC', 'SAP EWM – Harrisburg FC', 'Patterson TMS', 'UPS Carrier API'],
    confidenceScore: 0.88,
  },
  {
    id: 'automation-roi',
    triggerKeywords: ['automation', 'robot', 'GTP', 'goods-to-person', 'automate', 'robotics', 'elgin', 'technology'],
    promptExamples: [
      'Model automation ROI for Elgin FC',
      'What does a GTP system cost vs. save at Elgin?',
      'Show me the automation investment case',
    ],
    thinkingSteps: [
      'Loading Elgin FC labor cost profile ($23.50/hr, 310 FTE)...',
      'Benchmarking GTP throughput rates (AutoStore / Ocado systems)...',
      'Computing labor reduction impact at 32% reduction...',
      'Modeling throughput expansion: 14,000 → 17,500 orders/day...',
      'Running NPV model at 7.5% WACC over 5-year horizon...',
      'Assessing Columbus closure optionality enabled by Elgin expansion...',
    ],
    response: `**Elgin FC GTP Automation ROI – Scenario SCN-004**

Installing a Goods-to-Person (GTP) system at your Elgin, IL hub generates a **$5.9M annual benefit** with a 22-month payback and **$7.8M 3-year NPV** at a 7.5% discount rate. More importantly, it unlocks optionality for the Columbus closure, raising the combined program value to $10.6M/yr.

**Investment Profile:**
- CapEx: **$4.2M** (AutoStore-class system for 95,000 sq ft)
- Install timeline: 6 months (phased, no service interruption)
- Annual energy cost increase: +$180K

**Benefits:**
- Labor savings: 32% reduction = **-99 FTE** (attrition + redeployment)
- Annual labor savings at $23.50/hr: **$4.1M**
- Handling cost reduction (-35%): **+$1.4M**
- Processing time improvement: 2.2hr → 1.4hr (cut-off extension to 18:00)
- Throughput capacity: 14,000 → **17,500 orders/day** (+25%)
- OTIF improvement: **+0.6 percentage points** from faster processing

**Strategic Optionality:**
The throughput increase creates the capacity headroom needed to safely absorb Columbus order volume (8,250/day) if Columbus is closed. Without GTP, Elgin would reach 88% utilization — borderline. With GTP, Elgin reaches only 76% — comfortable operating range.

**Payback Timeline:** Break-even at month 22. By month 36, cumulative savings exceed $11.4M.`,
    recommendations: [
      {
        title: 'Approve Elgin GTP – $4.2M CapEx',
        detail: '22-month payback, $7.8M 3yr NPV. Unlocks Columbus closure option.',
        impactUSD: 5_900_000,
        impactOtifPct: 0.006,
        timeToValue: '8 months',
        complexity: 'Medium',
        priority: 1,
        scenarioType: 'AutomationROI',
        affectedFacilities: ['FC-ELG-001'],
      },
    ],
    dataSourcesUsed: ['SAP EWM – Elgin FC', 'SAP EWM Labor Records', 'FAST Automation Team'],
    confidenceScore: 0.86,
  },
  {
    id: 'carrier-performance',
    triggerKeywords: ['carrier', 'fedex', 'ups', 'usps', 'performance', 'delivery', 'shipment', 'transit', 'late'],
    promptExamples: [
      'Show me carrier performance issues',
      'Which carriers are underperforming?',
      'FedEx is having problems in the Southeast',
    ],
    thinkingSteps: [
      'Pulling carrier OTIF data from TMS (trailing 90 days)...',
      'Comparing FedEx Ground performance vs. contract SLA (98.0% on-time)...',
      'Identifying lanes with >1.5pp OTIF decline trend...',
      'Cross-referencing UPS performance on identical corridors...',
      'Checking contract expiration dates and renegotiation windows...',
    ],
    response: `**Carrier Performance Intelligence Report – ${ANALYSIS_DATE_SHORT}**

I've identified two active carrier performance risks and one contract opportunity that together represent **$11.2M in actionable value**.

**Alert 1 — FedEx Ground OTIF Decline (Southeast)**
FedEx Ground is running at **96.1% on-time** on your Southeast lanes (GSO→FL, GSO→SC, BSM→MS/LA), compared to your 97.0% network target and their contracted 98.0% SLA. The trend is directional: -0.35pp per month over the past 4 months. Root cause appears to be FedEx's Southeast sort-center congestion (Birmingham and Charlotte hubs). UPS Ground is performing at **97.8%** on equivalent lanes.

**Recommended Action:** Migrate 40% SE parcel volume to UPS (Scenario SCN-003, already approved). Saves $8.2M annually.

**Alert 2 — FedEx Home Delivery – West Coast**
FedEx Home Delivery at SAC and RNO is tracking at **96.1% OTIF** vs. 97.0% target. Claim rate is 0.31% — elevated. Investigation shows last-mile density is thin in Pacific Northwest zones. Recommend activating USPS as backup for rural WA/OR zip codes (volume: ~1,800 shipments/day).

**Opportunity — UPS Contract Renewal (expires Dec 2026)**
Your UPS Master Agreement expires December 2026 — 10 months away. Based on current volume (82,400 daily shipments) and market benchmarks, I estimate **2.8–4.1%** rate improvement is achievable in a renewal negotiation if approached with competitive leverage from FedEx (paradoxically). Potential value: **$2.8–4.1M annually**.`,
    recommendations: [
      {
        title: 'Execute FedEx → UPS Shift (SE)',
        detail: 'SCN-003 already approved. Migrate 40% FedEx SE to UPS. $8.2M savings.',
        impactUSD: 8_200_000,
        impactOtifPct: 0.003,
        timeToValue: '45 days',
        complexity: 'Low',
        priority: 1,
        scenarioType: 'CarrierShift',
      },
      {
        title: 'Initiate UPS Contract Renewal Negotiation',
        detail: 'Contract expires Dec 2026. Begin competitive bid process now. $2.8–4.1M potential annual savings.',
        impactUSD: 3_500_000,
        timeToValue: '6 months',
        complexity: 'Low',
        priority: 2,
      },
    ],
    dataSourcesUsed: ['FedEx API (Carrier Scorecard)', 'UPS Carrier API', 'Patterson TMS', 'SAP EWM – GSO FC', 'SAP EWM – BSM FC'],
    confidenceScore: 0.93,
  },
  {
    id: 'disruption-midwest',
    triggerKeywords: ['disruption', 'blizzard', 'storm', 'weather', 'outage', 'risk', 'midwest', 'contingency', 'emergency'],
    promptExamples: [
      'Simulate a Midwest snowstorm disruption',
      'What happens if Elgin goes offline?',
      'Run a disruption scenario for the Midwest',
    ],
    thinkingSteps: [
      'Loading Midwest disruption scenario parameters...',
      'Identifying at-risk FCs: ELG, COL, MSP, OKC (blizzard zone)...',
      'Modeling capacity constraints at 40–60% capacity for 7 days...',
      'Computing order rerouting to DAL, HBG, GSO hubs...',
      'Activating backup carrier protocols (Regional LTL + UPS Air)...',
      'Estimating customer OTIF impact by region...',
    ],
    response: `**Midwest Disruption Playbook – 7-Day Blizzard Scenario**

This scenario models a major winter storm event affecting 4 Midwest FCs for 7 days, based on February 2019 polar vortex historical patterns. This is your highest-risk single disruption event.

**Impact Summary:**
- Network OTIF: **97.2% → 94.1%** (-3.1pp)
- Daily orders delayed (days 1-3): **~28,400** (15% of network volume)
- Incremental cost: **+$17.9M** annualized equivalent
- Next-day coverage temporarily: **91% → 82%**

**Mitigation Playbook (3-Step Response):**

**Step 1 – Activate Dallas Overflow (Day 1)**
Dallas FC has 19% spare capacity. Reroute 40% of ELG+COL volume to DAL via cross-dock arrangement. DAL can absorb 2,100 additional orders/day with overtime labor authorized.

**Step 2 – Activate Backup Carriers (Day 1-2)**
Pre-negotiate with 3 regional LTL carriers (currently dormant contract): activate within 4 hours of storm declaration. Add UPS Air for critical dental/veterinary orders (priority flag in SAP OMS). Incremental cost: ~$2.1M/week.

**Step 3 – Customer Communication (Day 1)**
SAP OMS auto-generates delay notifications for affected customers. Prioritize dental surgery customers (flagged in CRM by procedure type) for air fulfillment.

**Preparedness Recommendation:**
Pre-position +5 days dental instrument inventory at Dallas FC before winter season (Oct 15 deadline). Cost: $1.2M inventory investment. Avoidance value: $8–12M in disruption costs.`,
    recommendations: [
      {
        title: 'Pre-position Inventory at Dallas before Winter',
        detail: '+5 days dental instrument buffer at DAL. $1.2M cost, $8-12M disruption avoidance value.',
        impactUSD: 9_000_000,
        timeToValue: '30 days',
        complexity: 'Low',
        priority: 1,
        scenarioType: 'DisruptionResponse',
        affectedFacilities: ['FC-DAL-006'],
      },
    ],
    dataSourcesUsed: ['SAP EWM – All Midwest FCs', 'Weather Service API', 'Patterson TMS', 'Regional LTL Carrier API'],
    confidenceScore: 0.84,
  },
  {
    id: 'segment-compare',
    triggerKeywords: ['dental', 'animal', 'segment', 'compare', 'comparison', 'mix', 'split'],
    promptExamples: [
      'How do Dental vs. Animal Health compare?',
      'Compare segment performance between Dental and Animal Health',
      'Show the Dental and Animal Health split',
    ],
    thinkingSteps: [
      'Pulling segment KPI rollups from SAP EWM and cost ledger...',
      'Reconciling daily order mix and OTIF deltas by segment...',
      'Computing cost-to-serve and coverage differences...',
      'Summarizing segment-specific risks and opportunities...',
    ],
    response: `**Dental vs. Animal Health Comparison – ${ANALYSIS_DATE_LONG}**

Your network is currently split **38% Dental** and **62% Animal Health** by daily order volume.

**Dental Segment**
- Daily orders: **71,000**
- OTIF: **97.8%** (strong)
- Cost per order: **$16.20** (higher handling complexity)
- Next-day coverage: **93%**

**Animal Health Segment**
- Daily orders: **116,400**
- OTIF: **96.7%** (1.1pp below Dental)
- Cost per order: **$13.88** (lower unit cost, higher volume)
- Next-day coverage: **89%**

**What matters for Patterson right now**
1. Dental is service-strong but cost-heavy due to SKU complexity and handling profile.
2. Animal Health drives scale but carries higher carrier sensitivity in Southeast and West lanes.
3. Closing the OTIF gap in Animal Health by 0.5pp while holding cost flat is the highest-value service target this quarter.

If you want, I can open the exact scenarios to improve each segment independently.`,
    recommendations: [
      {
        title: 'Raise Animal Health OTIF by 0.5pp',
        detail: 'Prioritize carrier and capacity actions on AH-heavy lanes to close the service gap.',
        impactUSD: 7_100_000,
        impactOtifPct: 0.005,
        timeToValue: '60 days',
        complexity: 'Medium',
        priority: 1,
        scenarioType: 'CarrierShift',
        affectedFacilities: ['FC-DAL-006', 'FC-OKC-007', 'FC-PHX-011', 'FC-SAC-010'],
      },
      {
        title: 'Lower Dental Cost-to-Serve by 2%',
        detail: 'Optimize inventory and handling policies in Dental FCs while preserving OTIF.',
        impactUSD: 5_300_000,
        timeToValue: '90 days',
        complexity: 'Low',
        priority: 2,
        scenarioType: 'InventoryReposition',
        affectedFacilities: ['FC-BSM-005', 'FC-GRV-012'],
      },
    ],
    dataSourcesUsed: ['SAP EWM – Segment KPI Feed', 'Cost Analytics', 'Carrier Performance Feed'],
    confidenceScore: 0.9,
  },
  {
    id: 'network-overview',
    triggerKeywords: ['network', 'overview', 'summary', 'status', 'health', 'performance', 'overall', 'how are we doing'],
    promptExamples: [
      'Give me a network health overview',
      'How is the distribution network performing?',
      'What is the current state of the network?',
    ],
    thinkingSteps: [
      'Aggregating KPIs across all 13 fulfillment centers...',
      'Computing network resilience score (utilization variance, carrier concentration, geographic coverage)...',
      'Identifying top risk indicators from live data feeds...',
      'Benchmarking against healthcare distribution industry standards...',
    ],
    response: `**Patterson Network Health Snapshot – ${ANALYSIS_DATE_LONG}**

Your distribution network is **operationally solid** with three areas warranting near-term attention.

**Strengths:**
✅ OTIF at **97.2%** — above 96.5% healthcare distribution benchmark
✅ Fill rate at **99.1%** — excellent
✅ Order accuracy at **99.87%** — industry-leading
✅ Next-day ground coverage at **91%** of customer locations
✅ Network cost down YoY after fuel surcharge normalization

**Areas of Attention:**
⚠️ **FedEx SE performance decline** — 96.1% OTIF vs. 97.0% target, declining -1.4pp YoY. Action ready: SCN-003.
⚠️ **Columbus FC underutilization** — 75% utilization, $7.8M fixed cost. Consolidation option has 14-month payback.
⚠️ **Animal Health OTIF gap** — 96.7% vs. 97.8% Dental. 1.1pp gap driven by SE + West Coast carrier mix.
⚠️ **Network Resilience Score: 73/100** — carrier concentration in Parcel (UPS+FedEx = 89% of volume) is primary risk factor.

**Top Opportunity:** If you execute the three priority scenarios (SCN-001, SCN-003, SCN-004), you save **$18.8M annually** with an average 9-month payback, while improving OTIF by 0.3pp.

Shall I model any of these in more detail?`,
    recommendations: [
      {
        title: 'Execute Priority 3 Scenario Bundle',
        detail: 'SCN-003 (Carrier) + SCN-004 (Elgin GTP) + SCN-001 (Columbus). $18.8M combined savings.',
        impactUSD: 18_800_000,
        impactOtifPct: 0.003,
        timeToValue: '8 months',
        complexity: 'Medium',
        priority: 1,
      },
    ],
    dataSourcesUsed: ['SAP EWM – All FCs', 'UPS API', 'FedEx API', 'Patterson TMS', 'Demand Forecast Engine'],
    confidenceScore: 0.94,
  },
];

export const SUGGESTED_PROMPTS = [
  'Where are my biggest cost opportunities?',
  'What happens if we close the Columbus FC?',
  'Show me carrier performance issues',
  'Simulate a Midwest disruption',
  'Give me a network health overview',
  'Model automation ROI for Elgin FC',
  'Which FCs are at capacity risk?',
  'How do Dental vs. Animal Health compare?',
];

export function matchInsightScript(query: string): AiInsightScript {
  const q = query.toLowerCase();
  const scored = AI_INSIGHTS.map(script => {
    const score = script.triggerKeywords.filter(kw => q.includes(kw)).length;
    return { script, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (scored[0].score > 0) return scored[0].script;
  return AI_INSIGHTS.find((script) => script.id === 'network-overview') ?? AI_INSIGHTS[0];
}
