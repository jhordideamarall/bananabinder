import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/services/product-service';
import { ProductDetailClient } from './_client';
import type { DetailedProduct } from '@/lib/dummy-products';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product as unknown as DetailedProduct} />;
}
