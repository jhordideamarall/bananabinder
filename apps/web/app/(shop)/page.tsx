'use client';
import { useRef, type CSSProperties, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import Image from 'next/image';
import {
  m,
  useScroll,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';
import { BestOffersGrid } from '@/components/home/best-offers';
import { DesktopBannerSlider } from '@/components/home/desktop-banner-slider';
import { ProductCard, type ProductCardData } from '@/components/shared/product-card';
import { useCartStore } from '@/stores/cart-store';
import { useQuery } from '@tanstack/react-query';
import {
  getActiveProducts,
  type ProductWithDetails,
} from '@/lib/services/product-client';
import { Loader2 } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    tag: 'Flash Sale',
    title: 'Diskon hingga 50%',
    desc: 'Koleksi binder premium untuk produktivitasmu',
    cta: 'Belanja sekarang',
    link: '/products?sale=true',
    bg: 'linear-gradient(135deg, #1A1714 0%, #3D2F1E 100%)',
    accent: '#7EC8E3',
    image: '/images/products/binder-denim-pink-blue-01.jpg',
  },
  {
    id: 2,
    tag: 'New Arrivals',
    title: 'Koleksi Binder Aesthetic',
    desc: 'Warna-warna pastel baru sudah tersedia',
    cta: 'Lihat koleksi',
    link: '/products?category=aksesoris',
    bg: 'linear-gradient(135deg, #2D1E1A 0%, #4A2B24 100%)',
    accent: '#F2A7C3',
    image: '/images/products/binder-rose-blossom-01.jpg',
  },
  {
    id: 3,
    tag: 'Bundling Hemat',
    title: 'Paket Pelajar Ceria',
    desc: 'Dapatkan 3 binder + 1 pack kertas dengan harga spesial',
    cta: 'Cek Promo',
    link: '/products',
    bg: 'linear-gradient(135deg, #1E2D24 0%, #244A35 100%)',
    accent: '#7EC8E3',
    image: '/images/products/binder-bundling-01.jpg',
  },
  {
    id: 4,
    tag: 'Custom Order',
    title: 'Desain Binder Sendiri',
    desc: 'Punya desain unik? Kami buatkan binder impianmu!',
    cta: 'Mulai Custom',
    link: '/custom',
    bg: 'linear-gradient(135deg, #1A1714 0%, #2D1E3D 100%)',
    accent: '#7EC8E3',
    image: '/images/products/binder-custom-nama-01.jpg',
  },
];

const FEATURES = [
  { label: 'Same day', sub: 'Order Before 14:00', bg: '#F2A7C3', text: '#FFFFFF' },
  { label: 'Artisan binder', sub: 'Hand crafting', bg: '#7EC8E3', text: '#FFFFFF' },
  { label: 'Poin loyalty', sub: 'Setiap pembelian', bg: '#E07B39', text: '#FFFFFF' },
];

interface BannerCardProps {
  banner: (typeof BANNERS)[0];
  index: number;
  scrollXProgress: MotionValue<number>;
  count: number;
}

