'use client';

interface PriceTagProps {
  price: number;
  promoPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export function PriceTag({ price, promoPrice, size = 'md' }: PriceTagProps) {
  const displayPrice = promoPrice ?? price;
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 16 : 24;
  const originalFontSize = size === 'sm' ? 11 : size === 'md' ? 12 : 15;

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize,
          color: 'var(--color-primary)',
          lineHeight: 1,
          letterSpacing: '-0.3px',
        }}
      >
        {fmt(displayPrice)}
      </span>
      {promoPrice != null && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: originalFontSize,
            color: 'var(--color-ink-4)',
            textDecoration: 'line-through',
            fontWeight: 500,
          }}
        >
          {fmt(price)}
        </span>
      )}
    </div>
  );
}
