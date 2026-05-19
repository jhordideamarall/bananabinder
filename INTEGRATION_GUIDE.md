# Integrasi 3rd Party - Bananasbindery

Dokumen ini menjelaskan langkah-langkah untuk menghubungkan layanan pihak ketiga ke backend Bananasbindery.

## 1. Supabase (Database & Auth)

Backend sudah terhubung ke project: `xiumxugolyfsvwnwzenp`.

- **Langkah**: Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah benar di `.env`.

## 2. Xendit (Payment Gateway)

Backend menggunakan **Payment Link / Invoices v2** (`POST /v2/invoices`) dan redirect customer ke `invoice_url`.

- **Env**: isi `XENDIT_SECRET_KEY` dan `XENDIT_CALLBACK_TOKEN`.
- **API Key**: Dapatkan Secret Key dari Xendit Dashboard > Settings > Developers > API Keys.
- **Webhook Token**: Dapatkan `Webhook Verification Token` dari Settings > Developers > Webhooks.
- **Webhook URL**: Masukkan URL berikut di dashboard Xendit:
  `https://your-domain.com/api/payment/webhook`
- **Events**: aktifkan invoice/payment link webhook untuk status `PAID` dan `EXPIRED`.

## 3. Biteship (Logistik)

Backend menggunakan Biteship untuk search area, rates, create shipment setelah payment paid, dan tracking webhook.

- **Env/Admin**: isi `BITESHIP_API_KEY` untuk live key. `BITESHIP_TEST_API_KEY` opsional untuk sandbox/aktivasi Order API. `BITESHIP_ORIGIN_AREA_ID` hanya fallback karena origin utama dibaca dari Admin > Settings.
- **Origin**: atur alamat toko, koordinat, dan Biteship Area ID di Admin > Settings.
- **Webhook URL**: masukkan `https://your-domain.com/api/shipping/webhook` di Biteship dashboard.
- **Events**: aktifkan `order.status`, `order.price`, dan `order.waybill_id` jika tersedia.

## 4. Fonnte (WhatsApp OTP)

Digunakan untuk WhatsApp notifikasi dan konfirmasi custom order.

- **Env**: isi `FONNTE_API_TOKEN`.
- **Token**: Dapatkan token dari Fonnte Dashboard > Device.
- **Test**: login admin lalu pakai `GET /api/test/fonnte` untuk cek device dan `POST /api/test/fonnte` untuk kirim pesan tes.
