# 08 — Gap Closure Action Plan

Tanggal: 2026-05-15
Basis: verifikasi ulang blocker dari `07-plan.md` terhadap kode aktual.

## Status Verifikasi (per 2026-05-15)

| #   | Blocker (07-plan)                      | Status       | Bukti                                                                                                                                |
| --- | -------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Shipping rate baca cart item salah     | ❌ MASIH     | `shipping/rates/route.ts` baca `item.product?.weight/price/name`, padahal `CartItem` field-nya top-level (`name`, `price`, `weight`) |
| 2   | Shipping cache `insert` bukan `upsert` | ❌ MASIH     | `route.ts` line ~167 `.insert(...)` ke `shipping_rates_cache`                                                                        |
| 3   | Stok tidak dikembalikan saat EXPIRED   | ❌ MASIH     | webhook branch `EXPIRED` tidak panggil `release_order_inventory_v1` (RPC sudah ada di migration `20260514011500`)                    |
| 4   | Webhook tidak update `transactions`    | ❌ MASIH     | webhook hanya update `orders`; `transactions` di-insert di `payment/create` saja                                                     |
| 5   | Webhook terbuka kalau token kosong     | ❌ MASIH     | `if (XENDIT_CALLBACK_TOKEN && ...)` — kalau env kosong, validasi dilewati                                                            |
| 6   | Admin guard tidak konsisten            | ✅ SELESAI   | layout admin punya role guard server-side (artifact 040)                                                                             |
| 7   | Role admin tidak konsisten             | ⚠️ PERLU CEK | `actions.ts` pakai `requireAdmin()`; verifikasi `api/admin/*` & policies                                                             |
| 8   | Admin order detail route hilang        | ❌ MASIH     | `app/admin/orders/` hanya ada `page.tsx`, tidak ada `[id]/`                                                                          |
| 9   | UI update status order                 | ⚠️ PARTIAL   | action `updateOrderStatus` ada; verifikasi UI di list/detail sudah memakainya                                                        |
| 10  | Query `full_name` vs `name`            | ✅ SELESAI   | sudah diganti ke `profiles.name` (artifact 045)                                                                                      |
| 11  | Edit produk destructive delete variant | ❌ MASIH     | `admin-data.ts` `delete().eq('product_id')` lalu insert ulang → FK risk ke `order_items.variant_id`                                  |
| 12  | ProductForm belum lengkap              | ✅ SEBAGIAN  | kategori, promo price, is_active sudah ada (artifact 045); sisanya minor                                                             |
| 13  | Voucher belum konek cart/checkout      | ❌ MASIH     | `checkout/page.tsx` line 153 `const discount = 0;`, input voucher cart statis                                                        |

## Batch Eksekusi

### Batch 1 — CRITICAL (security & data integrity)

1. **Webhook token wajib** (`payment/webhook/route.ts`): tolak request kalau `XENDIT_CALLBACK_TOKEN` kosong DAN saat token mismatch. Fail-closed.
2. **Release inventory saat EXPIRED**: di branch `EXPIRED`, panggil `supabaseAdmin.rpc('release_order_inventory_v1', { p_order_id, p_reason: 'expired' })` sebelum/sesudah update status. Idempotent guard (hanya kalau status belum `expired`).
3. **Edit produk non-destruktif** (`admin-data.ts`): jangan `delete` lalu `insert` variant. Pakai upsert by `id`; variant yang sudah dipakai `order_items` cukup di-update (stock/price/name), bukan dihapus. Hanya hapus variant yang benar-benar di-remove user DAN belum punya order.

### Batch 2 — HIGH (flow correctness)

4. **Shipping item shape** (`shipping/rates/route.ts`): baca `item.name`, `item.price`, `item.weight`, `item.quantity` (top-level sesuai `CartItem`). Hilangkan `item.product?.*`. Pastikan `weight` konsisten satuan (gram vs kg) — `CartItem.weight` saat ini ambiguous, tetapkan = gram.
5. **Shipping cache upsert**: ganti `.insert()` → `.upsert(..., { onConflict: 'origin_area_id,destination_area_id,total_weight,couriers_list' })` + set `expires_at`.
6. **Webhook update transactions**: di branch PAID/SETTLED dan EXPIRED, update row `transactions` (status `paid`/`expired`, `paid_at`, fee/PPN kalau ada di payload) match by `order_id` atau `external_id`.
7. **Admin order detail route**: buat `app/admin/orders/[id]/page.tsx` — tampilkan items, alamat, shipping metadata, timeline status, plus form `updateOrderStatus` + input resi/tracking.

### Batch 3 — MEDIUM (business feature)

8. **Voucher → checkout**:
   - cart/checkout panggil validasi voucher (RPC atau query `vouchers` + cek aktif/kuota/min order).
   - `checkout/page.tsx` ganti `discount = 0` jadi hasil voucher tervalidasi.
   - `create_order_v1` harus rekalkulasi diskon server-side (anti-fraud) + catat pemakaian voucher.
9. **Role consistency audit**: samakan semua guard ke `admin|owner|staff` (atau set matrix per-aksi) di `api/admin/*` & Supabase policies.
10. **ProductForm sisa**: cost price real, validasi default variant wajib (produk tidak boleh aktif tanpa variant/stok).

## Urutan & Validasi

- Kerjakan Batch 1 → `pnpm type-check` + `pnpm test` → commit.
- Batch 2 → type-check + build + smoke test checkout flow → commit.
- Batch 3 → type-check + build → commit.
- Tiap batch: tulis artifact di `artifacts/` (apa/dimana/kenapa/revert).

## E2E Manual Checklist (setelah Batch 1-2)

login → produk → detail → add cart → checkout → shipping rate → create invoice → webhook PAID → order jadi `paid` → shipping metadata masuk → webhook EXPIRED order lain → stok kembali → admin lihat & update status order.
