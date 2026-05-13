# PLAN — Bananasbindery Platform (Web First)

## Context

Project saat ini hanya berisi `prd.md`, `ARCHITECTURE.md`, `README.md`, `LICENSE`, dan `CLAUDE.md` — **belum ada code**. PRD mendefinisikan platform petshop Jakarta (e-commerce + booking grooming/hotel + delivery + payment + loyalty) dengan target arsitektur monorepo (Turborepo + pnpm + Next.js + NestJS + React Native + Supabase).

User memutuskan:
- **Mulai dari web** (apps/web) — customer-facing
- **Full monorepo dari awal** sesuai ARCHITECTURE.md — siap untuk admin/mobile/api expansion
- **Bertahap per milestone** — review per milestone, lower risk
- **Auth: email/password + Google OAuth dulu** — phone OTP nanti
- **Mature & production-ready** — bukan prototype, planning per phase yang jelas

Tujuan plan: roadmap implementasi web dari nol → production-ready, dengan phase boundary yang clear sehingga setiap milestone bisa di-review, di-test, dan di-deploy secara independen.

---

## Backend Strategy (Important Decision)

Karena user mau production-ready bertahap, backend di-evolve per phase — bukan all-or-nothing:

| Phase | Backend Layer | Alasan |
|-------|---------------|--------|
| **Phase 0–4** (Web MVP) | Supabase-direct via `@supabase/ssr` di Next.js Server Components + Route Handlers | Speed; RLS handle authorization; tidak ada mobile yet jadi belum perlu API standalone |
| **Phase 5** (Production hardening) | Hybrid — NestJS API untuk: payment webhook, checkout transaction (stock lock), booking slot lock, WhatsApp notification, admin operations | Operasi kritis butuh server-side logic + audit + rate limit yang rapi |
| **Phase 6+** (Mobile/Admin scale) | Full NestJS API untuk semua write; web read tetap Supabase-direct (RSC) untuk SEO + speed | Mobile app butuh API standalone; admin panel butuh role-based protection di API layer |

Pattern ini menghindari over-engineering di awal tapi tetap punya path jelas ke production-grade architecture.

---

## Critical Files (target structure to be created)

```
petshop/
├── package.json                       # workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── .nvmrc                             # node 20 LTS
├── .env.example
├── .editorconfig
├── .prettierrc, .eslintrc.cjs
├── tsconfig.base.json
│
├── packages/
│   ├── tsconfig/                      # base, nextjs, nestjs, react-native
│   ├── config/                        # env schema (zod), constants
│   ├── types/                         # supabase generated types + domain types
│   ├── utils/                         # format, slug, distance, order-number
│   ├── core/                          # pricing, shipping rules, booking, loyalty (pure)
│   ├── ui/                            # shadcn primitives wrapped
│   └── api-client/                    # SDK (Phase 5+)
│
├── apps/
│   └── web/                           # Next.js 15 App Router
│       ├── app/
│       │   ├── (marketing)/           # landing, about, contact
│       │   ├── (shop)/                # /, /products, /products/[slug], /categories/[slug], /search
│       │   ├── (account)/             # /account, /orders, /pets, /addresses, /loyalty, /wishlist
│       │   ├── (auth)/                # /login, /register, /forgot-password, /callback
│       │   ├── booking/               # /booking/grooming, /booking/hotel, /booking/[id]
│       │   ├── checkout/              # /checkout, /checkout/success, /checkout/[orderNumber]
│       │   ├── api/                   # route handlers (webhooks, server actions wrapper)
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/                # web-specific (header, footer, product-card, cart-drawer, ...)
│       ├── lib/                       # supabase client/server, utils, server actions
│       ├── public/
│       ├── middleware.ts              # auth + locale
│       ├── next.config.ts
│       └── tailwind.config.ts
│
├── supabase/
│   ├── config.toml
│   ├── migrations/                    # 001..010 sesuai PRD §15
│   ├── seed/                          # categories, products, services
│   └── functions/                     # edge functions (Phase 5+)
│
├── .github/workflows/                 # ci.yml, deploy-web.yml
└── docs/
    ├── prd.md (existing)
    ├── ARCHITECTURE.md (existing)
    └── runbook/                       # deployment, on-call, env setup
```

