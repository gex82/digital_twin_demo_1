import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  noPadding?: boolean;
}

export function GlassCard({ children, style, onClick, noPadding }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(26, 40, 64, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #2e4168',
        borderRadius: 12,
        padding: noPadding ? 0 : 20,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'border-color 0.2s',
        ...style,
      }}
      onMouseEnter={onClick ? (e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3a5280'; } : undefined}
      onMouseLeave={onClick ? (e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2e4168'; } : undefined}
    >
      {children}
    </div>
  );
}
