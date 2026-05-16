'use client';

import { useState } from 'react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Boxes as IconStack2,
  Image as IconPhoto,
  Pencil as IconEdit,
  Search as IconSearch,
} from 'lucide-react';
import type { AdminProduct } from '@/lib/admin-data';

interface ProductCatalogClientProps {
  products: AdminProduct[];
}

function searchableText(product: AdminProduct): string {
  return [
    product.name,
    product.description ?? '',
    product.category?.name ?? '',
    product.slug,
    product.productVariants.map((variant) => variant.name).join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

export function ProductCatalogClient({ products }: ProductCatalogClientProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const visibleProducts = normalizedQuery
    ? products.filter((product) => searchableText(product).includes(normalizedQuery))
    : products;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <IconSearch
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868B]"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Cari nama, kategori, slug, atau varian..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-full border border-black/[0.08] bg-white pl-10 pr-4 text-[14px] text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p className="text-[12px] font-medium text-[#86868B]">
          {visibleProducts.length} dari {products.length} produk
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product) => {
          const hasDiscount = Boolean(product.promo_price && product.promo_price < product.price);
          const displayPrice = product.promo_price ?? product.price;

          return (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-colors hover:border-black/[0.12]"
            >
              <div className="relative aspect-square bg-[#FAFAFA]">
                {product.productImages[0] ? (
                  <Image
                    src={product.productImages[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#C7C7CC]">
                    <IconPhoto className="h-10 w-10" strokeWidth={1.25} />
                  </div>
                )}
                <div className="absolute right-3 top-3 flex gap-1.5">
                  {hasDiscount ? (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-[#1D1D1F]">
                      Promo
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur ${
                      product.is_active ? 'bg-white/85 text-[#1D1D1F]' : 'bg-black/60 text-white'
                    }`}
                  >
                    {product.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#86868B]">
                  {product.category?.name ?? 'Tanpa kategori'}
                </p>
                <h3 className="mt-1 text-[16px] font-semibold tracking-tight text-[#1D1D1F]">
                  {product.name}
                </h3>
                {product.description ? (
                  <p className="mt-1 line-clamp-2 text-[13px] text-[#86868B]">
                    {product.description}
                  </p>
                ) : null}

                <div className="mt-4 flex items-end justify-between border-t border-black/[0.06] pt-4">
                  <div>
                    <p className="text-[18px] font-semibold tracking-tight text-[#1D1D1F]">
                      Rp {displayPrice.toLocaleString('id-ID')}
                    </p>
                    {hasDiscount ? (
                      <p className="text-[12px] text-[#86868B] line-through">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] font-medium text-[#86868B]">
                    <IconStack2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {product.productVariants.length} varian
                  </div>
                </div>

                <Link
                  href={`/admin/products/${product.id}` as Route}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-black/[0.04] text-[13px] font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.08]"
                >
                  <IconEdit className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Edit
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.1] bg-white p-12 text-center">
          <p className="text-[15px] font-medium text-[#1D1D1F]">Tidak ada produk yang cocok</p>
          <p className="mt-1 text-[13px] text-[#86868B]">
            Coba kata kunci lain atau hapus filter pencarian.
          </p>
        </div>
      ) : null}
    </div>
  );
}