---

## Milestones (Web)

### **Phase 0 — Foundation & Tooling** ✅
**Tujuan**: monorepo siap, tooling production-grade, semua quality gate jalan.

1. Init pnpm workspace + Turborepo (`turbo.json` pipeline: dev/build/lint/test/type-check)
2. Root config: `tsconfig.base.json`, `.editorconfig`, `.prettierrc`, ESLint flat config, `.nvmrc` (node 20)
3. `packages/tsconfig` (base, nextjs, react-library)
4. `packages/config` — env schema dengan **zod** (validate at startup, fail-fast); konstanta global (currency, timezone Asia/Jakarta, cut-off time)
5. `packages/utils` — `formatCurrency` (IDR), `formatDate` (id-ID), `slugify`, `generateOrderNumber`, `haversineDistance`
6. `packages/types` — bootstrap dengan domain types dari PRD §15; siap untuk supabase-generated types di Phase 1
7. `packages/core` — skeleton service files (pricing, shipping, booking) — implementasi di phase relevan
8. `apps/web` — `create-next-app` dengan Next.js 15 (App Router, TypeScript, Tailwind, src dir off, App Router on)
9. Tailwind config + shadcn/ui init dengan tema brand (orange muda/salem primary, orange accent — sesuai PRD §2)
10. `packages/ui` — wrap shadcn primitives (Button, Input, Card, Badge, Modal, Sheet) supaya konsisten lintas app
11. Husky + lint-staged + commitlint (conventional commits sesuai global rule)
12. GitHub Actions: `ci.yml` (lint + type-check + test), branch protection di main
13. Vercel project setup + preview deployment per PR

**Deliverable**: `pnpm dev` jalan, landing page placeholder live di Vercel preview, CI hijau.
**Verifikasi**: `pnpm build && pnpm lint && pnpm type-check` semua hijau; preview URL bisa dibuka.

---

### **Phase 1 — Database Foundation** ✅
**Tujuan**: Supabase project siap, schema deployed, types ter-generate.

1. Buat Supabase project (production + staging branch)
2. Enable extensions: `uuid-ossp`, `pg_trgm`
3. Migrations split per domain (sesuai PRD §15):
   - `001_users_addresses_pets.sql`
   - `002_categories_products_variants_images.sql`
   - `003_carts_cart_items.sql`
   - `004_orders_order_items_returns.sql`
   - `005_services_booking_slots_bookings.sql`
   - `006_vouchers_loyalty_loyalty_history.sql`
   - `007_reviews_wishlists.sql`
   - `008_banners_store_locations.sql`
   - `009_notifications_stock_movements.sql`
   - `010_indexes.sql`
   - `011_rls_policies.sql`
   - `012_functions_triggers.sql` — `set_updated_at()`, `decrement_stock_on_order()`, `update_avg_rating()`
4. Seed: 6 kategori, 30 produk dummy, 6 services (grooming basic/full, hotel small/medium/large)
5. RLS policies sesuai PRD §15 (customer own-data, public read produk/kategori/banner, admin/owner via app_metadata.role)
6. Setup Supabase Storage buckets: `products`, `banners`, `pets`, `reviews`, `avatars` dengan policy public read
7. Generate TypeScript types: `supabase gen types typescript --linked > packages/types/src/supabase.ts`
8. Re-export `Database` type dari `@bananasbindery/types`

**Deliverable**: `supabase db push` sukses, `select * from products` return 30 row, types valid di TypeScript.
**Verifikasi**: Login Supabase Studio, cek semua 22 tabel + RLS aktif; `pnpm type-check` di web tidak error saat import dari `@bananasbindery/types`.

---

### **Phase 2 — Design System & Layout** ✅
**Tujuan**: visual identity konsisten, layout responsif, page kosong sudah ter-routing.

1. Brand tokens di `tailwind.config.ts`: warna (primary orange-soft, accent orange, neutral, success, warning, danger), typography (Inter primary, Outfit display), spacing scale, radius, shadow
2. Global components di `apps/web/components/layout`:
   - `Header` (logo, nav, search bar, cart icon, account icon, mobile drawer)
   - `Footer` (links, payment methods, social, location)
   - `MobileBottomNav` (home, search, cart, booking, account) — tampil di breakpoint < md
