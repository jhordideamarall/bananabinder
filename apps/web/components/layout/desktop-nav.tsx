'use client';

import Link from 'next/link';
import type { Route } from 'next';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import {
  m,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  LayoutGroup,
  type Transition,
} from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';
import { CategoryChip } from '@/components/shared/category-chip';
import { useQuery } from '@tanstack/react-query';
import { getActiveCategories, getActiveProducts } from '@/lib/services/product-client';
import Image from 'next/image';
import { Loader2, Search, X, ChevronRight, ShoppingCart, Bell } from 'lucide-react';

// Lazy load — chunk only fetched after first interaction
const NotificationSheet = dynamic(
  () => import('./notification-sheet').then((mod) => ({ default: mod.NotificationSheet })),
  { ssr: false },
);

const FilterIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="2" y1="14" x2="6" y2="14" />
    <line x1="10" y1="8" x2="14" y2="8" />
    <line x1="18" y1="16" x2="22" y2="16" />
  </svg>
);

interface NavLink {
  href: string;
  label: string;
  match: (p: string) => boolean;
}

const links: NavLink[] = [
  { href: '/', label: 'Home', match: (p) => p === '/' },
  {
    href: '/products',
    label: 'Produk',
    match: (p) =>
      p.startsWith('/products') || p.startsWith('/categories') || p.startsWith('/search'),
  },
  { href: '/custom', label: 'Custom', match: (p) => p.startsWith('/custom') },
  { href: '/account', label: 'Akun', match: (p) => p.startsWith('/account') },
];

