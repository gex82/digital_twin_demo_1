import type { ReactNode } from 'react';
import type { HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  noPadding?: boolean;
}

export function GlassCard({ children, style, onClick, noPadding, ...rest }: GlassCardProps) {
  return (
    <div
      {...rest}
      onClick={onClick}
      style={{
        background: 'var(--surface-primary)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: noPadding ? 0 : 20,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'border-color 0.2s',
        ...style,
      }}
      onMouseEnter={onClick ? (e) => { (e.currentTarget as HTMLElement).style.borderColor = '#345179'; } : undefined}
      onMouseLeave={onClick ? (e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; } : undefined}
    >
      {children}
    </div>
  );
}
