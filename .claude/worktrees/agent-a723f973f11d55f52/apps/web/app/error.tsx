'use client';

import { useEffect } from 'react';

export default function ErrorPage({
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
      <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
      <p className="mt-4 text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-6 rounded-md bg-primary px-4 py-2 text-white">
        Coba Lagi
      </button>
    </main>
  );
}
