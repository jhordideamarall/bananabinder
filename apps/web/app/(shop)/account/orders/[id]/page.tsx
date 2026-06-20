'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import type { Route } from 'next';
import {
  ArrowLeft,
  MapPin,
  Package,
  CreditCard,
  ChevronRight,
  Loader2,
  Truck,
  Upload,
  QrCode,
  Landmark,
} from 'lucide-react';
import {
  parseManualPaymentSettings,
  type ManualPaymentDestination,
} from '@bananasbindery/api-client/manual-payment';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getStoreSettings, type StoreSettings } from '@/lib/services/store-settings-client';
import { toast } from 'sonner';

interface CustomOrderDetails {
  size: string;
  material: string;
  personalization: string;
  designNotes?: string | null;
  referenceUrl?: string | null;
  referenceImageName?: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_name?: string | null;
  variant_name?: string | null;
  custom_details?: unknown;
  products: {
    name: string;
    product_images: { url: string }[];
  } | null;
}

interface PaymentProof {
  id: string;
  status: string;
  payment_destination_type: string;
  payment_destination_id: string | null;
  payment_destination_label: string;
  submitted_amount: number;
  file_name: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  shipping_status?: string | null;
  shipping_tracking?: string | null;
  shipping_metadata?: unknown;
  payment_method?: string | null;
  payment_metadata?: unknown;
  payment_status?: string | null;
  total: number;
  shipping_cost: number | null;
  created_at: string;
  addresses: {
    recipient_name: string;
    phone: string;
    full_address: string;
    city: string;
    postal_code: string;
  } | null;
  order_items: OrderItem[];
  payment_proofs?: PaymentProof[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Pembayaran',
  paid: 'Sudah Dibayar',
  processing: 'Diproses',
  shipped: 'Sedang Dikirim',
  delivered: 'Selesai',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E8', text: '#E07B39' },
  paid: { bg: '#F0FBF4', text: '#2D7D52' },
  processing: { bg: '#EEF2FF', text: '#6C5CE7' },
  shipped: { bg: '#EAF6FF', text: '#0288D1' },
  delivered: { bg: '#F0FBF4', text: '#2D7D52' },
  completed: { bg: '#F0FBF4', text: '#2D7D52' },
  cancelled: { bg: '#FFF0F0', text: '#E53935' },
};

function formatPrice(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`;
}

function responseErrorMessage(value: unknown, fallback: string): string {
  if (typeof value !== 'object' || value === null) return fallback;
  const message = (value as Record<string, unknown>).error;
  return typeof message === 'string' && message.trim().length > 0 ? message : fallback;
}

function latestProof(proofs: PaymentProof[] | undefined): PaymentProof | null {
  if (!proofs || proofs.length === 0) return null;
  return [...proofs].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  )[0];
}

function destinationTitle(destination: ManualPaymentDestination): string {
  if (destination.type === 'qris') return 'QR / QRIS statis';
  return destination.account.label || destination.account.bankName;
}

function parseCustomDetails(value: unknown): CustomOrderDetails | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.size !== 'string' ||
    typeof record.material !== 'string' ||
    typeof record.personalization !== 'string'
  ) {
    return null;
  }
  return {
    size: record.size,
    material: record.material,
    personalization: record.personalization,
    designNotes: typeof record.designNotes === 'string' ? record.designNotes : null,
    referenceUrl: typeof record.referenceUrl === 'string' ? record.referenceUrl : null,
    referenceImageName:
      typeof record.referenceImageName === 'string' ? record.referenceImageName : null,
  };
}

function metadataFlow(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null;
  const flow = (value as Record<string, unknown>).flow;
  return typeof flow === 'string' ? flow : null;
}

function hasShippingTracking(order: Order): boolean {
  if (order.shipping_tracking) return true;
  if (typeof order.shipping_metadata !== 'object' || order.shipping_metadata === null) return false;
  const metadata = order.shipping_metadata as Record<string, unknown>;
  return Boolean(
    metadata.biteship_order_id || metadata.courier_tracking_id || metadata.courier_waybill_id,
  );
}

function isCustomRequestOrder(order: Order): boolean {
  return (
    order.payment_method === 'custom_request' ||
    metadataFlow(order.payment_metadata) === 'custom_request'
  );
}

function isManualTransferOrder(order: Order): boolean {
  return order.payment_method === 'manual_transfer';
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const supabase = createClient();
  const [selectedPaymentDestinationId, setSelectedPaymentDestinationId] = React.useState('');
  const [proofFile, setProofFile] = React.useState<File | null>(null);

  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          '*, order_items(*, products(*, product_images(*))), addresses(*), payment_proofs(*)',
        )
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data as unknown as Order;
    },
  });

  const { data: storeSettings = null } = useQuery<StoreSettings | null>({
    queryKey: ['store-settings'],
    queryFn: getStoreSettings,
    enabled: Boolean(order && order.status === 'pending'),
    staleTime: 1000 * 60 * 5,
  });

  const manualPayment = React.useMemo(
    () => parseManualPaymentSettings(storeSettings),
    [storeSettings],
  );
  const paymentDestinations = manualPayment.destinations;
  const latestPaymentProof = React.useMemo(
    () => latestProof(order?.payment_proofs),
    [order?.payment_proofs],
  );

  React.useEffect(() => {
    if (paymentDestinations.length === 0) {
      if (selectedPaymentDestinationId) setSelectedPaymentDestinationId('');
      return;
    }

    if (
      !paymentDestinations.some((destination) => destination.id === selectedPaymentDestinationId)
    ) {
      setSelectedPaymentDestinationId(paymentDestinations[0].id);
    }
  }, [paymentDestinations, selectedPaymentDestinationId]);

  const { mutate: uploadProof, isPending: uploadingProof } = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('Pesanan tidak ditemukan.');
      if (!proofFile) throw new Error('Upload bukti transfer terlebih dahulu.');
      if (!selectedPaymentDestinationId) throw new Error('Pilih tujuan pembayaran.');

      const formData = new FormData();
      formData.set('orderId', order.id);
      formData.set('destinationId', selectedPaymentDestinationId);
      formData.set('submittedAmount', String(order.total));
      formData.set('file', proofFile);

      const response = await fetch('/api/payment/proof', {
        method: 'POST',
        body: formData,
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseErrorMessage(body, 'Gagal mengupload bukti transfer'));
      }
    },
    onSuccess: () => {
      toast.success('Bukti transfer terkirim. Admin akan verifikasi pembayaran.');
      setProofFile(null);
      void refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengupload bukti transfer');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#FDFCFB]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[#FDFCFB] px-10 text-center">
        <Package size={48} className="text-ink-4" />
        <h2 className="mt-4 font-heading text-[18px] font-extrabold text-ink">
          Pesanan Tidak Ditemukan
        </h2>
        <button onClick={() => router.back()} className="mt-6 text-primary font-bold">
          Kembali
        </button>
      </div>
    );
  }

  const st = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
  const customRequest = isCustomRequestOrder(order);
  const manualTransfer = isManualTransferOrder(order) || Boolean(latestPaymentProof);
  const statusLabel =
    customRequest && order.status === 'pending'
      ? 'Menunggu Konfirmasi'
      : manualTransfer && order.status === 'pending'
        ? 'Menunggu Verifikasi Pembayaran'
        : STATUS_LABEL[order.status];
  const canTrack =
    hasShippingTracking(order) ||
    ['shipped', 'delivered', 'completed'].includes(order.status) ||
    ['shipped', 'delivered'].includes(order.shipping_status ?? '');
  const canUploadManualProof =
    !customRequest &&
    order.status === 'pending' &&
    order.payment_status !== 'paid' &&
    (!latestPaymentProof || latestPaymentProof.status === 'rejected');

  return (
    <div className="min-h-dvh bg-[#FDFCFB] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stone-2 bg-[#FDFCFB]/90 px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-stone-2 text-ink shadow-sm active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading text-[18px] font-extrabold text-ink">Detail Pesanan</h1>
        </div>
      </header>

      <main className="px-5 pt-6 space-y-5">
        {/* Status Card */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-ink-4 uppercase tracking-wider">
                Status Pesanan
              </p>
              <h2
                className="mt-1 font-heading text-[20px] font-extrabold"
                style={{ color: st.text }}
              >
                {statusLabel}
              </h2>
            </div>
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{ background: st.bg, color: st.text }}
            >
              <Package size={24} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-2/50 flex justify-between items-center">
            <p className="text-[12px] font-bold text-ink-4">No. Pesanan</p>
            <p className="text-[12px] font-extrabold text-ink">{order.order_number}</p>
          </div>
        </div>

        {customRequest ? (
          <div className="rounded-[28px] border border-primary/20 bg-primary/5 p-5">
            <p className="font-heading text-[15px] font-extrabold text-ink">
              Request custom sedang dicek admin
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
              Detail custom sudah masuk. Admin akan konfirmasi desain dan pembayaran final lewat
              WhatsApp sebelum produksi.
            </p>
          </div>
        ) : null}

        {!customRequest && order.status === 'pending' ? (
          <div className="rounded-[28px] border border-primary/20 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-[15px] font-extrabold text-ink">
                  Instruksi Transfer
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
                  Transfer sesuai total pembayaran, lalu upload bukti. Admin akan verifikasi sebelum
                  pesanan dikirim.
                </p>
                {manualPayment.instructions ? (
                  <p className="mt-3 rounded-xl bg-stone-1 px-3 py-2 text-[12px] leading-relaxed text-ink-3">
                    {manualPayment.instructions}
                  </p>
                ) : null}
              </div>
            </div>

            {latestPaymentProof ? (
              <div className="mt-4 rounded-2xl border border-stone-2 bg-stone-1 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-heading text-[13px] font-extrabold text-ink">Bukti terakhir</p>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase"
                    style={{
                      background: latestPaymentProof.status === 'rejected' ? '#FFF0F0' : '#FFF3E8',
                      color: latestPaymentProof.status === 'rejected' ? '#E53935' : '#E07B39',
                    }}
                  >
                    {latestPaymentProof.status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-[12px] font-medium text-ink-3">
                  <p>Tujuan: {latestPaymentProof.payment_destination_label}</p>
                  <p>Nominal: {formatPrice(latestPaymentProof.submitted_amount)}</p>
                  <p>
                    Upload:{' '}
                    {new Intl.DateTimeFormat('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(latestPaymentProof.created_at))}
                  </p>
                  {latestPaymentProof.rejection_reason ? (
                    <p className="mt-2 rounded-xl bg-white px-3 py-2 font-bold text-[#E53935]">
                      Alasan ditolak: {latestPaymentProof.rejection_reason}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {canUploadManualProof ? (
              <div className="mt-4 space-y-4">
                {paymentDestinations.length > 0 ? (
                  <div className="space-y-3">
                    {paymentDestinations.map((destination) => {
                      const selected = destination.id === selectedPaymentDestinationId;
                      return (
                        <button
                          key={destination.id}
                          type="button"
                          onClick={() => setSelectedPaymentDestinationId(destination.id)}
                          className="w-full rounded-2xl border-2 bg-white p-4 text-left transition-colors active:bg-stone-1"
                          style={{
                            borderColor: selected ? 'var(--color-primary)' : 'var(--color-stone-2)',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                              style={{
                                borderColor: selected
                                  ? 'var(--color-primary)'
                                  : 'var(--color-stone-3)',
                              }}
                            >
                              {selected ? (
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                              ) : null}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {destination.type === 'qris' ? (
                                  <QrCode size={16} className="text-primary" />
                                ) : (
                                  <Landmark size={16} className="text-primary" />
                                )}
                                <p className="font-heading text-[13px] font-extrabold text-ink">
                                  {destinationTitle(destination)}
                                </p>
                              </div>
                              {destination.type === 'qris' ? (
                                <div className="mt-3 overflow-hidden rounded-xl border border-stone-2 bg-white p-1.5">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={destination.qrImageUrl}
                                    alt="QR pembayaran manual"
                                    className="mx-auto max-h-[260px] w-full max-w-[320px] object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="mt-2 space-y-1 text-[13px] font-medium text-ink-3">
                                  <p className="font-heading text-[15px] font-extrabold text-[#E53935]">
                                    {destination.account.accountNumber}
                                  </p>
                                  <p>{destination.account.bankName}</p>
                                  <p>a.n. {destination.account.accountHolder}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-stone-1 px-4 py-3 text-[12px] font-bold text-ink-3">
                    Admin belum mengaktifkan QR atau rekening transfer.
                  </p>
                )}

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-stone-3 bg-stone-1 px-4 py-5 text-center active:bg-stone-2">
                  <Upload size={24} className="text-primary" />
                  <span className="mt-2 font-heading text-[13px] font-extrabold text-ink">
                    {proofFile ? proofFile.name : 'Pilih foto atau PDF bukti transfer'}
                  </span>
                  <span className="mt-1 text-[11px] font-bold text-ink-4">
                    Maks 5MB, JPG/PNG/WEBP/HEIC/PDF
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                    className="hidden"
                    onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => uploadProof()}
                  disabled={uploadingProof || !proofFile || !selectedPaymentDestinationId}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[13px] font-extrabold text-white shadow-[0_4px_12px_rgba(224,123,57,0.28)] active:scale-95 transition-all disabled:opacity-50"
                >
                  {uploadingProof ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : latestPaymentProof?.status === 'rejected' ? (
                    'Upload Ulang Bukti'
                  ) : (
                    'Upload Bukti Transfer'
                  )}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Shipping Info */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-stone-1 flex items-center justify-center text-ink-3">
              <MapPin size={18} />
            </div>
            <h3 className="font-heading text-[15px] font-extrabold text-ink">Alamat Pengiriman</h3>
          </div>
          <div className="pl-11">
            {order.addresses ? (
              <>
                <p className="text-[14px] font-extrabold text-ink">
                  {order.addresses.recipient_name}
                </p>
                <p className="mt-1 text-[13px] text-ink-3 leading-relaxed">
                  {order.addresses.phone}
                  <br />
                  {order.addresses.full_address}
                  <br />
                  {order.addresses.city}, {order.addresses.postal_code}
                </p>
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-3">
                Alamat pengiriman akan dikonfirmasi admin setelah desain custom disetujui.
              </p>
            )}
          </div>

          {canTrack ? (
            <button
              onClick={() => router.push(`/account/orders/${order.id}/tracking` as Route)}
              className="mt-6 flex w-full items-center justify-between rounded-2xl bg-stone-1 px-5 py-4 border border-stone-2 hover:bg-stone-2 transition-colors"
            >
              <div className="flex items-center gap-3 text-primary">
                <Truck size={20} />
                <span className="text-[13px] font-extrabold">Lacak Pengiriman</span>
              </div>
              <ChevronRight size={18} className="text-ink-4" />
            </button>
          ) : null}
        </div>

        {/* Order Items */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <h3 className="font-heading text-[15px] font-extrabold text-ink mb-4">Produk</h3>
          <div className="space-y-4">
            {order.order_items?.map((item) => {
              const customDetails = parseCustomDetails(item.custom_details);
              return (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-1 border border-stone-2">
                    {item.products?.product_images?.[0]?.url ? (
                      <Image
                        src={item.products.product_images[0].url}
                        alt={item.products?.name || item.product_name || 'Produk'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ink-4">
                        <Package size={22} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-extrabold text-ink line-clamp-1">
                      {item.products?.name || item.product_name}
                    </p>
                    {item.variant_name ? (
                      <p className="mt-0.5 text-[12px] font-bold text-ink-4">{item.variant_name}</p>
                    ) : null}
                    {customDetails ? (
                      <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] leading-relaxed text-ink-3">
                        <p className="font-heading font-extrabold text-primary">
                          Custom: {customDetails.personalization}
                        </p>
                        <p>
                          {customDetails.size} · {customDetails.material}
                        </p>
                        {customDetails.designNotes ? (
                          <p>Catatan: {customDetails.designNotes}</p>
                        ) : null}
                        {customDetails.referenceUrl ? (
                          <p className="break-all">Ref: {customDetails.referenceUrl}</p>
                        ) : null}
                        {customDetails.referenceImageName ? (
                          <p className="break-all">Foto: {customDetails.referenceImageName}</p>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="mt-1 text-[12px] font-bold text-[#E53935]">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-stone-1 flex items-center justify-center text-ink-3">
              <CreditCard size={18} />
            </div>
            <h3 className="font-heading text-[15px] font-extrabold text-ink">Rincian Pembayaran</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-[13px]">
              <span className="font-bold text-ink-4">Metode Pembayaran</span>
              <span className="font-extrabold text-ink">
                {customRequest ? 'Konfirmasi admin' : 'Transfer manual'}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="font-bold text-ink-4">Total Harga Produk</span>
              <span className="font-extrabold text-[#E53935]">
                {formatPrice(order.total - (order.shipping_cost || 0))}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="font-bold text-ink-4">Ongkos Kirim</span>
              <span className="font-extrabold text-[#E53935]">
                {formatPrice(order.shipping_cost || 0)}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-2/50 flex justify-between items-center">
              <span className="font-heading text-[15px] font-extrabold text-ink">
                {customRequest ? 'Estimasi Custom' : 'Total Pembayaran'}
              </span>
              <span className="font-heading text-[18px] font-extrabold text-[#E53935]">
                {formatPrice(order.total)}
              </span>
            </div>
            {customRequest ? (
              <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-[11px] leading-relaxed text-ink-4">
                Nominal final bisa berubah setelah admin mengonfirmasi desain, material, dan
                pengiriman.
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
