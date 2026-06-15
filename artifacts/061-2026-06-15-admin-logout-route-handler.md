# Admin Logout Route Handler Fix

Tanggal: 2026-06-15

## Masalah

- Admin logout gagal dengan error Next.js: `Server Action "...hash..." was not found on the server`.
- Penyebabnya tombol logout admin memakai inline Server Action di `apps/web/app/admin/layout.tsx`.
- Setelah deploy, tab admin lama dapat menyimpan action hash dari deployment sebelumnya sehingga submit logout memanggil action yang sudah tidak ada.

## Perubahan

- `apps/web/app/admin/layout.tsx`
  - Menghapus inline Server Action `logoutAdmin`.
  - Mengubah form logout menjadi `POST /admin/logout`.

- `apps/web/app/admin/logout/route.ts`
  - Menambah route handler logout.
  - Memanggil `supabase.auth.signOut()` lewat server client.
  - Redirect ke `/admin-login` dengan status `303`.
  - Menyediakan `GET` fallback untuk navigasi/manual open.

## Alasan Teknis

- Route handler memiliki URL stabil dan tidak bergantung pada Server Action hash.
- Logout tetap server-side, cookie Supabase tetap dibersihkan dari response.
- Scope perubahan hanya admin logout, tidak menyentuh checkout, OTP, order, payment, shipping, atau pricing.

## Validasi

- `pnpm exec eslint apps/web/app/admin/layout.tsx apps/web/app/admin/logout/route.ts` sukses.
- `pnpm --filter @bananasbindery/web build` sukses dan route `/admin/logout` muncul sebagai route dynamic.
- `pnpm --filter @bananasbindery/web type-check` sukses setelah build selesai.

## Cara Test

1. Setelah deploy selesai, refresh halaman admin sekali.
2. Klik `Keluar`.
3. Browser harus redirect ke `/admin-login`.
4. Buka `/admin`; jika session sudah bersih harus tetap diarahkan ke `/admin-login`.
