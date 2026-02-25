import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GlassCard } from '../ui/GlassCard';
import type { Scenario } from '../../types';

interface Props {
  baseline: Scenario;
  scenarios: Scenario[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.name}:</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function ScenarioCompareChart({ baseline, scenarios, height = 260 }: Props) {
  const getResult = (s: Scenario) => s.result || s.baseline;

  const metrics = [
    {
      name: 'Cost/Order ($)',
      baseline: getResult(baseline).costToServePerOrder,
      getValue: (s: Scenario) => getResult(s).costToServePerOrder,
      format: (v: number) => `$${v.toFixed(2)}`,
    },
    {
      name: 'OTIF (%)',
      baseline: getResult(baseline).otifPct * 100,
      getValue: (s: Scenario) => getResult(s).otifPct * 100,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      name: 'Utilization (%)',
      baseline: getResult(baseline).fcUtilizationPct * 100,
      getValue: (s: Scenario) => getResult(s).fcUtilizationPct * 100,
      format: (v: number) => `${v.toFixed(0)}%`,
    },
    {
      name: 'Next-Day Cover (%)',
      baseline: getResult(baseline).nextDayCoveragePct * 100,
      getValue: (s: Scenario) => getResult(s).nextDayCoveragePct * 100,
      format: (v: number) => `${v.toFixed(0)}%`,
    },
  ];

  const data = metrics.map(m => {
    const row: Record<string, string | number> = { metric: m.name, Baseline: Number(m.baseline.toFixed(2)) };
    scenarios.forEach((s, i) => {
      row[`Scenario ${String.fromCharCode(65 + i)}`] = Number(m.getValue(s).toFixed(2));
    });
    return row;
  });

  return (
    <GlassCard>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Scenario Comparison</h3>
        <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>Key metrics across scenarios</p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e4168" vertical={false} />
          <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#2e4168' }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
          <Bar dataKey="Baseline" fill="#2e4168" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Scenario A" fill="#006EFF" radius={[4, 4, 0, 0]} />
          {scenarios.length > 1 && <Bar dataKey="Scenario B" fill="#00C2A8" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
