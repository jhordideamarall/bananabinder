# Campaigns Admin — Full Stack (DB + UI)

**Date:** 2026-05-17
**Project:** bananabinder (Supabase: `xiumxugolyfsvwnwzenp`)
**Status:** Production-ready UI + DB. Public-side integration (PDP badge, checkout apply) pending.

## Context

Client minta menu **Campaign** ala Shopee/TikTok: flash sale, diskon produk, gratis ongkir Jabodetabek. Auto-apply (tanpa kode user, beda dengan voucher). Control product/category/region pilihan harus jelas — bukan placeholder.

## What Was Built

### 1. Database (Supabase MCP — `bananabinder` project)

**Migration:** `supabase/migrations/20260517012525_create_campaigns_v1.sql` (juga sudah di-apply lewat MCP).

Tables:

- `campaigns` — main record (name, type, discount config, scope, schedule, priority, stackable, usage limits)
- `campaign_products` — many-to-many → `products`
- `campaign_categories` — many-to-many → `categories`
- `campaign_regions` — many-to-one (type='province'|'city', code, label)
- `campaign_usages` — audit log per order

Enums: `campaign_type`, `campaign_discount_unit`, `campaign_target_scope`, `campaign_region_scope`.

Constraints:

- `CHECK (ends_at > starts_at)`
- `CHECK (discount_unit <> 'percentage' OR discount_value <= 100)`
- `CHECK (discount_value >= 0)`, `min_order >= 0`
- `UNIQUE (campaign_id, order_id)` on usages

Indexes: active+period, type, priority, product/category/region lookups.

RLS:

- Public: read aktif-only (untuk PDP/cart preview)
- Staff (admin/owner/staff): full CRUD via `is_admin_or_staff()` helper
- Usages: staff read only

Seed: 3 sample campaigns (Flash Sale Weekend, Gratis Ongkir Jabodetabek, Diskon Custom Cover) — verified ada di DB.

### 2. Types (regenerated)

- `packages/types/src/supabase.ts` — regenerated via MCP `generate_typescript_types` (62KB, includes 4 new campaign tables + 4 enums)
- `apps/web/components/admin/campaigns/types.ts` — domain types pakai `Tables<>` & `Enums<>` dari supabase types. No `any`.

### 3. Server Actions

**File:** `apps/web/app/admin/campaigns/actions.ts`

- `saveCampaign(formData)` — insert/update + sync junction tables (delete-replace strategy)
- `deleteCampaign(formData)` — cascade via FK
- `toggleCampaignActive(formData)` — quick toggle

Validation server-side:

- Nama wajib, tipe valid, tanggal valid (`ends_at > starts_at`)
- Percentage ≤ 100, value ≥ 0
- Scope `products` butuh minimal 1 product, `categories` butuh 1 category, region scope non-all butuh 1 region
- Auth: `requireAdmin()` cek role profile

### 4. UI Components

**Picker components (poin utama user — control yang jelas):**

