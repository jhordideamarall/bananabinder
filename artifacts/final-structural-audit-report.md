# 🕵️ Final Comprehensive Structural Audit (Technical Deep-Dive) — Bananasbindery Platform

**Tanggal**: 2026-05-05
**Status**: 100% Verified (Full Codebase Scan + Live Supabase MCP Audit)
**Auditor**: Antigravity

---

## 🚩 1. TEMUAN KRITIKAL: Keamanan & Integritas Data

### A. Database Security Breach (RLS OFF)
- **Problem**: Tabel `shipping_rates_cache` dan `store_settings` ditemukan dalam kondisi **RLS DISABLED**.
- **Security Gap**: Siapa pun dengan `anon_key` dapat menghapus/mengubah koordinat toko (`origin_latitude`, `origin_longitude`) yang mengacaukan seluruh kalkulasi ongkir bisnis.
- **Status**: Perbaikan sudah disiapkan di migrasi `20260505100000_shipping_cache_and_store_settings.sql`.

### B. Live Schema Drift (Ghost Columns)
Ditemukan inkonsistensi antara file migrasi lokal dan *real-state* database di Supabase:
| Tabel | Kolom Siluman (Hanya ada di DB) | Status Migrasi Proyek |
| :--- | :--- | :--- |
| `public.addresses` | `biteship_area_id` | **Missing** |
| `public.orders` | `total_weight_grams`, `shipping_metadata`, `payment_metadata` | **Missing** |
- **Dampak**: `pnpm run build` atau `supabase db reset` akan gagal karena kode Next.js mengharapkan kolom ini, tapi database baru tidak akan memilikinya.

---

## 🧩 2. TEMUAN STRUKTURAL: Logic Leakage (9 Services)

Logika bisnis berikut ditemukan "terpenjara" di `apps/web/lib/services/`. Ini melanggar **ARCHITECTURE.md** dan membuat aplikasi Mobile tidak bisa menggunakan logika yang sama.

### 📁 Service Leakage Manifest:
1.  **`order-client.ts`**: Mengandung logika mapping item checkout yang sangat kompleks.
2.  **`shipping-client.ts`**: Logika kalkulasi berat dan pemilihan kurir Biteship.
3.  **`address-client.ts`**: Logika CRUD alamat yang terikat ke `@supabase/ssr`.
4.  **`address-service.ts`**: Duplikasi logika pengambilan data server-side.
5.  **`product-service.ts`**: Mengandung logic fallback gambar dan teks promo *hardcoded*.
6.  **`auth-service.ts`**: Logika session handling yang tidak portabel ke React Native.
7.  **`location-service.ts`**: Integrasi Leaflet/Maps yang harusnya dipisah antara Logic dan UI.
8.  **`checkout-service.ts` (Implicit)**: Logika kalkulasi pajak dan diskon.
9.  **`category-service.ts`**: Fetching hirarki kategori.

---

## ⚙️ 3. TEMUAN LOGIKA: RPC & Automations (Live Audit)

### A. Transactional Logic
- **`create_order_v1`**: Terverifikasi AKTIF. Namun, mapping parameter dari frontend masih manual di `order-client.ts` (risiko *payload mismatch*).
- **Loyalty System**: Terverifikasi pemicu otomatis **`tr_order_loyalty`** AKTIF di database. Poin akan otomatis dikalkulasi saat status order berubah. OK.

### B. State Management Fragmentation
- **`apps/web/stores/cart-store.ts`**: Menggunakan `zustand/persist`. Jika user memasukkan barang ke keranjang di Web, barang tersebut **TIDAK AKAN** muncul di Mobile karena store-nya tidak berbagi logic yang sama (Harus pindah ke `@bananasbindery/store`).

---

## 🎨 4. TEMUAN UI: Primitive Fragmentation

Komponen berikut ditemukan di `apps/web/components/shared/` padahal secara fungsi adalah **UI Primitives** yang harus ada di `@bananasbindery/ui`:
- `price-tag.tsx`, `category-chip.tsx`, `status-badge.tsx`, `skeleton-loader.tsx`.
- **Dampak**: Admin Dashboard (Next.js lain) terpaksa membuat ulang komponen ini dari nol, menyebabkan inkonsistensi desain (Salmon-Orange color drift).

---

## 🛠️ 5. REKOMENDASI PERBAIKAN 100% (Roadmap)

1.  **URGENT**: Jalankan migrasi `20260505100000` untuk menambal RLS dan Kolom Siluman.
2.  **PHASE 1**: Inisialisasi `@bananasbindery/api-client` dan pindahkan 9 servis di atas.
3.  **PHASE 2**: Ekstrak `cart-store` ke `@bananasbindery/store`.
4.  **PHASE 3**: Pindahkan UI Primitives ke `@bananasbindery/ui`.

---
*Laporan ini diverifikasi secara manual oleh Antigravity untuk memastikan keberhasilan implementasi oleh Opus 4.6.*
