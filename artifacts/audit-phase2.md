# 🔍 Audit Phase 2 — Design System & Layout

**Tanggal:** 3 Mei 2026  
**Auditor:** Antigravity  
**Reference:**

- [claudeplan/01-web-platform.md](file:///Users/jhordideamarall/Projects/Bananasbindery/claudeplan/01-web-platform.md) §Phase 2 (line 141-164)
- [prd.md](file:///Users/jhordideamarall/Projects/Bananasbindery/prd.md) §2 Design & Branding, §5 Features
- [ARCHITECTURE.md](file:///Users/jhordideamarall/Projects/Bananasbindery/ARCHITECTURE.md)

---

## Checklist vs claudeplan Phase 2

| #   | Requirement                                                              | Status  | Notes                                                                                                                                                 |
| --- | ------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Brand tokens di `tailwind.config.ts` (warna, typography, spacing)        | ✅      | oklch tokens di `globals.css` + custom hex design tokens. Inter + Outfit fonts.                                                                       |
| 2a  | `Header` (logo, nav, search bar, cart icon, account icon, mobile drawer) | ⚠️ ~70% | Ada header dengan search bar, bell, cart. **Missing: logo, account icon, mobile drawer (hamburger menu)**                                             |
| 2b  | `Footer` (links, payment methods, social, location)                      | ❌      | Tidak ada Footer component                                                                                                                            |
| 2c  | `MobileBottomNav` (home, search, cart, booking, account)                 | ⚠️ 80%  | Ada BottomNav dengan 4 tab (Home, Produk, Booking, Akun). **Missing: Cart tab** — plan minta 5 tab termasuk cart                                      |
| 3a  | `ProductCard`                                                            | ✅      | Lengkap — discount badge, promo price, rating, sold count, frozen badge, add-to-cart button                                                           |
| 3b  | `ProductGrid`                                                            | ✅      | Ada, grid wrapper component                                                                                                                           |
| 3c  | `CategoryChip`                                                           | ✅      | Ada                                                                                                                                                   |
| 3d  | `PriceTag` (handle harga coret)                                          | ✅      | Ada — handle normal + promo price                                                                                                                     |
| 3e  | `RatingStars`                                                            | ✅      | Ada                                                                                                                                                   |
| 3f  | `EmptyState`                                                             | ✅      | Ada — with icon, title, description, optional action                                                                                                  |
| 3g  | `Skeleton` variants                                                      | ✅      | Ada — multiple skeleton variants                                                                                                                      |
| 3h  | `Toast` (via sonner)                                                     | ✅      | Sonner configured in Providers component                                                                                                              |
| 4   | Framer Motion setup — `MotionConfig` + page transitions                  | ⚠️ 30%  | framer-motion installed (in package.json) but **no MotionConfig wrapper**, no page transition animations. Only CSS keyframe animation (cartBadgePop). |
| 5   | Loading states: `loading.tsx` per route group                            | ⚠️ 30%  | Only root `loading.tsx` exists. **Missing per-route-group:** `(shop)/loading.tsx`, `(auth)/loading.tsx`, `(account)/loading.tsx`                      |
| 6a  | Error boundary: `error.tsx` per route group                              | ⚠️ 30%  | Only root `error.tsx` exists. **Missing per-route-group**                                                                                             |
| 6b  | `not-found.tsx`                                                          | ✅      | Ada — branded, bahasa Indonesia, 🐾 emoji, link "Kembali ke Beranda"                                                                                  |
| 7a  | Route `/` (home)                                                         | ✅      | Lengkap — hero, categories, features strip, product grid, booking CTA                                                                                 |
| 7b  | Route `/products`                                                        | ✅      | Placeholder ada                                                                                                                                       |
| 7c  | Route `/products/[slug]`                                                 | ✅      | Placeholder ada                                                                                                                                       |
| 7d  | Route `/categories/[slug]`                                               | ✅      | Placeholder ada                                                                                                                                       |
| 7e  | Route `/search`                                                          | ✅      | Placeholder ada                                                                                                                                       |
| 7f  | Route `/login`, `/register`                                              | ✅      | Folder ada                                                                                                                                            |
| 7g  | Route `/forgot-password`                                                 | ❌      | **Tidak ada**                                                                                                                                         |
| 7h  | Route `/account`, `/orders`, `/pets`, `/addresses`                       | ✅      | Folder ada                                                                                                                                            |
| 7i  | Route `/loyalty`, `/wishlist`                                            | ❌      | **Tidak ada** di (account)                                                                                                                            |
| 7j  | Route `/cart`                                                            | ✅      | Folder ada                                                                                                                                            |
| 7k  | Route `/checkout`, `/checkout/success`                                   | ⚠️      | `/checkout` ada, **`/checkout/success` tidak ada**                                                                                                    |
| 7l  | Route `/booking`, `/booking/grooming`, `/booking/hotel`                  | ✅      | Semua ada                                                                                                                                             |
| 8a  | SEO: `metadata` di root layout                                           | ✅      | Title template + description                                                                                                                          |
| 8b  | SEO: OpenGraph default                                                   | ⚠️      | Title+description ada, tapi **tidak ada OG image, locale, type, url**                                                                                 |
| 8c  | SEO: `sitemap.ts`                                                        | ✅      | Static sitemap, 3 URLs                                                                                                                                |
| 8d  | SEO: `robots.ts`                                                         | ✅      | Configured — disallow /account/, /checkout/, /cart                                                                                                    |
| 9   | Accessibility: focus state, semantic HTML, aria-label                    | ⚠️ 60%  | `aria-label` ada di bell, cart, nav. **Missing:** focus-visible styles, skip-to-content link, proper heading hierarchy                                |

---

## Temuan Penting

### 🔴 Critical (Missing dari plan)

1. **Tidak ada Footer component** — Plan minta Footer dengan links, payment methods, social, location. Ini penting untuk SEO (internal links) dan trust (payment badges).

2. **Tidak ada Framer Motion integration** — PRD §2 dan plan minta Framer Motion untuk micro-animations dan page transitions. Saat ini hanya CSS `@keyframes`. `MotionConfig` dan `AnimatePresence` belum di-setup.

3. **Missing routes:** `/forgot-password`, `/account/loyalty`, `/account/wishlist`, `/checkout/success`

### 🟡 Medium

4. **Loading states hanya di root** — Plan minta `loading.tsx` per route group. Saat ini hanya 1 file di root.

5. **Error boundaries hanya di root** — Sama, plan minta per route group.

6. **BottomNav punya 4 tab, plan minta 5** — Missing cart tab.

7. **Header missing logo & account icon** — Ada search, bell, cart. Tapi tidak ada logo Bananasbindery dan icon account.

8. **OpenGraph incomplete** — Tidak ada `og:image`, `og:locale`, `og:type`.

### 🟢 Minor / Nice-to-have

9. **Home page products hardcoded** — `PLACEHOLDER_PRODUCTS` dan `CATEGORIES` hardcoded, tapi ini expected di Phase 2 (data fetch baru di Phase 3).

10. **Accessibility audit belum dilakukan** — No focus-visible styles, no skip-to-content link.

---

## Quality Score

| Aspect                                        | Score    |
| --------------------------------------------- | -------- |
| Design System (tokens, typography, color)     | ✅ 95%   |
| Layout Components (Header, Footer, BottomNav) | ⚠️ 65%   |
| Shared UI Components                          | ✅ 90%   |
| Routing Skeleton                              | ⚠️ 80%   |
| SEO Base                                      | ⚠️ 75%   |
| Error/Loading States                          | ⚠️ 30%   |
| Framer Motion / Animations                    | ⚠️ 25%   |
| Accessibility                                 | ⚠️ 55%   |
| **Overall Phase 2**                           | **~65%** |

---

## Rekomendasi: Apa yang Perlu Ditambah untuk 100%

### Priority 1 (Blocking untuk Phase 3)

1. Buat `Footer` component
2. Tambah missing routes: `/forgot-password`, `/account/loyalty`, `/account/wishlist`, `/checkout/success`
3. Tambah `loading.tsx` di setiap route group: `(shop)`, `(auth)`, `(account)`, `booking`, `checkout`, `cart`
4. Tambah `error.tsx` di setiap route group

### Priority 2 (Should Have)

5. Setup Framer Motion: `MotionConfig` wrapper di providers, `AnimatePresence` di layout, page transition component
6. BottomNav: tambah Cart tab (5 tab total sesuai plan)
7. Header: tambah logo + account icon
8. OpenGraph: tambah `og:image`, `og:locale: id_ID`, `og:type: website`

### Priority 3 (Polish)

9. Focus-visible styles (ring outline on focus)
10. Skip-to-content link
11. Heading hierarchy audit (h1 → h2 → h3)
