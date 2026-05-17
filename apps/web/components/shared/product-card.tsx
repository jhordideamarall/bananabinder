'use client';
import { useState, useRef, type CSSProperties, type MouseEvent } from 'react';
import NextImage from 'next/image';
import { AnimatePresence, m } from 'framer-motion';
import Link from 'next/link';
import type { Route } from 'next';
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
  type?: 'normal' | 'parcel';
  category?: string;
  /** Berat produk (gram) — diteruskan ke cart untuk kalkulasi ongkir. */
  weight_grams?: number | null;
}

interface ProductCardProps {
  product: ProductCardData;
  onAddToCart?: (product: ProductCardData) => void;
  href?: string;
  priority?: boolean;
}

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#E53935"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MotionLink = m(Link);

export function ProductCard({ product, onAddToCart, href, priority = false }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const discountPct = product.promoPrice
    ? Math.round((1 - product.promoPrice / product.price) * 100)
    : null;
  const bgColor = product.imageColor ?? '#D4C4A0';

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Always trigger the cart addition immediately (allows spamming)
    onAddToCart?.(product);

    // Visual feedback logic
    setFeedbackKey((key) => key + 1);
    setJustAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustAdded(false), 520);
  };

  return (
    <MotionLink
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      href={(href ?? `/products/${product.slug}`) as Route}
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
        className="group relative"
        style={{
          aspectRatio: '1 / 1',
          overflow: 'hidden',
        }}
      >
        {product.imageUrl ? (
          <NextImage
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 33vw"
            priority={priority}
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

        {/* Parcel badge */}
        {discountPct === null && product.type === 'parcel' && (
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
              Bundle
            </span>
          </div>
        )}

        {/* Add to cart button — animated bounce */}
        {onAddToCart && (
          <m.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: justAdded ? [1, 1.16, 0.98, 1] : 1,
              backgroundColor: justAdded ? '#7EC8E3' : '#FFFFFF',
              boxShadow: justAdded
                ? '0 7px 18px rgba(126,200,227,0.34)'
                : '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
            transition={{
              duration: 0.22,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              border: '1.5px solid rgba(229, 57, 53, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              overflow: 'visible',
            }}
          >
            <AnimatePresence initial={false}>
              {justAdded && (
                <m.span
                  key={`ring-${feedbackKey}`}
                  initial={{ scale: 0.7, opacity: 0.55 }}
                  animate={{ scale: 1.85, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: 12,
                    border: '2px solid rgba(126,200,227,0.42)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </AnimatePresence>
            <m.span
              key={`${justAdded ? 'check' : 'plus'}-${feedbackKey}`}
              initial={false}
              animate={{
                scale: justAdded ? [0.72, 1.08, 1] : 1,
                rotate: justAdded ? [-18, 0] : 0,
              }}
              transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ position: 'relative', zIndex: 1, display: 'flex' }}
            >
              {justAdded ? <CheckIcon /> : <PlusIcon />}
            </m.span>
          </m.button>
        )}
      </div>

      {/* Info */}
      <div
        style={{
          padding: '12px 12px 14px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Category label */}
        {product.category && (
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              fontWeight: 600,
              color: '#A09890',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: 2,
            }}
          >
            {product.category}
          </div>
        )}

        <div
          style={
            {
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 13,
              color: '#1A1714',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: 34,
              marginBottom: 4,
            } as CSSProperties
          }
        >
          {product.name}
        </div>

        {/* Rating & Stats */}
        {product.rating !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <RatingStars rating={product.rating} size={10} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                color: '#A09890',
                fontWeight: 500,
              }}
            >
              {product.rating} · {(product.soldCount ?? 0).toLocaleString('id-ID')} terjual
            </span>
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <PriceTag price={product.price} promoPrice={product.promoPrice} size="sm" />
        </div>
      </div>
    </MotionLink>
  );
}
