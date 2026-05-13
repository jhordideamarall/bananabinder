'use client';

import { useEffect } from 'react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
      <h1 className="t-heading" style={{ marginBottom: 8 }}>
        Gagal Memuat Halaman
      </h1>
      <p className="t-body" style={{ color: 'var(--color-ink-3)', marginBottom: 20 }}>
        {error.message}
      </p>
      <button
        onClick={reset}
        style={{
          background: 'var(--color-orange)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 9999,
          border: 'none',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Coba Lagi
      </button>
    </main>
  );
}
