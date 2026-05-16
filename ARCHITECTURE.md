# MONOREPO ARCHITECTURE — Bananasbindery Binder Commerce

Arsitektur monorepo dengan shared core agar business logic dan API client bisa dipakai ulang di Web, future Mobile, dan future Desktop.

---

## Tech Foundation

| Layer                 | Tool                             |
| --------------------- | -------------------------------- |
| Monorepo              | Turborepo                        |
| Package Manager       | pnpm workspaces                  |
| Language              | TypeScript strict                |
| Web                   | Next.js App Router               |
| Database/Auth/Storage | Supabase                         |
| Payment               | Xendit                           |
| Shipping              | Biteship                         |
| State                 | Zustand                          |
| UI                    | Tailwind CSS + shared UI package |

---

## Active Product Scope

- Binder/photo-product storefront
- Product catalog, variants, stock, cart, checkout
- Xendit payment lifecycle
- Biteship shipping lifecycle
- Admin products/orders/promos
- Owner metrics and stock visibility

Deprecated service modules from the copied source project are not part of active architecture.

---

## Folder Structure

```txt
bananabinder/
├── apps/
│   └── web/                         # Next.js customer + admin routes
│       ├── app/
│       │   ├── (shop)/              # storefront, products, categories, cart
│       │   ├── (auth)/              # login/register/callback
│       │   ├── (account)/           # account, orders, addresses, loyalty, wishlist
│       │   ├── checkout/            # checkout flow
│       │   ├── admin/               # dashboard, products, orders, promos
│       │   └── api/                 # route handlers/webhooks
│       ├── components/              # web-specific composition components
│       ├── lib/                     # app-local helpers/adapters
│       └── public/
│
├── packages/
│   ├── api-client/                  # API/Supabase/3rd-party wrappers
│   ├── core/                        # pricing, cart, shipping, stock, promo logic
│   ├── store/                       # shared Zustand state
│   ├── types/                       # domain + generated Supabase types
│   ├── ui/                          # shared UI primitives
│   ├── utils/                       # format, slug, order number, validation
│   └── config/                      # env/constants
│
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── functions/
│
├── assets/                          # source product assets
├── artifacts/                       # audit trail for Binder-era work
├── claudeplan/                      # roadmap docs
├── PRD.md
├── CLAUDE.md
└── README.md
```

---

## Monorepo Integrity Rules

1. Core calculations and business rules live in `packages/core`.
2. Supabase RPC and 3rd-party calls are wrapped in `@bananasbindery/api-client` or app-local server helpers.
3. Shared cart/user/settings state belongs in `packages/store`.
4. UI primitives live in `packages/ui`; `apps/web` composes product/page-specific blocks.
5. Avoid direct reusable imports from `@/lib/supabase/server`; reusable logic receives a client parameter or uses an adapter.
6. Zero `any`: use specific interfaces or `unknown` with type guards.

---

## Shared Package Responsibilities

| Package                      | Responsibility                                                   |
| ---------------------------- | ---------------------------------------------------------------- |
| `@bananasbindery/types`      | Domain types and generated Supabase DB types                     |
| `@bananasbindery/core`       | Pricing, discount, tax, cart, shipping, inventory, voucher logic |
| `@bananasbindery/api-client` | Xendit, Biteship, Supabase RPC and app API wrappers              |
| `@bananasbindery/store`      | Cart/UI/auth state usable by web/future mobile                   |
| `@bananasbindery/utils`      | Formatting, slug, validation, order number helpers               |
| `@bananasbindery/ui`         | Button, Card, Badge, PriceTag, inputs, primitives                |
| `@bananasbindery/config`     | Shared constants and env schema                                  |

---

## Dependency Direction

```txt
apps/web -> packages/ui
apps/web -> packages/store
apps/web -> packages/core
apps/web -> packages/api-client
packages/api-client -> packages/types
packages/core -> packages/types + packages/utils
packages/store -> packages/types
```

Rules:

- Shared packages must not import from `apps/web`.
- UI package must not contain business logic.
- Core package must stay platform-agnostic.
- API client can wrap network/service calls but should not render UI.

---

## Critical Runtime Flows

### Checkout

```txt
cart -> address -> shipping quote -> voucher/pricing -> create order RPC -> Xendit invoice -> payment redirect
```

### Payment Webhook

```txt
Xendit webhook -> verify token -> record webhook_events -> idempotent status transition -> transaction record -> inventory/payment/order update -> optional shipment creation
```

### Shipping

```txt
destination area -> Biteship rates -> customer selects courier -> paid order -> Biteship order/fulfillment -> tracking update
```

### Admin Product/Order

```txt
role guard -> admin server helper -> product/order CRUD -> audit-friendly artifact log for code changes
```

---

## Database Domains

Active DB domains:

- users/profiles
- addresses
- categories/products/product_variants/product_images
- carts/cart_items
- orders/order_items/transactions
- shipping/shipments
- vouchers/promos/loyalty
- reviews/wishlists
- banners/CMS
- stock_movements
- webhook_events

Historical tables from the copied project must not be used by active app code. Drop/cleanup only via explicit migration after owner approval and regenerate `packages/types/src/supabase.ts` afterward.

---

## Build Safety

- Env-dependent services must fail gracefully during build/static optimization.
- Do not use non-null env assertions for clients initialized at import time.
- Route handlers must return typed errors and should not expose secrets.
- Validation before done: `pnpm type-check`; lint/build when practical.
