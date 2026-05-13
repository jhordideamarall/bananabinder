'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const MapPin = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const Bell = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const CartIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

interface HeaderProps {
  cartCount?: number;
}

export function Header({ cartCount = 0 }: HeaderProps) {
  const [badgeKey, setBadgeKey] = useState(0);
  const [prevCount, setPrevCount] = useState(cartCount);

  useEffect(() => {
    if (cartCount !== prevCount && cartCount > prevCount) {
      setBadgeKey((k: number) => k + 1);
    }
    setPrevCount(cartCount);
  }, [cartCount, prevCount]);

  return (
    <div style={{ background: '#FDFCFB', padding: '20px 20px 0', flexShrink: 0 }}>
      {/* Location + Actions row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 2,
            }}
          >
            <span style={{ color: '#A09890', display: 'flex', alignItems: 'center' }}>
              <MapPin />
            </span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#A09890',
                letterSpacing: '0.2px',
              }}
            >
              Jakarta Selatan
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Bell */}
          <button
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#F5F3F0',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3D3830',
            }}
            aria-label="Notifikasi"
          >
            <Bell />
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 7,
                height: 7,
                background: '#E07B39',
                borderRadius: '50%',
                border: '1.5px solid #FDFCFB',
              }}
            />
          </button>
          {/* Cart */}
          <Link
            href="/cart"
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#F5F3F0',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3D3830',
              textDecoration: 'none',
            }}
            aria-label={`Keranjang${cartCount > 0 ? `, ${cartCount} item` : ''}`}
          >
            <CartIcon />
            {cartCount > 0 && (
              <div
                key={badgeKey}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 17,
                  height: 17,
                  background: '#E07B39',
                  borderRadius: '50%',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  padding: '0 3px',
                  border: '2px solid #FDFCFB',
                  animation: 'cartBadgePop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {cartCount}
              </div>
            )}
          </Link>
        </div>
      </div>
      {/* Search bar */}
      <Link
        href="/search"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: '#F5F3F0',
          borderRadius: 9999,
          marginBottom: 20,
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: '#A09890', display: 'flex', alignItems: 'center' }}>
          <SearchIcon />
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: '#A09890',
          }}
        >
          Cari produk untuk peliharaanmu...
        </span>
      </Link>
    </div>
  );
}