3. Reusable di `packages/ui` atau `apps/web/components/shared`:
   - `ProductCard`, `ProductGrid`, `CategoryChip`, `PriceTag` (handle harga coret), `RatingStars`, `EmptyState`, `Skeleton` variants, `Toast` (via sonner)
4. Framer Motion setup — `MotionConfig` di root, page transition wrapper
5. Loading states: `loading.tsx` per route group, skeleton UI
6. Error boundaries: `error.tsx` per route group, `not-found.tsx`
7. Routing skeleton (semua page placeholder dulu):
   - `/` (home), `/products`, `/products/[slug]`, `/categories/[slug]`, `/search`
   - `/login`, `/register`, `/forgot-password`
   - `/account`, `/orders`, `/pets`, `/addresses`, `/loyalty`, `/wishlist`
   - `/cart`, `/checkout`, `/checkout/success`
   - `/booking`, `/booking/grooming`, `/booking/hotel`
8. SEO base: `metadata` config di root layout, OpenGraph default, `sitemap.ts`, `robots.ts`
9. Accessibility audit: focus state, semantic HTML, aria-label di icon button, kontras WCAG AA

**Deliverable**: navigasi semua route jalan, layout responsif (mobile/tablet/desktop), Lighthouse score >= 90 di /
**Verifikasi**: manual test di Chrome DevTools (mobile emulation), Lighthouse run, axe DevTools 0 violation di home page.

---

### **Phase 3 — Catalog & Product Discovery** ✅
**Tujuan**: customer bisa browse, search, filter, lihat detail produk. **Read-only, no auth required.**

**Backend**: 100% Supabase-direct via Server Components.

1. `apps/web/lib/supabase/`: `server.ts` (RSC client), `client.ts` (browser), `middleware.ts` (session refresh)
2. Home page (`app/(shop)/page.tsx`):
   - Hero banner (dari tabel `banners` type=hero, filter date range + is_active)
   - Featured categories (grid 6 kategori utama)
   - Promo banner row
   - "Best Sellers" section (sort by `sold_count desc limit 8`)
   - "New Arrivals" (sort by `created_at desc limit 8`)
3. Category page (`app/(shop)/categories/[slug]/page.tsx`):
   - Header kategori + subcategories
   - Product grid dengan pagination (offset/cursor — pilih cursor untuk consistency)
4. Product list (`app/(shop)/products/page.tsx`):
   - Filter sidebar: kategori, price range, product type (normal/frozen/parcel), rating
   - Sort: newest, popular, price asc/desc
   - URL state via `nuqs` atau native `searchParams` (SSR-friendly)
   - Pagination
5. Search (`app/(shop)/search/page.tsx`):
   - Full-text search via `tsvector` (`search_vector` column dari migration)
   - Highlight match, "no result" state, search suggestions (top 5)
   - Debounced search bar di header → push ke `/search?q=`
6. Product detail (`app/(shop)/products/[slug]/page.tsx`):
   - Image carousel (Embla atau Swiper) — semua `product_images` sort by sort_order
   - Variant selector (radio group) — update price + stock + SKU display dynamically
   - Quantity stepper dengan stock validation
   - Description, specs, weight info
   - Reviews section (avg rating, review list, photo lightbox)
   - "Related products" (same category)
   - WhatsApp share button
   - Stock badge (in stock / low stock / out of stock)
   - SEO: dynamic metadata (title, description, OG image), `generateStaticParams` untuk top 50 produk
7. Cart drawer (UI only, persist ke localStorage dulu via Zustand) — full server-side cart di Phase 4

**Reuse** dari `packages/core`:
- `pricing.service.ts.calculateDisplayPrice(product, variant)` — handle promo_price logic
- `inventory.service.ts.getStockStatus(stock)` — return 'in_stock' | 'low_stock' | 'out_of_stock'

**Deliverable**: customer (anonymous) bisa explore katalog penuh, search jalan, product detail siap convert.
**Verifikasi**: Playwright E2E — flow: home → kategori → filter → detail → add to cart drawer; Lighthouse mobile >= 85.

