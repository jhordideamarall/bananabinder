import type { Route } from 'next';
import Link from 'next/link';
import Image from 'next/image';

const SHOP_LINKS: { href: Route; label: string }[] = [
  { href: '/products' as Route, label: 'Semua Produk' },
  { href: '/categories' as Route, label: 'Kategori' },
  { href: '/search' as Route, label: 'Pencarian' },
];

const ACCOUNT_LINKS: { href: Route; label: string }[] = [
  { href: '/account' as Route, label: 'Akun Saya' },
  { href: '/account/orders' as Route, label: 'Pesanan' },
  { href: '/account/loyalty' as Route, label: 'Loyalty Points' },
];

const PAYMENT_METHODS = ['QRIS', 'GoPay', 'OVO', 'Dana', 'BCA VA'];

export function Footer() {
  return (
    <footer
      style={{
        background: '#1A1714',
        padding: '32px 20px max(24px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
        }}
      >
        <div className="relative w-7 h-7 overflow-hidden rounded-md">
          <Image src="/logo.png" alt="Bananasbindery Logo" fill className="object-contain" />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 18,
            color: 'white',
            letterSpacing: '-0.3px',
          }}
        >
          Bananasbindery
        </span>
      </div>

      {/* Links grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 28,
        }}
      >
        {/* Shop links */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 12,
              color: '#A09890',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              marginBottom: 12,
            }}
          >
            Belanja
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SHOP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: '#D8D4CE',
                  textDecoration: 'none',
                  lineHeight: 1.5,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Account links */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 12,
              color: '#A09890',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              marginBottom: 12,
            }}
          >
            Akun
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACCOUNT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: '#D8D4CE',
                  textDecoration: 'none',
                  lineHeight: 1.5,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Location */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 12,
            color: '#A09890',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
            marginBottom: 8,
          }}
        >
          Lokasi Toko
        </div>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: '#D8D4CE',
            lineHeight: 1.6,
          }}
        >
          Taman Yasmin Sektor V Tahap II, Jl. Cijahe 1 No.60,
          <br />
          Kel. Cilendek Timur, Kec. Bogor Barat, Kota Bogor 16112, Jawa Barat
          <br />
          <a href="tel:089519541180" style={{ color: '#F5A46A', textDecoration: 'none' }}>
            0895-1954-1180
          </a>
          <br />
          Buka setiap hari 09:00 - 21:00 WIB
        </p>
      </div>

      {/* Payment methods */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 12,
            color: '#A09890',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
            marginBottom: 10,
          }}
        >
          Metode Pembayaran
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.08)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 11,
                color: '#A09890',
              }}
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.08)',
          marginBottom: 16,
        }}
      />

      {/* Copyright */}
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: '#6B6460',
          textAlign: 'center',
        }}
      >
        © {new Date().getFullYear()} Bananasbindery. All rights reserved.
      </p>
    </footer>
  );
}
