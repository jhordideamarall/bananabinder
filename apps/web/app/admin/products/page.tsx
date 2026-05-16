import type { Metadata } from 'next';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Manajemen Produk',
};
import { getAdminProducts } from '@/lib/admin-data';
import { Plus as IconPlus } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { ProductCatalogClient } from '@/components/admin/ProductCatalogClient';

export default async function AdminProductsPage() {
  const products = await getAdminProducts(db);

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#86868B]">Katalog</p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
            Produk
          </h1>
          <p className="mt-1 text-[14px] text-[#86868B]">{products.length} produk aktif di toko.</p>
        </div>
        <Link
          href={'/admin/products/new' as Route}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black"
        >
          <IconPlus className="h-4 w-4" strokeWidth={2} />
          Tambah produk
        </Link>
      </header>

      <ProductCatalogClient products={products} />
    </div>
  );
}
