interface RatingStarsProps {
  rating: number;
  count?: number;
  showCount?: boolean;
  size?: number;
}

export function RatingStars({ rating, count, showCount = false, size = 11 }: RatingStarsProps) {
  const full = Math.floor(rating);
  const empty = 5 - full;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          color: '#E9A73E',
          fontSize: size,
          letterSpacing: '-1px',
        }}
      >
        {'★'.repeat(full)}
        {'☆'.repeat(empty)}
      </span>
      {showCount && count !== undefined && (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: size - 1,
            color: '#A09890',
          }}
        >
          {rating} · {count.toLocaleString('id-ID')}
        </span>
      )}
    </div>
  );
}
