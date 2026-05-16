# Koreksi Alamat Toko ke Bogor (Origin Pengiriman)

Tanggal: 2026-05-15

## Konteks

User memberikan alamat toko yang BENAR (dari kop surat resmi):

> **BANANAS BINDERY**
> Taman Yasmin Sektor V Tahap II, Jl. Cijahe 1 No.60
> Kel. Cilendek Timur, Kec. Bogor Barat, Kota Bogor – 16112, Jawa Barat
> Telp 0895-1954-1180 · email banastuff@gmail.com

Sebelumnya seluruh kode & data pakai alamat SALAH (Kelapa Dua / Tangerang). Ini bikin ongkir salah karena origin jarak dihitung dari Tangerang, bukan Bogor.

## Perubahan Data (Supabase via MCP)

`UPDATE store_settings` SET:

- `origin_address` = alamat Bogor lengkap
- `origin_latitude` = -6.5703450
- `origin_longitude` = 106.7767107 (centroid Kel. Cilendek Timur via Nominatim)
- `origin_area_id` = **MASIH `IDNP6M3K2W1` (Tangerang — SALAH).** Tidak bisa di-resolve tanpa Biteship API key. **User WAJIB ganti** (lihat Follow-up).

## Perubahan Kode

- `apps/web/components/layout/footer.tsx`: alamat & no telp footer → Bogor (`Taman Yasmin... Cilendek Timur, Bogor Barat 16112`, telp `0895-1954-1180`).
- `apps/web/app/api/payment/webhook/route.ts`:
  - Fallback `originLat/Lng` → `-6.570345 / 106.7767107`.
  - `biteshipPayload` shipper/origin: nama `Bananas Bindery`, phone `089519541180`, email `banastuff@gmail.com`, `origin_address` fallback → alamat Bogor, `origin_postal_code` → `16112` (sebelumnya baca `storeSettings?.origin_postal_code` yang kolomnya tidak ada → selalu fallback 15811).
- `apps/web/app/api/shipping/rates/route.ts`: fallback `originLat/Lng` → koordinat Bogor.
- `apps/web/app/admin/promos/page.tsx`: `StoreOriginForm` placeholder & helper text → Bogor (`Cilendek Timur 16112`, lat `-6.570345`, lng `106.7767107`).

## Validasi

- `pnpm type-check` → PASS (8/8).
- Koordinat dari Nominatim: `Cilendek Timur, Bogor Barat, Bogor 16112` → -6.5703450, 106.7767107.

## Catatan Revert

Revert commit ini + `UPDATE store_settings` balik ke nilai lama (origin_address NULL, lat/lng NULL).

## ⚠️ Follow-up WAJIB untuk user

`origin_area_id` masih `IDNP6M3K2W1` (Tangerang). Ongkir TETAP miss sampai ini diganti.
Cara dapat area ID Bogor yang benar:

1. `curl "https://api.biteship.com/v1/maps/areas?countries=ID&input=Cilendek%20Timur%2016112" -H "Authorization: Bearer <BITESHIP_API_KEY>"`
2. Ambil `id` hasil yang cocok "Cilendek Timur, Bogor Barat, Bogor".
3. Masukkan di `/admin/promos` → form "Origin Pengiriman" → field "Biteship Area ID toko" → Simpan.
