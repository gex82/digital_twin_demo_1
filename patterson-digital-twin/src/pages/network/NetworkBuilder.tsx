import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  BackgroundVariant, MarkerType,
  type Connection, type Edge, type Node, type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Map, LayoutGrid, Layers, Plus, Save, X, Info } from 'lucide-react';
import { PRIMARY_FACILITIES, REGIONAL_HUBS } from '../../data/facilities';
import { nodeTypes } from './nodeTypes';
import type { Facility } from '../../types';
import { useDemoStageBindings } from '../../hooks/useDemoStageBindings';
import type { DemoActionHandler } from '../../types/demo';
import { useUiStore } from '../../store/uiStore';

const BLUE = '#006EFF';
const TEAL = '#00C2A8';
const BORDER = '#2e4168';
const SURFACE = '#1a2840';
const SURFACE2 = '#1e2f4a';
const PURPLE = '#9333ea';
const AMBER = '#f59e0b';

// Transport mode colors
const MODE_COLORS: Record<string, string> = {
  Parcel: BLUE,
  LTL: TEAL,
  TL: PURPLE,
  SelfFleet: AMBER,
};

const SHORT_NAME_TO_ID: Record<string, string> = [...PRIMARY_FACILITIES, ...REGIONAL_HUBS].reduce<Record<string, string>>(
  (map, facility) => {
    map[facility.shortName] = facility.id;
    return map;
  },
  {}
);

// Convert lat/lng to canvas coordinates
function geoToCanvas(lat: number, lng: number, W = 1200, H = 620): { x: number; y: number } {
  const x = ((lng - (-125)) / ((-65) - (-125))) * W - 40;
  const y = (1 - (lat - 24) / (51 - 24)) * H;
  return { x, y };
}

function coverageRadiusMilesToPx(miles: number): number {
  return Math.round(Math.max(58, Math.min(112, miles * 0.26)));
}

function facilityToNode(fc: Facility): Node {
  const pos = geoToCanvas(fc.coordinates[0], fc.coordinates[1]);
  return {
    id: fc.id,
    type: 'fc',
    position: pos,
    data: {
      shortName: fc.shortName,
      city: fc.city,
      state: fc.state,
      utilizationPct: fc.utilizationPct,
      facilityType: fc.type,
      sqft: fc.squareFootage,
      dailyOrderCapacity: fc.dailyOrderCapacity,
      segment: fc.segment,
      nextDayCoverageRadius: fc.nextDayCoverageRadius,
      coveragePx: coverageRadiusMilesToPx(fc.nextDayCoverageRadius),
      showCoverage: false,
    },
  };
}

const INITIAL_NODES: Node[] = [
  ...PRIMARY_FACILITIES.map(facilityToNode),
  ...REGIONAL_HUBS.map(h => {
    const pos = geoToCanvas(h.coordinates[0], h.coordinates[1]);
    return {
      id: h.id,
      type: 'hub',
      position: pos,
      data: { shortName: h.shortName, city: h.city, state: h.state },
    };
  }),
];

// Key lane connections (origin → destination, mode, volume)
const LANE_DEFS = [
  { from: 'ELG', to: 'COL', mode: 'LTL', vol: 4 },
  { from: 'ELG', to: 'HBG', mode: 'TL', vol: 3 },
  { from: 'ELG', to: 'MSP', mode: 'LTL', vol: 2 },
  { from: 'ELG', to: 'DAL', mode: 'TL', vol: 3 },
  { from: 'COL', to: 'HBG', mode: 'LTL', vol: 2 },
  { from: 'COL', to: 'GSO', mode: 'Parcel', vol: 2 },
  { from: 'HBG', to: 'GSO', mode: 'Parcel', vol: 3 },
  { from: 'DAL', to: 'OKC', mode: 'SelfFleet', vol: 2 },
  { from: 'DAL', to: 'PHX', mode: 'TL', vol: 2 },
  { from: 'RNO', to: 'SAC', mode: 'SelfFleet', vol: 2 },
  { from: 'SAC', to: 'RNO', mode: 'LTL', vol: 1 },
  { from: 'BSM', to: 'DAL', mode: 'LTL', vol: 2 },
  { from: 'MSP', to: 'ELG', mode: 'LTL', vol: 1 },
  { from: 'MIL', to: 'ELG', mode: 'Parcel', vol: 2 },
  { from: 'GRV', to: 'GSO', mode: 'Parcel', vol: 2 },
];

