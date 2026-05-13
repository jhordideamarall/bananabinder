# 035 — Xendit/Biteship Readiness + Live Schema Migration

Tanggal: 2026-05-14
Status: Completed
Scope: checkout/order hardening, Xendit payment lifecycle, Biteship shipping lifecycle, live Supabase schema verification.

## Ringkasan

Project diposisikan untuk readiness presentasi client sekitar 88–90% setelah schema dan lifecycle critical diperkuat. UI customer/shop tidak diubah secara desain; perubahan fokus di backend/API/database.

## Apa yang diubah

### 1. Supabase migration — order RPC hardening

File:
- `supabase/migrations/20260514003000_harden_create_order_v1_inventory_pricing.sql`

Perubahan:
- Hardening RPC `create_order_v1`.
- Harga order dihitung ulang server-side.
- Validasi address harus milik user.
- Stock dikunci dan didecrement atomik untuk mencegah overselling.
- Menyimpan `service_fee`, `total_weight_grams`, courier/service code, HPP, profit, tax.
- Menambah stock movement dan update `sold_count`.

Rasional teknis:
- Checkout tidak boleh percaya subtotal/total dari client.
- Inventory harus aman dari race condition.
- Data profit/tax/weight harus konsisten untuk admin dan laporan.

### 2. Supabase migration — payment/shipping lifecycle

File:
- `supabase/migrations/20260514011500_payment_shipping_lifecycle_hardening.sql`

Perubahan:
- Menambah `orders.shipping_status`.
- Menambah `orders.inventory_released_at`.
- Memastikan `transactions` punya field provider lifecycle: `provider`, `provider_transaction_id`, `external_id`, `paid_at`, `raw_response`.
- Membuat table `webhook_events` untuk idempotency webhook Xendit/Biteship.
- Membuat RPC `release_order_inventory_v1` untuk release stock saat invoice Xendit expired/cancelled.
- Menambah index lookup payment/shipping/order.

Rasional teknis:
- Webhook payment/shipping harus idempotent agar tidak double-processing.
- Invoice expired perlu melepas stock sekali saja.
- Tracking lifecycle Xendit dan Biteship perlu data provider yang eksplisit.

### 3. Payment create API

File:
- `apps/web/app/api/payment/create/route.ts`

Perubahan:
- Menambah typed `XenditInvoiceResponse`.
- Guard `XENDIT_SECRET_KEY` kosong.
- Guard order ownership: user hanya bisa create invoice untuk order sendiri.
- Guard order sudah paid agar invoice tidak dibuat ulang.
- Menulis initial transaction saat Xendit invoice dibuat.

Rasional teknis:
- Mencegah abuse invoice pada order user lain.
- Mencegah duplicate invoice flow.
- Admin/reporting bisa melacak invoice creation sebelum webhook paid.

### 4. Payment webhook API

File:
- `apps/web/app/api/payment/webhook/route.ts`

Perubahan:
- Menambah type tanpa `any` untuk Xendit webhook payload, Biteship response, order item payload, JSON record.
- Validasi callback token Xendit tetap dipakai.
- Menyimpan webhook event ke `webhook_events` dan ignore duplicate event.
- Saat `PAID/SETTLED`: update order paid, catat transaction, lalu create Biteship order jika belum pernah dibuat.
- Saat `EXPIRED`: panggil `release_order_inventory_v1`, update order expired/unpaid, catat transaction.
- Biteship order creation tetap support sandbox mock untuk key test.

Rasional teknis:
- Payment webhook adalah pusat state transition, jadi harus tahan duplicate event.
- Setelah payment paid, shipping fulfillment bisa jalan otomatis.
- Expired invoice tidak boleh menggantungkan reserved stock.

## Live migration verification

Migration sudah diaplikasikan ke Supabase live project Binder dan tercatat di `supabase_migrations.schema_migrations`:
- `20260514003000_harden_create_order_v1_inventory_pricing`
- `20260514011500_payment_shipping_lifecycle_hardening`

Verifikasi live schema:
- `orders` punya: `inventory_released_at`, `payment_metadata`, `service_fee`, `shipping_courier_code`, `shipping_metadata`, `shipping_service_code`, `shipping_status`, `total_weight_grams`.
- RPC `create_order_v1` exists.
- RPC `release_order_inventory_v1` exists.
- Table `webhook_events` exists.

## Validation

Commands:
- `pnpm --filter @bananasbindery/web type-check` — PASS
- `pnpm --filter @bananasbindery/web lint` — PASS
- `pnpm --filter @bananasbindery/core test` — PASS, 4 tests passed
- `git diff --check` — PASS
- `pnpm --filter @bananasbindery/web build` — PASS

Build note:
- Next build pass.
- Warning existing: Next.js plugin not detected in ESLint config.

## Attempted but blocked

Command:
- `supabase gen types typescript --project-id xiumxugolyfsvwnwzenp --schema public`

Result:
- Blocked by Supabase platform privilege: account does not have necessary privileges for generated-types endpoint.

Fallback attempted:
- `supabase gen types typescript --db-url "$DATABASE_URL" --schema public`

Result:
- Blocked because current Supabase CLI path requires Docker daemon for this mode, and Docker daemon is not running.

Safety:
- `packages/types/src/supabase.ts` was restored after the failed redirect attempt; no generated type corruption retained.

## Readiness assessment after this work

Estimated readiness for client presentation: 88–90%.

Ready enough to demo:
- Customer browsing and checkout flow.
- Server-side pricing/order creation hardening.
- Xendit invoice create and webhook lifecycle.
- Biteship rates/order/tracking/webhook baseline.
- Admin baseline for dashboard, orders, products, promos.
- Live DB migrations applied and verified.
- Type-check, lint, core tests, and production build pass.

Remaining before calling it fully production-ready:
- Run one real end-to-end sandbox order through Xendit webhook + Biteship order creation.
- Regenerate Supabase TypeScript types after Docker/Supabase privilege is fixed.
- Confirm production env values in deployment: Xendit callback token, Xendit secret, Biteship key, Supabase service role, origin area/postal/lat/lng.
- Optional: add admin retry button for failed Biteship order creation.

## Revert guide

Code/API revert targets:
- `apps/web/app/api/payment/create/route.ts`
- `apps/web/app/api/payment/webhook/route.ts`

Schema migrations applied live:
- `20260514003000_harden_create_order_v1_inventory_pricing.sql`
- `20260514011500_payment_shipping_lifecycle_hardening.sql`

Because migrations touched live DB, do not manually drop columns/functions without a dedicated rollback migration.
