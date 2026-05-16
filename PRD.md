# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Bananasbindery Binder & Photo-Product Commerce Platform

---

## 1. Product Overview

Bananasbindery adalah platform e-commerce untuk menjual binder, photocard organizer, refill paper, custom-name binder, dan gift-ready bundle.

Scope aktif project:

- Katalog produk binder/photo-product dari asset aktual di folder `assets/`
- Variant produk: cover color, paper type, ring size, size A5/A6/mini, custom text
- Cart, checkout, shipping, payment, order history, wishlist
- Payment via Xendit
- Shipping via Biteship
- Admin untuk products, orders, promos, stock, dan visibility financial
- Loyalty/reorder untuk repeat purchase refill/binder

Out of scope:

- Deprecated service modules from the copied source project
- Midtrans sebagai provider utama
- Logic bisnis yang tinggal di komponen UI

---

## 2. Goals

1. Customer bisa browse, search, filter, dan beli produk binder dengan cepat.
2. Checkout aman: stock lock, voucher, ongkir, dan pembayaran konsisten.
3. Owner/Admin punya dashboard untuk produk, stok, order, promo, revenue, HPP, dan profit.
4. Codebase bersih dari deprecated source-project modules di public app/package API.
5. Shared logic bisa dipakai ulang untuk web dan future mobile.

---

## 3. Users & Roles

| Role     | Akses                                                          |
| -------- | -------------------------------------------------------------- |
| Customer | Browse, cart, checkout, wishlist, order history, loyalty       |
| Staff    | View/update orders dan fulfillment                             |
| Admin    | Manage products, variants, stock, orders, promos, banners      |
| Owner    | Semua akses admin + financial dashboard, analytics, audit logs |

---

## 4. Core Modules

### 4.1 Catalog & Product Discovery

- Product listing with search/filter/sort
- Product detail with image carousel, description, variants, review summary
- Categories: binder, photocard organizer, refill, custom, bundle
- Product SEO: slug, meta title, meta description, OpenGraph
- Assets sourced from real product images in `assets/`

### 4.2 Product Variants

Required variant dimensions:

- Cover color
- Paper/refill type
- Ring size / binder size
- Custom name/text note
- Stock and price override per variant when needed

### 4.3 Cart & Checkout

- Persistent cart
- Guest-to-auth handoff should not lose cart
- Address selection/creation
- Biteship shipping rates
- Voucher/promo application
- Xendit invoice creation
- Internal absorbed-tax accounting without changing UX total unexpectedly

### 4.4 Payment

Provider: Xendit.

Supported methods:

- QRIS
- E-wallet
- Virtual Account
- Cards where enabled by Xendit

Rules:

- Payment webhook is source of truth for paid/expired state.
- Webhook events must be idempotent.
- Unpaid orders auto-expire and release inventory.

### 4.5 Shipping & Fulfillment

Provider: Biteship.

Rules:

- Rate calculation uses weight/dimensions and destination area/coordinates.
- Order can create Biteship fulfillment after payment success.
- Admin can update shipping status, tracking number, and internal notes.
- Fallback item copy must always refer to binder/photo-product, not pet products.

### 4.6 Inventory

- Stock per product and variant
- Low-stock alerts
- Stock movement history: in/out/adjustment/return
- Overselling prevention via database transaction/RPC lock
- Bundle weight and stock composition must be explicit

### 4.7 Promo & Loyalty

- Strikethrough price
- Voucher/coupon code
- Flash/campaign promo
- Points earned from purchase
- Reorder/refill prompts for repeat customer

### 4.8 Admin & Owner Dashboard

Admin features:

- Product CRUD
- Variant/stock update
- Order management
- Fulfillment and resi management
- Voucher/promo management
- Banner/CMS management

Owner metrics:

- Gross revenue
- Net revenue
- HPP/COGS
- Gross profit and net profit
- AOV
- Repeat order rate
- Revenue by category and period
- Top selling products
- Stock alerts

---

## 5. User Flows

### Purchase

```txt
browse/search -> product detail -> choose variant/custom note -> add to cart -> checkout
-> select address -> select shipping -> apply voucher -> Xendit payment
-> payment webhook -> admin process -> shipped -> delivered -> review
```

### Reorder / Refill

```txt
order history -> reorder/refill -> cart -> checkout -> payment -> confirmation
```

### Custom Binder

```txt
product detail -> choose variant -> fill custom text/notes -> add to cart -> checkout
```

---

## 6. Non-Functional Requirements

- Performance: storefront page load < 3s on common mobile network
- Security: Supabase RLS, server-side validation, rate limiting for sensitive APIs
- Type safety: strict TypeScript, zero `any`
- Portability: business logic in `packages/core`; API wrappers in `@bananasbindery/api-client`
- Accessibility: semantic HTML, clear focus state, mobile-first UX
- Observability: logs for webhook/payment/shipping failures

---

## 7. Data Model Summary

Core tables expected by active product scope:

- users / profiles
- addresses
- categories
- products
- product_variants
- product_images
- carts
- cart_items
- orders
- order_items
- payments / transactions
- shipping_quotes / shipments
- vouchers / coupons
- loyalty_points / loyalty_history
- wishlists
- reviews
- banners
- stock_movements
- webhook_events

Historical source-project tables should not be used by active app code. If live DB cleanup is needed, do it only through explicit migration and regenerated Supabase types.

---

## 8. Tech Stack

- Monorepo: Turborepo + pnpm
- Web: Next.js App Router + TypeScript
- Styling: Tailwind CSS + Framer Motion
- Backend/Data: Supabase PostgreSQL + Auth + Storage + Edge Functions where needed
- Payment: Xendit
- Shipping: Biteship
- Shared packages: `types`, `core`, `api-client`, `store`, `utils`, `ui`, `config`

---

## 9. SEO & AI Visibility

- Product pages must use SEO-friendly slugs.
- Category pages should target buyer intent keywords: binder photocard, binder aesthetic, refill binder A5/A6, custom-name binder, gift binder.
- Structured data should use Store/Product/FAQ schema, not PetStore schema.
- Social/search content should focus on product education, collection care, personalization, gift bundles, packing proof, and shipping trust.

---

## 10. Success Metrics

| Metric                             | Target                                                     |
| ---------------------------------- | ---------------------------------------------------------- |
| Checkout success rate              | > 90% after payment provider redirects                     |
| Stock overselling                  | 0 critical incidents                                       |
| Payment webhook duplicate handling | idempotent, no duplicate order transition                  |
| Repeat order rate                  | 30%+ long term                                             |
| AOV                                | Rp 150.000+ target after bundle strategy                   |
| Admin order processing visibility  | order status, payment, shipping, resi visible in dashboard |

---

## 11. Risk Register

| Risk                                           | Severity | Mitigation                                                         |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------ |
| Payment webhook duplicate/missing event        | High     | idempotent webhook_events + reconciliation logs                    |
| Stock overselling                              | High     | database RPC lock and inventory release on expiry                  |
| Biteship env missing in development            | Medium   | fail gracefully with clear error, no hard crash                    |
| Deprecated source-project modules reintroduced | Medium   | artifact/docs cleanup, active scan, generated DB types regen later |
| Product asset mismatch                         | Medium   | catalog audit against `assets/` before final launch                |

---

## 12. Final Scope Statement

Bananasbindery is a binder/photo-product commerce platform. All future work should prioritize product catalog, variants, cart, checkout, Xendit payment, Biteship shipping, stock, promo, admin, and owner visibility.
