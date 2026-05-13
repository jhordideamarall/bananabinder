'use client';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={active ? '#E07B39' : 'none'}
    stroke={active ? '#E07B39' : '#A09890'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const ShopIcon = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? '#E07B39' : '#A09890'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const BookingIcon = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? '#E07B39' : '#A09890'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? '#E07B39' : '#A09890'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface Tab {
  href: string;
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
    href: '/products',
    label: 'Produk',
    icon: ShopIcon,
    match: (p) =>
      p.startsWith('/products') || p.startsWith('/categories') || p.startsWith('/search'),
  },
  {
    href: '/booking',
    label: 'Booking',
    icon: BookingIcon,
    match: (p) => p.startsWith('/booking'),
  },
  {
    href: '/account',
    label: 'Akun',
    icon: UserIcon,
    match: (p) => p.startsWith('/account'),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: 'flex',
        background: '#FDFCFB',
        borderTop: '1px solid #EAE7E2',
        padding: `8px 0 max(12px, env(safe-area-inset-bottom))`,
        flexShrink: 0,
      }}
      aria-label="Navigasi utama"
    >
      {tabs.map(({ href, label, icon: IconComp, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              padding: '4px 0',
            }}
          >
            <IconComp active={active} />
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: '0.3px',
                color: active ? '#E07B39' : '#A09890',
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
