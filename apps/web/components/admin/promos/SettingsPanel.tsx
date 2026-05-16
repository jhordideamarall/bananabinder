import { Save, MapPin, Type as IconType } from 'lucide-react';
import type { Tables } from '@bananasbindery/types/supabase';
import { saveStoreSettings } from '@/app/admin/actions';

type StoreSettingsRow = Tables<'store_settings'>;

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';
const cardClass = 'rounded-2xl border border-black/[0.06] bg-white';

function PanelHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof IconType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-black/[0.06] px-6 py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-[#1D1D1F]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h3 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">{title}</h3>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[#86868B]">{subtitle}</p>
      </div>
    </div>
  );
}

function SaveFooter() {
  return (
    <footer className="flex items-center justify-end border-t border-black/[0.06] bg-[#FAFAFA] px-6 py-4">
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black"
      >
        <Save className="h-4 w-4" strokeWidth={2} />
        Simpan perubahan
      </button>
    </footer>
  );
}

interface SettingsPanelProps {
  settings: StoreSettingsRow | undefined;
}

export function SettingsPanel({ settings }: SettingsPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <form action={saveStoreSettings} className={cardClass}>
        <PanelHeader
          icon={IconType}
          title="Judul section banner di home"
          subtitle="Tulisan di atas tiap strip banner di halaman home. Boleh diganti sesuai campaign."
        />
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
        <SaveFooter />
      </form>

      <form action={saveStoreSettings} className={cardClass}>
        <PanelHeader
          icon={MapPin}
          title="Origin pengiriman"
          subtitle="Titik toko untuk Biteship menghitung ongkir. Koordinat wajib agar Gojek/Grab muncul."
        />
        <div className="space-y-4 p-6">
          <div className="rounded-xl bg-primary/15 px-4 py-3 text-[12px] leading-relaxed text-[#1D1D1F]">
            Dapatkan Area ID dari Biteship: GET /v1/maps/areas?input=Cilendek Timur 16112 — ambil
            field <code className="font-mono">id</code>.
          </div>
          <label className="block space-y-1.5">
            <span className={labelClass}>Biteship Area ID</span>
            <input
              name="origin_area_id"
              required
              defaultValue={settings?.origin_area_id ?? 'IDNP6M3K2W1'}
              className={`${inputClass} font-mono`}
              placeholder="IDNP6M3K2W1"
            />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClass}>Alamat toko</span>
            <input
              name="origin_address"
              defaultValue={settings?.origin_address ?? ''}
              className={inputClass}
              placeholder="Taman Yasmin Sektor V, Jl. Cijahe 1 No.60, Cilendek Timur, Bogor Barat 16112"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className={labelClass}>Latitude</span>
              <input
                name="origin_latitude"
                type="number"
                step="any"
                defaultValue={settings?.origin_latitude ?? ''}
                className={inputClass}
                placeholder="-6.570345"
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Longitude</span>
              <input
                name="origin_longitude"
                type="number"
                step="any"
                defaultValue={settings?.origin_longitude ?? ''}
                className={inputClass}
                placeholder="106.7767107"
              />
            </label>
          </div>
        </div>
        <SaveFooter />
      </form>
    </div>
  );
}
