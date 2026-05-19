# Final Integration Audit: Xendit, Biteship, Fonnte

Tanggal audit: 19 Mei 2026
Domain production: `https://bananasbindery.com`
Halaman admin: `/admin/integrations`

## Verdict

Codebase sudah berada di arsitektur yang benar untuk tujuan utama project ini: client non-dev bisa mengisi credential Xendit, Biteship, dan Fonnte dari halaman admin tanpa perlu menyentuh env Vercel lagi.

Statusnya siap untuk live validation, dengan catatan penting: live key Xendit/Biteship/Fonnte, aktivasi Order API Biteship, saldo Biteship, payment channel Xendit, dan webhook dashboard vendor tetap harus diaktifkan di dashboard masing-masing vendor. Source code tidak bisa mengaktifkan izin bisnis/vendor-side itu sendiri.

Kesimpulan paling praktis:

- Setup Supabase/env inti sudah cukup: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
- Secret vendor sudah dipindahkan ke Admin Integrations dan disimpan server-side melalui Supabase, bukan client/browser.
- Xendit invoice, Xendit webhook, Biteship rates, Biteship order, Biteship tracking, Biteship webhook, dan Fonnte notification sudah punya jalur code yang jelas.
- Origin toko sudah benar mengambil `store_settings.origin_area_id` dari Admin Settings/Leaflet, bukan hard-coded localhost atau input manual terpisah.
- Status webhook di admin sudah dibuat jujur: hijau hanya setelah event webhook nyata masuk ke `webhook_events`.

## Dokumentasi Resmi Yang Dijadikan Acuan

- Xendit Payment Link/Invoice memakai `POST /v2/invoices`: https://docs.xendit.co/docs/payment-links-api-overview
- Xendit API auth memakai Basic Auth dengan secret key sebagai username: https://docs.xendit.co/apidocs
- Xendit webhook wajib server-side, idempotent, dan memvalidasi `x-callback-token`: https://docs.xendit.co/docs/handling-webhooks
- Xendit webhook retry/event history: https://docs.xendit.co/apidocs/webhook-behavior
- Biteship Maps Area memakai `GET /v1/maps/areas`: https://biteship.com/en/docs/api/maps/search_area
- Biteship Rates memakai `POST /v1/rates/couriers`: https://biteship.com/en/docs/api/rates/retrieve
- Biteship Order memakai `POST /v1/orders`: https://biteship.com/en/docs/api/orders/create
- Biteship Tracking memakai `GET /v1/trackings/:id` dan public tracking by waybill/courier: https://biteship.com/en/docs/api/trackings/overview
- Biteship webhook events `order.status`, `order.price`, `order.waybill_id`: https://biteship.com/id/docs/api/webhook/overview
- Fonnte send message memakai `https://api.fonnte.com/send` dan token Authorization: https://docs.fonnte.com/api-send-message/
- Fonnte device profile memakai `https://api.fonnte.com/device`: https://docs.fonnte.com/api-device-profile/

## Implementasi Codebase

### Admin Integrations

File utama:

- `apps/web/app/admin/integrations/page.tsx`
- `apps/web/app/admin/integrations/actions.ts`
- `apps/web/components/admin/integrations/IntegrationSetup.tsx`
- `apps/web/lib/integration-secrets.ts`

Kemampuan admin sekarang:

- Melihat credential yang sudah tersimpan tanpa menampilkan nilai secret asli.
- Save/update/delete credential Xendit, Biteship, dan Fonnte.
- Toggle mode test/production untuk Xendit dan Biteship.
- Test Xendit balance/callback token.
- Test Biteship sandbox key, couriers, rates, dan readiness order API.
- Test Fonnte device dan kirim pesan test.
- Copy endpoint webhook production:
  - Xendit: `https://bananasbindery.com/api/payment/webhook`
  - Biteship: `https://bananasbindery.com/api/shipping/webhook`
- Melihat status webhook berdasarkan event nyata yang masuk ke database.

### Secret Handling

Secret vendor disimpan di tabel `integration_secrets` dan dibaca server-side melalui RPC `get_integration_secret`. Browser hanya menerima status seperti "tersimpan" atau "belum ada", bukan nilai credential.

Fallback env masih tersedia untuk kompatibilitas lama:

- `XENDIT_SECRET_KEY`
- `XENDIT_CALLBACK_TOKEN`
- `BITESHIP_API_KEY`
- `BITESHIP_WEBHOOK_TOKEN`
- `FONNTE_API_TOKEN`

Namun flow yang disarankan untuk client adalah Admin Integrations, bukan Vercel env.

### Xendit

File utama:

- `apps/web/app/api/payment/create/route.ts`
- `apps/web/app/api/payment/webhook/route.ts`

Yang sudah sesuai:

