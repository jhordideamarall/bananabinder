# 036 — Binder Codebase Continuation & Legacy Isolation

Tanggal: 2026-05-14 11:05 WIB
Status: Completed
Scope: melanjutkan recovery project binder tanpa sekadar revert; fokus pada cleanup legacy petshop/booking, admin/build safety, Xendit/Biteship readiness, dan dokumentasi audit.

## Konteks

User menegaskan project ini sekarang adalah platform jualan buku binder/photo product. Project berasal dari copy project lama sehingga masih ada legacy Pawvels/Petshop dan beberapa artifact lama tidak lagi relevan. Arahan utama: lanjutkan langsung sampai rapi, jangan hanya revert.

## Apa yang diubah

### 1. Legacy booking/petshop di public code path diisolasi

File:

- `apps/web/lib/services/booking-client.ts` — dihapus.
- `packages/api-client/src/bookings.ts` — dihapus.
- `packages/core/src/services/booking.service.ts` — dihapus.
- `packages/api-client/package.json` — export `./bookings` dan typesVersions `bookings` dihapus.
- `packages/core/package.json` — export `./booking` dihapus.
- `packages/types/src/domain/booking.ts` — dihapus.
- `packages/types/src/domain/index.ts` — barrel export booking dihapus.
- `packages/types/src/enums.ts` — enum legacy `BookingStatus`, `ServiceType`, `PetType`, dan notification type `Booking` dihapus dari public domain enums.
- `apps/web/public/icon-pawvels.png` — dihapus.

Alasan:

- Active customer app tidak punya route booking/pet profile, jadi public client/service booking adalah legacy dari project lama.
- Mengurangi risiko agent/developer berikutnya mengira grooming/pet hotel masih bagian scope aktif binder.
- Generated Supabase schema masih menyimpan enum/table lama karena live DB belum dimigrasikan penuh, tetapi public app/package API sudah tidak expose flow tersebut.

### 2. Payment create Xendit diperkuat

File:

- `apps/web/app/api/payment/create/route.ts`

Perubahan:

- Menambahkan typed request body parser tanpa `any`.
- Menambahkan typed `XenditInvoiceResponse` dan `XenditErrorResponse`.
- Guard runtime jika `XENDIT_SECRET_KEY` belum tersedia, return 503, bukan lanjut call API dengan credential kosong.
- Guard Supabase admin env kosong, return 503.
- Guard ownership order: user hanya bisa create invoice untuk order miliknya.
- Guard order sudah paid agar invoice tidak dibuat ulang.
- Reuse existing invoice URL jika order sudah punya `payment_id` dan `payment_metadata.invoice_url`.
- Menulis row awal ke `transactions` saat invoice Xendit berhasil dibuat.
- Menghapus console log payload sensitif/verbose dari flow normal.

Alasan:

- Payment adalah production-sensitive path; tidak boleh percaya request tanpa ownership check.
- Env Xendit harus fail-fast runtime agar deployment preview/build tetap aman tapi runtime jelas jika belum dikonfigurasi.
- Transaction lifecycle perlu punya jejak awal sebelum webhook paid/expired datang.

### 3. Biteship area/rates dibuat lebih aman untuk binder

File:

- `apps/web/app/api/shipping/areas/route.ts`
- `apps/web/app/api/shipping/rates/route.ts`

Perubahan:

- `areas` route sekarang guard `BITESHIP_API_KEY` kosong dengan 503.
- Response Biteship area diberi tipe eksplisit.
- Error handling memakai `Error` instance, bukan asumsi shape bebas.
- Copy fallback item shipping diganti dari konteks hewan menjadi `Produk binder Bananasbindery`.

Alasan:

- Checkout address search tidak boleh mengirim request Biteship dengan bearer kosong.
- Copy hewan di payload/log shipping tidak sesuai brand binder.

### 4. Product/docs alignment ke binder

File:

- `README.md`
- `PRD.md`

Perubahan:

- README dipivot dari petshop/booking ke binder & photo-product commerce.
- Core modules README diganti menjadi binder catalog/variants, shipping/fulfillment, payment/promo, owner intelligence.
- PRD intro, tujuan, positioning, user permissions, product types, variants, shipping, payment, dan customer profile diperbarui ke binder.
- Booking/pet profile section utama diganti menjadi Binder Customization dan Customer Profile.

Alasan:

- Dokumentasi paling atas harus mengikuti goal aktif project agar agent/developer berikutnya tidak menghidupkan lagi flow petshop.

### 5. Admin recovery tetap dipertahankan dari state sebelumnya

File terkait yang tetap berada di working tree:

- `apps/web/lib/admin-data.ts`
- `apps/web/lib/db.ts`
- `apps/web/lib/auth.ts`
- `apps/web/lib/supabase.ts`
- `apps/web/app/admin/*`
- `apps/web/components/admin/ProductForm.tsx`
- `apps/web/app/api/admin/*`

Alasan:

- Perubahan ini memperbaiki import legacy `@bananasbindery/db`, field product lama, dan Next.js 15 route typing. Tidak direvert karena diperlukan agar build admin tetap jalan.

## Validasi

Commands:

- `pnpm --filter @bananasbindery/web type-check` — PASS.
- `pnpm --filter @bananasbindery/core type-check` — PASS.
- `pnpm --filter @bananasbindery/api-client type-check` — PASS.
- `pnpm --filter @bananasbindery/types type-check` — PASS.
- `pnpm --filter @bananasbindery/web lint` — PASS.
- `pnpm --filter @bananasbindery/core test` — PASS, 4 tests passed.
- `pnpm --filter @bananasbindery/web build` — PASS.
- `git diff --check` — PASS.

Build note:

- Existing warning remains: Next.js plugin not detected in ESLint config.

## Legacy scan result

Active app/package scan for these terms returned no matches:

- `Pawvels`, `pawvels`, `petshop`, `anjing`, `kucing`, `Makanan Kucing`, `Makanan Anjing`, `Kebutuhan Hewan`, public booking client/core imports.

Remaining known legacy only:

- `packages/types/src/supabase.ts` still has generated Supabase literals for historical DB enum `service_type: 'grooming' | 'hotel'`. This was not edited because generated DB types should be regenerated from schema later, not manually partially mutated.
- Older `artifacts/`, `claudeplan/`, and `AI-visibilites.md` still contain historical petshop planning notes. They were not treated as active app code.

## Revert guide

If rollback is needed:

1. Payment route only: restore `apps/web/app/api/payment/create/route.ts`.
2. Shipping route only: restore `apps/web/app/api/shipping/areas/route.ts` and `apps/web/app/api/shipping/rates/route.ts`.
3. Legacy isolation: restore deleted files `apps/web/lib/services/booking-client.ts`, `packages/api-client/src/bookings.ts`, `packages/core/src/services/booking.service.ts`, `packages/types/src/domain/booking.ts`, and restore package exports.
4. Docs only: restore `README.md` and `PRD.md`.

## Next paling aman

- Regenerate `packages/types/src/supabase.ts` after live DB schema is cleaned or after Supabase CLI access/Docker issue is resolved.
- Optionally migrate/drop historical booking/pets/services DB objects only via explicit rollback/cleanup migration, not by manual dashboard edits.
