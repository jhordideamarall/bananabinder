# 041 — Fonnte Env Fix, Bottom Nav Color, Home Revamp, Admin Image Upload

Tanggal: 2026-05-14
Status: Completed
Scope: fix sementara — koreksi nama env Fonnte, ganti warna active bottom nav, restruktur section home (4 produk → banner → best seller), dan upload foto via Supabase Storage di admin.

## Konteks

Lanjutan dari artifact 040. User klarifikasi:

- Env Fonnte di `.env` bernama `FONNTE_API_TOKEN`, bukan `FONNTE_API_KEY`.
- Active link bottom nav jangan biru → ganti banana yellow `#FFD54C`.
- Home: section "Semua Produk" cukup 4 produk, di bawahnya banner (dari tabel `banners` yang dikelola admin), lalu section "Best Seller" (ranking otomatis `sold_count`).
- Update foto produk/banner lewat upload di halaman admin, bukan tukar file manual.

## Apa yang diubah

### 1. Koreksi nama env Fonnte

File:

- `apps/web/app/api/test/fonnte/route.ts` — `process.env.FONNTE_API_KEY` → `FONNTE_API_TOKEN` (2 tempat + pesan error).
- `packages/config/src/env.ts` — schema `FONNTE_API_KEY` → `FONNTE_API_TOKEN`.

Alasan: nama env aktual di `.env` monorepo adalah `FONNTE_API_TOKEN`. Kode sebelumnya membaca key yang salah sehingga selalu 503.

### 2. Warna active bottom nav

File:

- `apps/web/components/layout/bottom-nav.tsx` — warna ikon/teks active `#7EC8E3` → `#FFD54C`; pill indicator `bg-[#7EC8E3]/10` → `bg-[#FFD54C]/15`.

Alasan: user minta active link tidak biru, ikut tema banana yellow. Hanya bottom nav yang diubah; accent biru interaktif lain (header, product card, dll) tidak disentuh karena tidak diminta.

### 3. Banner storefront dari tabel `banners` (api-client)

File baru:

- `packages/api-client/src/banners.ts` — `getActiveBanners(supabase, type?)`: ambil banner `is_active`, filter jadwal `start_date`/`end_date`, sort `priority`. Tipe `HomeBanner` eksplisit, tanpa `any`.
- `apps/web/lib/services/banner-client.ts` — wrapper browser client (pola sama dengan `product-client.ts`).

File diubah:

- `packages/api-client/package.json` — tambah export `./banners` + `typesVersions`.

Alasan: home butuh banner yang dikelola admin (`/admin/promos`). Logic dibungkus di `@bananasbindery/api-client` sesuai Monorepo Integrity Mandate, reusable untuk web & mobile, tanpa duplikasi.

### 4. Restruktur section home

File:

- `apps/web/app/(shop)/page.tsx`
  - Import `getActiveBanners`/`HomeBanner`.
  - `useQuery(['home-banners'])` untuk banner DB.
  - `bestSellers` = `products` di-sort `soldCount` desc, ambil 4.
  - Section "Semua Produk" dibatasi `products.slice(0, 4)`.
  - Tambah section banner admin (horizontal scroll, dari `dbBanners`) setelah "Semua Produk".
  - Tambah section "Best Seller" setelah banner.

Alasan: urutan section sesuai permintaan user. Hero carousel atas, "Penawaran Terbaik", dan promo strip lama tidak diubah (bukan bagian permintaan).

### 5. Upload foto di admin (Supabase Storage)

File baru:

- `apps/web/components/admin/ImageUploadField.tsx` — komponen client reusable. Upload file ke bucket Storage (`product-images` / `banners`), ambil public URL. Dua mode: callback `onUploaded` (untuk form berbasis state) atau `name` (render text input bernama untuk server action). Satu komponen dipakai dua form — tidak ada kode dobel.

File diubah:

- `apps/web/components/admin/ProductForm.tsx` — tambah `ImageUploadField` (bucket `product-images`, mode `onUploaded` → append ke state `images`). Input URL manual tetap ada sebagai alternatif.
- `apps/web/app/admin/promos/page.tsx` — `BannerForm` ganti input `image_url` polos jadi `ImageUploadField` (bucket `banners`, mode `name="image_url"`). `saveBanner` action tetap memvalidasi `image_url` non-empty.

Alasan: user minta update foto lewat upload di admin biar tidak ribet tukar file manual.

## Yang TIDAK diubah

- Hero carousel 3D + algoritma stacking (CLAUDE.md: preserve).
- Accent biru interaktif di komponen non-nav.
- Logic pricing/checkout/payment.
- Tidak ada migration database. Bucket Storage (`product-images`, `banners`) diasumsikan sudah ada (terlihat di Supabase advisor).
- Tidak commit/push.

## Catatan

- Banner di home butuh policy SELECT publik di tabel `banners` agar tampil untuk anon. Jika tidak tampil, cek RLS `banners`.
- `FONNTE_API_TOKEN` harus ada di `.env` (sudah diisi user).

## Validasi

- `pnpm --filter @bananasbindery/api-client type-check` — PASS.
- `pnpm --filter @bananasbindery/config type-check` — PASS.
- `pnpm --filter @bananasbindery/web type-check` — PASS.
- `pnpm --filter @bananasbindery/web lint` — PASS.
- `pnpm --filter @bananasbindery/web build` — PASS (39/39 pages).

## Catatan revert

1. Fonnte env: kembalikan `FONNTE_API_KEY` di `route.ts` + `env.ts`.
2. Bottom nav: kembalikan `#7EC8E3` di `bottom-nav.tsx`.
3. Banner api-client: hapus `packages/api-client/src/banners.ts`, `apps/web/lib/services/banner-client.ts`, export `./banners` di package.json.
4. Home: restore `apps/web/app/(shop)/page.tsx` (hapus useQuery banner, bestSellers, 2 section baru, kembalikan `products.map`).
5. Image upload: hapus `apps/web/components/admin/ImageUploadField.tsx`, restore input lama di `ProductForm.tsx` dan `promos/page.tsx`.

## Next yang disarankan

- Wire Fonnte (`sendWhatsAppMessage`) ke event order paid/shipped.
- Section home dinamis penuh (tabel `home_sections`) jika nanti perlu admin bikin section bebas.
- Pastikan RLS `banners` punya public read.