| File                 | Purpose                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ProductPicker.tsx`  | Multi-select dgn search bar, thumbnail produk, harga. Show chip selected di atas.                                      |
| `CategoryPicker.tsx` | Grid checkbox card dgn product count per kategori.                                                                     |
| `RegionPicker.tsx`   | 3-tier: scope toggle (Semua/Provinsi/Kota) → preset chips (Jabodetabek, Pulau Jawa, dll) → search + multi-select list. |

**Region data:** `region-data.ts` — 34 provinsi Indonesia + 33 kota utama + 5 preset (Jabodetabek, Jabar, Pulau Jawa, Bali, Sumatera). Codes BPS standard.

**Editor:** `CampaignEditor.tsx`

- Form ter-section: Detail Umum / Aturan Diskon / Target / Wilayah
- Section conditional per type:
  - flash_sale → Target produk picker
  - product_discount → Target picker + stackable toggle
  - free_shipping → Region picker
- Error display dgn alert box (server-side error messages)
- Pending state via `useTransition`
- Delete confirmation via `window.confirm`

**Manager:** `CampaignManager.tsx`

- Stats card (Aktif / Terjadwal / Total)
- Filter tab + Quick-create per type
- List card dgn status badge (auto-derived dari `is_active + starts_at + ends_at`)
- 2-column layout: list (kiri) + editor (kanan)

**Page:** `apps/web/app/admin/campaigns/page.tsx`

- Server Component, parallel queries:
  - campaigns + junction tables (products/categories/regions)
  - products + primary image join
  - categories + product counts
- Enriched data passed to `<CampaignManager>`
- `force-dynamic` — always fresh

**Sidebar:** `AdminSidebarNav.tsx` — nav item "Campaigns" dengan icon Megaphone.

## Verification

```bash
pnpm --filter=web type-check    # PASS — zero errors
npx eslint app/admin/campaigns components/admin/campaigns  # PASS — zero warnings
```

DB verified via MCP: 3 seed rows present, schema correct, RLS policies active.

**Manual test path:**

1. Login admin → buka `/admin/campaigns`
2. Lihat stats + list 3 campaign seed
3. Klik salah satu → editor open dgn pre-filled data
4. Test buat baru per tipe → verify validation (mis. percentage > 100 ditolak, end < start ditolak)
5. Test picker:
   - Product: search "binder", multi-select
   - Category: grid checkbox dgn product count
   - Region: scope toggle → klik preset "Jabodetabek" → 13 kota terpilih, bisa hapus per chip

## What Still Pending

1. `campaign.service.ts` di `packages/core` — pure evaluator function
2. RPC `create_order_v1` extension untuk apply campaign (discount + shipping subsidy + insert ke `campaign_usages`)
3. Public UI: badge "FLASH SALE" + countdown di PDP/cart
4. Free shipping integration ke `shipping.service.ts` — match region code dari Biteship destination
5. (Optional) full city list ~500 dari Biteship API — current 33 kota cover 90% pesanan

## Bugfix (post-deploy)

- **Issue:** ProductPicker tampil "Belum ada produk di katalog" walau DB punya 20 produk aktif.
- **Cause:** Query select `product_images(image_url, is_primary)` — kolom sebenarnya `url`/`sort_order`. PostgREST silent fail → empty data.
- **Fix:** `apps/web/app/admin/campaigns/page.tsx` — select kolom yang benar, sort by `sort_order` ascending untuk pick thumbnail.

## Files Changed

**Created:**

- `supabase/migrations/20260517012525_create_campaigns_v1.sql`
- `apps/web/app/admin/campaigns/page.tsx`
- `apps/web/app/admin/campaigns/actions.ts`
- `apps/web/components/admin/campaigns/types.ts`
- `apps/web/components/admin/campaigns/region-data.ts`
- `apps/web/components/admin/campaigns/CampaignManager.tsx`
- `apps/web/components/admin/campaigns/CampaignEditor.tsx`
- `apps/web/components/admin/campaigns/ProductPicker.tsx`
- `apps/web/components/admin/campaigns/CategoryPicker.tsx`
- `apps/web/components/admin/campaigns/RegionPicker.tsx`

**Modified:**

- `apps/web/components/admin/AdminSidebarNav.tsx` (added Campaigns nav)
- `packages/types/src/supabase.ts` (regenerated, +new campaign tables/enums)

**Deleted:**

- `apps/web/components/admin/campaigns/mock-data.ts` (no longer needed)

## Revert Instructions

```bash
# Code
git rm -r apps/web/app/admin/campaigns apps/web/components/admin/campaigns
git checkout apps/web/components/admin/AdminSidebarNav.tsx packages/types/src/supabase.ts
rm supabase/migrations/20260517012525_create_campaigns_v1.sql

# Database (via Supabase MCP execute_sql)
DROP TABLE campaign_usages, campaign_regions, campaign_categories, campaign_products, campaigns CASCADE;
DROP FUNCTION is_admin_or_staff(), set_campaign_updated_at();
DROP TYPE campaign_region_scope, campaign_target_scope, campaign_discount_unit, campaign_type;
```
