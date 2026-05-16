# PLAN — Bananasbindery Binder Commerce (Web First)

## Context

Project aktif adalah e-commerce binder/photo-product. Fokus web-first: storefront binder, catalog variants, cart, checkout, Xendit payment, Biteship shipping, admin products/orders/promos, dan owner visibility.

---

## Backend Strategy

| Phase     | Backend Layer                                                                        | Alasan                                                  |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Phase 0-4 | Supabase-direct via Next.js Server Components + Route Handlers                       | Speed; RLS; SEO storefront                              |
| Phase 5   | Hybrid server handlers/RPC for checkout, payment webhook, shipping, admin operations | Critical operations need validation, idempotency, audit |
| Phase 6+  | Future standalone API if mobile/desktop scale requires it                            | Shared API client remains portable                      |

---

## Target Structure

```txt
bananabinder/
├── apps/web/
│   ├── app/
│   │   ├── (shop)/                 # home, products, categories, search, cart
│   │   ├── (account)/              # account, orders, addresses, loyalty, wishlist
│   │   ├── (auth)/                 # login, register, callback
│   │   ├── checkout/               # checkout and success
│   │   ├── admin/                  # dashboard, products, orders, promos
│   │   └── api/                    # webhooks, shipping, admin, payment routes
│   ├── components/
│   ├── lib/
│   └── public/
├── packages/
│   ├── api-client/
│   ├── core/
│   ├── store/
│   ├── types/
│   ├── ui/
│   ├── utils/
│   └── config/
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── functions/
├── assets/
└── artifacts/
```

---

## Milestones

### Phase 0 — Foundation & Tooling

- pnpm workspace + Turborepo
- strict TypeScript
- shared packages scaffold
- Next.js web app
- CI-friendly scripts

### Phase 1 — Database Foundation

- Supabase schema for users, addresses, products, variants, carts, orders, payments, shipping, promos, loyalty, banners, stock movements, webhook events
- RLS policies
- generated Supabase types
- product asset/seed alignment

### Phase 2 — Design System & Layout

- mobile-first layout
- polished Salmon-Orange brand aesthetic
- header/search/bottom nav/cart entry
- product cards/category chips/price tags
- SEO base, sitemap, robots

### Phase 3 — Catalog & Product Discovery

- home storefront from active binder catalog
- product listing/search/filter/sort
- product detail with variants and images
- wishlist/reviews foundation

### Phase 4 — Cart & Checkout

- persistent cart
- address selection
- Biteship rate selection
- voucher/pricing calculation
- Xendit payment invoice
- order success/status view

### Phase 5 — Production Hardening

- idempotent Xendit webhooks
- inventory lock/release RPC
- Biteship fulfillment lifecycle
- error handling for missing envs
- audit logs for critical operations

### Phase 6 — Admin & Owner Visibility

- admin dashboard
- products CRUD
- orders and fulfillment management
- promo/voucher management
- stock and financial metrics

### Phase 7 — SEO & AI Visibility

- binder/product-category landing pages
- Product/Store/FAQ structured data
- local and product intent content strategy
- Instagram/social search alignment

### Phase 8 — QA & Launch

- type-check/lint/build
- checkout smoke test
- webhook and shipping sandbox/live readiness
- mobile viewport QA
- rollback notes and launch checklist

---

## Active Constraints

- Do not reintroduce deprecated source-project service modules.
- Do not alter polished UI unless explicitly requested.
- Every code change must be documented in `artifacts/`.
- Use specific types; no `any`.
- Generated Supabase types should be regenerated after DB cleanup rather than manually edited.
