'use client';

import Image from 'next/image';

export interface VariantOption {
  id: string;
  name: string;
  price: number;
  promoPrice?: number | null;
  stock: number;
  image_url?: string | null;
  weight_grams?: number | null;
}

interface VariantSelectorProps {
  variants: VariantOption[];
  selectedId: string | null;
  onSelect: (variant: VariantOption) => void;
}

export function VariantSelector({ variants, selectedId, onSelect }: VariantSelectorProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'none',
      }}
      className="no-scrollbar"
    >
      {variants.map((variant) => {
        const isSelected = variant.id === selectedId;
        const isOutOfStock = variant.stock <= 0;
        const isLowStock = variant.stock > 0 && variant.stock <= 5;

        return (
          <div
            key={variant.id}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <button
              onClick={() => !isOutOfStock && onSelect(variant)}
              disabled={isOutOfStock}
              className="relative overflow-hidden"
              style={{
                flexShrink: 0,
                width: variant.image_url ? 76 : 'auto',
                minWidth: 54,
                height: variant.image_url ? 76 : 38,
                padding: variant.image_url ? 0 : '0 16px',
                borderRadius: variant.image_url ? 18 : 12,
                border: isSelected ? '2px solid #7EC8E3' : '1.5px solid var(--color-stone-3)',
                background: isSelected ? '#7EC8E3' : '#FFFFFF',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                opacity: isOutOfStock ? 0.4 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 4px 12px rgba(224,123,57,0.2)' : 'none',
              }}
            >
              {variant.image_url ? (
                <>
                  <Image
                    src={variant.image_url}
                    alt={variant.name}
                    fill
                    className="object-cover"
                    sizes="76px"
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: isSelected
                        ? 'linear-gradient(180deg, rgba(126,200,227,0.08), rgba(26,23,20,0.62))'
                        : 'linear-gradient(180deg, transparent, rgba(26,23,20,0.58))',
                    }}
                  />
                </>
              ) : null}
              <span
                style={{
                  position: variant.image_url ? 'absolute' : 'static',
                  left: variant.image_url ? 8 : undefined,
                  right: variant.image_url ? 8 : undefined,
                  bottom: variant.image_url ? 8 : undefined,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: variant.image_url ? 11 : 13,
                  lineHeight: 1.1,
                  color: variant.image_url || isSelected ? '#FFFFFF' : '#1A1714',
                  textShadow: variant.image_url ? '0 1px 8px rgba(0,0,0,0.35)' : 'none',
                }}
              >
                {variant.name}
              </span>
            </button>

            {/* Low stock/Out of stock label OUTSIDE the button */}
            {isLowStock && !isOutOfStock && (
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  color: '#7EC8E3',
                  fontWeight: 600,
                }}
              >
                Sisa {variant.stock}
              </span>
            )}
            {isOutOfStock && (
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  color: '#A09890',
                }}
              >
                Habis
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
