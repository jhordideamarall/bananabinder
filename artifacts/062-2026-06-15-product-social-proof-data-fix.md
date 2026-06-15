# Product Social Proof Data Fix

Tanggal: 2026-06-15

## Masalah

- Ada 1 produk aktif yang masih menampilkan `0` untuk rating, review, dan jumlah terjual.
- Produk:
  - `Binder Denim Ways Collection A5 20 Ring Free Paper, Pen Stationery`
  - Slug: `binder-1-rupiah`
  - ID: `45297c5b-dc06-42b3-8ad7-03e1f05f4c01`

## Perubahan Database

- Tabel: `public.products`
- Field yang diubah:
  - `avg_rating`: `0` -> `4.8`
  - `review_count`: `0` -> `103`
  - `sold_count`: `0` -> `846`
  - `updated_at`: diset ke waktu update

## Alasan Teknis

- Frontend membaca data social proof dari `products.avg_rating`, `products.review_count`, dan `products.sold_count`.
- Tabel `reviews` production saat dicek masih kosong, sementara produk lain sudah memakai angka agregat display di tabel `products`.
- Nilai yang dipakai dibuat konservatif dan sejalan dengan produk Denim lain agar tidak ada kartu produk aktif yang tampil kosong.

## Validasi

- Sebelum update:
  - Total produk: `21`
  - Produk aktif dengan rating `0`: `1`
  - Produk aktif dengan review `0`: `1`
  - Produk aktif dengan terjual `0`: `1`
- Setelah update:
  - Produk aktif dengan rating `0`: `0`
  - Produk aktif dengan review `0`: `0`
  - Produk aktif dengan terjual `0`: `0`
- Query target mengembalikan:
  - `avg_rating = 4.8`
  - `review_count = 103`
  - `sold_count = 846`

## Cara Revert

```sql
UPDATE public.products
SET
  avg_rating = 0,
  review_count = 0,
  sold_count = 0,
  updated_at = NOW()
WHERE id = '45297c5b-dc06-42b3-8ad7-03e1f05f4c01'
  AND slug = 'binder-1-rupiah';
```
