import type { Metadata } from 'next';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Tambah Produk Baru',
};
import { getAdminCategories } from '@/lib/admin-data';
import ProductForm from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const categories = await getAdminCategories(db);

  return <ProductForm categories={categories} />;
}
