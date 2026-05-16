# 042 — React Key Fix, Home Section Order, Real Binder Photos, Admin Email/Password Login

Tanggal: 2026-05-14
Status: Completed
Scope: fix warning React key, urutan section home, ganti foto hewan dengan foto binder asli dari `assets/`, dan credential login admin email/password (tanpa OTP).

## Konteks

Lanjutan artifact 040–041. User melaporkan:

- Console warning "Each child in a list should have a unique key prop" di `ShopLayout`.
- Foto hewan (kelinci) masih muncul di home — ternyata file statis di `apps/web/public/images/products/*.jpg` isinya foto hewan walau namanya `binder-*`.
- Section "Semua Produk" harus selalu jadi section TERAKHIR di home (koreksi urutan dari artifact 041).
- Minta credential login admin pakai email + password, tanpa OTP.

## Apa yang diubah

### 1. Fix React key warning

File:

- `apps/web/app/(shop)/layout.tsx` — hapus `key` eksplisit yang tidak perlu pada elemen statis non-list (`mobile-header-group`, `mobile-bg-blob`, `mobile-header-wrapper`, `main-view-container`, `desktop-spacer`, `mobile-nav-group`). Key pada child statis (bukan hasil `.map`) memicu React menganggapnya list.

Alasan: key hanya untuk elemen hasil iterasi. Key sisa dari fix lama justru jadi sumber warning. Semua `.map` di komponen yang dirender ShopLayout (header, footer, desktop-nav, bottom-nav, home) sudah punya key valid.

### 2. Urutan section home dikoreksi

File:

- `apps/web/app/(shop)/page.tsx` — urutan section bawah: **banner admin → Best Seller → Semua Produk (terakhir)**. Sebelumnya (artifact 041) Semua Produk di atas banner. "Semua Produk" tetap dibatasi 4 produk.

Alasan: instruksi eksplisit user — Semua Produk selalu section terakhir.

### 3. Foto hewan diganti foto binder asli

File (diganti isinya, nama tetap):

- `apps/web/public/images/products/binder-bundling-01.jpg` ← `assets/Binder Bundling/IMG_0024.JPG`
- `apps/web/public/images/products/binder-butterfly-violet-01.jpg` ← `assets/Binder Butterfly Violet/1.JPG`
- `apps/web/public/images/products/binder-custom-nama-01.jpg` ← `assets/Binder Custom Nama/Pilihan Jenis Font.zip - 1.jpg`
- `apps/web/public/images/products/binder-denim-pink-blue-01.jpg` ← `assets/Binder Denim Pink & Blue/1.jpg`
- `apps/web/public/images/products/binder-rose-blossom-01.jpg` ← `assets/Binder Rose Blossom/Rose Padlock.zip - 1.jpg`
- `apps/web/public/images/products/binder-slotphone-01.jpg` ← `assets/Binder Slotphone/1.JPG`

Semua di-resize max 1200px + kompres JPEG q80 via `sips` (dari 4–10MB → 230–410KB).

Alasan: tabel `product_images` di DB semua menunjuk ke path statis `/images/products/binder-*.jpg`, dan hero banner di `page.tsx` juga. Mengganti file statis = fix foto hewan di home + product card + hero sekaligus, tanpa perlu Docker/Storage upload. Untuk update foto ke depan, admin pakai fitur upload `ImageUploadField` (artifact 041).

### 4. Login admin email/password (tanpa OTP)

File baru:

- `apps/web/app/(auth)/admin-login/page.tsx` — halaman `/admin-login`, form email + password, `supabase.auth.signInWithPassword`. Setelah sukses cek `profiles.role` ∈ {admin, owner, staff}; kalau bukan admin → signOut + tolak. Diletakkan di group `(auth)` supaya TIDAK kena guard layout admin (hindari redirect loop).

File diubah:

- `apps/web/app/admin/layout.tsx` — redirect user belum login: `/login` → `/admin-login`.

