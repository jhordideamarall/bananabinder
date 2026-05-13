# 🔍 Deep Audit — Phase 0 & Phase 1

### Cross-Referenced Against PRD §15, ARCHITECTURE.md, dan claudeplan/01-web-platform.md

**Date:** 2 May 2026 | **Auditor:** Antigravity (Claude Opus 4.6)

---

## Final Verdict

| Phase                              | Score    | Status                                        |
| ---------------------------------- | -------- | --------------------------------------------- |
| **Phase 0 — Foundation & Tooling** | **~72%** | ⚠️ Bisa jalan, tapi ada gap struktural        |
| **Phase 1 — Database Foundation**  | **~65%** | 🔴 Ada masalah arsitektural serius di migrasi |

> [!CAUTION]
> **Kedua phase BELUM 100% good quality.** Phase 1 terutama punya masalah mendasar di migration architecture yang harus diperbaiki sebelum lanjut Phase 2, karena bisa menyebabkan schema drift di production.

---

## PHASE 0 — Foundation & Tooling

### Checklist vs Realitas

| #   | Item (dari claudeplan)                                  | Status | Detail                                                          |
| --- | ------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| 1   | pnpm workspace + Turborepo                              | ✅     | `pnpm-workspace.yaml` ✓, `turbo.json` dengan 6 pipeline tasks ✓ |
| 2   | Root config (tsconfig, editor, prettier, eslint, nvmrc) | ✅     | Semua ada. ESLint flat config dengan `no-explicit-any: error` ✓ |
| 3   | `packages/tsconfig` (base, nextjs, react-library)       | ✅     | 3 config files ✓                                                |
| 4   | `packages/config` — env schema (zod)                    | ⚠️     | Ada, tapi **semua env vars `.optional()`**                      |
| 5   | `packages/utils` — 5 utility functions                  | ✅     | Semua 5 fungsi ada + 4 test files ✓                             |
| 6   | `packages/types` — domain types + supabase types        | ⚠️     | Ada, tapi **enum mismatch serius** dengan DB                    |
| 7   | `packages/core` — skeleton services                     | ✅     | 5 service files, sudah punya real logic (bukan cuma stub)       |
| 8   | `apps/web` — Next.js 15 App Router                      | ✅     | Next.js 15 + Turbopack + TypeScript + Tailwind v4 ✓             |
| 9   | Tailwind + shadcn/ui init                               | ✅     | `components.json` ✓, Inter + Outfit fonts ✓                     |
| 10  | `packages/ui` — shadcn primitives                       | ✅     | Button, Input, Card, Badge, Sheet, Dialog — 6 komponen          |
| 11  | Husky + lint-staged + commitlint                        | ✅     | pre-commit + commit-msg hooks ✓                                 |
| 12  | GitHub Actions CI                                       | ✅     | `ci.yml` lengkap: type-check → lint → test → build              |
| 13  | Vercel project setup                                    | ❓     | Tidak bisa diverifikasi dari codebase                           |

### 🔴 Issue P0-1: Env Validation Terlalu Lemah

**Sumber:** PRD §17 mewajibkan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sebagai env vars yang esensial.

**Masalah:** Di [env.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/config/src/env.ts), semua Supabase vars di-mark `.optional()`:

```typescript
NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),     // ← harusnya required
NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(), // ← harusnya required
```

**Impact:** App bisa start tanpa Supabase config → crash saat runtime, bukan saat startup.

**Fix:**

```diff
- NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
+ NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
- NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
+ NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
```

**PRD §17 juga mencantumkan vars yang BELUM ada di env schema:**

- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` ❌
- `WHATSAPP_SENDER_NUMBER` ❌
- `NEXT_PUBLIC_STORAGE_URL` ❌
- `NEXT_PUBLIC_APP_NAME` ❌

Ini ada di `.env.example` tapi tidak divalidasi di zod schema.

---

### 🔴 Issue P0-2: Enum Mismatch — TypeScript vs Database

**Sumber:** PRD §15 mendefinisikan exact SQL schema. Generated `supabase.ts` reflect DB yang sebenarnya.

Perbandingan `packages/types/enums.ts` vs PRD §15 SQL:

| Enum                | TypeScript (enums.ts)                          | PRD SQL                                                                             | Status                                     |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| `UserRole`          | `customer, admin, owner`                       | `customer, admin, owner`                                                            | ⚠️ **Missing `staff`** dari DB migration 1 |
| `OrderStatus`       | Punya `WaitingPayment`                         | PRD: `pending, paid, processing, shipped, delivered, completed, cancelled, expired` | 🔴 `WaitingPayment` tidak ada di PRD!      |
| `OrderStatus`       | Missing `return_requested, returned, refunded` | PRD §9 flow: `→ return_requested → returned → refunded`                             | 🔴 Incomplete                              |
| `PaymentStatus`     | `pending, paid, failed, expired, refunded`     | PRD: `unpaid, paid, refunded, partial_refund`                                       | 🔴 **Totally different values!**           |
| `StockMovementType` | `purchase, sale, return, adjustment`           | PRD: `in, out, adjustment, return`                                                  | 🔴 Different values                        |
| `PetType`           | Missing `hamster`                              | PRD: `dog, cat, bird, hamster, rabbit, fish, other`                                 | ⚠️ Missing                                 |
| `BookingStatus`     | Has `NoShow`                                   | PRD: `pending, confirmed, in_progress, completed, cancelled`                        | ⚠️ `NoShow` not in PRD                     |

**Impact:** Core services import dari enums.ts. Jika enums tidak match DB, akan ada runtime errors saat compare enum values.

---

### 🟡 Issue P0-3: Domain Types Mismatch dengan PRD Schema

Perbandingan field-by-field:

**`Address` type vs PRD `addresses` table:**
| Domain Type | PRD SQL | Issue |
|------------|---------|-------|
| `street` | `full_address` | ❌ Field name berbeda |
| `province` | Tidak ada di PRD | ❌ Extra field |
| `updatedAt` | Tidak ada di PRD `addresses` | ❌ Extra field |

**`Product` type vs PRD `products` table:**
| Domain Type | PRD SQL | Issue |
|------------|---------|-------|
| `basePrice` | `price` | ❌ Field name berbeda |
| `isFeatured` | Tidak ada di PRD | ❌ Extra field, tidak ada column-nya di DB |
| `costPrice` | Ada di PRD | ❌ Missing di domain type |
| `metaTitle` | Ada di PRD | ❌ Missing di domain type |
| `metaDescription` | Ada di PRD | ❌ Missing di domain type |
| `weightGram` | `weight_grams` | ✅ OK (camelCase convention) |

**`ProductVariant` type vs PRD `product_variants` table:**
| Domain Type | PRD SQL | Issue |
|------------|---------|-------|
| `attributes` | Tidak ada di PRD | ❌ Extra field |
| `costPrice` | Ada di PRD | ❌ Missing di domain type |
| `sortOrder` | Ada di PRD | ❌ Missing di domain type |

**`CartItem` type vs PRD `cart_items` table:**
| Domain Type | PRD SQL | Issue |
|------------|---------|-------|
| `priceSnapshot` | Tidak ada di PRD | ❌ Extra field |
| `updatedAt` | Tidak ada di PRD | ❌ Extra field |

**`Cart` type vs PRD `carts` table:**
| Domain Type | PRD SQL | Issue |
|------------|---------|-------|
| `sessionId` | Tidak ada di PRD | ❌ Extra field |
| `createdAt` | Tidak ada di PRD `carts` | ⚠️ DB migration 2 adds it |

**`Order` type vs PRD `orders` table:**
| Domain Type | PRD SQL | Issue |
|------------|---------|-------|
| `voucherDiscount` | `discount` (single column) | ❌ Different structure |
| `loyaltyDiscount` | Tidak ada di PRD | ❌ Extra field |
| `courierCode` | `shipping_courier` | ❌ Name mismatch |
| Missing `hpp_total`, `profit`, `tax`, `expired_at` | Di PRD | ❌ Missing fields |

**`BookingSlot` type vs PRD `booking_slots` table:**
| Domain Type | PRD SQL | Issue |
|------------|---------|-------|
| `serviceId` | Tidak ada di PRD | ❌ PRD uses `type` instead |
| `startTime` / `endTime` | `time_slot` (single column) | ❌ Different structure |
| `isBlocked` | Tidak ada di PRD | ❌ Extra field |
| `createdAt` / `updatedAt` | Tidak ada di PRD | ❌ Extra fields |

**`Review` type (di voucher.ts, salah file) vs PRD `reviews` table:**
| Domain Type | PRD SQL | Issue |
|------------|---------|-------|
| `orderItemId` | `order_id` | ❌ References order, not order_item |
| `isVerifiedPurchase` | Tidak ada di PRD | ❌ Extra field |
| `service_id` | Ada di PRD | ❌ Missing (review bisa untuk service juga) |
| `admin_reply` | Ada di PRD | ❌ Missing |
| `is_visible` | Ada di PRD | ❌ Missing |

---

### 🟡 Issue P0-4: Duplicate Constants

[format.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/utils/src/format.ts) hardcodes:

```typescript
const CURRENCY_LOCALE = 'id-ID';
const CURRENCY_CODE = 'IDR';
const DATE_LOCALE = 'id-ID';
```

Sementara [constants.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/config/src/constants.ts) sudah punya:

```typescript
export const CURRENCY = { code: 'IDR', locale: 'id-ID', symbol: 'Rp' };
export const DATE_LOCALE = 'id-ID';
```

**Fix:** Import dari `@bananasbindery/config/constants`.

---

### 🟡 Issue P0-5: `inventory.service.ts` Duplicate Constant

```typescript
const LOW_STOCK_THRESHOLD = 5; // Hardcoded
```

Padahal `@bananasbindery/config/constants` sudah punya `LOW_STOCK_THRESHOLD = 5`.

---

### 🟡 Issue P0-6: Missing dari ARCHITECTURE.md Spec

ARCHITECTURE.md mendefinisikan 8 shared packages. Status:

| Package               | Status | Notes                       |
| --------------------- | ------ | --------------------------- |
| `@bananasbindery/types`      | ✅     | Ada                         |
| `@bananasbindery/utils`      | ✅     | Ada                         |
| `@bananasbindery/config`     | ✅     | Ada                         |
| `@bananasbindery/core`       | ✅     | Ada                         |
| `@bananasbindery/ui`         | ✅     | Ada                         |
| `@bananasbindery/tsconfig`   | ✅     | Ada                         |
| `@bananasbindery/api-client` | ❌     | Belum dibuat (OK, Phase 5+) |
| `@bananasbindery/hooks`      | ❌     | Belum dibuat (OK, Phase 3+) |
| `@bananasbindery/store`      | ❌     | Belum dibuat (OK, Phase 3+) |

Missing packages expected karena Phase 0 plan memang belum include. ✅ Acceptable.

ARCHITECTURE.md juga define `@bananasbindery/core/services/cart.service.ts` dan `@bananasbindery/core/services/loyalty.service.ts` — keduanya missing di Phase 0 skeleton. Ini seharusnya ada sebagai skeleton.

---

### 🟢 Issue P0-7: Minor Improvements

- `packages/tsconfig` missing `nestjs.json` dan `react-native.json` (ARCHITECTURE.md defines them) — OK karena Phase 0 fokus web only
- `apps/web` missing `tailwind.config.ts` file — using Tailwind v4 which uses CSS-based config, so OK
- Root `package.json` missing `dev:web`, `dev:admin`, `dev:api`, `db:migrate`, `db:seed`, `db:reset` scripts dari ARCHITECTURE.md — should add for DX

---

## PHASE 1 — Database Foundation

### Checklist vs Realitas

| #   | Item (dari claudeplan)         | Status | Detail                                            |
| --- | ------------------------------ | ------ | ------------------------------------------------- |
| 1   | Supabase project created       | ✅     | `config.toml` ada, `project_id = "Bananasbindery"`       |
| 2   | Extensions: uuid-ossp, pg_trgm | ✅     | Kedua extensions di-create                        |
| 3   | Migrations split per domain    | 🔴     | **7 migrations monolitik, bukan 12 domain-split** |
| 4   | Seed data                      | ✅     | 6 categories, 30 products, 6 services ✓           |
| 5   | RLS policies                   | ⚠️     | Ada, tapi ada holes                               |
| 6   | Storage buckets                | ✅     | 7 buckets ✓                                       |
| 7   | Generate TypeScript types      | ✅     | `supabase.ts` 1597 lines ✓                        |
| 8   | Re-export Database type        | ✅     | Via `@bananasbindery/types/supabase` ✓                   |

---

### 🔴 Issue P1-1: CRITICAL — Contradictory Migrations

**Ini masalah PALING SERIUS di seluruh project.**

Ada 2 migrations yang membuat tabel yang SAMA dengan definisi BERBEDA:

**Migration 1** (`20260502135048_initial_schema.sql`):

- Creates `products` table: **TANPA** `price`, `promo_price`, `cost_price`, `stock`, `type`, `avg_rating`, `review_count`, `sold_count`, `meta_title`, `meta_description`
- Creates `user_role` enum: `('admin', 'customer', 'staff')` — **tanpa `owner`**
- Creates `order_status` enum: `('pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'completed')` — **berbeda total** dari PRD

**Migration 2** (`20260502141228_complete_schema_alignment.sql`):

- Creates `products` table dengan `CREATE TABLE IF NOT EXISTS`: Punya semua kolom sesuai PRD
- Tries to create `user_role` enum: `('admin', 'customer', 'staff', 'owner')` — tapi dengan `EXCEPTION WHEN duplicate_object` jadi **diabaikan**
- Tries to create `order_status` enum sesuai PRD — tapi **diabaikan**

**Hasilnya:**
| What should happen | What actually happens |
|---|---|
| `products` table punya kolom `price`, `promo_price`, dll | ❌ **TIDAK** — Migration 1 creates tanpa kolom ini, Migration 2 skipped karena `IF NOT EXISTS` |
| `user_role` ada value `owner` | ❌ **TIDAK** — Migration 1 creates tanpa `owner` |
| `order_status` sesuai PRD | ❌ **TIDAK** — Migration 1 creates dengan values lama |

> [!CAUTION]
> **Jika `supabase db reset` dijalankan, products table akan TANPA price column!** Seed data yang INSERT ke `products` dengan kolom `price` akan **ERROR**.

---

### 🔴 Issue P1-2: Schema vs PRD §15 — Column-level Mismatches

Bahkan di Migration 2 (yang seharusnya "alignment"), ada perbedaan dengan PRD:

| Table                         | PRD §15                          | Migration                            | Issue                             |
| ----------------------------- | -------------------------------- | ------------------------------------ | --------------------------------- |
| `users`→`profiles`            | `name TEXT NOT NULL`             | `full_name TEXT` (nullable)          | 🔴 PRD bilang `NOT NULL`          |
| `pets`                        | `user_id` (FK to users)          | `owner_id` (FK to profiles)          | ⚠️ Column name berbeda dari PRD   |
| `services`                    | No `slug` column                 | Has `slug TEXT UNIQUE NOT NULL`      | ⚠️ Extra column (tapi bagus ada)  |
| `orders`                      | `payment_status TEXT CHECK(...)` | `payment_status payment_status ENUM` | ⚠️ PRD uses CHECK, impl uses ENUM |
| `bookings`                    | `payment_status TEXT CHECK(...)` | `payment_status payment_status ENUM` | ⚠️ Same mismatch                  |
| `inventory` table             | Tidak ada di PRD                 | Exists in Migration 1                | ⚠️ Extra table                    |
| `districts` table             | Tidak ada di PRD                 | Exists in Migration 1                | ⚠️ Extra table                    |
| `shipping_rates` table        | Tidak ada di PRD                 | Exists in Migration 1                | ⚠️ Extra table                    |
| `transactions` table          | Tidak ada di PRD                 | Exists in Migration 6                | ⚠️ Extra table                    |
| `voucher_usages` table        | Tidak ada di PRD                 | Exists in Migration 6                | ⚠️ Extra table                    |
| `notification_settings` table | Tidak ada di PRD                 | Exists in Migration 6                | ⚠️ Extra table                    |

Note: Extra tables (inventory, districts, shipping_rates, transactions, voucher_usages, notification_settings) sebenarnya BAGUS untuk production — tapi harus di-document dan PRD harusnya di-update.

---

### 🔴 Issue P1-3: Missing 18 Indexes dari PRD §15

PRD §15 "DATABASE INDEXES" mendefinisikan **18 indexes**. Yang ada di migrations:

| Index                                   | PRD | Migration      | Status               |
| --------------------------------------- | --- | -------------- | -------------------- |
| `idx_products_search` (GIN on tsvector) | ✅  | ✅ Migration 6 | ✅                   |
| `idx_products_category`                 | ✅  | ❌             | 🔴 Missing           |
| `idx_products_slug`                     | ✅  | ❌             | ⚠️ Covered by UNIQUE |
| `idx_products_type`                     | ✅  | ❌             | 🔴 Missing           |
| `idx_products_active`                   | ✅  | ❌             | 🔴 Missing           |
| `idx_product_variants_product`          | ✅  | ❌             | 🔴 Missing           |
| `idx_orders_user`                       | ✅  | ❌             | 🔴 Missing           |
| `idx_orders_status`                     | ✅  | ❌             | 🔴 Missing           |
| `idx_orders_created`                    | ✅  | ❌             | 🔴 Missing           |
| `idx_order_items_order`                 | ✅  | ❌             | 🔴 Missing           |
| `idx_bookings_user`                     | ✅  | ❌             | 🔴 Missing           |
| `idx_bookings_date`                     | ✅  | ❌             | 🔴 Missing           |
| `idx_booking_slots_date`                | ✅  | ❌             | 🔴 Missing           |
| `idx_reviews_product`                   | ✅  | ❌             | 🔴 Missing           |
| `idx_notifications_user`                | ✅  | ❌             | 🔴 Missing           |
| `idx_loyalty_history_user`              | ✅  | ❌             | 🔴 Missing           |
| `idx_stock_movements_product`           | ✅  | ❌             | 🔴 Missing           |
| `idx_addresses_user`                    | ✅  | ❌             | 🔴 Missing           |
| `idx_pets_user`                         | ✅  | ❌             | 🔴 Missing           |

**Hanya 1 dari 18 indexes yang terbuat!** Ini akan sangat impact performance di Phase 3+ saat catalog queries mulai jalan.

---

### 🔴 Issue P1-4: `update_avg_rating()` Trigger Bug

Di [final_automations.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502151000_final_automations.sql#L33-L57):

```sql
CREATE TRIGGER on_review_added
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_avg_rating();
```

Fungsi `update_avg_rating()` referensi `NEW.product_id` dan `NEW.service_id`. Pada operasi `DELETE`, `NEW` adalah `NULL` — hanya `OLD` yang tersedia.

**Impact:** Menghapus review akan **crash** trigger → error di production.

---

### 🟡 Issue P1-5: RLS Policy Gaps

Cross-referencing PRD §15 RLS section:

| Table             | PRD RLS                               | Actual                    | Issue                                                 |
| ----------------- | ------------------------------------- | ------------------------- | ----------------------------------------------------- |
| `order_returns`   | Implicit: customer should create/view | ❌ **No customer policy** | Customer tidak bisa create return request!            |
| `vouchers`        | Not defined                           | Admin/owner only          | ⚠️ Customer tidak bisa **read** voucher saat checkout |
| `inventory`       | Not in PRD                            | Admin/owner only          | ✅ OK                                                 |
| `order_items`     | Implicit via orders                   | Via subquery ✓            | ✅                                                    |
| `stock_movements` | Not in PRD RLS                        | Admin/owner only          | ✅                                                    |

Missing policies:

1. `order_returns` — customer INSERT + SELECT own returns
2. `vouchers` — public SELECT for active vouchers (needed for checkout)
3. `banners` — sudah ada public read ✓ tapi Migration 3 drops `locations_public_view` dan re-creates, risking duplicate

---

### 🟡 Issue P1-6: Storage Upload Policies Too Broad

Current policy:

```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**Problem:** Customer bisa upload ke bucket `products`, `banners`, `categories`, `services` — ini harusnya admin-only buckets.

**Recommended:** Per-bucket policies:

- `avatars`, `pets`, `reviews` → authenticated users (customer)
- `products`, `banners`, `categories`, `services` → admin/owner only
- Missing UPDATE/DELETE policies → users tidak bisa replace/delete own uploads

---

### 🟡 Issue P1-7: Seed Data — Product Names Generik

```sql
'Produk 1 Kategori 1'  -- ← Not useful for development/demo
```

Seharusnya pakai nama realistis seperti "Royal Canin Indoor 27 - 2kg", "Pasir Wangi Cat's Best" dll. Ini penting untuk:

- Demo ke owner
- Testing search/filter behavior
- UI development realistis

---

### 🟡 Issue P1-8: `handle_new_user()` — Missing email Column

```sql
INSERT INTO public.profiles (id, full_name, avatar_url, role, tier)
VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', ...);
```

PRD §15 `users` table punya kolom `email` dan `phone`. Trigger TIDAK insert `email` dari `NEW.email` (Supabase `auth.users` punya `email` field). Ini menyebabkan `profiles.email` selalu `NULL` untuk user baru.

---

## Summary: Priority Fix Order

### 🔴 MUST FIX (Before Phase 2)

| #        | Issue                    | Effort   | Action                                                                                                                                |
| -------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **P1-1** | Contradictory migrations | 2-3 jam  | **Consolidate semua migrations** ke 1 clean initial migration (karena belum production). Split sesuai PRD: 12 domain-based migrations |
| **P1-3** | Missing 17/18 indexes    | 30 menit | Buat `xxx_indexes.sql` migration sesuai PRD §15                                                                                       |
| **P1-4** | Rating trigger bug       | 15 menit | Fix `TG_OP = 'DELETE'` handling                                                                                                       |
| **P0-2** | Enum mismatch            | 30 menit | Sync `enums.ts` dengan PRD SQL values                                                                                                 |
| **P0-3** | Domain types mismatch    | 1 jam    | Align field names + missing fields dengan PRD schema                                                                                  |
| **P0-1** | Env vars too optional    | 15 menit | Make Supabase vars required                                                                                                           |

### 🟡 SHOULD FIX (Before Phase 3)

| #        | Issue                              | Effort   |
| -------- | ---------------------------------- | -------- |
| **P1-5** | RLS gaps (order_returns, vouchers) | 30 menit |
| **P1-6** | Storage policies per-bucket        | 30 menit |
| **P1-8** | `handle_new_user()` missing email  | 15 menit |
| **P0-4** | Duplicate constants                | 15 menit |
| **P0-5** | Inventory hardcoded threshold      | 5 menit  |
| **P1-7** | Seed data realistis                | 1 jam    |

### 🟢 NICE TO HAVE

| #                                                                           | Issue |
| --------------------------------------------------------------------------- | ----- |
| Root package.json missing convenience scripts dari ARCHITECTURE.md          |
| `@bananasbindery/core` missing `cart.service.ts` dan `loyalty.service.ts` skeleton |
| Vercel deployment verification                                              |

---

## Recommendation

> [!IMPORTANT]
> **Recommended approach:** Karena project belum ke production, **reset dan konsolidasi semua 7 migrations** menjadi set clean migrations yang match PRD §15 persis. Ini lebih aman daripada membuat "patch" migration di atas fondasi yang rusak.

Langkah:

1. Backup seed.sql ✓ (sudah ada)
2. Delete 7 existing migrations
3. Buat 12 clean domain-split migrations sesuai claudeplan spec
4. Include all 18 indexes dari PRD
5. Include proper RLS dengan per-role granularity
6. Include fixed triggers (handle_new_user + update_avg_rating)
7. Sync `packages/types/enums.ts` dan domain types
8. Buat seed data realistis (nama produk Indonesia)
