'use client';

import NextImage from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Palette,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { getProductBySlug } from '@/lib/services/product-client';
import { getStoreSettings } from '@/lib/services/store-settings-client';

const CUSTOM_PRODUCT_SLUG = 'binder-custom-nama';

interface CustomFormData {
  variantId: string;
  size: string;
  material: string;
  personalization: string;
  designNotes: string;
  referenceUrl: string;
  referenceImageFile: File | null;
  referenceImagePreviewUrl: string;
  whatsapp: string;
  quantity: number;
}

interface CustomOrderResponse {
  orderId: string;
  orderNumber: string;
  whatsapp?: {
    attempted: boolean;
    success: boolean;
    reason?: string;
  };
  error?: string;
}

interface ReferenceUploadResponse {
  path: string;
  name: string;
  type: string;
  size: number;
  error?: string;
}

export default function CustomOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; number: string } | null>(null);
  const [formData, setFormData] = useState<CustomFormData>({
    variantId: '',
    size: '',
    material: '',
    personalization: '',
    designNotes: '',
    referenceUrl: '',
    referenceImageFile: null,
    referenceImagePreviewUrl: '',
    whatsapp: '',
    quantity: 1,
  });

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: getStoreSettings,
  });

  const customProductSlug = storeSettings?.custom_order_product_slug || CUSTOM_PRODUCT_SLUG;

  const { data: customProduct, isLoading } = useQuery({
    queryKey: ['product', customProductSlug],
    queryFn: () => getProductBySlug(customProductSlug),
  });

  const sizeOptions = useMemo(() => {
    const variants = customProduct?.variants ?? [];
    const seenNames = new Set<string>();

    return variants.filter((variant) => {
      if (variant.is_active === false) return false;
      const normalizedName = variant.name.trim().toLowerCase();
      if (!normalizedName || seenNames.has(normalizedName)) return false;
      seenNames.add(normalizedName);
      return true;
    });
  }, [customProduct]);

  const materialOptions = useMemo(() => {
    const value = storeSettings?.custom_order_materials;
    if (!Array.isArray(value)) return [];

    const seenMaterials = new Set<string>();
    return value.filter((item): item is string => {
      if (typeof item !== 'string' || item.trim().length === 0) return false;
      const normalizedMaterial = item.trim().toLowerCase();
      if (seenMaterials.has(normalizedMaterial)) return false;
      seenMaterials.add(normalizedMaterial);
      return true;
    });
  }, [storeSettings]);

  const selectedVariant = useMemo(() => {
    if (!formData.variantId) return null;
    return customProduct?.variants?.find((variant) => variant.id === formData.variantId) ?? null;
  }, [customProduct, formData.variantId]);

  const unitPrice = selectedVariant
    ? (selectedVariant.promoPrice ?? selectedVariant.price)
    : (customProduct?.promoPrice ?? customProduct?.price ?? 0);
  const totalEstimate = unitPrice * formData.quantity;

  const nextStep = () => setStep((current) => current + 1);
  const prevStep = () => setStep((current) => current - 1);
  const fmt = (n: number) => n.toLocaleString('id-ID');

  useEffect(() => {
    return () => {
      if (formData.referenceImagePreviewUrl) URL.revokeObjectURL(formData.referenceImagePreviewUrl);
    };
  }, [formData.referenceImagePreviewUrl]);

  const handleReferenceImageChange = (file: File | null) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, WebP, HEIC, atau HEIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5MB.');
      return;
    }
    setFormData((data) => {
      if (data.referenceImagePreviewUrl) URL.revokeObjectURL(data.referenceImagePreviewUrl);
      return {
        ...data,
        referenceImageFile: file,
        referenceImagePreviewUrl: URL.createObjectURL(file),
      };
    });
  };

  const removeReferenceImage = () => {
    setFormData((data) => {
      if (data.referenceImagePreviewUrl) URL.revokeObjectURL(data.referenceImagePreviewUrl);
      return { ...data, referenceImageFile: null, referenceImagePreviewUrl: '' };
    });
  };

  const createCustomOrder = useMutation({
    mutationFn: async () => {
      if (!customProduct) {
        throw new Error(`Produk custom belum tersedia. Atur produk ${customProductSlug} di admin.`);
      }

      let referenceImage: ReferenceUploadResponse | null = null;
      if (formData.referenceImageFile) {
        const uploadForm = new FormData();
        uploadForm.append('file', formData.referenceImageFile);
        const uploadResponse = await fetch('/api/custom-orders/reference-upload', {
          method: 'POST',
          body: uploadForm,
        });
        const uploadPayload = (await uploadResponse.json()) as ReferenceUploadResponse;
        if (uploadResponse.status === 401) {
          throw new Error('Silakan login dulu untuk membuat custom order.');
        }
        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.error ?? 'Gagal upload foto referensi.');
        }
        referenceImage = uploadPayload;
      }

      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: customProduct.id,
          variantId: selectedVariant?.id ?? null,
          size: formData.size,
          material: formData.material,
          personalization: formData.personalization.trim(),
          designNotes: formData.designNotes.trim() || null,
          referenceUrl: formData.referenceUrl.trim() || null,
          referenceImagePath: referenceImage?.path ?? null,
          referenceImageName: referenceImage?.name ?? null,
          referenceImageType: referenceImage?.type ?? null,
          referenceImageSize: referenceImage?.size ?? null,
          whatsapp: formData.whatsapp.trim() || null,
          quantity: formData.quantity,
        }),
      });

      const payload = (await response.json()) as CustomOrderResponse;
      if (response.status === 401) {
        throw new Error('Silakan login dulu untuk membuat custom order.');
      }
      if (!response.ok) throw new Error(payload.error ?? 'Gagal membuat custom order.');
      return payload;
    },
    onSuccess: (payload) => {
      setCreatedOrder({ id: payload.orderId, number: payload.orderNumber });
      if (payload.whatsapp?.success) {
        toast.success('Custom order masuk. Detail sudah dikirim ke WhatsApp.');
      } else {
        toast.success('Custom order masuk ke Pesanan Saya.');
        if (payload.whatsapp?.reason) toast.warning(payload.whatsapp.reason);
      }
      setStep(4);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      if (error.message.includes('login')) router.push('/login');
    },
  });

  const handleSubmitCustomOrder = () => {
    if (!customProduct) {
      toast.error(`Produk custom belum tersedia. Atur produk ${customProductSlug} di admin.`);
      return;
    }

    if (!formData.size || !formData.material || !formData.personalization.trim()) {
      toast.error('Lengkapi ukuran, material, dan teks/nama custom terlebih dahulu.');
      return;
    }

    createCustomOrder.mutate();
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32 pt-6">
      <main className="mx-auto max-w-[430px] p-6">
        <div className="relative mb-10 flex justify-between px-2 pt-2">
          <div className="absolute left-0 top-4 -z-10 h-0.5 w-full bg-stone" />
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              onClick={() => step < 4 && i < step && setStep(i)}
              disabled={step === 4 || i >= step}
              className="group flex flex-col items-center gap-2"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full font-bold shadow-sm transition-all ${
                  step === i
                    ? 'scale-110 bg-primary text-white ring-4 ring-primary/20'
                    : step > i
                      ? 'bg-primary/20 text-primary hover:bg-primary/30'
                      : 'border border-stone-2 bg-white text-stone-3'
                }`}
              >
                {step > i ? <CheckCircle2 size={18} /> : i}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${step >= i ? 'text-primary' : 'text-stone-3'}`}
              >
                {i === 1 ? 'Ukuran' : i === 2 ? 'Bahan' : 'Detail'}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <m.section
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-[22px] font-extrabold text-ink">
                  Pilih Ukuran Binder
                </h2>
                <p className="mt-1 px-4 text-sm text-ink-3">
                  Ukuran diambil dari varian produk custom yang aktif di katalog.
                </p>
              </div>

              <div className="grid gap-3">
                {isLoading ? (
                  <div className="flex items-center justify-center rounded-2xl bg-white p-6 text-primary shadow-sm">
                    <Loader2 className="animate-spin" size={22} />
                  </div>
                ) : sizeOptions.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-sm font-bold leading-relaxed text-amber-800">
                    Ukuran custom belum disetup admin.
                  </div>
                ) : (
                  sizeOptions.map((variant) => {
                    const isSelected = formData.variantId === variant.id;
                    const displayPrice = variant.promoPrice ?? variant.price;

                    return (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setFormData({ ...formData, variantId: variant.id, size: variant.name });
                          nextStep();
                        }}
                        className={`flex items-center justify-between rounded-2xl border-2 p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-white bg-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              isSelected ? 'bg-primary text-white' : 'bg-stone text-ink-3'
                            }`}
                          >
                            <Maximize2 size={20} />
                          </div>
                          <div>
                            <span className="block font-heading text-[15px] font-bold text-ink">
                              {variant.name}
                            </span>
                            <span className="mt-0.5 block text-xs font-semibold text-ink-4">
                              Rp {fmt(displayPrice)}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                            isSelected ? 'border-primary bg-primary' : 'border-stone-2'
                          }`}
                        >
                          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="pt-4 text-center">
                <Link
                  href="/"
                  className="text-xs font-bold text-ink-4 transition-colors hover:text-ink"
                >
                  Batal dan kembali ke beranda
                </Link>
              </div>
            </m.section>
          )}

          {step === 2 && (
            <m.section
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-[22px] font-extrabold text-ink">Material Cover</h2>
                <p className="mt-1 px-4 text-sm text-ink-3">
                  Pilih bahan utama untuk brief produksi.
                </p>
              </div>

              <div className="grid gap-3">
                {materialOptions.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-sm font-bold leading-relaxed text-amber-800">
                    Pilihan bahan belum disetup admin.
                  </div>
                ) : (
                  materialOptions.map((material) => (
                    <button
                      key={material}
                      onClick={() => {
                        setFormData({ ...formData, material });
                        nextStep();
                      }}
                      className={`flex items-center justify-between rounded-2xl border-2 p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        formData.material === material
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-white bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            formData.material === material
                              ? 'bg-primary text-white'
                              : 'bg-stone text-ink-3'
                          }`}
                        >
                          <Palette size={20} />
                        </div>
                        <span className="font-heading text-[15px] font-bold text-ink">
                          {material}
                        </span>
                      </div>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          formData.material === material
                            ? 'border-primary bg-primary'
                            : 'border-stone-2'
                        }`}
                      >
                        {formData.material === material && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={prevStep}
                className="flex w-full items-center justify-center gap-2 py-4 font-heading text-sm font-bold text-primary"
              >
                <ChevronLeft size={16} /> Kembali ke Ukuran
              </button>
            </m.section>
          )}

          {step === 3 && (
            <m.section
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-[22px] font-extrabold text-ink">Detail Custom</h2>
                <p className="mt-1 px-4 text-sm text-ink-3">
                  Teks/nama wajib diisi. Link referensi opsional, admin akan konfirmasi ulang
                  sebelum produksi.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-2">
                  <input
                    type="text"
                    placeholder="Nama/teks custom, contoh: AURELIA"
                    value={formData.personalization}
                    onChange={(e) => setFormData({ ...formData, personalization: e.target.value })}
                    className="w-full border-none p-3 font-sans text-sm uppercase outline-none placeholder:normal-case placeholder:text-ink-4"
                  />
                </div>

                <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-2">
                  <textarea
                    rows={4}
                    placeholder="Catatan desain, warna khusus, font, posisi nama, atau request tambahan..."
                    value={formData.designNotes}
                    onChange={(e) => setFormData({ ...formData, designNotes: e.target.value })}
                    className="w-full resize-none border-none p-3 font-sans text-sm outline-none placeholder:text-ink-4"
                  />
                </div>

                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-2">
                  <input
                    id="custom-reference-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="sr-only"
                    onChange={(event) =>
                      handleReferenceImageChange(event.target.files?.[0] ?? null)
                    }
                  />
                  {formData.referenceImagePreviewUrl ? (
                    <div className="relative overflow-hidden rounded-xl border border-stone-2 bg-stone-1">
                      <div className="relative aspect-[4/3]">
                        <NextImage
                          src={formData.referenceImagePreviewUrl}
                          alt="Foto referensi custom"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 px-3 py-3">
                        <p className="min-w-0 truncate text-xs font-bold text-ink-3">
                          {formData.referenceImageFile?.name}
                        </p>
                        <button
                          type="button"
                          onClick={removeReferenceImage}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm"
                          aria-label="Hapus foto referensi"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="custom-reference-photo"
                      className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/35 bg-primary/5 px-4 text-center transition-colors hover:bg-primary/10"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                        <ImageIcon size={22} />
                      </div>
                      <span className="font-heading text-sm font-extrabold text-ink">
                        Tambah foto referensi
                      </span>
                      <span className="mt-1 max-w-[260px] text-xs leading-relaxed text-ink-4">
                        Upload contoh warna, layout nama, mockup, atau inspirasi desain.
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-primary shadow-sm">
                        <Upload size={13} /> Pilih Foto
                      </span>
                    </label>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-2">
                  <input
                    type="url"
                    placeholder="Link referensi desain (opsional)"
                    value={formData.referenceUrl}
                    onChange={(e) => setFormData({ ...formData, referenceUrl: e.target.value })}
                    className="w-full border-none p-3 font-sans text-sm outline-none placeholder:text-ink-4"
                  />
                </div>

                <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-2">
                  <input
                    type="tel"
                    placeholder="Nomor WhatsApp untuk konfirmasi (opsional)"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full border-none p-3 font-sans text-sm outline-none placeholder:text-ink-4"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-2">
                  <span className="font-heading text-sm font-bold text-ink">Jumlah Pesanan</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        setFormData((data) => ({
                          ...data,
                          quantity: Math.max(1, data.quantity - 1),
                        }))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-stone font-bold text-ink transition-transform active:scale-90"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-heading text-lg font-extrabold">
                      {formData.quantity}
                    </span>
                    <button
                      onClick={() =>
                        setFormData((data) => ({ ...data, quantity: data.quantity + 1 }))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-white shadow-md transition-transform active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-white p-4">
                  <div className="flex justify-between text-sm text-ink-3">
                    <span>Estimasi harga</span>
                    <span className="font-heading font-extrabold text-[#E53935]">
                      Rp {fmt(totalEstimate)}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-ink-4">
                    Admin akan konfirmasi desain dan pembayaran final sebelum produksi.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={prevStep}
                  className="h-14 flex-1 rounded-2xl bg-stone/50 font-heading text-[15px] font-bold text-ink transition-transform active:scale-95"
                >
                  Kembali
                </button>
                <button
                  onClick={handleSubmitCustomOrder}
                  disabled={
                    !customProduct ||
                    !formData.personalization.trim() ||
                    createCustomOrder.isPending
                  }
                  className="flex h-14 flex-[2] items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {createCustomOrder.isPending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    'Buat Custom Order'
                  )}
                </button>
              </div>
            </m.section>
          )}

          {step === 4 && (
            <m.section
              key="step4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-12 text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E3F2FD] text-primary shadow-inner">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="font-heading text-[26px] font-extrabold text-ink">
                Custom Order Dibuat
              </h2>
              <p className="mt-3 px-8 text-sm leading-relaxed text-ink-3">
                Custom order sudah masuk ke Pesanan Saya. Admin akan konfirmasi detail desain lewat
                WhatsApp.
              </p>
              {createdOrder ? (
                <p className="mt-3 rounded-2xl bg-white px-4 py-2 font-heading text-sm font-extrabold text-primary shadow-sm">
                  {createdOrder.number}
                </p>
              ) : null}
              <button
                onClick={() =>
                  router.push(
                    createdOrder ? `/account/orders/${createdOrder.id}` : '/account/orders',
                  )
                }
                className="mt-10 flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20"
              >
                Lihat Detail Pesanan
              </button>
              <Link
                href="/account/orders"
                className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl border border-stone-2 bg-white font-heading text-[15px] font-extrabold text-ink"
              >
                Lihat Semua Pesanan
              </Link>
            </m.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
