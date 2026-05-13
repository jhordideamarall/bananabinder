# Audit Note: Backend Security & Marketing Finalization

**Tanggal:** 2026-05-10
**Task ID:** 021
**Status:** ✅ Completed

## Ringkasan Perubahan

Tugas ini berfokus pada penguatan keamanan autentikasi (anti brute-force) dan penyelesaian logika bisnis untuk mesin marketing (kupon & otomatisasi).

### 1. Keamanan Autentikasi (OTP)
- **File:** `packages/db/src/logic/auth.ts`
- **Perubahan:** Menambahkan mekanisme proteksi brute-force.
- **Rasionale:** Membatasi percobaan input OTP maksimal 5 kali. Jika melebihi batas, kode OTP otomatis dihanguskan (`used: true`) untuk mencegah serangan tebakan otomatis (bot).

### 2. Marketing Engine (Kupon)
- **File:** `packages/db/src/logic/marketing.ts` & `packages/db/src/logic/orders.ts`
- **Perubahan:** 
    - Implementasi fungsi `validateCoupon` untuk pengecekan kuota (`usage_limit`), masa berlaku (`valid_from/until`), dan syarat belanja (`min_purchase_amount`).
    - Upgrade `calculateOrderTotal` untuk mendukung tipe diskon `fixed` (potongan nominal) dan `free_shipping`.
- **Rasionale:** Memastikan sistem promo berjalan akurat dan tidak bocor secara finansial saat digunakan pelanggan.

### 3. Otomatisasi (Abandoned Cart)
- **File:** `apps/web/app/api/cron/abandoned-carts/route.ts`
- **Perubahan:** Membuat endpoint cron job baru.
- **Rasionale:** Menyediakan trigger otomatis bagi Vercel Cron untuk mengirim pengingat WhatsApp ke pengguna yang meninggalkan barang di keranjang > 24 jam.

### 4. Konsolidasi Logistik
- **File:** `packages/db/src/logic/shipping.ts` & `apps/web/app/api/shipping/cost/route.ts`
- **Perubahan:** Memastikan semua alur pengiriman menggunakan data Biteship (Area ID).
- **Rasionale:** Menghapus ambiguitas antara RajaOngkir dan Biteship, mengunci Biteship sebagai solusi logistik utama.

## Verifikasi Teknis
- `pnpm type-check`: **PASS**
- `pnpm lint`: **PASS**
- Git Sync: **PUSHED to main branch**

---
*Catatan: Semua perubahan mematuhi "Zero Any Policy" dan "Monorepo Integrity Mandates".*
