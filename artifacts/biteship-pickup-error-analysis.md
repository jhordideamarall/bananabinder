# 🚨 Biteship Pickup Service Error (40002031) - Analysis & Resolution (UPDATED)

## 🔍 Masalah Utama
Error `40002031: Existing courier cannot provide pickup service` terus muncul di **Production/Vercel** meskipun kurir sudah di-override ke `biteship`.

### Akar Permasalahan (Root Cause) - RE-EVALUATED
1. **Wrong Courier Type**: Penggunaan `courier_type: "shipper"` terbukti GAGAL. Dokumentasi Biteship sebenarnya meminta `courier_type: "standard"` untuk simulasi kurir `biteship`.
2. **Environment Variable Sync**: Ada kemungkinan `BITESHIP_API_KEY` di Vercel belum terbaca dengan prefix yang benar sehingga override kurir tidak terpancing.
3. **Area ID Mismatch**: Jika `destination_area_id` (milik customer) tidak valid di mata Biteship, mereka akan menolak pickup meskipun kurirnya benar.

## 🛠️ Solusi Teknis (Final Spec for AI)

Setiap AI yang menangani ini wajib menggunakan spek berikut untuk **Testing Mode**:

### 1. Deteksi Mode Testing
- Gunakan `BITESHIP_API_KEY.startsWith('biteship_test')`. Pastikan variabel ini tersedia di environment.

### 2. Payload Simulasi (WAJIB)
- **`courier_company`**: `"biteship"`
- **`courier_type`**: `"standard"` (BUKAN `"shipper"`)
- **`delivery_type`**: `"now"`
- **`origin_collection_method`**: `"pickup"`
- **`origin_latitude` & `origin_longitude`**: Wajib dikirimkan (Toko Kelapa Dua: `-6.2604822`, `106.6296424`).
- **`destination_area_id`**: Pastikan ini adalah ID Biteship yang valid (Contoh: `IDNP3IDNC445IDND5601`).

## 📌 Update Terakhir (2026-05-05)
Percobaan dengan `courier_type: "shipper"` telah dilakukan dan **GAGAL**. Langkah selanjutnya adalah memastikan sinkronisasi `area_id` customer dan menggunakan kembali `courier_type: "standard"`.

## ⚠️ Larangan Keras
- **DILARANG** mencoba kurir asli (JNE, J&T) di Sandbox untuk flow pickup.
- **WAJIB** baca file ini sebelum melakukan modifikasi pada `apps/web/app/api/payment/webhook/route.ts`.
