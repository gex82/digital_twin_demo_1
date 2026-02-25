import { TrendingUp, TrendingDown } from 'lucide-react';

interface DeltaBadgeProps {
  value: number;
  unit?: 'usd' | 'pct' | 'days' | 'pp';
  isPositiveGood?: boolean;
  size?: 'sm' | 'md';
}

export function DeltaBadge({ value, unit = 'pct', isPositiveGood = true, size = 'md' }: DeltaBadgeProps) {
  const isPositive = value >= 0;
  const isGood = isPositive === isPositiveGood;
  const color = value === 0 ? '#64748b' : isGood ? '#10b981' : '#ef4444';
  const bg = value === 0 ? 'rgba(100,116,139,0.1)' : isGood ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

  const formatVal = () => {
    const sign = value > 0 ? '+' : '';
    switch (unit) {
      case 'usd': return `${sign}$${Math.abs(value / 1_000_000).toFixed(1)}M`;
      case 'pct': return `${sign}${(value * 100).toFixed(1)}%`;
      case 'pp': return `${sign}${(value * 100).toFixed(1)}pp`;
      case 'days': return `${sign}${value.toFixed(2)}d`;
      default: return `${sign}${value}`;
    }
  };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: bg, color,
      borderRadius: 6,
      padding: size === 'sm' ? '2px 6px' : '3px 8px',
      fontSize: size === 'sm' ? 10 : 11,
      fontWeight: 700,
    }}>
      {value !== 0 && (isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />)}
      {formatVal()}
    </span>
  );
}
