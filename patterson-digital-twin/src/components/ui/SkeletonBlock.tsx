import type { CSSProperties } from 'react';

interface SkeletonBlockProps {
  width?: string | number;
  height?: string | number;
  radius?: number;
  style?: CSSProperties;
}

export function SkeletonBlock({ width = '100%', height = 12, radius = 6, style }: SkeletonBlockProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
