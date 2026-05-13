# 📋 Riwayat Pekerjaan — Audit & Fix Phase 0 & Phase 1

**Tanggal:** 2 Mei 2026  
**Auditor:** Antigravity (Claude Opus 4.6)  
**Project:** Bananasbindery Bananasbindery Platform (Monorepo)

---

## 1. Apa yang Dikerjakan

### Fase 1: Deep Audit (Read-Only)

Saya membaca dan cross-reference 3 dokumen utama:

| Dokumen                 | Path                                                                                                          | Fungsi                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **PRD**                 | [prd.md](file:///Users/jhordideamarall/Projects/Bananasbindery/prd.md)                                               | Source of truth untuk schema, flow, dan fitur                 |
| **ARCHITECTURE.md**     | [ARCHITECTURE.md](file:///Users/jhordideamarall/Projects/Bananasbindery/ARCHITECTURE.md)                             | Source of truth untuk folder structure & package dependencies |
| **Implementation Plan** | [claudeplan/01-web-platform.md](file:///Users/jhordideamarall/Projects/Bananasbindery/claudeplan/01-web-platform.md) | Checklist per-phase untuk development                         |

Kemudian membandingkan terhadap **codebase yang aktual** — setiap file migration, setiap TypeScript type, setiap package.json.

**Hasil audit:** Phase 0 di ~72%, Phase 1 di ~65%. Detail lengkap ada di [audit report](file:///Users/jhordideamarall/.gemini/antigravity/brain/ff2de006-409d-477a-8dd8-4be5d6df17d1/artifacts/phase0_phase1_audit.md).

---

### Fase 2: Fix Semua Issues

Berikut semua perubahan yang saya buat, per-file:

---

## 2. File yang DIHAPUS

| File                                                       | Alasan                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `supabase/migrations/20260502151839_initial_schema_v2.sql` | File kosong (0 bytes), sisa dari konsolidasi sebelumnya yang tidak selesai |

> [!NOTE]
> 7 migration file lama (`20260502135048_initial_schema.sql` dst.) sudah dihapus oleh session sebelumnya. Saya hanya menghapus sisa file kosong `initial_schema_v2.sql`.

---

## 3. File yang DIBUAT (Baru)

### Database Migrations (13 files)

| #   | File                                                                                                                                                                 | Isi                                                                                                          | Lines |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----- |
| 000 | [extensions_functions.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200000_extensions_functions.sql)                               | `uuid-ossp`, `pg_trgm`, `handle_updated_at()` function                                                       | 15    |
| 001 | [users_addresses_pets.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200001_users_addresses_pets.sql)                               | `profiles`, `addresses`, `pets` tables                                                                       | 57    |
| 002 | [categories_products_variants_images.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200002_categories_products_variants_images.sql) | `categories`, `products`, `product_variants`, `product_images`, FTS vector                                   | 78    |
| 003 | [carts_cart_items.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200003_carts_cart_items.sql)                                       | `carts`, `cart_items`                                                                                        | 27    |
| 004 | [orders_order_items_returns.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200004_orders_order_items_returns.sql)                   | `orders`, `order_items`, `order_returns` — includes all PRD §9 status values                                 | 72    |
| 005 | [services_booking_slots_bookings.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200005_services_booking_slots_bookings.sql)         | `services`, `booking_slots`, `bookings`                                                                      | 59    |
| 006 | [vouchers_loyalty_loyalty_history.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200006_vouchers_loyalty_loyalty_history.sql)       | `vouchers`, `voucher_usages`, `loyalty`, `loyalty_history`                                                   | 56    |
| 007 | [reviews_wishlists.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200007_reviews_wishlists.sql)                                     | `reviews` (supports product + service), `wishlists`                                                          | 28    |
| 008 | [banners_store_locations.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200008_banners_store_locations.sql)                         | `banners`, `store_locations`                                                                                 | 33    |
| 009 | [notifications_stock_movements.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200009_notifications_stock_movements.sql)             | `notifications`, `notification_settings`, `stock_movements`, `audit_logs`, `transactions`                    | 63    |
| 010 | [indexes.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200010_indexes.sql)                                                         | Semua 18 index dari PRD §15 + trigram + extra                                                                | 45    |
| 011 | [rls_policies.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200011_rls_policies.sql)                                               | RLS on 30 tables, helper functions (`is_admin_or_owner`, `is_owner`, `is_staff_or_above`), 50+ policies      | 195   |
| 012 | [functions_triggers.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502200012_functions_triggers.sql)                                   | `handle_new_user()` (auth sync), `update_avg_rating()` (fixed DELETE), storage buckets + per-bucket policies | 118   |

---

## 4. File yang DITULIS ULANG (Overwrite)

### Seed Data

| File                                                                                  | Perubahan                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [supabase/seed.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/seed.sql) | Dari "Produk 1 Kategori 1" → 30 produk realistis (Royal Canin, Whiskas, Cat's Best, dll.) dengan harga IDR real. Termasuk 1 produk frozen untuk testing shipping rules. Setiap produk punya variant. 6 services (grooming + hotel) |

### TypeScript Enums

| File                                                                                                      | Perubahan                                                                                      |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [packages/types/src/enums.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/enums.ts) | Rewrite total: 13 enums, semua disinkronkan value-nya dengan DB CHECK constraints dari PRD §15 |

**Detail perubahan enum:**

- `UserRole`: ditambah `Staff = 'staff'`
- `OrderStatus`: hapus `WaitingPayment`, tambah `ReturnRequested`, `Returned`, `Refunded`
- `PaymentStatus`: ganti total dari `pending/paid/failed/expired/refunded` → `unpaid/paid/refunded/partial_refund`
- `StockMovementType`: ganti dari `purchase/sale` → `in/out` (sesuai DB)
- `PetType`: tambah `Hamster`
- `BookingStatus`: hapus `NoShow`
- Tambah baru: `BookingPaymentStatus`, `ReturnStatus`, `BannerType`, `NotificationType`, `NotificationChannel`, `LoyaltyTier`, `LoyaltyTransactionType`

### Domain Types (5 files)

| File                                                                                              | Key Perubahan                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [user.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/domain/user.ts)       | `street` → `fullAddress`, hapus `province`/`loyaltyPoints`, tambah `tier`/`isActive`, Pet: `userId` → `ownerId`                                                                                                                              |
| [product.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/domain/product.ts) | `basePrice` → `price`, tambah `costPrice`/`metaTitle`/`metaDescription`, hapus `isFeatured`, Variant: tambah `costPrice`/`sortOrder`, hapus `attributes`                                                                                     |
| [order.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/domain/order.ts)     | Tambah `hppTotal`/`profit`/`tax`/`expiredAt`/`voucherId`, hapus `voucherDiscount`/`loyaltyDiscount`/`courierCode`, tambah `OrderReturn` type, Cart: hapus `priceSnapshot`/`sessionId`                                                        |
| [booking.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/domain/booking.ts) | BookingSlot: hapus `serviceId`/`startTime`/`endTime`/`isBlocked`/timestamps, pakai `timeSlot`/`type`, Service: tambah `slug`/`dpPercentage`/`imageUrl`/`avgRating`/`reviewCount`, Booking: tambah `timeSlot`/`cancellationReason`            |
| [voucher.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/domain/voucher.ts) | Voucher: `minOrderAmount` → `minOrder`, `maxDiscountAmount` → `maxDiscount`, `voucherType` → `type`. Review: tambah `serviceId`/`adminReply`/`isVisible`, hapus `orderItemId`/`isVerifiedPurchase`. Tambah `LoyaltyBalance`/`Wishlist` types |

### Config & Services

| File                                                                                                                                              | Perubahan                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [packages/config/src/env.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/config/src/env.ts)                                           | `NEXT_PUBLIC_SUPABASE_URL` + `ANON_KEY` → **required** (bukan optional). Tambah vars dari PRD §17: `GOOGLE_MAPS_KEY`, `WHATSAPP_SENDER_NUMBER`, `STORAGE_URL`, `APP_NAME` |
| [packages/utils/src/format.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/utils/src/format.ts)                                       | Hapus hardcoded constants, import dari `@bananasbindery/config/constants`                                                                                                        |
| [packages/core/src/services/inventory.service.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/core/src/services/inventory.service.ts) | Hapus hardcoded `LOW_STOCK_THRESHOLD`, import dari `@bananasbindery/config/constants`                                                                                            |
| [packages/core/src/services/voucher.service.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/core/src/services/voucher.service.ts)     | Update field names: `minOrderAmount` → `minOrder`, `maxDiscountAmount` → `maxDiscount`, `voucherType` → `type`                                                            |
| [packages/core/src/services/booking.service.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/core/src/services/booking.service.ts)     | Hapus `isBlocked` dari slot check (tidak ada di PRD schema)                                                                                                               |

---

## 5. File yang DIEDIT (Partial Change)

| File                                                                                                                    | Perubahan                                                 |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [packages/utils/package.json](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/utils/package.json)               | Tambah `"@bananasbindery/config": "workspace:*"` ke dependencies |
| [packages/core/package.json](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/core/package.json)                 | Tambah `"@bananasbindery/config": "workspace:*"` ke dependencies |
| [packages/types/src/domain/order.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/domain/order.ts) | Hapus unused `PaymentMethod` import (fix TS error)        |

---

## 6. Verifikasi

```bash
$ pnpm type-check  # ✅ 6/6 packages PASS
$ pnpm lint        # ✅ 2/2 packages PASS (0 errors)
$ pnpm test        # ✅ 22/22 tests PASS (4 test files)
```

---

## 7. Klarifikasi: Kolom `name` vs `full_name`

> **Temuan user:** "Di migration 012, Opus insert ke kolom `name`, tapi di migration 001 kolomnya `full_name`."

**Jawaban:** Ini TIDAK terjadi di versi baru. Kedua file sudah konsisten:

- Migration 001 line 7: `name TEXT NOT NULL DEFAULT ''`
- Migration 012 line 10: `INSERT INTO public.profiles (id, name, ...)`

Yang pakai `full_name` adalah migration **lama** yang sudah dihapus. Versi baru yang saya buat sudah seragam menggunakan `name` sesuai PRD §15 (`name TEXT NOT NULL`).

---

## 8. Yang Belum Dikerjakan (Next Steps)

| Item                                                                              | Kapan                     |
| --------------------------------------------------------------------------------- | ------------------------- |
| `supabase db reset` — test migrations live                                        | Sebelum Phase 2           |
| Regenerate `packages/types/src/supabase.ts`                                       | Setelah db reset berhasil |
| Tambah convenience scripts di root `package.json` (`dev:web`, `db:migrate`, dll.) | Nice-to-have              |
| `@bananasbindery/core` skeleton: `cart.service.ts`, `loyalty.service.ts`                 | Phase 3+                  |
| Vercel deployment verification                                                    | External                  |
