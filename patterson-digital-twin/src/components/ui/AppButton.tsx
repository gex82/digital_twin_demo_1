import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'warning';
type ButtonSize = 'sm' | 'md';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--patterson-primary)',
    border: '1px solid rgba(0, 55, 103, 0.7)',
    color: 'var(--text-on-primary)',
  },
  secondary: {
    background: 'var(--surface-secondary)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
  },
  warning: {
    background: 'rgba(208, 100, 20, 0.2)',
    border: '1px solid rgba(208, 100, 20, 0.48)',
    color: '#fdba74',
  },
};

const SIZE_STYLE: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 10px', fontSize: 11 },
  md: { padding: '8px 12px', fontSize: 12 },
};

export function AppButton({
  children,
  variant = 'secondary',
  size = 'md',
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        ...VARIANT_STYLE[variant],
        ...SIZE_STYLE[size],
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