- Invoice dibuat ke `POST https://api.xendit.co/v2/invoices`.
- Auth header memakai Basic Auth dari secret key.
- Redirect URL memakai production domain saat `NEXT_PUBLIC_APP_URL` non-localhost.
- Webhook memvalidasi `x-callback-token`.
- Webhook fail-closed jika callback token belum diisi atau salah.
- Webhook idempotent via `webhook_events`.
- Status `PAID`/`SETTLED` mengubah order dan transaction menjadi paid.
- Status `EXPIRED` mengembalikan inventory lewat RPC server-side.

Yang harus client lakukan di Xendit Dashboard:

- Isi live secret key dan live callback token di Admin Integrations.
- Set mode Xendit ke Production.
- Daftarkan webhook URL `https://bananasbindery.com/api/payment/webhook`.
- Pastikan payment channel yang dipakai sudah aktif di live account.

### Biteship

File utama:

- `apps/web/app/api/shipping/areas/route.ts`
- `apps/web/app/api/shipping/rates/route.ts`
- `apps/web/app/api/payment/webhook/route.ts`
- `apps/web/app/api/shipping/webhook/route.ts`
- `apps/web/app/api/shipping/track/[id]/route.ts`
- `apps/web/app/api/admin/store-location/resolve/route.ts`

Yang sudah sesuai:

- Area ID dicari lewat `GET /v1/maps/areas`.
- Ongkir dihitung lewat `POST /v1/rates/couriers`.
- Payload rates memakai `origin_area_id`, `destination_area_id`, `couriers`, dan `items`.
- Koordinat tetap dikirim jika tersedia untuk mendukung instant courier.
- Origin toko berasal dari `store_settings`: area id, alamat, kode pos, latitude, longitude.
- Destination customer berasal dari alamat user: `biteship_area_id`, full address, kode pos, latitude, longitude.
- Setelah Xendit paid, code membuat Biteship order live via `POST /v1/orders`.
- Payload order punya contact origin/destination, area id, postal code, courier company/type, pickup, dan item dimensions.
- Tracking memakai Biteship tracking id, lalu fallback public tracking by waybill/courier.
- Webhook menerima `order.status`, `order.price`, dan `order.waybill_id`.
- Webhook Biteship bisa diamankan dengan token custom dari Admin Integrations.

Yang harus client lakukan di Biteship Dashboard:

- Aktifkan Order API. Rates dan Tracking saja belum cukup.
- Isi live API key di Admin Integrations.
- Isi webhook token di Admin Integrations.
- Set mode Biteship ke Production.
- Daftarkan webhook URL `https://bananasbindery.com/api/shipping/webhook`.
- Aktifkan event `order.status`, `order.price`, dan `order.waybill_id`.
- Pastikan saldo Biteship cukup.
- Pastikan courier yang dipilih di dashboard/client memang tersedia untuk origin-destination live.

Catatan jujur:

- Biteship sandbox tidak selalu identik dengan live order flow. Code sengaja memakai mock order untuk sandbox key agar UI/tracking bisa diuji tanpa membuat shipment palsu.
- Final proof untuk Biteship tetap harus live small transaction karena courier pickup, saldo, dan aktivasi Order API adalah state vendor-side.

### Fonnte

File utama:

- `packages/api-client/src/fonnte.ts`
- `apps/web/app/admin/integrations/actions.ts`
- `apps/web/app/api/payment/create/route.ts`
- `apps/web/app/api/custom-orders/route.ts`

Yang sudah sesuai:

- Send message memakai `POST https://api.fonnte.com/send`.
- Device check memakai `POST https://api.fonnte.com/device`.
- Token dikirim di header `Authorization`.
- Nomor telepon dinormalisasi ke format Indonesia.
- Pesan custom order bisa dikirim setelah invoice dibuat.
- Admin bisa test device dan kirim pesan test.

Yang harus client lakukan:

- Isi Fonnte API token di Admin Integrations.
- Pastikan WhatsApp device di Fonnte connected.
- Jalankan test device dari admin.
- Jalankan test message ke nomor yang dikontrol client.

## State Production Saat Audit MCP

Supabase production sudah dicek lewat MCP pada 19 Mei 2026:

- Store origin:
  - `origin_area_id`: `IDNP9IDNC74IDND6713`
  - `origin_postal_code`: `16112`
  - koordinat: `-6.570379889102544`, `106.77665412425996`
  - alamat: `Cilendek Timur, Bogor Barat, Bogor, Jawa Barat, Jawa, 16112, Indonesia`
- Credential yang sudah tersimpan:
  - Biteship test key: ada, test sukses.
  - Xendit test secret key: ada, test sukses.
  - Xendit test callback token: ada, test sukses.
- Credential yang belum terlihat di production saat audit:
  - Biteship live API key.
  - Biteship webhook token.
  - Xendit live secret key.
  - Xendit live callback token.
  - Fonnte API token.
- Webhook event:
  - Belum ada event Xendit/Biteship yang masuk ke `webhook_events`.
