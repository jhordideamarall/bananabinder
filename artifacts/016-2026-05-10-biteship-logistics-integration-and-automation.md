# Artifact 016: Biteship Integration & Logistics Core

## Purpose

Complete migration from RajaOngkir to Biteship to enable advanced logistics features: **Auto Pickup**, **Airway Bill (AWB) Generation**, and **Real-time Cross-Courier Tracking**.

## Core Components

### 1. Biteship Service (`packages/db/src/services/biteship.ts`)

Unified wrapper for the Biteship API:

- `getBiteshipRates`: Fetches real-time prices for JNE, J&T, Sicepat, etc.
- `createBiteshipOrder`: Books the courier and generates the AWB.
- `searchBiteshipAreas`: Essential for mapping addresses to Biteship's delivery network.

### 2. Automated Logistics Flow

- **Auto Pickup**: Integrated into `packages/db/src/logic/admin.ts`. Admin can trigger a pickup request with a single click.
- **Dynamic Rates**: Checkout UI now displays the exact price and duration provided by Biteship, including various service levels (Regular, Next Day, etc.).

### 3. Schema Changes (`packages/db/src/schema.ts`)

- **`addresses.biteship_area_id`**: Stores the unique subdistrict ID required by Biteship.
- **`orders.biteship_order_id`**: Links the internal order to the Biteship booking.
- **`orders.biteship_tracking_url`**: Stores the official tracking link for the customer.

## Refactored Codebases

- **`apps/web/app/api/shipping/cost/route.ts`**: Now fully powered by Biteship logic.
- **`apps/web/app/checkout/page.tsx`**: Updated UI to handle multiple courier rates and store detailed metadata during checkout.

## How to Test

1. Set `BITESHIP_API_KEY` in `.env`.
2. Set `BITESHIP_ORIGIN_AREA_ID` (Origin warehouse area).
3. Proceed to Checkout -> Select Address (must have Area ID) -> Choose Courier -> Pay.
4. Admin Dashboard -> Select Order -> Click "Request Pickup".

---

**Audit Trail:**

- **Status**: Production Ready
- **Technician**: Antigravity
- **Date**: 2026-05-10
