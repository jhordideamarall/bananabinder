# Biteship Fix & Supabase Audit Report

## Context

User reported issues with creating orders and simulating couriers in Biteship. The analysis identified missing geographical coordinates in the order creation payload, which are mandatory for `pickup` and `instant` delivery types.

## File Manifest

- `apps/web/app/api/payment/webhook/route.ts`: Updated `biteshipPayload` to include coordinates.
- `artifacts/biteship-fix-report.md`: This report.

## Surgical Breakdown

### `apps/web/app/api/payment/webhook/route.ts`

- **Change**: Added extraction of `origin_latitude`, `origin_longitude` from `store_settings` (with fallback to Toko Kelapa Dua `-6.2604822, 106.6296424`).
- **Change**: Added extraction of `destination_latitude`, `destination_longitude` from the order's shipping address.
- **Change**: Injected these coordinates into the `biteshipPayload` sent to `POST https://api.biteship.com/v1/orders`.
- **Rationale**: Biteship requires these coordinates for accurate pickup simulation and instant courier (Gojek/Grab) assignment.

## Supabase Audit

- **Verification**: Reviewed `supabase/migrations/20260505100000_shipping_cache_and_store_settings.sql`.
- **Finding**: The `store_settings` table correctly contains `origin_latitude` and `origin_longitude` columns.
- **Finding**: RLS policies for `store_settings` and `shipping_rates_cache` are correctly implemented (Admin manage, Public read).
- **Finding**: The `addresses` table schema was verified in `20260502154216_master_initial_schema_v3.sql` to have `latitude` and `longitude` columns.

## Validation

- **Type Check**: Ran `pnpm --filter web type-check` and it passed without errors.
- **Logic**: The payload now strictly adheres to the requirements specified in `artifacts/biteship-pickup-error-analysis.md` and confirmed via official documentation research.
