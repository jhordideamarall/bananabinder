'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Loader2, Minus, Plus, Tag, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCartStore, type CartItem } from '@/stores/cart-store';

const fmt = (n: number) => n.toLocaleString('id-ID');

function ProductThumb({ item }: { item: CartItem }) {
  const label = item.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-stone font-heading text-[10px] font-extrabold text-ink-4">
      {item.imageUrl ? (
        <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
      ) : (
        <span>{label || 'BB'}</span>
      )}
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const setItemQuantity = useCartStore((state) => state.setItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const voucherCode = useCartStore((state) => state.voucherCode);
  const voucherDiscount = useCartStore((state) => state.voucherDiscount);
  const setVoucher = useCartStore((state) => state.setVoucher);
  const clearVoucher = useCartStore((state) => state.clearVoucher);

  const [voucherInput, setVoucherInput] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );
  const count = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
  const hasItems = hydrated && items.length > 0;

  // Diskon dipakai max sebesar subtotal.
  const discount = Math.min(voucherDiscount, subtotal);
  const total = Math.max(subtotal - discount, 0);

  const applyVoucher = async () => {
    const code = voucherInput.trim();
    if (!code) return;
    setApplyingVoucher(true);
    try {
      const res = await fetch('/api/voucher/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data: { valid: boolean; discount: number; code?: string; message: string } =
        await res.json();
      if (data.valid) {
        setVoucher(data.code ?? code.toUpperCase(), data.discount);
        setVoucherInput('');
        toast.success(`Voucher dipasang — hemat Rp ${fmt(data.discount)}`);
      } else {
        toast.error(data.message || 'Voucher tidak valid');
      }
    } catch {
      toast.error('Gagal memeriksa voucher');
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Re-validasi voucher saat isi cart berubah (mis. min order tak lagi terpenuhi).
  useEffect(() => {
    if (!voucherCode || subtotal <= 0) return;
    let cancelled = false;
    fetch('/api/voucher/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: voucherCode, subtotal }),
    })
      .then((res) => res.json())
      .then((data: { valid: boolean; discount: number; message: string }) => {
        if (cancelled) return;
        if (data.valid) {
          setVoucher(voucherCode, data.discount);
        } else {
          clearVoucher();
          toast.error(`Voucher dilepas: ${data.message}`);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [subtotal, voucherCode, setVoucher, clearVoucher]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-stone">
      <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between border-b border-stone-2 bg-white px-[clamp(16px,5vw,20px)]">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-ink active:scale-95 transition-transform"
          aria-label="Kembali"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="font-heading text-[18px] font-extrabold text-ink">Keranjang</h1>
        <span className="min-w-10 text-right font-heading text-[14px] font-extrabold text-ink">
          {count} item
        </span>
      </header>

      <main className="flex-1 overflow-y-auto pb-36">
        <section className="bg-white">
          {hasItems ? (
            items.map((item) => (
              <div
                key={`${item.id}-${item.variantId ?? 'base'}`}
                className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-x-3 border-b border-stone-2 px-[clamp(16px,5vw,20px)] py-3.5"
              >
                <ProductThumb item={item} />
                <div className="min-w-0">
                  <h2 className="line-clamp-2 font-heading text-[14px] font-extrabold leading-[17px] text-ink">
                    {item.name}
                  </h2>
                  <p className="mt-0.5 font-heading text-[16px] font-extrabold leading-5 text-primary">
                    Rp {fmt(item.price)}
                  </p>

                  <div className="mt-1.5">
                    <div className="qty-stepper w-fit bg-white" style={{ height: 34 }}>
                      <button
                        className="qty-btn text-danger"
                        style={{ width: 32, height: 32 }}
                        aria-label={`Hapus ${item.name}`}
                        onClick={() => {
                          if (item.quantity === 1) {
                            removeItem(item.id, item.variantId);
                          } else {
                            setItemQuantity(item.id, item.variantId, item.quantity - 1);
                          }
                        }}
                      >
                        {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={15} />}
                      </button>
                      <span className="qty-val text-[14px]" style={{ width: 34 }}>
                        {item.quantity}
                      </span>
                      <button
                        className="qty-btn text-primary"
                        style={{ width: 32, height: 32 }}
                        aria-label={`Tambah ${item.name}`}
                        onClick={() => setItemQuantity(item.id, item.variantId, item.quantity + 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="self-center whitespace-nowrap font-heading text-[13px] font-extrabold text-ink">
                  Rp {fmt(item.price * item.quantity)}
                </p>
              </div>
            ))
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-8 text-center">
              <p className="font-heading text-[16px] font-extrabold text-ink">Keranjangmu kosong</p>
              <p className="mt-2 text-sm text-ink-3">Produk yang kamu pilih akan muncul di sini.</p>
              <Link
                href="/products"
                className="mt-5 rounded-[14px] bg-primary px-[clamp(16px,5vw,20px)] py-3 font-heading text-sm font-bold text-white"
              >
                Belanja Produk
              </Link>
            </div>
          )}
        </section>

        {hasItems && (
          <>
            <section className="mt-2 bg-white px-[clamp(16px,5vw,20px)] py-5">
              <div className="mb-3 flex items-center gap-2 font-heading text-[14px] font-extrabold text-ink">
                <Tag size={18} />
                <span>Voucher</span>
              </div>
              {voucherCode ? (
                <div
                  className="flex items-center justify-between gap-2 rounded-[14px] border border-primary/30 px-4 py-3"
                  style={{ background: 'var(--color-orange-light)' }}
                >
                  <div className="min-w-0">
                    <p className="font-heading text-[14px] font-extrabold text-ink">
                      {voucherCode}
                    </p>
                    <p className="text-xs font-medium text-ink-3">
                      Hemat Rp {fmt(voucherDiscount)}
                    </p>
                  </div>
                  <button
                    onClick={clearVoucher}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-3 active:scale-95 transition-transform"
                    aria-label="Lepas voucher"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && applyVoucher()}
                    placeholder="Kode voucher"
                    className="h-12 min-w-0 flex-1 rounded-[14px] border border-stone-3 bg-white px-4 text-[15px] font-medium text-ink outline-none focus:border-primary"
                  />
                  <button
                    onClick={applyVoucher}
                    disabled={applyingVoucher || !voucherInput.trim()}
                    className="flex h-12 items-center justify-center rounded-[14px] px-[clamp(16px,5vw,20px)] font-heading text-[14px] font-extrabold text-primary disabled:opacity-50"
                    style={{ background: 'var(--color-orange-light)' }}
                  >
                    {applyingVoucher ? <Loader2 className="animate-spin" size={18} /> : 'Pakai'}
                  </button>
                </div>
              )}
            </section>

            <section className="mt-2 bg-white px-[clamp(16px,5vw,20px)] py-5">
              <h2 className="mb-4 font-heading text-[14px] font-extrabold text-ink">
                Ringkasan Pesanan
              </h2>
              <div className="flex justify-between text-[15px] text-ink-3">
                <span>Subtotal</span>
                <span className="font-heading font-extrabold text-ink">Rp {fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="mt-4 flex justify-between text-[15px] text-ink-3">
                  <span>Diskon voucher</span>
                  <span className="font-heading font-extrabold text-success">
                    - Rp {fmt(discount)}
                  </span>
                </div>
              )}
              <div className="mt-4 flex justify-between text-[15px] text-ink-3">
                <span>Ongkir</span>
                <span className="font-heading font-extrabold text-ink-4">
                  Dihitung saat checkout
                </span>
              </div>
              <div className="my-5 h-px bg-stone-2" />
              <div className="flex justify-between">
                <span className="font-heading text-[14px] font-extrabold text-ink">Subtotal</span>
                <span className="font-heading text-[19px] font-extrabold text-primary">
                  Rp {fmt(total)}
                </span>
              </div>
            </section>
          </>
        )}
      </main>

      {hasItems && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-stone-2 bg-white px-[clamp(16px,5vw,20px)] py-4">
          <Link
            href="/checkout"
            className="flex h-14 w-full items-center justify-center rounded-[18px] bg-primary font-heading text-[15px] font-extrabold text-white shadow-md active:scale-[0.98] transition-transform"
          >
            Lanjut ke Checkout
          </Link>
          <div className="safe-bottom" />
        </div>
      )}
    </div>
  );
}
