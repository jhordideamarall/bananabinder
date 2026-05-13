import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg">Halaman tidak ditemukan.</p>
      <Link href="/" className="mt-6 underline">
        Kembali ke beranda
      </Link>
    </main>
  );
}
