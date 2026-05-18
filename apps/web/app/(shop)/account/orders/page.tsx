'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { m } from 'framer-motion';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUserOrders } from '@/lib/services/order-client';
import { toast } from 'sonner';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Pembayaran',
  paid: 'Sudah Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
  returned: 'Dikembalikan',
  refunded: 'Dikembalikan',
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E8', text: '#E07B39' },
  paid: { bg: '#F0FBF4', text: '#2D7D52' },
  processing: { bg: '#EEF2FF', text: '#6C5CE7' },
  shipped: { bg: '#EAF6FF', text: '#0288D1' },
  delivered: { bg: '#F0FBF4', text: '#2D7D52' },
  completed: { bg: '#F0FBF4', text: '#2D7D52' },
  cancelled: { bg: '#FFF0F0', text: '#E53935' },
  expired: { bg: '#FFF0F0', text: '#E53935' },
  returned: { bg: '#F5F5F5', text: '#616161' },
};

function formatPrice(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`;
}

function metadataFlow(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null;
  const flow = (value as Record<string, unknown>).flow;
  return typeof flow === 'string' ? flow : null;
}

function isCustomRequestOrder(order: {
  payment_method?: string | null;
  payment_metadata?: unknown;
}): boolean {
  return (
    order.payment_method === 'custom_request' ||
    metadataFlow(order.payment_metadata) === 'custom_request'
  );
}

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Belum Bayar' },
  { id: 'processing', label: 'Dikemas' },
  { id: 'shipped', label: 'Dikirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getUserOrders,
  });

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'processing') return order.status === 'paid' || order.status === 'processing';
    if (activeTab === 'shipped') return order.status === 'shipped';
    if (activeTab === 'completed')
      return order.status === 'completed' || order.status === 'delivered';
    if (activeTab === 'cancelled')
      return order.status === 'cancelled' || order.status === 'expired';
    return true;
  });

  const { mutate: handlePay, isPending: isPaying } = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyiapkan pembayaran');
      return data.invoice_url;
    },
    onSuccess: (url) => {
      if (url) {
        window.location.href = url;
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="min-h-dvh bg-[#FDFCFB]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stone-2 bg-[#FDFCFB]/90 px-5 pb-0 pt-[max(18px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="grid grid-cols-3 items-center pb-3">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm font-bold text-ink-3 hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Kembali</span>
            </button>
          </div>

          <h1 className="text-center font-heading text-[17px] font-extrabold text-ink truncate">
            Pesanan Saya
          </h1>

          <div className="flex justify-end invisible pointer-events-none">
            <button className="flex items-center gap-1 text-sm font-bold">
              <ArrowLeft size={18} />
              <span>Kembali</span>
            </button>
          </div>
        </div>

        {/* Shopee Style Tabs */}
        <div className="flex overflow-x-auto no-scrollbar -mx-5 px-5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-none px-4 py-3 text-[13px] font-bold transition-colors ${
                  isActive ? 'text-primary' : 'text-ink-4 hover:text-ink-3'
                }`}
              >
                {tab.label}
                {isActive && (
                  <m.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="flex h-[40dvh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="rounded-full bg-stone-2 p-6">
              <Package size={40} className="text-ink-4" />
            </div>
            <p className="mt-5 font-heading text-[16px] font-extrabold text-ink">
              Belum ada pesanan
            </p>
            <p className="mt-1 px-10 text-[13px] text-ink-3">
              Pesanan di kategori ini masih kosong. Yuk, cari produk favoritmu!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order, i) => {
              const st = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
              const itemsCount = order.order_items?.length || 0;
              const firstItem = order.order_items?.[0];
              const hasCustomItem = order.order_items?.some((item) => item.custom_details) ?? false;
              const isCustomRequest = isCustomRequestOrder(order);
              const statusLabel =
                isCustomRequest && order.status === 'pending'
                  ? 'Menunggu Konfirmasi'
                  : STATUS_LABEL[order.status];

              return (
                <m.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-stone-2/50 bg-stone-1/30 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary/20 animate-pulse" />
                      <p className="font-heading text-[12px] font-extrabold text-ink">
                        {order.order_number}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-tight"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-1 border border-stone-2 shadow-sm">
                        {firstItem?.products?.product_images?.[0]?.url ? (
                          <Image
                            src={firstItem.products.product_images[0].url}
                            alt={firstItem.products.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-ink-4">
                            <Package size={24} />
                          </div>
                        )}
                        {itemsCount > 1 && (
                          <div className="absolute bottom-0 right-0 left-0 bg-black/60 py-0.5 text-center text-[9px] font-bold text-white backdrop-blur-sm">
                            +{itemsCount - 1} Item
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="font-heading text-[14px] font-extrabold text-ink line-clamp-1">
                          {firstItem?.products?.name ||
                            firstItem?.product_name ||
                            'Produk Bananasbindery'}
                        </p>
                        {hasCustomItem ? (
                          <span className="mt-1 inline-flex rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary">
                            Custom binder
                          </span>
                        ) : null}
                        {isCustomRequest ? (
                          <p className="mt-1 text-[11px] font-bold leading-relaxed text-ink-4">
                            Admin akan konfirmasi desain dan pembayaran final lewat WhatsApp.
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] font-bold text-ink-3">
                          {new Intl.DateTimeFormat('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }).format(new Date(order.created_at || new Date()))}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[12px] font-bold text-ink-3">Total Pesanan</p>
                          <p className="font-heading text-[16px] font-extrabold text-[#E53935]">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex gap-2">
                      {order.status === 'pending' && !isCustomRequest && (
                        <button
                          onClick={() => handlePay(order.id)}
                          disabled={isPaying}
                          className="flex-1 rounded-xl bg-primary py-3 text-[13px] font-extrabold text-white shadow-[0_4px_12px_rgba(224,123,57,0.3)] active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isPaying ? (
                            <Loader2 className="mx-auto animate-spin" size={18} />
                          ) : (
                            'Bayar Sekarang'
                          )}
                        </button>
                      )}

                      {order.status === 'pending' && isCustomRequest && (
                        <div className="flex-1 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-center text-[12px] font-extrabold text-primary">
                          Menunggu Konfirmasi Admin
                        </div>
                      )}

                      {order.status === 'shipped' && (
                        <button
                          onClick={() =>
                            router.push(`/account/orders/${order.id}/tracking` as Route)
                          }
                          className="flex-1 rounded-xl bg-ink py-3 text-[13px] font-extrabold text-white shadow-lg active:scale-95 transition-all"
                        >
                          Lacak Pengiriman
                        </button>
                      )}

                      {(order.status === 'completed' || order.status === 'delivered') && (
                        <button className="flex-1 rounded-xl border-2 border-stone-2 py-2.5 text-[13px] font-extrabold text-ink hover:bg-stone-1 active:scale-95 transition-all">
                          Beli Lagi
                        </button>
                      )}

                      <button
                        onClick={() => router.push(`/account/orders/${order.id}` as Route)}
                        className="flex-none rounded-xl border-2 border-primary/30 bg-white px-5 py-3 text-[13px] font-extrabold text-ink active:scale-95 transition-all"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                </m.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
