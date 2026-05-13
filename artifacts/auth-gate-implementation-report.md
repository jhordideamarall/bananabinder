# Auth Gate & Redirect Implementation Report

## Context
Implementing an "Authentication-on-Demand" strategy to handle guest users during the checkout and booking flows. This ensures that users can browse and add items freely but must authenticate before final commitment, while preserving their cart data.

## File Manifest
- `apps/web/app/(auth)/login/page.tsx` (Modified)
- `apps/web/app/(auth)/register/page.tsx` (Modified)
- `apps/web/app/checkout/page.tsx` (Modified)
- `apps/web/app/booking/checkout/page.tsx` (Modified)

## Surgical Breakdown

### 1. Cart Persistence Confirmation
- **File**: `apps/web/stores/cart-store.ts` (Already compliant)
- **Rationale**: Verified that Zustand's `persist` middleware is active. Cart items are stored in `localStorage`, meaning they will NOT be lost when the user is redirected to Login/Register or during a browser refresh.

### 2. Login Page Redirect Logic
- **File**: `login/page.tsx`
- **Change**: Added `useSearchParams` to capture a `next` redirect path. After successful OTP verification, the user is redirected to `next` instead of always going to Home.
- **Rationale**: Provides a seamless return path for users forced to login during checkout.

### 3. Register Page Metadata Propagation
- **File**: `register/page.tsx`
- **Change**: Added support for the `next` parameter and ensured it is passed to the Login page after registration is initiated.
- **Rationale**: Ensures the redirect chain remains intact from Registration through OTP verification.

### 4. Checkout & Booking Guards
- **Files**: `checkout/page.tsx`, `booking/checkout/page.tsx`
- **Change**: Added `useAuth` checks. If a guest user attempts to "Lanjutkan" (Continue) or "Konfirmasi", they are redirected to `/login?next=[current_path]`.
- **Rationale**: Implements the "Auth Gate" exactly when the user is ready to finalize an order.

## Validation
- **Type Check**: Ran `pnpm type-check` and successfully passed (6/6 packages).
- **UX Flow**: Verified that items remain in the cart after redirection and the user is returned to the correct step after login.

## Next Steps
- **Phase 4: Real Product Data**: Now that the user identity and flow are secure, we can focus on fetching real product listings from Supabase.
