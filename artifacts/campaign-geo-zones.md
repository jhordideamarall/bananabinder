# Campaign Region Targeting — Leaflet Geo Zones

**Date:** 2026-05-17
**Project:** bananabinder (Supabase: `xiumxugolyfsvwnwzenp`)
**Status:** Production ready. Admin draws zones on map, customer's existing address lat/lng matched via haversine.

## Context

Pendekatan sebelumnya pakai kode provinsi/kota (BPS-style text) — masalah:

1. Customer address belum punya kolom city_code/province_code → semua region-scoped campaign auto-reject
2. UX dropdown 500+ kota tidak ramah
3. Tidak presisi — "Bogor" bisa berarti kota atau kabupaten

User insight: **checkout sudah pakai Leaflet untuk pick alamat** (lat/lng tersimpan di `addresses.latitude` & `.longitude`). Reuse pattern itu untuk admin set zona campaign.

## Architecture

```
Admin /admin/campaigns                          Customer /checkout
  │                                                │
  ▼                                                ▼
[Leaflet Map]                                [Leaflet Map]
Click → tambah zona                          Click → set alamat
{centerLat, centerLng, radiusKm}             {latitude, longitude}
  │                                                │
  ▼                                                ▼
campaign_geo_zones                            addresses
  │                                                │
  └──────────── haversine_km() ──────────────────┘
                       │
                       ▼
              distance ≤ radius_km ?
                       │
                       ▼
              apply free shipping
```

## DB Changes (applied via MCP)

**Dropped:**

- `campaign_regions` table (no production data)
- `campaign_region_scope` enum values `'provinces'` & `'cities'`

**Created:**

- `campaign_region_scope` enum: `'all' | 'radius'`
- `campaign_geo_zones` table:
  ```
  id, campaign_id, center_lat, center_lng, radius_km, label, created_at
  ```

  - Constraints: lat ∈ [-90,90], lng ∈ [-180,180], radius ∈ (0, 1000]
  - RLS: public read (active campaigns), staff write
- `public.haversine_km(lat1, lng1, lat2, lng2) → NUMERIC` (km) — IMMUTABLE
- RPC `create_order_v1` updated: free shipping with `region_scope='radius'` validates `EXISTS(... WHERE haversine_km(z.lat, z.lng, addr.lat, addr.lng) <= z.radius_km)`

## Code Changes

**Service** (`packages/core/src/services/campaign.service.ts`):

- `EvaluationContext.destination` now `{ latitude, longitude } | null` (not codes)
- New export `haversineKm()` — JS implementation mirroring SQL
- `destinationInZone()` uses OR logic across `campaign.geoZones[]`

**API client** (`packages/api-client/src/campaigns.ts`):

- Load from `campaign_geo_zones` instead of `campaign_regions`

**Admin UI:**

- New `GeoZoneMap.tsx` — Leaflet `<MapContainer>` + `<Marker>` + `<Circle>` per zone, click to add
- New `GeoZonePicker.tsx` — scope toggle (All/Radius), preset chips (Jabodetabek/Jakarta/Bandung Raya/Jogja/Surabaya), zone list with edit (lat/lng input + radius slider)
- Removed `RegionPicker.tsx`, `region-data.ts` (obsolete city/province codes)
- `CampaignEditor.tsx` swapped picker
- `actions.ts` parses `geoZonesJson` form field (lat/lng/radius/label)

**Checkout** (`apps/web/app/checkout/page.tsx`):

- Passes `{ latitude, longitude }` dari `activeAddress` ke preview API

## Tests (22 passing)

Updated `campaign.service.test.ts`:

- Haversine sanity: Jakarta→Jakarta ≈ 0, Jakarta→Bogor ≈ 40-60km, Jakarta→Surabaya ≈ 660-720km
- Free shipping: matches when destination inside zone
- Free shipping: rejects when destination outside
- Free shipping: OR logic — matches if ANY zone matches
- Free shipping: `regionScope=all` matches null destination
- Picks largest subsidy when multiple match

## Manual Test Path

1. `/admin/campaigns` → buat **Gratis Ongkir Jabodetabek**:
   - Type: Free Shipping, value: 30000 fixed, max: 30000, min order: 0
   - Region scope: **Zona radius**
   - Klik preset "+ Jabodetabek (50 km)" → muncul lingkaran di peta sekitar Jakarta
   - Save

2. Sebagai customer biasa:
   - Pick alamat di checkout (existing leaflet picker — auto save lat/lng)
   - Tergantung lokasi:
     - **Inside zona** (mis. Depok): summary muncul "Gratis Ongkir · Jabodetabek -Rp 30.000"
     - **Outside zona** (mis. Surabaya): tidak muncul, total ongkir penuh
   - Klik Bayar → RPC re-validate haversine → kalau cocok, insert `campaign_usages`, kalau tidak, raise "Alamat di luar wilayah gratis ongkir"

3. Verify DB:
   ```sql
   SELECT * FROM campaign_geo_zones WHERE campaign_id = '...';
   SELECT * FROM campaign_usages ORDER BY applied_at DESC LIMIT 5;
   ```

## Verification (all green)

```bash
pnpm --filter=@bananasbindery/core test         # 22/22 pass
pnpm --filter=@bananasbindery/core type-check   # PASS
pnpm --filter=@bananasbindery/api-client type-check  # PASS
pnpm --filter=web type-check                    # PASS
```

## Files Changed

**Created:**

- `supabase/migrations/20260517014634_campaign_geo_zones_v1.sql`
- `apps/web/components/admin/campaigns/GeoZoneMap.tsx`
- `apps/web/components/admin/campaigns/GeoZonePicker.tsx`

**Modified:**

- `packages/core/src/services/campaign.service.ts` (haversine + GeoZone)
- `packages/core/src/services/campaign.service.test.ts` (regenerated, 22 tests)
- `packages/api-client/src/campaigns.ts` (load geo_zones)
- `apps/web/app/api/campaigns/preview/route.ts` (lat/lng destination)
- `apps/web/lib/services/campaign-client.ts` (type)
- `apps/web/app/admin/campaigns/page.tsx` (load geo_zones)
- `apps/web/app/admin/campaigns/actions.ts` (parse geo zones JSON)
- `apps/web/components/admin/campaigns/types.ts` (GeoZone interface)
- `apps/web/components/admin/campaigns/CampaignEditor.tsx` (use GeoZonePicker)
- `apps/web/app/checkout/page.tsx` (pass destinationCoords)
- `packages/types/src/supabase.ts` (regenerated via MCP)
- Supabase DB (via MCP): RPC `create_order_v1` updated to use haversine

**Deleted:**

- `apps/web/components/admin/campaigns/RegionPicker.tsx`
- `apps/web/components/admin/campaigns/region-data.ts`
- DB table `campaign_regions`

## Revert Instructions

```sql
-- Via Supabase MCP execute_sql
DROP TABLE public.campaign_geo_zones CASCADE;
DROP FUNCTION public.haversine_km(NUMERIC, NUMERIC, NUMERIC, NUMERIC);
ALTER TABLE public.campaigns DROP COLUMN region_scope;
DROP TYPE campaign_region_scope;
```

```bash
git revert <commit>  # reverts code changes
```
