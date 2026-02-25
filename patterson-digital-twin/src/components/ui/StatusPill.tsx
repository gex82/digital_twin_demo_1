interface StatusPillProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  Complete: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', dot: '#10b981' },
  Approved: { bg: 'rgba(0, 110, 255, 0.15)', text: '#3389FF', dot: '#006EFF' },
  Draft: { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', dot: '#64748b' },
  Running: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', dot: '#f59e0b' },
  Archived: { bg: 'rgba(100, 116, 139, 0.1)', text: '#475569', dot: '#475569' },
  Critical: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', dot: '#ef4444' },
  Warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', dot: '#f59e0b' },
  Live: { bg: 'rgba(0, 194, 168, 0.15)', text: '#00C2A8', dot: '#00C2A8' },
  Low: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', dot: '#10b981' },
  Medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', dot: '#f59e0b' },
  High: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', dot: '#ef4444' },
};

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const style = STATUS_MAP[status] || STATUS_MAP.Draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: style.bg,
      color: style.text,
      border: `1px solid ${style.dot}33`,
      borderRadius: 20,
      padding: size === 'sm' ? '2px 8px' : '3px 10px',
      fontSize: size === 'sm' ? 10 : 11,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}
