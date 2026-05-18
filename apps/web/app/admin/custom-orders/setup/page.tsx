import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { db } from '@/lib/db';
import { getAdminCustomOrderCatalogConfig } from '@/lib/admin-data';
import { CustomOrderSetupForm } from '@/components/admin/custom-orders/CustomOrderSetupForm';

export const metadata: Metadata = {
  title: 'Setup Custom Order',
};

export default async function AdminCustomOrderSetupPage() {
  const catalogConfig = await getAdminCustomOrderCatalogConfig(db);

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/custom-orders"
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#86868B] transition hover:text-[#1D1D1F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke custom order
          </Link>
          <p className="mt-4 text-[13px] font-medium text-[#86868B]">Konfigurasi form customer</p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
            Setup paket custom order
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#86868B]">
            Atur data yang dipakai halaman `/custom`: produk sumber, bahan, ukuran, stok, berat, dan
            harga. Request customer tetap dikelola di halaman Custom Order.
          </p>
        </div>
        <Link
          href={'/custom' as Route}
          target="_blank"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-[13px] font-semibold text-[#1D1D1F] transition hover:bg-black/[0.03]"
        >
          Preview customer
          <ExternalLink className="h-4 w-4" />
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        <CustomOrderSetupForm config={catalogConfig} />
      </section>
    </div>
  );
}
