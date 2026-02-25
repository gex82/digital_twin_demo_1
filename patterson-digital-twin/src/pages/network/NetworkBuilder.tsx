import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  BackgroundVariant, MarkerType,
  type Connection, type Edge, type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Map, LayoutGrid, Layers, Plus, Save, X, Info } from 'lucide-react';
import { PRIMARY_FACILITIES, REGIONAL_HUBS } from '../../data/facilities';
import { nodeTypes } from './custom-nodes';
import type { Facility } from '../../types';

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

// Convert lat/lng to canvas coordinates
function geoToCanvas(lat: number, lng: number, W = 1200, H = 620): { x: number; y: number } {
  const x = ((lng - (-125)) / ((-65) - (-125))) * W - 40;
  const y = (1 - (lat - 24) / (51 - 24)) * H;
  return { x, y };
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
  source: from,
  target: to,
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
  const [showFlows, setShowFlows] = useState(true);
  const [showCoverage, setShowCoverage] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [nodeCounter, setNodeCounter] = useState(0);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({
      ...params,
      style: { stroke: BLUE, strokeWidth: 1.5, opacity: 0.7 },
      markerEnd: { type: MarkerType.ArrowClosed, color: BLUE, width: 12, height: 12 },
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
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

  const selectedFacility = selectedNode
    ? PRIMARY_FACILITIES.find(f => f.id === selectedNode.id)
    : null;

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
        <div style={{ flex: 1 }}>
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
                    <span style={{ color: selectedFacility.utilizationPct >= 0.85 ? '#f59e0b' : '#10b981', fontSize: 11, fontWeight: 700 }}>
                      {(selectedFacility.utilizationPct * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ background: SURFACE2, borderRadius: 3, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${selectedFacility.utilizationPct * 100}%`,
                      background: selectedFacility.utilizationPct >= 0.85
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                        : `linear-gradient(90deg, ${BLUE}, ${TEAL})`,
                      borderRadius: 3,
                    }} />
                  </div>
                </div>

                <InfoRow label="City" value={`${selectedFacility.city}, ${selectedFacility.state}`} />
                <InfoRow label="Square Footage" value={`${(selectedFacility.squareFootage / 1000).toFixed(0)}K sqft`} />
                <InfoRow label="Daily Capacity" value={`${selectedFacility.dailyOrderCapacity.toLocaleString()} orders`} />
                <InfoRow label="Cost/Order" value={`$${selectedFacility.handlingCostPerOrder.toFixed(2)}`} />
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
                    defaultValue={selectedFacility.dailyOrderCapacity}
                    style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 5, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}
                  />
                  <label style={{ color: '#64748b', fontSize: 11, display: 'block', marginBottom: 3 }}>Cost/Order Override ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedFacility.handlingCostPerOrder}
                    style={{ width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 5, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <button
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
