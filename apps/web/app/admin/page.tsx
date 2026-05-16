import { db } from '@/lib/db';
import { getAdminStats, getAdminRevenueChart, getAdminProducts } from '@/lib/admin-data';
import {
  DollarSign as IconCurrencyDollar,
  ShoppingCart as IconShoppingCart,
  Clock as IconClock,
  TrendingUp as IconTrendingUp,
  ArrowUpRight as IconArrowUpRight,
  ArrowRight as IconArrowRight,
  Plus as IconPlus,
} from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';

interface ChartDay {
  date: string;
  revenue: string | number;
}

const idr = (value: number): string => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

export default async function AdminDashboardPage() {
  const [stats, chartData, products] = await Promise.all([
    getAdminStats(db),
    getAdminRevenueChart(db, 7) as Promise<ChartDay[]>,
    getAdminProducts(db),
  ]);

  const lowStockVariants = products
    .flatMap((product) =>
      product.productVariants
        .filter((variant) => Number(variant.stock ?? 0) < 10)
        .map((variant) => ({
          product: product.name,
          variant: variant.name,
          stock: variant.stock ?? 0,
        })),
    )
    .sort((a, b) => Number(a.stock) - Number(b.stock));

  const statCards: {
    label: string;
    value: string | number;
    icon: typeof IconCurrencyDollar;
    href: Route;
    accent?: boolean;
  }[] = [
    {
      label: 'Pendapatan total',
      value: idr(stats.totalRevenue),
      icon: IconCurrencyDollar,
      href: '/admin/orders',
    },
    {
      label: 'Hari ini',
      value: idr(stats.todayRevenue),
      icon: IconTrendingUp,
      href: '/admin/orders',
      accent: true,
    },
    {
      label: 'Total pesanan',
      value: stats.totalOrders,
      icon: IconShoppingCart,
      href: '/admin/orders',
    },
    {
      label: 'Menunggu pembayaran',
      value: stats.pendingOrders,
      icon: IconClock,
      href: '/admin/orders?status=pending' as Route,
    },
  ];

  const maxRevenue = Math.max(...chartData.map((d) => Number(d.revenue) || 0), 1);

  const quickActions: { label: string; href: Route }[] = [
    { label: 'Tambah produk', href: '/admin/products/new' },
    { label: 'Buat voucher', href: '/admin/promos' },
    { label: 'Kelola kategori', href: '/admin/categories' },
    { label: 'Edit banner home', href: '/admin/promos' },
  ];

  return (
    <div className="mx-auto max-w-[1240px] space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#86868B]">Dashboard</p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
            Ringkasan toko
          </h1>
        </div>
        <Link
          href={'/admin/products/new' as Route}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black"
        >
          <IconPlus className="h-4 w-4" strokeWidth={2} />
          Produk baru
        </Link>
      </header>

      <section
        aria-label="Metrik utama"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] bg-white p-5 transition-colors hover:border-black/[0.12]"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    stat.accent ? 'bg-primary/25 text-[#1D1D1F]' : 'bg-black/[0.04] text-[#1D1D1F]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </div>
                <IconArrowUpRight
                  className="h-4 w-4 text-[#C7C7CC] transition-colors group-hover:text-[#1D1D1F]"
                  strokeWidth={1.75}
                />
              </div>
              <div className="mt-6">
                <p className="text-[13px] font-medium text-[#86868B]">{stat.label}</p>
                <p className="mt-1 text-[26px] font-semibold tracking-tight text-[#1D1D1F]">
                  {stat.value}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-black/[0.06] bg-white p-6 lg:col-span-2">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
                Pendapatan 7 hari terakhir
              </h2>
              <p className="mt-0.5 text-[13px] text-[#86868B]">
                Tap bar untuk lihat detail pesanan hari itu.
              </p>
            </div>
            <Link
              href={'/admin/orders' as Route}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1D1D1F] hover:underline"
            >
              Lihat semua
              <IconArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </header>

          <div className="flex h-[260px] items-end gap-3 px-2">
            {chartData.map((day) => {
              const value = Number(day.revenue) || 0;
              const height = (value / maxRevenue) * 100;
              return (
                <div
                  key={day.date}
                  className="group/bar relative flex flex-1 flex-col items-center gap-3"
                >
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1D1D1F] px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
                    {idr(value)}
                  </div>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-md bg-primary/40 transition-colors group-hover/bar:bg-primary"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[#86868B]">
                    {new Date(day.date).toLocaleDateString('id-ID', {
                      weekday: 'short',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
              <h3 className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">
                Stok menipis
              </h3>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#86868B]">
              {lowStockVariants.length > 0
                ? `${lowStockVariants.length} varian punya stok di bawah 10 unit.`
                : 'Semua varian masih punya stok cukup.'}
            </p>
            {lowStockVariants[0] ? (
              <div className="mt-4 rounded-xl bg-black/[0.03] px-3 py-2.5">
                <p className="text-[12px] text-[#86868B]">Paling rendah</p>
                <p className="mt-0.5 text-[13px] font-medium text-[#1D1D1F]">
                  {lowStockVariants[0].product} — {lowStockVariants[0].variant}
                </p>
                <p className="mt-0.5 text-[12px] text-[#86868B]">
                  Tersisa {lowStockVariants[0].stock} unit
                </p>
              </div>
            ) : null}
            <Link
              href={'/admin/products' as Route}
              className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[#1D1D1F] hover:underline"
            >
              Cek katalog
              <IconArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </article>

          <article className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <h3 className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">Aksi cepat</h3>
            <ul className="mt-3 divide-y divide-black/[0.06]">
              {quickActions.map((action) => (
                <li key={action.label}>
                  <Link
                    href={action.href}
                    className="-mx-2 flex items-center justify-between rounded-lg px-2 py-2.5 text-[14px] font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.04]"
                  >
                    {action.label}
                    <IconArrowRight className="h-4 w-4 text-[#86868B]" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
