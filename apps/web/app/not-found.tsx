import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ background: 'var(--color-stone)' }}
    >
      <div style={{ fontSize: 64 }}>🐾</div>
      <div>
        <p className="t-heading" style={{ marginBottom: 8 }}>
          Halaman tidak ditemukan
        </p>
        <p className="t-body" style={{ color: 'var(--color-ink-3)' }}>
          Sepertinya hewan piaraanmu kabur dari halaman ini.
        </p>
      </div>
      <Link
        href="/"
        style={{
          background: 'var(--color-orange)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 9999,
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
