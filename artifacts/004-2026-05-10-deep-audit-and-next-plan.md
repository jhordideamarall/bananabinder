# 2026-05-10 — Deep Audit & Next Plan

## Status Summary

Project **Bananasbindery** has a very strong foundation. The monorepo structure is clean, documentation is thorough, and database migrations are prepared. However, the database is currently empty and the application layer (auth, logic) hasn't been started.

## Codebase Audit

### 1. Monorepo Integrity
- ✅ **Zero-Leakage Policy**: Packages are correctly separated. `packages/db` and `packages/ui` are ready.
- ✅ **Service Portability**: `createSupabaseClient` is abstracted in `packages/db`.
- ✅ **Package Boundaries**: Workspace dependencies are correctly mapped.

### 2. Component Checklist
| Component | Status | Notes |
|-----------|--------|-------|
| Turborepo | ✅ Complete | Build & Dev pipelines verified. |
| `packages/ui` | ⚠️ Minimal | Only `Button` component exists. Needs Shadcn primitives. |
| `packages/db` | ⚠️ Skeleton | Client exists, but types are placeholders. |
| `apps/web` | ⚠️ Skeleton | Basic Next.js setup. No logic or routes implemented. |
| Supabase | ⚠️ Pending | Project created but tables are empty. |

### 3. Database Schema
- ✅ Migration files `001-007` are well-structured.
- ✅ RLS policies are included in migrations.
- ✅ Atomic RPCs (`reduce_stock`, `validate_coupon`) are ready in `006_functions.sql`.

## Next Plan

### Phase A: Database Activation
1. **Apply Migrations**: Push `supabase/migrations/001-007` to the live project.
2. **Generate Types**: Sync TypeScript types to `packages/db/src/types.ts`.
3. **Seed Data**: Run `supabase/seed.sql` to have products to work with.

### Phase B: Auth & Core Logic (Phase 2)
1. **WhatsApp OTP Implementation**:
   - Add `crypto` logic for OTP hashing in `packages/db`.
   - Implement `/api/auth/otp/request` and `/api/auth/otp/verify`.
   - Setup Fonnte integration.
2. **UI Kit Expansion**:
   - Port common Shadcn components (Input, Card, Badge, Toast, Dialog) to `packages/ui`.

### Phase C: Storefront Development (Phase 3)
1. Build Product Listing Page (PLP) with category filters.
2. Build Product Detail Page (PDP) with variant selection.

---

## Technical Debt / Risks
- **Fonnte API Key**: Need to ensure this is set in `.env`.
- **RajaOngkir Pro**: Perhitungan ongkir level kecamatan butuh API key Pro.
- **Xendit**: Webhook integration needs a public URL (tunneling for local dev).
