# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Bananasbindery Binder & Photo-Product Commerce Platform

---

## 1. Product Overview

Bananasbindery adalah platform e-commerce untuk menjual binder, photocard organizer, refill paper, custom-name binder, dan gift-ready bundle.

Scope aktif project:

- Katalog produk binder/photo-product dari asset aktual di folder `assets/`
- Variant produk: cover color, paper type, ring size, size A5/A6/mini, custom text
- Cart, checkout, shipping, payment, order history, wishlist
- Payment via COD and manual transfer: static QR, multi-rekening, upload bukti transfer
- Shipping rates via Biteship
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
- Guest checkout uses an anonymous Supabase session so orders can be created without OTP
- If anonymous checkout is unavailable, email/password login handoff must not lose cart
- Address selection/creation
- Biteship shipping rates
- Voucher/promo application
- COD payment choice
- Manual transfer instructions, selected QR/rekening, and proof upload
- Internal absorbed-tax accounting without changing UX total unexpectedly

### 4.4 Payment

Provider utama: COD dan manual transfer.

Supported methods:

- Static QR / QRIS image configured by admin
- Multiple active bank/e-wallet accounts configured by admin
- Customer upload bukti transfer after final total is shown
- Admin approve/reject proof from order detail
- COD / bayar di tempat

Rules:

- COD orders stay pending/unpaid until admin receives payment and updates the order.
- Admin approval is source of truth for paid state on new checkout orders.
- Approval creates a manual-transfer transaction and marks order paid.
- Rejected proof keeps order pending and allows customer re-upload.
- Unpaid manual orders can be expired to release inventory and reverse promo usage.
- Legacy Xendit routes remain readable/usable for older orders only.

### 4.5 Shipping & Fulfillment

Provider: Biteship rates.

Rules:

- Rate calculation uses weight/dimensions and destination area/coordinates.
- New checkout uses Biteship only to quote shipping rates; fulfillment is handled operationally by admin.
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
-> select address -> select shipping -> apply voucher -> choose COD or manual transfer
-> COD order pending or upload bukti -> admin processes order -> shipped -> delivered -> review
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
- Payment: COD and manual transfer with static QR, multi-rekening, and proof verification
- Shipping: Biteship rates
- Shared packages: `types`, `core`, `api-client`, `store`, `utils`, `ui`, `config`

---

## 9. SEO & AI Visibility

- Product pages must use SEO-friendly slugs.
- Category pages should target buyer intent keywords: binder photocard, binder aesthetic, refill binder A5/A6, custom-name binder, gift binder.
- Structured data should use Store/Product/FAQ schema, not PetStore schema.
- Social/search content should focus on product education, collection care, personalization, gift bundles, packing proof, and shipping trust.

---

## 10. Success Metrics

| Metric                              | Target                                                      |
| ----------------------------------- | ----------------------------------------------------------- |
| Checkout success rate               | > 90% through COD or proof upload and order detail redirect |
| Stock overselling                   | 0 critical incidents                                        |
| Manual payment approval idempotency | no duplicate paid transition or transaction                 |
| Repeat order rate                   | 30%+ long term                                              |
| AOV                                 | Rp 150.000+ target after bundle strategy                    |
| Admin order processing visibility   | order status, payment, shipping, resi visible in dashboard  |

---

## 11. Risk Register

| Risk                                           | Severity | Mitigation                                                         |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------ |
| Manual proof approved twice                    | High     | idempotent Biteship metadata check + transaction upsert            |
| Stock overselling                              | High     | database RPC lock and inventory release on expiry                  |
| Biteship env missing in development            | Medium   | fail gracefully with clear error, no hard crash                    |
| Deprecated source-project modules reintroduced | Medium   | artifact/docs cleanup, active scan, generated DB types regen later |
| Product asset mismatch                         | Medium   | catalog audit against `assets/` before final launch                |

---

## 12. Final Scope Statement

Bananasbindery is a binder/photo-product commerce platform. All future work should prioritize product catalog, variants, cart, checkout, manual transfer payment, Biteship shipping, stock, promo, admin, and owner visibility.
