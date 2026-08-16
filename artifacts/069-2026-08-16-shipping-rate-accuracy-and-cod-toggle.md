# 069 — Shipping Rate Accuracy and COD Toggle

**Tanggal:** 2026-08-16

**Status:** Implemented; production smoke test dicatat setelah deployment

**Scope:** Akurasi tarif Biteship, default kurir termurah, penyimpanan alamat customer, dan kontrol COD dari Admin

## Ringkasan

- Alamat, nama penerima, dan nomor HP customer tetap disimpan di tabel `addresses`; order tetap mereferensikan alamat melalui `orders.address_id`. Penghapusan OTP tidak menghapus data pengiriman ini.
- Tarif ongkir tetap memakai harga final dari Biteship tanpa markup aplikasi.
- Berat untuk request tarif sekarang diambil dari `products.weight_grams` atau `product_variants.weight_grams` di Supabase, bukan mempercayai nilai lama dari local storage browser.
- Berat payload Biteship dan berat cache memakai satu perhitungan yang sama dengan fallback 500 gram untuk data katalog yang tidak valid.
- Semua opsi kurir tetap tersedia, tetapi diurutkan dari harga termurah sehingga checkout tidak lagi otomatis memilih respons pertama Biteship (sebelumnya sering Gojek Instant).
- Cache rate baru berlaku 6 jam, turun dari 24 jam, agar perubahan tarif lebih cepat diperbarui tanpa memanggil API di setiap render.
- COD dapat diaktifkan/dinonaktifkan di Admin → Pengaturan Toko. Checkout menyembunyikan COD ketika nonaktif, dan endpoint server juga menolak request COD yang dipaksakan.
- Admin tidak dapat menonaktifkan COD dan payment manual secara bersamaan; minimal satu metode pembayaran harus aktif.

## Temuan Audit Production

- Origin toko sudah mengarah ke Cilendek Timur, Bogor Barat, dengan area ID dan koordinat terisi.
- Seluruh 21 produk aktif dan 23 varian aktif memiliki berat positif; data alamat yang diperiksa memiliki area ID, kode pos, dan koordinat.
- Tidak ditemukan markup ongkir di aplikasi: `price` checkout langsung berasal dari hasil `pricing` Biteship.
- Penyebab utama kesan mahal adalah urutan respons. Contoh quote production untuk berat 1.380 gram mengembalikan Gojek Instant Rp21.000 sebagai item pertama, padahal quote yang sama memiliki Grab Same Day Rp16.000 dan layanan lain Rp17.000–Rp20.000.
- Dokumentasi Biteship menyatakan berat item menggunakan gram, area ID memberi akurasi tinggi untuk kurir reguler, dan koordinat dibutuhkan untuk kurir instant. Referensi: <https://biteship.com/id/docs/api/rates/retrieve>.

## Perubahan File

### Logic ongkir

- `packages/core/src/services/shipping.service.ts`
  - Menambahkan normalisasi berat/kuantitas, perhitungan berat total tunggal, dan sorting harga termurah.
- `packages/core/src/services/shipping.service.test.ts`
  - Menambahkan tes fallback berat, normalisasi kuantitas, konsistensi total berat, sorting, dan immutability.
- `packages/core/src/index.ts`
  - Mengekspor shipping service agar logic reusable oleh Web/Mobile.
- `apps/web/app/api/shipping/rates/route.ts`
  - Memvalidasi payload customer.
  - Membaca berat canonical produk/varian dari Supabase.
  - Menyamakan berat payload dan cache.
  - Mengurutkan hasil API maupun cache dari termurah.
  - Mengurangi TTL cache menjadi 6 jam.
- `apps/web/app/checkout/page.tsx`
  - Query key rate sekarang berubah saat produk, varian, harga, jumlah, atau berat cart berubah.
  - Pilihan pengiriman di-reset secara aman saat alamat/cart berubah, lalu memilih hasil valid termurah.

### Kontrol COD

- `supabase/migrations/20260816170000_add_cod_payment_toggle.sql`
  - Menambah `store_settings.cod_enabled BOOLEAN NOT NULL DEFAULT TRUE`.
- `packages/types/src/supabase.ts`
  - Menambahkan tipe generated-compatible untuk `cod_enabled`.
- `apps/web/components/admin/settings/ManualPaymentSettingsForm.tsx`
  - Menambahkan toggle COD di kartu Metode Pembayaran.
- `apps/web/app/admin/actions.ts`
  - Menyimpan toggle dan memastikan minimal satu payment method aktif.
- `apps/web/app/checkout/page.tsx`
  - Menampilkan COD hanya ketika diaktifkan dan memilih fallback metode yang tersedia.
- `apps/web/app/api/payment/cod/route.ts`
  - Memeriksa `cod_enabled` server-side sebelum mengubah order menjadi COD.

## Supabase Production

- Target diverifikasi: project `bananabinder` (`xiumxugolyfsvwnwzenp`), bukan `MiraChat`.
- Migration `20260816170000_add_cod_payment_toggle` diterapkan dan tercatat di `supabase_migrations.schema_migrations`.
- Nilai awal production: `cod_enabled = true`, sehingga perilaku COD lama tetap aktif sampai admin mematikannya.

## Verifikasi Sebelum Deploy

- `pnpm --filter @bananasbindery/core test` — PASS, 26/26 tests.
- `pnpm --filter @bananasbindery/core type-check` — PASS.
- `pnpm --filter @bananasbindery/web type-check` — PASS.
- ESLint untuk seluruh file yang disentuh — PASS.
- `pnpm --filter @bananasbindery/web build` — PASS, 53 halaman generated.
- `git diff --check` — dijalankan lagi sebelum commit.

## Rollback

1. Revert commit aplikasi untuk mengembalikan pemilihan rate dan tampilan COD lama.
2. `cod_enabled` aman dibiarkan di database karena additive dan default-nya mempertahankan behavior lama.
3. Jika kolom benar-benar harus dihapus, pastikan code lama sudah live terlebih dahulu lalu jalankan `ALTER TABLE public.store_settings DROP COLUMN cod_enabled;`.
