# Biteship Fix — Sandbox Mock Mode

**Tanggal:** 2026-05-05
**Final root cause:** Limitasi Biteship sandbox `biteship_test_*` — `/v1/orders` tidak bisa berhasil untuk kombinasi manapun.

## Sequence Error yang Sudah Dicoba

| Attempt | Payload                                        | Hasil                                                                          |
| ------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| 1       | `courier: biteship/standard` (sandbox dummy)   | `40002031` — pickup tidak didukung                                             |
| 2       | `courier: gojek/instant` (real)                | `40002021` — Gojek instant tidak ada di sandbox                                |
| 3       | `courier: jne/reg` (real, dengan dimensi item) | `40002021 "Failed getting JNE Rates"` — JNE real API tidak ter-link di sandbox |

## Kesimpulan

Biteship sandbox **memang dirancang hanya untuk simulasi rate** (`/v1/rates/couriers`), bukan untuk pembuatan order asli. Tidak ada kombinasi payload yang bisa berhasil di `/v1/orders` dengan key `biteship_test_*`.

## Solusi: Mock Mode

Saat key sandbox terdeteksi, webhook **skip real API call** dan tulis metadata palsu supaya alur UI/database tetap bisa diuji end-to-end. Production tidak terpengaruh.

## Yang Diubah

### 1. `apps/web/app/api/payment/webhook/route.ts`

**Sebelum:** selalu call `https://api.biteship.com/v1/orders`.

**Sesudah:** branch berdasarkan API key:

- `biteship_test_*` → tulis `biteship_order_id = mock_<order_number>_<ts>`, `courier_tracking_id = MOCK-<order_number>`, status `confirmed`. Plus field `mocked: true`.
- Live key → call real API seperti biasa.

Lokasi: setelah `console.log('Attempting Biteship Order Creation...')` (~line 180).

### 2. `apps/web/app/api/shipping/track/[id]/route.ts`

Tambah short-circuit: jika `biteship_order_id` diawali `mock_`, return response tracking simulasi (`status: confirmed`, history dummy) tanpa call Biteship.

## Perilaku Per Environment

| Env           | BITESHIP_API_KEY  | Behavior `/v1/orders` | Behavior `/v1/trackings` |
| ------------- | ----------------- | --------------------- | ------------------------ |
| Dev / Staging | `biteship_test_*` | Mock — fake order ID  | Mock — status confirmed  |
| Production    | Live key          | Real Biteship API     | Real Biteship API        |

Switch ke production tinggal ganti env var, **tanpa ubah kode**.

## Cara Verifikasi

1. Buat order baru, bayar (sandbox Xendit/Midtrans).
2. Cek `shipping_metadata` di DB:
   ```json
   {
     "biteship_order_id": "mock_ORD-...._1234",
     "courier_tracking_id": "MOCK-ORD-....",
     "biteship_status": "confirmed",
     "mocked": true
   }
   ```
3. Buka halaman tracking di UI → status "confirmed" muncul tanpa error.
4. Order yang sebelumnya stuck dengan `biteship_error` perlu dipicu ulang webhook (atau dihapus retry endpoint nanti).

## Cara Revert

Hapus blok `if (isSandbox) { ... } else { ... }` di webhook, kembalikan ke `fetch` original. Hapus blok `mock_` di tracking route.

## TODO (di luar scope)

- [ ] Endpoint `/api/shipping/retry/[orderId]` untuk re-trigger pembuatan order tanpa replay webhook payment.
- [ ] Banner di admin panel: "Sandbox Mode — Biteship calls mocked".
- [ ] Saat ganti ke live key, tambah validasi saldo Biteship sebelum auto-create order.