function formatPrice(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function getSmartFallbackImage(productName: string): string {
  const query = encodeURIComponent(productName.toLowerCase());
  return `https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80&sig=${query}`;
}

export function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalCount());
  const { scrollY } = useScroll();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMounted, setNotifMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (notifOpen) setNotifMounted(true);
  }, [notifOpen]);

  const [badgeKey, setBadgeKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { showFilters, toggleFilters, setShowFilters } = useUIStore();
  const isProductPage = pathname === '/products' || pathname.startsWith('/categories');

  // Shared high-precision transition for closing - perfectly synchronized
  const closeTransition: Transition = { duration: 0.4, ease: [0.32, 0.72, 0, 1] };
  const openSpring: Transition = { type: 'spring', stiffness: 260, damping: 26, mass: 1 };

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getActiveCategories,
    enabled: isProductPage,
  });

  const { data: products = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getActiveProducts,
    enabled: searchOpen,
  });

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products.filter((p) => (p.promoPrice ?? 0) > 0).slice(0, 6);
    return products
      .filter((p) => [p.name, p.slug].filter(Boolean).some((v) => v!.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [searchQuery, products]);

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 50));

  useEffect(() => {
    if (totalItems > 0) setBadgeKey((prev) => prev + 1);
  }, [totalItems]);

  useEffect(() => {
    if (searchOpen) {
      setShowFilters(false);
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [searchOpen, setShowFilters]);

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <LayoutGroup id="desktop-nav-sync">
      {notifMounted && <NotificationSheet isOpen={notifOpen} onClose={() => setNotifOpen(false)} />}

      <AnimatePresence>
        {searchOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSearchClose}
            transition={closeTransition}
            className="fixed inset-0 z-[190] bg-black/25 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <m.div
        layout
        animate={{
          maxWidth: isProductPage && !searchOpen ? 1100 : 980,
          scale: scrolled && !searchOpen ? 0.94 : 1,
          y: searchOpen ? 12 : scrolled ? -2 : 0,
        }}
        transition={searchOpen ? openSpring : closeTransition}
        className="fixed top-8 left-1/2 z-[200] hidden -translate-x-1/2 flex-col items-center lg:flex w-full origin-top"
      >
        {/* Unified container: nav bar + search results as one pill */}
        <m.div
          layout
          className="relative w-full rounded-[28px] border border-white/40 bg-white/80 shadow-[0_8px_32px_rgba(32,22,14,0.08)] backdrop-blur-xl overflow-hidden"
        >
          {/* Nav row */}
          <m.nav
            layout
            animate={{ height: searchOpen ? 72 : 56 }}
            transition={searchOpen ? openSpring : closeTransition}
            className="relative flex w-full items-center px-2 overflow-hidden"
          >
            <m.div
              layout
              animate={{ opacity: searchOpen ? 0 : 1, width: searchOpen ? 0 : 'auto' }}
              transition={searchOpen ? { duration: 0.2 } : closeTransition}
              className="flex items-center overflow-hidden"
              style={{ flexShrink: 0 }}
            >
              <Link href="/" className="flex items-center gap-2 px-4 py-2 no-underline">
                <div className="relative w-8 h-8 overflow-hidden rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="Bananasbindery Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
              <div className="mx-1 h-6 w-px bg-stone-2/60" />
            </m.div>

            <m.div
              layout
              animate={{ opacity: searchOpen ? 0 : 1, width: searchOpen ? 0 : 'auto' }}
              transition={searchOpen ? { duration: 0.2 } : closeTransition}
              className={`flex items-center justify-center overflow-hidden ${searchOpen ? '' : 'flex-1'}`}
            >
              {links.map(({ href, label, match }) => {
                const active = match(pathname);
                return (
                  <m.div key={href} layout className="relative px-1">
                    <Link
                      href={href as Route}
                      className="group relative flex items-center justify-center rounded-full px-5 py-2.5 font-heading text-[14px] font-bold no-underline transition-all duration-300 whitespace-nowrap"
                      style={{ color: active ? '#7EC8E3' : '#6b6460' }}
                    >
                      {/* Active Indicator: Liquid Glass Style */}
                      {active && (
                        <m.span
                          layoutId="desktop-nav-pill"
                          className="absolute inset-0 z-0 rounded-full border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-xl"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 32,
                            mass: 0.8,
                          }}
                        />
                      )}

                      {/* Hover Indicator: Subtle Glass */}
                      {!active && (
                        <m.span className="absolute inset-0 z-0 rounded-full bg-white/0 opacity-0 transition-all duration-300 group-hover:bg-white/40 group-hover:opacity-100 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] backdrop-blur-sm" />
                      )}

                      <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                        {label}
                      </span>
                    </Link>
                  </m.div>
                );
              })}
            </m.div>

            {/* Unified Search Area */}
            <m.div
              layout
              className={`flex items-center gap-2.5 rounded-full bg-[#f5f3f0]/80 px-4 transition-all duration-300 ${
                searchOpen
                  ? 'flex-1 h-[48px] mx-1'
                  : `ml-auto w-[320px] h-[40px] ${isProductPage ? 'mr-6' : ''}`
              }`}
              transition={searchOpen ? openSpring : closeTransition}
            >
              <Search size={searchOpen ? 20 : 17} className="text-[#a09890]" strokeWidth={2.5} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder={searchOpen ? 'Cari produk binder favoritmu...' : 'Cari...'}
                className={`flex-1 bg-transparent font-heading font-semibold text-ink outline-none placeholder:text-[#a09890] transition-all duration-200 ${
                  searchOpen ? 'text-[16px]' : 'text-[14px]'
                }`}
              />
              {searchOpen && (
                <m.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleSearchClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-2/80 text-ink-3 hover:text-ink"
                  transition={{ duration: 0.2 }}
                >
                  <X size={14} strokeWidth={3} />
                </m.button>
              )}
            </m.div>

            {/* Actions Area — Fixed width and alignment to prevent cart falling out */}
            <m.div
              layout
              animate={{ opacity: searchOpen ? 0 : 1, width: searchOpen ? 0 : 'auto' }}
              transition={searchOpen ? { duration: 0.2 } : closeTransition}
              className="flex items-center gap-2 pr-2 overflow-visible"
              style={{ flexShrink: 0 }}
            >
              <AnimatePresence mode="popLayout">
                {isProductPage && (
                  <m.button
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.85, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    onClick={toggleFilters}
                    className={`flex h-[40px] w-[40px] items-center justify-center rounded-full transition-all duration-300 ${
                      showFilters
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-[#f5f3f0] text-ink-3 hover:bg-stone-2/80'
                    }`}
                  >
                    <m.div
                      animate={{ rotate: showFilters ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <FilterIcon />
                    </m.div>
                  </m.button>
                )}
              </AnimatePresence>

              <div className="mx-0.5 h-5 w-px bg-stone-2/60" />

              <div className="flex items-center gap-0.5">
                <m.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setNotifOpen(true)}
                  className="relative flex h-[38px] w-[38px] min-w-[38px] items-center justify-center text-ink-3 hover:text-ink transition-colors"
                >
                  <Bell size={20} strokeWidth={2.2} />
                  <div className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full border-2 border-white bg-primary" />
                </m.button>

                <Link
                  href={'/cart' as Route}
                  className="relative flex h-[38px] w-[38px] min-w-[38px] items-center justify-center text-ink-3 no-underline transition-colors hover:text-ink overflow-visible"
                >
                  <m.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.8 }}>
                    <ShoppingCart size={20} strokeWidth={2.2} />
                  </m.div>
                  <AnimatePresence>
                    {mounted && totalItems > 0 && (
                      <m.span
                        key={badgeKey}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="badge-bounce absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-primary px-1 font-heading text-[9px] font-bold text-white shadow-sm"
                      >
                        {totalItems}
                      </m.span>
                    )}
                  </AnimatePresence>
                </Link>
              </div>
            </m.div>
          </m.nav>

          {/* Search results — inside the same pill container */}
          <AnimatePresence>
            {searchOpen && (
              <m.div
                key="search-results"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={searchOpen ? openSpring : closeTransition}
                className="overflow-hidden border-t border-stone-2/20"
              >
                <div className="grid grid-cols-2 gap-3 p-5">
                  {isSearchLoading ? (
                    <div className="col-span-2 flex h-32 items-center justify-center">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="col-span-2 py-8 text-center">
                      <p className="font-heading text-[14px] text-[#a09890]">
                        Produk tidak ditemukan...
                      </p>
                    </div>
                  ) : (
                    searchResults.map((product) => (
                      <m.div
                        key={`search-res-${product.id}`}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={handleSearchClose}
                          className="flex items-center gap-3 rounded-[18px] border border-stone-2/20 bg-white/50 p-2 no-underline transition-all hover:bg-white hover:shadow-sm"
                        >
                          <div className="relative h-12 w-12 overflow-hidden rounded-[14px] bg-stone">
                            <Image
                              src={product.imageUrl || getSmartFallbackImage(product.name)}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 font-heading text-[13px] font-bold text-ink">
                              {product.name}
                            </p>
                            <p className="font-heading text-[12px] font-black text-[#E53935]">
                              {formatPrice(product.promoPrice || product.price)}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-stone-3" strokeWidth={2.5} />
                        </Link>
                      </m.div>
                    ))
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Filter chips — inside the same pill container */}
          <AnimatePresence>
            {isProductPage && showFilters && !searchOpen && (
              <m.div
                key="category-filters-container"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={closeTransition}
                className="overflow-hidden border-t border-stone-2/20"
              >
                <m.div
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
                    exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
                  }}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex w-full items-center justify-center gap-2 px-4 py-3"
                >
                  <m.div
                    key="cat-all"
                    variants={{
                      hidden: { y: 10, opacity: 0, scale: 0.92 },
                      show: { y: 0, opacity: 1, scale: 1 },
                      exit: { y: 5, opacity: 0 },
                    }}
                  >
                    <CategoryChip
                      label="Semua"
                      active={!pathname.includes('category')}
                      onClick={() => router.push('/products')}
                    />
                  </m.div>
                  {dbCategories.map((cat: { id: string; name: string; slug: string }) => (
                    <m.div
                      key={`cat-item-${cat.id}`}
                      variants={{
                        hidden: { y: 10, opacity: 0, scale: 0.92 },
                        show: { y: 0, opacity: 1, scale: 1 },
                        exit: { y: 5, opacity: 0 },
                      }}
                    >
                      <CategoryChip
                        label={cat.name}
                        active={pathname.includes(cat.slug)}
                        onClick={() => router.push(`/products?category=${cat.slug}` as Route)}
                      />
                    </m.div>
                  ))}
                </m.div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </m.div>
    </LayoutGroup>
  );
}
