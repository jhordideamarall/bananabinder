import type { Metadata } from 'next';
import type { Tables } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';
import { HomeBannerLabelsForm } from '@/components/admin/settings/HomeBannerLabelsForm';
import { StoreLocationPicker } from '@/components/admin/settings/StoreLocationPicker';

export const metadata: Metadata = {
  title: 'Pengaturan Toko',
};

export const dynamic = 'force-dynamic';

type StoreSettingsRow = Tables<'store_settings'>;

export default async function AdminSettingsPage() {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const { data } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
  const settings = (data ?? undefined) as StoreSettingsRow | undefined;

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header>
        <p className="text-[13px] font-medium text-[#86868B]">Konfigurasi</p>
        <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
          Pengaturan toko
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[#86868B]">
          Lokasi toko (origin pengiriman) dan label section di halaman home. Pengaturan disini
          berlaku global untuk seluruh website.
        </p>
      </header>

      <div className="space-y-6">
        <StoreLocationPicker settings={settings} />
        <HomeBannerLabelsForm settings={settings} />
      </div>
    </div>
  );
}
