import Image from 'next/image';
import { Gift, ImageIcon, Save, TicketPercent } from 'lucide-react';
import type { Enums, Tables } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';
import { saveBanner, saveVoucher } from '../actions';

type VoucherRow = Tables<'vouchers'>;
type BannerRow = Tables<'banners'>;

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const voucherTypes: { value: Enums<'voucher_type'>; label: string }[] = [
  { value: 'percentage', label: 'Persentase' },
  { value: 'fixed', label: 'Nominal tetap' },
];

function dateValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function VoucherForm({ voucher }: { voucher?: VoucherRow }) {
  return (
    <form action={saveVoucher} className="rounded-[28px] border border-[#E07B39]/12 bg-[#FDFCFB] p-5 shadow-[0_12px_34px_rgba(26,23,20,0.05)]">
      <input type="hidden" name="id" value={voucher?.id ?? ''} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E07B39]">
            {voucher ? 'Edit Voucher' : 'Voucher Baru'}
          </p>
          <h2 className="mt-1 font-heading text-lg font-extrabold">{voucher?.code ?? 'Campaign discount'}</h2>
        </div>
        <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#1A1714] px-4 text-xs font-extrabold text-white">
          <Save size={14} /> Simpan
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Kode</span>
          <input
            name="code"
            required
            defaultValue={voucher?.code ?? ''}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-extrabold uppercase outline-none focus:border-[#E07B39]"
            placeholder="PROMO10"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Tipe</span>
          <select
            name="type"
            defaultValue={voucher?.type ?? 'percentage'}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          >
            {voucherTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Nilai</span>
          <input
            name="value"
            type="number"
            min="0"
            required
            defaultValue={voucher?.value ?? 0}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Min order</span>
          <input
            name="min_order"
            type="number"
            min="0"
            defaultValue={voucher?.min_order ?? ''}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Max discount</span>
          <input
            name="max_discount"
            type="number"
            min="0"
            defaultValue={voucher?.max_discount ?? ''}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Usage limit</span>
          <input
            name="usage_limit"
            type="number"
            min="0"
            defaultValue={voucher?.usage_limit ?? ''}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Valid dari</span>
          <input
            name="valid_from"
            type="date"
            required
            defaultValue={dateValue(voucher?.valid_from ?? null)}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Valid sampai</span>
          <input
            name="valid_until"
            type="date"
            required
            defaultValue={dateValue(voucher?.valid_until ?? null)}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="inline-flex items-center gap-2 rounded-2xl bg-[#E07B39]/8 px-4 py-3 text-sm font-extrabold text-[#1A1714]">
          <input name="is_active" type="checkbox" defaultChecked={voucher?.is_active ?? true} />
          Voucher aktif
        </label>
      </div>
    </form>
  );
}

function BannerForm({ banner }: { banner?: BannerRow }) {
  return (
    <form action={saveBanner} className="rounded-[28px] border border-[#E07B39]/12 bg-[#FDFCFB] p-5 shadow-[0_12px_34px_rgba(26,23,20,0.05)]">
      <input type="hidden" name="id" value={banner?.id ?? ''} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E07B39]">
            {banner ? 'Edit Banner' : 'Banner Baru'}
          </p>
          <h2 className="mt-1 font-heading text-lg font-extrabold">{banner?.title ?? 'CMS promo banner'}</h2>
        </div>
        <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#1A1714] px-4 text-xs font-extrabold text-white">
          <Save size={14} /> Simpan
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-bold text-[#1A1714]/55">Judul</span>
          <input
            name="title"
            required
            defaultValue={banner?.title ?? ''}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
            placeholder="Flash Sale Binder"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-bold text-[#1A1714]/55">Image URL</span>
          <input
            name="image_url"
            required
            defaultValue={banner?.image_url ?? ''}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
            placeholder="https://..."
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Tipe</span>
          <input
            name="type"
            defaultValue={banner?.type ?? 'promo'}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Link CTA</span>
          <input
            name="link"
            defaultValue={banner?.link ?? ''}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
            placeholder="/products"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Priority</span>
          <input
            name="priority"
            type="number"
            defaultValue={banner?.priority ?? 0}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Mulai</span>
          <input
            name="start_date"
            type="date"
            defaultValue={dateValue(banner?.start_date ?? null)}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-[#1A1714]/55">Selesai</span>
          <input
            name="end_date"
            type="date"
            defaultValue={dateValue(banner?.end_date ?? null)}
            className="h-11 w-full rounded-2xl border border-[#E07B39]/18 bg-white px-4 text-sm font-semibold outline-none focus:border-[#E07B39]"
          />
        </label>
        <label className="inline-flex items-center gap-2 rounded-2xl bg-[#E07B39]/8 px-4 py-3 text-sm font-extrabold text-[#1A1714]">
          <input name="is_active" type="checkbox" defaultChecked={banner?.is_active ?? true} />
          Banner aktif
        </label>
      </div>
    </form>
  );
}

export default async function AdminPromosPage() {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const [vouchersResult, bannersResult] = await Promise.all([
    supabase.from('vouchers').select('*').order('created_at', { ascending: false }).limit(12),
    supabase.from('banners').select('*').order('priority', { ascending: true }).limit(12),
  ]);

  const vouchers = (vouchersResult.data ?? []) as VoucherRow[];
  const banners = (bannersResult.data ?? []) as BannerRow[];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-[#1A1714] p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4A261]">Promo Admin</p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight">Kelola voucher dan banner promo</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/55">
          Admin bisa edit campaign diskon, masa berlaku, limit penggunaan, status aktif, dan CMS banner untuk promo toko.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <VoucherForm />
        <BannerForm />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TicketPercent className="text-[#E07B39]" />
            <h2 className="font-heading text-2xl font-extrabold">Voucher</h2>
          </div>
          {vouchers.length === 0 ? (
            <p className="rounded-[28px] bg-[#FDFCFB] p-8 text-center text-sm font-semibold text-[#1A1714]/45">Belum ada voucher.</p>
          ) : (
            vouchers.map((voucher) => (
              <div key={voucher.id} className="rounded-[28px] border border-[#E07B39]/12 bg-[#FDFCFB] p-4 shadow-[0_12px_34px_rgba(26,23,20,0.05)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-xl font-extrabold">{voucher.code}</p>
                    <p className="mt-1 text-xs font-bold text-[#1A1714]/42">
                      {voucher.type === 'percentage' ? `${voucher.value}%` : currency.format(voucher.value)} · Dipakai {voucher.used_count ?? 0}x
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${voucher.is_active ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                    {voucher.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <VoucherForm voucher={voucher} />
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="text-[#E07B39]" />
            <h2 className="font-heading text-2xl font-extrabold">Banner</h2>
          </div>
          {banners.length === 0 ? (
            <p className="rounded-[28px] bg-[#FDFCFB] p-8 text-center text-sm font-semibold text-[#1A1714]/45">Belum ada banner.</p>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="rounded-[28px] border border-[#E07B39]/12 bg-[#FDFCFB] p-4 shadow-[0_12px_34px_rgba(26,23,20,0.05)]">
                <div className="mb-4 flex gap-4">
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-3xl bg-[#E07B39]/10">
                    {banner.image_url ? (
                      <Image src={banner.image_url} alt={banner.title} fill className="object-cover" sizes="128px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#E07B39]">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-lg font-extrabold leading-tight">{banner.title}</p>
                    <p className="mt-1 text-xs font-bold text-[#1A1714]/42">
                      {banner.type} · priority {banner.priority ?? 0}
                    </p>
                    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${banner.is_active ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                      {banner.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                <BannerForm banner={banner} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
