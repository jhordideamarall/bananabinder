'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  MapPin,
  Package,
  Loader2,
  Plus,
  Truck,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useCartStore, type CartItem } from '@/stores/cart-store';
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUserAddresses, type Address } from '@/lib/services/address-client';
import { createOrder } from '@/lib/services/order-client';
import { getShippingRates, type ShippingOption } from '@/lib/services/shipping-client';
import { previewCampaigns, type CampaignPreviewResponse } from '@/lib/services/campaign-client';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { PageTitle } from '@/components/shared/page-title';

const AddressSheet = dynamic(
  () => import('@/components/checkout/address-sheet').then((mod) => mod.AddressSheet),
  { ssr: false },
);

const fmt = (n: number) => n.toLocaleString('id-ID');

const steps = ['Alamat', 'Pengiriman', 'Bayar'];

const customSignature = (details: CartItem['customDetails']): string =>
  details
    ? JSON.stringify({
        size: details.size,
        material: details.material,
        personalization: details.personalization,
        designNotes: details.designNotes ?? null,
        referenceUrl: details.referenceUrl ?? null,
      })
    : '';

function Thumb({ item, size = 52 }: { item: CartItem; size?: number }) {
  const label = item.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[12px] bg-stone font-heading text-[10px] font-extrabold text-ink-4"
      style={{ width: size, height: size }}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">{label || 'PV'}</div>
      )}
    </div>
  );
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
      style={{
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-stone-3)',
      }}
    >
      {selected && <span className="h-3 w-3 rounded-full bg-primary" />}
    </span>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [expandedCourier, setExpandedCourier] = useState<string | null>(null);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const voucherCode = useCartStore((state) => state.voucherCode);
  const voucherDiscount = useCartStore((state) => state.voucherDiscount);

  const { user } = useAuth();

  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: getUserAddresses,
    enabled: !!user,
  });

  const count = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);

  const { data: shippingOptions = [], isLoading: isLoadingShipping } = useQuery({
    queryKey: ['shipping-rates', selectedAddressId, count],
    queryFn: () => (selectedAddressId ? getShippingRates(selectedAddressId, items) : []),
    enabled: !!selectedAddressId && items.length > 0 && step >= 2,
    staleTime: 1000 * 60 * 5, // 5 menit
  });

  const groupedOptions = useMemo(() => {
    const groups: Record<string, ShippingOption[]> = {};
    shippingOptions.forEach((opt) => {
      if (!groups[opt.courier_code]) groups[opt.courier_code] = [];
      groups[opt.courier_code].push(opt);
    });
    return groups;
  }, [shippingOptions]);

  useEffect(() => {
    if (shippingOptions.length > 0 && !shippingId) {
      setShippingId(shippingOptions[0].id);
      // Auto expand the first one if selected
      setExpandedCourier(shippingOptions[0].courier_code);
    }
  }, [shippingOptions, shippingId]);

  const [guestAddress, setGuestAddress] = useState<Partial<Address> | null>(null);
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a: Address) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const activeAddress = guestAddress || addresses.find((a: Address) => a.id === selectedAddressId);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const selectedShipping = shippingOptions.find((option) => option.id === shippingId);
  const shippingPrice = selectedShipping ? selectedShipping.price : 0;

  // Campaign preview — re-validated server-side at order creation.
  const previewItemsKey = useMemo(
    () => items.map((i) => `${i.id}:${i.quantity}:${i.price}`).join('|'),
    [items],
  );
  const destinationCoords =
    activeAddress?.latitude != null && activeAddress?.longitude != null
      ? { latitude: Number(activeAddress.latitude), longitude: Number(activeAddress.longitude) }
      : null;

  const { data: campaignPreview } = useQuery<CampaignPreviewResponse>({
    queryKey: [
      'campaign-preview',
      previewItemsKey,
      destinationCoords?.latitude ?? null,
      destinationCoords?.longitude ?? null,
    ],
    queryFn: () =>
      previewCampaigns(
        items.map((i) => ({
          productId: String(i.id),
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        destinationCoords,
      ),
    enabled: hydrated && items.length > 0,
    staleTime: 30_000,
  });

  const campaignItemDiscount = campaignPreview?.totalItemDiscount ?? 0;
  const campaignShippingDiscount = Math.min(
    campaignPreview?.totalShippingDiscount ?? 0,
    shippingPrice,
  );
  const campaignIds = useMemo(
    () => Array.from(new Set((campaignPreview?.applied ?? []).map((a) => a.campaignId))),
    [campaignPreview],
  );

  const effectiveShippingPrice = Math.max(shippingPrice - campaignShippingDiscount, 0);

  // Tax 11% (Internal only, not added to total to keep it inclusive/absorbed)
  const totalDiscount = Math.min(voucherDiscount + campaignItemDiscount, subtotal);
  const taxAmount = Math.round(Math.max(subtotal - totalDiscount, 0) * 0.11);
  const serviceFee = 0; // Hapus sesuai request
  const discount = totalDiscount;

  // Total = Subtotal - Diskon + Ongkir (after free shipping subsidy)
  const total = Math.max(subtotal - discount, 0) + effectiveShippingPrice;

  const { mutate: handleCheckout, isPending: submitting } = useMutation({
    mutationFn: async () => {
      const validateUUID = (id: string) => {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(id);
      };

      if (!activeAddress || !selectedAddressId || !selectedShipping) {
        throw new Error('Pilih alamat dan pengiriman');
      }

      if (!validateUUID(selectedAddressId)) {
        throw new Error('ID Alamat tidak valid (bukan UUID). Silakan pilih/tambah ulang alamat.');
      }

      const totalWeight = items.reduce(
        (sum, item) => sum + (item.weight || 500) * item.quantity,
        0,
      );

      const payloadItems = items.map((item) => ({
        product_id: String(item.id),
        variant_id: item.variantId || null,
        quantity: item.quantity,
        price: item.price,
        product_name: item.name,
        variant_name: item.variantName || null,
        custom_details: item.customDetails ?? null,
      }));

      // Validate all product IDs
      for (const item of payloadItems) {
        if (!validateUUID(item.product_id)) {
          throw new Error(
            `Produk "${item.product_name}" memiliki ID tidak valid (${item.product_id}). Mohon gunakan produk asli dari database.`,
          );
        }
        if (item.variant_id && !validateUUID(item.variant_id)) {
          throw new Error(`Varian produk "${item.product_name}" memiliki ID tidak valid.`);
        }
      }

      console.log('CREATE_ORDER_PAYLOAD:', {
        addressId: selectedAddressId,
        items: payloadItems,
        total,
        subtotal,
        shippingCost: selectedShipping.price,
        shippingCourier: selectedShipping.name,
        totalWeight,
      });

      const orderId = await createOrder({
        addressId: selectedAddressId,
        items: payloadItems,
        total,
        subtotal,
        shippingCost: selectedShipping.price,
        shippingCourier: selectedShipping.name,
        shippingCourierCode: selectedShipping.courier_code,
        shippingServiceCode: selectedShipping.service_code,
        totalWeight,
        tax: taxAmount,
        serviceFee,
        discount,
        voucherCode: voucherCode ?? null,
        campaignIds,
      });

      // Panggil API untuk membuat transaksi Midtrans
      const payRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        console.error('PAYMENT_INIT_ERROR:', payData);
        throw new Error(payData.error || 'Gagal menyiapkan pembayaran');
      }

      return { orderId, ...payData };
    },
    onSuccess: (data: { orderId: string; invoice_url?: string }) => {
      toast.success('Pesanan berhasil dibuat!');
      clearCart();

      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        router.push('/checkout/success');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal membuat pesanan');
    },
  });

  const hasItems = hydrated && (items.length > 0 || submitting);

  const goBack = () => {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }
    router.back();
  };

  const continueFlow = () => {
    if (!activeAddress && step === 1) {
      setIsAddressSheetOpen(true);
      return;
    }

    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    handleCheckout();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-stone">
      <PageTitle title="Checkout" />
      <AddressSheet
        isOpen={isAddressSheetOpen}
        onClose={() => setIsAddressSheetOpen(false)}
        onSuccess={(addr) => {
          setGuestAddress(addr);
          // Alamat hasil simpan (guest yang baru verifikasi OTP maupun user lama)
          // sudah punya id real dari DB — pakai langsung supaya query ongkir aktif.
          if (addr.id) {
            setSelectedAddressId(addr.id);
          }
          if (user) {
            refetchAddresses();
          }
          setIsAddressSheetOpen(false);
        }}
      />
      <header className="sticky top-0 z-50 border-b border-stone-2 bg-white">
        <div className="flex h-16 items-center px-[clamp(16px,5vw,20px)]">
          <button
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-stone text-ink active:scale-95 transition-transform"
            aria-label="Kembali"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="ml-3 font-heading text-[19px] font-extrabold text-ink">Checkout</h1>
        </div>

        {hasItems && (
          <div className="px-[clamp(18px,6vw,24px)] py-5">
            <div className="grid grid-cols-[32px_1fr_32px_1fr_32px] items-start gap-2">
              {steps.map((label, index) => {
                const number = index + 1;
                const complete = step > number;
                const active = step === number;

                return (
                  <div key={label} className="contents">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full font-heading text-[13px] font-extrabold"
                        style={{
                          background: complete
                            ? 'var(--color-success)'
                            : active
                              ? 'var(--color-primary)'
                              : 'var(--color-stone-2)',
                          color: complete || active ? '#FFFFFF' : 'var(--color-ink-3)',
                        }}
                      >
                        {complete ? <Check size={16} strokeWidth={3} /> : number}
                      </div>
                      <span
                        className="font-heading text-[11px] font-extrabold"
                        style={{
                          color: active
                            ? 'var(--color-primary)'
                            : complete
                              ? 'var(--color-success)'
                              : 'var(--color-ink-3)',
                        }}
                      >
                        {label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className="mt-4 h-[2px]"
                        style={{
                          background:
                            step > number ? 'var(--color-success)' : 'var(--color-stone-2)',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-[clamp(16px,5vw,20px)] py-5 pb-32">
        {!hasItems ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <p className="font-heading text-[17px] font-extrabold text-ink">
              Belum ada item checkout
            </p>
            <button
              onClick={() => router.push('/products')}
              className="mt-5 rounded-[14px] bg-primary px-[clamp(16px,5vw,20px)] py-3 font-heading text-sm font-bold text-white"
            >
              Pilih Produk
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <m.div
                key="address"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-3"
              >
                <section className="rounded-[18px] bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-heading text-[14px] font-extrabold text-ink">
                      <MapPin size={18} className="text-primary" />
                      <span>Alamat Pengiriman</span>
                    </div>
                    {addresses.length > 0 && (
                      <button
                        onClick={() => setIsAddressSheetOpen(true)}
                        className="font-heading text-[13px] font-extrabold text-primary"
                      >
                        Ubah
                      </button>
                    )}
                  </div>

                  {isLoadingAddresses ? (
                    <div className="flex h-24 items-center justify-center rounded-[14px] bg-stone">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  ) : activeAddress ? (
                    <div className="rounded-[14px] bg-stone p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-heading text-[14px] font-extrabold text-ink">
                          {activeAddress.recipient_name}
                        </p>
                        {activeAddress.is_default && (
                          <span
                            className="rounded-full px-3 py-1 font-heading text-[10px] font-extrabold text-primary"
                            style={{ background: 'var(--color-primary-light)' }}
                          >
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-ink-3">{activeAddress.phone}</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-ink-3">
                        {activeAddress.full_address}
                        <br />
                        {activeAddress.city}, {activeAddress.postal_code}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddressSheetOpen(true)}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-stone-3 p-8 transition-colors active:bg-stone"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone text-primary">
                        <Plus size={20} />
                      </div>
                      <span className="font-heading text-[14px] font-extrabold text-ink-3">
                        Tambah Alamat Baru
                      </span>
                    </button>
                  )}
                </section>

                <section className="rounded-[18px] bg-white p-4">
                  <div className="mb-4 flex items-center gap-2 font-heading text-[14px] font-extrabold text-ink">
                    <Package size={18} />
                    <span>Pesanan ({count} item)</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {items.map((item) => (
                      <div
                        key={`${item.id}-${item.variantId ?? 'base'}-${customSignature(item.customDetails)}`}
                        className="flex items-center gap-3"
                      >
                        <Thumb item={item} />
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-heading text-[13px] font-extrabold text-ink">
                            {item.name}
                          </p>
                          {item.variantName ? (
                            <p className="mt-0.5 text-[12px] font-bold text-ink-4">
                              {item.variantName}
                            </p>
                          ) : null}
                          {item.customDetails ? (
                            <div className="mt-1 rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-2 text-[11px] leading-relaxed text-ink-3">
                              <p className="font-heading font-extrabold text-primary">
                                Custom: {item.customDetails.personalization}
                              </p>
                              <p>
                                {item.customDetails.size} · {item.customDetails.material}
                              </p>
                            </div>
                          ) : null}
                          <p className="mt-1 text-sm font-medium text-[#E53935]">
                            x{item.quantity} · Rp {fmt(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </m.div>
            )}

            {step === 2 && (
              <m.div
                key="shipping"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.18 }}
              >
                <h2 className="mb-4 font-heading text-[15px] font-extrabold text-ink">
                  Pilih Metode Pengiriman
                </h2>

                {isLoadingShipping ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-stone-500">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm">Mencari pilihan pengiriman...</p>
                  </div>
                ) : shippingOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-stone-500 text-center px-6">
                    <Truck className="h-8 w-8" />
                    <p className="text-sm">
                      Pilihan pengiriman tidak tersedia. Pastikan Kota & Kecamatan benar.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {Object.entries(groupedOptions).map(([code, options]) => {
                      const isExpanded = expandedCourier === code;
                      const hasSelected = options.some((o) => o.id === shippingId);
                      const selectedOption = options.find((o) => o.id === shippingId);

                      return (
                        <div
                          key={code}
                          className="overflow-hidden rounded-[20px] border-2 bg-white transition-all"
                          style={{
                            borderColor: hasSelected
                              ? 'var(--color-primary)'
                              : 'var(--color-stone-2)',
                            boxShadow: hasSelected
                              ? '0 12px 24px -12px rgba(126, 200, 227, 0.2)'
                              : 'none',
                          }}
                        >
                          {/* Courier Header (Dropdown Trigger) */}
                          <button
                            onClick={() => setExpandedCourier(isExpanded ? null : code)}
                            className="flex w-full items-center gap-3 p-5 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-heading text-[16px] font-extrabold text-ink leading-tight">
                                {options[0].courier_name}
                              </p>
                              {hasSelected && !isExpanded && selectedOption && (
                                <p className="mt-1 text-[13px] font-bold text-[#E53935]">
                                  {selectedOption.service_name} · Rp {fmt(selectedOption.price)}
                                </p>
                              )}
                              {(!hasSelected || isExpanded) && (
                                <p className="mt-1 text-[13px] font-bold text-ink-4">
                                  {options.length} Pilihan Layanan
                                </p>
                              )}
                            </div>

                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-stone transition-transform"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            >
                              <ChevronDown size={20} className="text-ink-4" />
                            </div>
                          </button>

                          {/* Expanded Services List */}
                          <AnimatePresence>
                            {isExpanded && (
                              <m.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-stone-2 bg-stone/30"
                              >
                                <div className="flex flex-col p-2">
                                  {options.map((option) => {
                                    const selected = option.id === shippingId;
                                    return (
                                      <button
                                        key={option.id}
                                        onClick={() => setShippingId(option.id)}
                                        className="flex items-center gap-3 rounded-[14px] p-3 text-left transition-colors active:bg-stone-2"
                                        style={{
                                          background: selected ? '#FFFFFF' : 'transparent',
                                          boxShadow: selected
                                            ? '0 4px 12px rgba(0,0,0,0.05)'
                                            : 'none',
                                        }}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="font-heading text-[13px] font-extrabold text-ink">
                                            {option.service_name}
                                          </p>
                                          <p className="mt-0.5 text-[11px] font-bold text-ink-4">
                                            Estimasi {option.etd}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-heading text-[14px] font-extrabold text-[#E53935]">
                                            Rp {fmt(option.price)}
                                          </p>
                                        </div>
                                        <RadioMark selected={selected} />
                                      </button>
                                    );
                                  })}
                                </div>
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </m.div>
            )}

            {step === 3 && (
              <m.div
                key="payment"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.18 }}
              >
                <h2 className="mb-4 font-heading text-[15px] font-extrabold text-ink">
                  Metode Pembayaran
                </h2>
                <div className="rounded-[22px] bg-white p-6 border-2 border-primary/10 shadow-sm">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck size={32} />
                    </div>
                    <div>
                      <h3 className="font-heading text-[17px] font-extrabold text-ink">
                        Pembayaran Aman
                      </h3>
                      <p className="mt-2 text-sm font-medium text-ink-3 leading-relaxed">
                        Anda akan diarahkan ke gerbang pembayaran aman Xendit untuk memilih metode
                        pembayaran (QRIS, VA, atau E-Wallet).
                      </p>
                    </div>
                  </div>
                </div>

                <section className="mt-4 rounded-[18px] bg-white p-4">
                  <h3 className="mb-4 font-heading text-[14px] font-extrabold text-ink">
                    Ringkasan
                  </h3>
                  <div className="flex justify-between text-sm text-ink-3">
                    <span>Subtotal</span>
                    <span className="font-heading font-extrabold text-[#E53935]">
                      Rp {fmt(subtotal)}
                    </span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="mt-4 flex justify-between text-sm text-ink-3">
                      <span>Voucher{voucherCode ? ` (${voucherCode})` : ''}</span>
                      <span className="font-heading font-extrabold text-success">
                        - Rp {fmt(Math.min(voucherDiscount, subtotal))}
                      </span>
                    </div>
                  )}
                  {(campaignPreview?.applied ?? [])
                    .filter((c) => c.itemDiscounts.length > 0)
                    .map((c) => {
                      const sum = c.itemDiscounts.reduce((s, d) => s + d.amount, 0);
                      return (
                        <div
                          key={c.campaignId}
                          className="mt-4 flex justify-between text-sm text-ink-3"
                        >
                          <span>Campaign · {c.name}</span>
                          <span className="font-heading font-extrabold text-success">
                            - Rp {fmt(sum)}
                          </span>
                        </div>
                      );
                    })}
                  {selectedShipping && (
                    <div className="mt-4 flex justify-between text-sm text-ink-3">
                      <span>Ongkir</span>
                      <span className="font-heading font-extrabold text-[#E53935]">
                        Rp {fmt(selectedShipping.price)}
                      </span>
                    </div>
                  )}
                  {campaignShippingDiscount > 0 && (
                    <div className="mt-4 flex justify-between text-sm text-ink-3">
                      <span>
                        Gratis Ongkir ·{' '}
                        {(campaignPreview?.applied ?? []).find((a) => a.shippingDiscount > 0)?.name}
                      </span>
                      <span className="font-heading font-extrabold text-success">
                        - Rp {fmt(campaignShippingDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="my-4 h-px bg-stone-2" />
                  <div className="flex justify-between">
                    <span className="font-heading text-[14px] font-extrabold text-ink">Total</span>
                    <span className="font-heading text-[18px] font-extrabold text-[#E53935]">
                      Rp {fmt(total)}
                    </span>
                  </div>
                </section>
              </m.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {hasItems && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-stone-2 bg-white px-[clamp(16px,5vw,20px)] py-4">
          <button
            onClick={continueFlow}
            disabled={submitting || (step === 1 && !activeAddress)}
            className="flex h-14 w-full items-center justify-center rounded-[18px] bg-primary font-heading text-[15px] font-extrabold text-white shadow-md active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : step < 3 ? (
              'Lanjutkan'
            ) : (
              `Bayar Rp ${fmt(total)}`
            )}
          </button>
          <div className="safe-bottom" />
        </div>
      )}
    </div>
  );
}
