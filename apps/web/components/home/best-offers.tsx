'use client';
import { ProductCard, type ProductCardData } from '@/components/shared/product-card';
import { useCartStore } from '@/stores/cart-store';

interface BestOffersGridProps {
  products?: ProductCardData[];
}

export function BestOffersGrid({ products = [] }: BestOffersGridProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (product: ProductCardData) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.promoPrice ?? product.price,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 px-[clamp(16px,5vw,20px)] lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
      {products.map((p, index) => (
        <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} priority={index < 2} />
      ))}
    </div>
  );
}
