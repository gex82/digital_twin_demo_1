import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COST_BUCKETS } from '../../data/costToServe';
import { GlassCard } from '../ui/GlassCard';

const CATEGORY_COLORS: Record<string, string> = {
  Transportation: '#006EFF',
  Warehousing: '#00C2A8',
  'Inventory Carrying': '#9333ea',
  Overhead: '#64748b',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8, padding: '10px 14px', maxWidth: 200 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'white' }}>{d.subcategory}</p>
      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{d.category}</p>
      <div style={{ marginTop: 8, borderTop: '1px solid #2e4168', paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Annual:</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>${(d.annualCostUSD / 1_000_000).toFixed(1)}M</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Per Order:</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>${d.costPerOrder.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>% of Total:</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{(d.pctOfTotal * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

interface CostWaterfallChartProps {
  height?: number;
  showTitle?: boolean;
  compact?: boolean;
}

export function CostWaterfallChart({ height = 320, showTitle = true, compact = false }: CostWaterfallChartProps) {
  const categories = ['Transportation', 'Warehousing', 'Inventory Carrying', 'Overhead'];
  const catData = categories.map(cat => {
    const items = COST_BUCKETS.filter(b => b.category === cat && b.segment === 'Total');
    return {
      category: cat,
      total: items.reduce((s, i) => s + i.annualCostUSD, 0),
      items: compact ? items.slice(0, 2) : items,
      color: CATEGORY_COLORS[cat],
    };
  });

  const flatData = compact
    ? catData.map(c => ({ subcategory: c.category, category: c.category, annualCostUSD: c.total, costPerOrder: c.total / 68_000_000, pctOfTotal: c.total / 847_300_000 }))
    : COST_BUCKETS.filter(b => b.segment === 'Total').slice(0, 12);

  return (
    <GlassCard style={{ height: '100%' }}>
      {showTitle && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Cost-to-Serve Breakdown</h3>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>Annual network cost by category · $847.3M total</p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={flatData} margin={{ top: 5, right: 10, left: 0, bottom: compact ? 0 : 60 }} layout="vertical">
          <XAxis type="number" tickFormatter={v => `$${(v / 1_000_000).toFixed(0)}M`} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="subcategory" width={compact ? 100 : 160} tick={{ fill: '#94a3b8', fontSize: compact ? 10 : 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="annualCostUSD" radius={[0, 4, 4, 0]}>
            {flatData.map((entry, index) => (
              <Cell
                key={index}
                fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
