# Checkout / Shipping / Payment Hardening + Guest Checkout Fix

Tanggal: 2026-05-15
Basis: gap dari `claudeplan/08-gap-closure-action-plan.md` (Batch 1 & 2 sebagian).

## Konteks

Supabase MCP terkonfirmasi terkoneksi ke project `bananabinder` (`xiumxugolyfsvwnwzenp`, region ap-southeast-1).
Verifikasi schema dilakukan via `list_tables` MCP — tabel `webhook_events`, `transactions`, `orders.inventory_released_at`, dan unique constraint `shipping_rates_cache(origin_area_id,destination_area_id,total_weight,couriers_list)` semua ada di remote.

Flow guest checkout (cart → alamat+nama+HP → OTP → auto-login → checkout) ternyata **sudah ada** di `address-sheet.tsx` (`handleInitiateVerification` + `handleVerifyAndSave` pakai `signInWithOtp`/`verifyOtp` phone). Yang rusak: hand-off id alamat ke halaman checkout.

## Perubahan Kode

### 1. `apps/web/app/api/shipping/rates/route.ts`

**Apa:** Fix shape cart item + cache upsert.

- Tambah interface `ShippingCartItem` (field top-level: `name`, `price`, `quantity`, `weight` gram).
- `totalWeight` & payload Biteship sekarang baca `item.weight`/`item.price`/`item.name` (top-level), bukan `item.product?.*` yang selalu undefined.
- `weight` payload Biteship: `item.weight || 500` gram langsung (sebelumnya `(item.product?.weight || 0.5) * 1000` — salah, treat sebagai kg).
- Cache: `.insert()` → `.upsert(..., { onConflict: '...' })` + reset `expires_at` → tidak lagi duplicate-key error setelah cache expired.

**Kenapa:** `CartItem` tidak punya nested `product` → ongkir selalu pakai fallback weight/value, bukan data produk asli. Dokumentasi Biteship `POST /v1/rates/couriers` mengonfirmasi `items[].weight` satuannya **gram**.

### 2. `apps/web/app/api/payment/webhook/route.ts`

**Apa:** Hardening webhook Xendit.

- Token: `if (XENDIT_CALLBACK_TOKEN && ...)` → `if (!XENDIT_CALLBACK_TOKEN || ...)` — fail-closed, tolak kalau env belum di-set.
- Idempotency: cek `webhook_events` (provider=xendit, event_id) di awal; insert record di akhir.
- PAID/SETTLED: tambah update tabel `transactions` (status `paid`, `paid_at`, `raw_response`, `updated_at`).
- EXPIRED: ambil order → update status → panggil RPC `release_order_inventory_v1(p_order_id, 'payment_expired')` untuk balikin stok → update `transactions` jadi `expired`.

**Kenapa:** webhook terbuka kalau env kosong (security), stok "hilang" saat payment expired, dan `transactions` tidak pernah sinkron (audit finansial tidak akurat). RPC `release_order_inventory_v1` sudah ada di migration `20260514011500` & idempotent (cek `inventory_released_at`).

### 3. `apps/web/app/checkout/page.tsx`

**Apa:** `onSuccess` AddressSheet sekarang `setSelectedAddressId(addr.id)` langsung kalau `addr.id` ada.
**Kenapa:** Guest yang baru verifikasi OTP dapat alamat real (sudah ter-insert ke DB dengan id), tapi `selectedAddressId` tetap null → query ongkir (`enabled: !!selectedAddressId`) tidak pernah jalan. Akibatnya guest tidak bisa lihat ongkir. Lookup by `full_address` yang lama juga rapuh.

## Validasi

- `pnpm --filter @bananasbindery/web type-check` → PASS
- Dokumentasi dicek: Biteship `POST /v1/rates/couriers` (weight = gram, response field `price` final). Xendit invoice callback (header `x-callback-token`, status PAID/SETTLED/EXPIRED) — konsisten dengan implementasi.

## Catatan Revert

- Shipping route: kembalikan baca `item.product?.*` & `.insert()` (tidak disarankan — itu bug).
- Webhook: hapus block idempotency, kembalikan token check ke `&&`, hapus block transactions + RPC release di EXPIRED.
- Checkout: kembalikan `onSuccess` ke lookup `refetchAddresses().then(... find by full_address ...)`.

## Sisa Gap (belum dikerjakan — perlu sesi lanjut)

- Admin order detail route `app/admin/orders/[id]/` masih belum ada.
- Voucher belum konek ke checkout (`discount = 0` hardcoded).
- Edit produk masih destructive delete variant (`admin-data.ts`).
- `create_order_v1` belum rekalkulasi diskon voucher server-side.
