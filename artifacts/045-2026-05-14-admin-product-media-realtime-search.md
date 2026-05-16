# Admin Product Media, Variant Photo, and Realtime Search

Tanggal: 2026-05-14

## Konteks

Admin mengalami runtime error karena kode sudah membaca kolom `product_variants.image_url`, tetapi kolom tersebut belum ada di Supabase remote.

Permintaan UX:

- Foto produk harus upload-only, bukan input URL manual.
- Produk harus bisa upload lebih dari satu foto.
- Varian produk boleh punya foto sendiri secara optional.
- Search admin produk harus realtime tanpa delay.
- Admin product edit harus lebih jelas soal kategori, foto, status publish, dan varian.

## Keputusan Logic

1. URL tetap disimpan di database, tetapi tidak diekspos sebagai input manual di UI admin.
2. Upload gambar memakai Supabase Storage dari UI, lalu public URL hasil upload dipakai internal untuk payload database.
3. Foto produk utama memakai array `product_images`; foto pertama tetap menjadi thumbnail katalog.
4. Foto varian memakai kolom baru `product_variants.image_url` supaya varian bisa override gallery/detail/cart image.
5. Search admin produk dilakukan client-side terhadap data yang sudah diload server, tanpa debounce dan tanpa request ulang.
6. `products.price` adalah harga jual normal, bukan harga modal.
7. Diskon per produk dikontrol dari `products.promo_price`. Saat produk punya varian, backend otomatis menghitung `product_variants.promo_price` dengan rasio diskon yang sama agar diskon tetap berlaku setelah varian dipilih.

## Perubahan Kode

- Menambahkan uploader reusable `ImageUploadField` dengan mode single/multiple upload dan hidden URL field untuk server action.
- Product form sekarang menampilkan kategori aktif produk, ringkasan publish, status aktif, total stok, multi-photo upload, dan optional variant photo upload.
- Product form mengganti label `Harga dasar` menjadi `Harga jual normal` dan menambahkan kontrol `Harga promo produk`.
- Product catalog admin sekarang memakai client component untuk realtime search berdasarkan nama, deskripsi, slug, kategori, dan nama varian.
- Product catalog admin menampilkan badge promo, harga promo, dan harga normal tercoret ketika diskon aktif.
- Banner dan category image edit dibuat upload-only; input URL manual dihilangkan dari UI.
- Opsi tipe banner disesuaikan dengan constraint DB: `hero`, `promo`, `category`.
- Product detail storefront memakai foto varian sebagai gallery image pertama saat varian dipilih.
- Cart item memakai foto varian jika tersedia.
- Variant selector storefront menampilkan thumbnail foto varian bila ada.
- Admin order query diperbaiki dari `profiles.full_name` ke `profiles.name` agar cocok dengan skema remote.

## Perubahan Supabase

Migration lokal:

- `supabase/migrations/20260514150533_add_product_variant_image_url.sql`

DDL yang sudah diterapkan ke Supabase remote via MCP:

- `ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;`
- Membuat/memastikan bucket public:
  - `product-images`
  - `categories`
  - `banners`
- Membuat policy `storage_admin_upload_product_media` untuk role `admin`, `owner`, dan `staff` agar bisa upload ke bucket media admin.

Verifikasi MCP:

- `product_variants.image_url` ada sebagai nullable `text`.
- Bucket `product-images`, `categories`, dan `banners` ada dan public.
- Policy `storage_admin_upload_product_media` aktif untuk `INSERT`.

## Validasi

Berhasil:

- `pnpm --filter @bananasbindery/web type-check`
- `pnpm --filter @bananasbindery/web lint`
- `pnpm --filter @bananasbindery/web build`

Build Next.js berhasil membuat 40 halaman.

## Supabase Advisors

Advisors dijalankan setelah DDL.

Temuan yang relevan dicatat sebagai follow-up, bukan blocker perubahan ini:

- Beberapa function public masih memiliki mutable `search_path`.
- Beberapa `SECURITY DEFINER` function masih executable oleh `anon`/`authenticated`.
- Public storage bucket memakai broad SELECT policy `storage_public_read`, termasuk bucket baru `product-images`. Ini memungkinkan listing file bucket, walau public object URL tetap bisa dipakai tanpa broad listing policy.
- Banyak foreign key lama belum punya covering index, termasuk `product_variants.product_id` dan `product_images.product_id`.

Rekomendasi follow-up:

1. Hardening storage policy: ubah public-read listing policy menjadi akses yang tidak mengizinkan listing bucket luas.
2. Tambahkan index untuk FK yang dipakai query katalog/admin, minimal `product_variants.product_id` dan `product_images.product_id`.
3. Audit `SECURITY DEFINER` function dan set `search_path` eksplisit.

## Status

Runtime error `column product_variants_1.image_url does not exist` sudah ditangani di remote database.

Admin product media flow sekarang upload-only, mendukung multi-photo produk, optional variant photo, kategori lebih eksplisit, dan search katalog admin realtime.
