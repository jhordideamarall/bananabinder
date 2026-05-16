import { Save, Type as IconType } from 'lucide-react';
import type { Tables } from '@bananasbindery/types/supabase';
import { saveStoreSettings } from '@/app/admin/actions';

type StoreSettingsRow = Tables<'store_settings'>;

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';

interface HomeBannerLabelsFormProps {
  settings: StoreSettingsRow | undefined;
}

export function HomeBannerLabelsForm({ settings }: HomeBannerLabelsFormProps) {
  return (
    <form action={saveStoreSettings} className="rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-start gap-3 border-b border-black/[0.06] px-6 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-[#1D1D1F]">
          <IconType className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
            Label section banner home
          </h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-[#86868B]">
            Judul di atas tiap strip banner di halaman home. Boleh diganti sesuai campaign.
          </p>
        </div>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Banner pertama (atas Best Seller)</span>
          <input
            name="home_banner_promo_label"
            defaultValue={settings?.home_banner_promo_label ?? 'Banner Promo'}
            className={inputClass}
            placeholder="Banner Promo"
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Banner kedua (bawah Best Seller)</span>
          <input
            name="home_banner_pilihan_label"
            defaultValue={settings?.home_banner_pilihan_label ?? 'Banner Pilihan'}
            className={inputClass}
            placeholder="Banner Pilihan"
          />
        </label>
      </div>
      <footer className="flex items-center justify-end border-t border-black/[0.06] bg-[#FAFAFA] px-6 py-4">
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          Simpan label
        </button>
      </footer>
    </form>
  );
}
