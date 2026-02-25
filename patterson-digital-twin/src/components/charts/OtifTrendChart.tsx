import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { OTIF_TREND, OTIF_BY_SEGMENT } from '../../data/otif';
import { GlassCard } from '../ui/GlassCard';
import { isHeadlessRuntime } from '../../utils/runtime';

interface OtifTrendChartProps {
  segment?: 'Total' | 'Dental' | 'AnimalHealth';
  height?: number;
  showTitle?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>{p.name}:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{(p.value * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export function OtifTrendChart({ height = 220, showTitle = true }: OtifTrendChartProps) {
  if (isHeadlessRuntime()) {
    const recent = OTIF_TREND.slice(-4);
    return (
      <GlassCard style={{ height: '100%' }}>
        {showTitle && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>OTIF Performance Trend</h3>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>Headless fallback mode</p>
          </div>
        )}
        <div style={{ display: 'grid', gap: 8, minHeight: height - 20 }}>
          {recent.map((point) => (
            <div
              key={point.month}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: '#1a2840',
                border: '1px solid #2e4168',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: 11 }}>{point.month}</span>
              <span style={{ color: '#00C2A8', fontSize: 12, fontWeight: 700 }}>
                {(point.otifPct * 100).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  const totalData = OTIF_TREND.map(d => ({
    month: d.month.slice(2),
    Total: d.otifPct,
    Dental: OTIF_BY_SEGMENT.dental.find(x => x.month === d.month)?.otifPct || d.otifPct,
    'Animal Health': OTIF_BY_SEGMENT.animalHealth.find(x => x.month === d.month)?.otifPct || d.otifPct,
  }));

  return (
    <GlassCard style={{ height: '100%' }}>
      {showTitle && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>OTIF Performance Trend</h3>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>Trailing 12 months · On-Time In-Full</p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={totalData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e4168" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#2e4168' }} tickLine={false} />
          <YAxis domain={[0.955, 0.985]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0.972} stroke="#006EFF" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'Target 97.2%', fill: '#006EFF', fontSize: 9, position: 'right' }} />
          <Line type="monotone" dataKey="Total" stroke="#006EFF" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#006EFF' }} />
          <Line type="monotone" dataKey="Dental" stroke="#3389FF" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
          <Line type="monotone" dataKey="Animal Health" stroke="#00C2A8" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
          <Legend iconType="line" wrapperStyle={{ fontSize: 10, color: '#94a3b8', paddingTop: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
