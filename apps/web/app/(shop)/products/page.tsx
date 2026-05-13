'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductGrid } from '@/components/shared/product-grid';
import { type ProductCardData } from '@/components/shared/product-card';
import { useCartStore } from '@/stores/cart-store';
import { useQuery } from '@tanstack/react-query';
import { getActiveProducts, type ProductWithDetails } from '@/lib/services/product-client';
import { Loader2 } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const activeCat = searchParams.get('category');
  const [sort] = useState<'popular' | 'rating' | 'low' | 'high'>('popular');

  const addItem = useCartStore((state) => state.addItem);

  // Fetch real products
  const { data: products = [], isLoading } = useQuery<ProductWithDetails[]>({
    queryKey: ['products'],
    queryFn: getActiveProducts,
  });

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCat) {
      list = list.filter((p) => p.category_slug === activeCat);
    }

    if (sort === 'popular') {
      list = [...list].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    }
    if (sort === 'rating') {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    if (sort === 'low') {
      list = [...list].sort((a, b) => (a.promoPrice ?? a.price) - (b.promoPrice ?? b.price));
    }
    if (sort === 'high') {
      list = [...list].sort((a, b) => (b.promoPrice ?? b.price) - (a.promoPrice ?? a.price));
    }

    return list.map((p) => ({
      ...p,
      // Values are already mapped in getActiveProducts
    }));
  }, [products, activeCat, sort]);

  const handleAddToCart = (p: ProductCardData) => {
    addItem({
      id: String(p.id),
      name: p.name,
      price: p.promoPrice ?? p.price,
      imageUrl: p.imageUrl ?? '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-14">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-10 lg:mx-auto lg:w-full lg:max-w-[1052px]">
      <div className="flex-1 pt-14">
        <ProductGrid
          products={filtered as ProductCardData[]}
          cols={2}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center pt-14">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