Credential dibuat langsung di Supabase (via MCP `execute_sql`, insert `auth.users` + `auth.identities`, profile role `owner`):

- **Email**: `admin@bananasbindery.com`
- **Password**: `BananaAdmin2026!`
- Email sudah confirmed. **Disarankan ganti password setelah login pertama.**

Alasan: login customer tetap OTP/phone; admin dapat jalur khusus email+password sesuai permintaan.

## Yang TIDAK diubah

- Login customer (OTP phone) di `/login` — tidak disentuh.
- Hero carousel 3D, section atas home.
- Tidak ada migration schema (hanya insert data user).
- Tidak commit/push.

## Catatan

- Docker tidak diperlukan untuk fix foto home — file statis cukup diganti langsung. Upload ke Supabase Storage tetap tersedia lewat `ImageUploadField` di admin (bucket `product-images`/`banners`).
- Banner home masih perlu RLS public read di tabel `banners` agar tampil untuk anon.

## Validasi

- `pnpm --filter @bananasbindery/web type-check` — PASS.
- `pnpm --filter @bananasbindery/web lint` — PASS.
- `pnpm --filter @bananasbindery/web build` — PASS (40/40 pages, route `/admin-login` ter-build). Catatan: butuh clean `.next` sekali karena cache turbopack/webpack sempat korup.
- Admin user terverifikasi di DB: `admin@bananasbindery.com`, role `owner`, email confirmed.

## Tambahan (revisi sesi sama)

### 5. Banner strip reusable + banner kedua di bawah Best Seller

File baru:

- `apps/web/components/home/home-banner-strip.tsx` — komponen `HomeBannerStrip` reusable. Render banner DB; kalau kosong tampilkan placeholder "Slot banner" supaya layout tetap kelihatan.

File diubah:

- `apps/web/app/(shop)/page.tsx` — banner inline diganti `<HomeBannerStrip>`; ditambah instance kedua di bawah Best Seller. Urutan akhir: Banner Promo → Best Seller → Banner Pilihan → Semua Produk.

Alasan: user minta banner juga muncul di bawah Best Seller dan bisa lihat preview-nya walau tabel `banners` masih kosong. Satu komponen dipakai 2x — tidak ada kode dobel.

### 6. Banner desktop pakai foto produk sendiri

File diubah:

- `apps/web/components/home/desktop-banner-slider.tsx` — hapus array gambar Unsplash hardcoded; `Banner` interface tambah field `image`; slider pakai `banner.image` (foto binder dari `BANNERS` di `page.tsx`).

Alasan: desktop banner slider sebelumnya masih pakai foto Unsplash, bukan produk binder.

### 7. Banner strip: default banner + design asimetris slideable

File:

- `apps/web/components/home/home-banner-strip.tsx`
  - Hapus placeholder kosong "Slot banner". Sekarang kalau tabel `banners` kosong, pakai `DEFAULT_BANNERS` (3 banner dari foto binder asli di `/images/products/`).
  - Card banner: `w-[300px]` mobile / `w-[400px]` desktop, slideable horizontal (`overflow-x-auto` + scroll snap).
  - Border radius asimetris (petal) `40px 12px 40px 12px`, berganti arah tiap card (selang-seling) — konsisten dengan promo card di home.

Alasan: user tidak mau placeholder kosong, mau banner langsung tampil dari foto assets, slideable, dengan design asimetris.

## Catatan revert

1. Key fix: restore `apps/web/app/(shop)/layout.tsx`.
2. Urutan home: restore blok section di `apps/web/app/(shop)/page.tsx`.
3. Foto: file lama (foto hewan) tidak dibackup — ambil ulang dari git history `apps/web/public/images/products/` bila perlu.
4. Admin login: hapus `apps/web/app/(auth)/admin-login/page.tsx`, kembalikan redirect `/login` di `admin/layout.tsx`. Hapus user: `delete from auth.users where email='admin@bananasbindery.com';`.
