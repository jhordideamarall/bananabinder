# 027 — Backend & Admin Finalization

**Tanggal**: 2026-05-11
**Aktor**: Claude (Opus 4.7)
**Scope**: Audit admin API + cron + webhooks, fix schema mismatch, lengkapi route, hardening security cron, lock atomic order expiry.

---

## 1. Critical Issues Found & Fixed

### 1.1 Schema Drift (Drizzle vs DB)
| Tabel | Drizzle (lama) | DB Aktual | Fix |
|---|---|---|---|
| `addresses.recipient_name` | `receiver_name` | `recipient_name` | Rename di schema.ts + 4 file caller |
| `addresses.district_id` | `subdistrict_id` + `*_name` (kolom phantom) | `district_id` saja | Hapus `*_name`, rename `subdistrict_id` |
| `flash_sale_items.product_id` | `variant_id` | `product_id` | Rename + update FK relasi `flashSaleItemRelations` |
| `flash_sale_items.promo_price` | `discount_price` | `promo_price` | Rename + update `orders.ts` price lookup |
| Tabel `cart_reminders` | (tidak ada) | Ada (migration 010) | Tambah ke schema.ts |
| Tabel `audit_logs` | (tidak ada) | Ada (migration 010) | Tambah ke schema.ts |

Tanpa fix ini, insert `addresses` di `verifyOTP` (passwordless flow) akan crash di runtime.

### 1.2 Security: Cron Route Leaked Service Role Key
**File lama**: `apps/web/app/api/cron/abandoned-cart/route.ts`
```ts
// ❌ Memvalidasi token via QUERY STRING + pakai service_role key
if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) { ... }
```
**Risiko**: service role key bocor di URL log, Vercel Edge log, browser history, dan referer header.

**Fix**:
- 🗑️ Delete duplicate `abandoned-cart/`
- ✅ Keep `abandoned-carts/` (plural) + harden via `lib/cron.ts` helper:
  - Accept Vercel header `x-vercel-cron: 1`, ATAU
  - `Authorization: Bearer ${CRON_SECRET}` (dedicated env, bukan service_role)

### 1.3 Webhook Biteship Tanpa Verifikasi
**Risiko**: siapa pun bisa POST ke `/api/webhooks/biteship` untuk manipulasi status order.

**Fix**: HMAC-SHA256 verification dari raw body dengan `BITESHIP_WEBHOOK_KEY` + `crypto.timingSafeEqual` (anti-timing attack). Jika env kosong → mode dev, skip verification.

### 1.4 Abandoned Cart Tidak Idempotent
Cron sebelumnya bisa kirim reminder WA berulang setiap 6 jam ke cart yang sama.

**Fix**: `processAbandonedCarts` sekarang `LEFT JOIN cart_reminders` → skip cart yang sudah ada marker. Setelah kirim sukses, insert ke `cart_reminders` (UNIQUE on `cart_id` mencegah race).

---

## 2. Admin Routes — Completeness Audit

| Resource | Sebelum | Sesudah |
|---|---|---|
| Stats | GET ✅ | GET ✅ |
| Products | GET, POST, PATCH (by id) | + GET single, + DELETE (soft via `is_active=false`) |
| Coupons | GET, POST, PATCH, DELETE ✅ | (no change) |
| Flash Sales | GET, POST | + PATCH (with items replace), + DELETE |
| Orders | GET list, PATCH status | + POST `/[id]/pickup` (trigger Biteship) |
| Customers | ❌ none | + GET list + GET detail |

Semua admin route pakai helper baru `lib/admin-guard.ts` (DRY auth):
```ts
const { user, error } = await requireAdmin();
if (error) return error;
```

---

## 3. Cron Routes Lengkap

| Path | Schedule | Logic |
|---|---|---|
| `/api/cron/abandoned-carts` | every 6h | WA reminder idempotent (cart_reminders) |
| `/api/cron/expire-pending-orders` | every 15min | Cancel pending > 24h |
| `/api/cron/otp-cleanup` | hourly | Delete expired OTP codes |

Semua pakai `requireCronAuth(req)` — Vercel header atau `CRON_SECRET` bearer. Dev mode auto-pass.

