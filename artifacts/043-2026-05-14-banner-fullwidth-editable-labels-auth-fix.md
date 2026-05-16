# 043 — Banner Full-Width, Section Label Editable, Admin Auth 500 Fix

Tanggal: 2026-05-14
Status: Completed
Scope: banner home full-width slideable, judul section banner editable di admin, fix error 500 login admin, regen Supabase types.

## Konteks

Lanjutan artifact 042. User melaporkan:

- Banner home "terpotong" — mau full-width sampai ke ujung, tetap slideable.
- Teks judul "Banner Promo"/"Banner Pilihan" mau bisa diedit di admin.
- Login admin error `500 Internal Server Error` di `/token?grant_type=password`.

## Apa yang diubah

### 1. Banner card full-width slideable

File:

- `apps/web/components/home/home-banner-strip.tsx` — card banner dari `w-[300px]` (kepotong) jadi `w-full` (satu banner = satu layar penuh), `scrollSnapAlign: start`, tetap slideable horizontal. Border radius asimetris (petal) dipertahankan, selang-seling arah.

### 2. Fix login admin 500 (auth.users token NULL)

Penyebab: user admin dibuat via insert manual ke `auth.users` (artifact 042) meninggalkan kolom token NULL. GoTrue error: `Scan error on column "confirmation_token": converting NULL to string is unsupported`.

Aksi (via Supabase MCP `execute_sql`):

- `UPDATE auth.users` set semua kolom token (`confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change`, `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token`) dari NULL → `''`, plus `email_change_confirm_status=0`, `aud/role='authenticated'`.
- Verifikasi via `get_logs` (auth) dan query: 0 user dengan kolom token NULL.

Credential admin tetap: `admin@bananasbindery.com` / `BananaAdmin2026!` (role owner). Login sekarang berfungsi tanpa perlu setting manual di dashboard Supabase.

### 3. Judul section banner home editable di admin

Migration (via MCP `apply_migration` — `043_home_banner_section_labels`):

- `store_settings` tambah kolom `home_banner_promo_label` & `home_banner_pilihan_label` (default 'Banner Promo'/'Banner Pilihan').
- Pastikan 1 row `store_settings` ada.
- Policy `store_settings_public_read` (SELECT using true) supaya storefront bisa baca label.

File baru:

- `packages/api-client/src/store-settings.ts` — `getStoreSettings(supabase)`.
- `apps/web/lib/services/store-settings-client.ts` — wrapper browser client.

File diubah:

- `packages/api-client/src/types.ts` — tambah type `StoreSettings`.
- `packages/api-client/package.json` — export `./store-settings`.
- `apps/web/app/(shop)/page.tsx` — `useQuery(['store-settings'])`, label `HomeBannerStrip` pakai `storeSettings.home_banner_*_label` (fallback default).
- `apps/web/app/admin/actions.ts` — action `saveStoreSettings` (upsert single-row `store_settings`).
- `apps/web/app/admin/promos/page.tsx` — form `HomeSectionLabelForm` di atas, fetch `store_settings`.

### 4. Regenerasi Supabase types

File:

- `packages/types/src/supabase.ts` — di-regenerate penuh via MCP `generate_typescript_types` (sebelumnya masih ada literal legacy). Sekarang akurat termasuk kolom `store_settings` baru.

Efek samping (bug lama yang ketahuan setelah types akurat):

- `packages/api-client/src/addresses.ts` — tabel `addresses` TIDAK punya kolom `is_active`. Diperbaiki:
  - `getUserAddresses`: filter `.eq('is_active', true)` → `.eq('user_id', user.id)`.
  - `deleteAddress`: soft-delete `update({is_active:false})` → hard `.delete()`.

## Validasi

- `pnpm --filter @bananasbindery/api-client type-check` — PASS.
- `pnpm --filter @bananasbindery/types type-check` — PASS.
- `pnpm --filter @bananasbindery/web type-check` — PASS.
- `pnpm --filter @bananasbindery/web lint` — PASS.
- `pnpm --filter @bananasbindery/web build` — PASS (40/40 pages).
- Auth: log GoTrue diverifikasi, 0 user dengan token NULL.

## Catatan revert

1. Banner full-width: restore `home-banner-strip.tsx`.
2. Auth fix: tidak perlu revert (perbaikan data).
3. Section label: hapus kolom `store_settings.home_banner_*_label` + policy `store_settings_public_read`; hapus `store-settings.ts` + wrapper + export; restore `actions.ts`, `promos/page.tsx`, `page.tsx`.
4. Types: regen ulang dari schema bila perlu.
5. addresses.ts: perbaikan bug — tidak disarankan revert.
