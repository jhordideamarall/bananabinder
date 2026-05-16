import { db } from '@/lib/db';
import { getAdminCategories, getAdminProductDetail } from '@/lib/admin-data';
import ProductForm from '@/components/admin/ProductForm';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProductDetail(db, id),
    getAdminCategories(db),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductForm initialData={product} categories={categories} isEdit />;
}
