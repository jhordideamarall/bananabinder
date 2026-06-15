import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Syarat dan ketentuan penggunaan layanan Bananasbindery.',
};

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FDFCFB] px-6 py-10 text-ink">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <Link href={'/' as Route} className="text-sm font-bold text-primary">
          Kembali
        </Link>

        <section className="space-y-4">
          <h1 className="font-heading text-3xl font-extrabold">Syarat & Ketentuan</h1>
          <p className="text-sm leading-6 text-ink-3">
            Dengan menggunakan Bananasbindery, pelanggan menyetujui proses pemesanan, pembayaran,
            pengiriman, dan komunikasi layanan yang diperlukan untuk menyelesaikan transaksi.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Pesanan dan Pembayaran</h2>
          <p className="text-sm leading-6 text-ink-3">
            Pesanan diproses setelah pembayaran berhasil dikonfirmasi oleh penyedia pembayaran.
            Harga, stok, ongkir, dan promo dapat berubah mengikuti ketersediaan aktual.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Pengiriman</h2>
          <p className="text-sm leading-6 text-ink-3">
            Estimasi pengiriman mengikuti layanan kurir yang dipilih. Pelanggan bertanggung jawab
            memastikan alamat dan nomor HP sudah benar sebelum checkout.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold">Bantuan</h2>
          <p className="text-sm leading-6 text-ink-3">
            Jika ada kendala pada pesanan, hubungi admin Bananasbindery melalui kanal resmi yang
            tersedia di website.
          </p>
        </section>
      </div>
    </main>
  );
}
