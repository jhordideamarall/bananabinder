import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Detail Pesanan',
};
import { notFound } from 'next/navigation';
import {
  ArrowLeft as IconArrowLeft,
  MapPin as IconMapPin,
  Package as IconPackage,
  Truck as IconTruck,
  User as IconUser,
} from 'lucide-react';
import { Card, CardContent } from '@bananasbindery/ui/components/card';
import { db } from '@/lib/db';
import { getAdminOrderDetail } from '@/lib/admin-data';
import { updateOrderStatus } from '../../actions';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'expired',
  'return_requested',
  'returned',
  'refunded',
] as const;

const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded', 'partial_refund', 'dp_paid'] as const;

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-500',
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderDetail(db, id);

  if (!order) notFound();

  const shippingMeta = (order.shipping_metadata ?? {}) as Record<string, unknown>;
  const trackingId =
    (shippingMeta.courier_tracking_id as string | undefined) ?? order.shipping_tracking ?? null;
  const biteshipStatus = shippingMeta.biteship_status as string | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-gray-400 transition hover:text-primary"
          >
            <IconArrowLeft className="h-4 w-4" /> Kembali ke daftar order
          </Link>
          <h1 className="font-heading text-3xl font-black text-gray-900">
            Order #{order.order_number}
          </h1>
          <p className="text-sm font-medium text-gray-500">Dibuat {formatDate(order.created_at)}</p>
        </div>
        <span
          className={`inline-flex h-fit rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider ${
            STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-500'
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* LEFT: items + customer + address */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2 font-heading text-lg font-black text-gray-900">
                <IconPackage className="h-5 w-5 text-primary" /> Item Pesanan
              </div>
              <div className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {item.product_name}
                      </p>
                      {item.variant_name ? (
                        <p className="text-xs font-medium text-gray-400">{item.variant_name}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs font-medium text-gray-400">
                        {item.quantity} x {fmt(item.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-gray-900">
                      {fmt(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                <Row label="Subtotal" value={fmt(order.subtotal)} />
                {order.discount > 0 ? (
                  <Row label="Diskon" value={`- ${fmt(order.discount)}`} />
                ) : null}
                <Row label="Ongkir" value={fmt(order.shipping_cost)} />
                {order.tax > 0 ? <Row label="Pajak (PPN)" value={fmt(order.tax)} /> : null}
                {order.service_fee > 0 ? (
                  <Row label="Biaya layanan" value={fmt(order.service_fee)} />
                ) : null}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="font-heading text-sm font-black text-gray-900">Total</span>
                  <span className="font-heading text-lg font-black text-primary">
                    {fmt(order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card className="border-none shadow-xl shadow-gray-100/50">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2 font-heading text-base font-black text-gray-900">
                  <IconUser className="h-4 w-4 text-primary" /> Pelanggan
                </div>
                <p className="text-sm font-bold text-gray-900">{order.customer?.name || 'Guest'}</p>
                <p className="text-xs font-medium text-gray-500">{order.customer?.phone || '-'}</p>
                <p className="text-xs font-medium text-gray-500">{order.customer?.email || '-'}</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-gray-100/50">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2 font-heading text-base font-black text-gray-900">
                  <IconMapPin className="h-4 w-4 text-primary" /> Alamat Kirim
                </div>
                {order.address ? (
                  <div className="text-xs font-medium leading-5 text-gray-500">
                    <p className="text-sm font-bold text-gray-900">
                      {order.address.recipient_name}
                    </p>
                    <p>{order.address.phone}</p>
                    <p className="mt-1">
                      {order.address.full_address}
                      {order.address.district ? `, ${order.address.district}` : ''}
                      {order.address.city ? `, ${order.address.city}` : ''}
                      {order.address.postal_code ? ` ${order.address.postal_code}` : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-gray-400">Alamat tidak tersedia</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-2 font-heading text-base font-black text-gray-900">
                <IconTruck className="h-4 w-4 text-primary" /> Pengiriman
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Row label="Kurir" value={order.shipping_courier || '-'} />
                <Row label="No. Resi" value={trackingId || 'Belum ada'} />
                <Row label="Status Biteship" value={biteshipStatus || '-'} />
                <Row label="Metode bayar" value={order.payment_method || '-'} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: status update form + timeline */}
        <aside className="space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-6">
              <h2 className="mb-4 font-heading text-base font-black text-gray-900">
                Update Status & Fulfillment
              </h2>
              <form action={updateOrderStatus} className="space-y-4">
                <input type="hidden" name="id" value={order.id} />

                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                    Status pesanan
                  </span>
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                    Status pembayaran
                  </span>
                  <select
                    name="payment_status"
                    defaultValue={order.payment_status}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                    No. Resi / Tracking
                  </span>
                  <input
                    type="text"
                    name="shipping_tracking"
                    defaultValue={order.shipping_tracking ?? ''}
                    placeholder="Masukkan nomor resi"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                    Catatan internal
                  </span>
                  <textarea
                    name="notes"
                    defaultValue={order.notes ?? ''}
                    rows={3}
                    placeholder="Catatan untuk tim (opsional)"
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
                  />
                </label>

                <button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-primary font-heading text-sm font-black text-white shadow-lg shadow-primary/30 transition active:scale-[0.98]"
                >
                  Simpan Perubahan
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-6">
              <h2 className="mb-3 font-heading text-base font-black text-gray-900">Timeline</h2>
              <div className="space-y-2 text-sm">
                <Row label="Dibuat" value={formatDate(order.created_at)} />
                <Row label="Dibayar" value={formatDate(order.paid_at)} />
                <Row label="Dikirim" value={formatDate(order.shipped_at)} />
                <Row label="Diterima" value={formatDate(order.delivered_at)} />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="text-right font-bold text-gray-900">{value}</span>
    </div>
  );
}
