# Admin Recovery Build Fix — 2026-05-14

## Apa yang diubah

- Memulihkan admin catalog/order/dashboard agar tidak bergantung pada legacy import `@bananasbindery/db` yang tidak ada di monorepo ini.
- Menambahkan layer data lokal admin berbasis Supabase typed client.
- Memperbaiki kompatibilitas Next.js 15 untuk `params` dan `searchParams` yang sekarang berupa Promise di App Router.
- Mengganti dependency icon legacy `@tabler/icons-react` dengan `lucide-react` yang sudah tersedia di aplikasi.
- Mengubah import UI package admin dari root `@bananasbindery/ui` ke subpath export yang valid (`@bananasbindery/ui/components/...`).
- Membuat helper auth/admin Supabase lokal agar API admin bisa type-check/build lagi.
- Menonaktifkan endpoint flash-sale legacy menjadi stub aman karena tabel `flash_sales` / `flash_sale_items` tidak ada di skema binder saat ini.
- Memperbaiki admin product form supaya memakai field produk aktual (`price`, `weight_grams`, `product_variants.name`) bukan field legacy `base_price` / `weight`.

## File yang diubah / dibuat

- `apps/web/lib/admin-data.ts`
  - Data access admin untuk products, product detail, create/update product, orders, stats, revenue chart, coupons.
  - Mapping varian binder disimpan ke `product_variants.name` dengan format `Cover / Paper / Size`.
- `apps/web/lib/db.ts`
  - Export lazy `createClient` supaya `cookies()` tidak dipanggil di luar request scope saat build.
- `apps/web/lib/auth.ts`
  - Helper `getUser()` berbasis Supabase server client.
- `apps/web/lib/supabase.ts`
  - Supabase admin client untuk route admin tertentu.
- `apps/web/tsconfig.json`
  - Tambah path alias `@bananasbindery/types/*`.
- `apps/web/app/admin/layout.tsx`
  - Icon migration ke `lucide-react`, menu legacy coupons/customers dirapikan ke promos.
- `apps/web/app/admin/page.tsx`
  - Import data/UI/icon diperbaiki, link coupon legacy diarahkan ke promos.
- `apps/web/app/admin/orders/page.tsx`
  - Next.js 15 `searchParams` Promise, typed dynamic links, import data/UI/icon diperbaiki.
- `apps/web/app/admin/products/page.tsx`
  - Import data/UI/icon diperbaiki, harga admin pakai `product.price`.
- `apps/web/app/admin/products/[id]/page.tsx`
  - Next.js 15 `params` Promise, detail produk memakai local admin data.
- `apps/web/components/admin/ProductForm.tsx`
  - Import yang hilang dipulihkan, tipe initial data disesuaikan schema binder, submit endpoint aman saat edit.
- `apps/web/app/api/admin/*`
  - Import `@bananasbindery/db` diganti ke `@/lib/admin-data`.
  - Dynamic route params API dibuat kompatibel dengan Next.js 15.
  - Flash sale legacy distub karena tidak sesuai schema project binder.

## Mengapa

- Project hasil copy masih membawa legacy Pawvels/Petshop: package `@bananasbindery/db`, `@tabler/icons-react`, field `base_price`, dan tabel flash sale tidak ada / tidak valid di project binder sekarang.
- Build gagal karena import/package hilang dan Next.js 15 route typing berubah.
- Supabase `cookies()` sebelumnya terpanggil saat module import, menyebabkan error `cookies was called outside a request scope` saat build. Solusi: client dibuat lazy.

## Validasi

- `pnpm --filter @bananasbindery/web type-check` — PASS.
- `pnpm --filter @bananasbindery/web build` — PASS.

## Catatan revert

Perubahan paling aman direvert per area:

1. Revert admin data layer: hapus `apps/web/lib/admin-data.ts`, `db.ts`, `auth.ts`, `supabase.ts`, lalu restore import lama jika package DB nanti benar-benar dikembalikan.
2. Revert UI/admin pages: restore file admin layout/page/orders/products/ProductForm.
3. Revert endpoint flash-sale jika tabel flash sale akan dibuat ulang di Supabase.
