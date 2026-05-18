'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  CheckCircle2,
  CircleDollarSign,
  Layers3,
  Package,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import type { AdminCustomOrderCatalogConfig } from '@/lib/admin-data';
import { saveCustomOrderCatalog } from '@/app/admin/actions';

interface EditableVariant {
  id: string;
  name: string;
  price: number;
  promo_price: number | null;
  stock: number;
  weight_grams: number;
  is_active: boolean;
  deleted: boolean;
}

const inputClass =
  'h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-[13px] font-semibold text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';

function emptyVariant(basePrice: number, weight: number): EditableVariant {
  return {
    id: '',
    name: '',
    price: basePrice,
    promo_price: null,
    stock: 10,
    weight_grams: weight,
    is_active: true,
    deleted: false,
  };
}

function toEditableVariants(config: AdminCustomOrderCatalogConfig): EditableVariant[] {
  const product = config.product;
  const existing =
    product?.productVariants.map((variant) => ({
      id: variant.id ?? '',
      name: variant.name,
      price: variant.price,
      promo_price: variant.promo_price,
      stock: variant.stock ?? 0,
      weight_grams: variant.weight_grams ?? product.weight_grams ?? 500,
      is_active: variant.is_active ?? true,
      deleted: false,
    })) ?? [];

  return existing.length > 0
    ? existing
    : [emptyVariant(product?.price ?? 0, product?.weight_grams ?? 500)];
}

function SaveSetupButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Menyimpan...' : 'Simpan setup custom'}
    </button>
  );
}

