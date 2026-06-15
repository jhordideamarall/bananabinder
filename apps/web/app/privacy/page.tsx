import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi pelanggan Bananasbindery.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FDFCFB] px-6 py-10 text-ink">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <Link href={'/' as Route} className="text-sm font-bold text-primary">
          Kembali
        </Link>

        <section className="space-y-4">
          <h1 className="font-heading text-3xl font-extrabold">Kebijakan Privasi</h1>
          <p className="text-sm leading-6 text-ink-3">
            Bananasbindery menggunakan data pelanggan untuk menjalankan akun, checkout, pembayaran,
            pengiriman, layanan pelanggan, dan keamanan transaksi.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Data yang Digunakan</h2>
          <p className="text-sm leading-6 text-ink-3">
            Data yang dapat diproses meliputi nama, nomor HP, email opsional, alamat pengiriman,
            detail pesanan, status pembayaran, dan informasi pengiriman.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Penyedia Layanan</h2>
          <p className="text-sm leading-6 text-ink-3">
            Untuk menyelesaikan transaksi, data tertentu dapat diproses oleh penyedia pembayaran,
            pengiriman, autentikasi, dan notifikasi yang digunakan Bananasbindery.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Kontak</h2>
          <p className="text-sm leading-6 text-ink-3">
            Untuk pertanyaan privasi atau koreksi data pesanan, hubungi admin Bananasbindery melalui
            kanal resmi yang tersedia di website.
          </p>
        </section>
      </div>
    </main>
  );
}
