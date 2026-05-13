'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getActiveProducts } from '@/lib/services/product-client';
import { Loader2 } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatPrice(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SearchInputIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#A09890"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

function getSmartFallbackImage(productName: string): string {
  const query = encodeURIComponent(productName.toLowerCase());
  return `https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80&sig=${query}`;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getActiveProducts,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return products.filter((p) => (p.promoPrice ?? 0) > 0);
    }

    return products.filter((p) =>
      [p.name, p.slug].filter(Boolean).some((value) => value!.toLowerCase().includes(q)),
    );
  }, [query, products]);

  const trimmedQuery = query.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="search-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[105]"
          style={{
            background: 'rgba(20,16,12,0.55)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        />
      )}
      {isOpen && (
        <m.div
          key="search-modal"
          initial={{ opacity: 0, scale: 0.94, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -12 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="fixed z-[110] left-1/2 -translate-x-1/2 search-modal-card lg:z-[210]"
          style={{
            top: 'calc(78px + env(safe-area-inset-top))',
            background: 'rgba(253,252,251,0.98)',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.72)',
            boxShadow: '0 28px 70px rgba(32,22,14,0.2), 0 8px 22px rgba(32,22,14,0.10)',
            overflow: 'hidden',
          }}
        >
            {/* Search input row */}
            <div
              className="flex items-center gap-3 px-3"
              style={{
                paddingTop: 12,
                paddingBottom: 12,
                borderBottom: '1px solid rgba(216,212,206,0.5)',
              }}
            >
              <div
                className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3"
                style={{
                  height: 48,
                  background: '#F5F3F0',
                  border: '1px solid rgba(216,212,206,0.75)',
                }}
              >
                <SearchInputIcon />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari makanan, vitamin, aksesoris..."
                  className="min-w-0 flex-1 bg-transparent font-sans text-ink outline-none placeholder:text-[#A09890]"
                  style={{ fontSize: 15, lineHeight: '20px' }}
                />
                {trimmedQuery && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="rounded-full px-2 font-heading text-[11px] font-bold text-[#A09890]"
                    style={{ height: 28, background: 'rgba(255,255,255,0.72)' }}
                  >
                    Hapus
                  </button>
                )}
              </div>
              <m.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 44,
                  height: 44,
                  background: 'rgba(216,212,206,0.45)',
                  color: '#7A746E',
                  flexShrink: 0,
                }}
                aria-label="Tutup pencarian"
              >
                <CloseIcon />
              </m.button>
            </div>

            {/* Section label */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div>
                <span className="font-heading text-[11px] font-bold tracking-widest uppercase text-[#A09890]">
                  {trimmedQuery ? 'Hasil Pencarian' : 'Diskon Spesial'}
                </span>
                <p className="mt-1 font-sans text-[12px] font-medium text-[#7A746E]">
                  {trimmedQuery
                    ? `${results.length} produk cocok`
                    : 'Produk promo yang sering dibeli'}
                </p>
              </div>
              {!trimmedQuery && (
                <span
                  className="rounded-full px-2.5 py-1 font-heading text-[11px] font-bold"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  Promo
                </span>
              )}
            </div>

            {/* Product list */}
            <div className="overflow-y-auto px-2" style={{ maxHeight: 360, paddingBottom: 10 }}>
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-8 py-12 text-center text-[#A09890]">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 56, height: 56, background: '#F5F3F0' }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <p className="mt-4 font-heading text-[15px] font-extrabold text-ink">
                    Produk tidak ditemukan
                  </p>
                  <p className="mt-1 font-sans text-sm leading-5">
                    Coba kata lain seperti "kucing", "vitamin", atau "grooming".
                  </p>
                </div>
              ) : (
                results.map((product, i) => {
                  const displayPrice = product.promoPrice ?? product.price;
                  const hasDiscount = (product.promoPrice ?? 0) > 0;
                  const discountPct = hasDiscount
                    ? Math.round(((product.price - product.promoPrice!) / product.price) * 100)
                    : 0;

                  return (
                    <m.div
                      key={product.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.035, type: 'spring', stiffness: 300, damping: 25 }}
                      whileTap={{ backgroundColor: 'rgba(126,200,227,0.08)' }}
                      className="rounded-[18px]"
                    >
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="flex min-h-[78px] cursor-pointer items-center gap-3 rounded-[18px] px-2.5 py-2.5 no-underline"
                        style={{
                          border:
                            i < results.length - 1
                              ? '1px solid rgba(216,212,206,0.34)'
                              : '1px solid rgba(216,212,206,0.18)',
                          background: i % 2 === 0 ? 'rgba(255,255,255,0.64)' : 'transparent',
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          className="relative flex-shrink-0 overflow-hidden rounded-[14px]"
                          style={{ width: 58, height: 58, background: '#F5F3F0' }}
                        >
                          <Image
                            src={product.imageUrl || getSmartFallbackImage(product.name)}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="58px"
                            unoptimized
                          />
                          {hasDiscount && (
                            <div
                              className="absolute top-1 left-1 rounded-md px-1 font-heading text-[9px] font-bold text-white"
                              style={{ background: 'var(--color-primary)', lineHeight: '14px' }}
                            >
                              -{discountPct}%
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-heading text-[14px] font-extrabold leading-[17px] text-ink">
                            {product.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-sans text-[11px] font-semibold text-[#A09890]">
                              Produk
                            </span>
                            <span className="h-1 w-1 rounded-full bg-[#D8D4CE]" />
                            <span className="font-sans text-[11px] font-semibold text-[#A09890]">
                              {product.soldCount?.toLocaleString('id-ID') ?? 0} terjual
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex-shrink-0 text-right">
                          <p className="font-heading text-[14px] font-extrabold text-primary">
                            {formatPrice(displayPrice)}
                          </p>
                          {hasDiscount && (
                            <p className="font-sans text-[11px] text-[#A09890] line-through">
                              {formatPrice(product.price)}
                            </p>
                          )}
                          <div
                            className="ml-auto mt-1 flex items-center justify-center rounded-full font-heading text-[11px] font-bold"
                            style={{
                              width: 26,
                              height: 26,
                              background: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                            }}
                          >
                            &gt;
                          </div>
                        </div>
                      </Link>
                    </m.div>
                  );
                })
              )}
            </div>
          </m.div>
      )}
    </AnimatePresence>
  );
}
