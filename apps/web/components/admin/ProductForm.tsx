'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft as IconArrowLeft,
  Check as IconCheck,
  Image as IconImage,
  Loader2 as IconLoader2,
  Plus as IconPlus,
  Trash2 as IconTrash,
} from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';

interface Variant {
  id?: string | null;
  cover_color: string;
  paper_type: string;
  ring_size: string;
  stock: number;
  weight_grams: number;
  price_override?: number | null;
  image_url?: string | null;
}

interface ProductVariantRow {
  id?: string | null;
  name: string;
  stock: number | null;
  price: number;
  promo_price: number | null;
  image_url: string | null;
  weight_grams: number | null;
}

interface ProductImage {
  url: string;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  is_active?: boolean | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  price: number;
  promo_price: number | null;
  weight_grams: number | null;
  is_active: boolean | null;
  productVariants: ProductVariantRow[];
  productImages: ProductImage[];
}

interface ProductFormProps {
  initialData?: ProductDetail;
  categories?: ProductCategory[];
  isEdit?: boolean;
}

const fieldClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const textareaClass =
  'w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed';
const labelClass = 'text-[12px] font-medium text-[#86868B]';
const cardClass = 'rounded-2xl border border-black/[0.06] bg-white';

function emptyVariant(): Variant {
  return {
    cover_color: 'Default',
    paper_type: 'Lined',
    ring_size: 'A5',
    stock: 10,
    weight_grams: 500,
    price_override: null,
    image_url: null,
  };
}

