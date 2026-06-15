# Admin Password Reset

Tanggal: 2026-06-15

## Masalah

- Admin tidak bisa login setelah perbaikan pemisahan akun admin/customer.
- Penyebab paling mungkin: sebelum guard OTP protected role diterapkan, helper custom OTP sempat memanggil `auth.admin.updateUserById` pada user admin dan mengganti password admin dengan password sementara yang tidak diketahui.

## Perubahan Production

- Password Supabase Auth untuk `admin@bananasbindery.com` di-reset via Supabase Admin API (`auth.admin.updateUserById`).
- Metadata admin dipertahankan:
  - `profiles.name = Admin`
  - `profiles.role = admin`
  - `profiles.phone = NULL`
  - `auth.users.phone = NULL`
  - `raw_user_meta_data.full_name = Admin`
  - `raw_user_meta_data.auth_channel = admin`

## Alasan Teknis

- Password lama tidak bisa dibaca kembali dari Supabase karena tersimpan sebagai hash.
- Reset via Admin API adalah jalur resmi Supabase untuk mengganti password user tanpa mengubah struktur database.
- Tidak ada perubahan kode dan tidak ada perubahan flow customer/admin UI.

## Validasi

- Login test via `supabase.auth.signInWithPassword` berhasil untuk `admin@bananasbindery.com`.
- Query MCP mengembalikan:
  - `role = admin`
  - `name = Admin`
  - `phone = NULL`
  - `auth_phone = NULL`
  - `auth_channel = admin`
  - `has_password = true`

## Catatan Keamanan

- Password sementara tidak ditulis ke artifact atau source control.
- Setelah admin berhasil masuk, password sebaiknya diganti lagi melalui Supabase Dashboard/Auth admin bila ingin credential permanen baru.

## Cara Revert

- Tidak ada migration atau code change untuk direvert.
- Jika password perlu diganti lagi, ulangi reset melalui Supabase Dashboard atau Supabase Admin API untuk user `admin@bananasbindery.com`.
