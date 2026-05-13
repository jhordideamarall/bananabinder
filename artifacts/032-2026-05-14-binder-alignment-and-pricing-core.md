# Session Report — Binder Alignment & Checkout Pricing Core

Tanggal: 2026-05-14 00:16 WIB

## Konteks
User menegaskan artifact lama mungkin tidak relevan, jadi pekerjaan sesi ini tidak bergantung pada status artifact lama. Fokus eksekusi diambil dari kondisi repo aktual, UI yang sudah ada, dan arahan: lanjutkan project dengan baik tanpa mengubah style UI yang sudah bagus.

## Apa yang diubah

### 1. Checkout pricing dipindahkan ke core logic
- File: `packages/core/src/services/pricing.service.ts`
- File: `apps/web/app/checkout/page.tsx`
- Perubahan:
  - Menambahkan `DEFAULT_TAX_RATE` 11%.
  - Menambahkan `calculateAbsorbedTax()` untuk pencatatan PPN internal.
  - Memperluas `calculateCartTotal()` agar mengembalikan `tax` dan tetap menjaga total customer-facing = subtotal setelah diskon + ongkir.
  - Checkout sekarang memakai `calculateCartTotal()` dari `@bananasbindery/core/pricing`, bukan kalkulasi pajak manual di komponen.
- Alasan:
  - Mengikuti mandat monorepo: kalkulasi bisnis/pricing tidak boleh tersebar di `apps/`.
  - Menghindari drift antara checkout UI dan logic order/payment.
  - Tetap mempertahankan UX harga lama: PPN dicatat sebagai absorbed/internal, tidak menambah angka total yang dilihat user.

### 2. Regression test pricing core
- File: `packages/core/src/services/pricing.service.test.ts`
- Perubahan:
  - Test promo price.
  - Test PPN absorbed 11%.
  - Test voucher/loyalty discount sebelum pajak.
  - Test guard agar taxable total tidak negatif.
- Alasan:
  - Pricing adalah logic sensitif; harus ada bukti regresi sebelum dipakai checkout.

### 3. Copywriting legacy petshop dibersihkan dari UI customer-facing
- File: `apps/web/app/(shop)/products/[slug]/_client.tsx`
- File: `apps/web/app/not-found.tsx`
- File: `apps/web/components/shared/search-modal.tsx`
- Perubahan:
  - Dummy review detail produk diganti dari konteks anjing/kucing ke konteks binder/custom order.
  - 404 copy diganti dari pet escape copy ke copy netral binder-commerce.
  - Search placeholder/saran diganti dari makanan/vitamin/grooming ke binder/refill/custom.
  - Fallback image search modal diganti dari image pet ke image notebook/binder-like.
- Alasan:
  - Project sekarang sudah pivot ke Bananasbindery/binder; sisa copy petshop merusak kredibilitas brand.
  - Hanya copy/content dan fallback asset source yang disentuh; struktur layout, spacing, warna, dan style UI tidak diubah.

## Validasi
- `pnpm --filter @bananasbindery/core test` → PASS
- `pnpm --filter @bananasbindery/core type-check` → PASS
- `pnpm --filter web type-check` → PASS
- `pnpm --filter web lint` → PASS
- `pnpm --filter @bananasbindery/store type-check` → PASS
- `git diff --check` → PASS

## Catatan revert cepat
- Revert pricing core: `packages/core/src/services/pricing.service.ts`, `packages/core/src/services/pricing.service.test.ts`, dan import/usage di `apps/web/app/checkout/page.tsx`.
- Revert copy cleanup: `apps/web/app/(shop)/products/[slug]/_client.tsx`, `apps/web/app/not-found.tsx`, `apps/web/components/shared/search-modal.tsx`.

## Next paling aman
Lanjutkan cleanup legacy yang user-facing dulu, lalu masuk ke P0 backend order integrity (`create_order_v1` stock decrement atomic + server recalculation) tanpa menyentuh desain UI.
