# 09 — Handoff Sesi Berikutnya

Tanggal dibuat: 2026-05-15
Lanjutan dari: `07-plan.md`, `08-gap-closure-action-plan.md`

Catatan: Supabase MCP terkoneksi ke project `bananabinder` (`xiumxugolyfsvwnwzenp`, ap-southeast-1).
Semua progres sesi ini ada di `artifacts/046`, `047`, `048`.

---

## ✅ Sudah selesai (sesi 2026-05-15)

- Shipping rates: cart item shape fix + cache upsert (artifact 046)
- Xendit webhook: token fail-closed, idempotency `webhook_events`, update `transactions`, release inventory saat EXPIRED (046)
- Guest checkout: `selectedAddressId` ter-set dari alamat hasil OTP (046)
- Weight flow end-to-end: `weight_grams` mengalir produk → cart → ongkir; input berat per-varian di admin (047)
- Admin: form "Origin Pengiriman" di `/admin/promos` (047)
- Alamat toko dikoreksi ke Bogor + `store_settings` di-update via MCP (048)
- **P2.1** Admin order detail route `/admin/orders/[id]` + form update status (049)
- **P2.2** Edit produk non-destruktif (variant match by id, deactivate kalau dipakai order) (049)
- **P2.3** Voucher konek checkout: `create_order_v1` + `p_voucher_code` server-side, `preview_voucher_v1`, `/api/voucher/validate`, cart & checkout UI (049)
- **P3.1** Role guard sudah konsisten (tidak ada perubahan diperlukan) (049)
- **P3.2** 26 covering index FK ditambah (049)
- **P3.3** ProductForm: validasi produk aktif (harga/varian/stok/berat) (049)

---

## 🔴 PRIORITAS 1 — Wajib, blocker ongkir

### 1.1 Resolve Biteship Area ID toko (Bogor)

- `store_settings.origin_area_id` masih `IDNP6M3K2W1` (Tangerang — SALAH).
- Butuh `BITESHIP_API_KEY` dari user.
- Langkah: `curl "https://api.biteship.com/v1/maps/areas?countries=ID&input=Cilendek Timur 16112" -H "Authorization: Bearer <KEY>"` → ambil `id` → update `store_settings.origin_area_id` (via MCP atau `/admin/promos`).
- Verifikasi juga `origin_latitude/longitude` (-6.570345 / 106.7767107) cukup presisi atau perlu titik persis Jl. Cijahe No.60.

### 1.2 Hardcoded fallback `BITESHIP_ORIGIN_AREA_ID`

- Di `apps/web/app/api/shipping/rates/route.ts` & `apps/web/app/api/payment/webhook/route.ts` masih `'IDNP6M3K2W1'`.
- Setelah 1.1 dapat area ID benar, ganti fallback ini juga biar konsisten.

---

## ✅ PRIORITAS 2 — SELESAI (artifact 049)

2.1 Admin order detail route, 2.2 Edit produk non-destruktif, 2.3 Voucher konek checkout — semua selesai.

---

## 🟡 PRIORITAS 3 — sebagian selesai

### 3.1 Role admin konsisten — ✅ SELESAI

Sudah konsisten (`isAdmin`/`requireAdmin` = admin|owner|staff). Tidak ada perubahan.

### 3.2 Supabase advisors — ⚠️ SEBAGIAN

- ✅ 26 covering index FK ditambah (migration `20260515092000`).
- ❌ BELUM: `multiple_permissive_policies` (485 warn) & `auth_rls_initplan` (24 warn) — perlu rewrite RLS policy (gabung policy duplikat, bungkus `auth.uid()` → `(select auth.uid())`). Berisiko, kerjakan hati-hati per tabel + test akses.
- ❌ BELUM: `SECURITY DEFINER` function executable oleh anon/authenticated → audit. Storage `storage_public_read` broad listing → batasi.

### 3.3 ProductForm — ⚠️ SEBAGIAN

- ✅ Validasi produk aktif (harga/varian/stok/berat).
- ❌ BELUM: `cost_price` real per produk/varian (sekarang `cost_price = base_price`). Perlu field input + ubah `AdminProductPayload`/`replaceProductRelations`.

### 3.4 Cek data lama — tugas user

- Produk & varian existing mungkin `weight_grams = 0/500` → audit di `/admin/products`.
- Couriers cache-key (`route.ts`) beda dengan list request Biteship — kosmetik.

---

## 🧪 E2E manual checklist (setelah P1 + P2 selesai)

login/guest OTP → produk → detail → add cart (cek `weight` masuk) → checkout → alamat → ongkir muncul (cek origin Bogor) → create invoice Xendit → bayar → webhook PAID → order `paid` + transactions `paid` + shipping_metadata masuk → biarkan 1 order EXPIRED → stok kembali → admin lihat & update status order.

---

## 🔑 Env yang dibutuhkan user (belum tentu lengkap di .env)

| Env                         | Untuk                       | Catatan                                     |
| --------------------------- | --------------------------- | ------------------------------------------- |
| `BITESHIP_API_KEY`          | ongkir + create order kurir | `biteship_test_*` = mock mode otomatis      |
| `BITESHIP_ORIGIN_AREA_ID`   | fallback origin             | opsional, `store_settings` lebih diutamakan |
| `XENDIT_SECRET_KEY`         | buat invoice                |                                             |
| `XENDIT_CALLBACK_TOKEN`     | webhook                     | WAJIB — webhook fail-closed kalau kosong    |
| `SUPABASE_SERVICE_ROLE_KEY` | webhook + payment/create    |                                             |
| `NEXT_PUBLIC_APP_URL`       | redirect Xendit             |                                             |

Tutorial setup Biteship & Xendit lengkap: lihat ringkasan sesi 2026-05-15 (sudah diberikan ke user, bisa dimasukkan ke README kalau perlu).
