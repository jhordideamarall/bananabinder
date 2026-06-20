# 065 — Manual Transfer Payment With Multi-Rekening

Tanggal: 2026-06-20

## Apa Yang Diubah

- Menambahkan flow payment manual untuk checkout baru: QR/rekening, ringkasan final, alamat, kurir Biteship, upload bukti transfer.
- Menambahkan admin settings untuk mengelola QR statis dan lebih dari satu rekening aktif/nonaktif.
- Menambahkan tabel `payment_proofs`, bucket storage QR/proof, RLS, dan RPC expiry order manual.
- Menambahkan review bukti transfer di admin order detail dengan approve, reject, dan expire stock.
- Memindahkan pembuatan fulfillment Biteship dari webhook Xendit ke helper server idempotent yang bisa dipanggil juga dari approval manual.
- Mengubah halaman order customer agar pending manual menampilkan status verifikasi dan mendukung re-upload proof saat ditolak.
- Mempertahankan route Xendit lama untuk legacy order, tetapi checkout normal baru tidak membuat invoice Xendit.
- Menambahkan QR test statis lokal untuk E2E/screenshot tanpa dependency eksternal.

## Di Mana

- `supabase/migrations/20260619182202_manual_transfer_payment_flow.sql`
- `packages/types/src/supabase.ts`
- `packages/api-client/src/manual-payment.ts`
- `packages/api-client/src/biteship.ts`
- `packages/api-client/package.json`
- `apps/web/app/checkout/page.tsx`
- `apps/web/app/api/payment/proof/route.ts`
- `apps/web/app/api/payment/webhook/route.ts`
- `apps/web/lib/server/biteship-fulfillment.ts`
- `apps/web/app/admin/settings/page.tsx`
- `apps/web/components/admin/settings/ManualPaymentSettingsForm.tsx`
- `apps/web/app/admin/actions.ts`
- `apps/web/app/admin/action-feedback.ts`
- `apps/web/lib/admin-data.ts`
- `apps/web/app/admin/orders/[id]/page.tsx`
- `apps/web/components/admin/orders/ManualPaymentReview.tsx`
- `apps/web/app/(shop)/account/orders/page.tsx`
- `apps/web/app/(shop)/account/orders/[id]/page.tsx`
- `apps/web/public/images/payment/manual-transfer-qr.svg`
- `PRD.md`
- `ARCHITECTURE.md`

## Mengapa

- Client meminta checkout disederhanakan: customer tidak diarahkan ke payment gateway, cukup transfer ke QR/rekening yang dikelola owner.
- Owner memiliki beberapa rekening, jadi rekening harus bisa ditambah, dihapus, diaktifkan/nonaktifkan dari admin tanpa deploy ulang.
- Biteship fulfillment harus dibuat hanya setelah pembayaran benar-benar disetujui admin, bukan saat order pending.
- Proof transfer harus tersimpan di private storage dengan akses owner/admin/customer terkait saja.
- Expiry manual order dibutuhkan supaya stock reservation dan kuota promo tidak bocor saat customer batal bayar.

## Catatan Revert

- Revert migration manual payment jika schema belum dipakai produksi, atau buat migration balik untuk drop `payment_proofs`, bucket storage, kolom `manual_payment_*`, dan RPC `expire_manual_order_v1`.
- Revert checkout ke flow lama dengan mengembalikan call `/api/payment/create` dan redirect invoice Xendit di `apps/web/app/checkout/page.tsx`.
- Revert admin review/settings dengan melepas `ManualPaymentSettingsForm`, `ManualPaymentReview`, action approve/reject/expire, dan helper `biteship-fulfillment`.
- Jika order manual sudah masuk produksi, jangan drop data proof tanpa export/backup.

## Validasi

- Pass: `pnpm type-check`
- Pass: `pnpm --filter @bananasbindery/web lint`
- Pass: `pnpm --filter @bananasbindery/web build`
- Partial: `pnpm exec prettier --write ...` untuk file TS/JSX/MD; file SQL dilewati karena Prettier repo tidak punya parser SQL.
- Pass: migration diterapkan via Supabase MCP sebagai `20260619190607_manual_transfer_payment_flow`.
- Pass: mobile rendered E2E memakai in-app Codex Browser pada viewport `390x844`.
- Pass: Admin Settings menyimpan QR statis dan 2 rekening aktif; reload tetap merender BCA dan Mandiri.
- Pass: Checkout step 1 alamat dan step 2 Biteship rate tetap berjalan; step 3 menampilkan QR, 2 rekening, total final, courier, alamat, item, dan upload proof.
- Pass: Order pending manual `PS-20260620-B43A2A` menampilkan status customer `Menunggu Verifikasi Pembayaran`.
- Pass: Admin reject proof pertama, customer detail menampilkan state `DITOLAK` dan form `Upload Ulang Bukti`.
- Pass: Admin approve proof kedua via UI; order menjadi `paid`, transaksi `manual_transfer` tercatat 1 row, dan mock Biteship fulfillment tersimpan di `shipping_metadata`.
- Pass: Idempotency approval; approve ulang tidak menambah transaksi manual dan `biteship_order_id` tetap satu.

## Bukti Screenshot E2E Mobile

- `/tmp/bananabinder-e2e/01-admin-settings-mobile.png`
- `/tmp/bananabinder-e2e/02-checkout-payment-mobile.png`
- `/tmp/bananabinder-e2e/03-customer-order-after-proof-mobile.png`
- `/tmp/bananabinder-e2e/04-admin-proof-review-mobile.png`
- `/tmp/bananabinder-e2e/05-post-approval-paid-biteship-mobile.png`

## Catatan E2E

- Browser in-app Codex tidak mengekspos file chooser atau constructor `File` di `evaluate`, sehingga file proof untuk E2E disiapkan lewat service-role storage upload dengan shape/path/metadata yang sama seperti endpoint `/api/payment/proof`.
- UI customer/admin tetap diverifikasi dari data Supabase nyata, dan approval/reject dijalankan dari admin UI.
