# 067 — COD Payment And Biteship Rate Only

Tanggal: 2026-06-20

## Apa Yang Diubah

- Menambahkan metode pembayaran COD di checkout customer.
- COD menjadi pilihan default di step pembayaran; transfer manual tetap tersedia jika QR/rekening aktif dari admin.
- Menambahkan route server `POST /api/payment/cod` untuk menandai pending order sebagai COD secara aman.
- Mengubah halaman order customer agar COD pending tampil sebagai `COD - Bayar Saat Terima` dan tidak memunculkan form upload bukti transfer.
- Mengubah list order customer agar COD pending tidak menampilkan tombol `Upload Bukti`.
- Mengubah admin order detail agar panel review bukti transfer hanya tampil untuk manual transfer, dan COD punya panel ringkas sendiri.
- Menghentikan pemanggilan helper Biteship fulfillment dari approval manual transfer dan webhook Xendit legacy.
- Memperbarui PRD/Architecture: Biteship dipakai untuk rate ongkir checkout, bukan auto-create fulfillment.

## Di Mana

- `apps/web/app/checkout/page.tsx`
- `apps/web/app/api/payment/cod/route.ts`
- `apps/web/app/api/payment/webhook/route.ts`
- `apps/web/app/admin/actions.ts`
- `apps/web/app/admin/action-feedback.ts`
- `apps/web/app/admin/orders/[id]/page.tsx`
- `apps/web/app/(shop)/account/orders/page.tsx`
- `apps/web/app/(shop)/account/orders/[id]/page.tsx`
- `PRD.md`
- `ARCHITECTURE.md`
- `artifacts/ui-optimization-log.md`

## Mengapa

- Client meminta checkout mendukung COD.
- Biteship sekarang hanya dibutuhkan untuk quote ongkir agar customer tetap melihat estimasi biaya pengiriman.
- Fulfillment/resi akan dioperasikan manual oleh admin, jadi pembayaran tidak boleh lagi membuat Biteship order otomatis.
- COD tidak membutuhkan upload bukti transfer; customer hanya perlu melihat total dan instruksi bayar saat paket diterima.

## Catatan Revert

- Hapus route `apps/web/app/api/payment/cod/route.ts`.
- Kembalikan checkout step 3 ke mode transfer manual saja di `apps/web/app/checkout/page.tsx`.
- Kembalikan `approveManualPayment` dan webhook Xendit untuk memanggil `ensureBiteshipFulfillment` jika auto-fulfillment Biteship ingin dipakai lagi.
- Kembalikan label COD di halaman account orders dan admin order detail.
- Revert dokumentasi PRD/Architecture ke manual-transfer + Biteship fulfillment jika strategi lama dipakai kembali.

## Validasi

- Pass: `pnpm type-check`
- Pass: `pnpm --filter @bananasbindery/web lint`
- Pass: `pnpm --filter @bananasbindery/web build`
- Pass: mobile E2E checkout COD memakai in-app browser viewport `390x844`.
- Pass: Supabase MCP verification untuk order COD `680e48db-bbc8-4364-9268-0a47a53d6b52`:
  - `payment_method = cod`
  - `payment_status = unpaid`
  - `shipping_metadata = {}`
  - tidak ada `biteship_order_id`

## Bukti Screenshot Mobile

- Checkout COD: `/tmp/bananabinder-cod-e2e/01-checkout-cod-mobile.png`
- Customer order COD: `/tmp/bananabinder-cod-e2e/02-customer-cod-order-mobile.png`
- Admin order COD: `/tmp/bananabinder-cod-e2e/03-admin-cod-order-mobile.png`
