# Campaign Full-Stack Integration

**Date:** 2026-05-17
**Project:** bananabinder (Supabase: `xiumxugolyfsvwnwzenp`)
**Status:** End-to-end integrated. Admin UI → Service evaluator → Preview API → Checkout UI → RPC server validation → Order with usage tracking.

## Context

Sebelumnya: admin UI + DB schema sudah ada, tapi public side (checkout) belum apply campaign. Sekarang full integrated: kalau admin buat campaign aktif, langsung ter-apply saat customer checkout.

## Architecture (single source of truth)

```
Admin /admin/campaigns ──┐
                         │
                         ▼
                ┌──────────────────┐
                │  campaigns DB    │ (campaigns + targets + usages)
                └────────┬─────────┘
                         │
       ┌─────────────────┴────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│ TS evaluator    │              │  RPC SQL logic   │
│ (preview UI)    │   identical  │  (authoritative) │
│ campaign.service│  ◀─math─▶    │ create_order_v1  │
└─────────────────┘              └──────────────────┘
       │                                  │
       ▼                                  ▼
   Cart/Checkout                 Order finalised +
   preview total                 campaign_usages row
```

Rule: **client preview is UX hint, server is truth**. UI shows preview discount, RPC re-validates & calculates final discount + inserts `campaign_usages`.

## Files Created

- `packages/core/src/services/campaign.service.ts` — pure evaluator (`evaluateCampaigns(ctx, campaigns)`)
- `packages/core/src/services/campaign.service.test.ts` — **16 unit tests, all passing**
- `packages/api-client/src/campaigns.ts` — `getActiveCampaigns(supabase)` loads active campaigns + targets
- `apps/web/app/api/campaigns/preview/route.ts` — POST preview endpoint
- `apps/web/lib/services/campaign-client.ts` — fetch wrapper for preview
- `supabase/migrations/20260517013811_create_order_v1_with_campaigns.sql` — RPC extension

## Files Modified

- `packages/api-client/src/types.ts` — added `CheckoutPayload.campaignIds?: string[]`
- `packages/api-client/src/orders.ts` — pass `p_campaign_ids` to RPC
- `packages/core/package.json` — exports `./campaign`
- `packages/api-client/package.json` — exports `./campaigns`, depends on `@bananasbindery/core`
- `packages/core/src/index.ts` — re-export campaign service
- `packages/types/src/supabase.ts` — regenerated via MCP
- `apps/web/app/checkout/page.tsx` — preview query + line items + send campaign IDs to RPC

## How It Works

### 1. Admin creates campaign

Insert into `campaigns` + junction tables via `/admin/campaigns` editor.

### 2. Customer hits checkout

`useQuery(['campaign-preview', ...])` calls `/api/campaigns/preview` with cart items.

### 3. Preview API

- Loads active campaigns (RLS: only those active + within period)
- Joins category for each cart item
- Calls `evaluateCampaigns()` — returns:
  - `applied[]`: per campaign breakdown (itemDiscounts, shippingDiscount)
  - `totalItemDiscount`, `totalShippingDiscount`

### 4. Checkout UI

- Shows separate line per campaign in summary:
  - `Campaign · Flash Sale Weekend  -Rp 25.000`
  - `Gratis Ongkir · Jabodetabek    -Rp 30.000`
- `total = subtotal - voucherDiscount - campaignItemDiscount + (shippingPrice - campaignShippingDiscount)`

### 5. Customer clicks "Bayar"

- `createOrder({..., campaignIds: ['c1','c2']})` → RPC `create_order_v1` with `p_campaign_ids`

### 6. RPC server-side

For each campaign ID:

1. Lock row (`FOR UPDATE`)
2. Validate: is_active, period, usage_limit
3. For product campaigns: compute matched subtotal from `order_items` JOIN scope tables, validate min_order, compute discount with max cap
4. For free shipping: validate min_order + region match (city or province), compute subsidy capped by shipping_cost
5. `UPDATE campaigns SET usage_count++`
6. `INSERT INTO campaign_usages`

All in single transaction — if anything fails, order rolls back.

## Evaluator Rules (deterministic)

| Rule          | Description                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| Sort          | Campaigns sorted by `priority ASC` before applying                                          |
| Non-stackable | `flash_sale` always non-stackable; `product_discount.stackable=false` locks affected line   |
| Stackable     | `product_discount.stackable=true` allows subsequent campaigns on same line                  |
| Shipping      | Free shipping never stacks — best subsidy wins                                              |
| Allocation    | Multi-line discount allocated proportionally by line subtotal share                         |
| Cap           | Server enforces `max_discount` cap; final amount also capped at line subtotal               |
| Region        | City scope > province scope; "all" always matches; else codes must match `campaign_regions` |

## Unit Tests Coverage (16 tests)

- ✅ Inactive / expired / pre-start / at-usage-limit → skip
- ✅ Percentage math + maxDiscount cap
- ✅ Fixed amount discount
- ✅ minOrder check
- ✅ Proportional allocation across multi-line
- ✅ Scope: products / categories filtering
- ✅ Non-stackable lock + stackable allow
- ✅ Free shipping: city match / mismatch / pick-largest

## Known Limitation (documented for client)

**Region-based free shipping (Jabodetabek)** memerlukan `addresses.city_code` / `province_code` columns — saat ini belum ada. Konsekuensi:

- Free shipping campaign dengan `region_scope='all'` → ✅ works
- Free shipping campaign dengan `region_scope='cities'|'provinces'` → ❌ akan reject semua (RPC raise exception "Alamat tidak masuk wilayah")

**Fix berikutnya** (1 migration + 1 form field):

1. `ALTER TABLE addresses ADD COLUMN province_code TEXT, city_code TEXT;`
2. Update address picker UI agar user pilih kota dari dropdown (pakai data dari `region-data.ts` yang sudah ada di admin)

Sebelum fix ini: instruksi ke client → "Untuk gratis ongkir, set scope `Semua wilayah Indonesia` dulu. Targeting per kota nyusul setelah pickup alamat ada dropdown."

## Verification

```bash
pnpm --filter=@bananasbindery/core test    # 20/20 pass (4 pricing + 16 campaign)
pnpm --filter=@bananasbindery/core type-check       # PASS
pnpm --filter=@bananasbindery/api-client type-check # PASS
pnpm --filter=web type-check                        # PASS
```

DB verified via MCP:

- `pg_get_function_arguments` confirms `create_order_v1` has new `p_campaign_ids uuid[]` param
- 3 seed campaigns active in `campaigns` table
- RLS policies allow anon read of active campaigns (needed for preview API)

**Manual test path:**

1. `/admin/campaigns` → buat "Flash Sale 25%" target=all products, period mencakup hari ini, aktif
2. Sebagai customer biasa, add product ke cart
3. Buka `/checkout` → di Step 3 (Bayar), lihat ringkasan:
   - Subtotal Rp X
   - **Campaign · Flash Sale 25% -Rp Y** ← muncul otomatis
   - Total Rp (X-Y)
4. Klik "Bayar" → order tercipta, cek di DB:
   - `campaigns.usage_count` increment
   - `campaign_usages` row terinsert dengan `discount_amount`

## Bug Note

RPC awalnya aku tulis pakai field `productId` (camelCase) — padahal existing client kirim `product_id` (snake_case). Fixed in this migration: RPC sekarang konsisten baca `product_id` / `variant_id`. Tanpa fix ini, **semua order akan gagal** karena RPC tidak bisa parse items.
