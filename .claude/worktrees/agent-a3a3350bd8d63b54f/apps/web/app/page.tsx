import type { CSSProperties } from 'react';
import Link from 'next/link';

const CATEGORIES = ['Makanan', 'Aksesoris', 'Obat & Vitamin', 'Kandang', 'Grooming', 'Frozen'];

const ScissorsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#E07B39"
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

const ChevronRight = () => (
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
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const PLACEHOLDER_PRODUCTS = [
  { label: 'Dog Food', color: '#D4C4A0', price: 385000, original: 450000, disc: 14 },
  { label: 'Cat Food', color: '#C4B8D4', price: 72000, original: 89000, disc: 19 },
  { label: 'Vitamin', color: '#B8D4B8', price: 145000, original: null, disc: null },
  { label: 'Collar', color: '#D4B8B8', price: 98000, original: 125000, disc: 22 },
] as const;

export default function HomePage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#F5F3F0',
        minHeight: '100%',
        paddingBottom: 20,
      }}
    >
      {/* Hero Banner */}
      <div
        style={{
          margin: '12px 16px 0',
          borderRadius: 24,
          background: 'linear-gradient(135deg, #1A1714 0%, #3D2F1E 100%)',
          padding: '28px 24px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 148,
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            right: -12,
            top: -12,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: '#E07B39',
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
            background: '#E07B39',
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
              background: 'rgba(224,123,57,0.2)',
              color: '#F5A46A',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.2px',
              marginBottom: 10,
            }}
          >
            Flash Sale · Hari Ini
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 26,
              color: 'white',
              lineHeight: 1.15,
              letterSpacing: '-0.5px',
              marginBottom: 6,
            }}
          >
            Diskon
            <br />
            hingga 50%
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginBottom: 16,
            }}
          >
            Makanan &amp; aksesoris premium
          </p>
          <Link
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '9px 18px',
              borderRadius: 9999,
              background: '#E07B39',
              color: 'white',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              border: 'none',
            }}
          >
            Belanja sekarang
          </Link>
        </div>
      </div>

      {/* Feature strip */}
      <div
        style={{
          margin: '12px 16px 0',
          background: '#FDFCFB',
          borderRadius: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
        }}
      >
        {(['Pengiriman sama hari', 'Produk original', 'Poin loyalty'] as const).map(
          (feat, i) => (
            <>
              <div
                key={feat}
                style={{ padding: '14px 12px', textAlign: 'center' }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#1A1714',
                    marginBottom: 2,
                  }}
                >
                  {feat}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    color: '#6B6460',
                  }}
                >
                  {i === 0
                    ? 'Order sebelum 14:00'
                    : i === 1
                      ? 'Bergaransi resmi'
                      : 'Setiap pembelian'}
                </div>
              </div>
              {i < 2 && (
                <div
                  key={`divider-${i}`}
                  style={{ background: '#EAE7E2', width: 1 }}
                />
              )}
            </>
          ),
        )}
      </div>

      {/* Kategori */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 12px',
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
            Kategori
          </span>
          <Link
            href="/products"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 13,
              color: '#E07B39',
              textDecoration: 'none',
            }}
          >
            Lihat semua
          </Link>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 4,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          } as CSSProperties}
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${cat.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: 9999,
                border: '1.5px solid #D8D4CE',
                background: '#FDFCFB',
                color: '#1A1714',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Grooming & Pet Hotel Banner */}
      <div
        style={{
          margin: '16px 16px 0',
          background: '#FDFCFB',
          borderRadius: 16,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#FDF0E7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ScissorsIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 14,
              color: '#1A1714',
              marginBottom: 2,
            }}
          >
            Grooming &amp; Pet Hotel
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: '#6B6460',
            }}
          >
            Booking jadwal sekarang, slot terbatas
          </div>
        </div>
        <Link
          href="/booking"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 14px',
            borderRadius: 9999,
            border: '1.5px solid #D8D4CE',
            background: '#FDFCFB',
            color: '#1A1714',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          Booking <ChevronRight />
        </Link>
      </div>

      {/* Penawaran Terbaik */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 12px',
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
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: '#6B6460',
                }}
              >
                Berakhir dalam
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#E07B39',
                }}
              >
                02:14:38
              </span>
            </div>
          </div>
          <Link
            href="/products?sale=true"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 13,
              color: '#E07B39',
              textDecoration: 'none',
            }}
          >
            Semua
          </Link>
        </div>

        {/* Product grid placeholder — will be replaced with real data in Phase 3 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            padding: '0 16px',
          }}
        >
          {PLACEHOLDER_PRODUCTS.map((p, i) => (
            <div
              key={i}
              style={{
                background: '#FDFCFB',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  padding: 16,
                  background: p.color + '18',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  aspectRatio: '1/1',
                }}
              >
                <div
                  style={{
                    width: '70%',
                    height: '70%',
                    borderRadius: 10,
                    background: p.color + '60',
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#6B6460',
                  }}
                >
                  {p.label}
                </div>
                {p.disc !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: '#FDECEA',
                      color: '#C0392B',
                      padding: '3px 7px',
                      borderRadius: 9999,
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 600,
                      fontSize: 10,
                    }}
                  >
                    -{p.disc}%
                  </div>
                )}
                <button
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: '#E07B39',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(224,123,57,0.4)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              <div style={{ padding: '12px 12px 14px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#1A1714',
                    marginBottom: 4,
                  }}
                >
                  {p.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: 15,
                    color: '#E07B39',
                  }}
                >
                  Rp&nbsp;{p.price.toLocaleString('id-ID')}
                </div>
                {p.original !== null && (
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      color: '#A09890',
                      textDecoration: 'line-through',
                    }}
                  >
                    Rp&nbsp;{p.original.toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
