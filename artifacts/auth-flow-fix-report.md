# Auth Flow Fix Report

**Tanggal:** 2026-05-04

## Ringkasan

Perbaikan menyeluruh pada auth flow: login gate, lazy registration via checkout, inline OTP di register page, dan fix trigger database.

---

## Perubahan yang Dilakukan

### 1. `apps/web/components/layout/header.tsx`

**Apa:** `console.error` → `console.warn` pada geolocation error handler
**Di mana:** Line ~164
**Mengapa:** `console.error` memicu Next.js dev error overlay yang mengganggu tampilan. Geolocation unavailability bukan error fatal, cukup log sebagai warning.

### 2. `supabase/migrations/20260504000002_fix_handle_new_user_phone.sql` (BARU)

**Apa:** Update `handle_new_user()` trigger untuk menyimpan `NEW.phone` ke `profiles`
**Di mana:** `public.handle_new_user` PostgreSQL function
**Mengapa:** Trigger lama hanya menyimpan `id, name, email, avatar_url, role` — field `phone` tidak disimpan. Akibatnya `check-phone` API selalu return `exists: false` meski user sudah terdaftar via checkout OTP.

### 3. `apps/web/app/api/auth/check-phone/route.ts` (BARU)

**Apa:** Server-side API endpoint untuk cek apakah nomor HP sudah terdaftar di `profiles`
**Di mana:** `apps/web/app/api/auth/check-phone/route.ts`
**Mengapa:** Perlu server-side check menggunakan `SUPABASE_SERVICE_ROLE_KEY` agar bisa query table `profiles` tanpa tergantung session user. Return `{ exists: boolean }` — tidak expose data user.

### 4. `apps/web/components/checkout/address-sheet.tsx`

**Apa:** Di `saveAddress()`, setelah insert ke `addresses`, ditambahkan upsert ke `profiles` untuk mengisi `phone` dan `name`
**Di mana:** Function `saveAddress()`, setelah `supabase.from('addresses').insert(...)`
**Mengapa:** User yang register via checkout (lazy registration) perlu `profiles.phone` terisi agar bisa login di kemudian hari. Trigger `handle_new_user` menyimpan phone dari `auth.users` saat OTP verified, tapi ini sebagai fallback eksplisit.

### 5. `apps/web/app/(auth)/login/page.tsx`

**Apa:** Tambah phone-check sebelum `signInWithOtp`, dan tambah link "Daftar sekarang"
**Di mana:** Function `handleSendOtp()` + JSX phone step
**Mengapa:** Login page sebelumnya mengirim OTP ke semua nomor HP tanpa cek apakah sudah terdaftar. Sekarang:

- Cek `check-phone` API dulu
- Jika `exists: false` → redirect ke `/register?phone=...&next=...` (tanpa toast, nomor HP pre-fill)
- Jika `exists: true` → lanjut kirim OTP
- Tambah link "Belum punya akun? Daftar sekarang" di bawah form

### 6. `apps/web/app/(auth)/register/page.tsx`

**Apa:** Ubah dari single-step (form → redirect ke `/login` untuk OTP) menjadi 2-step inline (form → OTP di halaman yang sama)
**Di mana:** Seluruh file di-rewrite
**Mengapa:** Flow lama sangat ribet — user isi form register → redirect ke login → input OTP. Sekarang:

- Step 1: form nama + nomor HP + email (opsional)
- Step 2: input OTP 6 digit di halaman yang sama
- Setelah `verifyOtp()` berhasil → auto login → `router.push(next)` langsung tanpa mampir ke `/login`
- Pre-fill nomor HP dari `searchParams.get('phone')` jika redirect dari login page

---

## Auth Flow Setelah Fix

```
Guest browse → Checkout → AddressSheet
  → isi nama + HP + alamat → klik "Simpan & Verifikasi"
  → OTP → verifyOtp() → saveAddress() → profiles.phone terupdate
  → auto login ✅

/login → masukkan HP
  → check-phone API
  ├── EXISTS → kirim OTP → verifyOtp() → login ✅
  └── NOT EXISTS → redirect /register?phone=...&next=... ✅

/register → isi nama + HP
  → Step 2: OTP inline
  → verifyOtp() → auto login → redirect ke next ✅
```

---

## Migration yang Di-push ke Remote

- `20260504000002_fix_handle_new_user_phone.sql` — applied ✅