---

### **Phase 4 — Auth & Account** ✅
**Tujuan**: customer bisa register/login, kelola profile, addresses, pets.

**Backend**: Supabase Auth (`@supabase/ssr`) — email/password + Google OAuth.

1. Auth pages:
   - `/login` — email + password, "Login with Google", link ke /register & /forgot-password
   - `/register` — email + password + name + phone (optional), validasi via zod, double opt-in via Supabase email confirmation
   - `/forgot-password` — email input → send reset link
   - `/reset-password` — token from URL → new password
   - `/auth/callback` — handle OAuth + magic link callback
2. Server actions di `apps/web/lib/actions/auth.ts`:
   - `signInWithPassword(email, password)`
   - `signUp(email, password, name, phone?)`
   - `signInWithGoogle()` (redirect)
   - `signOut()`
   - `resetPasswordRequest(email)`
   - `updatePassword(token, newPassword)`
3. Middleware (`apps/web/middleware.ts`):
   - Refresh session on every request (`@supabase/ssr` pattern)
   - Protect `/account/*`, `/checkout`, `/booking`, `/orders` → redirect /login dengan `?redirect=`
4. User trigger di Supabase: pada `auth.users` insert → insert ke `public.users` dengan default role='customer'
5. Account hub (`/account`):
   - Tabs/section: Profile, Addresses, Pets, Orders, Loyalty, Wishlist, Settings
   - Profile edit form (name, phone, avatar upload ke bucket `avatars`)
6. Addresses (`/account/addresses`):
   - List, add, edit, delete (server actions, RLS protect)
   - Set default address
   - Map picker (Phase 5+ kalau Google Maps key sudah ada — sementara manual input + lat/lng optional)
7. Pets (`/account/pets`):
   - List, add, edit, delete pet
   - Form: name, type (select), breed, weight, birth_date, photo, notes
   - Foto upload ke bucket `pets`
8. Wishlist (`/account/wishlist`):
   - List wishlist items, remove, "add to cart"
   - Toggle wishlist dari product card / detail (auth required, redirect to login if not)

**Reuse**:
- `packages/utils` validators (email, phone Indonesian format)
- `packages/ui` Form components (build atas react-hook-form + zod resolver)

**Deliverable**: full auth flow + account management jalan dengan RLS terverifikasi.
**Verifikasi**:
- E2E: register → confirm email → login → edit profile → add address → add pet → logout → login again
- Manual: coba akses `/account` tanpa login → redirected
- Manual: cek di Supabase Studio bahwa user A tidak bisa query addresses user B (RLS test)

---

### **Phase 5 — Cart, Checkout, Payment, Shipping** 🔧
**Tujuan**: customer bisa selesaikan transaksi end-to-end. **Production-grade — masuk hybrid backend.**

**Backend transition**: setup minimal NestJS hanya untuk operasi kritis (mulai `apps/api`):
- Stock decrement transactional (avoid overselling — pakai `SELECT ... FOR UPDATE` atau RPC)
- Payment webhook handler (signature verification)
- Order creation (atomic: cart → order → stock movement → cart clear)

Untuk read & cart UI tetap Supabase-direct.

1. **Server-side cart** (Supabase):
   - Migrate dari localStorage ke `carts` + `cart_items` table saat user login
   - Merge guest cart → user cart on login
   - Server actions: addToCart, updateQty, removeItem, clearCart
   - Cart page (`/cart`): list items, qty stepper, remove, subtotal, "checkout" button (require login)
2. **`packages/core/services/pricing.service.ts`** (production-ready):
   - `calculateCartTotal(items, voucher?, loyaltyPointsUsed?)` returns `{subtotal, discount, voucherDiscount, loyaltyDiscount, tax, shipping, total}`
   - Pure function, fully unit-tested
3. **Shipping module**:
   - Setup RajaOngkir (atau Biteship) account
   - `apps/api/src/modules/shipping/` di NestJS — wrap RajaOngkir
   - Endpoint: `POST /shipping/cost` (origin store, destination postal, weight) → return list kurir + rate
   - `packages/core/services/shipping.service.ts`:
     - `validateProductTypeForCourier(productType, courier)` — frozen only same-day ≤15km
     - `isSameDayAvailable(orderTime, distance, sameCity)` — cut-off 14:00 WIB
   - Checkout step UI: pilih address → fetch ongkir → pilih kurir
