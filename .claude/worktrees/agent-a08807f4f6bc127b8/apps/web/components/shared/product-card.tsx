'use client';
import type { CSSProperties, MouseEvent } from 'react';
import { PriceTag } from './price-tag';
import { RatingStars } from './rating-stars';

export interface ProductCardData {
  id: string | number;
  name: string;
  slug: string;
  price: number;
  promoPrice?: number | null;
  imageColor?: string;
  imageLabel?: string;
  imageUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  type?: 'normal' | 'frozen' | 'parcel';
}

interface ProductCardProps {
  product: ProductCardData;
  onAddToCart?: (product: ProductCardData) => void;
  href?: string;
}

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function ProductCard({ product, onAddToCart, href }: ProductCardProps) {
  const discountPct = product.promoPrice
    ? Math.round((1 - product.promoPrice / product.price) * 100)
    : null;
  const bgColor = product.imageColor ?? '#D4C4A0';

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <a
      href={href ?? `/products/${product.slug}`}
      style={{
        background: '#FDFCFB',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
      }}
    >
      {/* Image area */}
      <div
        style={{
          position: 'relative',
          padding: 16,
          background: bgColor + '18',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          aspectRatio: '1 / 1',
        }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{
              width: '70%',
              height: '70%',
              objectFit: 'contain',
              borderRadius: 10,
            }}
          />
        ) : (
          <div
            style={{
              width: '70%',
              height: '70%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: bgColor + '60',
              opacity: 0.7,
              fontFamily: 'var(--font-heading)',
              fontSize: 10,
              fontWeight: 600,
              color: '#6B6460',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {product.imageLabel ?? product.name.slice(0, 8)}
          </div>
        )}

        {/* Discount badge */}
        {discountPct !== null && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: 6,
                background: '#E53935',
                color: '#fff',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Frozen badge */}
        {discountPct === null && product.type === 'frozen' && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: 6,
                background: '#EAE7E2',
                color: '#6B6460',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              Frozen
            </span>
          </div>
        )}

        {/* Add to cart button */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              width: 32,
              height: 32,
              borderRadius: 10,
              background: '#E07B39',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(224,123,57,0.4)',
              transition: 'transform 0.1s',
            }}
          >
            <PlusIcon />
          </button>
        )}
      </div>

      {/* Info */}
      <div
        style={{
          padding: '12px 12px 14px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {product.rating !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RatingStars rating={product.rating} size={11} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#A09890',
              }}
            >
              {product.rating} · {(product.soldCount ?? 0).toLocaleString('id-ID')} terjual
            </span>
          </div>
        )}
        <div
          style={
            {
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 13,
              color: '#1A1714',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as CSSProperties
          }
        >
          {product.name}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 4 }}>
          <PriceTag price={product.price} promoPrice={product.promoPrice} />
        </div>
      </div>
    </a>
  );
}
