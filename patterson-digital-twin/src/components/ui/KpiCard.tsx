import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPercent, formatNumber } from '../../utils/formatters';
import type { KpiSnapshot } from '../../types';

interface KpiCardProps {
  kpi: KpiSnapshot;
  delay?: number;
}

export function KpiCard({ kpi, delay = 0 }: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [visible, setVisible] = useState(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true);
      const start = performance.now();
      const duration = 1800;
      const target = kpi.value;

      const animate = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        setDisplayValue(eased * target);
        if (t < 1) animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, [kpi.value, delay]);

  const formatVal = (val: number): string => {
    switch (kpi.unit) {
      case 'PCT': return formatPercent(val);
      case 'USD': return `$${val.toFixed(2)}`;
      case 'M_USD': return `$${(val / 1_000_000).toFixed(1)}M`;
      case 'KG_CO2': return `${val.toFixed(2)} kg`;
      case 'DAYS': return `${val.toFixed(2)} days`;
      case 'COUNT': return kpi.id === 'resilience' ? `${Math.round(val)} / 100` : formatNumber(Math.round(val), true);
      default: return val.toFixed(1);
    }
  };

  const isGoodTrend = kpi.trendDeltaPct >= 0 ? kpi.isPositiveTrendGood : !kpi.isPositiveTrendGood;
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor = kpi.trend === 'flat' ? '#64748b' : isGoodTrend ? '#10b981' : '#ef4444';

  // Mini sparkline
  const spark = kpi.sparklineData;
  const sparkMin = Math.min(...spark);
  const sparkMax = Math.max(...spark);
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkPoints = spark.map((v, i) => {
    const x = (i / (spark.length - 1)) * 64;
    const y = 20 - ((v - sparkMin) / sparkRange) * 18;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div
      className="kpi-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
      }}
    >
      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${kpi.color || '#006EFF'}, transparent)`,
        borderRadius: '12px 12px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.4 }}>
          {kpi.label}
        </p>
        {/* Sparkline */}
        <svg width="64" height="20" style={{ opacity: 0.6 }}>
          <polyline
            points={sparkPoints}
            fill="none"
            stroke={kpi.color || '#006EFF'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Value */}
      <div style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 10 }}>
        {formatVal(displayValue)}
      </div>

      {/* Trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <TrendIcon size={13} color={trendColor} />
        <span style={{ fontSize: 12, color: trendColor, fontWeight: 600 }}>
          {kpi.trendDeltaPct >= 0 ? '+' : ''}{(kpi.trendDeltaPct * 100).toFixed(1)}%
        </span>
        <span style={{ fontSize: 11, color: '#475569' }}>{kpi.trendLabel}</span>
      </div>
    </div>
  );
}
