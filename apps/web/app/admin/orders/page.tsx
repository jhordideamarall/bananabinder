import { db } from '@/lib/db';
import { getAdminOrders } from '@/lib/admin-data';
import {
  Search as IconSearch,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  Eye as IconEye,
} from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

function statusToneClass(status: string): string {
  switch (status) {
    case 'paid':
    case 'completed':
      return 'bg-primary/20 text-[#1D1D1F]';
    case 'pending':
      return 'bg-black/[0.06] text-[#1D1D1F]';
    case 'shipped':
      return 'bg-black/[0.05] text-[#1D1D1F]';
    case 'cancelled':
      return 'bg-black/[0.04] text-[#86868B]';
    default:
      return 'bg-black/[0.04] text-[#86868B]';
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const status = resolvedSearchParams.status || null;
  const limit = 10;

  const { data: orders, total } = await getAdminOrders(db, {
    status,
    page,
    limit,
  });

  const showingFrom = orders.length === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = (page - 1) * limit + orders.length;

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#86868B]">Pesanan</p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
            Kelola pesanan
          </h1>
        </div>
        <div className="relative w-full sm:w-72">
          <IconSearch
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868B]"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Cari Order ID atau nama..."
            className="h-10 w-full rounded-full border border-black/[0.08] bg-white pl-10 pr-4 text-[14px] text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </header>

      <nav
        aria-label="Filter status"
        className="flex flex-wrap gap-1.5 rounded-full border border-black/[0.06] bg-white p-1 sm:inline-flex sm:w-auto"
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive = status === filter.value || (filter.value === 'all' && !status);
          return (
            <Link
              key={filter.value}
              href={
                filter.value === 'all'
                  ? ('/admin/orders' as Route)
                  : {
                      pathname: '/admin/orders' as const,
                      query: { status: filter.value },
                    }
              }
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
                isActive
                  ? 'bg-[#1D1D1F] font-semibold text-white'
                  : 'font-medium text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                  Order
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                  Pelanggan
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                  Total
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                  Status
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                  Tanggal
                </th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-[15px] font-medium text-[#1D1D1F]">Belum ada pesanan</p>
                    <p className="mt-1 text-[13px] text-[#86868B]">
                      Pesanan akan muncul di sini saat pelanggan checkout.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-black/[0.02]">
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-black/[0.04] px-2 py-1 font-mono text-[12px] font-medium text-[#1D1D1F]">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-[#1D1D1F]">
                          {order.user?.full_name || 'Tamu'}
                        </span>
                        {order.user?.phone ? (
                          <span className="text-[12px] text-[#86868B]">{order.user.phone}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-semibold tracking-tight text-[#1D1D1F]">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${statusToneClass(order.status)}`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#86868B]">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={{
                          pathname: '/admin/orders/[id]',
                          query: { id: order.id },
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#86868B] transition-colors hover:bg-black/[0.05] hover:text-[#1D1D1F]"
                        aria-label="Detail pesanan"
                      >
                        <IconEye className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-black/[0.06] px-6 py-4">
          <p className="text-[12px] text-[#86868B]">
            Menampilkan {showingFrom}–{showingTo} dari {total} pesanan
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] text-[#86868B] transition-colors hover:border-black/[0.16] hover:text-[#1D1D1F] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman sebelumnya"
            >
              <IconChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] text-[#86868B] transition-colors hover:border-black/[0.16] hover:text-[#1D1D1F] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Halaman berikutnya"
            >
              <IconChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
