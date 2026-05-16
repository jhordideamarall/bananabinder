'use client';
import { m, LayoutGroup, AnimatePresence } from 'framer-motion';
import type { ComponentType } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
  </svg>
);

const ShopIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
  </svg>
);

const CustomIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface Tab {
  href: Route;
  label: string;
  icon: ComponentType<{ active: boolean }>;
  match: (pathname: string) => boolean;
}

const tabs: Tab[] = [
  {
    href: '/',
    label: 'Home',
    icon: HomeIcon,
    match: (p) => p === '/',
  },
  {
    href: '/products' as Route,
    label: 'Produk',
    icon: ShopIcon,
    match: (p) =>
      p.startsWith('/products') || p.startsWith('/categories') || p.startsWith('/search'),
  },
  {
    href: '/custom' as Route,
    label: 'Custom',
    icon: CustomIcon,
    match: (p) => p.startsWith('/custom'),
  },
  {
    href: '/account' as Route,
    label: 'Akun',
    icon: UserIcon,
    match: (p) => p.startsWith('/account'),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-[24px] left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 px-6 pointer-events-none">
      <LayoutGroup id="bottom-nav">
        <m.nav
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto relative flex h-[68px] w-full items-center justify-around overflow-hidden rounded-[32px] border border-white/40 bg-white/30 px-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
          style={{
            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          }}
        >
          {tabs.map(({ href, label, icon: IconComp, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex h-full flex-1 flex-col items-center justify-center no-underline"
              >
                <m.div
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center gap-1 transition-colors duration-300"
                  style={{ color: active ? '#FFD54C' : '#A09890' }}
                >
                  <IconComp active={active} />
                  <span className="font-heading text-[10px] font-bold tracking-tight">{label}</span>

                  {/* Liquid Indicator */}
                  <AnimatePresence>
                    {active && (
                      <m.div
                        layoutId="active-pill"
                        className="absolute -inset-x-5 -inset-y-3 z-[-1] rounded-[24px] border border-white/60 bg-[#FFD54C]/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </m.div>
              </Link>
            );
          })}
        </m.nav>
      </LayoutGroup>
    </div>
  );
}
