# 040 — Admin Categories, Fonnte WhatsApp Client, Admin Role Guard

Tanggal: 2026-05-14
Status: Completed
Scope: melengkapi admin agar bisa edit kategori, menambah Fonnte WhatsApp client + endpoint test, dan memulihkan role guard layout admin.

## Konteks

User meminta project diselesaikan: halaman admin harus bisa bebas mengelola kategori, promo, product, dan banner sesuai `PRD.md`. Promo (voucher), banner, dan product sudah ada dari artifact 034. Yang belum: **kategori** tidak punya halaman/aksi admin. Selain itu env Fonnte sudah disiapkan tapi belum pernah ditest dan belum ada kode integrasinya. Role guard di `admin/layout.tsx` juga hilang (regresi dari artifact 034) saat recovery build.

## Apa yang diubah

### 1. Fonnte WhatsApp client (reusable, anti duplikasi)

File baru:

- `packages/api-client/src/fonnte.ts`
  - `sendWhatsAppMessage(apiKey, { target, message })` — wrapper `POST https://api.fonnte.com/send`.
  - `checkFonnteDevice(apiKey)` — wrapper `POST https://api.fonnte.com/device` untuk verifikasi token + status device.
  - `normalizePhone()` internal — normalisasi nomor `08xx`/`8xx` → `62xx`.
  - Tipe eksplisit `FonnteSendParams`, `FonnteSendResult`, `FonnteDeviceResult`. Tanpa `any`.

File diubah:

- `packages/api-client/package.json` — tambah export `./fonnte` dan `typesVersions` `fonnte`.

Alasan:

- Sesuai Monorepo Integrity Mandate: panggilan 3rd party API wajib dibungkus `@bananasbindery/api-client`, tidak boleh dipanggil langsung di page/component.
- Client menerima `apiKey` sebagai parameter (bukan baca global) supaya portable untuk web & mobile.

### 2. Endpoint test Fonnte

File baru:

- `apps/web/app/api/test/fonnte/route.ts`
  - `GET /api/test/fonnte` — cek device/token Fonnte (verifikasi token valid + WA online).
  - `POST /api/test/fonnte` — kirim pesan test, body `{ target, message? }`.
  - Keduanya di-guard `admin/owner/staff` via Supabase `profiles.role`.
  - Guard 503 jika `FONNTE_API_KEY` belum ada di environment.
  - Mengimpor `sendWhatsAppMessage` & `checkFonnteDevice` dari package — tidak ada duplikasi logika.

Alasan:

- User butuh memverifikasi token Fonnte (`GC6y5rVwNxZ4QGUwKN6X`) sebelum dipakai produksi tanpa menulis kode sekali pakai.

### 3. Admin kategori

File baru:

- `apps/web/app/admin/categories/page.tsx` — list + inline edit kategori, form kategori baru. Mengikuti pola styling `admin/promos/page.tsx`.

File diubah:

- `apps/web/app/admin/actions.ts`
  - Tambah tipe `CategoryUpdate`/`CategoryInsert`.
  - Tambah server action `saveCategory` (create/update: name, slug, description, image_url, parent_id, sort_order, is_active) — slug otomatis dari nama jika kosong, guard self-parent.
  - Tambah server action `toggleCategoryStatus`.
  - Semua action tetap `requireAdmin()` lebih dulu, dan `revalidatePath` terkait.

Alasan:

- Kebutuhan eksplisit user: admin bisa bebas edit kategori. Skema `categories` sudah ada di Supabase (5 rows), tidak perlu migration.

### 4. Restore role guard layout admin

File diubah:

- `apps/web/app/admin/layout.tsx`
  - Layout dijadikan `async`, menambah guard server-side: non-login → `/login`, non-admin → `/`.
  - Menambah menu nav `Categories` (`/admin/categories`) dengan ikon `FolderTree`.
  - Tipe `AdminMenuHref` eksplisit untuk href menu (hapus cast inline lama).

Alasan:

- Admin route harus dilindungi di server boundary, bukan sekadar UI. Guard ini sebelumnya ada (artifact 034) tapi hilang saat recovery build.

## Yang TIDAK diubah

- Tidak mengubah UI customer/shop.
- Tidak ada migration database.
- Tidak commit/push.
- Tidak menyentuh logic pricing/checkout/payment.
- Banner & voucher tidak diubah — sudah berfungsi dari artifact 034.

## Catatan environment

- `FONNTE_API_KEY` harus diset di `.env` monorepo (token: `GC6y5rVwNxZ4QGUwKN6X`). Kode membaca `process.env.FONNTE_API_KEY`; tidak ada token yang di-hardcode. File `.env`/`.env.local` tidak dapat diakses agent karena permission, jadi pengisian dilakukan manual oleh user.

## Validasi

- `pnpm --filter @bananasbindery/api-client type-check` — PASS.
- `pnpm --filter @bananasbindery/web type-check` — PASS.
- `pnpm --filter @bananasbindery/web lint` — PASS.
- `pnpm --filter @bananasbindery/web build` — PASS (route `/admin/categories` & `/api/test/fonnte` ter-build).

## Cara test Fonnte (manual, end-to-end)

1. Pastikan `FONNTE_API_KEY=GC6y5rVwNxZ4QGUwKN6X` ada di `.env`.
2. Jalankan `pnpm --filter @bananasbindery/web dev`, login sebagai admin/owner.
3. Verifikasi token: `GET http://localhost:3000/api/test/fonnte` → harus `{ success: true, device: {...} }`.
4. Kirim test: `POST http://localhost:3000/api/test/fonnte` body `{"target":"08xxxxxxxxxx"}` → cek WhatsApp tujuan.

## Catatan revert

1. Fonnte: hapus `packages/api-client/src/fonnte.ts`, hapus export `./fonnte` di `packages/api-client/package.json`, hapus `apps/web/app/api/test/fonnte/`.
2. Kategori: hapus `apps/web/app/admin/categories/`, hapus `saveCategory`/`toggleCategoryStatus` + tipe `Category*` di `apps/web/app/admin/actions.ts`.
3. Guard layout: restore `apps/web/app/admin/layout.tsx` ke versi non-async sebelumnya.

## Next yang disarankan

- Wire `sendWhatsAppMessage` ke event order (paid/shipped) lewat webhook payment + `updateOrderStatus` action — pakai client yang sama, tanpa duplikasi.
- Image upload Supabase Storage untuk kategori/banner supaya tidak paste URL manual.
- Hardening Supabase advisor (lihat cek Supabase: `function_search_path`, `REVOKE EXECUTE` SECURITY DEFINER, RLS initplan).
