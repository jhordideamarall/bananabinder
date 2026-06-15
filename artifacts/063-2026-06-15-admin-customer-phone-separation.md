# Admin Customer Phone Separation

Tanggal: 2026-06-15

## Masalah

- Saat nomor HP yang sama dipakai untuk test checkout OTP, helper custom Fonnte OTP menemukan profile berdasarkan `profiles.phone`.
- Karena profile admin sebelumnya masih punya nomor HP tersebut, proses OTP customer berisiko menyiapkan session pada user admin dan menulis metadata customer ke akun admin.
- Dampak yang terlihat: login publik/customer terasa menimpa identitas admin.

## Perubahan Database Production

- Akun admin dipulihkan sebagai akun admin terpisah:
  - `profiles.email`: `admin@bananasbindery.com`
  - `profiles.name`: `Admin`
  - `profiles.role`: `admin`
  - `profiles.phone`: `NULL`
  - `auth.users.phone`: `NULL`
  - `auth.users.raw_user_meta_data.full_name`: `Admin`
  - `auth.users.raw_user_meta_data.auth_channel`: `admin`

## Perubahan Kode

- `apps/web/lib/phone-otp-server.ts`
  - `findProfileByPhone` sekarang membaca field `role`.
  - Profile dengan role `admin`, `owner`, atau `staff` diproteksi dari OTP publik.
  - Jika nomor HP masih terkait role protected, helper melempar `ProtectedPhoneError`.
  - `sendPhoneOtp` mengecek profile protected sebelum membuat challenge OTP atau mengirim WA Fonnte.
  - `upsertProfilePhone` tidak akan mempertahankan role protected pada jalur customer.

- `apps/web/app/api/auth/check-phone/route.ts`
  - Error nomor protected dikembalikan sebagai HTTP `409`, bukan `500`.

- `apps/web/app/api/auth/phone-otp/send/route.ts`
  - Error nomor protected dikembalikan sebagai HTTP `409`, agar UI bisa menampilkan pesan aman.

- `apps/web/app/api/auth/phone-otp/verify/route.ts`
  - Error nomor protected dikembalikan sebagai HTTP `409` bila challenge lama masih mencoba memverifikasi akun protected.

## Alasan Teknis

- `profiles.phone` memiliki constraint unik, jadi satu nomor HP tidak boleh menjadi identitas admin dan customer sekaligus.
- Admin harus tetap login melalui jalur admin email/password, sedangkan customer memakai custom OTP Fonnte.
- Guard role protected mencegah checkout/register/login publik mengambil alih akun admin walaupun ada data phone lama yang belum dibersihkan.
- Scope perubahan hanya auth OTP dan data admin. Flow checkout, order, payment, shipping, dan UI tidak diubah.

## Validasi

- Supabase MCP mengembalikan akun admin:
  - `id = b8e67e57-6bb7-45bd-854e-244094b2d39e`
  - `name = Admin`
  - `email = admin@bananasbindery.com`
  - `phone = NULL`
  - `role = admin`
  - `auth_phone = NULL`
  - `auth_channel = admin`

- Nomor customer test tidak lagi ditemukan pada profile admin setelah `profiles.phone` admin dikosongkan.

## Cara Test Manual

1. Logout dari admin lalu login kembali via `/admin-login` memakai email admin.
2. Buka checkout sebagai guest/incognito.
3. Masukkan nomor HP customer yang dipakai untuk test.
4. Klik `Simpan & Verifikasi`.
5. Sheet OTP harus muncul dan request harus ke `POST /api/auth/phone-otp/send`.
6. Setelah OTP benar, customer harus login sebagai akun customer baru/terpisah, bukan admin.
7. Cek `/admin` dari session customer: harus ditolak/redirect.

## Cara Revert

- Revert file kode yang tercatat di atas.
- Jika perlu mengembalikan phone admin secara manual, pastikan nomor tersebut tidak sedang dipakai customer lain karena `profiles.phone` unik:

```sql
UPDATE public.profiles
SET phone = '<nomor_admin>'
WHERE email = 'admin@bananasbindery.com';
```

Revert phone admin tidak direkomendasikan selama nomor yang sama dipakai untuk checkout customer.