function variantFromRow(variant: ProductVariantRow, basePrice: number): Variant {
  const [coverColor = 'Default', paperType = 'Standard', ringSize = 'A5'] =
    variant.name.split(' / ');
  return {
    id: variant.id ?? null,
    cover_color: coverColor,
    paper_type: paperType,
    ring_size: ringSize,
    weight_grams: variant.weight_grams ?? 500,
    stock: variant.stock ?? 0,
    price_override: variant.price === basePrice ? null : variant.price,
    image_url: variant.image_url,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function ProductForm({ initialData, categories = [], isEdit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [basePrice, setBasePrice] = useState(initialData?.price || 0);
  const [promoPrice, setPromoPrice] = useState<number | ''>(initialData?.promo_price ?? '');
  const [weight, setWeight] = useState(initialData?.weight_grams || 500);
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [variants, setVariants] = useState<Variant[]>(
    initialData?.productVariants?.length
      ? initialData.productVariants.map((variant) => variantFromRow(variant, initialData.price))
      : [emptyVariant()],
  );
  const [images, setImages] = useState<string[]>(
    initialData?.productImages?.map((img) => img.url) || [],
  );
  const [error, setError] = useState<string | null>(null);

  const selectedCategory =
    categories.find((category) => category.id === categoryId) ?? initialData?.category ?? null;
  const totalStock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  const displaySlug = slugify(name);
  const numericPromoPrice =
    promoPrice === '' || Number(promoPrice) <= 0 ? null : Number(promoPrice);
  const hasProductDiscount = Boolean(numericPromoPrice && numericPromoPrice < basePrice);
  const productDiscountPct = hasProductDiscount
    ? Math.round((1 - Number(numericPromoPrice) / Number(basePrice || 1)) * 100)
    : 0;

  const addVariant = (): void => {
    setVariants((current) => [...current, emptyVariant()]);
  };

  const removeVariant = (index: number): void => {
    setVariants((current) => current.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string | number | null,
  ): void => {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)),
    );
  };

  const removeImage = (index: number): void => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (numericPromoPrice && numericPromoPrice >= Number(basePrice)) {
        throw new Error('Harga promo harus lebih kecil dari harga jual normal.');
      }

      if (isActive) {
        if (Number(basePrice) <= 0) {
          throw new Error('Produk aktif harus punya harga jual lebih dari 0.');
        }
        if (variants.length === 0) {
          throw new Error('Produk aktif harus punya minimal 1 varian.');
        }
        if (totalStock <= 0) {
          throw new Error(
            'Produk aktif harus punya stok. Tambahkan stok varian atau nonaktifkan produk.',
          );
        }
        if (variants.some((variant) => Number(variant.weight_grams) <= 0)) {
          throw new Error(
            'Setiap varian harus punya berat (gram) lebih dari 0 untuk hitung ongkir.',
          );
        }
      }

      const productId = initialData?.id;
      const url = isEdit && productId ? `/api/admin/products/${productId}` : '/api/admin/products';
      const method = isEdit ? 'PATCH' : 'POST';
      const slug = initialData?.slug || displaySlug;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          category_id: categoryId || null,
          base_price: Number(basePrice),
          promo_price: numericPromoPrice,
          weight: Number(weight),
          is_active: isActive,
          variants: variants.map((variant) => ({
            ...variant,
            stock: Number(variant.stock),
            weight_grams: Number(variant.weight_grams) || Number(weight),
            price_override:
              variant.price_override === undefined || variant.price_override === null
                ? null
                : Number(variant.price_override),
            image_url: variant.image_url ?? null,
          })),
          images: images.map((url, idx) => ({ url, sort_order: idx })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Gagal menyimpan produk.');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[1240px] space-y-8 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#86868B] transition-colors hover:text-[#1D1D1F]"
          >
            <IconArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            Kembali ke katalog
          </Link>
          <p className="mt-2 text-[13px] font-medium text-[#86868B]">
            {isEdit ? 'Edit produk' : 'Produk baru'}
          </p>
          <h1 className="mt-0.5 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
            {name || 'Draft produk binder'}
          </h1>
          <p className="mt-1 text-[13px] text-[#86868B]">
            {selectedCategory ? `Kategori: ${selectedCategory.name}` : 'Belum ada kategori'}
            {' · '}
            {variants.length} varian · stok total {totalStock}
            {hasProductDiscount ? ` · diskon ${productDiscountPct}%` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex h-10 items-center gap-2.5 rounded-full bg-black/[0.04] px-4 text-[13px] font-medium text-[#1D1D1F]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-[#1D1D1F]"
            />
            Produk aktif
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
          >
            {loading ? (
              <IconLoader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <IconCheck className="h-4 w-4" strokeWidth={2} />
            )}
            {isEdit ? 'Update produk' : 'Simpan produk'}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className={cardClass}>
            <div className="border-b border-black/[0.06] px-6 py-5">
              <h2 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
                Informasi produk
              </h2>
              <p className="mt-0.5 text-[13px] text-[#86868B]">
                Nama, kategori, harga, dan berat untuk katalog & checkout.
              </p>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className={labelClass}>Nama produk</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                  placeholder="Contoh: Blue Sky Binder A5"
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Kategori produk</span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Tanpa kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.is_active === false ? ' (nonaktif)' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Slug katalog</span>
                <input
                  value={initialData?.slug || displaySlug}
                  readOnly
                  className={`${fieldClass} bg-black/[0.03] text-[#86868B]`}
                />
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Harga jual normal (Rp)</span>
                <input
                  type="number"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className={fieldClass}
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Harga promo (opsional)</span>
                <input
                  type="number"
                  min="0"
                  value={promoPrice}
                  onChange={(e) =>
                    setPromoPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={fieldClass}
                  placeholder="Kosongkan jika tidak diskon"
                />
                <span className="block text-[11px] text-[#86868B]">
                  Diskon produk. Varian otomatis mengikuti persentase yang sama.
                </span>
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Berat default (gram)</span>
                <input
                  type="number"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className={fieldClass}
                  required
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className={labelClass}>Deskripsi</span>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={textareaClass}
                  placeholder="Jelaskan ukuran, material, isi paket, dan keunggulan produk."
                  required
                />
              </label>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
              <div>
                <h2 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
                  Varian produk
                </h2>
                <p className="mt-0.5 text-[13px] text-[#86868B]">
                  Setiap varian = 1 pilihan stok & harga di storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/[0.04] px-3.5 text-[13px] font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.08]"
              >
                <IconPlus className="h-3.5 w-3.5" strokeWidth={2} />
                Tambah varian
              </button>
            </div>

            <div className="space-y-4 p-6">
              {variants.map((variant, idx) => (
                <article
                  key={variant.id ?? `new-${idx}`}
                  className="rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#1D1D1F]">Varian {idx + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      disabled={variants.length === 1}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-[#C7C7CC]"
                    >
                      <IconTrash className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Hapus
                    </button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[120px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <span className={labelClass}>Foto varian</span>
                      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-dashed border-black/[0.12] bg-white text-center text-[11px] text-[#86868B]">
                        {variant.image_url ? (
                          <>
                            <Image
                              src={variant.image_url}
                              alt={`Foto varian ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="120px"
                            />
                            <button
                              type="button"
                              onClick={() => updateVariant(idx, 'image_url', null)}
                              className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm"
                              aria-label="Hapus foto varian"
                            >
                              <IconTrash className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </button>
                          </>
                        ) : (
                          <span className="px-2 leading-snug">Opsional</span>
                        )}
                      </div>
                      <ImageUploadField
                        bucket="product-images"
                        label="Upload varian"
                        onUploaded={(url) => updateVariant(idx, 'image_url', url)}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <label className="space-y-1.5">
                        <span className={labelClass}>Cover</span>
                        <input
                          type="text"
                          value={variant.cover_color}
                          onChange={(e) => updateVariant(idx, 'cover_color', e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className={labelClass}>Paper</span>
                        <input
                          type="text"
                          value={variant.paper_type}
                          onChange={(e) => updateVariant(idx, 'paper_type', e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className={labelClass}>Ukuran ring</span>
                        <input
                          type="text"
                          value={variant.ring_size}
                          onChange={(e) => updateVariant(idx, 'ring_size', e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className={labelClass}>Stok</span>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))}
                          className={fieldClass}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className={labelClass}>Berat (gram)</span>
                        <input
                          type="number"
                          min="0"
                          value={variant.weight_grams}
                          onChange={(e) =>
                            updateVariant(idx, 'weight_grams', Number(e.target.value))
                          }
                          className={fieldClass}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className={labelClass}>Harga jual varian</span>
                        <input
                          type="number"
                          min="0"
                          value={variant.price_override ?? ''}
                          onChange={(e) =>
                            updateVariant(
                              idx,
                              'price_override',
                              e.target.value === '' ? null : Number(e.target.value),
                            )
                          }
                          className={fieldClass}
                          placeholder={`${basePrice || 0}`}
                        />
                        <span className="block text-[11px] text-[#86868B]">
                          Kosongkan = ikut harga normal.
                        </span>
                      </label>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className={cardClass}>
            <div className="border-b border-black/[0.06] px-6 py-5">
              <h3 className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">
                Ringkasan publish
              </h3>
              <p className="mt-0.5 text-[12px] text-[#86868B]">
                Cek sebelum simpan biar tidak salah kategori.
              </p>
            </div>
            <dl className="space-y-3 p-6 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868B]">Status</dt>
                <dd className="font-medium text-[#1D1D1F]">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Aktif
                    </span>
                  ) : (
                    'Nonaktif'
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868B]">Kategori</dt>
                <dd className="text-right font-medium text-[#1D1D1F]">
                  {selectedCategory?.name ?? 'Tanpa kategori'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868B]">Harga jual</dt>
                <dd className="font-medium text-[#1D1D1F]">
                  Rp {Number(basePrice || 0).toLocaleString('id-ID')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868B]">Promo produk</dt>
                <dd className="text-right font-medium text-[#1D1D1F]">
                  {hasProductDiscount
                    ? `Rp ${Number(numericPromoPrice).toLocaleString('id-ID')} (${productDiscountPct}%)`
                    : 'Tidak aktif'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868B]">Foto</dt>
                <dd className="font-medium text-[#1D1D1F]">{images.length}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#86868B]">Stok total</dt>
                <dd className="font-medium text-[#1D1D1F]">{totalStock}</dd>
              </div>
            </dl>
          </section>

          <section className={cardClass}>
            <div className="border-b border-black/[0.06] px-6 py-5">
              <h3 className="text-[15px] font-semibold tracking-tight text-[#1D1D1F]">
                Foto produk
              </h3>
              <p className="mt-0.5 text-[12px] text-[#86868B]">
                Foto pertama jadi thumbnail utama di katalog. Semua 1:1.
              </p>
            </div>
            <div className="space-y-3 p-6">
              {images.length === 0 ? (
                <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-black/[0.12] bg-[#FAFAFA] p-6 text-center">
                  <div>
                    <IconImage className="mx-auto h-8 w-8 text-[#C7C7CC]" strokeWidth={1.25} />
                    <p className="mt-2 text-[12px] text-[#86868B]">Belum ada foto produk</p>
                  </div>
                </div>
              ) : (
                images.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-black/[0.06] bg-white"
                  >
                    <Image
                      src={url}
                      alt={`${name || 'Produk'} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="340px"
                    />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-[#1D1D1F] backdrop-blur">
                      {idx === 0 ? 'Thumbnail' : `Foto ${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 backdrop-blur transition-colors hover:bg-red-50"
                      aria-label="Hapus foto"
                    >
                      <IconTrash className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                ))
              )}
              <ImageUploadField
                bucket="product-images"
                label="Upload foto produk"
                multiple
                onUploaded={(url) => setImages((prev) => [...prev, url])}
              />
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
