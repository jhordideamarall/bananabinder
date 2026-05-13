'use client';

import { useEffect } from 'react';

export default function ShopError({
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
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
        background: '#F5F3F0',
      }}
    >
      <div style={{ fontSize: 40 }}>🐾</div>
      <p className="t-heading" style={{ textAlign: 'center' }}>
        Oops, ada masalah
      </p>
      <p className="t-body" style={{ textAlign: 'center', color: 'var(--color-ink-3)' }}>
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
    </div>
  );
}
