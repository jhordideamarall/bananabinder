# Integrasi 3rd Party - Bananasbindery

Dokumen ini menjelaskan langkah-langkah untuk menghubungkan layanan pihak ketiga ke backend Bananasbindery.

## 1. Supabase (Database & Auth)
Backend sudah terhubung ke project: `xiumxugolyfsvwnwzenp`.
- **Langkah**: Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah benar di `.env`.

## 2. Xendit (Payment Gateway)
Backend menggunakan fitur **Invoices v2**.
- **API Key**: Dapatkan `Secret Key` dari Xendit Dashboard > Settings > Developers > API Keys.
- **Webhook Token**: Dapatkan `Webhook Verification Token` dari Settings > Developers > Webhooks.
- **Webhook URL**: Masukkan URL berikut di dashboard Xendit:
  `https://your-domain.com/api/webhooks/xendit`
- **Events**: Pilih event `Invoice Paid` dan `Invoice Expired`.

## 3. RajaOngkir (Logistik)
Backend dirancang untuk akun **RajaOngkir Pro** agar bisa akses level kecamatan.
- **API Key**: Dapatkan dari RajaOngkir Dashboard.
- **Origin**: Default diset ke Yogyakarta (ID: 501). Bisa diubah di `apps/web/app/api/shipping/cost/route.ts`.

## 4. Fonnte (WhatsApp OTP)
Digunakan untuk pengiriman OTP dan reminder Abandoned Cart.
- **Token**: Dapatkan `API Token` dari Fonnte Dashboard.
- **Status**: Jika token kosong, OTP akan muncul di terminal console (Dev Mode).

## 5. Cron Jobs (Abandoned Cart)
Untuk menjalankan fitur reminder otomatis:
- **Route**: `GET /api/cron/abandoned-cart?token=YOUR_SUPABASE_SERVICE_ROLE_KEY`
- **Scheduler**: Gunakan Vercel Cron atau Github Actions untuk memanggil URL ini setiap 6-12 jam.
