# Bananasbindery Project Memory (Knowledge Base)

## Phase 0: Infrastructure (Completed)

- Monorepo set up with Turborepo, pnpm, and Next.js 15.
- Brand theme: Orange/Peach (oklch).
- Custom fonts: Inter (sans) and Outfit (heading).
- CI/CD: Husky, commitlint, and GitHub Actions configured.

## Phase 1: Database Foundation (Completed)

- 26 Tables: Fully aligned with PRD §15 (E-comm, Booking, Loyalty, Audit).
- Consolidated Schema: Merged into `master_initial_schema_v3.sql` for absolute consistency.
- Roles: Owner, Admin, Staff, Customer (enforced via granular RLS).
- Automations: Auth-Sync trigger, Rating-Sync trigger (FIXED for DELETE), Fuzzy Search.

## 🧠 Engineering Lessons Learned

1. **Consolidate Early**: Don't use contradictory `IF NOT EXISTS` migrations; one master source is better for Day 1.
2. **Defensive SQL**: Always use `CASE/WHEN` for safe enum casting and handle `OLD` records in triggers.
3. **1:1 Alignment**: TypeScript enums and DB enums must match character-by-character.
4. **Scoped Storage**: Keep upload permissions bucket-specific from the start.

## Phase 2: UI/UX Vision (Current)

- **Primary Reference**: `user-flow.html` (Blueprints for clean mobile design).
- **Core Focus**: High-conversion mobile-first checkout flow.
- **Animation Signature**:
  - Smooth "bounce" effect for "Add to Cart".
  - Scale-pop for cart badges.
  - Framer Motion for spring physics and premium transitions.
- **UI Components**: To be built in `packages/ui` using shadcn/ui and Tailwind v4.

## Technical Notes

- Web read: Direct Supabase RSC.
- Web write: Planned for NestJS API (Phase 5).
- Shared logic: Keep `@bananasbindery/core` and `@bananasbindery/utils` pure JS/TS for React Native compatibility.

---

_Dokumen ini adalah duplikat dari AI Memory untuk rujukan visual di editor._
