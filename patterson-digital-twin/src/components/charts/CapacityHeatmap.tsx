import { PRIMARY_FACILITIES } from '../../data/facilities';
import { GlassCard } from '../ui/GlassCard';

export function CapacityHeatmap() {
  const facilities = PRIMARY_FACILITIES;

  const getUtilizationColor = (pct: number): string => {
    if (pct >= 0.90) return '#ef4444';
    if (pct >= 0.85) return '#f97316';
    if (pct >= 0.80) return '#f59e0b';
    if (pct >= 0.70) return '#10b981';
    return '#00C2A8';
  };

  return (
    <GlassCard>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>FC Utilization Heatmap</h3>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>Current throughput vs. daily order capacity</p>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {[['≥90% Critical', '#ef4444'], ['≥85%', '#f97316'], ['≥80%', '#f59e0b'], ['≥70%', '#10b981'], ['<70%', '#00C2A8']].map(([label, color]) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color as string }} />
              <span style={{ fontSize: 9, color: '#64748b' }}>{label as string}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
        {facilities.map(fc => {
          const color = getUtilizationColor(fc.utilizationPct);
          const pct = (fc.utilizationPct * 100).toFixed(0);
          return (
            <div key={fc.id} style={{
              background: `${color}15`,
              border: `1px solid ${color}33`,
              borderRadius: 8,
              padding: '10px 12px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Fill bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                width: `${fc.utilizationPct * 100}%`,
                height: 2,
                background: color,
              }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 2 }}>{fc.shortName}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>{fc.city}, {fc.state}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                {(fc.currentDailyOrders / 1000).toFixed(1)}K / {(fc.dailyOrderCapacity / 1000).toFixed(0)}K
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
