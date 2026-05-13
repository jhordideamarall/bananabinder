import { ProductCard, type ProductCardData } from './product-card';

interface ProductGridProps {
  products: ProductCardData[];
  onAddToCart?: (product: ProductCardData) => void;
  cols?: 2 | 3 | 4;
}

export function ProductGrid({ products, onAddToCart, cols = 2 }: ProductGridProps) {
  const gap = 12;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap,
        padding: '0 16px 16px',
      }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
