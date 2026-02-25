import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../ui/GlassCard';
import { isHeadlessRuntime } from '../../utils/runtime';

// Synthetic demand forecast data
const FORECAST_DATA = [
  { period: 'Q1 25', dental: 64.2, animalHealth: 102.3, forecast: false },
  { period: 'Q2 25', dental: 66.8, animalHealth: 105.7, forecast: false },
  { period: 'Q3 25', dental: 63.1, animalHealth: 108.2, forecast: false },
  { period: 'Q4 25', dental: 70.5, animalHealth: 112.4, forecast: false },
  { period: 'Q1 26', dental: 68.9, animalHealth: 114.1, forecast: false },
  { period: 'Q2 26F', dental: 71.2, animalHealth: 118.6, forecast: true },
  { period: 'Q3 26F', dental: 72.8, animalHealth: 123.4, forecast: true },
  { period: 'Q4 26F', dental: 76.1, animalHealth: 128.9, forecast: true },
];

export function ForecastAreaChart({ height = 220 }: { height?: number }) {
  if (isHeadlessRuntime()) {
    return (
      <GlassCard style={{ height: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Demand Forecast (K Orders/Day)</h3>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>Headless fallback mode</p>
        </div>
        <div style={{ display: 'grid', gap: 8, minHeight: height - 20 }}>
          {FORECAST_DATA.slice(-4).map((row) => (
            <div
              key={row.period}
              style={{
                background: '#1a2840',
                border: '1px solid #2e4168',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>{row.period}</span>
                <span style={{ color: row.forecast ? '#f59e0b' : '#64748b', fontSize: 10 }}>
                  {row.forecast ? 'Forecast' : 'Actual'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#3389FF', fontSize: 11 }}>Dental: {row.dental.toFixed(1)}</span>
                <span style={{ color: '#00C2A8', fontSize: 11 }}>Animal: {row.animalHealth.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={{ height: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Demand Forecast (K Orders/Day)</h3>
        <p style={{ margin: 0, fontSize: 11, color: '#64748b', marginTop: 2 }}>Quarterly · Dental + Animal Health</p>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={FORECAST_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="dental-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3389FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3389FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ah-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C2A8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00C2A8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e4168" vertical={false} />
          <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#2e4168' }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip contentStyle={{ background: '#1a2840', border: '1px solid #2e4168', borderRadius: 8 }} labelStyle={{ color: '#94a3b8', fontSize: 11 }} itemStyle={{ color: 'white', fontSize: 11 }} />
          <Legend iconType="line" wrapperStyle={{ fontSize: 10, color: '#94a3b8', paddingTop: 8 }} />
          <Area type="monotone" dataKey="dental" name="Dental" stroke="#3389FF" fill="url(#dental-grad)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="animalHealth" name="Animal Health" stroke="#00C2A8" fill="url(#ah-grad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
