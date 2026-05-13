import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className,
  style,
}: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: '#EAE7E2',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      style={{
        background: '#FDFCFB',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          aspectRatio: '1/1',
          background: '#EAE7E2',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton height={12} width="60%" />
        <Skeleton height={13} />
        <Skeleton height={13} width="80%" />
        <Skeleton height={18} width="50%" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        padding: '0 16px 16px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
