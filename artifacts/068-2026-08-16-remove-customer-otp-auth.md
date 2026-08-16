# 068 — Customer Login dan Checkout Tanpa OTP

Tanggal: 2026-08-16

## Apa yang Diubah

- Login customer diubah dari nomor HP + OTP menjadi email/password.
- Registrasi memakai email/password minimal 8 karakter dan tetap menyimpan nomor HP sebagai data kontak.
- Checkout guest membuat sesi Supabase Anonymous Auth saat alamat disimpan, sehingga customer dapat order tanpa login, OTP, WhatsApp, atau email.
- Flow lupa/reset password tidak dipublikasikan karena tidak ada SMTP production yang andal. Halaman placeholder lama dipertahankan dan tidak ditautkan dari login.
- Google OAuth tidak ditampilkan karena provider production belum dikonfigurasi; tidak ada tombol auth yang sengaja dibiarkan gagal.
- Helper, route API, dan Edge Function customer phone OTP yang tidak lagi dipakai dihapus.
- Redirect callback dibatasi ke path internal untuk mencegah open redirect.
- Akses RPC mutasi order `expire_manual_order_v1` dibatasi ke `service_role` sebelum Anonymous Auth diaktifkan.
- Trigger signup menyimpan nomor HP dari metadata Auth secara atomik.
- Config Supabase lokal mengaktifkan anonymous sign-in dan password minimum 8 karakter.

## Lokasi Perubahan

- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/register/page.tsx`
- `apps/web/components/checkout/address-sheet.tsx`
- `apps/web/app/auth/callback/route.ts`
- `apps/web/app/checkout/page.tsx`
- `supabase/config.toml`
- `supabase/migrations/20260816053721_remove_phone_otp_challenges.sql`
- `supabase/migrations/20260816090000_harden_anonymous_checkout_rpc_access.sql`
- `supabase/migrations/20260816090500_preserve_profile_phone_on_email_signup.sql`
- Dihapus: `apps/web/lib/auth-otp.ts`
- Dihapus: `apps/web/lib/phone-otp-server.ts`
- Dihapus: `apps/web/app/api/auth/check-phone/route.ts`
- Dihapus: `apps/web/app/api/auth/phone-otp/send/route.ts`
- Dihapus: `apps/web/app/api/auth/phone-otp/verify/route.ts`
- Dihapus: `supabase/functions/fonnte-otp/index.ts`
- `PRD.md`
- `ARCHITECTURE.md`
- `claudeplan/05-customer-experience-flow.md`
- `artifacts/README.md`
- `artifacts/ui-optimization-log.md`

## Alasan Teknis

- Pengiriman OTP Fonnte berada di critical path login dan checkout. Jika device atau provider bermasalah, customer tidak dapat membuat order.
- Anonymous Auth memberi guest UUID dan session resmi. RPC order serta RLS tetap dapat memvalidasi `auth.uid()` tanpa meminta identitas customer sebelum order.
- Nomor HP pada alamat tetap menjadi kontak penerima, bukan bukti kepemilikan akun.
- Email/password auto-confirm dipilih secara eksplisit agar registrasi tidak bergantung pada Resend/custom SMTP. Konsekuensinya, self-service password recovery belum tersedia sampai SMTP ditambahkan nanti.
- `expire_manual_order_v1` melakukan mutasi order, voucher, campaign, dan stok tanpa ownership check. RPC ini hanya dibutuhkan server action admin yang sudah memakai `requireAdmin` dan client `service_role`.

## Keamanan dan Kompatibilitas Akun

- Dua akun admin production yang diaudit memakai email/password, bukan phone/OTP. UUID, role, password, dan order admin tidak diubah.
- Satu akun customer OTP lama memiliki tiga order. Akun dan seluruh relasinya dipertahankan tanpa merge, penghapusan, atau perubahan `orders.user_id`.
- Anonymous user memakai role JWT `authenticated`, tetapi data tetap terisolasi oleh policy berbasis `auth.uid()`.
- Session guest hanya bertahan pada browser tersebut. Login email/password diperlukan untuk akses lintas perangkat.
- Signup email di-auto-confirm karena SMTP tidak digunakan. Password recovery tidak ditampilkan agar tidak menjanjikan email yang tidak akan terkirim.
- Fonnte tetap tersedia untuk notifikasi operasional lain; hanya jalur customer OTP yang dihapus.
- Riwayat migration local dan remote sedang drift. Deployment database dilakukan per-migration target, bukan `supabase db push` massal.
- Tabel challenge OTP hanya boleh di-drop setelah code baru live dan smoke test berhasil.
- Production sudah merekam migration `20260816090000` dan `20260816090500`; privilege RPC terverifikasi `anon=false`, `authenticated=false`, dan `service_role=true`.
- Auth production sudah memakai Site URL/allow-list domain resmi, Anonymous Auth aktif, email auto-confirm aktif, signup SMS tetap nonaktif, dan password minimum 8 karakter.

## Verifikasi

- Pass: `pnpm lint`.
- Pass: `pnpm test` — 44 test.
- Pass: `pnpm --filter @bananasbindery/web build` — 53 halaman.
- Pass: `pnpm type-check` setelah metadata `.next` diregenerasi oleh production build.
- Pass: ESLint terarah pada file auth dan checkout dengan `--max-warnings=0`.
- Pass: scan tidak menemukan pemanggil route/helper customer OTP aktif.
- Pass: staged diff tidak memuat `any`, secret, dependency, lockfile, atau perubahan di luar scope OTP.
- Pass: Anonymous Auth production menghasilkan session/user anonim valid. User uji divalidasi tidak memiliki alamat/order lalu dihapus kembali.
- Pass: dua akun admin email/password dan satu akun customer OTP lama tetap utuh; tidak ada relasi order yang diubah.

## Urutan Production

1. Terapkan migration hardening RPC dan trigger profile secara eksplisit.
2. Ubah Site URL ke `https://bananasbindery.com`, allow-list callback internal, password minimum ke 8, aktifkan anonymous sign-in, dan aktifkan auto-confirm email.
3. Verifikasi privilege RPC dan konfigurasi Auth melalui endpoint read-only.
4. Deploy code production.
5. Smoke test halaman live dan Anonymous Auth.
6. Setelah stabil, drop tabel challenge OTP lama secara eksplisit.

## Cara Revert

- Revert commit code dan pulihkan helper/route/Edge Function phone OTP.
- Nonaktifkan anonymous sign-in dan email auto-confirm pada Supabase Auth.
- Jika tabel challenge sudah di-drop, buat migration baru dari definisi `20260615030538_phone_otp_challenges.sql`; jangan mengubah migration lama.
- Jangan menyentuh UUID atau relasi order akun lama saat revert.