export function CustomOrderSetupForm({ config }: { config: AdminCustomOrderCatalogConfig }) {
  const product = config.product;
  const [materials, setMaterials] = useState<string[]>(
    config.materials.length ? config.materials : [''],
  );
  const [variants, setVariants] = useState<EditableVariant[]>(() => toEditableVariants(config));

  const activeVariantCount = useMemo(
    () => variants.filter((variant) => !variant.deleted && variant.name.trim()).length,
    [variants],
  );

  if (!product) {
    return (
      <div className="p-6">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800">
          Produk custom dengan slug `{config.productSlug}` belum ditemukan. Buat produk custom dulu
          di Products, lalu kembali ke halaman ini.
        </p>
      </div>
    );
  }

  const updateMaterial = (index: number, value: string) => {
    setMaterials((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const removeMaterial = (index: number) => {
    setMaterials((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateVariant = <K extends keyof EditableVariant>(
    index: number,
    key: K,
    value: EditableVariant[K],
  ) => {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant,
      ),
    );
  };

  const removeVariant = (index: number) => {
    setVariants((current) => {
      const variant = current[index];
      if (!variant) return current;
      if (!variant.id) return current.filter((_, variantIndex) => variantIndex !== index);
      return current.map((item, variantIndex) =>
        variantIndex === index ? { ...item, deleted: true, is_active: false } : item,
      );
    });
  };

  return (
    <form action={saveCustomOrderCatalog} className="space-y-6 p-6">
      <input type="hidden" name="product_id" value={product.id} />
      <input type="hidden" name="variant_count" value={variants.length} />
      <input type="hidden" name="material_count" value={materials.length} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)]">
        <section className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-[#1D1D1F]">
              <Package className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1D1D1F]">Produk custom</h3>
              <p className="text-[12px] text-[#86868B]">
                Sumber nama, slug, harga dasar, dan status katalog.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className={labelClass}>Nama produk custom</span>
              <input name="product_name" defaultValue={product.name} className={inputClass} />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Slug halaman custom</span>
              <input name="product_slug" defaultValue={config.productSlug} className={inputClass} />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Harga dasar</span>
              <input
                type="number"
                min={1}
                name="base_price"
                defaultValue={product.price}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Berat default gram</span>
              <input
                type="number"
                min={1}
                name="product_weight"
                defaultValue={product.weight_grams ?? 500}
                className={inputClass}
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-3">
            <input
              type="checkbox"
              name="product_active"
              defaultChecked={product.is_active ?? true}
            />
            <span className="text-[13px] font-semibold text-[#1D1D1F]">
              Aktifkan produk custom di katalog dan halaman customer
            </span>
          </label>
        </section>

        <section className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04] text-[#1D1D1F]">
                <Layers3 className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#1D1D1F]">Pilihan bahan</h3>
                <p className="text-[12px] text-[#86868B]">
                  Muncul sebagai opsi material di `/custom`.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMaterials((current) => [...current, ''])}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#1D1D1F] hover:bg-black/[0.03]"
            >
              <Plus className="h-4 w-4" />
              Bahan
            </button>
          </div>

          <div className="space-y-2">
            {materials.map((material, index) => (
              <div key={`material-${index}`} className="flex gap-2">
                <input
                  name={`material_${index}`}
                  value={material}
                  onChange={(event) => updateMaterial(index, event.target.value)}
                  placeholder="Contoh: Hardcover Matte"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  disabled={materials.length === 1}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#86868B] hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Hapus bahan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-black/[0.06] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-[#1D1D1F]">
              <CircleDollarSign className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1D1D1F]">Ukuran, stok, dan harga</h3>
              <p className="text-[12px] text-[#86868B]">
                Setiap card di bawah akan tampil sebagai pilihan ukuran customer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setVariants((current) => [
                ...current,
                emptyVariant(product.price, product.weight_grams ?? 500),
              ])
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1D1D1F] px-4 text-[12px] font-semibold text-white hover:bg-black"
          >
            <Plus className="h-4 w-4" />
            Tambah ukuran
          </button>
        </div>

        <div className="grid gap-3 p-5 lg:grid-cols-2">
          {variants.map((variant, index) => (
            <div
              key={`${variant.id || 'new'}-${index}`}
              className={`rounded-2xl border p-4 ${
                variant.deleted
                  ? 'border-red-200 bg-red-50/70'
                  : variant.is_active
                    ? 'border-black/[0.06] bg-[#FAFAFA]'
                    : 'border-black/[0.06] bg-black/[0.02]'
              }`}
            >
              <input type="hidden" name={`variant_id_${index}`} value={variant.id} />
              {variant.deleted ? (
                <input type="hidden" name={`variant_delete_${index}`} value="true" />
              ) : null}

              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868B]">
                    Paket {index + 1}
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold text-[#1D1D1F]">
                    {variant.name || 'Ukuran baru'}
                  </p>
                </div>
                {variant.deleted ? (
                  <button
                    type="button"
                    onClick={() => updateVariant(index, 'deleted', false)}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-[#1D1D1F]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#86868B] hover:text-red-600"
                    aria-label="Hapus ukuran"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <fieldset disabled={variant.deleted} className="space-y-3 disabled:opacity-60">
                <label className="space-y-1.5">
                  <span className={labelClass}>Nama ukuran / paket</span>
                  <input
                    name={`variant_name_${index}`}
                    value={variant.name}
                    onChange={(event) => updateVariant(index, 'name', event.target.value)}
                    placeholder="Contoh: A5 Custom"
                    className={inputClass}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className={labelClass}>Harga</span>
                    <input
                      type="number"
                      min={1}
                      name={`variant_price_${index}`}
                      value={variant.price}
                      onChange={(event) =>
                        updateVariant(index, 'price', Number(event.target.value))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Harga promo</span>
                    <input
                      type="number"
                      min={0}
                      name={`variant_promo_price_${index}`}
                      value={variant.promo_price ?? ''}
                      onChange={(event) =>
                        updateVariant(
                          index,
                          'promo_price',
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      placeholder="Opsional"
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Stok</span>
                    <input
                      type="number"
                      min={0}
                      name={`variant_stock_${index}`}
                      value={variant.stock}
                      onChange={(event) =>
                        updateVariant(index, 'stock', Number(event.target.value))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Berat gram</span>
                    <input
                      type="number"
                      min={1}
                      name={`variant_weight_${index}`}
                      value={variant.weight_grams}
                      onChange={(event) =>
                        updateVariant(index, 'weight_grams', Number(event.target.value))
                      }
                      className={inputClass}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    name={`variant_active_${index}`}
                    checked={variant.is_active}
                    onChange={(event) => updateVariant(index, 'is_active', event.target.checked)}
                  />
                  <span className="text-[13px] font-semibold text-[#1D1D1F]">
                    Tampilkan ke customer
                  </span>
                </label>
              </fieldset>
            </div>
          ))}
        </div>
      </section>

      <footer className="sticky bottom-0 z-[1] -mx-6 -mb-6 flex items-center justify-between gap-4 border-t border-black/[0.06] bg-white/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#86868B]">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {activeVariantCount} ukuran aktif, {materials.filter(Boolean).length} bahan
        </div>
        <SaveSetupButton />
      </footer>
    </form>
  );
}
