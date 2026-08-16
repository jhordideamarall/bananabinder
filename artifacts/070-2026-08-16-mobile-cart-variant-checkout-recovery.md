# 070 — Mobile Cart Variant Checkout Recovery

Tanggal: 2026-08-16
Status: production live dan terverifikasi

## Masalah

- Keranjang disimpan di `localStorage`, sehingga isi keranjang HP dan PC dapat berbeda.
- Produk SECRET BLOOM memiliki stok produk utama `0`, tetapi satu varian aktif memiliki stok `10`.
- Keranjang lama di HP menyimpan `variant_id = null`. Pilihan kurir berhasil, tetapi `create_order_v1` kemudian menolak order karena memeriksa stok produk utama.
- Pada halaman detail mobile, kegagalan stok hanya ditampilkan di bagian pilihan varian yang berada jauh di bawah tombol fixed, sehingga tombol terlihat seperti tidak merespons.
- RPC memakai `product_variants.price` untuk varian, sedangkan storefront sudah menampilkan `product_variants.promo_price`. Ini berpotensi membuat total UI dan server berbeda.

## Perubahan

### `apps/web/app/(shop)/products/[slug]/_client.tsx`

- Jika stok produk utama habis dan tepat satu varian masih tersedia, varian tersebut dipilih otomatis.
- Opsi `Produk utama` tidak ditawarkan saat stok produk utama habis.
- Validasi harga/stok tetap dipertahankan dan sekarang juga menampilkan toast yang terlihat dari bottom action bar.
- Tidak ada perubahan layout, warna, atau design system.

### `supabase/migrations/20260816100108_recover_legacy_base_cart_single_variant.sql`

- Memulihkan item keranjang lama tanpa `variant_id` hanya jika tepat satu varian aktif mampu memenuhi quantity.
- Tetap menolak secara eksplisit bila tersedia lebih dari satu varian agar sistem tidak memilih barang yang ambigu.
- Reservasi stok produk utama memakai atomic conditional update untuk mencegah overselling dan lock-order inversion.
- Harga varian pada order memakai promo aktif yang sama dengan storefront.
- Hak eksekusi RPC tetap dibatasi ke `authenticated` dan `service_role`; `PUBLIC` serta `anon` tetap dicabut.

## Alasan teknis

Perbaikan dilakukan di dua lapisan: halaman produk mencegah cart baru yang ambigu, sedangkan RPC menangani cart lama yang sudah tersimpan di perangkat pelanggan. Database tetap menjadi sumber kebenaran untuk stok dan harga sehingga payload browser tidak dipercaya.

## Verifikasi

- `pnpm type-check` — lulus, 8 package.
- ESLint targeted untuk product detail — lulus.
- `pnpm --filter @bananasbindery/web build` — lulus, 53 static pages.
- Dry-run migration production dalam transaction rollback — anchor dan function replacement valid.
- Full `create_order_v1` production simulation dalam transaction rollback — lulus:
  - cart tanpa varian terselesaikan ke `c53183af-3405-45b2-8d7b-0b6a520ed29c`;
  - harga promo order sama dengan harga promo varian;
  - stok varian ter-reserve;
  - seluruh order dan perubahan stok dibatalkan kembali.
- Migration production tercatat sebagai `20260816100108 / recover_legacy_base_cart_single_variant` pada project `xiumxugolyfsvwnwzenp`.
- Verifikasi pasca-migration: order QA tidak tersisa, role `anon` tidak memiliki EXECUTE, dan role `authenticated` tetap memiliki EXECUTE.
- Chrome mobile emulation `390 × 844`, touch input:
  - sentuhan `Keranjang` mengenai button yang benar;
  - localStorage berisi produk dan varian SECRET BLOOM yang benar;
  - sentuhan `Beli Sekarang` berpindah ke `/checkout` dengan quantity `1`.
- Commit frontend `f74df6c` berhasil dipush ke `origin/main`.
- Vercel production deployment `bananabinder-mw3vg3wik-jhordideamarall-4318s-projects.vercel.app` berstatus `Ready` dan memiliki alias `https://bananasbindery.com`.
- Touch test ulang pada domain production menyimpan varian `Strawberry Cheesecake / Lined / A5` dengan `variantId` yang benar.

## Revert

1. Revert perubahan product detail dan migration ini.
2. Restore definisi `create_order_v1` dari sebelum migration `20260816100108` bila migration sudah diterapkan.
3. Tidak ada data pelanggan yang dimigrasikan dan tidak ada order QA permanen yang dibuat.