4. **Voucher**:
   - Apply voucher di checkout, validasi: min_order, valid_from/until, usage_limit, used_count
   - `packages/core/services/voucher.service.ts.validateVoucher(code, cart, user)`
   - Increment `used_count` saat order sukses (dalam transaction)
5. **Checkout flow** (`/checkout`):
   - Step 1: review cart
   - Step 2: select address (with edit/add inline)
   - Step 3: select shipping (auto-filter berdasarkan product types di cart)
   - Step 4: apply voucher (optional)
   - Step 5: pilih payment method
   - Step 6: confirm → create order → redirect ke payment page
6. **Payment integration (Midtrans)**:
   - `apps/api/src/modules/payments/midtrans.service.ts` — create transaction (Snap atau Core API)
   - Endpoint: `POST /payments/create` (orderId) → return Snap token / VA number / QRIS
   - Webhook: `POST /payments/webhook` — verify signature, update order.payment_status, trigger notification
   - Order creation: atomic via Postgres function `create_order_from_cart(user_id, address_id, shipping, voucher_id, payment_method)` — handle stock decrement + cart clear + order_items insert
   - Auto-expire: cron/scheduled function — set `status='expired'` untuk order `pending` > 2 jam
7. **Order pages**:
   - `/checkout/[orderNumber]` — payment instructions (VA/QR/Snap embed)
   - `/account/orders` — list orders dengan status badge
   - `/account/orders/[orderNumber]` — detail order, tracking (jika resi sudah diisi admin), invoice download (Phase 6)
8. **Realtime updates**:
   - Subscribe ke `orders` table untuk current user → toast "Pembayaran diterima" saat status berubah

**Critical reuse**:
- `packages/core` jadi single source of truth — semua kalkulasi dipanggil dari NestJS API DAN Next.js Server Components

**Deliverable**: end-to-end purchase berhasil di sandbox Midtrans.
**Verifikasi**:
- E2E: add to cart → checkout → bayar di Midtrans sandbox → webhook fires → order status=paid → muncul di /account/orders
- Load test: 50 concurrent checkout pada produk dengan stock=10 → tidak ada overselling (pakai k6 atau artillery)
- Manual: test failure cases — stock habis, voucher invalid, payment expired, webhook signature wrong

---

### **Phase 6 — Booking System (Grooming + Pet Hotel)** (target: ~5 hari)
**Tujuan**: customer bisa booking layanan grooming/hotel tanpa overbooking.

1. Migration tambahan: `booking_slots` seeder script — generate 90 hari ke depan, jam 09:00–17:00 hourly
2. **`packages/core/services/booking.service.ts`**:
   - `getAvailableSlots(date, type)` — query `booking_slots` where `booked < capacity`
   - `validateBookingPayload(payload, slot)` — pure validation
   - Hotel validation: date range + capacity check per hari
3. NestJS endpoint `POST /bookings` (atomic):
   - Lock slot row (`SELECT ... FOR UPDATE`)
   - Increment `booked` jika `booked < capacity` else 409
   - Insert booking
   - Trigger DP payment jika `service.requires_dp`
4. Booking pages:
   - `/booking` — landing pilih grooming/hotel
   - `/booking/grooming` — pilih service → pilih tanggal (calendar) → pilih slot → pilih pet → konfirmasi
   - `/booking/hotel` — date range picker (check-in/out) → pilih pet → DP info → konfirmasi
   - `/booking/[id]` — detail booking, status, cancel button
5. Account: `/account/bookings` — list booking history
6. Cancellation rule:
   - Free cancel jika H-1 (>= 24 jam dari date_start)
   - Charge 50% (refund 50% DP) jika < 24 jam — admin review
7. Realtime: subscribe `booking_slots` table → UI auto-update saat slot terbooking user lain

