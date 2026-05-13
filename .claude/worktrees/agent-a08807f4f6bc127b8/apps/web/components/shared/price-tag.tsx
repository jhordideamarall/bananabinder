interface PriceTagProps {
  price: number;
  promoPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export function PriceTag({ price, promoPrice, size = 'md' }: PriceTagProps) {
  const displayPrice = promoPrice ?? price;
  const sizeMap = {
    sm: { price: 14, original: 11 },
    md: { price: 15, original: 12 },
    lg: { price: 18, original: 13 },
  };
  const s = sizeMap[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: s.price,
          color: '#E07B39',
        }}
      >
        {fmt(displayPrice)}
      </span>
      {promoPrice != null && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: s.original,
            color: '#A09890',
            textDecoration: 'line-through',
          }}
        >
          {fmt(price)}
        </span>
      )}
    </div>
  );
}
