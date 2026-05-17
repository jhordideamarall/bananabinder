'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { m } from 'framer-motion';
import { ChevronLeft, ShoppingCart, Heart, Check, Plus, Minus, ChevronRight } from 'lucide-react';
import { PriceTag } from '@/components/shared/price-tag';
import { RatingStars } from '@/components/shared/rating-stars';
import { ProductGallery } from '@/components/shared/product-gallery';
import { VariantSelector, type VariantOption } from '@/components/shared/variant-selector';
import { useCartStore } from '@/stores/cart-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleWishlist, getUserWishlist } from '@/lib/services/wishlist-client';
import { PageTitle } from '@/components/shared/page-title';

import type { DetailedProduct } from '@/lib/dummy-products';

interface ProductDetailClientProps {
  product: DetailedProduct;
}

const DUMMY_REVIEWS = [
  {
    id: 1,
    user: 'Rina S.',
    initial: 'R',
    rating: 5,
    date: '28 Apr 2025',
    content: 'Bindernya rapi, materialnya terasa premium, dan packaging aman sampai rumah.',
    useCase: 'Photocard & daily notes',
  },
  {
    id: 2,
    user: 'Budi K.',
    initial: 'B',
    rating: 5,
    date: '22 Apr 2025',
    content: 'Warna sesuai foto, ring binder kokoh, refill juga gampang dipasang.',
    useCase: 'Journaling & koleksi foto',
  },
  {
    id: 3,
    user: 'Siti M.',
    initial: 'S',
    rating: 5,
    date: '18 Apr 2025',
    content: 'Pesan custom nama hasilnya clean. Admin responsif waktu konfirmasi desain.',
    useCase: 'Custom gift',
  },
];

const DUMMY_SHIPPING = [
  { id: 1, name: 'JNE Reguler', est: '2–4 hari', price: 'Rp 12.000 – 25.000' },
  { id: 2, name: 'JNT Express', est: '1–3 hari', price: 'Rp 10.000 – 20.000' },
  { id: 3, name: 'Same Day', est: '< 3 jam', price: 'Rp 20.000 – 35.000' },
];

/**
 * Robust formatter for Product Description
 */
function FormattedDescription({ text }: { text?: string }) {
  if (!text)
    return (
      <p className="t-body" style={{ color: 'var(--color-ink-4)' }}>
        Tidak ada deskripsi produk.
      </p>
    );

  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        const processBold = (content: string) => {
          const parts = content.split(/(\*.*?\*)/g);
          return parts.map((part, i) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <strong key={i} style={{ fontWeight: 800, color: 'var(--color-ink)' }}>
                  {part.slice(1, -1)}
                </strong>
              );
            }
            return part;
          });
        };

        if (trimmed.startsWith('·') || trimmed.startsWith('-')) {
          const content = trimmed.slice(1).trim();
          return (
            <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 2 }}>
              <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>·</span>
              <span className="t-body" style={{ flex: 1, fontSize: 14 }}>
                {processBold(content)}
              </span>
            </div>
          );
        }

        if (trimmed === '') return <div key={idx} style={{ height: 12 }} />;

        return (
          <p
            key={idx}
            className="t-body"
            style={{ fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 4 }}
          >
            {processBold(line)}
          </p>
        );
      })}
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString('id-ID');