**Deliverable**: booking grooming + hotel jalan, anti-overbook terverifikasi.
**Verifikasi**:
- Concurrent booking test: 5 user booking slot capacity=2 → hanya 2 sukses, 3 dapat 409
- E2E: pilih service → tanggal → slot → pet → DP payment → booking confirmed

---

### **Phase 7 — Reviews, Loyalty, Notifications** (target: ~5 hari)
**Tujuan**: post-purchase engagement & retention.

1. **Reviews**:
   - Customer post review setelah `order.status='delivered'`
   - Form: rating, comment, photo upload (max 3)
   - Trigger Postgres: `update_avg_rating()` setelah review insert/update/delete
   - Display di product detail
2. **Loyalty**:
   - Trigger Postgres: `award_loyalty_points()` saat `order.status` berubah ke `completed` — earn 1% dari `total - shipping`
   - `/account/loyalty` — balance, history (earn/redeem/expire)
   - Redeem di checkout: input poin → kurangi total
   - Cron edge function: `expire_points` — bulanan, expire poin > 12 bulan
3. **Notifications (in-app dulu)**:
   - Tabel `notifications` di-write oleh trigger order/booking status change
   - Bell icon di header dengan unread count
   - `/account/notifications` page
4. **WhatsApp notification (Fonnte)**:
   - `apps/api/src/modules/notifications/whatsapp.service.ts`
   - Templates: order confirmation, payment received, shipped (with resi), delivered, booking reminder H-1, booking confirmed
   - Queue via BullMQ + Redis (Upstash) untuk rate limit handling
   - Triggered dari NestJS service setelah event terjadi

**Deliverable**: full retention loop jalan.
**Verifikasi**: end-to-end flow dari order → delivered → review → loyalty earned → WA notif sent.

---

### **Phase 8 — Production Hardening & Launch** (target: ~4 hari)
**Tujuan**: siap masuk traffic real.

1. **Observability**:
   - Sentry (web + api) — source maps upload via CI
   - Vercel Analytics + Speed Insights
   - Supabase log drains (optional)
   - Uptime monitoring (Better Uptime atau UptimeRobot) untuk api & web
2. **Security**:
   - Audit RLS coverage — script test untuk verify setiap tabel sensitive punya policy
   - Rate limit di NestJS (`@nestjs/throttler`)
   - CSP header, HSTS, X-Frame-Options di `next.config.ts`
   - Secret scanning di CI (gitleaks)
   - Run `security-reviewer` agent on auth, payment, order modules
3. **Performance**:
   - Image optimization (Next/Image + Supabase transformation)
   - Bundle analyzer — split heavy deps
   - ISR untuk product pages (`revalidate: 600`)
   - Edge runtime untuk static-ish pages (home, kategori)
4. **SEO**:
   - Sitemap dynamic (semua produk + kategori)
   - JSON-LD structured data (Product, BreadcrumbList, Organization)
   - Robots.txt
   - Submit ke Google Search Console
5. **Testing**:
   - Unit: `packages/core` 100% coverage (pricing, shipping, booking, voucher, loyalty)
   - Integration: server actions di `apps/web/lib/actions/__tests__`
   - E2E (Playwright): 8 critical flows (browse, search, register, login, checkout-cod, checkout-card, booking, review)
   - Total target: 80%+ coverage sesuai global rule
6. **Docs**:
   - `docs/runbook/deployment.md` — Vercel + Supabase + Railway (api)
   - `docs/runbook/env-setup.md` — semua env vars dari PRD §17
   - `docs/runbook/oncall.md` — common issues + remediation
7. **Launch checklist**:
   - DNS + custom domain di Vercel
   - SSL certificate verified
   - Supabase production project configured (separate dari staging)
   - Backup schedule confirmed (Supabase daily backup)
   - Midtrans switched to production keys
   - Privacy policy + ToS pages
   - Customer support contact (WhatsApp business)

**Deliverable**: web live di production domain, monitoring jalan, runbook lengkap.
**Verifikasi**:
- Lighthouse production: Performance >= 85, Accessibility >= 95, SEO 100, Best Practices 100
- Real user test: order produk + booking dari mobile
- Sentry receive test error
- Backup restore drill (di staging)

---

## Cross-Cutting Concerns

