'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import type { Route } from 'next';
import { ArrowLeft, MapPin, Package, CreditCard, ChevronRight, Loader2, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    product_images: { url: string }[];
  } | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  shipping_cost: number | null;
  created_at: string;
  addresses: {
    recipient_name: string;
    phone: string;
    full_address: string;
    city: string;
    postal_code: string;
  } | null;
  order_items: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Pembayaran',
  paid: 'Sudah Dibayar',
  processing: 'Diproses',
  shipped: 'Sedang Dikirim',
  delivered: 'Selesai',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E8', text: '#E07B39' },
  paid: { bg: '#F0FBF4', text: '#2D7D52' },
  processing: { bg: '#EEF2FF', text: '#6C5CE7' },
  shipped: { bg: '#EAF6FF', text: '#0288D1' },
  delivered: { bg: '#F0FBF4', text: '#2D7D52' },
  completed: { bg: '#F0FBF4', text: '#2D7D52' },
  cancelled: { bg: '#FFF0F0', text: '#E53935' },
};

function formatPrice(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const supabase = createClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*, product_images(*))), addresses(*)')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      return data as unknown as Order;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#FDFCFB]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[#FDFCFB] px-10 text-center">
        <Package size={48} className="text-ink-4" />
        <h2 className="mt-4 font-heading text-[18px] font-extrabold text-ink">Pesanan Tidak Ditemukan</h2>
        <button onClick={() => router.back()} className="mt-6 text-primary font-bold">Kembali</button>
      </div>
    );
  }

  const st = STATUS_COLOR[order.status] || STATUS_COLOR.pending;

  return (
    <div className="min-h-dvh bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stone-2 bg-[#FDFCFB]/90 px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-stone-2 text-ink shadow-sm active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading text-[18px] font-extrabold text-ink">Detail Pesanan</h1>
        </div>
      </header>

      <main className="px-5 pt-6 space-y-5">
        {/* Status Card */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-ink-4 uppercase tracking-wider">Status Pesanan</p>
              <h2 className="mt-1 font-heading text-[20px] font-extrabold" style={{ color: st.text }}>
                {STATUS_LABEL[order.status]}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: st.bg, color: st.text }}>
              <Package size={24} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-2/50 flex justify-between items-center">
            <p className="text-[12px] font-bold text-ink-4">No. Pesanan</p>
            <p className="text-[12px] font-extrabold text-ink">{order.order_number}</p>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-stone-1 flex items-center justify-center text-ink-3">
              <MapPin size={18} />
            </div>
            <h3 className="font-heading text-[15px] font-extrabold text-ink">Alamat Pengiriman</h3>
          </div>
          <div className="pl-11">
            <p className="text-[14px] font-extrabold text-ink">{order.addresses?.recipient_name}</p>
            <p className="mt-1 text-[13px] text-ink-3 leading-relaxed">
              {order.addresses?.phone}<br />
              {order.addresses?.full_address}<br />
              {order.addresses?.city}, {order.addresses?.postal_code}
            </p>
          </div>
          
          {order.status === 'shipped' && (
            <button 
              onClick={() => router.push(`/account/orders/${order.id}/tracking` as Route)}
              className="mt-6 flex w-full items-center justify-between rounded-2xl bg-stone-1 px-5 py-4 border border-stone-2 hover:bg-stone-2 transition-colors"
            >
              <div className="flex items-center gap-3 text-primary">
                <Truck size={20} />
                <span className="text-[13px] font-extrabold">Lacak Pengiriman</span>
              </div>
              <ChevronRight size={18} className="text-ink-4" />
            </button>
          )}
        </div>

        {/* Order Items */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <h3 className="font-heading text-[15px] font-extrabold text-ink mb-4">Produk</h3>
          <div className="space-y-4">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-1 border border-stone-2">
                  <Image
                    src={item.products?.product_images?.[0]?.url || ''}
                    alt={item.products?.name || ''}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold text-ink line-clamp-1">{item.products?.name}</p>
                  <p className="mt-1 text-[12px] font-bold text-ink-4">{item.quantity} x {formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-stone-1 flex items-center justify-center text-ink-3">
              <CreditCard size={18} />
            </div>
            <h3 className="font-heading text-[15px] font-extrabold text-ink">Rincian Pembayaran</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-[13px]">
              <span className="font-bold text-ink-4">Metode Pembayaran</span>
              <span className="font-extrabold text-ink">Virtual Account / QRIS</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="font-bold text-ink-4">Total Harga Produk</span>
              <span className="font-extrabold text-ink">{formatPrice(order.total - (order.shipping_cost || 0))}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="font-bold text-ink-4">Ongkos Kirim</span>
              <span className="font-extrabold text-ink">{formatPrice(order.shipping_cost || 0)}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-2/50 flex justify-between items-center">
              <span className="font-heading text-[15px] font-extrabold text-ink">Total Pembayaran</span>
              <span className="font-heading text-[18px] font-extrabold text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
