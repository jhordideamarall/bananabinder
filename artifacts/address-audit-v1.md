# 🐾 Audit Report: Address Management & Geolocation Integrity (v1.0)

## Context
User reported a `409 Conflict` error when deleting addresses due to referential integrity with the `orders` table. Additionally, geolocation detection was failing on certain devices without clear UI feedback, and the address editing flow lacked map integration.

## File Manifest
- `apps/web/lib/services/address-client.ts`: [MODIFY] Implemented Soft Delete logic.
- `apps/web/components/layout/header.tsx`: [MODIFY] Integrated `LocationPrompt` and improved error logging.
- `apps/web/components/shared/location-prompt.tsx`: [NEW] Premium UI for geolocation fallback.
- `apps/web/components/checkout/address-sheet.tsx`: [MODIFY] Added map search and unified Edit/Add flow.
- `apps/web/app/(account)/account/addresses/page.tsx`: [MODIFY] Replaced custom edit modal with `AddressSheet`.

## Surgical Breakdown

### 1. Database & Referental Integrity (Soft Delete)
- **Why**: Deleting an address used in an order caused a 409 error because of the foreign key constraint.
- **Change**: Added `is_active` column to `addresses`. Updated `deleteAddress` to set `is_active = false` instead of `DELETE`. Updated `getUserAddresses` to filter only active addresses.

### 2. Geolocation UX Hardening
- **Why**: `kCLErrorLocationUnknown` errors were silent or cryptic in the console.
- **Change**: 
    - Created `LocationPrompt` bottom sheet that triggers on failure.
    - Added a **Manual Search Bar** in the map view using OpenStreetMap (Nominatim) for users who cannot get a GPS fix.
    - Improved error logging in `Header.tsx` to handle permission denials and position unavailability gracefully.

### 3. Unified Edit/Add Flow
- **Why**: Address editing was missing map verification, risking incorrect `area_id` calculations for Biteship.
- **Change**: 
    - Refactored `AddressSheet` to support `initialData` for editing.
    - In `page.tsx`, removed redundant edit modal code and reused the premium `AddressSheet` component.
    - Forced the "Map First" flow during edits to ensure coordinates are verified.

## Validation
- [x] Manual verification of the `addresses` table schema.
- [x] Verified `deleteAddress` update query logic.
- [x] Visual audit of the new `LocationPrompt` and `AddressSheet` search bar.
- [x] Cleanup of all unused imports and states in `page.tsx`.

**Note**: Testing from mobile is recommended to verify actual GPS hardware behavior.