### Testing Strategy (per global rule, 80%+ coverage)
- **Unit (Vitest)**: `packages/core`, `packages/utils` — pure logic
- **Integration (Vitest + supabase test)**: server actions, API endpoints
- **E2E (Playwright)**: critical user flows, run di CI
- **TDD**: pakai `tdd-guide` skill untuk core business logic (pricing, booking, stock)

### Code Quality Gates (di CI)
- TypeScript strict mode, no `any`
- ESLint flat config (next, react-hooks, jsx-a11y, security plugin)
- Prettier
- `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build` — semua harus hijau sebelum merge
- Husky pre-commit: lint-staged + type-check pada file changed
- Conventional commits (commitlint)

### Security (per global rule)
- All env via `packages/config` zod schema (fail-fast on startup)
- No secrets in code (gitleaks in CI)
- RLS audit script
- Input validation di setiap server action via zod
- Rate limit di public-facing endpoints
- HTTPS only, secure cookies, SameSite=Lax untuk auth
- Run `security-reviewer` agent di Phase 5 (payment) dan Phase 8 (pre-launch)

### Code Reuse Discipline
- Tidak boleh duplikasi business logic — kalau kepakai 2x, pindah ke `packages/core`
- Tidak boleh duplikasi UI primitive — pindah ke `packages/ui`
- Tidak boleh duplikasi API call — pindah ke `packages/api-client` (mulai Phase 5)
- Web-specific component (layout) tetap di `apps/web/components`

### Branching & PR
- `main` = production (auto-deploy)
- `develop` = staging
- `feat/*`, `fix/*` per task — PR ke `develop`
- Code review wajib (pakai `code-reviewer` agent on completion)
- Squash merge

---

## Verification (End-to-End)

**Per phase** (di akhir milestone):
1. `pnpm build` di root sukses
2. `pnpm lint && pnpm type-check && pnpm test` hijau
3. Vercel preview deployment hijau
4. Manual smoke test deliverable phase tersebut
5. Run `code-reviewer` agent pada changes phase

**Pre-production (akhir Phase 8)**:
1. Full Playwright E2E suite hijau di CI
2. Lighthouse audit 4 page utama (home, product detail, checkout, account) — target met
3. Load test: 100 concurrent users browse + 20 concurrent checkout — no error, no overselling
4. Security scan: `npm audit`, `snyk test`, gitleaks, RLS audit script
5. Manual UAT dengan owner — purchase real, booking real, dashboard preview
6. DNS cutover + monitoring 24 jam pertama

---

## Out of Scope (Web Only — defer to next track)

Plan ini **fokus apps/web saja**. Berikut yang TIDAK dicover di plan ini (akan dibuat plan terpisah di `claudeplan/`):

- `apps/admin` — admin & owner dashboard (Phase berikutnya, butuh setelah web operational)
- `apps/api` — full NestJS migration (saat ini hanya minimal setup di Phase 5)
- `apps/mobile` — React Native (setelah backend matang)
- Phone OTP via WhatsApp (Phase tambahan)
- Multi-branch support
- Subscription / auto-reorder
- Instagram feed embed
- Gojek/Grab instant delivery integration

Setelah Phase 8 done, prioritas selanjutnya rekomendasi: **apps/admin** (dashboard admin untuk manage order/produk/booking) — karena owner butuh tools untuk operate.

---

## Total Estimasi

| Phase | Estimasi | Cumulative |
|-------|----------|------------|
| 0 — Foundation | 3 hari | 3 hari |
| 1 — Database | 2 hari | 5 hari |
| 2 — Design System | 3 hari | 8 hari |
| 3 — Catalog | 5 hari | 13 hari |
| 4 — Auth & Account | 4 hari | 17 hari |
| 5 — Checkout & Payment | 7 hari | 24 hari |
| 6 — Booking | 5 hari | 29 hari |
| 7 — Reviews/Loyalty/Notif | 5 hari | 34 hari |
| 8 — Production Hardening | 4 hari | **38 hari (~8 minggu)** |

Sejalan dengan target PRD §19 Phase 1 (8 minggu MVP) — tapi sudah include hardening + booking + loyalty (yang di PRD masuk Phase 2-3).