function BannerCard({ banner, index, scrollXProgress, count }: BannerCardProps) {
  const step = count > 1 ? 1 / (count - 1) : 1;
  const centerPoint = index * step;

  const x = useTransform(scrollXProgress, (v) => {
    const dist = (v - centerPoint) / step;
    return dist <= -1 ? 135 : dist >= 1 ? -135 : -dist * 135;
  });

  const scale = useTransform(scrollXProgress, (v) => {
    const dist = Math.abs(v - centerPoint) / step;
    return dist >= 1 ? 0.88 : 1 - dist * 0.12;
  });

  const rotateY = useTransform(scrollXProgress, (v) => {
    const dist = (v - centerPoint) / step;
    return dist <= -1 ? 25 : dist >= 1 ? -25 : -dist * 25;
  });

  const opacity = useTransform(scrollXProgress, (v) => {
    const dist = Math.abs(v - centerPoint) / step;
    return dist >= 1 ? 0.98 : 1 - dist * 0.02;
  });

  const zIndex = useMotionValue(Math.round(100 - index * step * 10));

  useMotionValueEvent(scrollXProgress, 'change', (latest) => {
    const distance = Math.abs(latest - centerPoint);
    const unCappedDistance = distance / step;
    zIndex.set(Math.round(100 - unCappedDistance * 10));
  });

  return (
    <m.div
      className="banner-card"
      style={{
        position: 'absolute',
        width: '100%',
        height: 'clamp(180px, 48vw, 210px)',
        borderRadius: 24,
        background: banner.bg,
        padding: '28px 24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        scale,
        x,
        rotateY,
        opacity,
        zIndex,
        boxShadow: '0 15px 45px rgba(0,0,0,0.25)',
      }}
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={banner.image}
          alt=""
          fill
          priority={index === 0}
          className="object-cover"
          sizes="(max-width: 430px) 100vw, 430px"
        />
      </div>
      {/* Light gradient overlay for text readability */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.1) 75%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -12,
          top: -12,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: banner.accent,
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 20,
          bottom: -20,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: banner.accent,
          opacity: 0.08,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: '0.2px',
            marginBottom: 10,
          }}
        >
          {banner.tag}
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 24,
            color: 'white',
            lineHeight: 1.15,
            letterSpacing: '-0.5px',
            marginBottom: 6,
          }}
        >
          {banner.title}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
            marginBottom: 16,
          }}
        >
          {banner.desc}
        </p>
        <div
          style={{
            pointerEvents: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '9px 18px',
            borderRadius: 9999,
            background: 'white',
            color: '#1A1714',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          {banner.cta}
        </div>
      </div>
    </m.div>
  );
}

