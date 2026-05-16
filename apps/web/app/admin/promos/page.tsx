import Link from 'next/link';
import type { Route } from 'next';
import type { Tables } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';
import { BannerManager } from '@/components/admin/promos/BannerManager';
import { VoucherManager } from '@/components/admin/promos/VoucherManager';
import { SettingsPanel } from '@/components/admin/promos/SettingsPanel';

type VoucherRow = Tables<'vouchers'>;
type BannerRow = Tables<'banners'>;
type StoreSettingsRow = Tables<'store_settings'>;

type TabId = 'banner' | 'voucher' | 'settings';

const TABS: { id: TabId; label: string; description: string }[] = [
  {
    id: 'banner',
    label: 'Banner',
    description: 'Atur banner yang tampil di home (hero, promo, pilihan).',
  },
  {
    id: 'voucher',
    label: 'Voucher',
    description: 'Kode diskon untuk campaign atau loyalitas pelanggan.',
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    description: 'Judul section home dan origin pengiriman.',
  },
];

function isTabId(value: string | undefined): value is TabId {
  return value === 'banner' || value === 'voucher' || value === 'settings';
}

export default async function AdminPromosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolved = await searchParams;
  const activeTab: TabId = isTabId(resolved.tab) ? resolved.tab : 'banner';

  const supabase = (await createClient()) as TypedSupabaseClient;
  const [vouchersResult, bannersResult, settingsResult] = await Promise.all([
    supabase.from('vouchers').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('banners').select('*').order('priority', { ascending: true }).limit(50),
    supabase.from('store_settings').select('*').limit(1).maybeSingle(),
  ]);

  const vouchers = (vouchersResult.data ?? []) as VoucherRow[];
  const banners = (bannersResult.data ?? []) as BannerRow[];
  const storeSettings = (settingsResult.data ?? undefined) as StoreSettingsRow | undefined;

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header>
        <p className="text-[13px] font-medium text-[#86868B]">Marketing</p>
        <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
          Promo & banner
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[#86868B]">
          {TABS.find((t) => t.id === activeTab)?.description}
        </p>
      </header>

      <nav
        aria-label="Section promos"
        className="inline-flex rounded-full border border-black/[0.06] bg-white p-1"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={
                tab.id === 'banner'
                  ? ('/admin/promos' as Route)
                  : {
                      pathname: '/admin/promos' as const,
                      query: { tab: tab.id },
                    }
              }
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-full px-5 py-1.5 text-[13px] transition-colors ${
                isActive
                  ? 'bg-[#1D1D1F] font-semibold text-white'
                  : 'font-medium text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {activeTab === 'banner' ? <BannerManager banners={banners} /> : null}
      {activeTab === 'voucher' ? <VoucherManager vouchers={vouchers} /> : null}
      {activeTab === 'settings' ? <SettingsPanel settings={storeSettings} /> : null}
    </div>
  );
}