const INITIAL_EDGES: Edge[] = LANE_DEFS.map(({ from, to, mode, vol }) => ({
  id: `${from}-${to}`,
  source: SHORT_NAME_TO_ID[from] ?? from,
  target: SHORT_NAME_TO_ID[to] ?? to,
  style: { stroke: MODE_COLORS[mode] ?? BLUE, strokeWidth: vol * 0.8, opacity: 0.7 },
  markerEnd: { type: MarkerType.ArrowClosed, color: MODE_COLORS[mode] ?? BLUE, width: 12, height: 12 },
  data: { mode, volumeFactor: vol },
  animated: mode === 'SelfFleet',
}));

const PALETTE_ITEMS = [
  { type: 'fc', label: 'Fulfillment Center', color: BLUE, icon: '🏭' },
  { type: 'hub', label: 'Regional Hub', color: PURPLE, icon: '🔀' },
  { type: 'satellite', label: 'Satellite FC', color: '#64748b', icon: '📦' },
  { type: 'crossDock', label: 'Cross-Dock', color: TEAL, icon: '⚡' },
];

export default function NetworkBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [facilityOverrides, setFacilityOverrides] = useState<Record<string, { capacity: number; cost: number }>>({});
  const [showFlows, setShowFlows] = useState(true);
  const [showCoverage, setShowCoverage] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [nodeCounter, setNodeCounter] = useState(0);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const pushToast = useUiStore((state) => state.pushToast);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({
      ...params,
      style: { stroke: BLUE, strokeWidth: 1.5, opacity: 0.7 },
      markerEnd: { type: MarkerType.ArrowClosed, color: BLUE, width: 12, height: 12 },
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    setSelectedNode(node);
    setRightPanelOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  function resetToGeoLayout() {
    setNodes(nds => nds.map(n => {
      const fc = PRIMARY_FACILITIES.find(f => f.id === n.id);
      const hub = REGIONAL_HUBS.find(h => h.id === n.id);
      const source = fc || hub;
      if (source) {
        return { ...n, position: geoToCanvas(source.coordinates[0], source.coordinates[1]) };
      }
      return n;
    }));
  }

  function addNode(type: string) {
    const id = `custom-${nodeCounter + 1}`;
    setNodeCounter(c => c + 1);
    setNodes(nds => [...nds, {
      id,
      type,
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: { shortName: id.toUpperCase().slice(0, 3), city: 'New Node', utilizationPct: 0 },
    }]);
  }

  function handleSave() {
    setSaveMsg('Layout saved ✓');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  // Toggle flow visibility
  useEffect(() => {
    setEdges(eds => eds.map(e => ({ ...e, style: { ...e.style, opacity: showFlows ? 0.7 : 0 } })));
  }, [showFlows, setEdges]);

  // Toggle coverage visualization layer
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.type !== 'fc'
          ? node
          : {
              ...node,
              data: {
                ...node.data,
                showCoverage,
                coveragePx: coverageRadiusMilesToPx(
                  typeof node.data.nextDayCoverageRadius === 'number' ? node.data.nextDayCoverageRadius : 280
                ),
              },
            }
      )
    );
  }, [setNodes, showCoverage]);

  const selectedFacility = selectedNode
    ? PRIMARY_FACILITIES.find(f => f.id === selectedNode.id)
    : null;
  const selectedFacilityProfile = selectedFacility
    ? {
        ...selectedFacility,
        dailyOrderCapacity: facilityOverrides[selectedFacility.id]?.capacity ?? selectedFacility.dailyOrderCapacity,
        handlingCostPerOrder: facilityOverrides[selectedFacility.id]?.cost ?? selectedFacility.handlingCostPerOrder,
      }
    : null;

  function runIsolationAnalysis() {
    if (!selectedFacilityProfile) return;
    const utilizationPct = Math.round(selectedFacilityProfile.utilizationPct * 100);
    setSaveMsg(`Isolation run queued for ${selectedFacilityProfile.shortName}...`);
    pushToast({
      title: 'Isolation Analysis Executed',
      message: `${selectedFacilityProfile.shortName} stress profile generated at ${utilizationPct}% utilization.`,
      tone: utilizationPct >= 85 ? 'warning' : 'info',
    });
    window.setTimeout(() => {
      setSaveMsg(`Isolation complete: ${selectedFacilityProfile.shortName} risk profile updated.`);
    }, 700);
    window.setTimeout(() => setSaveMsg(''), 2600);
  }

  const demoHandlers: Record<string, DemoActionHandler> = useMemo(() => ({
    NETWORK_SELECT_CONSTRAINED_FC: async (action) => {
      const payloadId = typeof action.payload?.facilityId === 'string' ? action.payload.facilityId : 'FC-HBG-003';
      const nodeId = nodes.find((node) => node.id === payloadId)
        ? payloadId
        : SHORT_NAME_TO_ID[payloadId] ?? 'FC-HBG-003';
      const target = nodes.find((node) => node.id === nodeId) ?? null;
      if (!target) return;
      setSelectedNode(target);
      setRightPanelOpen(true);
      setSaveMsg(`Focused ${target.data.shortName} constraint`);
      window.setTimeout(() => setSaveMsg(''), 1800);
    },
    NETWORK_APPLY_TEMP_OVERRIDE: async (action) => {
      const fallbackId = selectedNode?.id ?? 'FC-HBG-003';
      const payload = action.payload ?? {};
      const capacity = typeof payload.capacity === 'number' ? payload.capacity : 9100;
      const cost = typeof payload.cost === 'number' ? payload.cost : 4.15;
      setFacilityOverrides((state) => ({ ...state, [fallbackId]: { capacity, cost } }));
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== fallbackId) return node;
          const sourceFacility = PRIMARY_FACILITIES.find((facility) => facility.id === fallbackId);
          if (!sourceFacility) return node;
          const utilizationPct = Math.min(0.99, sourceFacility.currentDailyOrders / capacity);
          return {
            ...node,
            data: {
              ...node.data,
              utilizationPct,
              dailyOrderCapacity: capacity,
            },
          };
        })
      );
      setSaveMsg('Demo override applied ✓');
      window.setTimeout(() => setSaveMsg(''), 2200);
    },
  }), [nodes, selectedNode, setNodes]);

  useDemoStageBindings('/app/network', demoHandlers);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#0A1628' }}>

      {/* LEFT: Node Palette */}
      <div style={{ width: 190, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '14px 12px', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Node Palette</span>
        </div>
        <div style={{ padding: 8 }}>
          <p style={{ color: '#475569', fontSize: 10, margin: '0 0 8px', padding: '0 4px' }}>Drag to canvas or click to add</p>
          {PALETTE_ITEMS.map(item => (
            <button
              key={item.type}
              onClick={() => addNode(item.type)}
              draggable
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer',
                marginBottom: 6, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 500 }}>{item.label}</div>
                <div style={{ width: 20, height: 2, background: item.color, borderRadius: 1, marginTop: 2 }} />
              </div>
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 8px', borderTop: `1px solid ${BORDER}` }}>
          <p style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>Legend</p>
          {Object.entries(MODE_COLORS).map(([mode, color]) => (
            <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, padding: '0 4px' }}>
              <div style={{ width: 20, height: 2, background: color, borderRadius: 1 }} />
              <span style={{ color: '#64748b', fontSize: 10 }}>{mode}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '8px', borderTop: `1px solid ${BORDER}` }}>
          <p style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>Stats</p>
          <div style={{ padding: '0 4px' }}>
            <div style={{ color: '#64748b', fontSize: 10, marginBottom: 3 }}>
              Nodes: <span style={{ color: '#e2e8f0' }}>{nodes.length}</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 10, marginBottom: 3 }}>
              Lanes: <span style={{ color: '#e2e8f0' }}>{edges.length}</span>
            </div>
            <div style={{ color: '#64748b', fontSize: 10 }}>
              FCs: <span style={{ color: '#e2e8f0' }}>{PRIMARY_FACILITIES.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: React Flow Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{
          height: 46, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center',
          padding: '0 12px', gap: 8, background: SURFACE, flexShrink: 0,
        }}>
          <button
            onClick={resetToGeoLayout}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: SURFACE2, border: `1px solid ${BORDER}`, color: '#94a3b8', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}
          >
            <Map size={12} /> Geographic Layout
          </button>

          <div style={{ width: 1, height: 20, background: BORDER }} />

          <button
            onClick={() => setShowFlows(!showFlows)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: showFlows ? `${BLUE}20` : SURFACE2, border: `1px solid ${showFlows ? BLUE : BORDER}`, color: showFlows ? BLUE : '#64748b', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}
          >
            <Layers size={12} /> Flows
          </button>

          <button
            onClick={() => setShowCoverage(!showCoverage)}
            data-testid="network-toggle-coverage"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: showCoverage ? `${TEAL}20` : SURFACE2, border: `1px solid ${showCoverage ? TEAL : BORDER}`, color: showCoverage ? TEAL : '#64748b', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}
          >
            <LayoutGrid size={12} /> Coverage
          </button>

          <div style={{ width: 1, height: 20, background: BORDER }} />

          <button
            onClick={() => addNode('fc')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: SURFACE2, border: `1px solid ${BORDER}`, color: '#94a3b8', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}
          >
            <Plus size={12} /> Add Node
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {saveMsg && <span style={{ color: '#10b981', fontSize: 11 }}>{saveMsg}</span>}
            <button
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: BLUE, border: 'none', color: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
            >
              <Save size={12} /> Save Layout
            </button>
          </div>
        </div>

        {/* React Flow */}
        <div style={{ flex: 1 }} data-demo-anchor="demo-network-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.08 }}
            style={{ background: '#0A1628' }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background variant={BackgroundVariant.Dots} color="#1e2f4a" gap={24} size={1} />
            <Controls style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
            <MiniMap
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              nodeColor={(n) => {
                if (n.type === 'hub') return PURPLE;
                if (n.type === 'crossDock') return TEAL;
                return BLUE;
              }}
              maskColor="rgba(10,22,40,0.7)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* RIGHT: Node Detail Panel */}
      {rightPanelOpen && selectedNode && (
        <div style={{ width: 280, borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{selectedNode.data.shortName}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>{selectedNode.data.city}, {selectedNode.data.state}</div>
            </div>
            <button onClick={() => setRightPanelOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ padding: 14 }}>
            {selectedFacility ? (
              <>
                {/* Utilization bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#64748b', fontSize: 11 }}>Utilization</span>
                    <span style={{ color: (selectedFacilityProfile ?? selectedFacility).utilizationPct >= 0.85 ? '#f59e0b' : '#10b981', fontSize: 11, fontWeight: 700 }}>
                      {(((selectedFacilityProfile ?? selectedFacility).utilizationPct) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ background: SURFACE2, borderRadius: 3, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(selectedFacilityProfile ?? selectedFacility).utilizationPct * 100}%`,
                      background: (selectedFacilityProfile ?? selectedFacility).utilizationPct >= 0.85
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                        : `linear-gradient(90deg, ${BLUE}, ${TEAL})`,
                      borderRadius: 3,
                    }} />
                  </div>
                </div>

                <InfoRow label="City" value={`${selectedFacility.city}, ${selectedFacility.state}`} />
                <InfoRow label="Square Footage" value={`${(selectedFacility.squareFootage / 1000).toFixed(0)}K sqft`} />
                <InfoRow label="Daily Capacity" value={`${(selectedFacilityProfile ?? selectedFacility).dailyOrderCapacity.toLocaleString()} orders`} />
                <InfoRow label="Cost/Order" value={`$${(selectedFacilityProfile ?? selectedFacility).handlingCostPerOrder.toFixed(2)}`} />
                <InfoRow label="Segment" value={selectedFacility.segment} />
                {selectedFacility.hasGTP && <InfoRow label="GTP Automation" value="Yes ✓" valueColor="#10b981" />}
                {selectedFacility.hasVoicePicking && <InfoRow label="Voice Pick" value="Yes ✓" valueColor="#10b981" />}

                <div style={{ marginTop: 14, height: 1, background: BORDER }} />

                {/* Editable overrides */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Override Inputs</div>
                  <label style={{ color: '#64748b', fontSize: 11, display: 'block', marginBottom: 3 }}>Capacity Override</label>
                  <input
                    type="number"
                    value={facilityOverrides[selectedFacility.id]?.capacity ?? selectedFacility.dailyOrderCapacity}
                    onChange={(event) =>
                      setFacilityOverrides((state) => ({
                        ...state,
                        [selectedFacility.id]: {
                          capacity: Number(event.target.value),
                          cost: state[selectedFacility.id]?.cost ?? selectedFacility.handlingCostPerOrder,
                        },
                      }))
                    }
                    style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 5, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}
                  />
                  <label style={{ color: '#64748b', fontSize: 11, display: 'block', marginBottom: 3 }}>Cost/Order Override ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={facilityOverrides[selectedFacility.id]?.cost ?? selectedFacility.handlingCostPerOrder}
                    onChange={(event) =>
                      setFacilityOverrides((state) => ({
                        ...state,
                        [selectedFacility.id]: {
                          capacity: state[selectedFacility.id]?.capacity ?? selectedFacility.dailyOrderCapacity,
                          cost: Number(event.target.value),
                        },
                      }))
                    }
                    style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 5, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <button
                  onClick={runIsolationAnalysis}
                  data-testid="network-run-isolation"
                  style={{ width: '100%', marginTop: 8, padding: '8px', background: `${BLUE}20`, border: `1px solid ${BLUE}`, color: BLUE, borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  Run Isolation Analysis
                </button>
              </>
            ) : (
              <div style={{ color: '#64748b', fontSize: 12 }}>
                <Info size={14} style={{ marginBottom: 6 }} />
                <p>Custom node — no facility data linked.</p>
                <InfoRow label="Node ID" value={selectedNode.id} />
                <InfoRow label="Type" value={selectedNode.type ?? 'unknown'} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueColor = '#e2e8f0' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ color: '#64748b', fontSize: 11 }}>{label}</span>
      <span style={{ color: valueColor, fontSize: 11, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
