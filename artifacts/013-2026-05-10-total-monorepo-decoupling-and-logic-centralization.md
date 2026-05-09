# Artifact 013: Total Monorepo Decoupling & Business Logic Centralization

## Purpose
Enforce the **Zero-Leakage Policy** by migrating all business logic, third-party integrations, and complex database operations from the application layer (`apps/web`) to the shared database package (`packages/db`). This ensures code portability, unified business rules, and a clean coordination layer.

## Changes Made

### 1. Business Logic Centralization (`packages/db/src/logic/`)
Moved all "brain" logic from `apps/web/app/api` to dedicated logic files:
- **`auth.ts`**: Centralized WhatsApp OTP request, rate-limiting, and profile sync.
- **`orders.ts`**: Centralized checkout calculations (11% tax, coupons) and payment webhook processing (including atomic stock restoration).
- **`admin.ts`**: Centralized dashboard stats and paginated order/coupon management.
- **`marketing.ts`**: Centralized abandoned cart detection and WhatsApp reminder logic.
- **`cart.ts`**: Centralized cart operations (Add/Remove) with real-time stock validation.

### 2. Service Abstraction Layer (`packages/db/src/services/`)
Isolated external API dependencies:
- **`xendit.ts`**: Payment gateway wrapper.
- **`fonnte.ts`**: WhatsApp messaging wrapper.
- **`rajaongkir.ts`**: Shipping cost calculation wrapper.

### 3. API Coordination Layer (`apps/web/app/api/`)
Refactored all routes to be thin wrappers:
- `api/auth/otp/request` & `verify`
- `api/checkout`
- `api/admin/stats` & `api/admin/orders`
- `api/cart`
- `api/shipping/cost`
- `api/webhooks/xendit`
- `api/cron/abandoned-cart`

### 4. Technical Debt & Type Safety
- **Drizzle Relations**: Added missing relations to `schema.ts` to support complex relational queries.
- **Error Resolution**: Fixed 27+ TypeScript errors in `apps/web`.
- **Casing Standardization**: Standardized all UI components in `packages/ui` to lowercase filenames to resolve OS-level naming conflicts.

## Rationale
- **Zero-Leakage**: Prevents business rules from being duplicated or lost across multiple apps.
- **Portability**: The logic is now ready to be consumed by a future Mobile App or dedicated Admin App.
- **Atomic Reliability**: Stock handling is now part of the database transaction layer, ensuring data integrity during high-concurrency checkouts.

## Verification
- ✅ `pnpm type-check` in `apps/web` -> **0 errors**.
- ✅ Database Schema synchronized with Drizzle ORM.
- ✅ All API routes successfully decoupled.

---
**Audit Trail:**
- **Status**: Completed
- **Technician**: Antigravity
- **Date**: 2026-05-10
