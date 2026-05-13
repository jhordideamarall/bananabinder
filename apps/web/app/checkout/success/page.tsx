'use client';
import Link from 'next/link';
import { m } from 'framer-motion';

const CheckIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

import { useEffect, useState, use } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function CheckoutSuccessPage(props: { searchParams: Promise<{ order_id?: string }> }) {
  const searchParams = use(props.searchParams);
  const orderId = searchParams.order_id;
  const clearCart = useCartStore((state) => state.clearCart);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    clearCart();
  }, [clearCart]);

  const { data: order } = useQuery({
    queryKey: ['order-success', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single();
      return data;
    },
    enabled: !!orderId
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-8 py-20 text-center">
      <m.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-sm"
      >
        <CheckIcon />
      </m.div>

      <m.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-3 font-heading text-2xl font-extrabold tracking-tight text-ink"
      >
        Pesanan Dikonfirmasi
      </m.h1>

      <m.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 text-sm text-ink-3"
      >
        Terima kasih! Pesananmu sedang diproses. Kamu bisa pantau status pengiriman di menu pesanan.
      </m.p>

      <m.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-12 w-full rounded-2xl bg-stone p-5 text-center shadow-inner"
      >
        <p className="mb-1 text-[11px] font-medium text-ink-4 uppercase tracking-widest">
          Nomor Pesanan
        </p>
        <p className="font-heading text-lg font-extrabold tracking-tighter text-ink">
          {mounted ? (order?.order_number || '...') : '...'}
        </p>
      </m.div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/account/orders"
          className="flex w-full items-center justify-center rounded-xl bg-primary py-4 font-heading text-sm font-bold text-white shadow-md active:scale-95 transition-transform"
        >
          Lihat Pesanan
        </Link>
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-xl border border-stone-3 bg-white py-4 font-heading text-sm font-bold text-ink hover:bg-stone active:scale-95 transition-transform"
        >
          Lanjut Belanja
        </Link>
      </div>
    </div>
  );
}
