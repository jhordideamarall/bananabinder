# Priority 2 & 3 — Order Detail, Non-Destructive Variant, Voucher, Indexes

Tanggal: 2026-05-15
Basis: `claudeplan/09-next-session-handoff.md` Prioritas 2 & 3.

## 2.1 Admin Order Detail Route

- **Baru** `apps/web/lib/admin-data.ts` → `getAdminOrderDetail()` + tipe `AdminOrderDetail`/`AdminOrderItem`. Fetch order + `order_items` + `products.product_images` + `profiles` + `addresses`.
- **Baru** `apps/web/app/admin/orders/[id]/page.tsx` — halaman detail: item pesanan + ringkasan harga, kartu pelanggan & alamat, kartu pengiriman (kurir/resi/status Biteship), form update status (`updateOrderStatus` action), timeline. Sebelumnya link dari list → 404.
- `apps/web/app/admin/actions.ts` `updateOrderStatus`: tambah `revalidatePath('/admin/orders/${orderId}')`.

## 2.2 Non-Destructive Variant Edit

Sebelumnya `replaceProductRelations` `delete all variants + insert ulang` → risiko FK `order_items.variant_id` + histori order rusak / id varian berubah.

- `apps/web/components/admin/ProductForm.tsx`: `Variant` & `ProductVariantRow` + field `id`. `variantFromRow` membawa `id`. Submit payload otomatis kirim `id` (via spread).
- `apps/web/lib/admin-data.ts` `AdminProductPayload.variants[]` + `id?`. `replaceProductRelations` ditulis ulang:
  - Images tetap delete+insert (tidak ada FK ke order).
  - Variants: punya `id` → UPDATE in place; tanpa `id` → INSERT. Id lama yang tidak dikirim lagi → DELETE kalau belum dipakai `order_items`, kalau sudah dipakai cukup `is_active = false` (histori order aman).

## 2.3 Voucher → Checkout (server-side, anti-fraud)

- **Migration** `20260515090000_create_order_v1_voucher.sql` (applied via MCP): `create_order_v1` + param `p_voucher_code`. Diskon divalidasi & dihitung ulang di DB (aktif, rentang tanggal, `min_order`, `usage_limit`), set `orders.voucher_id`, insert `voucher_usages`, increment `vouchers.used_count` — atomik.
- **Migration** `20260515091000_preview_voucher_v1.sql` (applied via MCP): RPC `preview_voucher_v1(code, subtotal)` SECURITY DEFINER → JSON `{valid, discount, message}` untuk preview UI.
- **Baru** `apps/web/app/api/voucher/validate/route.ts` — POST `{code, subtotal}` → panggil `preview_voucher_v1`.
- `packages/api-client/src/types.ts` `CheckoutPayload` + `voucherCode?`. `orders.ts` kirim `p_voucher_code`.
- `apps/web/stores/cart-store.ts`: state `voucherCode`/`voucherDiscount` + `setVoucher`/`clearVoucher`, di-clear oleh `clearCart`.
- `apps/web/app/cart/page.tsx`: input voucher fungsional (apply via API, chip voucher terpasang + tombol lepas, re-validasi saat subtotal berubah, baris diskon di ringkasan).
- `apps/web/app/checkout/page.tsx`: `discount` dari `voucherDiscount` (bukan `0` hardcoded), `total = subtotal - discount + ongkir`, kirim `voucherCode` ke `createOrder`, baris diskon di ringkasan step Bayar.
- `packages/types/src/supabase.ts` di-regenerate via MCP (ada `p_voucher_code` & `preview_voucher_v1`).

## 3.1 Role Consistency — sudah konsisten

`lib/admin.ts isAdmin` & `actions.ts requireAdmin` keduanya pakai `['admin','owner','staff']`. Semua `api/admin/*` pakai `isAdmin`. `flash-sales/route.ts` cuma stub (410). Tidak ada perubahan diperlukan.

## 3.2 Supabase Performance Advisors

- **Migration** `20260515092000_add_covering_indexes_for_foreign_keys.sql` (applied via MCP): 26 covering index untuk FK yang ditandai advisor (additive, `IF NOT EXISTS`).
- **Belum dikerjakan (follow-up):** `multiple_permissive_policies` (485) & `auth_rls_initplan` (24) — perlu rewrite RLS policy hati-hati, berisiko, ditunda. `unused_index` (25) — tidak di-drop (berisiko).

## 3.3 ProductForm Validation

`apps/web/components/admin/ProductForm.tsx` `handleSubmit`: produk aktif wajib harga > 0, minimal 1 varian, total stok > 0, dan setiap varian punya berat > 0. Cegah katalog "bisa dibeli tapi Rp 0 / 0 stok".

## Validasi

- `pnpm type-check` → PASS (8/8)
- `pnpm --filter @bananasbindery/web lint` → PASS

## Catatan Revert

- DB: 3 migration baru — revert dengan restore signature `create_order_v1` lama (14 param) dari `20260514003000`, `DROP FUNCTION preview_voucher_v1`, `DROP INDEX idx_*` (26 index).
- Kode: semua perubahan additive; revert per file sesuai daftar di atas.

## Sisa (belum)

- 3.2 RLS optimization (multiple_permissive_policies, auth_rls_initplan).
- 3.3 cost_price real per produk/varian (data-model change).
- 3.4 audit data berat produk/varian lama — tugas user di `/admin/products`.
- Biteship area_id Bogor (Prioritas 1 dari plan 09) — masih butuh API key user.
