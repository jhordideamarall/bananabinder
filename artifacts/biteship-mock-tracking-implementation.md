# Biteship Tracking & Architectural Recovery Report

**Tanggal:** 2026-05-05
**Melanjutkan Pekerjaan:** Opus (Final Recovery Report)

## Konteks & Objektif

Opus sebelumnya telah melakukan "Final Recovery" dengan memperbaiki data di database dan memperkenalkan **Mock Mode** untuk memastikan fitur UI bisa ditest tanpa terkena limitasi API Sandbox Biteship.

Sebagai kelanjutannya, pekerjaan ini berfokus pada **Penyempurnaan Arsitektur** dan **Kesiapan Presentasi (Client-Ready)**.

## Perubahan Arsitektur (Robust Courier Mapping)

Sebelumnya, webhook mengandalkan pemotongan teks (parsing string) seperti `"JNE - Reguler"` untuk menebak kode kurir. Ini sangat rawan error.

**Tindakan yang Diambil:**

1. **Database Upgrade:** Menambahkan kolom `shipping_courier_code` dan `shipping_service_code` ke tabel `orders`.
2. **Supabase RPC:** Memodifikasi `create_order_v1` untuk menyimpan kedua kode tersebut sejak dari Checkout.
3. **Webhook Logic:** Menghilangkan parsing string dan menggantinya dengan pemanggilan `courier_company` dan `courier_type` asli langsung dari database, baik di mode live maupun sandbox.

## Enhancement untuk Demo & Presentasi

Agar presentasi dengan client terlihat realistis:

1. **Real Codes in Sandbox:** Penggunaan `courier_company: biteship` telah dihapus. Sistem kini mengirim `jne` atau `gojek` ke sandbox agar simulasi yang terjadi di Biteship mendekati proses aslinya.
2. **Dynamic Mock Tracking:** File `track/[id]/route.ts` telah diubah agar tidak hanya mengembalikan status statis "Confirmed", melainkan simulasi alur lengkap:
   - `Confirmed` (10 menit lalu)
   - `Allocated` (5 menit lalu)
   - `Picking Up` (Sekarang - Kurir sedang menuju lokasi penjemputan)

## Status Fungsionalitas Aplikasi

- **Local Testing:** Fitur ini **BISA DITEST 100% DI LOKAL** menggunakan `pnpm dev`. Semua simulasi tracking dan webhook berjalan sempurna di localhost.
- **OTP & Auth Flow:** Modifikasi yang dilakukan **TIDAK MENYENTUH** area autentikasi sama sekali. Fitur OTP (Fonnte) dan manajemen sesi Supabase tetap berjalan mulus seperti sedia kala.
- **Tracking UI:** Client dapat membuka menu "Riwayat Pesanan" dan melihat progres pengiriman dengan status yang realistis.

## Kesimpulan

Aplikasi telah mencapai tahap siap presentasi dengan alur logistik yang dapat mensimulasikan proses nyata tanpa menimbulkan error 40002031 atau menghabiskan saldo produksi.
