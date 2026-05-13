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

## Phase 2: UI/UX Vision (Completed ✅)

- **Primary Reference**: `user-flow.html` (Blueprints for clean mobile design).
- **Core Focus**: High-conversion mobile-first checkout flow.
- **Animation Signature**:
  - Smooth "bounce" effect for "Add to Cart".
  - Scale-pop for cart badges.
  - Framer Motion (LazyMotion) setup complete in providers.
- **UI Components**: Built in `apps/web/components/shared` (ProductCard, PriceTag, RatingStars, EmptyState, Skeleton, CategoryChip, ProductGrid).
- **Layout Components**:
  - `Header`: Liquid glass (backdrop-blur), logo + paw icon, account/bell/cart icons.
  - `BottomNav`: Liquid glass, 4 tabs (Home, Produk, Booking, Akun). Cart is in header.
  - `Footer`: Dark theme, shop links, account links, location, payment methods, copyright.
- **Route Skeleton**: All Phase 2 routes in place:
  - Shop: `/`, `/products`, `/products/[slug]`, `/categories/[slug]`, `/search`
  - Auth: `/login`, `/register`, `/forgot-password`
  - Account: `/account`, `/orders`, `/pets`, `/addresses`, `/loyalty`, `/wishlist`
  - Checkout: `/cart`, `/checkout`, `/checkout/success`
  - Booking: `/booking`, `/booking/grooming`, `/booking/hotel`
- **SEO**: metadata, OpenGraph (id_ID, website type), sitemap.ts, robots.ts
- **Error/Loading**: Per-route-group loading.tsx and error.tsx for (shop), (auth), (account)
- **Toast**: Sonner configured in Providers

## Technical Notes

- Web read: Direct Supabase RSC.
- Web write: Planned for NestJS API (Phase 5).
- Shared logic: Keep `@bananasbindery/core` and `@bananasbindery/utils` pure JS/TS for React Native compatibility.

---

_Dokumen ini adalah duplikat dari AI Memory untuk rujukan visual di editor._
