'use client';

import { useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { ArrowLeft, Gift, Star, TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUserLoyalty, getUserLoyaltyHistory } from '@/lib/services/loyalty-client';

const TIERS = [
  { name: 'Bronze', min: 0, max: 500, color: '#CD7F32' },
  { name: 'Silver', min: 500, max: 2000, color: '#9CA3AF' },
  { name: 'Gold', min: 2000, max: 5000, color: '#F4A261' },
];

export default function LoyaltyPage() {
  const router = useRouter();

  const { data: loyalty, isLoading: isLoadingLoyalty } = useQuery({
    queryKey: ['loyalty'],
    queryFn: getUserLoyalty,
  });

  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['loyalty-history'],
    queryFn: getUserLoyaltyHistory,
  });

  const CURRENT_POINTS = loyalty?.total_points || 0;
  const LIFETIME_POINTS = loyalty?.lifetime_points || 0;

  const currentTier =
    TIERS.find((t) => LIFETIME_POINTS >= t.min && LIFETIME_POINTS < t.max) ?? TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const progress = nextTier
    ? ((LIFETIME_POINTS - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  if (isLoadingLoyalty || isLoadingHistory) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-[#FDFCFB]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-2 bg-[#FDFCFB]/90 px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-3"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>
        <h1 className="mt-3 font-heading text-[22px] font-extrabold text-ink">Loyalty Poin</h1>
      </header>

      <main className="px-5 py-5">
        {/* Hero card */}
        <m.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-[24px] p-5"
          style={{
            background: `linear-gradient(135deg, #1A1714 0%, #3D2F1E 100%)`,
            boxShadow: '0 12px 32px rgba(26,23,20,0.25)',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-white/50">
                Total Poin
              </p>
              <p className="mt-1 font-heading text-[42px] font-extrabold leading-none text-white">
                {CURRENT_POINTS.toLocaleString('id-ID')}
              </p>
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
                style={{ background: currentTier.color + '30', color: currentTier.color }}
              >
                <Star size={11} fill={currentTier.color} strokeWidth={0} />
                {currentTier.name} Member
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Gift size={22} className="text-white" />
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="mt-5">
              <div className="flex justify-between text-[11px] font-semibold text-white/60">
                <span>{currentTier.name}</span>
                <span>
                  {nextTier.min - CURRENT_POINTS} poin lagi ke {nextTier.name}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: currentTier.color }}
                />
              </div>
            </div>
          )}
        </m.div>

        {/* Redeem CTA */}
        <m.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] bg-primary py-3.5 font-heading text-[14px] font-extrabold text-white shadow-[0_6px_18px_rgba(224,123,57,0.28)] active:scale-[0.98]"
          style={{ transition: 'transform 0.1s' }}
        >
          <Gift size={16} />
          Tukar Poin
        </m.button>

        {/* History */}
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-ink-3" />
            <p className="font-heading text-[15px] font-extrabold text-ink">Riwayat Poin</p>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {history.length > 0 ? (
              history.map(
                (
                  tx: {
                    id: string;
                    description: string | null;
                    created_at: string | null;
                    type: string;
                    points_change: number;
                  },
                  i: number,
                ) => (
                  <m.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-center justify-between rounded-[16px] bg-white px-4 py-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{tx.description}</p>
                      <p className="text-[11px] font-medium text-ink-4">
                        {new Intl.DateTimeFormat('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(tx.created_at || new Date()))}
                      </p>
                    </div>
                    <span
                      className="font-heading text-[15px] font-extrabold"
                      style={{ color: tx.type === 'earn' ? '#2D7D52' : '#E53935' }}
                    >
                      {tx.points_change > 0 ? '+' : ''}
                      {tx.points_change.toLocaleString('id-ID')}
                    </span>
                  </m.div>
                ),
              )
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center py-8 opacity-60">
                <Gift size={40} className="mb-2 text-ink-4" />
                <p className="text-sm font-medium">Belum ada riwayat poin.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