- Guard order RPC:
  - `anon` tidak bisa execute `create_order_v1`.
  - `authenticated` bisa execute `create_order_v1`.
  - `authenticated` tidak bisa execute `release_order_inventory_v1`.
  - `service_role` bisa execute `release_order_inventory_v1`.
  - Function `create_order_v1` punya guard `auth.uid()`.

## Flow Customer Tetap Seamless

Flow OTP tidak dihilangkan:

1. Customer pilih titik/alamat.
2. Customer isi nama dan nomor HP.
3. Jika belum login, app kirim OTP Supabase ke nomor HP.
4. Setelah OTP valid, Supabase membuat session/user.
5. Alamat disimpan ke user tersebut.
6. Checkout membuat order sebagai authenticated user.

Perubahan security di RPC tidak merusak flow ini. Guard justru memastikan order hanya bisa dibuat untuk `auth.uid()` yang sedang login, sehingga user tidak bisa spoof order atas nama user lain.

## Checklist Live Test Paling Aman

Ini langkah minimum untuk membuktikan production benar-benar jalan:

1. Isi live credential di `/admin/integrations`.
2. Set Xendit dan Biteship ke Production.
3. Di Xendit Dashboard, pasang webhook `https://bananasbindery.com/api/payment/webhook`.
4. Di Biteship Dashboard, aktifkan Order API, pasang webhook `https://bananasbindery.com/api/shipping/webhook`, dan pilih event `order.status`, `order.price`, `order.waybill_id`.
5. Pastikan Biteship balance cukup.
6. Pastikan Fonnte device connected, lalu test device dan pesan.
7. Buat produk murah untuk test.
8. Checkout sebagai customer baru dengan nomor HP asli dan alamat valid.
9. Pastikan ongkir muncul.
10. Pilih kurir yang benar-benar tersedia.
11. Bayar invoice Xendit live.
12. Cek Admin Orders:
    - order berubah paid,
    - transaction paid,
    - `shipping_metadata.biteship_order_id` terisi,
    - tracking/waybill muncul jika courier sudah membuatnya.
13. Cek Admin Integrations:
    - Xendit webhook signal berubah setelah webhook paid masuk,
    - Biteship webhook signal berubah setelah Biteship mengirim event.
14. Cek customer order page:
    - status order terlihat,
    - tracking bisa dibuka jika Biteship sudah menyediakan tracking id/waybill.

## Risiko Yang Masih Perlu Dipahami

Tidak ada codebase yang bisa menjamin 100% live tanpa transaksi nyata karena beberapa hal berada di luar source code:

- Aktivasi live account/payment channel Xendit.
- Callback token dan webhook dashboard Xendit.
- Aktivasi Order API Biteship.
- Saldo Biteship.
- Coverage courier untuk origin-destination tertentu.
- Device WhatsApp Fonnte sedang connected atau tidak.

Namun dari sisi codebase, jalur integrasi sudah dibuat agar kegagalan vendor terlihat jelas:

- Test admin menampilkan sukses/gagal.
- Webhook status tidak dipalsukan.
- Secret tidak dibuka ulang ke browser.
- Error Biteship order disimpan ke `shipping_metadata.biteship_error`.
- Webhook event tersimpan untuk audit/idempotency.

## Catatan Reuse Untuk Client Berikutnya

Untuk reuse codebase ke client ecommerce lain:

1. Deploy ke domain production client.
2. Isi Supabase env inti di Vercel.
3. Setup Supabase project/migration.
4. Buka Admin Settings dan set lokasi toko via map.
5. Pastikan `origin_area_id` terdeteksi.
6. Buka Admin Integrations.
7. Isi Xendit, Biteship, dan Fonnte credential.
8. Copy webhook URL dari Admin Integrations ke dashboard vendor.
9. Jalankan test admin.
10. Jalankan satu live transaction kecil.

Dengan pola ini, client tidak perlu akses Vercel untuk rotasi token vendor. Developer hanya tetap dibutuhkan untuk setup awal Supabase/domain/deploy dan jika ada perubahan kontrak API vendor.

## Validasi Lokal Terakhir

Perintah yang sudah dijalankan:

- `npm run type-check` di `packages/api-client`
- `npm run type-check` di `apps/web`
- Sebelum audit ini, build/lint/type-check web juga sudah lolos pada commit integrasi terakhir.

Perubahan kecil pada audit ini:

- Parser Fonnte device sekarang membaca `device_status` dari response `/device`, sesuai dokumentasi Fonnte.

## Final Decision

Codebase ini sudah best-practice untuk target productized ecommerce integration wizard: credential dikelola admin, secret tetap server-side, mode test/production jelas, webhook status berbasis event nyata, origin toko berasal dari settings, dan customer checkout tetap seamless via phone OTP.

Langkah berikutnya bukan refactor besar. Langkah berikutnya adalah live validation terkontrol dengan credential production dan order kecil.