const DESIGN = {
  padding: '20px',
  radius: '14px',
  shadow: '0 4px 20px rgba(0,0,0,0.06)',
  bg: '#FDFCFB',
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews' | 'shipping'>('desc');
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    product.variants?.[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const queryClient = useQueryClient();

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getUserWishlist,
  });

  type WishlistItem = { id: string; product_id: string };
  const productId = String(product.id);
  const isWishlisted = (wishlist as WishlistItem[]).some((w) => w.product_id === productId);

  const wishlistMutation = useMutation({
    mutationFn: () => toggleWishlist(productId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      const prev = queryClient.getQueryData<WishlistItem[]>(['wishlist']) ?? [];
      const alreadyIn = prev.some((w) => w.product_id === productId);
      queryClient.setQueryData<WishlistItem[]>(
        ['wishlist'],
        alreadyIn
          ? prev.filter((w) => w.product_id !== productId)
          : [...prev, { product_id: productId, id: `optimistic-${productId}` }],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['wishlist'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
  const addTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const activePrice =
    selectedVariant?.promoPrice ?? selectedVariant?.price ?? product.promoPrice ?? product.price;
  const activeOriginalPrice = selectedVariant ? selectedVariant.price : product.price;
  const activeStock = selectedVariant?.stock ?? product.stock ?? 99;

  const images = selectedVariant?.image_url
    ? [
        selectedVariant.image_url,
        ...(product.images ?? []).filter((image) => image !== selectedVariant.image_url),
      ]
    : product.images?.length
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const handleAddToCart = (directBuy = false) => {
    const itemName = selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name;
    addItem({
      id: product.id,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      name: itemName,
      price: activePrice,
      imageUrl: selectedVariant?.image_url ?? product.imageUrl,
      quantity,
      // Berat dipakai untuk kalkulasi ongkir — varian boleh override berat produk.
      weight: selectedVariant?.weight_grams ?? product.weight_grams ?? 500,
    });

    if (directBuy) {
      router.push('/checkout');
    } else {
      setJustAdded(true);
      if (addTimeoutRef.current) clearTimeout(addTimeoutRef.current);
      addTimeoutRef.current = setTimeout(() => setJustAdded(false), 600);
    }
  };

  const tabs = [
    { id: 'desc', label: 'Deskripsi' },
    { id: 'reviews', label: `Ulasan (${fmt(product.reviewCount || 124)})` },
    { id: 'shipping', label: 'Pengiriman' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DESIGN.bg }}>
      <PageTitle title={product.name} />
      {/* Top Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          height: 'calc(60px + env(safe-area-inset-top))',
          background: '#FFFFFF',
          padding: `calc(env(safe-area-inset-top) + 0px) ${DESIGN.padding} 0`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: DESIGN.shadow,
          borderBottom: '1px solid var(--color-stone-2)',
        }}
      >
        <m.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            color: 'var(--color-ink)',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </m.button>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 16,
            color: 'var(--color-ink)',
          }}
        >
          Detail Produk
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <Link href="/cart" className="no-underline">
            <m.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8, rotate: -8 }}
              style={{
                background: 'none',
                border: 'none',
                padding: 8,
                color: 'var(--color-ink)',
                position: 'relative',
              }}
            >
              <m.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3 }}>
                <ShoppingCart size={22} strokeWidth={2} />
              </m.div>
              {hydrated && cartCount > 0 && (
                <m.div
                  key={cartCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-1 right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full border border-white bg-primary px-1 font-heading text-[10px] font-bold text-white badge-bounce"
                >
                  {cartCount}
                </m.div>
              )}
            </m.button>
          </Link>
          <m.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.75 }}
            animate={{ scale: isWishlisted ? [1, 1.35, 1] : 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => wishlistMutation.mutate()}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              color: isWishlisted ? '#E53935' : 'var(--color-ink)',
              cursor: 'pointer',
            }}
          >
            <m.div whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}>
              <Heart size={22} fill={isWishlisted ? '#E53935' : 'none'} strokeWidth={2} />
            </m.div>
          </m.button>
        </div>
      </div>

      <div style={{ paddingTop: 'calc(60px + env(safe-area-inset-top))', paddingBottom: 130 }}>
        <ProductGallery
          images={images}
          productName={product.name}
          fallbackColor={product.imageColor}
        />

        {/* Unified Info Card */}
        <div
          style={{
            background: DESIGN.bg,
            borderRadius: '24px 24px 0 0',
            marginTop: -24,
            position: 'relative',
            zIndex: 10,
            padding: `24px ${DESIGN.padding} 0`,
            boxShadow: '0 -10px 30px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 22,
                color: 'var(--color-ink)',
                lineHeight: 1.25,
                letterSpacing: '-0.5px',
                flex: 1,
              }}
            >
              {product.name}
            </h1>
            {activePrice < activeOriginalPrice ? (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 10,
                  background: '#FDECEA',
                  color: '#C0392B',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: 12,
                  marginTop: 4,
                  flexShrink: 0,
                }}
              >
                -{Math.round((1 - activePrice / activeOriginalPrice) * 100)}%
              </span>
            ) : null}
          </div>

          <div style={{ marginBottom: 20 }}>
            <PriceTag
              price={activeOriginalPrice}
              promoPrice={activePrice < activeOriginalPrice ? activePrice : null}
              size="lg"
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--color-stone)',
              padding: '12px 16px',
              borderRadius: DESIGN.radius,
              marginBottom: 28,
              border: '1px solid var(--color-stone-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <RatingStars rating={product.rating || 0} size={14} />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'var(--color-ink)',
                }}
              >
                {fmt(product.rating || 0)}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--color-ink-4)',
                }}
              >
                ({fmt(product.reviewCount || 0)})
              </span>
            </div>
            <div style={{ width: 1, height: 14, background: 'var(--color-stone-3)' }} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-ink-3)',
                fontWeight: 500,
              }}
            >
              {fmt(product.soldCount || 0)} terjual
            </span>
            <div style={{ width: 1, height: 14, background: 'var(--color-stone-3)' }} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-ink-3)',
                fontWeight: 500,
              }}
            >
              Stok {fmt(activeStock)}
            </span>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p className="t-label" style={{ marginBottom: 14 }}>
                Pilih Varian
              </p>
              <VariantSelector
                variants={product.variants}
                selectedId={selectedVariant?.id ?? null}
                onSelect={(v) => {
                  setSelectedVariant(v);
                  setQuantity(1);
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                minHeight: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                background: 'var(--color-stone)',
                borderRadius: DESIGN.radius,
                padding: '14px 16px 14px 20px',
              }}
            >
              <p className="t-label" style={{ fontSize: 15, fontWeight: 800 }}>
                Jumlah
              </p>
              <div
                className="qty-stepper"
                style={{
                  height: 44,
                  background: '#FFFFFF',
                  border: '1.5px solid var(--color-stone-3)',
                  borderRadius: 999,
                  padding: '0 4px',
                  flexShrink: 0,
                }}
              >
                <button
                  className="qty-btn"
                  style={{ width: 40, height: 40, color: 'var(--color-ink-3)' }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={18} />
                </button>
                <div className="qty-val" style={{ width: 40, fontSize: 16, fontWeight: 800 }}>
                  {quantity}
                </div>
                <button
                  className="qty-btn"
                  style={{ width: 40, height: 40, color: '#E53935' }}
                  onClick={() => {
                    const newQty = Math.min(activeStock, quantity + 1);
                    if (newQty > quantity) {
                      setQuantity(newQty);
                    }
                  }}
                  disabled={quantity >= activeStock}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              borderBottom: '1px solid var(--color-stone-2)',
              display: 'flex',
              marginBottom: 24,
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'desc' | 'reviews' | 'shipping')}
                  className={`tab-btn ${isActive ? 'active' : ''}`}
                  style={{
                    flex: 1,
                    position: 'relative',
                    textAlign: 'center',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-ink-4)',
                    paddingBottom: 12,
                    borderBottom: isActive
                      ? '2px solid var(--color-primary)'
                      : '2px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ minHeight: 120, paddingBottom: 30 }}>
            {activeTab === 'desc' && (
              <div style={{ textAlign: 'left' }}>
                <FormattedDescription text={product.description} />
              </div>
            )}
            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {DUMMY_REVIEWS.map((rev, i) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: '16px 0',
                      borderBottom:
                        i < DUMMY_REVIEWS.length - 1 ? '1px solid var(--color-stone-2)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'var(--color-primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 800,
                          fontSize: 16,
                          color: 'var(--color-primary)',
                          flexShrink: 0,
                        }}
                      >
                        {rev.initial}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 2,
                          }}
                        >
                          <span className="t-label" style={{ fontSize: 14 }}>
                            {rev.user}
                          </span>
                          <span className="t-micro">{rev.date}</span>
                        </div>
                        <RatingStars rating={rev.rating} size={12} />
                      </div>
                    </div>
                    <p
                      className="t-body"
                      style={{ fontSize: 13, marginBottom: 4, textAlign: 'left' }}
                    >
                      {rev.content}
                    </p>
                    <p
                      className="t-micro"
                      style={{
                        fontStyle: 'normal',
                        color: 'var(--color-ink-4)',
                        textAlign: 'left',
                      }}
                    >
                      {rev.useCase}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'shipping' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {DUMMY_SHIPPING.map((ship, i) => (
                  <div
                    key={ship.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 0',
                      borderBottom:
                        i < DUMMY_SHIPPING.length - 1 ? '1px solid var(--color-stone-2)' : 'none',
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <p className="t-label" style={{ fontSize: 14, marginBottom: 2 }}>
                        {ship.name}
                      </p>
                      <p className="t-small">Estimasi {ship.est}</p>
                    </div>
                    <p className="t-price-sm" style={{ fontSize: 13 }}>
                      {ship.price}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: '#FFFFFF',
          borderTop: '1px solid var(--color-stone-2)',
          boxShadow: DESIGN.shadow,
          padding: `16px ${DESIGN.padding} calc(16px + env(safe-area-inset-bottom))`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 110,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="t-micro" style={{ color: 'var(--color-ink-3)', fontWeight: 500 }}>
            Total · {quantity} item
          </p>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 20,
              color: '#E53935',
            }}
          >
            Rp {fmt(activePrice * quantity)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <m.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddToCart(false)}
            animate={{ backgroundColor: justAdded ? 'var(--color-success)' : '#FFFFFF' }}
            style={{
              flex: 1,
              height: 48,
              borderRadius: DESIGN.radius,
              border: `1.5px solid ${justAdded ? 'var(--color-success)' : 'var(--color-primary)'}`,
              background: '#FFFFFF',
              color: justAdded ? '#FFFFFF' : 'var(--color-primary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {justAdded ? <Check size={18} strokeWidth={3} /> : <ShoppingCart size={18} />}
            <span>Keranjang</span>
          </m.button>
          <m.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddToCart(true)}
            style={{
              flex: 1.2,
              height: 48,
              borderRadius: DESIGN.radius,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(126,200,227,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>Beli Sekarang</span>
            <ChevronRight size={18} strokeWidth={2.5} />
          </m.button>
        </div>
      </div>
    </div>
  );
}
