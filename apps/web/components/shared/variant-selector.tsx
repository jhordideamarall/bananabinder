'use client';

export interface VariantOption {
  id: string;
  name: string;
  price: number;
  promoPrice?: number | null;
  stock: number;
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
              style={{
                flexShrink: 0,
                minWidth: 54,
                height: 38,
                padding: '0 16px',
                borderRadius: 12,
                border: isSelected ? '1.5px solid #E07B39' : '1.5px solid var(--color-stone-3)',
                background: isSelected ? '#E07B39' : '#FFFFFF',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                opacity: isOutOfStock ? 0.4 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 4px 12px rgba(224,123,57,0.2)' : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 13,
                  color: isSelected ? '#FFFFFF' : '#1A1714',
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
                  color: '#E07B39',
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
