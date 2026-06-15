# Custom Fonnte Phone OTP Auth

Tanggal: 2026-06-15

## Masalah

- Checkout guest, login, dan register masih memanggil `supabase.auth.signInWithOtp` sehingga browser mengirim request ke `https://xiumxugolyfsvwnwzenp.supabase.co/auth/v1/otp`.
- Supabase Auth production membalas `400 phone_provider_disabled` karena Phone Auth provider tidak aktif.
- Token Fonnte sudah tersimpan dari Admin Integrations, tetapi tidak pernah dipakai oleh request yang error karena jalurnya masih langsung ke Supabase Phone Auth.

## Keputusan Teknis

- Tidak lagi memakai Supabase Phone Auth untuk customer OTP.
- OTP dibuat oleh server app, disimpan sebagai hash HMAC di tabel `public.phone_otp_challenges`, lalu dikirim via Fonnte memakai token dari Admin Integrations.
- Setelah OTP valid, server membuat atau menyiapkan Supabase Auth user dengan email internal `phone.<digits>@auth.bananasbindery.local` dan password sementara.
- Client melakukan `supabase.auth.signInWithPassword` memakai sesi sementara dari server, sehingga session Supabase tetap normal tanpa memanggil `/auth/v1/otp`.

## Perubahan Kode

- `apps/web/lib/auth-otp.ts`
  - Menambah helper `requestPhoneOtp` dan `verifyPhoneOtpSession` untuk client.
  - Menambah normalisasi nomor Indonesia ke format E.164.
  - Menambah mapper pesan error OTP yang aman untuk user.

- `apps/web/lib/phone-otp-server.ts`
  - Menambah service server-only untuk generate OTP, hash OTP, simpan challenge, kirim WhatsApp via Fonnte, verifikasi OTP, dan menyiapkan Supabase Auth user.
  - Membaca token Fonnte dari `getIntegrationSecret('fonnte', 'api_token', 'FONNTE_API_TOKEN')`.
  - Mempertahankan email profil yang sudah ada agar login via HP tidak menimpa email customer.
  - Mengecek status device Fonnte sebelum membuat OTP challenge.
  - Menghapus OTP challenge jika pengiriman Fonnte gagal setelah challenge dibuat.

- `packages/api-client/src/fonnte.ts`
  - Memperbaiki `checkFonnteDevice` agar status `disconnect` tidak lagi dianggap sukses hanya karena token valid dan device terdaftar.

- `apps/web/app/api/auth/phone-otp/send/route.ts`
  - Endpoint server untuk mengirim OTP Fonnte.

- `apps/web/app/api/auth/phone-otp/verify/route.ts`
  - Endpoint server untuk memverifikasi OTP dan mengembalikan credential sesi sementara.

- `apps/web/app/api/auth/check-phone/route.ts`
  - Cek akun sekarang memakai helper server `phoneAccountExists`, sehingga akun custom Fonnte yang phone-nya tersimpan di `profiles` tetap dianggap terdaftar.

- `apps/web/app/(auth)/login/page.tsx`
  - Mengganti `signInWithOtp` dan `verifyOtp` dengan custom OTP Fonnte.
  - Login tetap dipertahankan, tetapi OTP tidak lewat Supabase Phone Auth.

- `apps/web/app/(auth)/register/page.tsx`
  - Mengganti register OTP ke custom OTP Fonnte.

- `apps/web/components/checkout/address-sheet.tsx`
  - Mengganti checkout guest OTP ke custom OTP Fonnte.
  - Menghapus instruksi kode dummy `123456` dan menggantinya dengan tombol kirim ulang kode.
  - Memindahkan guest checkout ke sheet OTP segera setelah `Simpan & Verifikasi` ditekan, sehingga kegagalan pengiriman Fonnte tidak membuat user stuck di form alamat.

- `supabase/migrations/20260615030538_phone_otp_challenges.sql`
  - Menambah tabel `public.phone_otp_challenges` dengan RLS aktif.
  - Akses table hanya diberikan ke `service_role`, bukan `anon` atau `authenticated`.

- `apps/web/app/terms/page.tsx` dan `apps/web/app/privacy/page.tsx`
  - Menambah halaman legal agar link login/register tidak menghasilkan 404.

- `apps/web/components/layout/header.tsx`, `apps/web/components/layout/desktop-nav.tsx`, `apps/web/components/layout/footer.tsx`, `apps/web/components/shared/product-card.tsx`
  - Membersihkan warning console Next Image `sizes`, animasi `maxWidth`, dan API Framer Motion lama.

## Perubahan Supabase Production

- Migration `phone_otp_challenges` sudah berhasil diaplikasikan via MCP.
- Verifikasi MCP:
  - `phone_otp_table_exists = true`
  - `service_role_can_insert = true`
  - `anon_can_insert = false`
  - `authenticated_can_insert = false`
  - `fonnte_token_configured = true`
- Verifikasi device Fonnte:
  - Token Fonnte valid dan quota terbaca.
  - Status device saat dicek: `disconnect`, sehingga WhatsApp device perlu di-reconnect di dashboard Fonnte sebelum OTP bisa terkirim.

## Validasi

- `rg -n "signInWithOtp|verifyOtp|/auth/v1/otp" apps/web -S` tidak menemukan hasil.
- `pnpm exec prettier --write` untuk file TS/TSX terkait sukses.
- `pnpm --filter @bananasbindery/web type-check` sukses.
- `pnpm exec eslint` untuk file terkait sukses.
- `pnpm --filter @bananasbindery/web build` sukses.
- Local smoke test:
  - `GET http://localhost:4000/login` return `200`.
  - `POST /api/auth/check-phone` berjalan dan membaca jalur server baru.
  - `POST /api/auth/phone-otp/verify` dengan kode invalid return pesan aman: `Kode OTP tidak ditemukan atau sudah kedaluwarsa.`
- Production smoke test setelah deploy:
  - `POST https://bananasbindery.com/api/auth/phone-otp/verify` tersedia dan return JSON error OTP, bukan 404.
  - `GET https://bananasbindery.com/terms` return `200`.
  - `GET https://bananasbindery.com/privacy` return `200`.

## Cara Test Manual

1. Deploy code terbaru ke Vercel dari branch production.
2. Buka checkout sebagai guest atau incognito.
3. Isi alamat dan klik `Simpan & Verifikasi`.
4. Di DevTools Network, request yang benar adalah `POST /api/auth/phone-otp/send`.
5. Tidak boleh ada lagi request `POST https://xiumxugolyfsvwnwzenp.supabase.co/auth/v1/otp`.
6. Masukkan OTP yang masuk via WhatsApp Fonnte.
7. Address harus tersimpan, user harus login, dan checkout bisa lanjut.

## Cara Revert

- Revert file kode yang tercatat di atas.
- Drop tabel jika perlu:
  - `DROP TABLE IF EXISTS public.phone_otp_challenges;`
- Jika ingin kembali ke Supabase Phone Auth, aktifkan Phone Auth provider dan kembalikan `signInWithOtp` / `verifyOtp` di login, register, dan checkout.
