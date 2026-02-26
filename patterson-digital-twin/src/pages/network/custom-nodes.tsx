import { Handle, Position } from 'reactflow';

const BLUE = '#006EFF';
const TEAL = '#00C2A8';
const PURPLE = '#9333ea';
const SURFACE = '#1a2840';
const BORDER = '#2e4168';
const YELLOW = '#f59e0b';

function utilColor(pct: number) {
  if (pct >= 90) return '#ef4444';
  if (pct >= 80) return YELLOW;
  if (pct >= 60) return TEAL;
  return '#10b981';
}

export function FCNode({ data, selected }: { data: any; selected: boolean }) {
  const color = utilColor(data.utilizationPct ?? 70);
  const showCoverage = Boolean(data.showCoverage);
  const coveragePx = typeof data.coveragePx === 'number' ? data.coveragePx : 72;
  return (
    <div style={{
      width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center',
      filter: selected ? `drop-shadow(0 0 8px ${BLUE})` : 'none',
      position: 'relative',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: BLUE, border: 'none', width: 6, height: 6 }} />
      <div style={{ width: 80, height: 80, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showCoverage && (
          <div
            data-testid="fc-coverage-visible"
            style={{
              position: 'absolute',
              width: coveragePx * 2,
              height: coveragePx * 2,
              borderRadius: '50%',
              border: `1px dashed ${TEAL}77`,
              background: 'rgba(0,194,168,0.05)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: SURFACE,
          border: `2px solid ${selected ? BLUE : BORDER}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: selected ? `0 0 16px ${BLUE}40` : 'none',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Utilization fill at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${(data.utilizationPct ?? 70) * 0.64}%`,
          background: `${color}20`,
        }} />
        <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700, zIndex: 1 }}>{data.shortName}</span>
        <span style={{ color: color, fontSize: 9, zIndex: 1 }}>{data.utilizationPct}%</span>
        </div>
      </div>
      <span style={{ color: '#94a3b8', fontSize: 9, marginTop: 4, textAlign: 'center', maxWidth: 80 }}>{data.city}</span>
      <Handle type="source" position={Position.Bottom} style={{ background: BLUE, border: 'none', width: 6, height: 6 }} />
    </div>
  );
}

export function HubNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', filter: selected ? `drop-shadow(0 0 8px ${PURPLE})` : 'none' }}>
      <Handle type="target" position={Position.Top} style={{ background: PURPLE, border: 'none', width: 6, height: 6 }} />
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: SURFACE,
        border: `2px solid ${selected ? PURPLE : '#6b21a8'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#d8b4fe', fontSize: 10, fontWeight: 700 }}>{data.shortName}</span>
      </div>
      <span style={{ color: '#a78bfa', fontSize: 9, marginTop: 3 }}>Hub</span>
      <Handle type="source" position={Position.Bottom} style={{ background: PURPLE, border: 'none', width: 6, height: 6 }} />
    </div>
  );
}

export function SatelliteNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#64748b', border: 'none', width: 5, height: 5 }} />
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: SURFACE,
        border: `1px solid ${selected ? '#94a3b8' : BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 600 }}>{data.shortName}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#64748b', border: 'none', width: 5, height: 5 }} />
    </div>
  );
}

export function CrossDockNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Handle type="target" position={Position.Top} style={{ background: TEAL, border: 'none', width: 6, height: 6 }} />
      <div style={{
        width: 48, height: 28, borderRadius: 4,
        background: SURFACE,
        border: `2px solid ${selected ? TEAL : '#0d9488'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#5eead4', fontSize: 9, fontWeight: 700 }}>{data.shortName}</span>
      </div>
      <span style={{ color: '#5eead4', fontSize: 9, marginTop: 3 }}>X-Dock</span>
      <Handle type="source" position={Position.Bottom} style={{ background: TEAL, border: 'none', width: 6, height: 6 }} />
    </div>
  );
}

export const nodeTypes = {
  fc: FCNode,
  hub: HubNode,
  satellite: SatelliteNode,
  crossDock: CrossDockNode,
};
