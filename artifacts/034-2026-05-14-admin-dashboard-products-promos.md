# 034 — Admin Dashboard, Order Management, Product Edit, Promo Edit

Tanggal: 2026-05-14
Scope: Phase 6 admin baseline

## Apa yang diubah

Membangun baseline halaman admin di `apps/web/app/admin` tanpa mengubah UI customer/shop yang sudah bagus.

### 1. Admin shell + role guard
- File: `apps/web/app/admin/layout.tsx`
- Perubahan:
  - Menambahkan layout admin desktop/mobile dengan sidebar/nav.
  - Menambahkan guard server-side berdasarkan Supabase user + `profiles.role`.
  - Role yang boleh masuk: `admin`, `owner`, `staff`.
  - Non-login diarahkan ke `/login`, non-admin diarahkan ke `/`.
- Alasan teknis:
  - Admin route harus dilindungi di server boundary, bukan sekadar UI hidden.
  - Layout admin dipisah total dari shop layout agar tidak mengganggu style toko.

### 2. Admin dashboard
- File: `apps/web/app/admin/page.tsx`
- Perubahan:
  - Ringkasan jumlah products, orders, bookings, vouchers.
  - Snapshot order terbaru, revenue/order recent, profit recent.
  - Low-stock products dengan quick link ke product admin.
- Alasan teknis:
  - Memberi visibility operasional minimal sebelum module order management full dibangun.
  - Menggunakan Supabase typed client dan server component fetch.

### 3. Server actions admin
- File: `apps/web/app/admin/actions.ts`
- Perubahan:
  - `saveProduct`: create/update produk, harga, promo price, HPP, stock, weight, category, status, image URL.
  - `toggleProductStatus`: quick activate/deactivate product.
  - `saveVoucher`: create/update voucher promo, tipe, value, min order, max discount, usage limit, validity, status.
  - `saveBanner`: create/update CMS banner promo, image URL, CTA link, priority, schedule, status.
  - Semua action melakukan `requireAdmin()` terlebih dahulu.
- Alasan teknis:
  - Write operation admin tetap server-side, tidak exposing write logic di client component.
  - Revalidate path terkait supaya UI admin/shop bisa refresh data setelah perubahan.

### 4. Product admin page
- File: `apps/web/app/admin/products/page.tsx`
- Perubahan:
  - Halaman `/admin/products` untuk tambah produk baru.
  - Inline edit produk existing.
  - Manage harga normal/promo, HPP, stok, berat, kategori, tipe produk, image URL, deskripsi, active state.
- Alasan teknis:
  - Kebutuhan user: admin bisa edit product.
  - Product pricing/promo tetap pada kolom schema existing (`price`, `promo_price`) sehingga tidak perlu migration tambahan.

### 5. Promo admin page
- File: `apps/web/app/admin/promos/page.tsx`
- Perubahan:
  - Halaman `/admin/promos` untuk voucher dan banner promo.
  - Inline edit voucher existing dan banner existing.
  - Form create voucher/banner baru.
- Alasan teknis:
  - Kebutuhan user: admin bisa edit promo.
  - PRD mendefinisikan promo sebagai voucher/campaign dan CMS banner, jadi keduanya ditangani dalam satu console.

### 6. Order admin page
- File: `apps/web/app/admin/orders/page.tsx`
- Perubahan:
  - Halaman `/admin/orders` untuk melihat 40 order terbaru.
  - Admin bisa update order status, payment status, nomor resi, dan catatan admin.
  - Snapshot subtotal, ongkir, profit, dan kurir per order.
- Alasan teknis:
  - PRD Phase 6 meminta admin bisa manage order dan input resi.
  - Ini baseline operasional awal sebelum bulk shipping/full fulfillment dibuat.

## Apa yang tidak diubah

- Tidak mengubah style UI customer/shop.
- Tidak melakukan migration database live.
- Tidak commit/push.
- Tidak mengubah pricing/checkout logic yang sudah ada dari pekerjaan sebelumnya.

## Validasi

- `pnpm --filter @bananasbindery/web type-check` → PASS
- `pnpm --filter @bananasbindery/web lint` → PASS
- `git diff --check` → PASS

## Catatan revert

Untuk revert pekerjaan admin baseline ini, hapus folder:
- `apps/web/app/admin/`

Dan hapus artifact ini:
- `artifacts/034-2026-05-14-admin-dashboard-products-promos.md`

## Next work yang disarankan

1. Tambahkan admin order management (`/admin/orders`) untuk update status, resi, payment status.
2. Tambahkan audit log saat admin mengubah produk/promo.
3. Tambahkan image upload Supabase Storage supaya admin tidak perlu paste image URL manual.
4. Setelah user approve, apply migration hardening `create_order_v1` yang masih local-only.
