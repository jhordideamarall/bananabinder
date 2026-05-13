# 🔍 Deep Audit Report — Phase 0 & Phase 1

**Date:** 2 May 2026  
**Auditor:** Antigravity (Claude Opus 4.6)  
**Source of Truth:** [claudeplan/01-web-platform.md](file:///Users/jhordideamarall/Projects/Bananasbindery/claudeplan/01-web-platform.md)

---

## Verdict

| Phase                              | Status               | Score                            |
| ---------------------------------- | -------------------- | -------------------------------- |
| **Phase 0 — Foundation & Tooling** | ⚠️ **~70% complete** | 9/13 items done, 4 with issues   |
| **Phase 1 — Database Foundation**  | ⚠️ **~75% complete** | 6/8 items done, 7 quality issues |

> [!IMPORTANT]
> Neither phase is 100% production-ready. Phase 0 has structural gaps in shared packages, and Phase 1 has migration architecture issues + missing `pg_trgm` extension in the correct migration order + RLS security holes. See details below.

---

## Phase 0 — Foundation & Tooling

### ✅ Items DONE & Good Quality

| #   | Item                                                         | Status | Notes                                                                                                                                   |
| --- | ------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | pnpm workspace + Turborepo                                   | ✅     | `pnpm-workspace.yaml` + `turbo.json` configured correctly with dev/build/lint/test/type-check/clean pipelines                           |
| 2   | Root config: tsconfig, editorconfig, prettier, ESLint, nvmrc | ✅     | `tsconfig.base.json` (strict mode ✓), `.editorconfig`, `.prettierrc`, `eslint.config.mjs` (flat config ✓, no-any ✓), `.nvmrc` (node 20) |
| 3   | `packages/tsconfig`                                          | ✅     | Has `base.json`, `nextjs.json`, `react-library.json` — correct 3-config pattern                                                         |
| 8   | `apps/web` — Next.js 15 App Router                           | ✅     | Next.js 15, App Router, TypeScript, Tailwind v4, `--turbopack` in dev                                                                   |
| 9   | Tailwind + shadcn/ui init                                    | ✅     | `components.json` present, Tailwind v4 via `@tailwindcss/postcss`, Inter + Outfit fonts loaded                                          |
| 11  | Husky + lint-staged + commitlint                             | ✅     | `pre-commit` runs lint-staged + type-check, `commit-msg` runs commitlint, conventional commits config in package.json                   |
| 12  | GitHub Actions CI                                            | ✅     | `ci.yml` with checkout → node 20 → pnpm 10 → cache → type-check → lint → test → build                                                   |
| -   | Middleware placeholder                                       | ✅     | `apps/web/middleware.ts` exists with correct matcher pattern                                                                            |
| -   | Root layout with fonts + metadata                            | ✅     | Inter + Outfit, proper `<html lang="id">`, metadata with title template                                                                 |

### ⚠️ Items with ISSUES

| #   | Item                                 | Expected                                                                              | Actual                                                                                                                                                                                                                                                                                                                                                      | Severity    |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 4   | `packages/config` — env schema (zod) | Fail-fast validation at startup, zod schema                                           | ✅ env.ts exists with zod schema, **BUT** all env vars are `.optional()` — Supabase URL/Key won't fail-fast if missing                                                                                                                                                                                                                                      | 🔴 **HIGH** |
| 5   | `packages/utils`                     | `formatCurrency`, `formatDate`, `slugify`, `generateOrderNumber`, `haversineDistance` | All 5 functions present ✅ + tests exist ✅, **BUT** `format.ts` hardcodes locale constants instead of importing from `@bananasbindery/config/constants` — duplicated source of truth                                                                                                                                                                              | 🟡 MEDIUM   |
| 6   | `packages/types`                     | Domain types + supabase generated types                                               | `supabase.ts` generated ✅ (1597 lines, 26+ tables), `enums.ts` ✅, domain types (user, product, order, booking, voucher) ✅. **BUT** enums in `enums.ts` don't fully match DB enums — e.g. TypeScript `UserRole` missing `'staff'`, has `OrderStatus.WaitingPayment` which doesn't exist in DB, `StockMovementType` values don't match DB CHECK constraint | 🔴 **HIGH** |
| 7   | `packages/core` — skeleton services  | Skeleton files for pricing, shipping, booking                                         | Has `pricing.service.ts`, `shipping.service.ts`, `booking.service.ts`, `inventory.service.ts`, `voucher.service.ts` ✅. Services have real interfaces & stubs — good. **BUT** `booking.service.ts` imports `BookingSlot` from `@bananasbindery/types/domain` — need to verify this type exists and is exported                                                     | 🟡 MEDIUM   |
| 10  | `packages/ui` — shadcn primitives    | Button, Input, Card, Badge, Modal, Sheet wrapped                                      | Has Button ✅, Input ✅, Card ✅, Badge ✅, Sheet ✅, Dialog ✅. **Missing: Modal** (plan says Modal, have Dialog — acceptable if Dialog is the replacement). Missing index barrel export verification                                                                                                                                                      | 🟢 LOW      |

### ❌ Items MISSING

| #   | Item                                             | Status                                                                                                               |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 13  | Vercel project setup + preview deployment per PR | ❌ **Not verifiable from codebase** — no `vercel.json`, no deploy workflow. Plan says preview URL should be openable |

### Phase 0 — Critical Action Items

> [!CAUTION]
> These must be fixed before Phase 2 begins:

1. **`packages/config/env.ts`** — Make `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` **required** (remove `.optional()`). These are needed from Phase 1 onward. Other phase-specific vars can stay optional.

2. **`packages/types/enums.ts`** — Sync with actual DB enums:
   - `UserRole`: add `Staff = 'staff'`
   - `OrderStatus`: remove `WaitingPayment`, add `ReturnRequested = 'return_requested'`, `Returned = 'returned'`, `Refunded = 'refunded'` to match DB `order_status` enum
   - `PaymentStatus`: values don't match DB (`pending`/`failed`/`expired` not in DB enum `unpaid`/`paid`/`refunded`/`partial_refund`/`dp_paid`)
   - `StockMovementType`: DB uses `in`/`out`/`adjustment`/`return`, TypeScript uses `purchase`/`sale`/`return`/`adjustment`

3. **`packages/utils/format.ts`** — Import `CURRENCY` and `DATE_LOCALE` from `@bananasbindery/config` instead of hardcoding duplicate constants.

4. **Vercel deployment** — Set up `vercel.json` or at minimum confirm Vercel project is linked.

---

## Phase 1 — Database Foundation

### ✅ Items DONE & Good Quality

| #   | Item                               | Status | Notes                                                                                             |
| --- | ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| 1   | Supabase project created           | ✅     | `config.toml` present, `project_id = "Bananasbindery"`                                                   |
| 2   | Extensions: `uuid-ossp`, `pg_trgm` | ⚠️     | `uuid-ossp` in migration 1 ✅, `pg_trgm` in migration 7 ✅ — but see issues below                 |
| 3   | Migrations split per domain        | ⚠️     | 7 migrations exist but structure deviates from plan — see issues below                            |
| 4   | Seed data                          | ✅     | 6 categories, 30 products (5 per category), 6 services — matches plan exactly                     |
| 6   | Storage buckets                    | ✅     | 7 buckets: products, banners, pets, reviews, avatars, categories, services. Public read policy ✅ |
| 7   | TypeScript types generated         | ✅     | `packages/types/src/supabase.ts` — 1597 lines, auto-generated from Supabase                       |
| 8   | Re-export Database type            | ✅     | Available via `@bananasbindery/types`                                                                    |

### ⚠️ Quality Issues Found

#### Issue 1: Migration Architecture — Messy & Contradictory 🔴 HIGH

The plan calls for **12 clean domain-split migrations** (`001` through `012`). Instead, what exists is:

| Actual Migration                                | What it does                                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `20260502135048_initial_schema.sql`             | Creates ALL tables + enums + basic RLS — a monolith                                                        |
| `20260502141228_complete_schema_alignment.sql`  | **Re-creates the SAME tables** with `CREATE TABLE IF NOT EXISTS` — completely different column definitions |
| `20260502142535_granular_role_security.sql`     | Role-based RLS refinement                                                                                  |
| `20260502144000_storage_setup.sql`              | Storage buckets                                                                                            |
| `20260502145000_asset_infrastructure_final.sql` | Extra column + 2 more buckets                                                                              |
| `20260502150000_advanced_tracking.sql`          | FTS + extra tables (voucher_usages, transactions, notification_settings)                                   |
| `20260502151000_final_automations.sql`          | Auth trigger + rating automation                                                                           |

> [!WARNING]
> **Migration 1 and Migration 2 are contradictory.** Migration 1 creates tables with one set of columns/enums. Migration 2 creates the SAME tables with `IF NOT EXISTS` and DIFFERENT schemas. Since `IF NOT EXISTS` skips if the table already exists, **Migration 2's table definitions are silently ignored** — meaning the actual deployed schema depends on which migration ran first against an empty DB. This is extremely dangerous.
>
> Example: Migration 1 creates `user_role` as `('admin', 'customer', 'staff')`. Migration 2 tries to create it as `('admin', 'customer', 'staff', 'owner')` but with `EXCEPTION WHEN duplicate_object` — so `'owner'` role depends on migration order.

#### Issue 2: Dual Table Definitions — Schema Drift Risk 🔴 HIGH

Migration 1 `products` table:

- No `price`, `promo_price`, `cost_price`, `stock`, `type`, `avg_rating`, `review_count`, `sold_count`, `meta_title`, `meta_description` columns
- Has `is_frozen BOOLEAN` instead of `type product_type`

Migration 2 `products` table:

- Has all the above fields
- Uses `product_type` enum

**If Migration 1 runs first**, the products table will be **missing critical columns** because Migration 2's `CREATE TABLE IF NOT EXISTS` will be a no-op.

The same problem affects: `profiles`, `pets`, `categories`, `orders`, `order_items`, `services`, `booking_slots`, `bookings`, `vouchers`, `reviews`, `notifications`.

#### Issue 3: Missing Dedicated Indexes Migration 🟡 MEDIUM

Plan calls for `010_indexes.sql`. Only index created is `idx_products_search` on FTS vector in migration 6. Missing:

- Index on `products.category_id` (catalog queries)
- Index on `products.slug` (already covered by UNIQUE constraint ✅)
- Index on `orders.user_id` (order history queries)
- Index on `orders.order_number` (already UNIQUE ✅)
- Index on `bookings.user_id` (booking history)
- Index on `cart_items.cart_id` (cart operations)
- Index on `products.is_active` (filtered queries)
- Composite index on `booking_slots(date, type)` for availability queries
- Trigram index on `products.name` for fuzzy search (pg_trgm enabled but no GIN trigram index created)

#### Issue 4: `update_avg_rating()` Trigger Bug 🔴 HIGH

In [final_automations.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502151000_final_automations.sql#L33-L57):

```sql
CREATE TRIGGER on_review_added
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_avg_rating();
```

The function references `NEW.product_id` and `NEW.service_id`, but on `DELETE` operations, `NEW` is `NULL` — only `OLD` is available. This trigger will **crash on review deletion**.

```diff
- IF (NEW.product_id IS NOT NULL) THEN
+ IF (TG_OP = 'DELETE') THEN
+   -- Use OLD record for deletes
+   IF (OLD.product_id IS NOT NULL) THEN
+     UPDATE ...
+   END IF;
+ ELSE
+   IF (NEW.product_id IS NOT NULL) THEN
+     UPDATE ...
+   END IF;
+ END IF;
```

#### Issue 5: RLS Policy — Missing INSERT Policy for Profiles 🟡 MEDIUM

The `handle_new_user()` trigger creates profiles, carts, and loyalty records using `SECURITY DEFINER`. However, if a user tries to update their own profile, the `users_update_own_profile` policy exists. But there's **no explicit INSERT policy** for profiles from the customer's perspective — relying entirely on the trigger.

Also, `order_returns` table has RLS enabled but **no policies defined** for customers to create return requests.

#### Issue 6: Storage Upload Policies Too Permissive 🟡 MEDIUM

Current policy in [storage_setup.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502144000_storage_setup.sql):

```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

This allows **any authenticated user** to upload to **any bucket** (products, banners, etc.). Customers should only upload to `avatars`, `pets`, `reviews`. Only admin/owner should upload to `products`, `banners`, `categories`, `services`.

Also missing: **UPDATE and DELETE** policies for storage objects (users can't replace their own avatar).

#### Issue 7: Missing `decrement_stock_on_order()` Function 🟡 MEDIUM

Plan item 12 calls for `012_functions_triggers.sql` with `decrement_stock_on_order()` function. This doesn't exist in any migration. While this will be implemented in Phase 5 (checkout), the plan lists it as a Phase 1 deliverable.

---

## Summary of Priority Fixes

### 🔴 Must Fix Before Phase 2

| #   | Issue                                | Fix                                                                                                                                                                                                                                        |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Contradictory migrations**         | Create a new "reset" migration that uses `ALTER TABLE` to add missing columns from migration 2 to tables created by migration 1. Or better: consolidate into a single clean initial migration if DB hasn't been deployed to production yet |
| 2   | **Enum mismatch** (TypeScript vs DB) | Sync `packages/types/enums.ts` with actual DB enum values                                                                                                                                                                                  |
| 3   | **`update_avg_rating()` DELETE bug** | Fix trigger to handle `TG_OP = 'DELETE'` using `OLD` reference                                                                                                                                                                             |
| 4   | **Env validation too permissive**    | Make Supabase env vars required in `packages/config/env.ts`                                                                                                                                                                                |

### 🟡 Should Fix Soon

| #   | Issue                        | Fix                                                                            |
| --- | ---------------------------- | ------------------------------------------------------------------------------ |
| 5   | Storage upload policies      | Scope per-bucket, add UPDATE/DELETE                                            |
| 6   | Missing indexes              | Create dedicated indexes migration                                             |
| 7   | `order_returns` missing RLS  | Add customer INSERT + SELECT policies                                          |
| 8   | Duplicate constants in utils | Import from `@bananasbindery/config`                                                  |
| 9   | Missing trigram index        | `CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops)` |

### 🟢 Nice to Have

| #   | Issue                                                    |
| --- | -------------------------------------------------------- |
| 10  | Vercel deployment config                                 |
| 11  | `packages/ui` barrel exports verification                |
| 12  | `decrement_stock_on_order()` stub (can defer to Phase 5) |

---

## Phase 0 Verification Checklist (from plan)

| Check                                                    | Result                              |
| -------------------------------------------------------- | ----------------------------------- |
| `pnpm dev` jalan                                         | ⚠️ Not verified — needs manual test |
| `pnpm build && pnpm lint && pnpm type-check` semua hijau | ⚠️ Not verified — needs manual test |
| Landing page placeholder live di Vercel preview          | ❌ Not verifiable                   |
| Preview URL bisa dibuka                                  | ❌ Not verifiable                   |

## Phase 1 Verification Checklist (from plan)

| Check                                  | Result                                                        |
| -------------------------------------- | ------------------------------------------------------------- |
| `supabase db push` sukses              | ⚠️ Likely fails due to contradictory migrations               |
| `select * from products` return 30 row | ✅ Seed creates 30 products                                   |
| Types valid di TypeScript              | ✅ `supabase.ts` generated                                    |
| Semua 22 tabel + RLS aktif             | ⚠️ 26+ tables created, RLS enabled, but contradictory schemas |
| `pnpm type-check` di web tidak error   | ⚠️ Not verified — enum mismatch may cause issues              |