export default function HomePage() {
  const addItem = useCartStore((state) => state.addItem);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize scroll listener — useScroll is client-side only
  const { scrollXProgress } = useScroll({
    container: scrollRef,
  });

  // Fetch real products
  const { data: products = [], isLoading } = useQuery<ProductWithDetails[]>({
    queryKey: ['products'],
    queryFn: getActiveProducts,
  });


  const bestOffers = useMemo(() => products.filter((p) => (p.promoPrice ?? 0) > 0), [products]);

  const handleAddToCart = (product: ProductWithDetails) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.promoPrice ?? product.price,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        position: 'relative',
      }}
    >
      {/* Background fill for Header area to prevent color jump */}
      <div
        className="lg:hidden"
        style={{
          position: 'absolute',
          top: -200,
          left: 0,
          right: 0,
          height: 200,
          background: '#F5F3F0',
          zIndex: 0,
        }}
      />

      {/* Top Section (Grey Background) - Banner & Same Day */}
      <div
        style={{ paddingBottom: 48 }}
        className="bg-[#F5F3F0] lg:bg-transparent lg:rounded-3xl lg:mx-6 lg:pb-6"
      >
        {/* Desktop simple slider */}
        <DesktopBannerSlider banners={BANNERS} />

        {/* Hero Carousel — mobile only */}
        <div
          className="banner-container lg:mx-auto lg:max-w-[1100px] lg:mt-8"
          style={{
            position: 'relative',
            marginTop: 40,
            height: 'clamp(210px, 55vw, 240px)',
            width: '100%',
            overflow: 'hidden',
            padding: '0 clamp(16px, 5vw, 20px)',
          }}
        >
          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '1200px',
            }}
          >
            {BANNERS.map((banner, i) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                index={i}
                scrollXProgress={scrollXProgress}
                count={BANNERS.length}
              />
            ))}
          </div>
          <div
            ref={scrollRef}
            style={{
              position: 'absolute',
              inset: '0 16px',
              overflowX: 'scroll',
              overflowY: 'hidden',
              display: 'flex',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              zIndex: 200,
              opacity: 0,
            }}
          >
            {BANNERS.map((_, i) => (
              <div
                key={i}
                style={{
                  minWidth: '100%',
                  height: '100%',
                  scrollSnapAlign: 'center',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Feature strip with Animated Border */}
        <div
          className="relative mx-[clamp(16px,5vw,20px)] mt-4 lg:mx-auto lg:mt-16 lg:max-w-[1052px] overflow-hidden"
          style={{
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {/* Moving Glow Border Animation */}
          <m.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-[-150%] z-0"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #FFFFFF 50%, transparent 60%, transparent 100%)',
              opacity: 0.8,
            }}
          />

          {/* Inner Content Container */}
          <div
            className="relative z-10 m-[1px] grid grid-cols-3 overflow-hidden"
            style={{
              borderRadius: 15,
              background: '#FDFCFB',
            }}
          >
            {FEATURES.map((feat) => (
              <div
                key={feat.label}
                style={{
                  padding: '14px 12px',
                  textAlign: 'center',
                  background: feat.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  className="text-[12px] lg:text-[14px]"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    color: feat.text,
                    marginBottom: 2,
                  }}
                >
                  {feat.label}
                </div>
                <div
                  className="text-[10px] lg:text-[12px]"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    color: feat.text,
                    opacity: 0.85,
                  }}
                >
                  {feat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area (White Background with Rounded Top) */}
      <div
        className="desktop-content lg:mx-auto lg:max-w-[1052px] lg:rounded-none lg:mt-0"
        style={{
          background: '#FDFCFB',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingTop: 8,
          paddingBottom: 24,
          marginTop: -32,
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
        }}
      >

        <div style={{ marginBottom: 8, marginTop: 12 }} className="lg:mt-16">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px clamp(16px, 5vw, 20px) 12px',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#1A1714',
                }}
              >
                Penawaran Terbaik
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6460' }}>
                  Berakhir dalam
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#7EC8E3',
                  }}
                >
                  02:14:38
                </span>
              </div>
            </div>
            <Link
              href={'/products?sale=true'}
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 13,
                color: '#7EC8E3',
                textDecoration: 'none',
              }}
            >
              Lihat semua
            </Link>
          </div>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <BestOffersGrid products={bestOffers.slice(0, 2) as unknown as ProductCardData[]} />
          )}
        </div>

        {/* Soft Organic Promo Banners (Scrollable) */}
        <div className="mt-8 mb-4">
          <div
            className="flex gap-4 overflow-x-auto px-[clamp(16px,5vw,20px)] pb-4"
            style={
              {
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
              } as CSSProperties
            }
          >
            {[
              {
                title: 'Desain Bebas',
                sub: 'Custom Binder Sesukamu',
                bg: 'linear-gradient(135deg, #F2A7C3 0%, #F8C3D6 100%)',
                icon: '✨',
                link: '/custom',
              },
              {
                title: 'Edisi Terbatas',
                sub: 'Koleksi Pastel 2024',
                bg: 'linear-gradient(135deg, #7EC8E3 0%, #A5DBF0 100%)',
                icon: '🌸',
                link: '/products',
              },
              {
                title: 'Member Spesial',
                sub: 'Diskon Extra 10%',
                bg: 'linear-gradient(135deg, #1A1714 0%, #444 100%)',
                icon: '👑',
                link: '/account',
              },
            ].map((promo, i) => (
              <Link
                key={i}
                href={promo.link as Route}
                className="relative flex h-[140px] w-[280px] flex-shrink-0 flex-col justify-center p-6 text-white no-underline transition-transform active:scale-95"
                style={{
                  background: promo.bg,
                  borderRadius: '40px 12px 40px 12px', // Back to Asymmetric Petal
                  scrollSnapAlign: 'center',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                }}
              >
                <div className="absolute right-4 top-4 text-3xl">{promo.icon}</div>
                <span className="font-sans text-[11px] font-bold uppercase tracking-wider opacity-90">
                  {promo.sub}
                </span>
                <h3 className="mt-1 font-heading text-[20px] font-extrabold leading-tight">
                  {promo.title}
                </h3>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-[10px]">→</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase">Cek Detail</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px clamp(16px, 5vw, 20px) 12px',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 16,
                color: '#1A1714',
              }}
            >
              Semua Produk
            </span>
            <Link
              href={'/products'}
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 13,
                color: '#7EC8E3',
                textDecoration: 'none',
              }}
            >
              Lainnya
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 px-[clamp(16px,5vw,20px)] lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-stone-2" />
              ))
            ) : products.length > 0 ? (
              products.map((p, index) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleAddToCart as unknown as (product: ProductCardData) => void}
                  priority={index < 4}
                />
              ))
            ) : (
              <div className="col-span-2 py-10 text-center text-sm font-medium text-ink-4">
                Belum ada produk tersedia.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
