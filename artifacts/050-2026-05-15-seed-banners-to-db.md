# Seed Banner ke DB — Admin Banner View Tidak Lagi Kosong

Tanggal: 2026-05-15

## Masalah

User: "kita udah ada banner, kenapa di `/admin/promos` seolah tidak ada banner aktif?"

Penyebab: banner yang tampil di home **hardcoded di kode**, tabel `banners` di DB **0 row**:

- 4 hero banner = `const BANNERS` di `apps/web/app/(shop)/page.tsx` (carousel hero).
- 3 banner strip = `DEFAULT_BANNERS` fallback di `apps/web/components/home/home-banner-strip.tsx`.

Karena `getActiveBanners()` baca tabel `banners` yang kosong → admin `/admin/promos` menampilkan "Belum ada banner".

## Perubahan

### Data (Supabase via MCP, `INSERT INTO banners`)

Seed 7 banner ke tabel `banners` (semua `is_active = true`):

- 4 `type='hero'` (priority 0-3): Diskon hingga 50%, Koleksi Binder Aesthetic, Paket Pelajar Ceria, Desain Binder Sendiri.
- 3 `type='promo'` (priority 0-2): Koleksi Binder Aesthetic, Custom Nama Binder Sendiri, Paket Bundling Hemat.
- `image_url` dipakai path foto binder yang sama dengan hardcoded (`/images/products/binder-*.jpg`), `link` sesuai const lama.

Sekarang `/admin/promos` menampilkan ke-7 banner — bisa di-edit (judul, gambar, link, priority, jadwal, status aktif).

### Kode

- `apps/web/app/(shop)/page.tsx`: `dbBanners` query sekarang `getActiveBanners('promo')` (sebelumnya tanpa filter). `HomeBannerStrip` hanya menampilkan banner `type='promo'` — tanpa filter ini strip akan ikut menampilkan 4 hero banner setelah seeding.

## Catatan / Batasan

- **Hero carousel di home masih pakai `const BANNERS` hardcoded**, BUKAN DB. Alasan: tabel `banners` tidak punya kolom `tag`, `desc`, `cta`, `bg`, `accent` yang dipakai desain hero. Mewire hero ke DB = perlu tambah kolom + ubah desain → tidak dilakukan tanpa diminta.
- Akibatnya: 4 baris `type='hero'` di DB saat ini editable di admin TAPI belum dipakai render home. Follow-up kalau user mau hero fully editable: tambah kolom rich content ke `banners` + rewire `page.tsx`.
- `HomeBannerStrip` `DEFAULT_BANNERS` tetap ada sebagai fallback kalau admin menonaktifkan semua banner promo.

## Validasi

- `pnpm --filter @bananasbindery/web type-check` → PASS
- MCP: 7 row ter-insert, dikonfirmasi via `returning`.

## Catatan Revert

- `DELETE FROM banners WHERE created_at::date = '2026-05-15';` (atau by id ke-7 row).
- `page.tsx`: kembalikan `getActiveBanners()` tanpa argumen + queryKey `['home-banners']`.
