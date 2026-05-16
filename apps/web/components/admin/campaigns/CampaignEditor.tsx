'use client';

import { useState, useTransition } from 'react';
import { Check as IconCheck, Trash2 as IconTrash, AlertCircle as IconAlert } from 'lucide-react';
import { deleteCampaign, saveCampaign } from '@/app/admin/campaigns/actions';
import {
  CAMPAIGN_TYPE_DESCRIPTIONS,
  CAMPAIGN_TYPE_LABELS,
  type CampaignType,
  type CampaignWithTargets,
  type CategoryOption,
  type DiscountUnit,
  type GeoZone,
  type ProductOption,
  type RegionScope,
  type TargetScope,
} from './types';
import { ProductPicker } from './ProductPicker';
import { CategoryPicker } from './CategoryPicker';
import { GeoZonePicker } from './GeoZonePicker';

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';
const helperClass = 'block text-[11px] text-[#86868B]';

interface CampaignEditorProps {
  data: CampaignWithTargets | null;
  draftType: CampaignType;
  products: ProductOption[];
  categories: CategoryOption[];
  onClose: () => void;
}

function toLocalDatetime(value: string | undefined | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CampaignEditor({
  data,
  draftType,
  products,
  categories,
  onClose,
}: CampaignEditorProps) {
  const isNew = data === null;
  const campaign = data?.campaign ?? null;
  const type: CampaignType = (campaign?.type as CampaignType | undefined) ?? draftType;

  const [discountUnit, setDiscountUnit] = useState<DiscountUnit>(
    (campaign?.discount_unit as DiscountUnit | undefined) ?? 'percentage',
  );
  const [targetScope, setTargetScope] = useState<TargetScope>(
    (campaign?.target_scope as TargetScope | undefined) ?? 'all',
  );
  const [regionScope, setRegionScope] = useState<RegionScope>(
    (campaign?.region_scope as RegionScope | undefined) ?? 'all',
  );
  const [productIds, setProductIds] = useState<string[]>(data?.productIds ?? []);
  const [categoryIds, setCategoryIds] = useState<string[]>(data?.categoryIds ?? []);
  const [geoZones, setGeoZones] = useState<GeoZone[]>(data?.geoZones ?? []);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData): void => {
    setError(null);
    startTransition(async () => {
      try {
        await saveCampaign(formData);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan campaign.');
      }
    });
  };

  const handleDelete = (): void => {
    if (!campaign) return;
    const confirmed = window.confirm(`Hapus campaign "${campaign.name}"? Tidak bisa di-undo.`);
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set('id', campaign.id);
        await deleteCampaign(fd);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menghapus campaign.');
      }
    });
  };

  return (
    <form key={campaign?.id ?? `new-${draftType}`} action={handleSubmit} className="flex flex-col">
      <input type="hidden" name="id" value={campaign?.id ?? ''} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="targetScope" value={targetScope} />

      <div className="space-y-6 p-6">
        <header>
          <p className={labelClass}>
            {isNew ? 'Campaign baru' : 'Edit campaign'} · {CAMPAIGN_TYPE_LABELS[type]}
          </p>
          <h3 className="mt-0.5 text-[22px] font-semibold tracking-tight text-[#1D1D1F]">
            {isNew ? `Buat ${CAMPAIGN_TYPE_LABELS[type]}` : campaign?.name}
          </h3>
          <p className="mt-1 text-[13px] text-[#86868B]">{CAMPAIGN_TYPE_DESCRIPTIONS[type]}</p>
          {campaign ? (
            <p className="mt-2 text-[12px] text-[#86868B]">
              Dipakai {campaign.usage_count}× sejak{' '}
              {new Date(campaign.created_at).toLocaleDateString('id-ID')}.
            </p>
          ) : null}
        </header>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <p>{error}</p>
          </div>
        ) : null}

        {/* Section 1: Detail umum */}
        <section className="space-y-4 rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-5">
          <p className="text-[13px] font-semibold tracking-tight text-[#1D1D1F]">Detail umum</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className={labelClass}>Nama campaign</span>
              <input
                name="name"
                required
                defaultValue={campaign?.name ?? ''}
                className={inputClass}
                placeholder="Flash Sale Weekend"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className={labelClass}>Deskripsi internal</span>
              <textarea
                name="description"
                rows={2}
                defaultValue={campaign?.description ?? ''}
                className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-[14px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Catatan untuk tim internal (tidak tampil ke user)."
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Mulai</span>
              <input
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={toLocalDatetime(campaign?.starts_at)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Berakhir</span>
              <input
                name="endsAt"
                type="datetime-local"
                required
                defaultValue={toLocalDatetime(campaign?.ends_at)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Priority</span>
              <input
                name="priority"
                type="number"
                min="0"
                defaultValue={campaign?.priority ?? 10}
                className={inputClass}
              />
              <span className={helperClass}>Angka kecil dieksekusi lebih dulu saat overlap.</span>
            </label>
            <label className="flex items-center gap-3 self-end rounded-xl bg-white border border-black/[0.06] px-4 py-3">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={campaign?.is_active ?? true}
                className="h-4 w-4 accent-[#1D1D1F]"
              />
              <span className="text-[14px] font-medium text-[#1D1D1F]">Campaign aktif</span>
            </label>
          </div>
        </section>

        {/* Section 2: Aturan diskon */}
        <section className="space-y-4 rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-5">
          <p className="text-[13px] font-semibold tracking-tight text-[#1D1D1F]">
            {type === 'free_shipping' ? 'Aturan potongan ongkir' : 'Aturan diskon'}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className={labelClass}>Tipe potongan</span>
              <select
                name="discountUnit"
                value={discountUnit}
                onChange={(e) => setDiscountUnit(e.target.value as DiscountUnit)}
                className={inputClass}
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal tetap (Rp)</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>
                Nilai potongan {discountUnit === 'percentage' ? '(%)' : '(Rp)'}
              </span>
              <input
                name="discountValue"
                type="number"
                min="0"
                max={discountUnit === 'percentage' ? 100 : undefined}
                required
                defaultValue={campaign?.discount_value ?? 0}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Max potongan (Rp)</span>
              <input
                name="maxDiscount"
                type="number"
                min="0"
                defaultValue={campaign?.max_discount ?? ''}
                className={inputClass}
                placeholder="Opsional"
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Minimal order (Rp)</span>
              <input
                name="minOrder"
                type="number"
                min="0"
                defaultValue={campaign?.min_order ?? 0}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Limit pemakaian total</span>
              <input
                name="usageLimit"
                type="number"
                min="0"
                defaultValue={campaign?.usage_limit ?? ''}
                className={inputClass}
                placeholder="Opsional · kosong = unlimited"
              />
            </label>
            {type === 'product_discount' ? (
              <label className="flex items-center gap-3 self-end rounded-xl bg-white border border-black/[0.06] px-4 py-3">
                <input
                  name="stackable"
                  type="checkbox"
                  defaultChecked={campaign?.stackable ?? false}
                  className="h-4 w-4 accent-[#1D1D1F]"
                />
                <span className="text-[13px] font-medium text-[#1D1D1F]">
                  Bisa digabung voucher
                </span>
              </label>
            ) : null}
          </div>
        </section>

        {/* Section 3: Target produk/kategori — hanya untuk flash_sale & product_discount */}
        {type === 'flash_sale' || type === 'product_discount' ? (
          <section className="space-y-4 rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-5">
            <div>
              <p className="text-[13px] font-semibold tracking-tight text-[#1D1D1F]">
                Target produk
              </p>
              <p className="mt-0.5 text-[12px] text-[#86868B]">
                Pilih lingkup campaign — semua produk, produk spesifik, atau kategori.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {(['all', 'products', 'categories'] as TargetScope[]).map((s) => {
                const active = targetScope === s;
                const label =
                  s === 'all'
                    ? 'Semua produk'
                    : s === 'products'
                      ? 'Produk pilihan'
                      : 'Kategori pilihan';
                const helper =
                  s === 'all'
                    ? 'Berlaku untuk seluruh katalog.'
                    : s === 'products'
                      ? 'Pilih satu per satu produk.'
                      : 'Pilih kategori — semua produk di kategori tsb termasuk.';
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTargetScope(s)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-[#1D1D1F]/20 bg-primary/15'
                        : 'border-black/[0.06] bg-white hover:bg-black/[0.02]'
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-[#1D1D1F]">{label}</p>
                    <p className="mt-1 text-[11px] leading-snug text-[#86868B]">{helper}</p>
                  </button>
                );
              })}
            </div>

            {targetScope === 'products' ? (
              <ProductPicker
                available={products}
                selectedIds={productIds}
                onChange={setProductIds}
              />
            ) : null}
            {targetScope === 'categories' ? (
              <CategoryPicker
                available={categories}
                selectedIds={categoryIds}
                onChange={setCategoryIds}
              />
            ) : null}
          </section>
        ) : null}

        {/* Section 4: Wilayah — hanya untuk free_shipping */}
        {type === 'free_shipping' ? (
          <section className="space-y-4 rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-5">
            <div>
              <p className="text-[13px] font-semibold tracking-tight text-[#1D1D1F]">
                Wilayah berlaku
              </p>
              <p className="mt-0.5 text-[12px] text-[#86868B]">
                Tentukan area pengiriman yang dapat campaign ini. Pakai preset cepat untuk kombinasi
                populer.
              </p>
            </div>
            <GeoZonePicker
              scope={regionScope}
              onScopeChange={setRegionScope}
              zones={geoZones}
              onChange={setGeoZones}
            />
          </section>
        ) : null}
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-white/95 px-6 py-4 backdrop-blur-xl">
        {!isNew && campaign ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-[#86868B] transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
          >
            <IconTrash className="h-4 w-4" strokeWidth={1.75} />
            Hapus
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
        >
          <IconCheck className="h-4 w-4" strokeWidth={2} />
          {pending ? 'Menyimpan...' : isNew ? 'Simpan campaign' : 'Simpan perubahan'}
        </button>
      </footer>
    </form>
  );
}
