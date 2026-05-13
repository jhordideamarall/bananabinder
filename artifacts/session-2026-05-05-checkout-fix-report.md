# Audit Trail: Checkout & Payment Initialization Fix
**Date**: 2026-05-05
**Task**: Resolving `ReferenceError` in Payment API and `22P02` (UUID mismatch) in Order Creation.

## Context
The checkout process was failing at two critical points:
1. The payment initialization API (`/api/payment/create`) failed due to a scoped `authString` variable being undefined during the Xendit fetch call.
2. The order creation RPC (`create_order_v1`) failed because the frontend was sending non-UUID strings for address and product IDs.

## File Manifest
- [MODIFY] `apps/web/app/api/payment/create/route.ts`
- [MODIFY] `apps/web/components/checkout/address-sheet.tsx`
- [MODIFY] `apps/web/app/checkout/page.tsx`

## Surgical Breakdown

### 1. `apps/web/app/api/payment/create/route.ts`
- **Change**: Moved `authString` declaration to the top of the `POST` handler scope.
- **Rationale**: Ensured that the Basic Auth string is always available for the fetch request to Xendit, regardless of conditional logic branches.

### 2. `apps/web/components/checkout/address-sheet.tsx`
- **Change**: Replaced temporary ID generation (`'new-' + Date.now()`) with a `select().single()` call after the Supabase `insert`.
- **Rationale**: The database strictly requires a UUID for the `address_id` foreign key. Using the database-generated UUID ensures referential integrity.

### 3. `apps/web/app/checkout/page.tsx`
- **Change**: Implemented `validateUUID` helper and added pre-mutation checks for all IDs.
- **Rationale**: Prevented "dummy" products (with simple numeric IDs like "2") from reaching the database, providing user-friendly error messages instead of generic PostgreSQL errors.

## Validation Results
- **Type Safety**: `npx tsc --noEmit` passed with 0 errors.
- **Linter**: `npx eslint` passed with 0 errors. Fully compliant with "ZERO ANY" policy.
- **Manual Test**: Order creation confirmed via screenshot showing multiple successful entries in "Pesanan Saya".
- **Payment Flow**: Verified that Xendit invoices are correctly generated and linked to the orders.
- **UI/UX**: Error handling now gracefully informs the user if they are using incompatible test data.

## Status: VERIFIED SUCCESSFUL & BUILD-SAFE ✅
