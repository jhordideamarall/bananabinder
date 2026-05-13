'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { m } from 'framer-motion';
import { ArrowLeft, MapPin, Truck, CheckCircle2, Package, Copy, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TrackingHistory {
  status: string;
  note: string;
  updated_at: string;
}

interface TrackingData {
  waybill_id: string;
  courier: {
    company: string;
    type: string;
  };
  history: TrackingHistory[];
  destination: {
    address: string;
  };
}

export default function TrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const {
    data: trackingData,
    isLoading,
    error,
  } = useQuery<TrackingData>({
    queryKey: ['tracking', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/shipping/track/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data pelacakan');
      return data as TrackingData;
    },
    retry: false,
  });

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Nomor resi disalin!');
  };

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[#FDFCFB]">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="mt-4 text-[13px] font-bold text-ink-3">Mencari paketmu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[#FDFCFB] px-10 text-center">
        <div className="rounded-full bg-stone-2 p-6">
          <Package size={40} className="text-ink-4" />
        </div>
        <h2 className="mt-6 font-heading text-[18px] font-extrabold text-ink">
          Pelacakan Belum Tersedia
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
          Sabar ya, paketmu mungkin baru saja diserahkan ke kurir. Coba cek lagi beberapa saat lagi!
        </p>
        <button
          onClick={() => router.back()}
          className="mt-8 rounded-xl bg-primary px-8 py-3 text-[14px] font-extrabold text-white shadow-lg"
        >
          Kembali
        </button>
      </div>
    );
  }

  const history = trackingData?.history || [];

  return (
    <div className="min-h-dvh bg-[#FDFCFB] pb-10">
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
          <div>
            <h1 className="font-heading text-[18px] font-extrabold text-ink">Lacak Pesanan</h1>
            <p className="text-[11px] font-bold text-ink-4 uppercase tracking-wider">
              ID: {trackingData?.waybill_id || 'PROSES'}
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6">
        {/* Courier Info Card */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Truck size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-4">Kurir</p>
              <h3 className="font-heading text-[16px] font-extrabold text-ink">
                {trackingData?.courier?.company?.toUpperCase()} -{' '}
                {trackingData?.courier?.type?.toUpperCase()}
              </h3>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-stone-1 px-4 py-3 border border-stone-2/50">
            <div>
              <p className="text-[10px] font-bold text-ink-4 uppercase tracking-tighter">
                Nomor Resi
              </p>
              <p className="font-heading text-[14px] font-extrabold text-ink">
                {trackingData?.waybill_id}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(trackingData?.waybill_id || '')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-sm border border-stone-2 active:scale-90 transition-all"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="mt-8">
          <h3 className="px-1 font-heading text-[16px] font-extrabold text-ink mb-6">
            Status Pengiriman
          </h3>

          <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-stone-2">
            {history.length === 0 ? (
              <div className="py-4 text-center text-ink-4 text-[13px]">
                Belum ada histori pengiriman.
              </div>
            ) : (
              history.map((step: TrackingHistory, i: number) => {
                const isLatest = i === 0;
                return (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative"
                  >
                    {/* Dot */}
                    <div
                      className={`absolute -left-[30px] top-1 h-[24px] w-[24px] rounded-full border-4 border-[#FDFCFB] flex items-center justify-center shadow-sm ${
                        isLatest ? 'bg-primary text-white' : 'bg-stone-3 text-white'
                      }`}
                    >
                      {isLatest ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    <div
                      className={`rounded-2xl p-4 transition-all ${
                        isLatest
                          ? 'bg-white shadow-[0_4px_20px_rgba(224,123,57,0.1)] border border-primary/20'
                          : 'bg-stone-1/50 border border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p
                          className={`font-heading text-[14px] font-extrabold leading-tight ${
                            isLatest ? 'text-ink' : 'text-ink-3'
                          }`}
                        >
                          {step.status}
                        </p>
                        <p className="shrink-0 text-[10px] font-bold text-ink-4">
                          {step.updated_at
                            ? new Intl.DateTimeFormat('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(step.updated_at))
                            : ''}
                        </p>
                      </div>
                      <p
                        className={`mt-1.5 text-[12px] leading-relaxed ${
                          isLatest ? 'text-ink-2' : 'text-ink-4'
                        }`}
                      >
                        {step.note}
                      </p>
                      <p className="mt-2 text-[10px] font-bold text-ink-4 uppercase tracking-tighter">
                        {step.updated_at
                          ? new Intl.DateTimeFormat('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(step.updated_at))
                          : ''}
                      </p>
                    </div>
                  </m.div>
                );
              })
            )}
          </div>
        </div>

        {/* Origin/Destination Mini Map (Visual only) */}
        <div className="mt-10 rounded-[28px] bg-ink p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4 opacity-60">
            <MapPin size={18} />
            <p className="text-[12px] font-bold uppercase tracking-widest">Detail Lokasi</p>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 mt-1">
                <div className="h-2 w-2 rounded-full bg-white/40" />
                <div className="w-[1px] h-6 bg-white/20" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase">Pengirim</p>
                <p className="text-[13px] font-bold">Bananasbindery Store - Tangerang</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#E07B39] mt-1" />
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase">Penerima</p>
                <p className="text-[13px] font-bold line-clamp-1">
                  {trackingData?.destination?.address || 'Alamat Penerima'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
