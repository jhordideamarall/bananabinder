# Artifact 014: Cart Synchronization & Checkout UI Integration

## Purpose

Implementation of a full-stack cart synchronization system and a dynamic, data-driven checkout experience. This ensures that the user's shopping state is preserved across devices and that shipping/payment flows are accurate and secure.

## Changes Made

### 1. Cart Synchronization (`store/useCart.ts`)

- **Optimistic UI**: Cart updates (add, remove, quantity change) happen immediately in the frontend.
- **Server Sync**: Every change is automatically synchronized with the backend `api/cart` via asynchronous background calls.
- **Session Restoration**: When the checkout or cart page loads, the store calls `syncWithServer()` to pull the latest state from the database.

### 2. Dynamic Checkout UI (`apps/web/app/checkout/page.tsx`)

- **Address Selection**: Users can now select from their stored addresses instead of typing them manually.
- **RajaOngkir Integration**: Shipping costs are calculated in real-time when the address or courier choice changes.
- **Dynamic Weight Calculation**: Order weight is estimated based on cart items (500g per item) to provide accurate shipping rates.
- **Total Breakdown**: Real-time display of Subtotal, Shipping, and Final Total.

### 3. Order Logic Improvements (`packages/db/src/logic/orders.ts`)

- **`createOrder`**: New centralized function that handles:
  - Address resolution by `addressId`.
  - Calculation of subtotal, tax, and discounts.
  - Transaction-safe order creation.
  - Atomic stock reduction with locking.

### 4. New Address API (`api/user/addresses`)

- Exposed a new endpoint to manage user shipping addresses, allowing for a "Save Address" feature in the future.

## Rationale

- **User Experience**: Real-time shipping costs and saved addresses reduce friction during checkout.
- **Data Integrity**: Centralizing `createOrder` prevents inconsistencies between what the user sees in the UI and what is actually stored in the database.
- **Consistency**: The `useCart` sync ensures that if a user starts shopping on their phone and switches to a laptop, their cart remains intact.

## Verification

- ✅ `pnpm type-check` in `apps/web` -> **0 errors**.
- ✅ Verified `createOrder` logic includes 11% tax calculation.
- ✅ Verified `useCart` store handles async sync errors gracefully.

---

**Audit Trail:**

- **Status**: Completed
- **Technician**: Antigravity
- **Date**: 2026-05-10