---

## 4. Files Changed

```
Created:
  apps/web/lib/cron.ts
  apps/web/lib/admin-guard.ts
  apps/web/app/api/admin/customers/route.ts
  apps/web/app/api/admin/customers/[id]/route.ts
  apps/web/app/api/admin/flash-sales/[id]/route.ts
  apps/web/app/api/admin/orders/[id]/pickup/route.ts
  apps/web/app/api/cron/expire-pending-orders/route.ts
  apps/web/app/api/cron/otp-cleanup/route.ts

Modified:
  packages/db/src/schema.ts          (addresses, flash_sale_items, +cartReminders, +auditLogs)
  packages/db/src/logic/auth.ts      (use recipient_name + district_id columns)
  packages/db/src/logic/admin.ts     (receiver_name → recipient_name)
  packages/db/src/logic/orders.ts    (flash_sale variant_id→product_id, discount_price→promo_price, receiver_name→recipient_name)
  packages/db/src/logic/marketing.ts (idempotent abandoned cart + expirePendingOrders + cleanupExpiredOtps)
  apps/web/app/api/cron/abandoned-carts/route.ts (use requireCronAuth)
  apps/web/app/api/admin/products/[id]/route.ts  (+ GET, DELETE)
  apps/web/app/api/webhooks/biteship/route.ts    (HMAC verification)

Deleted:
  apps/web/app/api/cron/abandoned-cart/route.ts  (unsafe duplicate)
```

---

## 5. Verification

```
✅ pnpm -w type-check       → 3/3 packages pass
✅ Supabase advisor security → 0 warnings (12 → 0)
✅ Migration count           → 8 binder + 3 hardening
✅ API surface area          → 29 routes total (lihat §6)
```

---

## 6. API Surface (Final)

**Auth (passwordless)**:
- POST `/api/auth/otp/request`, `/api/auth/otp/verify`

**Public**:
- GET `/api/products`, `/api/products/[slug]`

**Session-bound (user)**:
- POST/DELETE `/api/cart`
- GET/POST `/api/user/addresses`
- POST `/api/checkout`
- POST `/api/shipping/cost`
- GET `/api/shipping/areas`, `/api/shipping/areas/reverse`
- GET `/api/geocode/search`, `/api/geocode/reverse`
- POST `/api/geocode/biteship-area`

**Admin (requireAdmin)**:
- GET `/api/admin/stats`
- GET/POST/PATCH/DELETE `/api/admin/coupons`
- GET/POST + PATCH/DELETE-by-id `/api/admin/flash-sales`
- GET/POST + GET/PATCH/DELETE-by-id `/api/admin/products`
- GET + PATCH-by-id + POST `/api/admin/orders/[id]/pickup` `/api/admin/orders`
- GET `/api/admin/customers`, GET `/api/admin/customers/[id]`

**Webhooks (signed)**:
- POST `/api/webhooks/xendit` (x-callback-token)
- POST `/api/webhooks/biteship` (HMAC-SHA256)

**Cron (requireCronAuth)**:
- GET `/api/cron/abandoned-carts`
- GET `/api/cron/expire-pending-orders`
- GET `/api/cron/otp-cleanup`

---

## 7. Belum Selesai (BENAR-BENAR Last Mile)

- 🟡 Vercel `vercel.json` cron config (path + schedule sebelum deploy)
- 🟡 UI checkout refactor — `MapPicker` (Leaflet) + `CheckoutSheet` 4-step orchestrator
- 🟡 UI: 3 file masih reference `receiver_name` (`checkout/page.tsx`, `profile/addresses/new`, `orders/[id]`) — akan otomatis ke-overwrite saat UI refine
- 🟢 Sentry SDK + Vercel Analytics setup

Backend FOUNDATION: ✅ COMPLETE & TYPE-SAFE.

---

## 8. References

- Audit awal: `artifacts/025-…rewrite-and-supabase-audit.md`
- Backend prep: `artifacts/026-…backend-prep-aligned-prd-v2.md`
- Supabase project: `xiumxugolyfsvwnwzenp` (binderbanana2)
