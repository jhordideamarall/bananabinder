import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import {
  ClipboardList as IconClipboardList,
  Eye as IconEye,
  Image as IconImage,
  MessageCircle as IconMessageCircle,
  Package as IconPackage,
  Save as IconSave,
  Settings as IconSettings,
} from 'lucide-react';
import { db } from '@/lib/db';
import { getAdminCustomOrderCatalogConfig, getAdminCustomOrders } from '@/lib/admin-data';
import { updateCustomOrderControl } from '../actions';

export const metadata: Metadata = {
  title: 'Custom Orders',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'processing', label: 'Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu konfirmasi',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
};

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu konfirmasi' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Belum ditagih' },
  { value: 'dp_paid', label: 'DP dibayar' },
  { value: 'paid', label: 'Lunas' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partial_refund', label: 'Partial refund' },
] as const;

function statusClass(status: string): string {
  switch (status) {
    case 'paid':
    case 'completed':
    case 'delivered':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'processing':
    case 'shipped':
      return 'bg-blue-100 text-blue-700';
    case 'cancelled':
    case 'expired':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-black/[0.04] text-[#86868B]';
  }
}

const fmt = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

function whatsappHref(target?: string): string | null {
  if (!target) return null;
  const digits = target.replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export default async function AdminCustomOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const status = resolvedSearchParams.status || null;
  const limit = 12;

  const [{ data: orders, total }, catalogConfig] = await Promise.all([
    getAdminCustomOrders(db, { status, page, limit }),
    getAdminCustomOrderCatalogConfig(db),
  ]);
  const whatsappSent = orders.filter((order) => order.custom_order_whatsapp?.success).length;
  const waiting = orders.filter((order) => order.status === 'pending').length;

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#86868B]">Custom order</p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
            Request custom binder
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#86868B]">
            Semua request dari halaman custom masuk ke sini tanpa Xendit. Admin cek detail, foto
            referensi, dan lanjutkan konfirmasi desain lewat WhatsApp.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Request" value={total.toString()} />
          <Metric label="Menunggu" value={waiting.toString()} />
          <Metric label="WA Sent" value={whatsappSent.toString()} />
        </div>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#86868B]">Setup paket aktif</p>
          <h2 className="mt-1 text-[18px] font-semibold text-[#1D1D1F]">
            {catalogConfig.product?.name || catalogConfig.productSlug}
          </h2>
          <p className="mt-1 text-[13px] leading-6 text-[#86868B]">
            {catalogConfig.product?.productVariants.filter((variant) => variant.is_active !== false)
              .length ?? 0}{' '}
            ukuran aktif, {catalogConfig.materials.length} pilihan bahan.
          </p>
        </div>
        <Link
          href={'/admin/custom-orders/setup' as Route}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[13px] font-semibold text-white transition hover:bg-black"
        >
          <IconSettings className="h-4 w-4" />
          Setup Paket
        </Link>
      </section>

      <nav
        aria-label="Filter status custom order"
        className="flex flex-wrap gap-1.5 rounded-full border border-black/[0.06] bg-white p-1 sm:inline-flex sm:w-auto"
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive = status === filter.value || (filter.value === 'all' && !status);
          return (
            <Link
              key={filter.value}
              href={
                filter.value === 'all'
                  ? ('/admin/custom-orders' as Route)
                  : {
                      pathname: '/admin/custom-orders' as const,
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

      {orders.length === 0 ? (
        <section className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-black/[0.06] bg-white px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <IconClipboardList className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-[17px] font-semibold text-[#1D1D1F]">Belum ada custom order</h2>
          <p className="mt-1 max-w-sm text-[13px] leading-6 text-[#86868B]">
            Request dari halaman custom akan muncul di sini setelah customer mengirim detail.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white"
            >
              <div className="flex items-start justify-between gap-4 border-b border-black/[0.05] px-5 py-4">
                <div>
                  <p className="font-mono text-[12px] font-semibold text-[#86868B]">
                    {order.order_number}
                  </p>
                  <h2 className="mt-1 text-[17px] font-semibold text-[#1D1D1F]">
                    {order.customer?.name || 'Customer'}
                  </h2>
                  <p className="text-[12px] text-[#86868B]">
                    {new Date(order.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass(order.status)}`}
                >
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-[128px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.03]">
                    {order.custom_details.referenceImageUrl ? (
                      <Image
                        src={order.custom_details.referenceImageUrl}
                        alt="Foto referensi custom"
                        fill
                        className="object-cover"
                      />
                    ) : order.image_url ? (
                      <Image
                        src={order.image_url}
                        alt={order.product_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#86868B]">
                        <IconImage className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl bg-black/[0.03] px-3 py-2 text-[11px] font-semibold text-[#86868B]">
                    {order.custom_details.referenceImageName || 'Foto referensi belum diupload'}
                  </div>
                </div>

                <div className="min-w-0 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#1D1D1F]">
                      <IconPackage className="h-4 w-4 text-primary" />
                      {order.product_name}
                    </div>
                    <div className="grid gap-2 rounded-xl border border-black/[0.06] p-3 text-[12px] leading-5 text-[#1D1D1F]">
                      <Row label="Varian" value={order.variant_name || order.custom_details.size} />
                      <Row label="Material" value={order.custom_details.material} />
                      <Row label="Teks/Nama" value={order.custom_details.personalization} />
                      <Row label="Qty" value={order.quantity.toString()} />
                      <Row label="Estimasi" value={fmt(order.total)} />
                    </div>
                    {order.custom_details.designNotes ? (
                      <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-[12px] leading-5 text-[#1D1D1F]">
                        {order.custom_details.designNotes}
                      </p>
                    ) : null}
                    {order.custom_details.referenceUrl ? (
                      <p className="mt-2 break-all text-[12px] font-medium text-primary">
                        {order.custom_details.referenceUrl}
                      </p>
                    ) : null}
                  </div>

                  <form
                    action={updateCustomOrderControl}
                    className="space-y-3 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3"
                  >
                    <input type="hidden" name="id" value={order.id} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                          Nama paket
                        </span>
                        <input
                          type="text"
                          name="product_name"
                          defaultValue={order.product_name}
                          className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] font-semibold text-[#1D1D1F] outline-none focus:border-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                          Varian paket
                        </span>
                        <input
                          type="text"
                          name="variant_name"
                          defaultValue={order.variant_name ?? order.custom_details.size}
                          className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] font-semibold text-[#1D1D1F] outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                          Bahan
                        </span>
                        <input
                          type="text"
                          name="material"
                          defaultValue={order.custom_details.material}
                          className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] font-semibold text-[#1D1D1F] outline-none focus:border-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                          Teks/Nama custom
                        </span>
                        <input
                          type="text"
                          name="personalization"
                          defaultValue={order.custom_details.personalization}
                          className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] font-semibold text-[#1D1D1F] outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                          Status order
                        </span>
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] font-semibold text-[#1D1D1F] outline-none focus:border-primary"
                        >
                          {ORDER_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                          Pembayaran
                        </span>
                        <select
                          name="payment_status"
                          defaultValue={order.payment_status}
                          className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] font-semibold text-[#1D1D1F] outline-none focus:border-primary"
                        >
                          {PAYMENT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                        Estimasi / final total
                      </span>
                      <input
                        type="number"
                        min={1}
                        name="total"
                        defaultValue={order.total}
                        className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] font-semibold text-[#1D1D1F] outline-none focus:border-primary"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                        Catatan internal
                      </span>
                      <textarea
                        name="notes"
                        defaultValue={order.notes ?? ''}
                        rows={2}
                        placeholder="Contoh: desain sudah oke, tunggu DP, revisi warna cover..."
                        className="w-full resize-none rounded-lg border border-black/[0.08] bg-white p-2 text-[12px] font-medium leading-5 text-[#1D1D1F] outline-none placeholder:text-[#86868B] focus:border-primary"
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white transition active:scale-[0.98]"
                    >
                      <IconSave className="h-4 w-4" />
                      Simpan kontrol custom order
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.05] pt-4">
                    <div className="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-[#86868B]">
                      <IconMessageCircle className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {order.custom_order_whatsapp?.success
                          ? 'WhatsApp terkirim'
                          : order.custom_order_whatsapp?.attempted
                            ? 'WhatsApp gagal'
                            : 'WhatsApp belum terkirim'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {whatsappHref(order.custom_order_whatsapp?.target) ? (
                        <a
                          href={whatsappHref(order.custom_order_whatsapp?.target) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center rounded-full border border-black/[0.08] bg-white px-4 text-[13px] font-semibold text-[#1D1D1F] transition hover:bg-black/[0.04]"
                        >
                          WA
                        </a>
                      ) : null}
                      <Link
                        href={`/admin/orders/${order.id}` as Route}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1D1D1F] px-4 text-[13px] font-semibold text-white transition hover:bg-black"
                      >
                        <IconEye className="h-4 w-4" />
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">{label}</p>
      <p className="mt-1 text-[20px] font-semibold text-[#1D1D1F]">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#86868B]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
