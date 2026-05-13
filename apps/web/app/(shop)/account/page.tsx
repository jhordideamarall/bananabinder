'use client';

import Link from 'next/link';
import { m } from 'framer-motion';
import {
  ChevronRight,
  ClipboardList,
  Heart,
  LogOut,
  MapPin,
  Settings,
  Star,
  User as UserIcon,
} from 'lucide-react';
import type { Route } from 'next';
import { useQuery } from '@tanstack/react-query';
import { getUserLoyalty } from '@/lib/services/loyalty-client';
import { useAuth } from '@/components/providers/auth-provider';

interface MenuItem {
  href: Route;
  icon: React.ReactNode;
  label: string;
}

const MENU: MenuItem[] = [
  { href: '/account/orders' as Route, icon: <ClipboardList size={17} />, label: 'Pesanan Saya' },
  { href: '/account/addresses' as Route, icon: <MapPin size={17} />, label: 'Alamat' },
  { href: '/account/loyalty' as Route, icon: <Star size={17} />, label: 'Loyalty Poin' },
  { href: '/account/wishlist' as Route, icon: <Heart size={17} />, label: 'Wishlist' },
];

export default function AccountPage() {
  const { user, signOut, isLoading } = useAuth();

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty', user?.id],
    queryFn: getUserLoyalty,
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If not logged in, show a different hero section
  if (!user) {
    return (
      <div className="bg-[#FDFCFB]">
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden px-[clamp(16px,5vw,20px)] pb-10 pt-[max(64px,env(safe-area-inset-top))]"
          style={{
            background: 'linear-gradient(140deg, #E07B39 0%, #C96626 100%)',
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white/40">
              <UserIcon size={32} />
            </div>
            <h1 className="font-heading text-[22px] font-extrabold text-white">Belum Masuk</h1>
            <p className="mt-1 text-[13px] font-medium text-white/50">
              Masuk untuk melihat pesanan dan poin loyalty kamu.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 font-heading text-[14px] font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              Masuk / Daftar
            </Link>
          </div>
        </m.div>

        <div className="px-[clamp(16px,5vw,20px)] pt-5 opacity-40 grayscale pointer-events-none">
          <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
            {MENU.map(({ href, icon, label }, i) => (
              <div key={href}>
                <div className="flex items-center gap-3 px-4 py-4">
                  <span className="shrink-0 text-ink-3">{icon}</span>
                  <span className="flex-1 font-heading text-[15px] font-bold text-ink">
                    {label}
                  </span>
                  <ChevronRight size={15} className="shrink-0 text-ink-4" />
                </div>
                {i < MENU.length - 1 && <div className="mx-4 h-px bg-stone-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Real user data from profiles/metadata
  const displayName = user.user_metadata?.full_name || 'Bananasbindery User';
  const displayPhone = user.phone || 'No Phone';

  const CURRENT_POINTS = loyalty?.total_points || 0;
  const lifetime = loyalty?.lifetime_points || 0;

  let CURRENT_TIER = 'Bronze';
  let NEXT_TIER = 'Silver';
  let NEXT_TIER_POINTS = 500;
  let progress = 0;

  if (lifetime >= 2000) {
    CURRENT_TIER = 'Gold';
    NEXT_TIER = 'Max';
    NEXT_TIER_POINTS = 2000;
    progress = 100;
  } else if (lifetime >= 500) {
    CURRENT_TIER = 'Silver';
    NEXT_TIER = 'Gold';
    NEXT_TIER_POINTS = 2000;
    progress = ((lifetime - 500) / (2000 - 500)) * 100;
  } else {
    CURRENT_TIER = 'Bronze';
    NEXT_TIER = 'Silver';
    NEXT_TIER_POINTS = 500;
    progress = (lifetime / 500) * 100;
  }

  return (
    <div className="bg-[#FDFCFB]">
      {/* Hero Banner */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden px-[clamp(16px,5vw,20px)] pb-6 pt-[max(48px,env(safe-area-inset-top))]"
        style={{
          background: 'linear-gradient(140deg, #E07B39 0%, #C96626 100%)',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          boxShadow: '0 12px 32px rgba(224,123,57,0.22)',
        }}
      >
        {/* Settings */}
        <button
          type="button"
          className="absolute right-5 top-[max(48px,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 active:scale-90 transition-transform"
        >
          <Settings size={16} />
        </button>

        {/* Profile row */}
        <div>
          <p className="font-heading text-[22px] font-extrabold text-white">{displayName}</p>
          <p className="mt-0.5 text-[13px] font-medium text-white/50">{displayPhone}</p>
        </div>

        {/* Loyalty points */}
        <div className="mt-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Loyalty Points
              </p>
              <p className="mt-0.5 font-heading text-[36px] font-extrabold leading-none text-white">
                {CURRENT_POINTS.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F4A261]/20 px-3 py-1 text-[12px] font-bold text-[#F4A261]">
                <Star size={10} fill="#F4A261" strokeWidth={0} />
                {CURRENT_TIER}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full bg-[#F4A261]"
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-white/40">
              <span>{CURRENT_TIER}</span>
              <span>
                {NEXT_TIER === 'Max'
                  ? 'Max Tier'
                  : `${NEXT_TIER_POINTS - lifetime} poin lagi ke ${NEXT_TIER}`}
              </span>
            </div>
          </div>
        </div>
      </m.div>

      {/* Menu list */}
      <div className="px-[clamp(16px,5vw,20px)] pt-5">
        <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
          {MENU.map(({ href, icon, label }, i) => (
            <m.div
              key={href}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 + i * 0.04 }}
            >
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-4 active:bg-stone transition-colors"
              >
                <span className="shrink-0 text-ink-3">{icon}</span>
                <span className="flex-1 font-heading text-[15px] font-bold text-ink">{label}</span>
                <ChevronRight size={15} className="shrink-0 text-ink-4" />
              </Link>
              {i < MENU.length - 1 && <div className="mx-4 h-px bg-stone-2" />}
            </m.div>
          ))}
        </div>

        <p className="mt-5 text-center text-[11px] text-ink-4">Bananasbindery v1.0</p>
      </div>

      {/* Logout — fixed near bottom nav */}
      <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 px-[clamp(16px,5vw,20px)]">
        <m.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          onClick={signOut}
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-stone-2 bg-[#FDFCFB]/90 py-3.5 font-heading text-[14px] font-bold text-ink-3 backdrop-blur-md active:scale-[0.98] transition-all"
        >
          <LogOut size={15} />
          Keluar
        </m.button>
      </div>
    </div>
  );
}
